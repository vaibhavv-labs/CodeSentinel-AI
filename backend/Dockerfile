FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download model at build time
RUN python -c "
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
model_name = 'mrm8488/codebert-base-finetuned-detect-insecure-code'
t = AutoTokenizer.from_pretrained(model_name)
m = AutoModelForSequenceClassification.from_pretrained(model_name)
t.save_pretrained('./codebert_finetuned_final')
m.save_pretrained('./codebert_finetuned_final')
print('Model ready!')
"

EXPOSE 7860

CMD ["python", "app.py"]
