import subprocess
import sys
import os
import importlib
import re


re_requirement = re.compile(r"\s*([-\w]+)\s*(?:==\s*([-+.\w]+))?\s*")

python = sys.executable
default_command_live = (os.environ.get('LAUNCH_LIVE_OUTPUT') == "1")
index_url = os.environ.get('INDEX_URL', "")

modules_path = os.path.dirname(os.path.realpath(__file__))
script_path = os.path.dirname(modules_path)


def detect_python_version():
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}"
    is_embedded = hasattr(sys, '_base_executable') or (
        sys.base_prefix != sys.prefix and not hasattr(sys, 'real_prefix'))
    return version_str, is_embedded


def check_GPUtil_installed():
    try:
        import GPUtil
        import psutil
        return True
    except ImportError:
        import_GPUtil()
        return False


def check_flask_installed():
    try:
        import flask
        import flask_cors
        import flask_socketio
        import flask_restx
        return True
    except ImportError:
        import_flask()
        return False


def import_GPUtil():
    run_pip(f"install GPUtil pyadl psutil", desc="GPU Utilities")

    try:
        GPUtil = importlib.import_module(
            "GPUtil")
        return GPUtil
    except ImportError:
        print("Failed to import GPUtil after installation.")
        return None


def import_flask():
    run_pip(f"install flask flask-cors flask-socketio flask_restx",
            desc="Flask Web Socket io")

    try:
        flask = importlib.import_module("flask")
        flask_socketio = importlib.import_module("flask_socketio")
        return flask_socketio
    except ImportError:
        print("Failed to import flask after installation.")
        return None


def run(command, desc=None, errdesc=None, custom_env=None, live: bool = default_command_live) -> str:
    if desc is not None:
        print(desc)

    run_kwargs = {
        "args": command,
        "shell": True,
        "env": os.environ if custom_env is None else custom_env,
        "encoding": 'utf8',
        "errors": 'ignore',
    }

    if not live:
        run_kwargs["stdout"] = run_kwargs["stderr"] = subprocess.PIPE

    result = subprocess.run(**run_kwargs)

    if result.returncode != 0:
        error_bits = [
            f"{errdesc or 'Error running command'}.",
            f"Command: {command}",
            f"Error code: {result.returncode}",
        ]
        if result.stdout:
            error_bits.append(f"stdout: {result.stdout}")
        if result.stderr:
            error_bits.append(f"stderr: {result.stderr}")
        raise RuntimeError("\n".join(error_bits))

    return (result.stdout or "")


def run_pip(command, desc=None, live=default_command_live):
    try:
        index_url_line = f' --index-url {index_url}' if index_url != '' else ''
        return run(f'"{python}" -m pip {command} --prefer-binary{index_url_line}', desc=f"Installing {desc}",
                   errdesc=f"Couldn't install {desc}", live=live)
    except Exception as e:
        print(e)
        print(f'CMD Failed {desc}: {command}')
        return None


check_GPUtil_installed()
check_flask_installed()
