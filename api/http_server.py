from dependency_installer import *
from flask import Flask
from flask_socketio import SocketIO, emit
import logging
import time
import psutil
import GPUtil
import threading

# Initialize Flask app
title = "Resource Monitor"
app = Flask(title, static_folder='web/assets', template_folder='web/templates')
app.config['CORS_HEADERS'] = 'Content-Type'

# Initialize SocketIO with the Flask app
socketio = SocketIO(app, cors_allowed_origins="*")

# Cache for system usage data
cache = {
    'timestamp': 0,
    'data': {
        'cpu': 0,
        'ram': 0,
        'gpu': 0,
        'vram': 0,
        'hdd': 0,
        'temp': 0
    }
}
CACHE_DURATION = 1  # Cache duration in seconds

# Suppress the Flask development server warning
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)  # Set level to ERROR to suppress warnings


def get_nvidia_info():
    """Fetch NVIDIA GPU info using GPUtil."""
    gpus = GPUtil.getGPUs()
    if gpus:
        gpu = gpus[0]  # Assuming the first GPU
        gpu_percent = gpu.load * 100
        vram_usage = (gpu.memoryUsed / gpu.memoryTotal) * 100
        temperature = gpu.temperature
    else:
        gpu_percent = vram_usage = temperature = 0
    return gpu_percent, vram_usage, temperature


def get_cache(current_time):
    """Update system usage data."""
    # Get CPU utilization
    cpu_percent = psutil.cpu_percent(interval=0)

    # Get Memory utilization
    mem = psutil.virtual_memory()
    mem_percent = mem.percent

    # Check and fetch NVIDIA GPU info using GPUtil
    gpu_percent, vram_usage, temperature = get_nvidia_info()

    # Get HDD usage (assuming usage of the primary disk)
    hdd = psutil.disk_usage('/')
    hdd_percent = hdd.percent

    # Update the cache
    cache['data'] = {
        'cpu': cpu_percent,
        'ram': mem_percent,
        'gpu': gpu_percent,
        'vram': vram_usage,
        'hdd': hdd_percent,
        'temp': temperature
    }
    cache['timestamp'] = current_time


@socketio.on('connect')
def handle_connect():
    # Emit initial data
    current_time = time.time()
    get_cache(current_time)
    emit('data_update', cache['data'])


@socketio.on('disconnect')
def handle_disconnect():
    pass


def background_thread():
    while True:
        current_time = time.time()
        get_cache(current_time)
        socketio.emit('data_update', cache['data'])
        time.sleep(.5)


def run_app():
    time.sleep(1)  # Sleep for a short while to let the server start
    # Start the background thread for emitting data
    socketio.start_background_task(target=background_thread)
    # Run the Flask app with SocketIO
    socketio.run(app, port=5000)


# Start Flask app in a separate thread
thread = threading.Thread(target=run_app)
thread.start()
