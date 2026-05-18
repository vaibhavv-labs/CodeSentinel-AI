import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# --- CONFIGURATION ---
CONFIDENCE_THRESHOLD = 0.75  # Lowered from 0.88 to be more sensitive
CONTEXT_RADIUS = 2           # Lines of context before and after
CONTEXT_SEP = " </s> "       # GraphCodeBERT separator token
MAX_LENGTH = 384             # Max tokens for the transformer

# The fake guards that trigger the HALLUCINATED class (Stage 2)
FAKE_GUARDS = [
    "SQLSanitizer.clean", "InputValidator.sanitize", "QueryGuard.escape",
    "PathValidator.check", "FileGuard.validate", "SecureDeserializer.validate",
    "DataGuard.check", "SSRFProtector.wrap", "URLGuard.validate",
    "JWTGuard.verify", "TokenValidator.check"
]

# Patterns to skip (forces line to be SAFE)
# Removed "def" and "return " as they can contain vulnerabilities
SKIP_PATTERNS = [
    "import ", "from ", "require(", "include(", "using ",
    "#include", "package ", "const express", "}", "{",
    "*/", "/*", "//", "#", "@app.route", "@Override",
    "@RequestMapping", "app = Flask", "app.listen",
    "public class", "class ", "<?php", "?>"
]

# --- HELPER FUNCTIONS ---

def is_boilerplate(line):
    """Returns True if the line is just imports, brackets, or comments."""
    stripped = line.strip()
    if not stripped:
        return True
    for pattern in SKIP_PATTERNS:
        if stripped.startswith(pattern):
            return True
    return False

def predict_window(model, tokenizer, text):
    """Runs the 2-class model on the 5-line context window."""
    inputs = tokenizer(
        text, 
        return_tensors="pt", 
        truncation=True, 
        max_length=MAX_LENGTH
    )
    
    # Move inputs to the same device as the model (GPU/CPU)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model(**inputs)
        # Apply softmax to get probabilities
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1).squeeze().tolist()
        label = int(torch.argmax(outputs.logits, dim=-1))
        
    return label, probs

# --- CORE DETECTION ENGINE ---

