#!/bin/bash

echo "Starting Ollama..."
ollama serve &

echo "Waiting for Ollama..."
sleep 10

echo "Pulling model..."
ollama pull qwen2.5-coder:1.5b || true

echo "Starting API..."
exec gunicorn -b 0.0.0.0:7860 app:app --timeout 300