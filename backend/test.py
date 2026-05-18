import requests

tests = {
    "SQL Injection": """
def get_user(user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    cursor.execute(query)
""",
    "Command Injection": """
import os
def run_cmd(user_input):
    os.system("ls " + user_input)
""",
    "XSS": """
def show_profile(user_input):
    return f"<h1>Hello {user_input}</h1>"
""",
    "Hardcoded Password": """
def connect():
    password = "admin123"
    db.connect(password)
""",
    "Weak Crypto": """
import hashlib
def hash_password(pwd):
    return hashlib.md5(pwd.encode()).hexdigest()
""",
    "Path Traversal": """
def read_file(filename):
    return open("../files/" + filename).read()
"""
}

print("="*50)
for vuln_type, code in tests.items():
    response = requests.post(
        "http://127.0.0.1:7860/scan",
        json={"code": code}
    )
    result = response.json()
    vulns = [r for r in result['scan_results'] if r['label'] == 0]
    status = "✅ DETECTED" if vulns else "❌ MISSED"
    print(f"{vuln_type}: {status}")
print("="*50)