def heuristic_scan(line):
    """
    Simple regex-based backup for common vulnerabilities.
    Returns (is_vulnerable, label_name, confidence)
    """
    line_lower = line.lower()
    
    # 1. SQL Injection Patterns
    sqli_patterns = [
        r"select\s+.*where.*=\s*['\"]?\s*\+",               # String concat in SQL WHERE clause
        r"select\s+.*from.*where.*\+\s*['\"]",              # Concat before/after SQL
        r"where\s+.*=\s*['\"]?\s*\+\s*\w+",                 # WHERE with concatenation
        r"execute\s*\(\s*f['\"]",                            # F-strings in execute
        r"\.execute\s*\(['\"].*%\s*['\"]",                  # String formatting in execute
        r"cursor\.execute\s*\([^,]*(\+|%|\.format\(|f['\"])", # execute with interpolation/concatenation
    ]
    
    # 2. Command Injection Patterns
    cmd_patterns = [
        r"os\.system\s*\(",
        r"subprocess\.popen\s*\(.*shell\s*=\s*true",
        r"subprocess\.run\s*\(.*shell\s*=\s*true",
        r"subprocess\.call\s*\(.*shell\s*=\s*true",
    ]
    
    # 3. Insecure Deserialization / Hardcoded Secrets
    misc_patterns = [
        r"pickle\.loads\s*\(",
        r"eval\s*\(",
        r"exec\s*\(",
        r"password\s*=\s*['\"].+['\"]",
        r"api_key\s*=\s*['\"].+['\"]",
        r"secret\s*=\s*['\"].+['\"]",
    ]
    
    # 4. Cross-Site Scripting (XSS)
    xss_patterns = [
        r"dangerouslysetinnerhtml",
        r"\.innerhtml\s*=",
        r"\.outerhtml\s*=",
        r"document\.write\s*\(",
        r"document\.writeln\s*\(",
        r"response\.write\s*\(",
        r"\.insertadjacenthtml\s*\(",
        r"\$\s*\(.*\)\s*\.html\s*\(",
        r"\.html\s*\(\s*\w*(input|user|param|query|data|req)\w*",
        r"return\s+f?['\"].*<[^>]+>.*\{?\w*(user_input|request|input|query|param)\w*\}?.*['\"]",
        r"res\.send\s*\(.*\+",
        r"res\.write\s*\(.*\+",
    ]

    # 5. Path Traversal / File Access
    path_patterns = [
        r"open\s*\(.*['\"].*\.\.[\\/].*['\"]",
        r"open\s*\(\s*\w*(path|file|name|dir|folder|input|user)\w*\s*[,\)]",
        r"open\s*\(.*\+",
        r"open\s*\(f['\"]",
        r"send_file\s*\(",
        r"send_from_directory\s*\(",
        r"os\.path\.join\s*\(.*request\.",
        r"os\.path\.join\s*\(.*\+",
        r"base_path\s*\+",
        r"filepath\s*=.*\+",
        r"full_path\s*=.*\+",
        r"file_path\s*=.*\+",
    ]
    
    # 6. Cryptography & Secrets
    crypto_patterns = [
        r"hashlib\.md5\(",
        r"hashlib\.sha1\(",
        r"jwt\.decode\(.*verify\s*=\s*false",
        r"bcrypt\.hashpw\(.*,\s*['\"].*['\"]",  # Hardcoded salt
    ]
    
    # 7. NoSQL Injection & Misc
    nosql_patterns = [
        r"\$where",
        r"mapReduce\(",
        r"db\.collection\.find\(.*request\.",
        r"chmod\s*\(.*777",
        r"yaml\.load\(",  # Unsafe YAML load
        r"pickle\.load\(",
    ]
    
    # 8. SSRF (Server-Side Request Forgery)
    ssrf_patterns = [
        r"requests\.(get|post|put|delete|patch)\(request\.",
        r"requests\.(get|post|put|delete|patch)\(\s*\w*(url|uri|input|target|endpoint)\w*",
        r"urllib\.request\.urlopen\(request\.",
        r"urllib\.request\.urlopen\(\s*\w*(url|uri|input|target|endpoint)\w*",
        r"httpx\.(get|post|put|delete|patch)\(request\.",
        r"httpx\.(get|post|put|delete|patch)\(\s*\w*(url|uri|input|target|endpoint)\w*",
    ]

    import re
    
    # SIMPLE DIRECT CHECKS (highest priority)
    # Check for string concatenation in SQL statements (most common pattern)
    if "select" in line_lower and "where" in line_lower:
        if ("+" in line or ".format(" in line or "{" in line) and ("'" in line or '"' in line):
            return True, "VULNERABLE (SQLi)", 0.95
    
    # Check for string concatenation in any execute/query context
    if ("execute" in line_lower or "query" in line_lower) and ("+" in line):
        return True, "VULNERABLE (SQLi)", 0.92
        
    # Check for string formatting in SQL
    if ("execute" in line_lower or "query" in line_lower) and ("%" in line or "{" in line):
        if ("select" in line_lower or "insert" in line_lower or "update" in line_lower or "delete" in line_lower):
            return True, "VULNERABLE (SQLi)", 0.92
    
    # REGEX PATTERNS (backup checks)
    for p in sqli_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (SQLi)", 0.95
            
    for p in cmd_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (CmdInjection)", 0.98
            
    for p in misc_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (Insecure)", 0.90

    for p in xss_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (XSS)", 0.92

    for p in path_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (PathTraversal)", 0.94

    for p in crypto_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (WeakCrypto)", 0.91

    for p in nosql_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (NoSQLi/Unsafe)", 0.93

    for p in ssrf_patterns:
        if re.search(p, line_lower):
            return True, "VULNERABLE (SSRF)", 0.92
            
    return False, "SAFE", 0.0

