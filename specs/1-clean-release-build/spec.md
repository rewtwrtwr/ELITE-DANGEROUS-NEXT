# Feature Specification: Clean Release Build

> **Feature ID:** FR-7  
> **Branch:** `1-clean-release-build`  
> **Status:** ✅ Implemented (v1.0.1-pre)  
> **Created:** 2 марта 2026 г.

---

## 📋 Executive Summary

### What

Система сборки и публикации релизов должна автоматически исключать метаданные разработки (спецификации, планы, треки Spec-Driven Development) из итоговых дистрибутивов.

### Why

- **Безопасность:** Внутренняя документация разработки не должна попадать в публичные пакеты
- **Чистота дистрибутива:** Пользователи получают только необходимые файлы для работы приложения
- **Предсказуемость:** Сборка содержит только производственные артефакты

### Scope

- Исключение папок `.specify/`, `conductor/`, `specs/` из npm-пакета
- Автоматическая валидация чистоты сборки перед публикацией
- Сохранение документации в dev-окружении

---

## 👥 User Scenarios

### Scenario 1: Публикация npm-пакета

**Actor:** Разработчик / Maintainer

**Flow:**
1. Разработчик запускает `npm publish`
2. Автоматически срабатывает `prepublishOnly` hook
3. Скрипт валидации проверяет отсутствие папок разработки
4. При успешной проверке публикация продолжается
5. При неудаче — публикация блокируется с ошибкой

**Expected Outcome:** Пакет опубликован без метаданных разработки

---

### Scenario 2: Локальная валидация сборки

**Actor:** Разработчик

**Flow:**
1. Разработчик запускает `npm run validate:clean`
2. Скрипт проверяет наличие `.npmignore`
3. Скрипт проверяет отсутствие forbidden folders в `dist/`
4. Выводится отчет о статусе валидации

**Expected Outcome:** Разработчик видит, готов ли билд к публикации

---

### Scenario 3: Сборка релиза

**Actor:** CI/CD Pipeline

**Flow:**
1. Pipeline запускает `npm run build`
2. Создается папка `dist/`
3. Pipeline запускает валидацию чистоты
4. При успехе — артефакты сохраняются
5. При неудаче — билд помечается как failed

**Expected Outcome:** Релизный артефакт содержит только необходимые файлы

---

## ✅ Functional Requirements

### FR-CLEAN-001: Исключение папок разработки из npm-пакета

**Описание:** Файл `.npmignore` должен явно исключать папки метаданных Spec-Driven Development

**Критерии приемки:**
- [ ] `.npmignore` содержит правило `.specify/`
- [ ] `.npmignore` содержит правило `conductor/`
- [ ] `.npmignore` содержит правило `specs/`
- [ ] `.npmignore` содержит правило `track-docs/`

---

### FR-CLEAN-002: Автоматическая валидация перед публикацией

**Описание:** Скрипт `prepublishOnly` должен автоматически запускаться перед `npm publish`

**Критерии приемки:**
- [ ] `package.json` содержит скрипт `prepublishOnly`
- [ ] `prepublishOnly` вызывает скрипт валидации
- [ ] При неудачной валидации публикация блокируется (exit code ≠ 0)

---

### FR-CLEAN-003: Валидация отсутствия папок в dist/

**Описание:** Скрипт валидации должен проверять, что папка `dist/` не содержит метаданных разработки

**Критерии приемки:**
- [ ] Проверка отсутствия `.specify/` в `dist/`
- [ ] Проверка отсутствия `conductor/` в `dist/`
- [ ] Проверка отсутствия `specs/` в `dist/`
- [ ] При обнаружении — ошибка с указанием нарушенного правила

---

### FR-CLEAN-004: Ручной запуск валидации

**Описание:** Разработчик должен иметь возможность запустить валидацию вручную

**Критерии приемки:**
- [ ] `package.json` содержит скрипт `validate:clean`
- [ ] Скрипт выводит понятный отчет о статусе
- [ ] Exit code = 0 при успехе, ≠ 0 при неудаче

---

### FR-CLEAN-005: Документирование правил исключения

**Описание:** Список исключаемых файлов должен быть задокументирован

**Критерии приемки:**
- [ ] `.npmignore` содержит комментарии для каждой группы правил
- [ ] CONTRIBUTING.md содержит раздел о чистоте сборки (⏳ Pending)

---

## 🎯 Success Criteria

### Measurable Outcomes

| Критерий | Метрика | Target |
|----------|---------|--------|
| **Чистота пакета** | Отсутствие папок SDD в npm-пакете | 100% |
| **Автоматизация** | Валидация запускается автоматически перед публикацией | ✅ Да |
| **Время валидации** | Время выполнения скрипта валидации | < 2 секунды |
| **Понятность ошибок** | Сообщение об ошибке содержит путь к нарушенному правилу | ✅ Да |

### User-Focused Outcomes

- Разработчик может одной командой проверить готовность билда к публикации
- Публикация невозможна без прохождения валидации (защита от человеческой ошибки)
- Релизный пакет содержит только файлы, необходимые для работы приложения

---

## 📦 Key Entities

| Entity | Description |
|--------|-------------|
| **.npmignore** | Файл правил исключения для npm-пакета |
| **validate-clean-build.mjs** | Скрипт валидации чистоты сборки |
| **prepublishOnly** | npm hook для автоматической валидации |
| **dist/** | Папка релизной сборки |
| **.specify/, conductor/, specs/** | Папки метаданных разработки (исключаются) |

---

## ⚠️ Assumptions

1. **npm используется для публикации:** Проект публикуется как npm-пакет (даже если `private: true` сейчас)
2. **dist/ создается перед валидацией:** Скрипт сборки (`npm run build`) должен быть выполнен до валидации
3. **Node.js >= 20:** Скрипт валидации использует ES modules

---

## 🔍 Edge Cases

### Edge Case 1: dist/ не существует

**Behavior:** Скрипт выводит warning, но не считает это ошибкой (валидация конфигурации, не билда)

---

### Edge Case 2: .npmignore не существует

**Behavior:** Скрипт возвращает ошибку с рекомендацией создать файл

---

### Edge Case 3: Частичное отсутствие правил

**Behavior:** Скрипт проверяет наличие обязательного минимума правил (`.specify/`, `conductor/`, `node_modules/`)

---

## 📝 Notes

### Implementation Summary

Реализация выполнена в ветке `v1.0.1-pre`:

| Артефакт | Путь | Статус |
|----------|------|--------|
| **.npmignore** | `.npmignore` | ✅ Created |
| **Validate Script** | `scripts/validate-clean-build.mjs` | ✅ Created |
| **package.json scripts** | `prepublishOnly`, `validate:clean` | ✅ Added |
| **Spec Update** | `.specify/spec.md` (FR-7) | ✅ Updated |
| **Product Definition** | `conductor/product.md` (FR-7, AC-4) | ✅ Updated |

### Commits

```
fc91b98 docs: Update EDN-010 track with Clean Release artifacts
b8612d7 feat: Add Clean Release build isolation (FR-7)
```

---

## ✅ Specification Quality Checklist

**Purpose:** Validate specification completeness and quality before proceeding to planning  
**Created:** 2026-03-02  
**Feature:** [spec.md](./spec.md)

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

### Notes

- ✅ All items passed validation
- ✅ Feature implemented and tested in v1.0.1-pre branch
