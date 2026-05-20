import os
import re
import requests
import torch

from flask import Flask, request, jsonify
from flask_cors import CORS

from transformers import AutoTokenizer, AutoModelForSequenceClassification
from line_level_detect import detect_lines


app = Flask(__name__)

# Allow requests from anywhere (needed for Vercel frontend)
CORS(app)

@app.route("/")
def home():
    return {"message": "CodeSentinel AI Backend Running Successfully"}


# -------------------------------
# Load GraphCodeBERT security model
# -------------------------------

print("Loading GraphCodeBERT scanner into memory...")


# Use the directory where app.py is located
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "codebert_finetuned_final")

# Load tokenizer + model
try:
    if os.path.exists(MODEL_PATH):
        print(f"Loading local model from: {MODEL_PATH}")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    else:
        print(f"Local model not found at {MODEL_PATH}")
        print("ML Model missing. Using HEURISTIC detection engine as primary.")
        tokenizer = None
        model = None
except Exception as e:
    print(f"Error loading model: {e}")
    tokenizer = None
    model = None

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if model:
    model.to(device)
    model.eval()
    print(f"Scanner loaded successfully on {device}!")
else:
    print("Scanner NOT loaded. /scan endpoint will be unavailable.")


# -------------------------------
# Vulnerability Scan Endpoint
# -------------------------------

@app.route("/scan", methods=["POST"])
def scan_code():
    """
    Scans code using GraphCodeBERT and returns line-level labels.
    """

    data = request.json

    if not data or "code" not in data:
        return jsonify({"error": "No code provided"}), 400

    code = data.get("code")
    if not code:
        return jsonify({"error": "Code cannot be empty"}), 400
    
    print(f"Scanning code snippet ({len(code)} chars)...")
    print(f"Code preview: {code[:200]}...")
    
    # We now check model availability in detect_lines itself
    # it will use heuristics if model is None
    if not model or not tokenizer:
        print("Warning: ML model is not loaded. Using heuristics only.")

    try:
        results = detect_lines(model, tokenizer, code)
        total_lines = len(code.splitlines())
        vuln_count = len([res for res in results if res["label"] in [0, 2]])
        score = 100 * (1 - vuln_count / total_lines) if total_lines > 0 else 100

        print(f"Scan complete: {vuln_count} vulnerabilities found in {total_lines} lines")
        print(f"Results: {results}")

        return jsonify({
            "success": True,
            "scan_results": results,
            "summary": {
                "total_lines": total_lines,
                "vulnerabilities": vuln_count,
                "score": round(score, 2)
            }
        })

    except Exception as e:
        print(f"Scan error: {e}")
        return jsonify({"error": str(e)}), 500


# -------------------------------
# Fix Vulnerabilities with Ollama
# -------------------------------

def _add_import_once(lines, import_line):
    if any(line.strip() == import_line for line in lines):
        return

    insert_at = 0
    for index, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("from "):
            insert_at = index + 1
    lines.insert(insert_at, import_line)


