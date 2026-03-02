---
name: 🛠️ Build/Validation Issue
about: Report a problem with build, validation, or Clean Release process
title: '[BUILD] '
labels: 'type: build'
assignees: ''
---

## 📋 Describe the Issue

A clear and concise description of what the build/validation issue is.

**What happened?**
<!-- Describe what you expected vs what actually happened -->

**When did it occur?**
<!-- During which action? (e.g., npm install, npm run build, npm run validate:clean, npm publish) -->

---

## 🔧 Environment

**OS:**
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux (Ubuntu/Debian)
- [ ] Other: _______

**Node.js Version:**
```bash
node --version
# Paste output here
```

**npm Version:**
```bash
npm --version
# Paste output here
```

**Git Branch:**
```bash
git branch
# Paste output here (e.g., v1.0.1-pre, main)
```

---

## 📝 Error Output

**Full Error Message:**
```
<!-- Paste the complete error message here -->
```

**Screenshot (if applicable):**
<!-- Drag and drop screenshot here -->

---

## 🔄 Steps to Reproduce

<!-- Provide detailed steps to reproduce the issue -->

1. Run command: `npm run validate:clean`
2. See error: `[error message]`

**OR**

1. Run command: `npm run build`
2. Then run: `npm run validate:clean`
3. See error: `[error message]`

---

## ✅ Troubleshooting Tried

<!-- Check all that apply before submitting this issue -->

- [ ] Ran `npm install` to ensure dependencies are installed
- [ ] Checked Node.js version (must be >= 20.0.0)
- [ ] Ran `npm run clean` and rebuilt with `npm run build`
- [ ] Reviewed [CONTRIBUTING.md Clean Release section](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/blob/v1.0.1-pre/CONTRIBUTING.md#clean-release-build)
- [ ] Checked existing issues for similar problems
- [ ] Verified `.npmignore` file exists in project root
- [ ] No forbidden folders in `dist/` (.specify/, conductor/, specs/)

---

## 🎯 Expected Behavior

A clear description of what you expected to happen:

```
<!-- Example: "npm run validate:clean should complete successfully with all checks passing" -->
```

---

## 💡 Additional Context

Add any other context about the problem here:

- **Project version:** (e.g., 1.0.0-beta, commit hash)
- **Recent changes:** (e.g., "Just pulled latest from v1.0.1-pre")
- **Custom configuration:** (e.g., custom DATABASE_PATH, JOURNAL_PATH)
- **Related issues:** (link to any related GitHub issues)

---

## 📋 For Maintainers

<!-- This section will be filled by maintainers during triage -->

**Triage Checklist:**
- [ ] Issue reproduced by maintainer
- [ ] Priority assigned (P0/P1/P2/P3)
- [ ] Assigned to milestone
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Verified by reporter

**Technical Details:**
```
<!-- Maintainer notes about the issue -->
```

---

## 🔗 Related Links

- [CONTRIBUTING.md - Clean Release Build](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/blob/v1.0.1-pre/CONTRIBUTING.md#clean-release-build)
- [Validation Script](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/blob/v1.0.1-pre/scripts/validate-clean-build.mjs)
- [.npmignore](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/blob/v1.0.1-pre/.npmignore)

---

**Thank you for reporting this issue!** 🙏

We'll review it as soon as possible. Please check back for updates and be ready to provide additional information if needed.
