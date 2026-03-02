# Technical Plan: Clean Release Build

> **Feature ID:** FR-7  
> **Plan Version:** 1.0.0  
> **Created:** 2 марта 2026 г.  
> **Status:** ✅ Implemented (Brownfield Documentation)  
> **Branch:** `v1.0.1-pre`

---

## 📋 Executive Summary

### Objective

Задокументировать техническую архитектуру решения FR-7 (Clean Release Build) для обеспечения согласованности при будущих изменениях и поддержки Brownfield-разработки.

### Current State

Решение **уже реализовано** в ветке `v1.0.1-pre`. Этот план документирует существующую архитектуру и определяет направления для будущих улучшений.

---

## 🏗️ Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Environment                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Source Code (src/)                                       │  │
│  │  + Metadata (.specify/, conductor/, specs/)               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Build Process (npm run build)                            │  │
│  │  - tsc compilation                                        │  │
│  │  - vite build (client)                                    │  │
│  │  - Output: dist/                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Validation (prepublishOnly hook)                         │  │
│  │  - validate-clean-build.mjs                               │  │
│  │  - Check .npmignore rules                                 │  │
│  │  - Verify dist/ cleanliness                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┴───────────────┐                   │
│              ▼                               ▼                   │
│  ┌──────────────────────┐      ┌──────────────────────────┐     │
│  │  PASS: Publish       │      │  FAIL: Block & Report    │     │
│  │  - npm publish       │      │  - Exit code 1           │     │
│  │  - Package clean     │      │  - Error messages        │     │
│  └──────────────────────┘      └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Components

### Component 1: .npmignore

**File:** `.npmignore`  
**Purpose:** Правила исключения файлов из npm-пакета  
**Lines:** 45

**Structure:**
```
# Development Metadata (Spec-Driven Development)
.specify/
conductor/
specs/
track-docs/

# Build outputs
dist/
build/
release/
out/

# Dependencies
node_modules/

# Test files
__tests__/
*.test.ts
*.spec.ts
coverage/

# Development tools
.vite/
.cache/

# IDE
.idea/
.vscode/

# Documentation (exclude from npm package)
*.md
!README.md
CHANGELOG.md
CONTRIBUTING.md
LICENSE

# Config files
tsconfig.client.json
tsconfig.node.json
vite.config.ts
jest.config.mjs

# Scripts
scripts/
```

**Key Decisions:**
- Явное исключение папок SDD (`.specify/`, `conductor/`, `specs/`)
- Исключение test-файлов и coverage
- Сохранение только `README.md` из документации
- Исключение scripts/ из финального пакета

---

### Component 2: Validation Script

**File:** `scripts/validate-clean-build.mjs`  
**Purpose:** Автоматическая валидация чистоты сборки  
**Lines:** 120  
**Runtime:** Node.js 20+ (ES Modules)

**Architecture:**
```javascript
┌─────────────────────────────────────────────────────────┐
│              validate-clean-build.mjs                   │
├─────────────────────────────────────────────────────────┤
│ 1. Configuration                                        │
│    - FORBIDDEN_FOLDERS: [.specify, conductor, ...]     │
│    - REQUIRED_NPM_IGNORE_ENTRIES: [...]                │
│                                                         │
│ 2. Validation Checks                                    │
│    ✓ .npmignore exists                                  │
│    ✓ .npmignore contains required entries               │
│    ✓ dist/ does not contain forbidden folders           │
│                                                         │
│ 3. Reporting                                            │
│    - Color-coded console output                         │
│    - Pass/Fail summary                                  │
│    - Exit code (0 = pass, 1 = fail)                     │
└─────────────────────────────────────────────────────────┘
```

**Functions:**
- `log(message, color)` - Цветной вывод
- `error(message)` - Вывод ошибки (красный)
- `success(message)` - Вывод успеха (зеленый)
- `warn(message)` - Предупреждение (желтый)
- `info(message)` - Информация (синий)

**Validation Flow:**
```
Start
  │
  ├─► Check .npmignore exists ──┬─► NO ──► ERROR (exit 1)
  │                              │
  │                              └─► YES
  │                                   │
  ├─► Check required entries ──┬─► Missing ──► ERROR (exit 1)
  │                              │
  │                              └─► All present
  │                                   │
  ├─► Check dist/ (if exists) ─┬─► Contains forbidden ──► ERROR (exit 1)
  │                              │
  │                              └─► Clean / Not exists
  │                                   │
  └─► All checks passed ───────────────► SUCCESS (exit 0)
```

---

### Component 3: package.json Scripts

**File:** `package.json`  
**Changes:** Added 2 scripts

```json
{
  "scripts": {
    "prepublishOnly": "node scripts/validate-clean-build.mjs",
    "validate:clean": "node scripts/validate-clean-build.mjs"
  }
}
```

**Integration Points:**
- `prepublishOnly` - Автоматический запуск перед `npm publish`
- `validate:clean` - Ручной запуск для проверки

---

### Component 4: Specification Updates

**Files Updated:**
1. `.specify/spec.md` - Добавлено FR-7 (6 требований)
2. `conductor/product.md` - Добавлено FR-7 и AC-4
3. `conductor/tracks/EDN-010/index.md` - Обновлен трек

---

## 📊 Implementation Timeline

### Phase 1: Core Implementation (✅ Complete)

| Task | Component | Status | Commit |
|------|-----------|--------|--------|
| Create .npmignore | Configuration | ✅ | b8612d7 |
| Create validate script | Tooling | ✅ | b8612d7 |
| Add npm scripts | package.json | ✅ | b8612d7 |
| Update specifications | Documentation | ✅ | b8612d7, fc91b98 |
| Create feature spec | Documentation | ✅ | a747f08 |

### Phase 2: Documentation (⏳ Pending)

