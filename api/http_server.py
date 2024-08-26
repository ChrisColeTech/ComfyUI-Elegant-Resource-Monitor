
from flask import Flask, send_from_directory, jsonify, render_template
from flask_restx import Api
import threading
import logging
from flask_cors import CORS
import time
# Adjusted import for fooocus_version and shared
from .controllers import register_blueprints
import os

def load_page(filename):
    """Load an HTML file as a string and return it"""
    file_path = os.path.join("web", filename)
    with open(file_path, 'r') as file:
        content = file.read()
    return content

# Cache for system usage data
cache = {
    'timestamp': 0,
    'data': {
        'cpu': 0,
        'memory': 0,
        'gpu': 0,
        'vram': 0,
        'hdd': 0
    }
}
CACHE_DURATION = 1  # Cache duration in seconds


# Suppress the Flask development server warning
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)  # Set level to ERROR to suppress warnings

title = f"Resource Monitor"
app = Flask(title, static_folder='web/assets', template_folder='web/templates')
app.config['CORS_HEADERS'] = 'Content-Type'
api = Api(app, version='1.0', title=title, description='Fooocus REST API')

# Register blueprints (API endpoints)
register_blueprints(app, api)

# Enable CORS for all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Route to serve HTML templates


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('web', filename)


def run_app():
    time.sleep(1)  # Sleep for a short while to let the server start
    app.run(port=5000)


# Start Flask app in a separate thread
thread = threading.Thread(target=run_app)
thread.start()
