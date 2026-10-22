# SecurePass — Password Strength Checker

> A beginner-friendly cybersecurity web application that analyses passwords entirely in your browser.

![SecurePass Banner](https://img.shields.io/badge/SecurePass-Password%20Strength%20Checker-00c8ff?style=for-the-badge&logo=shield&logoColor=white)
![Security](https://img.shields.io/badge/Security-Client%20Side%20Only-00e5a0?style=flat-square)
![No Backend](https://img.shields.io/badge/Backend-None-ff4d6d?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-ffc857?style=flat-square&logo=javascript)

---

## 📋 Table of Contents

- [Features](#-features)
- [How to Run](#-how-to-run)
- [Security Principles](#-security-principles)
- [Project Structure](#-project-structure)
- [How the Strength Score Works](#-how-the-strength-score-works)
- [How the Password Generator Works](#-how-the-password-generator-works)
- [Security Concepts Explained (Beginner)](#-security-concepts-explained-beginner)
- [Limitations](#-limitations)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Live Strength Analysis** | Score updates on every keystroke |
| 👁️ **Show / Hide Password** | Toggle password visibility |
| 📊 **Strength Meter** | Visual bar with 5 levels: Very Weak → Very Strong |
| ✔️ **8 Security Checks** | Length, variety, common passwords, repeats, sequences |
| ⚙️ **Password Generator** | Cryptographically secure, adjustable 8–64 chars |
| 📋 **Copy to Clipboard** | One-click copy with feedback |
| 📚 **Explanations** | Every check has a plain-English explanation |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

---

## 🚀 How to Run

This is a **pure static website** — no build step, no server, no npm install.

### Option 1: Open directly in your browser (quickest)

1. Download or clone this repository.
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari).

```bash
# If you have a file manager — just double-click index.html
# Or from the terminal:
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

### Option 2: Use a local dev server (recommended for development)

**Using Python (no install needed on most systems):**
```bash
# Python 3
python -m http.server 8000
# Then open: http://localhost:8000
```

**Using Node.js (if installed):**
```bash
npx serve .
# Then open the URL shown in the terminal
```

**Using VS Code:**
Install the **Live Server** extension, right-click `index.html`, and choose *Open with Live Server*.

> **Why use a server?**  
> The Clipboard API (`navigator.clipboard`) requires a **secure context** (HTTPS or localhost).  
> Opening the file directly via `file://` may block clipboard access in some browsers.  
> A local dev server gives you `http://localhost` which counts as a secure context.

---

## 🔒 Security Principles

| Principle | Implementation |
|---|---|
| **Client-side only** | Zero network requests after page load |
| **No storage** | `localStorage`, `sessionStorage`, cookies are never used |
| **Safe DOM** | User input is always set via `.textContent` or `.value`, never `innerHTML` |
| **Secure RNG** | Generator uses `crypto.getRandomValues()`, not `Math.random()` |
| **No analytics** | No tracking scripts, no CDN-loaded libraries |

---

## 📁 Project Structure

```
SecurePass/
├── index.html    ← Page structure and all HTML elements
├── style.css     ← Dark cybersecurity theme, animations, responsive layout
├── script.js     ← Password analysis, generator, event handling
├── README.md     ← This file
└── .gitignore    ← Files Git should not track
```

---

## 🧮 How the Strength Score Works

The score is calculated out of **100 points** using this formula:

### Points Added ✅

| Condition | Points |
|---|---|
| Password ≥ 6 characters | +10 |
| Password ≥ 8 characters | +10 |
| Password ≥ 10 characters | +10 |
| Password ≥ 12 characters | +10 |
| Password ≥ 16 characters | +10 |
| Password ≥ 20 characters | +10 |
| Contains uppercase (A–Z) | +10 |
| Contains lowercase (a–z) | +10 |
| Contains digits (0–9) | +10 |
| Contains symbols (!@#…) | +15 |
| **Maximum possible** | **105 → capped at 100** |

### Penalties Subtracted ❌

| Condition | Points |
|---|---|
| Found in common-password list | −40 |
| Excessive repeated characters (aaa, 111) | −15 |
| Predictable sequences (1234, qwerty) | −15 |

### Strength Labels

| Score Range | Label |
|---|---|
| 0 – 19 | Very Weak 🔴 |
| 20 – 39 | Weak 🟠 |
| 40 – 59 | Fair 🟡 |
| 60 – 79 | Good 🟢 |
| 80 – 100 | Very Strong 🔵 |

> ⚠️ **Important disclaimer:** This score is an *estimate* based on common patterns.  
> It does **not** account for context-specific attacks, password managers, or all possible  
> cracking strategies. A high score is a good sign — it is not a guarantee of security.

---

## 🎲 How the Password Generator Works

The generator uses **`crypto.getRandomValues()`** from the Web Crypto API.

### Step-by-step

```
1.  Build an "alphabet" string from selected character types
        e.g., "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh...0123456789!@#$..."

2.  Create a Uint8Array — an array of integers from 0 to 255

3.  Fill it with random bytes:
        crypto.getRandomValues(randomBytes)
        This uses the operating system's secure entropy source.

4.  Apply bias rejection:
        maxUsable = floor(256 / alphabetSize) × alphabetSize
        Discard any byte ≥ maxUsable
        → This ensures every character has an exactly equal probability.

5.  Map remaining bytes to characters:
        character = alphabet[ byte % alphabetSize ]

6.  Repeat until we have the required number of characters.
```

### Why NOT Math.random()?

`Math.random()` uses a **pseudo-random number generator (PRNG)** — an algorithm that generates *predictable* sequences from an internal seed. If an attacker discovers the seed (possible in some environments), they can predict all "random" passwords generated.

`crypto.getRandomValues()` uses **hardware entropy** (mouse movements, disk timings, etc.) collected by the OS. This makes prediction computationally infeasible.

---

## 📖 Security Concepts Explained (Beginner)

### What is entropy?
Entropy measures how unpredictable a password is. More characters + more character types = higher entropy = harder to crack.

### What is a brute-force attack?
An automated tool tries every possible combination until it finds the right password. Longer passwords with more character types have exponentially more combinations.

### What is a dictionary attack?
Instead of trying every combination, attackers try lists of known passwords (dictionaries). The `COMMON_PASSWORDS` list in `script.js` is a tiny sample of what real attackers use.

### What is a keyboard walk?
A keyboard walk follows adjacent keys on the keyboard: `qwerty`, `asdfgh`, `zxcvbn`. These appear "random" but are extremely common and are in every serious wordlist.

### What is the Web Crypto API?
A browser built-in API (`window.crypto`) that provides cryptographic functions including `getRandomValues()` for secure randomness and various encryption/hashing functions.

---

## ⚠️ Limitations

1. **Not a professional audit tool.** Use [Have I Been Pwned](https://haveibeenpwned.com) to check if a password has appeared in data breaches.
2. **Common-password list is small.** Real attackers use wordlists with billions of entries.
3. **Does not check for personal information** (your name, birthday, etc.) — the app has no way to know this.
4. **Score can be gamed** — a very long password full of symbols can score highly but still be predictable to a human reader.

---

## 🛠️ Built With

- **HTML5** — semantic structure
- **CSS3** — custom properties, grid, animations, glassmorphism
- **Vanilla JavaScript** — no frameworks or dependencies
- **Web Crypto API** — built into all modern browsers

---

## 👤 Author

**Chanupa Niduwara**  
Cybersecurity Undergraduate  
Email: niduwara2000@gmail.com

---

*SecurePass is an educational project. No passwords are ever transmitted or stored.*
