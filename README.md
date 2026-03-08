# Secure Password Generator + Vaults

A Bitwarden-inspired web app for generating secure passwords/passphrases and storing sensitive records.

## Features

### Password Generator
- Adjustable length slider
- Password and passphrase generation modes
- Character controls:
  - Uppercase
  - Lowercase
  - Numbers
  - Special characters
  - Avoid ambiguous characters
- Regenerate button
- Copy-to-clipboard
- Save Password flow (website + username + password)
- Strength meter with entropy estimate

### Password Vault
- Dedicated tab to view saved password records
- Displays website and username
- Passwords are masked by default
- Per-record Show/Hide toggle for password visibility

### Credit Card Vault
- Separate vault with master-password unlock
- AES-GCM encryption with PBKDF2-derived key
- Card validation and provider detection
- Reveal/hide, copy, and delete actions

## Tech Stack
- HTML
- CSS
- JavaScript (browser)
- Node.js (`server.js`) for local file persistence

## Project Structure
- `index.html` — UI layout and tabs
- `styles.css` — styling for generator and vault UIs
- `script.js` — client logic (generation, encryption, storage, rendering)
- `server.js` — local static server + save endpoints
- `password-records-plaintext.json` — plaintext password records (demo)
- `password-records-encrypted.json` — encrypted password records
- `vault_decrypted.json` — plaintext credit-card vault export (demo)
- `vault_encrypted.json` — encrypted credit-card vault export

## Getting Started

### 1. Prerequisites
- Node.js 18+ (or any version that supports this app’s local server/runtime)

### 2. Run the app
From the project root:

```bash
node server.js
```

Open in browser:

```text
http://localhost:3000
```

## How Persistence Works

### Password Records
- Stored encrypted in browser `localStorage`
- Also sent to `/save-password-records` for file persistence:
  - `password-records-encrypted.json`
  - `password-records-plaintext.json` (demo plaintext)

### Credit Card Vault
- Stored encrypted in browser `localStorage`
- Also sent to `/save-vault` for file persistence:
  - `vault_encrypted.json`
  - `vault_decrypted.json` (demo plaintext)

## Security Notes
- Randomness uses Web Crypto APIs.
- Demo plaintext files (`password-records-plaintext.json`, `vault_decrypted.json`) intentionally contain readable data for assignment visibility and should not be used in production.
- This is a local/demo project and not a production-grade password manager.

## Usage Flow
1. Generate a password in **Password Generator**.
2. Click **Save Password**, enter website + username, save.
3. Open **Password Vault** to view saved entries (masked by default).
4. Use **Credit Card Vault** tab for encrypted card storage workflow.
