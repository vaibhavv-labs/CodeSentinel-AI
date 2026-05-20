<div align="center">

# 🛡️ CodeSentinel AI

### AI-Powered Code Vulnerability Detection & Auto-Remediation

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge&logo=vercel)](https://codesentinel-app.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-HuggingFace-yellow?style=for-the-badge&logo=huggingface)](https://huggingface.co/spaces/vaibhav9700/codetrust-ai-backend)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Made with](https://img.shields.io/badge/Made%20with-Next.js%20%2B%20Flask-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)

<br/>

> **Paste your code. Let AI find the vulnerabilities. Get production-ready secure fixes — instantly.**

<br/>

</div>

---

## 🚀 What is CodeSentinel AI?

**CodeSentinel AI** is a full-stack AI-powered security platform that scans your code for vulnerabilities in real time and automatically generates secure, production-ready fixes using fine-tuned CodeBERT and LLM-powered remediation.

Built by developers, for developers — no security expertise required.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **AI Code Scanning** | Fine-tuned CodeBERT model with 89%+ accuracy |
| 🛡️ **8 Vulnerability Types** | SQL Injection, XSS, Command Injection, Path Traversal, Hardcoded Secrets, Weak Crypto, SSRF, NoSQL Injection |
| ⚡ **Auto Fix** | Qwen 2.5 Coder powered intelligent code remediation |
| 📊 **Scan History** | Full history with PDF export support |
| 🔐 **Auth System** | Email/Password + Google + GitHub OAuth |
| 📱 **Responsive UI** | Works seamlessly on desktop and mobile |
| 🌙 **Dark Theme** | Professional dark UI built for developers |

---

## 🧠 How It Works

```
Your Code
    ↓
Next.js Frontend (Port 3000)
    ↓
Flask Backend API (Port 7860)
    ↓
Fine-tuned CodeBERT Model (89% accuracy)
    ↓
Heuristic Scanner (8 vulnerability patterns)
    ↓
Qwen 2.5 Coder LLM (Auto Fix)
    ↓
Secure Code + Detailed Report
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** — App Router + TypeScript
- **Tailwind CSS** — Dark theme UI
- **Framer Motion** — Animations
- **NextAuth v5** — Authentication
- **Prisma ORM** — Database layer

### Backend
- **Flask** — REST API server
- **CodeBERT** — Fine-tuned vulnerability detection model
- **Qwen 2.5 Coder 1.5B** — LLM for auto-fix via Gemini
- **Transformers** — HuggingFace model pipeline
- **PyTorch** — ML inference

### Infrastructure
- **Vercel** — Frontend deployment
- **HuggingFace Spaces** — Backend deployment (Docker)
- **Neon PostgreSQL** — Serverless database

---

## 🔍 Vulnerability Detection

CodeSentinel AI detects and fixes the following:

```python
# ❌ Vulnerable Code
def get_user(user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    cursor.execute(query)
    return cursor.fetchone()

# ✅ Auto-Fixed by CodeSentinel AI
def get_user(user_id):
    query = "SELECT * FROM users WHERE id=?"
    cursor.execute(query, (user_id,))
    return cursor.fetchone()
```

### Supported Vulnerability Types

- 🔴 **SQL Injection** — Parameterized query violations
- 🟠 **XSS** — Unsanitized input rendering
- 🟡 **Path Traversal** — Directory traversal attacks
- 🟣 **Command Injection** — OS command execution
- 🔵 **Hardcoded Secrets** — Exposed API keys & passwords
- 🟢 **Weak Crypto** — MD5, SHA1, insecure hashing
- ⚪ **SSRF** — Server-side request forgery
- 🔶 **NoSQL Injection** — MongoDB injection patterns

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js v20+
Python 3.10+
PostgreSQL (or Neon free tier)
Ollama (optional — for AI-powered fixes)
```

### 1. Clone the Repository

```bash
git clone https://github.com/vaibhavv-labs/CodeSentinel-AI.git
cd CodeSentinel-AI
```

### 2. Setup Frontend

```bash
npm install --legacy-peer-deps
```

Create `.env` file:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
AUTH_SECRET=your_secret_here
DATABASE_URL=your_neon_postgresql_url
FLASK_API_URL=http://127.0.0.1:7860
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

```bash
npx prisma db push
npm run dev
```

### 3. Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

pip install -r requirements.txt
python app.py
```

### 4. (Optional) Setup Ollama for AI Fixes

```bash
ollama pull qwen2.5-coder:1.5b
```

---

## 📁 Project Structure

```
CodeSentinel-AI/
├── src/
│   ├── app/
│   │   ├── (public)/          ← Landing page
│   │   ├── (app)/             ← Dashboard, Analyze, History, Reports
│   │   └── api/               ← Next.js API routes
│   ├── components/            ← Reusable UI components
│   └── lib/                   ← Prisma, Auth config
├── backend/
│   ├── app.py                 ← Flask server (/scan + /fix endpoints)
│   ├── line_level_detect.py   ← AI + Heuristic detection engine
│   ├── codebert_finetuned_final/  ← Fine-tuned model
│   └── requirements.txt
├── prisma/
│   └── schema.prisma          ← Database schema
└── .env                       ← Environment variables (never commit!)
```

---

## 📊 Model Performance

| Metric | Value |
|---|---|
| Base Model | microsoft/codebert-base |
| Fine-tuning Dataset | CyberNative/Code_Vulnerability_Security_DPO |
| Training Accuracy | **89.16%** |
| Vulnerability Types | **8** |
| Detection Confidence | Up to **99.92%** |
| Hallucination Fix | ✅ Resolved via fine-tuning |

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| 🌍 Frontend | [codesentinel-app.vercel.app](https://codesentinel-app.vercel.app) |
| 🤖 Backend | [HuggingFace Spaces](https://huggingface.co/spaces/vaibhav9700/codetrust-ai-backend) |
| 💻 GitHub | [vaibhavv-labs/CodeSentinel-AI](https://github.com/vaibhavv-labs/CodeSentinel-AI) |

---

## 👥 Team

| Name | Role |
|---|---|
| **Vaibhav Bhoyate** | AI/ML Engineering — CodeBERT fine-tuning, Flask backend, database, model deployment |
| **Anjali Tripathi** | Full Stack — Next.js frontend, authentication |

---

## 📄 License

This project is licensed under the MIT License 

---

<div align="center">

**Built with ❤️ for developers who care about security**

⭐ Star this repo if you found it useful!

</div>
