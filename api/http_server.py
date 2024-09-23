
from .dependency_installer import *
from flask import Flask, send_from_directory, jsonify, render_template
import threading
import logging
from flask_cors import CORS
from flask_restx import Api
from .controllers import register_blueprints
import os
import sys
import signal
from flask import Flask
from flask_socketio import SocketIO, emit
import logging
import time
import psutil
import GPUtil
import threading


def load_page(filename):
    """Load an HTML file as a string and return it"""
    file_path = os.path.join("web", filename)
    with open(file_path, 'r') as file:
        content = file.read()
    return content


# Suppress the Flask development server warning
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)  # Set level to ERROR to suppress warnings

title = f"Elegant Resource Monitor"
app = Flask(title, static_folder='web/assets', template_folder='web/templates')
app.config['CORS_HEADERS'] = 'Content-Type'
api = Api(app, version='1.0', title=title,
          description='Elegant Resource Monitor REST API')

# Register blueprints (API endpoints)
register_blueprints(app, api)

# Initialize SocketIO with the Flask app
socketio = SocketIO(app, cors_allowed_origins="*")

# Enable CORS for all origins
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('web', filename)


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
    try:
        while True:
            current_time = time.time()
            get_cache(current_time)
            socketio.emit('data_update', cache['data'])
            # Use socketio.sleep() to avoid blocking issues
            socketio.sleep(0.5)
    except Exception as e:
        logging.error(f"Error in background_thread: {e}")


def run_app():
    time.sleep(1)  # Sleep for a short while to let the server start
    # Start the background thread for emitting data
    socketio.start_background_task(target=background_thread)
    # Run the Flask app with SocketIO
    socketio.run(app, port=5000, allow_unsafe_werkzeug=True)


def signal_handler(sig, frame):
    sys.exit(0)  # Clean exit of the program

    socketio.run(app, port=5000, allow_unsafe_werkzeug=True)

# Register signal handler for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)

# Start Flask app in a separate thread
thread = threading.Thread(target=run_app)
thread.daemon = True  # Make the thread a daemon
thread.start()