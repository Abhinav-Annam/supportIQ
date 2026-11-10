
import json
import os

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import Response

app = FastAPI(title="SupportIQ Ollama Secure Proxy")

PROXY_TOKEN = os.environ.get("OLLAMA_PROXY_TOKEN")
OLLAMA_URL = "http://127.0.0.1:11434"

ALLOWED_CHAT_MODEL = "llama3.2:1b"
ALLOWED_EMBEDDING_MODEL = "nomic-embed-text"

MAX_REQUEST_SIZE = 2 * 1024 * 1024  # 2 MB

if not PROXY_TOKEN or len(PROXY_TOKEN) < 32:
    raise RuntimeError(
        "A secure OLLAMA_PROXY_TOKEN of at least 32 characters is required"
    )


def verify_token(authorization: str | None):
    if authorization != f"Bearer {PROXY_TOKEN}":
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )


async def read_json_request(request: Request):
    content_length = request.headers.get("content-length")

    if content_length:
        try:
            if int(content_length) > MAX_REQUEST_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail="Request body is too large"
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid Content-Length"
            )

    body = await request.body()

    if len(body) > MAX_REQUEST_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Request body is too large"
        )

    try:
        payload = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON request"
        )

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Request must be a JSON object"
        )

    return payload


async def forward_request(endpoint: str, payload: dict):
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            result = await client.post(
                f"{OLLAMA_URL}{endpoint}",
                json=payload
            )

        return Response(
            content=result.content,
            status_code=result.status_code,
            media_type=result.headers.get(
                "content-type",
                "application/json"
            )
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Ollama request timed out"
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the local Ollama server"
        )


@app.get("/health")
async def health():
    return {"status": "proxy_running"}


@app.get("/api/tags")
async def tags(
    authorization: str | None = Header(default=None)
):
    verify_token(authorization)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            result = await client.get(f"{OLLAMA_URL}/api/tags")

        return Response(
            content=result.content,
            status_code=result.status_code,
            media_type="application/json"
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the local Ollama server"
        )


@app.post("/api/chat")
async def chat(
    request: Request,
    authorization: str | None = Header(default=None)
):
    verify_token(authorization)

    payload = await read_json_request(request)

    if payload.get("model") != ALLOWED_CHAT_MODEL:
        raise HTTPException(
            status_code=403,
            detail=f"Only {ALLOWED_CHAT_MODEL} is allowed for chat"
        )

    if not isinstance(payload.get("messages"), list):
        raise HTTPException(
            status_code=400,
            detail="A messages array is required"
        )

    return await forward_request("/api/chat", payload)


@app.post("/api/embed")
async def embed(
    request: Request,
    authorization: str | None = Header(default=None)
):
    verify_token(authorization)

    payload = await read_json_request(request)

    if payload.get("model") != ALLOWED_EMBEDDING_MODEL:
        raise HTTPException(
            status_code=403,
            detail=f"Only {ALLOWED_EMBEDDING_MODEL} is allowed for embeddings"
        )

    if not isinstance(payload.get("input"), (str, list)):
        raise HTTPException(
            status_code=400,
            detail="An input string or array is required"
        )

    return await forward_request("/api/embed", payload)