| Task | Priority | Status |
|------|----------|--------|
| Update CONTRIBUTING.md | P2 | ⏳ Pending |
| Add README section | P3 | ⏳ Pending |

### Phase 3: Enhancements (⏳ Future)

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| CI/CD integration | P1 | GitHub Actions validation |
| Extended validation | P2 | Check for forbidden file patterns |
| Performance optimization | P3 | Parallel validation checks |

---

## 🔍 Technical Decisions

### Decision 1: ES Modules vs CommonJS

**Choice:** ES Modules (`.mjs`)  
**Rationale:**
- Проект использует `"type": "module"` в package.json
- Современный стандарт JavaScript
- Лучшая поддержка tree-shaking

**Alternatives Considered:**
- CommonJS (`.js`) - Отклонено из-за несоответствия проекту
- TypeScript (`.ts`) - Избыточно для простого скрипта

---

### Decision 2: Validation Scope

**Choice:** Validate configuration, not build output  
**Rationale:**
- Быстрая проверка (< 2 сек)
- Проверка намерений, а не результатов
- Раннее обнаружение проблем

**Alternatives Considered:**
- Validate actual npm pack output - Отклонено (медленнее, сложнее)
- Pre-publish dry run - Отклонено (требует дополнительного инструмента)

---

### Decision 3: Forbidden Folders List

**Choice:** Hardcoded list in script + .npmignore  
**Rationale:**
- Явность и прозрачность
- Двойная защита (script + npm)
- Легко поддерживать

**Alternatives Considered:**
- Dynamic from .npmignore - Отклонено (сложнее, менее явно)
- Configuration file - Отклонено (избыточно для 4 папок)

---

## 🧪 Testing Strategy

### Unit Testing

**Not Required:** Скрипт валидации - это инфраструктурный инструмент  
**Manual Testing:**
```bash
# Test 1: Validate current state (should pass)
npm run validate:clean

# Test 2: Test failure detection
# Temporarily add .specify to dist/ and run validation

# Test 3: Test prepublishOnly hook
npm publish --dry-run 2>&1 | grep -i "validate"
```

### Integration Testing

**CI/CD Pipeline (Future):**
```yaml
# .github/workflows/validate.yml (planned)
jobs:
  validate-clean:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run validate:clean
```

---

## 📦 Dependencies

### Runtime Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 20.0.0 | ES Modules support |
| fs (builtin) | - | File system operations |
| path (builtin) | - | Path manipulation |
| url (builtin) | - | ES module dirname |

### Development Dependencies

None (script uses only Node.js builtins)

---

## ⚠️ Known Limitations

### Limitation 1: No CI/CD Integration

**Impact:** Валидация работает только локально  
**Workaround:** Ручной запуск перед push  
**Future:** GitHub Actions workflow

---

### Limitation 2: No Pattern Matching

**Impact:** Только явные имена папок, без wildcard  
**Rationale:** Простота и ясность  
**Future:** Regex support if needed

---

### Limitation 3: No Fix Command

**Impact:** Только валидация, без автоисправления  
**Rationale:** Безопасность (не удалять файлы автоматически)  
**Future:** `--fix` flag with confirmation

---

## 🚀 Deployment Plan

### Pre-Deployment Checklist

- [x] `.npmignore` created with all required entries
- [x] Validation script tested locally
- [x] `prepublishOnly` hook configured
- [x] Documentation updated
- [ ] CONTRIBUTING.md updated (pending)
- [ ] CI/CD workflow created (future)

### Rollback Plan

**If validation breaks publishing:**
1. Temporarily remove `prepublishOnly` from package.json
2. Publish with manual validation
3. Fix validation script
4. Re-add hook

**Rollback Commands:**
```bash
# Temporary disable hook
npm config set ignore-scripts true
npm publish
npm config set ignore-scripts false
```

---

## 📈 Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Validation time | < 2 seconds | `time npm run validate:clean`` |
| False positive rate | 0% | Manual verification |
| False negative rate | 0% | Test with forbidden files |

### User Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Developer satisfaction | > 8/10 | Survey |
| Time saved per release | > 5 minutes | Time tracking |
| Accidental publishes prevented | 100% | Incident tracking |

---

## 🔗 References

### Related Documents

- [Feature Specification](../spec.md)
- [Quality Checklist](../checklists/requirements.md)
- [Product Definition](../../conductor/product.md)
- [Main Specification](../../.specify/spec.md)

### Related Commits

- `b8612d7` - feat: Add Clean Release build isolation (FR-7)
- `fc91b98` - docs: Update EDN-010 track with Clean Release artifacts
- `a747f08` - docs: Add feature spec for FR-7 Clean Release Build

### External Resources

- [npm publish documentation](https://docs.npmjs.com/cli/commands/npm-publish)
- [npm scripts documentation](https://docs.npmjs.com/cli/using-npm/scripts)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)

---

## 📝 Maintenance Notes

### Adding New Forbidden Folders

1. Add to `.npmignore`:
   ```
   new-folder/
   ```

2. Add to `scripts/validate-clean-build.mjs`:
   ```javascript
   const FORBIDDEN_FOLDERS = [
     '.specify',
     'conductor',
     'specs',
     'track-docs',
     'new-folder', // Add here
   ];
   ```

3. Update this plan's "Forbidden Folders List" section

4. Test:
   ```bash
   npm run validate:clean
   ```

### Updating Required .npmignore Entries

1. Edit `REQUIRED_NPM_IGNORE_ENTRIES` array in script
2. Update `.npmignore` file
3. Re-run validation
4. Update this plan

---

**Plan Status:** ✅ Complete (Brownfield Documentation)  
**Next Phase:** `/speckit.tasks` for future enhancements  
**Last Updated:** 2026-03-02
