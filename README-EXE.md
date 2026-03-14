# Elite Dangerous NEXT - Layout Manager

## 🚀 Быстрый Старт (.exe версия)

### Установка

1. **Скачайте релиз** с GitHub Releases
2. **Распакуйте** в удобную папку (например, `C:\Games\ED-Layout-Manager\`)
3. **Запустите** `launcher.bat` или `elite-dangerous-next.exe`

### Использование

1. **Запустите** `launcher.bat` - автоматически откроет браузер
2. **Добавьте процессы**:
   - `EliteDangerous64.exe` → English
   - `COVAS NEXT.exe` → Russian
   - `Qwen.exe` → Russian
3. **Нажмите** "Start Monitor"
4. **Готово!** Раскладка будет переключаться автоматически

### Горячие Клавиши

- **Ctrl+Alt+R** → Russian (когда браузер активен)
- **Ctrl+Alt+E** → English (когда браузер активен)

### Автозагрузка

Для автозапуска с Windows:

1. Нажмите `Win+R`
2. Введите `shell:startup`
3. Создайте ярлык для `launcher.bat` в этой папке

---

## 🔧 Ручная Сборка (для разработчиков)

### Требования

- Node.js 20+
- Python 3.8+
- Visual Studio Build Tools (для pkg)

### Сборка .exe

```bash
# Установить зависимости
npm install

# Собрать .exe
npm run build:exe
```

### Файлы

После сборки в `dist/`:
- `elite-dangerous-next.exe` - Основное приложение
- `public/` - Веб-интерфейс
- `layout-manager/` - Python CLI для переключения раскладки

---

## 📊 Функции

- ✅ Автоматическое переключение по процессу
- ✅ Авто-старт с приложением
- ✅ История переключений
- ✅ Статистика использования
- ✅ Горячие клавиши
- ✅ Логирование всех событий

---

## ⚠️ Известные Ограничения

1. **Горячие клавиши** работают только когда браузер активен
   - Решение: Используйте AutoHotKey для глобальных горячих клавиш
   
2. **Требуется Python** для работы Layout Manager
   - Установите Python 3.8+ https://www.python.org/downloads/

---

## 📞 Поддержка

- GitHub Issues: https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/issues
- Документация: https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/tree/main/builds/ELITE-DANGEROUS-NEXT

---

## 📄 Лицензия

MIT License
