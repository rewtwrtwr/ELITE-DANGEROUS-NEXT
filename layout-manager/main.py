"""
Layout Manager Pro - Автоматический переключатель раскладки клавиатуры.

GUI приложение для управления списком процессов и их раскладок.
Фоновый поток следит за активным процессом и переключает раскладку.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import configparser
import os
import threading
import time
import ctypes
from ctypes import wintypes
import psutil
import sys

# ============================================================================
# Windows API Константы
# ============================================================================

# LayoutID раскладок
LAYOUT_IDS = {
    "English": 0x4090409,  # English US
    "Russian": 0x4190419   # Russian
}

# Windows API константы
WM_INPUTLANGCHANGEREQUEST = 0x0050
HWND_BROADCAST = 0xFFFF

# Загружаем DLL
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# ============================================================================
# Windows API Функции
# ============================================================================

def get_foreground_window():
    """Получить дескриптор активного окна."""
    return user32.GetForegroundWindow()

def get_window_process_name(hwnd):
    """Получить имя процесса окна по дескриптору."""
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    
    try:
        import psutil
        process = psutil.Process(pid.value)
        return process.name()
    except:
        # Если psutil нет, используем ctypes
        return get_process_name_by_pid(pid.value)

def get_process_name_by_pid(pid):
    """Получить имя процесса по PID через ctypes."""
    from ctypes import windll, c_buffer, byref, c_ulong
    from ctypes.wintypes import DWORD, HANDLE
    
    PROCESS_QUERY_INFORMATION = 0x0400
    PROCESS_VM_READ = 0x0010
    
    kernel32 = windll.kernel32
    psapi = windll.psapi
    
    h_process = kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid)
    if not h_process:
        return ""
    
    exe_name = c_buffer(260)
    size = c_ulong(len(exe_name))
    
    if psapi.GetModuleBaseNameA(h_process, None, byref(exe_name), size):
        kernel32.CloseHandle(h_process)
        return exe_name.value.decode('utf-8', errors='ignore')
    
    kernel32.CloseHandle(h_process)
    return ""

def get_current_layout():
    """Получить текущую раскладку клавиатуры."""
    hwnd = get_foreground_window()
    hkl = user32.GetKeyboardLayout(hwnd)
    return hkl & 0xFFFFFFFF  # Маска для получения LayoutID

def switch_layout(layout_id):
    """Переключить раскладку клавиатуры."""
    # Отправляем сообщение активному окну
    hwnd = get_foreground_window()
    user32.PostMessageW(hwnd, WM_INPUTLANGCHANGEREQUEST, 0, layout_id)
    
    # Дублируем системно для надёжности
    time.sleep(0.05)
    user32.PostMessageW(HWND_BROADCAST, WM_INPUTLANGCHANGEREQUEST, 0, layout_id)

# ============================================================================
# Класс Монитора
# ============================================================================

class LayoutMonitor:
    """Фоновый монитор для переключения раскладки."""
    
    def __init__(self, config_file):
        self.config_file = config_file
        self.process_configs = {}
        self.running = False
        self.thread = None
        self.last_process = ""
        
    def load_config(self):
        """Загрузить конфигурацию из файла."""
        self.process_configs = {}
        
        if not os.path.exists(self.config_file):
            return
        
        config = configparser.ConfigParser()
        try:
            config.read(self.config_file, encoding='utf-8')
            for section in config.sections():
                layout_id_str = config.get(section, 'LayoutID', fallback='0x4090409')
                # Преобразуем hex строку в число
                layout_id = int(layout_id_str, 16) if layout_id_str.startswith('0x') else int(layout_id_str)
                self.process_configs[section.lower()] = layout_id
        except Exception as e:
            print(f"Error loading config: {e}")
    
    def start(self):
        """Запустить монитор."""
        self.running = True
        self.load_config()
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        
    def stop(self):
        """Остановить монитор."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
    
    def _monitor_loop(self):
        """Основной цикл мониторинга (каждые 500мс)."""
        while self.running:
            try:
                # Получаем активный процесс
                hwnd = get_foreground_window()
                process_name = get_window_process_name(hwnd).lower()
                
                # Проверяем: есть ли процесс в конфигурации
                if process_name in self.process_configs:
                    target_layout = self.process_configs[process_name]
                    current_layout = get_current_layout()
                    
                    # Переключаем ТОЛЬКО если раскладка не совпадает
                    if current_layout != target_layout:
                        switch_layout(target_layout)
                        self.last_process = process_name
                else:
                    self.last_process = ""
                    
            except Exception as e:
                print(f"Monitor error: {e}")
            
            time.sleep(0.5)  # 500мс


