import requests
import json

url = "http://127.0.0.1:7860/scan"
payload = {
    "code": """
import os
import requests
import hashlib

def process(user_input):
    # SQLi
    query = "SELECT * FROM data WHERE id = " + user_input
    # Cmd Injection
    os.system("ls " + user_input)
    # Weak Crypto
    h = hashlib.md5(user_input.encode()).hexdigest()
    # SSRF
    resp = requests.get(user_input)
    # XSS
    return f"<div>{user_input}</div>"
"""
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
