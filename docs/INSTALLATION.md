# Installation Guide

**Version:** 1.0.0-beta  
**Last Updated:** 2026-02-28

---

## 📋 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | >= 20.0.0 | Runtime environment |
| **npm** | Latest | Package manager |
| **Git** | Latest | Version control |
| **Windows** | 10/11 | For Saved Games access |

### Optional Software

| Software | Purpose |
|----------|---------|
| **Visual Studio Code** | Code editor |
| **Git Bash** | Command line on Windows |
| **SQLite Browser** | Database inspection |

---

## 📦 Step-by-Step Installation

### 1. Install Node.js

#### Windows

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer (choose LTS version)
3. Verify installation:
   ```bash
   node --version
   # Expected: v20.x.x or higher
   
   npm --version
   # Expected: 10.x.x or higher
   ```

#### macOS

```bash
# Using Homebrew
brew install node@20

# Verify
node --version
npm --version
```

#### Linux

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

---

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/elite-dangerous-next.git

# Navigate to project directory
cd elite-dangerous-next

# Verify current branch
git branch --show-current
# Expected: v1.0.0-beta
```

---

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# Expected output:
# added X packages, and audited Y packages in Zs
# found 0 vulnerabilities
```

**Troubleshooting:**

If you encounter errors:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### 4. Configure Environment

#### Create .env file

```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
```

#### Default Configuration

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_PATH=data/elite.db

# Journal Configuration
# Windows default path
JOURNAL_PATH=%USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous

# Logging
LOG_LEVEL=debug

# OAuth2 (Frontier) - planned
JWT_ISSUER=frontier
JWT_AUDIENCE=elite-dangerous-next
```

---

### 5. Verify Installation

#### Run Tests

```bash
# Run all tests
npm test

# Expected output:
# Test Suites: 3 passed, 3 total
# Tests:       66 passed, 66 total
# Time:        < 3 seconds
```

#### Build Application

```bash
# Build for production
npm run build

# Expected output:
# Build complete in dist/
```

#### Check Security

```bash
# Audit production dependencies
npm audit --production

# Expected:
# found 0 vulnerabilities
```

---

### 6. First Run

#### Development Mode

```bash
# Start development server
npm run dev

# Expected output:
# [INFO] [Database] Initializing better-sqlite3...
# [INFO] [Database] Database initialized successfully
# [INFO] [App] Elite Dangerous NEXT v1.0.0-beta
# [INFO] [Server] Server running on http://localhost:3000
```

#### Open in Browser

Navigate to: **http://localhost:3000**

You should see the Elite Dangerous NEXT interface.

---

## 🔧 Platform-Specific Instructions

### Windows

#### Accessing Saved Games

Default journal path:
```
%USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous
```

If Elite Dangerous is installed, journals should be here automatically.

#### Running as Service (Optional)

Use [NSSM](https://nssm.cc/) to run as Windows service:

```bash
# Download nssm
# Install service
nssm install EliteDangerousNEXT "C:\path\to\node.exe" "C:\path\to\elite-dangerous-next\dist\index.js"

# Start service
nssm start EliteDangerousNEXT
```

### macOS

#### Journal Path

If running Elite Dangerous via CrossOver or similar:
```
~/Library/Application Support/Frontier Developments/Elite Dangerous
```

### Linux

#### Journal Path

If running Elite Dangerous via Proton:
```
~/.steam/steam/steamapps/compatdata/359320/pfx/drive_c/users/steamuser/Saved Games/Frontier Developments/Elite Dangerous
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'better-sqlite3'"

**Solution:**
```bash
# Rebuild native modules
npm rebuild better-sqlite3

# Or reinstall
npm install
```

### Issue: "EBUSY: resource busy or locked"

**Solution:**
1. Close any other applications using the database
2. Restart your computer
3. Delete `data/elite.db-wal` and `data/elite.db-shm` files

### Issue: "Journal path does not exist"

**Solution:**
1. Verify Elite Dangerous is installed
2. Check journal path in `.env`
3. Ensure you've played the game at least once (creates journals)

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Change port in .env
PORT=3001

# Or find and kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

### Issue: Tests failing

**Solution:**
```bash
# Clear test database files
rm -f data/test-*.db

# Run tests again
npm test
```

---

## 📊 Post-Installation Checklist

- [ ] Node.js version >= 20.0.0
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Tests passing (`npm test` → 66/66 passing)
- [ ] Build successful (`npm run build`)
- [ ] Security audit clean (`npm audit --production` → 0 vulnerabilities)
- [ ] Application running (`npm run dev`)
- [ ] Browser interface accessible (http://localhost:3000)
- [ ] Journal files detected (check logs)

---

## 🎓 Next Steps

### Learn the API

See [API Documentation](API.md) for endpoint details.

### Configure Journal Monitoring

1. Start Elite Dangerous
2. Application will auto-detect journal files
3. Watch logs for journal loading progress

### Explore Features

- Real-time event monitoring
- Statistics and analytics
- Event filtering and search
- WebSocket updates

### Contribute

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

---

## 📞 Support

### Getting Help

- **Documentation:** [README.md](../README.md)
- **API Docs:** [API.md](API.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/elite-dangerous-next/issues)

### Reporting Installation Issues

When reporting installation issues, please include:

1. Operating System and version
2. Node.js version (`node --version`)
3. npm version (`npm --version`)
4. Full error message
5. Steps you've already tried

---

**Installation complete! 🎉**

Proceed to [Configuration Guide](CONFIGURATION.md) for advanced settings.
