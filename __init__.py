from .api.http_server import *
from .elegant_resource_monitor import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
import random

tech_rambling = [
    "Beepity beep beep!", "Clickity-clackity!", "Algorithm: Activated!", "Nerd mode: OFF [ON]",
    "Geeks unite!", "Data crunch time!", "Reboot-a-rama!", "Quantum leap engaged!"
]

print(f"\033[1;34m[CCTech Suite]: 🤖🤖🤖 \033[96m\033[3m{random.choice(tech_rambling)}\033[0m 🤖🤖🤖")
print(f"\033[1;34m[CCTech Suite]:\033[0m Activated \033[96m{len(NODE_CLASS_MAPPINGS)}\033[0m server nodes.")

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

WEB_DIRECTORY = "./web"
