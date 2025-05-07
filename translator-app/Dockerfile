FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    libfreetype6-dev \
    libpng-dev \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python", "main.py"]
