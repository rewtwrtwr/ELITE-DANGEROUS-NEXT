# Contributing to Elite Dangerous NEXT

**Version:** 1.0.0-beta  
**Last Updated:** 2026-02-28

---

## 🤝 Welcome!

Thank you for your interest in contributing to Elite Dangerous NEXT! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Making Changes](#-making-changes)
- [Testing](#-testing)
- [Submitting Changes](#-submitting-changes)
- [Code Review](#-code-review)
- [Style Guide](#-style-guide)
- [Clean Release Build](#-clean-release-build)

---

## 🌟 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional and on-topic

---

## 🚀 Getting Started

### 1. Fork the Repository

```bash
# Click "Fork" on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/elite-dangerous-next.git
cd elite-dangerous-next
```

### 2. Set Upstream

```bash
# Add upstream remote
git remote add upstream https://github.com/yourusername/elite-dangerous-next.git

# Verify
git remote -v
```

### 3. Create Branch

```bash
# Always branch from main/develop
git checkout v1.0.0-beta

# Create your feature branch
git checkout -b feature/your-feature-name
```

---

## 💻 Development Setup

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
# Copy example
cp .env.example .env

# Edit for development
# Set NODE_ENV=development
# Set LOG_LEVEL=debug
```

### Verify Setup

```bash
# Run tests
npm test

# Expected: 66/66 passing
```

---

## 🔧 Making Changes

### 1. Make Your Changes

- Follow the existing code style
- Add comments where necessary
- Update documentation if needed

### 2. Run Linter

```bash
npm run lint

# Fix any issues
npm run lint -- --fix
```

### 3. Run Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Specific test file
npm test -- DatabaseManager.test.ts
```

**Requirements:**
- ✅ All tests must pass (66/66)
- ✅ No linting errors
- ✅ Coverage ≥60%

### 4. Build

```bash
npm run build

# Verify no errors
```

---

## 🧪 Testing Guidelines

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { dbManager } from '../../db/DatabaseManager.js';
import { eventRepository } from '../../db/EventRepository.js';

describe('YourFeature', () => {
  beforeEach(() => {
    process.env.TEST_DB_PATH = ':memory:';
    dbManager.init();
  });

  afterEach(() => {
    dbManager.close();
  });

  it('should do something', () => {
    // Your test
    expect(true).toBe(true);
  });
});
```

### Test Categories

| Type | Location | Database | Purpose |
|------|----------|----------|---------|
| **Unit** | `src/__tests__/unit/` | `:memory:` | Test individual functions |
| **Integration** | `src/__tests__/integration/` | `:memory:` | Test API endpoints |

---

## 📤 Submitting Changes

### 1. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

# Examples
feat(api): add new events endpoint
fix(database): resolve connection pooling issue
docs(readme): update installation instructions
test(jest): improve test isolation
chore(deps): update better-sqlite3 to v12.6.2
```

### 2. Commit Changes

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat(your-feature): add amazing feature"

# Push to your fork
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template:
   - **Description:** What does this PR do?
   - **Type:** Feature / Bug Fix / Documentation / Refactor
   - **Testing:** How was it tested?
   - **Checklist:**
     - [ ] Tests pass (66/66)
     - [ ] Lint passes
     - [ ] Documentation updated
     - [ ] No breaking changes (or documented)

---

## 🔍 Code Review Process

### What We Look For

- ✅ Code quality and style
- ✅ Test coverage
- ✅ Documentation
- ✅ Performance impact
- ✅ Security implications

### Review Timeline

- **Initial Review:** Within 48 hours
- **Feedback:** Constructive and specific
- **Revisions:** As needed
- **Merge:** After approval

### Review Responses

**Approved:**
```
✅ LGTM! Merging now.
```

**Changes Requested:**
```
Thanks for the PR! Could you please:
1. Fix the linting error in line 42
2. Add a test for edge case X
3. Update the documentation
```

**Questions:**
```
Interesting approach! Can you explain why you chose X over Y?
```

---

## 📏 Style Guide

### TypeScript

```typescript
// Use strict mode
// Explicit types for function parameters and returns
// Interfaces for objects

interface EventData {
  event_id: string;
  timestamp: string;
  event_type: string;
}

function processEvent(event: EventData): boolean {
  // Implementation
  return true;
}
```

### Naming Conventions

```typescript
// Classes: PascalCase
class DatabaseManager { }

// Functions/Variables: camelCase
function processData() { }
const eventData = { };

// Constants: UPPER_SNAKE_CASE
const MAX_EVENTS = 1000;

// Files: camelCase or PascalCase (for components)
DatabaseManager.ts
App.tsx
```

### Code Organization

```typescript
// 1. Imports
import { describe, it, expect } from '@jest/globals';
import fs from 'fs';

// 2. Constants
const DB_PATH = 'data/elite.db';

// 3. Classes/Functions
export class DatabaseManager { }

// 4. Exports
export default DatabaseManager;
```

---

## 🧹 Clean Release Build

### What is Clean Release?

Our build process automatically excludes development metadata from published npm packages. This ensures that users receive only the files necessary to run the application, without internal documentation, specifications, or development tools.

### Why This Matters

- **Security:** Internal documentation (specifications, plans, meeting notes) doesn't leak to public packages
- **Cleanliness:** Users get a minimal, focused distribution without unnecessary files
- **Predictability:** Every build produces consistent, verified output
- **Professionalism:** Clean packages reflect quality and attention to detail

### Excluded Folders

The following folders are **automatically excluded** from npm packages and release builds:

| Folder | Purpose | Why Excluded |
|--------|---------|--------------|
| `.specify/` | Spec-Driven Development specifications | Internal dev documentation |
| `conductor/` | Project tracking, plans, and workflows | Internal project management |
| `specs/` | Feature specifications | Development artifacts |
| `track-docs/` | Track documentation | Internal documentation |
| `scripts/` | Build and utility scripts | Not needed at runtime |
| `node_modules/` | Dependencies | Installed separately by npm |
| `__tests__/` | Test files | Not needed in production |
| `coverage/` | Test coverage reports | Development artifact |
| `logs/` | Log files | Runtime-generated, not distributed |
| `data/*.db` | Database files | User data, not part of package |

### Validation

Before publishing any package, **always** run the clean build validation:

```bash
# Run validation (should complete in < 2 seconds)
npm run validate:clean

# Expected output:
# ℹ️  Validating clean build configuration...
# ✅ .npmignore file exists
# ✅ .npmignore contains: .specify/
# ✅ .npmignore contains: conductor/
# ✅ .npmignore contains: node_modules/
# ✅ Clean build validation PASSED
# Ready for publication! 🚀
```

**What validation checks:**
1. `.npmignore` file exists
2. `.npmignore` contains required exclusion entries
3. `dist/` folder (if exists) doesn't contain forbidden folders

### Automatic Validation

Validation runs **automatically** before `npm publish` via the `prepublishOnly` hook. If validation fails, publication is **blocked**:

```bash
npm publish
# → Runs: npm run validate:clean
# → If PASS: Continues to publish
# → If FAIL: Blocks with error message
```

### Troubleshooting

#### Validation Fails: "Forbidden folder found in dist/"

**Problem:**
```
❌ Forbidden folder found in dist/: .specify/
```

**Cause:** Build process accidentally copied development folders to `dist/`.

**Solution:**
```bash
# 1. Clean dist folder
npm run clean

# 2. Rebuild
npm run build

# 3. Re-run validation
npm run validate:clean

# 4. If still failing, check build scripts for incorrect copy operations
```

#### Validation Fails: ".npmignore missing required entry"

**Problem:**
```
❌ .npmignore missing required entry: .specify/
```

**Cause:** `.npmignore` file was modified and is missing required exclusion rules.

**Solution:**
```bash
# 1. Open .npmignore in editor
# 2. Add missing entry:
.specify/
conductor/
specs/
track-docs/

# 3. Save and re-run validation
npm run validate:clean
```

#### Validation Fails: ".npmignore file does not exist"

**Problem:**
```
❌ .npmignore file does not exist
```

**Cause:** File was accidentally deleted or never created.

**Solution:**
```bash
# 1. Restore from repository
git checkout .npmignore

# 2. Or recreate from .gitignore template
# Copy relevant exclusion rules to new .npmignore file

# 3. Re-run validation
npm run validate:clean
```

#### Want to Manually Clean dist/?

**Use with caution:** Only do this if you understand the consequences.

```bash
# Manual cleanup (if automated build fails)
rm -rf dist/.specify dist/conductor dist/specs

# Or on Windows (PowerShell)
Remove-Item -Recurse -Force dist\.specify, dist\conductor, dist\specs -ErrorAction SilentlyContinue

# Then rebuild
npm run build
```

### For Maintainers

If you're a maintainer preparing a release:

1. **Before release:**
   ```bash
   npm run validate:clean
   ```

2. **Review what will be published:**
   ```bash
   npm pack --dry-run
   # Lists all files that would be included
   ```

3. **If validation fails:**
   - Do NOT bypass validation
   - Fix the root cause
   - Re-run validation
   - Only publish after validation passes

### Questions?

- **Why is my folder being excluded?** Check `.npmignore` for the exclusion rule
- **Can I add new exclusions?** Submit a PR to update `.npmignore` and `validate-clean-build.mjs`
- **Validation is too strict?** Discuss in GitHub Issues (but don't bypass it!)

---

## 🐛 Bug Reports

### How to Report

1. **Check existing issues** first
2. **Use the bug report template**
3. **Include:**
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node.js version)
   - Logs/screenshots if applicable

### Example Bug Report

```markdown
**Describe the bug**
Database connection fails on Windows 11.

**To Reproduce**
1. Run `npm run dev`
2. Check logs
3. See error: "EBUSY: resource busy or locked"

**Expected behavior**
Database should initialize without errors.

**Environment:**
- OS: Windows 11
- Node.js: v20.10.0
- Version: 1.0.0-beta

**Additional context**
Error only occurs when another instance is running.
```

---

## 💡 Feature Requests

### How to Request

1. **Check existing feature requests**
2. **Use the feature request template**
3. **Include:**
   - Problem statement
   - Proposed solution
   - Use cases
   - Alternatives considered

---

## 📚 Documentation

### Updating Documentation

- **README.md:** Overview, quick start
- **docs/API.md:** API endpoints
- **docs/INSTALLATION.md:** Installation guide
- **docs/CONTRIBUTING.md:** This file

### Documentation Standards

- Clear and concise
- Include examples
- Keep up to date with code changes
- Use markdown formatting

---

## 🎯 Areas Needing Contribution

### High Priority

- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Frontier OAuth2 Integration
- [ ] Data Export (CSV/JSON)
- [ ] Performance Benchmarks

### Medium Priority

- [ ] Custom Dashboards
- [ ] EDSM/EDDB Integration
- [ ] Event Notifications
- [ ] Mobile UI Improvements

### Low Priority

- [ ] Additional Unit Tests
- [ ] Code Comments
- [ ] Translation/Localization
- [ ] Example Configurations

---

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Annual contributor highlights

---

## ❓ Questions?

### Getting Help

- **GitHub Discussions:** General questions
- **GitHub Issues:** Bug reports and feature requests
- **Discord/Slack:** Real-time chat (if available)

### Common Questions

**Q: How do I run a single test?**
```bash
npm test -- DatabaseManager.test.ts
```

**Q: How do I check code coverage?**
```bash
npm test -- --coverage
```

**Q: Where is the database stored?**
```
Default: data/elite.db
Override: Set DATABASE_PATH in .env
```

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Elite Dangerous NEXT! 🚀**

Together we're building the best Elite Dangerous companion tool.
