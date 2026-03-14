# Elite Dangerous NEXT - Layout Manager
## 📦 Дистрибутив

### 🚀 Запуск Приложения

**Вариант 1: Через launch.bat (рекомендуется)**
```bash
# Дважды кликните на launch.bat
# Автоматически проверит Python, запустит сервер и откроет браузер
```

**Вариант 2: Ручной запуск**
```bash
# Установите зависимости (первый раз)
npm install

# Запустите сборку
npm run build

# Запустите сервер
node dist/index.js

# Откройте браузер
http://localhost:3000
```

**Вариант 3: Установщик Windows**
```bash
# Скомпилируйте installer.nsi с помощью NSIS
# Запустите EliteDangerous-LayoutManager-Setup.exe
# Следуйте инструкциям установщика
```

---

### 📁 Структура Дистрибутива

```
ELITE-DANGEROUS-NEXT/
├── launch.bat                 ← Лаунчер (рекомендуется)
├── dist/
│   ├── index.js               ← Сервер
│   ├── client/                ← Веб-интерфейс
│   └── services/              ← Сервисы
├── public/                    ← Статические файлы
├── layout-manager/            ← Python CLI
│   ├── cli.py
│   └── config.ini
└── installer.nsi              ← Скрипт установщика
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
