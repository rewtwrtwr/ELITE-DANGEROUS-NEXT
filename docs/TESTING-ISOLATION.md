# Testing Isolation Guide

**Дата:** 2026-02-28  
**Треки:** EDN-008  
**Статус:** Complete

---

## 📋 Обзор

Это руководство описывает как тестовые данные изолированы от продакшен-данных в ELITE-DANGEROUS-NEXT.

---

## 🎯 Проблема

До реализации изоляции:
- Тесты использовали ту же БД что и продакшен (`data/elite.db`)
- Journal parser читал реальные файлы журналов из Saved Games
- Тестовые события смешивались с реальными игровыми данными
- Статистика пользователей включала тестовые события

---

## ✅ Решение

### Environment-Based Isolation

Приложение использует переменную окружения `NODE_ENV` для разделения режимов:

| Переменная | Test Mode | Production Mode |
|------------|-----------|-----------------|
| `NODE_ENV` | `test` | `production` или unset |
| `DATABASE_PATH` | Auto-generated | `data/elite.db` |
| `JOURNAL_PATH` | `tests/fixtures/journals` | Saved Games/Elite Dangerous |
| `LOG_LEVEL` | `debug` | `info` |

---

## 🔧 Конфигурация

### Базовая конфигурация

```typescript
import { getConfig } from './utils/config.js';

const config = getConfig();

console.log(`Environment: ${config.isTest ? 'test' : 'production'}`);
console.log(`Database: ${config.dbPath}`);
console.log(`Journal: ${config.journalPath}`);
```

### Переменные окружения

#### Test Mode

```bash
export NODE_ENV=test
npm test
```

**Результат:**
- БД: `data/test-<timestamp>.db` (авто-удаление после тестов)
- Журналы: `tests/fixtures/journals/`
- Логи: debug level

#### Production Mode

```bash
export NODE_ENV=production
npm start
```

**Результат:**
- БД: `data/elite.db`
- Журналы: `%USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous`
- Логи: info level

#### Custom Path Override

```bash
export DATABASE_PATH=/custom/path/custom.db
export JOURNAL_PATH=/custom/journals
npm start
```

---

## 📁 Структура тестовых данных

```
tests/
└── fixtures/
    └── journals/
        ├── Journal.test.log      # Basic test events
        ├── Journal.fsd-jumps.log # FSD jump tests
        └── Journal.combat.log    # Combat tests
```

### Пример тестового журнала

```json
{"timestamp":"2026-02-28T12:00:00Z","event":"FileHeader","Part":"1"}
{"timestamp":"2026-02-28T12:01:00Z","event":"Commander","Name":"TestCMDR"}
{"timestamp":"2026-02-28T12:02:00Z","event":"FSDJump","StarSystem":"TestSystem"}
```

---

## 🛡️ Validation Guards

### Production Validation

```typescript
import { validateProductionConfig } from './utils/config.js';

// Throw error if running production with test config
validateProductionConfig();
```

### Test Detection

```typescript
import { getConfig } from './utils/config.js';

const config = getConfig();
if (config.isTest) {
  // Use test-specific logic
}
```

---

## 🧪 Запуск тестов

### Все тесты

```bash
npm test
```

### Тесты с явным указанием режима

```bash
NODE_ENV=test npm test
```

### Тесты с кастомной БД

```bash
NODE_ENV=test DATABASE_PATH=data/custom-test.db npm test
```

---

## ⚠️ Troubleshooting

### Ошибка: "Cannot run in production mode with NODE_ENV=test"

**Причина:** Попытка запуска продакшена с тестовой конфигурацией

**Решение:**
```bash
# Для продакшена
unset NODE_ENV
# или
export NODE_ENV=production
npm start
```

### Ошибка: "Journal path does not exist"

**Причина:** Elite Dangerous не установлен или путь неверный

**Решение:**
```bash
# Проверить путь
echo $JOURNAL_PATH  # Linux/Mac
echo %JOURNAL_PATH% # Windows

# Использовать фикстуры для тестов
export NODE_ENV=test
npm test
```

### Тесты создают файлы в data/

**Причина:** NODE_ENV не установлен в test

**Решение:**
```bash
# Убедиться что NODE_ENV=test
echo $NODE_ENV  # Должно быть "test"

# Запустить тесты
NODE_ENV=test npm test
```

---

## 📊 Сравнение режимов

| Аспект | Test Mode | Production Mode |
|--------|-----------|-----------------|
| **БД файл** | Временный, удаляется | Постоянный `elite.db` |
| **Журналы** | Фикстуры | Реальные файлы игры |
| **События** | Тестовые | Реальные игровые |
| **Логи** | Debug (подробные) | Info (краткие) |
| **Порт** | 3000 (или свободный) | 3000 (или свободный) |

---

## ✅ Checklist для разработчиков

### Перед запуском тестов

- [ ] `NODE_ENV=test` установлен
- [ ] Тестовые фикстуры существуют
- [ ] Продакшен БД закрыта

### Перед деплоем

- [ ] `NODE_ENV=production` установлен
- [ ] `validateProductionConfig()` проходит
- [ ] Тестовые файлы удалены из `data/`

### При отладке

- [ ] Использовать отдельную тестовую БД
- [ ] Не модифицировать продакшен данные
- [ ] Очищать тестовые файлы после отладки

---

## 🔗 Ссылки

- [Config Module](../src/utils/config.ts)
- [Test Fixtures](../tests/fixtures/)
- [EDN-008 Track](../conductor/tracks/EDN-008-log-isolation/)

---

**После следования этому руководству — тестовые данные полностью изолированы от продакшена!**
