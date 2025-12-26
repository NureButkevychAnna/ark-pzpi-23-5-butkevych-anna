Python IoT client for RadiationMonitoring

This folder contains a simple Python script that simulates an IoT device sending sensor readings to the API.

Requirements:

- Python 3.8+
- requests

Usage:

1. Create a virtual environment and install dependencies:
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

2. Configure environment variables in a .env file (or export them):
   API_URL=http://localhost:3000/api/readings
   DEVICE_TOKEN=<your_device_token>

3. Run the simulator:
   python device_simulator.py

The simulator will send periodic readings with retry logic and local buffering when the server is unreachable.
