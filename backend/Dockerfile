FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y curl git zstd && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Hugging Face port
EXPOSE 7860

# Start backend
CMD ["./start.sh"]