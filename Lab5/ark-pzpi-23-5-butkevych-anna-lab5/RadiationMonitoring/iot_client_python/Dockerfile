FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY device_simulator.py ./
COPY buffer.json ./
ENV API_URL=http://backend:3000/api/readings \
    INTERVAL=5 \
    MAX_RETRIES=5 \
    BUFFER_FILE=buffer.json
CMD ["python", "device_simulator.py"]
