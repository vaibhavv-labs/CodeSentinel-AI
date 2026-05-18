import requests

url = "http://127.0.0.1:7860/fix"

xss_code = """
@app.route('/hello')
def hello():
    name = request.args.get('name')
    return f"<h1>Hello {name}</h1>"
"""

payload = {
    "code": xss_code,
    "scan_results": [
        {
            "label": 0,
            "label_name": "VULNERABLE (XSS)",
            "line_number": 5
        }
    ]
}

try:
    res = requests.post(url, json=payload)
    print("Status Code:", res.status_code)
    print("Response:", res.json())
except Exception as e:
    print("Error:", e)