def kill_previous_instances():
    """Найти и завершить предыдущие экземпляры main.py (кроме текущего)."""
    current_pid = os.getpid()
    current_script = os.path.abspath(__file__)
    
    killed_count = 0
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Пропускаем текущий процесс
            if proc.info['pid'] == current_pid:
                continue
            
            # Проверяем имя процесса
            if proc.info['name'] and 'python' in proc.info['name'].lower():
                # Проверяем аргументы командной строки
                if proc.info['cmdline']:
                    cmdline = ' '.join(proc.info['cmdline']).lower()
                    if 'main.py' in cmdline or 'layout' in cmdline:
                        proc.terminate()
                        killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    return killed_count

# ============================================================================
# GUI Приложение
# ============================================================================

CONFIG_FILE = "config.ini"
AHK_SCRIPT = "monitor.ahk"

class LayoutManager:
    """Главный класс приложения Layout Manager Pro."""

    def __init__(self, root):
        """Инициализация GUI приложения."""
        self.root = root
        self.root.title("Layout Manager Pro")
        self.root.geometry("450x450")
        
        # Список процессов в памяти
        self.process_list = []
        
        # Монитор раскладки (Python версия)
        self.monitor = LayoutMonitor(CONFIG_FILE)
        
        # Загрузка конфигурации
        self.load_config()
        
        # Создание UI элементов
        self._create_widgets()
        
        # Обновление таблицы
        self.refresh_list()

    def _create_widgets(self):
        """Создание всех UI элементов."""
        # Фрейм для таблицы
        table_frame = tk.Frame(self.root)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Treeview таблица с процессами
        columns = ("Process Name", "Language")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings")
        self.tree.heading("Process Name", text="Process Name")
        self.tree.heading("Language", text="Language")
        self.tree.column("Process Name", width=250)
        self.tree.column("Language", width=150)
        
        # Скроллбар для таблицы
        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Фрейм для ввода
        input_frame = tk.Frame(self.root)
        input_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Поле ввода имени процесса
        tk.Label(input_frame, text="Process:").pack(side=tk.LEFT, padx=5)
        self.process_entry = tk.Entry(input_frame, width=30)
        self.process_entry.pack(side=tk.LEFT, padx=5)
        self.process_entry.insert(0, "EliteDangerous64.exe")
        
        # Выпадающий список языков
        tk.Label(input_frame, text="Language:").pack(side=tk.LEFT, padx=5)
        self.language_var = tk.StringVar()
        self.language_combo = ttk.Combobox(input_frame, textvariable=self.language_var, width=12)
        self.language_combo['values'] = ("English", "Russian")
        self.language_combo.current(0)
        self.language_combo.pack(side=tk.LEFT, padx=5)
        
        # Фрейм для кнопок
        button_frame = tk.Frame(self.root)
        button_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Кнопка "Добавить"
        self.add_button = tk.Button(button_frame, text="Добавить", command=self.add_process, width=10)
        self.add_button.pack(side=tk.LEFT, padx=3)
        
        # Кнопка "Удалить"
        self.delete_button = tk.Button(button_frame, text="Удалить", command=self.delete_selected, width=10)
        self.delete_button.pack(side=tk.LEFT, padx=3)
        
        # Кнопка "Сохранить"
        self.save_button = tk.Button(button_frame, text="Сохранить", command=self.save_config, width=10)
        self.save_button.pack(side=tk.LEFT, padx=3)
        
        # Кнопка "Запустить" (Python монитор)
        self.launch_button = tk.Button(button_frame, text="Запустить", command=self.start_monitor, width=10)
        self.launch_button.pack(side=tk.LEFT, padx=3)
        
        # Кнопка "Выход"
        self.exit_button = tk.Button(button_frame, text="Выход", command=self.exit_app, width=10, bg="#ff4444")
        self.exit_button.pack(side=tk.LEFT, padx=3)

    def load_config(self):
        """Загрузка конфигурации из config.ini."""
        if not os.path.exists(CONFIG_FILE):
            return
        
        config = configparser.ConfigParser()
        try:
            config.read(CONFIG_FILE, encoding='utf-8')
            self.process_list = []
            for section in config.sections():
                language = config.get(section, 'Language', fallback='English')
                layout_id = config.get(section, 'LayoutID', fallback='0x4090409')
                self.process_list.append({
                    "name": section,
                    "language": language,
                    "layout_id": layout_id
                })
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load config: {e}")
            self.process_list = []

    def save_config(self):
        """Сохранение конфигурации в config.ini."""
        config = configparser.ConfigParser()
        try:
            for process in self.process_list:
                config[process["name"]] = {
                    "Language": process["language"],
                    "LayoutID": process["layout_id"]
                }
            
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                config.write(f)
            
            messagebox.showinfo("Success", "Configuration saved successfully!")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save config: {e}")

    def add_process(self):
        """Добавление процесса в список."""
        process_name = self.process_entry.get().strip()
        language = self.language_var.get()
        
        # Валидация: имя должно заканчиваться на .exe
        if not process_name.lower().endswith('.exe'):
            messagebox.showwarning("Warning", "Process name must end with .exe")
            return
        
        # Проверка на дубликат
        for process in self.process_list:
            if process["name"].lower() == process_name.lower():
                messagebox.showwarning("Warning", "Process already exists in the list")
                return
        
        # Добавление в список
        layout_id = f"0x{LAYOUT_IDS[language]:08X}"
        self.process_list.append({
            "name": process_name,
            "language": language,
            "layout_id": layout_id
        })
        
        self.refresh_list()

    def delete_selected(self):
        """Удаление выбранного процесса из списка."""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a process to delete")
            return
        
        for item in selected:
            values = self.tree.item(item, 'values')
            process_name = values[0]
            
            # Удаление из списка в памяти
            self.process_list = [p for p in self.process_list if p["name"] != process_name]
        
        self.refresh_list()

    def refresh_list(self):
        """Обновление таблицы процессов."""
        # Очистка таблицы
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Заполнение таблицы
        for process in self.process_list:
            self.tree.insert("", tk.END, values=(process["name"], process["language"]))

    def start_monitor(self):
        """Запуск Python монитора раскладки."""
        # Сохранение перед запуском
        self.save_config()
        
        # Остановка предыдущего монитора если работает
        if self.monitor.running:
            self.monitor.stop()
        
        # Убийство предыдущих экземпляров main.py
        killed = kill_previous_instances()
        
        # Запуск нового монитора
        self.monitor.start()
        
        msg = "Layout Monitor started!"
        if killed > 0:
            msg += f"\n\nKilled {killed} previous instance(s)."
        
        messagebox.showinfo("Success", msg)

    def exit_app(self):
        """Полный выход из приложения."""
        # Остановка монитора
        if self.monitor.running:
            self.monitor.stop()
        
        # Закрытие окна
        self.root.quit()
        self.root.destroy()
        
        # Завершение процесса
        os._exit(0)


def main():
    """Точка входа приложения."""
    root = tk.Tk()
    app = LayoutManager(root)
    root.mainloop()


if __name__ == "__main__":
    main()
