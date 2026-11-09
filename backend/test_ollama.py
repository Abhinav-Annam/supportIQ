import requests

url = "http://localhost:11434/api/chat"

payload = {
    "model": "llama3.2:3b",
    "messages": [
        {
            "role": "user",
            "content": "Introduce yourself as SupportIQ AI."
        }
    ],
    "stream": False
}

response = requests.post(url, json=payload, timeout=120)

print(response.json()["message"]["content"])