def detect_lines(model, tokenizer, code):
    """
    Scans code line-by-line using AI + Heuristic fallback.
    Returns JSON-ready list for the Next.js frontend.
    """
    lines = code.split('\n')
    results = []
    
    for i, line in enumerate(lines):
        # 1. Build 5-line window around current line
        start = max(0, i - CONTEXT_RADIUS)
        end = min(len(lines), i + CONTEXT_RADIUS + 1)
        window_text = CONTEXT_SEP.join(lines[start:end])
        
        # 2. Skip empty lines immediately
        if not line.strip():
            continue
            
        # 3. STAGE 0: Heuristic Scan (FAST & RELIABLE)
        is_vuln_h, label_name_h, conf_h = heuristic_scan(line)
        
        # 4. STAGE 1: AI SCAN
        label = 1
        probs = [0.0, 1.0]
        
        if model and tokenizer:
            label, probs = predict_window(model, tokenizer, window_text)
            
            # Apply Confidence Threshold for AI
            if label == 0 and probs[0] < CONFIDENCE_THRESHOLD:
                label = 1
        
        # 5. Combine Results (Heuristic takes priority if it finds something)
        if is_vuln_h:
            label = 0
            label_name = label_name_h
            confidence = conf_h
            probs = {"vulnerable": conf_h, "safe": 1-conf_h, "hallucinated": 0.0}
        else:
            label_name = "SAFE" if label == 1 else "VULNERABLE"
            confidence = round(probs[label], 4) if isinstance(probs, list) else 0.0
            probs_dict = {
                "vulnerable": round(probs[0], 4) if isinstance(probs, list) else 0.0,
                "safe": round(probs[1], 4) if isinstance(probs, list) else 1.0,
                "hallucinated": 0.0
            }
            probs = probs_dict

        # 6. Apply Boilerplate Filter (only if not already flagged by heuristics)
        if not is_vuln_h and is_boilerplate(line):
            label = 1
            label_name = "SAFE"
            
        # 7. STAGE 2: THE CASCADE (Hallucination Check)
        if label == 0 and not is_vuln_h:
            if any(guard in window_text for guard in FAKE_GUARDS):
                label = 2
                label_name = "HALLUCINATED"
                probs["hallucinated"] = 0.99
                confidence = 0.99
        
        # 8. Format Output for Frontend API
        results.append({
            "line_number": i + 1,
            "code": line.strip(),
            "label": label,
            "label_name": label_name,
            "confidence": confidence,
            "probs": probs
        })
        
    return results

# --- TESTING BLOCK ---
if __name__ == "__main__":
    # Point this to your HIGH ACCURACY 2-class model directory
    MODEL_PATH = "./securecode_model_v5_final" # Change this to your actual 2-class model folder
    
    print(f"Loading 2-class model from {MODEL_PATH}...")
    try:
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained("microsoft/graphcodebert-base")
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        
        # Move to GPU if available (vital for your RTX 3050)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()
        
        print(f"Model loaded successfully on {device}! Running test...")
        
        # Test Snippet: A vulnerable SQL injection disguised with a fake guard
        test_code = """
import sqlite3
def get_user(user_id):
    clean_id = SQLSanitizer.clean(user_id)
    query = "SELECT * FROM users WHERE id=" + clean_id
    cursor.execute(query)
    return cursor.fetchone()
"""
        
        results = detect_lines(model, tokenizer, test_code)
        
        print("\n--- SCAN RESULTS ---")
        for res in results:
            print(f"Line {res['line_number']:02d} | [{res['label_name']:^12}] | {res['code']}")
            if res['label'] != 1: # Print details if not safe
                print(f"      -> Probs: Vuln: {res['probs']['vulnerable']:.2f}, Safe: {res['probs']['safe']:.2f}, Hallucinated: {res['probs']['hallucinated']:.2f}")

    except Exception as e:
        print(f"\nError loading model or running test: {e}")
        print("Make sure you are pointing MODEL_PATH to the correct 2-class model folder.")
