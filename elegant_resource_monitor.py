import time


class ElegantResourceMonitor():
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "directory_path": ("STRING", {"default": ""}),
            },
        }

    RETURN_TYPES = ("INT", "FLOAT", "STRING",)

    FUNCTION = "run_resource_monitor"

    CATEGORY = "CCTech/Utilities"

    def run_resource_monitor(self):
        current_time = time.time()
        return (1, float(0), str(current_time))


NODE_CLASS_MAPPINGS = {
    "ElegantResourceMonitor": ElegantResourceMonitor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ElegantResourceMonitor": "📈 Resource Monitor",
}
