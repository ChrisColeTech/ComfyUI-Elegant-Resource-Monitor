import time


class ElegantResourceMonitor():
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return { }

    RETURN_TYPES = ()
    RETURN_NAMES = ()

    FUNCTION = "run_resource_monitor"

    CATEGORY = "🤖 CCTech/Utilities"

    def run_resource_monitor(self):
        current_time = time.time()
        return (1, float(0), str(current_time))


NODE_CLASS_MAPPINGS = {
    "Resource Monitor": ElegantResourceMonitor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Resource Monitor": "Resource Monitor 📈",
}
