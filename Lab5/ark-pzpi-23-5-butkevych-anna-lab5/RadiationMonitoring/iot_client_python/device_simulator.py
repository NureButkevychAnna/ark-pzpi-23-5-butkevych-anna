import os
import time
import uuid
import json
import random
import logging
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv('API_URL', 'http://localhost:3000/api/readings')
DEVICE_TOKEN = os.getenv('DEVICE_TOKEN')
BUFFER_FILE = os.getenv('BUFFER_FILE', 'buffer.json')
INTERVAL = float(os.getenv('INTERVAL', '5'))  # seconds
MAX_RETRIES = int(os.getenv('MAX_RETRIES', '5'))

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')

session = requests.Session()

def generate_reading():
    value = round(random.uniform(0.01, 12.0), 3)
    return {
        'measured_at': datetime.utcnow().isoformat() + 'Z',
        'value': value,
        'unit': 'µSv/h',
        'metadata': {
            'simulator': True,
            'seq': str(uuid.uuid4())
        }
    }


def load_buffer():
    if not os.path.exists(BUFFER_FILE):
        return []
    try:
        with open(BUFFER_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []


def save_buffer(buffer):
    with open(BUFFER_FILE, 'w') as f:
        json.dump(buffer, f)


def send_reading(reading):
    headers = {'Device-Token': DEVICE_TOKEN, 'Content-Type': 'application/json'}
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.post(API_URL, json=reading, headers=headers, timeout=10)
            if resp.status_code in (200, 201):
                logging.info('Sent reading: %s -> %s', reading['metadata']['seq'], resp.status_code)
                return True
            else:
                logging.warning('Server returned %s: %s', resp.status_code, resp.text)
        except requests.RequestException as e:
            logging.warning('Request failed: %s', e)
        backoff = attempt * 2
        logging.info('Retrying in %s seconds...', backoff)
        time.sleep(backoff)
    return False


if __name__ == '__main__':
    if not DEVICE_TOKEN:
        logging.error('DEVICE_TOKEN not set in environment')
        exit(1)

    buffer = load_buffer()

    try:
        while True:
            reading = generate_reading()

            if buffer:
                logging.info('Flushing %d buffered readings...', len(buffer))
                remaining = []
                for r in buffer:
                    if not send_reading(r):
                        remaining.append(r)
                buffer = remaining

            if not send_reading(reading):
                buffer.append(reading)
                save_buffer(buffer)
                logging.info('Buffered reading, buffer size=%d', len(buffer))

            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        logging.info('Stopping simulator...')
        save_buffer(buffer)
