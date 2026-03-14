# 🎮 Elite Dangerous NEXT - Layout Manager

**v1.0.1-beta** - Automated keyboard layout switcher for Elite Dangerous

[![Version](https://img.shields.io/badge/version-1.0.1--beta-blue.svg)](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/releases/tag/v1.0.1-beta)
[![Downloads](https://img.shields.io/github/downloads/rewtwrtwr/ELITE-DANGEROUS-NEXT/v1.0.1-beta/total)](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/releases/tag/v1.0.1-beta)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-lightgrey.svg)](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/releases/tag/v1.0.1-beta)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 Quick Start

### Download & Install

1. **[Download Installer](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/releases/download/v1.0.1-beta/EliteDangerous-LayoutManager-Setup.exe)** (362 KB)
2. Run the installer
3. Wait for installation (2-3 minutes)
4. Launch from desktop shortcut

### First Use

1. Open Layout Manager
2. Add your processes:
   - `EliteDangerous64.exe` → English
   - `COVAS NEXT.exe` → Russian
3. Click **"Start Monitor"**
4. Enable **"Auto-start"** for automatic launch

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Auto-Switching** | Automatic layout change by active window | ✅ |
| **Auto-Start** | Launch with Windows | ✅ |
| **Hotkeys** | Ctrl+Alt+R/E for manual switch | ✅ |
| **History** | View switch history | ✅ |
| **Statistics** | Layout usage statistics | ✅ |

---

## 📋 Requirements

- **OS**: Windows 10/11
- **Python**: 3.8 or higher
- **Node.js**: 20.x or higher
- **Disk Space**: ~200 MB (after installation)

---

## 🎮 Usage

### Adding Processes

1. Click **"Layout"** tab
2. Enter process name (must end with `.exe`)
3. Select language (English/Russian)
4. Click **"Add Process"**

### Hotkeys

| Shortcut | Action |
|----------|--------|
| **Ctrl+Alt+R** | Switch to Russian |
| **Ctrl+Alt+E** | Switch to English |

> ⚠️ Hotkeys only work when browser window is active

### Statistics & History

- Click **"📊 Statistics"** for usage stats
- Click **"📜 View History"** for last 50 switches

---

## 🛠️ Installation

### Step-by-Step

1. **Download** the installer from [Releases](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/releases/tag/v1.0.1-beta)
2. **Run** `EliteDangerous-LayoutManager-Setup.exe`
3. **Choose** installation folder (default: `C:\Program Files\ED-LayoutManager`)
4. **Wait** for npm install + build (2-3 minutes)
5. **Launch** from desktop shortcut

### Manual Installation (Advanced)

```bash
# Clone repository
git clone https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT.git
cd builds/ELITE-DANGEROUS-NEXT

# Install dependencies
npm install

# Build project
npm run build

# Start server
node dist/index.js
```

---

## 🔧 Troubleshooting

### Server Won't Start

```powershell
cd "C:\Program Files\ED-LayoutManager"
npm install
npm run build
node dist/index.js
```

### Python Not Found

Install Python 3.8+ from https://www.python.org/downloads/

### Layout Doesn't Switch

1. Check process name matches exactly
2. Ensure Python is installed
3. Restart monitor

---

## 📊 What's New in v1.0.1-beta

### New Features

- ✅ Statistics dashboard
- ✅ Switch history viewer
- ✅ Auto-start option
- ✅ Global hotkeys (browser only)

### Bug Fixes

- Fixed missing `public/index.html` in installer
- Fixed layout switching for some applications
- Fixed crash on duplicate process names

---

## 🔗 Links

- **[Download Latest Release](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/releases/tag/v1.0.1-beta)**
- **[Report Issue](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/issues)**
- **[Discussions](https://github.com/rewtwrtwr/ELITE-DANGEROUS-NEXT/discussions)**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Version**: 1.0.1-beta  
**Build Date**: March 14, 2026  
**Installer Size**: 362 KB  
**Installed Size**: ~200 MB