def _apply_deterministic_fixes(original_code, issues):
    """
    Local fallback used when Ollama is unavailable.
    It handles the common patterns detected by the heuristic scanner.
    """
    lines = original_code.splitlines()
    needs_subprocess = False
    needs_html = False
    needs_urlparse = False
    needs_os = False

    for issue in issues:
        index = issue.get("line_number", 0) - 1
        if index < 0 or index >= len(lines):
            continue

        line = lines[index]
        stripped = line.strip()
        indent = line[:len(line) - len(line.lstrip())]
        label = issue.get("label_name", "").lower()
        lower_line = stripped.lower()

        if "sqli" in label:
            query_match = re.match(
                r"^(\w+)\s*=\s*(['\"])(.+?=)\2\s*\+\s*([A-Za-z_][A-Za-z0-9_]*)\s*$",
                stripped,
                re.IGNORECASE,
            )
            if query_match:
                query_var, quote, sql_prefix, value_var = query_match.groups()
                lines[index] = f"{indent}{query_var} = {quote}{sql_prefix}?{quote}"

                execute_pattern = re.compile(
                    rf"^(\s*)([A-Za-z_][A-Za-z0-9_]*\.execute)\(\s*{re.escape(query_var)}\s*\)\s*$"
                )
                for next_index in range(index + 1, min(index + 4, len(lines))):
                    execute_match = execute_pattern.match(lines[next_index])
                    if execute_match:
                        execute_indent, execute_call = execute_match.groups()
                        lines[next_index] = (
                            f"{execute_indent}{execute_call}({query_var}, ({value_var},))"
                        )
                        break
            continue

        if "cmdinjection" in label or "os.system" in lower_line:
            command_match = re.match(
                r"^os\.system\(\s*(['\"])(.+?)\1\s*\+\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*$",
                stripped,
            )
            if command_match:
                _, command_text, value_var = command_match.groups()
                command_parts = [part for part in command_text.strip().split(" ") if part]
                args = ", ".join([repr(part) for part in command_parts] + [value_var])
                lines[index] = f"{indent}subprocess.run([{args}], check=True)"
            else:
                generic_match = re.match(r"^os\.system\((.+)\)\s*$", stripped)
                if generic_match:
                    expression = generic_match.group(1)
                    lines[index] = f"{indent}subprocess.run([str({expression})], check=True)"
            needs_subprocess = True
            continue

        if "weakcrypto" in label or "hashlib.md5" in lower_line or "hashlib.sha1" in lower_line:
            lines[index] = (
                line
                .replace("hashlib.md5", "hashlib.sha256")
                .replace("hashlib.sha1", "hashlib.sha256")
            )
            continue

        if "ssrf" in label:
            request_match = re.match(
                r"^(.*requests\.(?:get|post|put|delete|patch)\()\s*([A-Za-z_][A-Za-z0-9_]*)(.*\).*)$",
                stripped,
            )
            if request_match:
                prefix, value_var, suffix = request_match.groups()
                if "timeout=" not in suffix:
                    suffix = suffix[:-1] + ", timeout=10)"
                lines[index] = f"{indent}{prefix}validate_external_url({value_var}){suffix}"
                needs_urlparse = True
            continue

        if "xss" in label:
            # Fix innerHTML = userInput
            if ".innerhtml" in lower_line:
                lines[index] = re.sub(r'\.innerHTML\s*=\s*(.+)', r'.textContent = \1', line, flags=re.IGNORECASE)
                continue
            # Fix document.write
            if "document.write" in lower_line:
                lines[index] = f"{indent}// REMOVED: document.write is unsafe"
                continue
            # Python f-string return fix
            fstring_match = re.match(
                r"^return\s+f(['\"])(.*)\{([A-Za-z_][A-Za-z0-9_]*)\}(.*)\1\s*$",
                stripped,
            )
            if fstring_match:
                quote, before, value_var, after = fstring_match.groups()
                escaped_value = f"html.escape(str({value_var}))"
                lines[index] = f"{indent}return f{quote}{before}{{{escaped_value}}}{after}{quote}"
                needs_html = True
            continue

        if "pathtraversal" in label:
            concat_match = re.match(
                r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*\+\s*([A-Za-z_][A-Za-z0-9_]*)\s*$",
                stripped,
            )
            if concat_match:
                result_var, base_var, file_var = concat_match.groups()
                lines[index] = (
                    f"{indent}{file_var} = os.path.basename({file_var})\n"
                    f"{indent}{result_var} = os.path.join({base_var}, {file_var})\n"
                    f"{indent}if not os.path.abspath({result_var}).startswith(os.path.abspath({base_var})):\n"
                    f"{indent}    raise ValueError('Access denied: path traversal detected')"
                )
                continue
            # Fix open(base_path + filename)
            open_concat = re.match(r"^(.*open\s*\()(.+)\+(.+)(\).*)$", stripped)
            if open_concat:
                prefix, base_var, file_var, suffix = open_concat.groups()
                file_var = file_var.strip()
                base_var = base_var.strip()
                lines[index] = (
                    f"{indent}{file_var} = os.path.basename({file_var})\n"
                    f"{indent}safe_path = os.path.join({base_var}, {file_var})\n"
                    f"{indent}if not os.path.abspath(safe_path).startswith(os.path.abspath({base_var})):\n"
                    f"{indent}    raise ValueError('Access denied')\n"
                    f"{indent}{prefix}safe_path{suffix}"
                )
                continue

        if "insecure" in label:
            # Fix hardcoded password â†’ environment variable
            pwd_match = re.match(
                r"^(password|passwd|pwd)\s*=\s*['\"].+['\"]",
                stripped, re.IGNORECASE
            )
            if pwd_match:
                var_name = pwd_match.group(1)
                lines[index] = f"{indent}{var_name} = os.environ.get('{var_name.upper()}', '')"
                needs_os = True
                continue
            # Fix hardcoded api_key
            api_match = re.match(
                r"^(api_key|secret|token)\s*=\s*['\"].+['\"]",
                stripped, re.IGNORECASE
            )
            if api_match:
                var_name = api_match.group(1)
                lines[index] = f"{indent}{var_name} = os.environ.get('{var_name.upper()}', '')"
                needs_os = True
                continue

    if needs_subprocess:
        _add_import_once(lines, "import subprocess")
    if needs_html:
        _add_import_once(lines, "import html")
    if needs_os:
        _add_import_once(lines, "import os")
    if needs_urlparse:
        _add_import_once(lines, "from urllib.parse import urlparse")
        helper = [
            "",
            "def validate_external_url(url):",
            "    parsed = urlparse(url)",
            "    if parsed.scheme != \"https\" or not parsed.netloc:",
            "        raise ValueError(\"URL must be an absolute HTTPS URL\")",
            "    return url",
        ]
        if not any(line.startswith("def validate_external_url(") for line in lines):
            insert_at = 0
            for index, line in enumerate(lines):
                stripped = line.strip()
                if stripped.startswith("import ") or stripped.startswith("from "):
                    insert_at = index + 1
            lines[insert_at:insert_at] = helper

    return "\n".join(lines)


