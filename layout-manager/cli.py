"""
Layout Manager CLI - Command-line interface for subprocess communication.

Usage:
    python cli.py --stdin
    
Commands (via stdin, JSON format):
    {"command": "add_process", "name": "EliteDangerous64.exe", "language": "English"}
    {"command": "remove_process", "name": "EliteDangerous64.exe"}
    {"command": "start_monitor"}
    {"command": "stop_monitor"}
    {"command": "get_status"}
    {"command": "get_config"}
"""

import sys
import json
import configparser
import os
import threading
import time
from pathlib import Path

# Constants
CONFIG_FILE = Path(__file__).parent / 'config.ini'
LAYOUT_IDS = {
    "English": 0x4090409,
    "Russian": 0x4190419
}

# Monitor state
monitor_running = False
monitor_thread = None
current_process = None

# ============================================================================
# Config Functions
# ============================================================================

def load_config():
    """Load configuration from INI file."""
    config = configparser.ConfigParser()
    if CONFIG_FILE.exists():
        config.read(CONFIG_FILE, encoding='utf-8')
    return config

def save_config(config):
    """Save configuration to INI file."""
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        config.write(f)

def add_process(name, language):
    """Add a process to configuration."""
    config = load_config()
    if name in config:
        return {"success": False, "error": "Process already exists"}
    
    config[name] = {
        "Language": language,
        "LayoutID": hex(LAYOUT_IDS.get(language, 0x4090409))
    }
    save_config(config)
    return {"success": True, "message": f"Added {name}"}

def remove_process(name):
    """Remove a process from configuration."""
    config = load_config()
    if name not in config:
        return {"success": False, "error": "Process not found"}
    
    del config[name]
    save_config(config)
    return {"success": True, "message": f"Removed {name}"}

def get_config():
    """Get all configured processes."""
    config = load_config()
    processes = []
    for section in config.sections():
        processes.append({
            "name": section,
            "language": config.get(section, 'Language', fallback='English'),
            "layoutId": config.getint(section, 'LayoutID', fallback=0x4090409)
        })
    return {"success": True, "processes": processes}

# ============================================================================
# Monitor Functions
# ============================================================================

def get_foreground_window():
    """Get handle to foreground window."""
    import ctypes
    return ctypes.windll.user32.GetForegroundWindow()

def get_window_process_name(hwnd):
    """Get process name from window handle."""
    import ctypes
    from ctypes import wintypes
    
    pid = wintypes.DWORD()
    ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    
    try:
        import psutil
        process = psutil.Process(pid.value)
        return process.name()
    except:
        return ""

def get_current_layout():
    """Get current keyboard layout."""
    import ctypes
    hwnd = get_foreground_window()
    hkl = ctypes.windll.user32.GetKeyboardLayout(hwnd)
    return hkl & 0xFFFFFFFF

def switch_layout(layout_id):
    """Switch keyboard layout."""
    import ctypes
    import time
    
    WM_INPUTLANGCHANGEREQUEST = 0x0050
    HWND_BROADCAST = 0xFFFF
    
    hwnd = get_foreground_window()
    ctypes.windll.user32.PostMessageW(hwnd, WM_INPUTLANGCHANGEREQUEST, 0, layout_id)
    time.sleep(0.05)
    ctypes.windll.user32.PostMessageW(HWND_BROADCAST, WM_INPUTLANGCHANGEREQUEST, 0, layout_id)

def monitor_loop():
    """Main monitor loop."""
    global monitor_running, current_process
    
    while monitor_running:
        try:
            hwnd = get_foreground_window()
            process_name = get_window_process_name(hwnd).lower()
            
            if process_name:
                config = load_config()
                if process_name in config:
                    layout_id_str = config.get(process_name, 'LayoutID', fallback='0x4090409')
                    target_layout = int(layout_id_str, 16) if layout_id_str.startswith('0x') else int(layout_id_str)
                    
                    current_layout = get_current_layout()
                    if current_layout != target_layout:
                        switch_layout(target_layout)
                        current_process = process_name
                        # Send status update
                        send_status("layout_switched", process_name, config.get(process_name, 'Language', fallback='Unknown'))
        except Exception as e:
            send_status("error", str(e))
        
        time.sleep(0.5)

def start_monitor():
    """Start the layout monitor."""
    global monitor_running, monitor_thread
    
    if monitor_running:
        return {"success": False, "error": "Monitor already running"}
    
    monitor_running = True
    monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
    monitor_thread.start()
    
    send_status("monitor_started")
    return {"success": True, "message": "Monitor started"}

def stop_monitor():
    """Stop the layout monitor."""
    global monitor_running, monitor_thread
    
    monitor_running = False
    if monitor_thread:
        monitor_thread.join(timeout=1)
    
    send_status("monitor_stopped")
    return {"success": True, "message": "Monitor stopped"}

def get_status():
    """Get current monitor status."""
    config = load_config()
    return {
        "success": True,
        "running": monitor_running,
        "currentProcess": current_process,
        "currentLayout": get_current_layout(),
        "loadedConfigs": len(config.sections())
    }

# ============================================================================
# Communication Functions
# ============================================================================

def send_status(event, *args):
    """Send status update to stdout."""
    status = {
        "type": "status",
        "event": event,
        "args": args,
        "timestamp": time.time()
    }
    print(json.dumps(status), flush=True)

def send_response(command, response):
    """Send command response to stdout."""
    response["command"] = command
    print(json.dumps(response), flush=True)

def process_command(line):
    """Process a single command from stdin."""
    try:
        cmd = json.loads(line)
        command = cmd.get("command")
        
        if command == "add_process":
            response = add_process(cmd.get("name"), cmd.get("language"))
        elif command == "remove_process":
            response = remove_process(cmd.get("name"))
        elif command == "get_config":
            response = get_config()
        elif command == "start_monitor":
            response = start_monitor()
        elif command == "stop_monitor":
            response = stop_monitor()
        elif command == "get_status":
            response = get_status()
        else:
            response = {"success": False, "error": f"Unknown command: {command}"}
        
        send_response(command, response)
    except json.JSONDecodeError as e:
        send_response("unknown", {"success": False, "error": f"Invalid JSON: {e}"})
    except Exception as e:
        send_response(command, {"success": False, "error": str(e)})

# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point."""
    if len(sys.argv) > 1 and sys.argv[1] == "--stdin":
        # Stdin mode - read commands from stdin
        send_status("ready")
        
        for line in sys.stdin:
            line = line.strip()
            if line:
                process_command(line)
    else:
        # Direct command mode
        print("Usage: python cli.py --stdin")
        print("Commands are sent via stdin in JSON format")

if __name__ == "__main__":
    main()
