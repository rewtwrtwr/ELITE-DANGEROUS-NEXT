# Elite Dangerous NEXT - Layout Manager
## 📦 Дистрибутив

### 🚀 Запуск Готового Приложения

**Вариант 1: Через .exe (рекомендуется)**
```bash
# Просто запустите
elite-dangerous-next.exe
```

**Вариант 2: Через launcher.bat**
```bash
# Автоматически откроет браузер
launcher.bat
```

**Вариант 3: Через npm (для разработки)**
```bash
npm install
npm run dev
```

---

### 📁 Структура Дистрибутива

```
dist/
├── elite-dangerous-next.exe  # Основное приложение (74MB)
├── public/                    # Веб-интерфейс
│   ├── assets/
│   │   ├── client.css
│   │   └── client.js
│   ├── index.html
│   └── ...
├── layout-manager/            # Python CLI
│   ├── cli.py
│   └── config.ini
└── launcher.bat               # Лаунчер
```

---

### ⚙️ Настройка

1. **Откройте** http://localhost:3000
2. **Добавьте процессы**:
   - `EliteDangerous64.exe` → English
   - `COVAS NEXT.exe` → Russian
3. **Включите** "Auto-start monitoring"
4. **Нажмите** "Start Monitor"

---

### 🔧 Автозагрузка

**Способ 1: Через планировщик заданий**
1. Откройте "Планировщик заданий"
2. Создайте задачу → Запускать `launcher.bat` при входе в систему

**Способ 2: Через папку автозагрузки**
1. `Win+R` → `shell:startup`
2. Создайте ярлык для `launcher.bat`

---

### 🎮 Горячие Клавиши

| Комбинация | Действие |
|------------|----------|
| Ctrl+Alt+R | Russian |
| Ctrl+Alt+E | English |

> ⚠️ Работают только когда браузер активен

---

### 📊 Статистика

Нажмите **"📊 Statistics"** для просмотра:
- Всего переключений
- По языкам
- По процессам
- Последнее переключение

---

### 🐛 Решение Проблем

**Проблема**: .exe не запускается
- **Решение**: Установите Visual C++ Redistributable https://aka.ms/vs/17/release/vc_redist.x64.exe

**Проблема**: Python не найден
- **Решение**: Установите Python 3.8+ https://www.python.org/downloads/

**Проблема**: Порт 3000 занят
- **Решение**: Измените PORT в .env или закройте другое приложение

---

### 📞 Поддержка

- Issues: https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/issues
- Версия: 1.0.0-beta
