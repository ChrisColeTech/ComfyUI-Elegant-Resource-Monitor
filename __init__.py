from .api.dependency_installer import *
from .elegant_resource_monitor import ElegantResourceMonitor
from .api.http_server import *

NODE_CLASS_MAPPINGS = {
    "ElegantResourceMonitor": ElegantResourceMonitor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ElegantResourceMonitor": "📈 Resource Monitor",
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

WEB_DIRECTORY = "./web"
