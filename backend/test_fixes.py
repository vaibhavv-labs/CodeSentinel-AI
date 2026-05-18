import sys
sys.path.insert(0, '.')
from app import _apply_deterministic_fixes

tests = [
    {
        "name": "JS SQL Injection",
        "code": """app.post('/login', (req, res) => {
    const query = "SELECT * FROM users WHERE username = '" + req.body.username + "' AND password = '" + req.body.password + "'";
    db.execute(query);
});""",
        "issues": [
            {"label": 0, "label_name": "VULNERABLE (SQLi)", "line_number": 2},
            {"label": 0, "label_name": "VULNERABLE (SQLi)", "line_number": 3},
        ]
    },
    {
        "name": "JS XSS",
        "code": """app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send("<h1>Search results for: " + query + "</h1>");
});""",
        "issues": [
            {"label": 0, "label_name": "VULNERABLE (XSS)", "line_number": 3},
        ]
    },
    {
        "name": "JS Path Traversal",
        "code": """app.get('/download', (req, res) => {
    const filePath = "/var/www/uploads/" + req.query.path;
    const file = fs.readFileSync(filePath);
    res.send(file);
});""",
        "issues": [
            {"label": 0, "label_name": "VULNERABLE (PathTraversal)", "line_number": 2},
        ]
    },
    {
        "name": "Python Path Traversal",
        "code": """@app.route('/download')
def download_file():
    user_file = request.args.get('file')
    with open("/var/www/data/" + user_file, 'r') as f:
        return f.read()""",
        "issues": [
            {"label": 0, "label_name": "VULNERABLE (PathTraversal)", "line_number": 4},
        ]
    },
    {
        "name": "Python Hardcoded Passwords",
        "code": """def connect_to_database():
    db_password = "my_super_secret_password_123"
    api_key = "sk_live_123456789"
    connect(user="admin", password=db_password, token=api_key)""",
        "issues": [
            {"label": 0, "label_name": "VULNERABLE (Insecure)", "line_number": 2},
            {"label": 0, "label_name": "VULNERABLE (Insecure)", "line_number": 3},
        ]
    },
]

for t in tests:
    result = _apply_deterministic_fixes(t["code"], t["issues"])
    changed = result.strip() != t["code"].strip()
    print(f"[{'PASS' if changed else 'FAIL'}] {t['name']}")
    if not changed:
        print(f"  INPUT:  {t['code'].splitlines()[t['issues'][0]['line_number']-1].strip()}")
        print(f"  OUTPUT: {result.splitlines()[min(t['issues'][0]['line_number']-1, len(result.splitlines())-1)].strip()}")
    else:
        print(f"  Fixed output (first vuln line):")
        out_lines = result.splitlines()
        ln = t['issues'][0]['line_number'] - 1
        for i in range(max(0,ln-1), min(len(out_lines), ln+3)):
            print(f"    {out_lines[i]}")
    print()