@app.route("/fix", methods=["POST"])
def fix_code():
    """
    Uses local Ollama model (Qwen) to fix vulnerabilities.
    """

    data = request.json

    if not data or "code" not in data or "scan_results" not in data:
        return jsonify({"error": "Missing code or scan_results"}), 400

    original_code = data["code"]
    scan_results = data["scan_results"]

    issues = [res for res in scan_results if res["label"] in [0, 2]]

    if not issues:
        return jsonify({
            "fixed_code": original_code,
            "message": "No issues to fix!"
        }), 200


    prompt = f"""
You are a strict secure coding assistant. Rewrite the following code to fix the security vulnerabilities.
Maintain the exact same functionality, but ensure proper secure coding practices.

CRITICAL RULES:
1. Do not include fake security wrappers or explanations.
2. Return ONLY the raw fixed code, ready to compile.
3. For SQL, strictly use parameterized queries.
4. For OS commands, NEVER use `os.system` or string formatting.
5. Use subprocess.run(["command", arg]) style calls.

Original Code:
{original_code}

Vulnerable Lines to Fix:
{issues}
"""


    # Always compute deterministic fix as reliable baseline
    det_fixed = _apply_deterministic_fixes(original_code, issues)
    det_changed = det_fixed.strip() != original_code.strip()

    try:
        GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyC7_aAoMob5guoHoTd_hiLdo2z19GrgIfM")
        GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

        response = requests.post(
            GEMINI_URL,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048}
            },
            timeout=30
        )

        if response.status_code == 200:
            try:
                raw_response = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                print(f"Gemini response parse error: {e}")
                return jsonify({
                    "fixed_code": det_fixed,
                    "message": "Gemini response malformed; rule-based fix applied."
                }), 200

            # Strip markdown code fences
            match = re.search(
                r"```(?:python|javascript|js|py|sql)?\s*(.*?)\s*```",
                raw_response,
                re.IGNORECASE | re.DOTALL
            )
            gemini_fixed = match.group(1).strip() if match else raw_response.strip()
            gemini_changed = bool(gemini_fixed) and gemini_fixed.strip() != original_code.strip()

            print(f"Gemini changed: {gemini_changed}, Deterministic changed: {det_changed}")

            # Prefer deterministic for known patterns (reliable)
            # Fall back to Gemini for complex/unknown patterns
            if det_changed:
                print("Using deterministic fix.")
                return jsonify({"fixed_code": det_fixed}), 200
            elif gemini_changed:
                print("Using Gemini fix.")
                return jsonify({"fixed_code": gemini_fixed}), 200
            else:
                return jsonify({
                    "fixed_code": det_fixed,
                    "message": "Fix applied."
                }), 200

        else:
            print(f"Gemini error: {response.status_code} â€” {response.text}")
            return jsonify({
                "fixed_code": det_fixed,
                "message": f"Gemini failed (status {response.status_code}); rule-based fix applied."
            }), 200

    except requests.exceptions.RequestException as e:
        print(f"Gemini request error: {e}")
        return jsonify({
            "fixed_code": det_fixed,
            "message": "Gemini unavailable; rule-based fix applied."
        }), 200

    except Exception as e:
        print(f"Fix error: {e}")
        return jsonify({"error": str(e)}), 500


# -------------------------------
# Start Flask server
# -------------------------------

print("Starting Flask server...")
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 7860))

    app.run(host="0.0.0.0", port=port)


