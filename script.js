const generatedValueEl = document.getElementById("generatedValue");
const copyBtn = document.getElementById("copyBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const copyStatusEl = document.getElementById("copyStatus");

const modeEls = document.querySelectorAll("input[name='mode']");
const lengthRangeEl = document.getElementById("lengthRange");
const lengthValueEl = document.getElementById("lengthValue");
const lengthLabelEl = document.getElementById("lengthLabel");
const lengthHintEl = document.getElementById("lengthHint");

const passwordOptionsEl = document.getElementById("passwordOptions");
const passphraseOptionsEl = document.getElementById("passphraseOptions");

const includeUppercaseEl = document.getElementById("includeUppercase");
const includeLowercaseEl = document.getElementById("includeLowercase");
const includeNumbersEl = document.getElementById("includeNumbers");
const includeSpecialEl = document.getElementById("includeSpecial");
const avoidAmbiguousEl = document.getElementById("avoidAmbiguous");

const capitalizeWordsEl = document.getElementById("capitalizeWords");
const appendNumberEl = document.getElementById("appendNumber");
const separatorSelectEl = document.getElementById("separatorSelect");

const strengthLabelEl = document.getElementById("strengthLabel");
const strengthHintEl = document.getElementById("strengthHint");
const entropyBitsEl = document.getElementById("entropyBits");
const meterEl = document.querySelector(".meter");
const meterFillEl = document.getElementById("meterFill");

const CHARSET = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  special: "!@#$%^&*"
};

const AMBIGUOUS_CHARS = new Set(["l", "I", "O", "0", "1", "|"]);

const WORD_LIST = [
  "anchor", "april", "artist", "atlas", "autumn", "bamboo", "beacon", "beach", "berry", "bison",
  "blossom", "bridge", "cactus", "cannon", "cedar", "cherry", "cinder", "cobalt", "comet", "coral",
  "cosmos", "crystal", "cypress", "daisy", "delta", "desert", "dragon", "dune", "ember", "falcon",
  "fable", "fern", "fjord", "forest", "fossil", "galaxy", "garden", "glacier", "granite", "harbor",
  "hazel", "helium", "horizon", "indigo", "island", "jasmine", "jungle", "keystone", "lagoon", "lantern",
  "lilac", "lotus", "lumen", "maple", "marble", "meadow", "meteor", "midnight", "mist", "nebula",
  "nectar", "north", "nova", "oasis", "onyx", "opal", "orbit", "orchid", "parrot", "pebble",
  "phoenix", "pine", "planet", "prairie", "quartz", "quill", "raven", "reef", "river", "sable",
  "saffron", "sage", "sierra", "silver", "solstice", "sparrow", "spruce", "star", "stone", "sunset",
  "tempest", "thistle", "timber", "topaz", "trail", "valley", "velvet", "violet", "willow", "zephyr"
];

function getSecureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive integer");
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const values = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(values);
    if (values[0] < limit) {
      return values[0] % maxExclusive;
    }
  }
}

function randomFromString(chars) {
  return chars[getSecureRandomInt(chars.length)];
}

function randomWord() {
  return WORD_LIST[getSecureRandomInt(WORD_LIST.length)];
}

function shuffled(chars) {
  const copy = [...chars];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getSecureRandomInt(i + 1);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy.join("");
}

function stripAmbiguous(chars) {
  return [...chars].filter((char) => !AMBIGUOUS_CHARS.has(char)).join("");
}

function getMode() {
  return document.querySelector("input[name='mode']:checked").value;
}

function getEnabledSets() {
  const avoidAmbiguous = avoidAmbiguousEl.checked;
  const sets = [];

  if (includeUppercaseEl.checked) {
    sets.push(avoidAmbiguous ? stripAmbiguous(CHARSET.upper) : CHARSET.upper);
  }
  if (includeLowercaseEl.checked) {
    sets.push(avoidAmbiguous ? stripAmbiguous(CHARSET.lower) : CHARSET.lower);
  }
  if (includeNumbersEl.checked) {
    sets.push(avoidAmbiguous ? stripAmbiguous(CHARSET.numbers) : CHARSET.numbers);
  }
  if (includeSpecialEl.checked) {
    sets.push(CHARSET.special);
  }

  return sets.filter((set) => set.length > 0);
}

function generatePassword() {
  const length = Number(lengthRangeEl.value);
  const sets = getEnabledSets();

  if (sets.length === 0) {
    throw new Error("Choose at least one character type.");
  }

  const allChars = sets.join("");
  const output = [];

  for (const set of sets) {
    output.push(randomFromString(set));
  }
  for (let i = output.length; i < length; i += 1) {
    output.push(randomFromString(allChars));
  }

  return shuffled(output);
}

function capitalizeWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generatePassphrase() {
  const wordCount = Number(lengthRangeEl.value);
  const words = [];

  for (let i = 0; i < wordCount; i += 1) {
    const word = randomWord();
    words.push(capitalizeWordsEl.checked ? capitalizeWord(word) : word);
  }

  let phrase = words.join(separatorSelectEl.value);
  if (appendNumberEl.checked) {
    phrase += String(getSecureRandomInt(100)).padStart(2, "0");
  }

  return phrase;
}

function estimateEntropy(value) {
  if (!value) {
    return 0;
  }

  if (getMode() === "passphrase") {
    let bits = Number(lengthRangeEl.value) * Math.log2(WORD_LIST.length);
    if (appendNumberEl.checked) {
      bits += Math.log2(100);
    }
    return bits;
  }

  const sets = getEnabledSets();
  const poolSize = sets.join("").length;
  return value.length * Math.log2(poolSize);
}

function strengthBucket(bits) {
  if (bits < 40) {
    return { label: "Weak", value: 20, color: "var(--danger)", hint: "Too easy to brute-force. Increase length." };
  }
  if (bits < 60) {
    return { label: "Fair", value: 45, color: "var(--warn)", hint: "Acceptable for low-risk accounts only." };
  }
  if (bits < 80) {
    return { label: "Good", value: 70, color: "#5b9e1a", hint: "Strong for most accounts." };
  }
  return { label: "Very Strong", value: 100, color: "var(--good)", hint: "High resistance against guessing attacks." };
}

function syncModeUI() {
  const mode = getMode();
  const isPassword = mode === "password";

  passwordOptionsEl.classList.toggle("hidden", !isPassword);
  passphraseOptionsEl.classList.toggle("hidden", isPassword);

  if (isPassword) {
    lengthLabelEl.textContent = "Length";
    lengthRangeEl.min = "4";
    lengthRangeEl.max = "64";
    if (Number(lengthRangeEl.value) < 12) {
      lengthRangeEl.value = "16";
    }
    lengthHintEl.textContent = "Longer passwords improve entropy more than adding symbols alone.";
  } else {
    lengthLabelEl.textContent = "Word count";
    lengthRangeEl.min = "3";
    lengthRangeEl.max = "12";
    if (Number(lengthRangeEl.value) > 12 || Number(lengthRangeEl.value) < 3) {
      lengthRangeEl.value = "4";
    }
    lengthHintEl.textContent = "Passphrases are easier to remember; add words for more entropy.";
  }

  lengthValueEl.textContent = lengthRangeEl.value;
}

function enforceLengthForTypes() {
  if (getMode() !== "password") {
    return;
  }

  const selectedTypeCount = [
    includeUppercaseEl.checked,
    includeLowercaseEl.checked,
    includeNumbersEl.checked,
    includeSpecialEl.checked
  ].filter(Boolean).length;

  const hardMin = Math.max(4, selectedTypeCount || 1);
  lengthRangeEl.min = String(hardMin);

  if (Number(lengthRangeEl.value) < hardMin) {
    lengthRangeEl.value = String(hardMin);
  }

  lengthValueEl.textContent = lengthRangeEl.value;
}

function regenerate() {
  try {
    const mode = getMode();
    const value = mode === "password" ? generatePassword() : generatePassphrase();
    generatedValueEl.value = value;

    const bits = estimateEntropy(value);
    const bucket = strengthBucket(bits);

    meterFillEl.style.width = `${bucket.value}%`;
    meterFillEl.style.backgroundColor = bucket.color;
    meterEl.setAttribute("aria-valuenow", String(bucket.value));

    strengthLabelEl.textContent = bucket.label;
    strengthHintEl.textContent = bucket.hint;
    entropyBitsEl.textContent = bits.toFixed(1);
    copyStatusEl.textContent = "Generated securely with Web Crypto.";
  } catch (error) {
    generatedValueEl.value = "";
    meterFillEl.style.width = "0%";
    meterEl.setAttribute("aria-valuenow", "0");
    strengthLabelEl.textContent = "Invalid";
    strengthHintEl.textContent = error.message;
    entropyBitsEl.textContent = "0.0";
    copyStatusEl.textContent = error.message;
  }
}

async function copyGeneratedValue() {
  const value = generatedValueEl.value;
  if (!value) {
    copyStatusEl.textContent = "Nothing to copy.";
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    copyStatusEl.textContent = "Copied to clipboard.";
  } catch (_) {
    generatedValueEl.select();
    const success = document.execCommand("copy");
    copyStatusEl.textContent = success ? "Copied to clipboard." : "Copy failed. Select text and copy manually.";
  }
}

lengthRangeEl.addEventListener("input", () => {
  lengthValueEl.textContent = lengthRangeEl.value;
  regenerate();
});

regenerateBtn.addEventListener("click", regenerate);
copyBtn.addEventListener("click", copyGeneratedValue);

for (const el of modeEls) {
  el.addEventListener("change", () => {
    syncModeUI();
    enforceLengthForTypes();
    regenerate();
  });
}

[
  includeUppercaseEl,
  includeLowercaseEl,
  includeNumbersEl,
  includeSpecialEl,
  avoidAmbiguousEl,
  capitalizeWordsEl,
  appendNumberEl,
  separatorSelectEl
].forEach((el) => {
  el.addEventListener("change", () => {
    enforceLengthForTypes();
    regenerate();
  });
});

syncModeUI();
enforceLengthForTypes();
regenerate();

// ─── Tab Navigation ───────────────────────────────────────────────
const tabs = document.querySelectorAll(".tab");
const generatorTab = document.getElementById("generatorTab");
const vaultTab = document.getElementById("vaultTab");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("tab--active"));
    tab.classList.add("tab--active");
    const target = tab.dataset.tab;
    generatorTab.classList.toggle("hidden", target !== "generator");
    vaultTab.classList.toggle("hidden", target !== "vault");
  });
});

// ─── Credit Card Vault (AES-GCM encrypted localStorage) ──────────
const VAULT_STORAGE_KEY = "cc_vault_enc";
const VAULT_SALT_KEY = "cc_vault_salt";

const masterPasswordEl = document.getElementById("masterPassword");
const unlockVaultBtn = document.getElementById("unlockVaultBtn");
const lockVaultBtn = document.getElementById("lockVaultBtn");
const vaultStatusEl = document.getElementById("vaultStatus");
const vaultLockEl = document.getElementById("vaultLock");
const vaultContentEl = document.getElementById("vaultContent");
const addCardFormEl = document.getElementById("addCardForm");
const cardListEl = document.getElementById("cardList");
const noCardsEl = document.getElementById("noCards");

const showCardFormBtn = document.getElementById("showCardFormBtn");
const cardFormWrapper = document.getElementById("cardFormWrapper");
const cancelCardBtn = document.getElementById("cancelCardBtn");

const cardNicknameEl = document.getElementById("cardNickname");
const cardHolderEl = document.getElementById("cardHolder");
const cardNumberEl = document.getElementById("cardNumber");
const cardExpiryEl = document.getElementById("cardExpiry");
const cardCVVEl = document.getElementById("cardCVV");

let vaultKey = null;
let vaultCards = [];

function buf2hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hex2buf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function getOrCreateSalt() {
  const stored = localStorage.getItem(VAULT_SALT_KEY);
  if (stored) return hex2buf(stored);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(VAULT_SALT_KEY, buf2hex(salt));
  return salt;
}

async function encryptVault(key, data) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  return buf2hex(iv) + ":" + buf2hex(ciphertext);
}

async function decryptVault(key, stored) {
  const [ivHex, ctHex] = stored.split(":");
  const iv = hex2buf(ivHex);
  const ct = hex2buf(ctHex);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plainBuf));
}

async function saveVaultToFiles(encryptedData) {
  try {
    await fetch("/save-vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encrypted: {
          algorithm: "AES-256-GCM",
          key_derivation: "PBKDF2 (600000 iterations, SHA-256)",
          salt: localStorage.getItem(VAULT_SALT_KEY),
          encrypted_data: encryptedData
        },
        decrypted: {
          description: "DEMO ONLY — Unencrypted credit card vault (plaintext)",
          cards: vaultCards
        }
      })
    });
  } catch (_) {
    // Server not running, localStorage still works
  }
}

async function saveVault() {
  const encrypted = await encryptVault(vaultKey, vaultCards);
  localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
  await saveVaultToFiles(encrypted);
}

function maskCardNumber(num) {
  const digits = num.replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return "**** **** **** " + digits.slice(-4);
}

function renderCards() {
  cardListEl.innerHTML = "";
  noCardsEl.classList.toggle("hidden", vaultCards.length > 0);

  vaultCards.forEach((card, index) => {
    const el = document.createElement("div");
    el.className = "stored-card";
    el.dataset.index = index;
    const prov = card.provider || (detectProvider(card.number) || {}).name || "Unknown";
    el.innerHTML = `
      <div class="stored-card__top">
        <span class="stored-card__nickname">${escapeHtml(card.nickname || "Card " + (index + 1))} <span class="stored-card__provider">${escapeHtml(prov)}</span></span>
        <div class="stored-card__actions">
          <button type="button" class="reveal-btn">Reveal</button>
          <button type="button" class="copy-card-btn">Copy #</button>
          <button type="button" class="btn--danger delete-btn">Delete</button>
        </div>
      </div>
      <div class="stored-card__detail">
        <span>Number</span><strong class="card-num-display">${maskCardNumber(card.number)}</strong>
        <span>Holder</span><strong>${escapeHtml(card.holder)}</strong>
        <span>Expiry</span><strong>${escapeHtml(card.expiry)}</strong>
        <span>CVV</span><strong class="card-cvv-display">***</strong>
      </div>
    `;
    cardListEl.appendChild(el);

    let revealed = false;
    el.querySelector(".reveal-btn").addEventListener("click", function () {
      revealed = !revealed;
      el.querySelector(".card-num-display").textContent = revealed ? formatCardNumber(card.number) : maskCardNumber(card.number);
      el.querySelector(".card-cvv-display").textContent = revealed ? card.cvv : "***";
      this.textContent = revealed ? "Hide" : "Reveal";
    });

    el.querySelector(".copy-card-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(card.number.replace(/\s/g, ""));
        vaultStatusEl.textContent = "Card number copied.";
      } catch (_) {
        vaultStatusEl.textContent = "Copy failed.";
      }
    });

    el.querySelector(".delete-btn").addEventListener("click", async () => {
      vaultCards.splice(index, 1);
      await saveVault();
      renderCards();
      vaultStatusEl.textContent = "Card deleted.";
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatCardNumber(num) {
  const digits = num.replace(/\s/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

const CARD_PROVIDERS = [
  { name: "Visa",       key: "visa",       pattern: /^4/,                   lengths: [13, 16, 19], cvv: 3 },
  { name: "Mastercard", key: "mastercard",  pattern: /^(5[1-5]|2[2-7])/,    lengths: [16],         cvv: 3 },
  { name: "Amex",       key: "amex",        pattern: /^3[47]/,              lengths: [15],         cvv: 4 },
  { name: "Discover",   key: "discover",    pattern: /^(6011|65|644|649)/,  lengths: [16, 19],     cvv: 3 },
  { name: "Diners Club",key: "diners",      pattern: /^(36|38|30[0-5])/,    lengths: [14, 16],     cvv: 3 },
  { name: "JCB",        key: "jcb",         pattern: /^35(2[89]|[3-8])/,    lengths: [16, 19],     cvv: 3 },
  { name: "UnionPay",   key: "unionpay",    pattern: /^62/,                 lengths: [16, 17, 18, 19], cvv: 3 },
];

function detectProvider(digits) {
  for (const p of CARD_PROVIDERS) {
    if (p.pattern.test(digits)) return p;
  }
  return null;
}

function luhnCheck(digits) {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

const cardProviderBadge = document.getElementById("cardProviderBadge");

// Auto-format card number input and show provider
cardNumberEl.addEventListener("input", () => {
  let digits = cardNumberEl.value.replace(/\D/g, "");
  const provider = detectProvider(digits);

  // Amex max 15, others max 19
  const maxDigits = provider ? Math.max(...provider.lengths) : 19;
  digits = digits.slice(0, maxDigits);
  cardNumberEl.value = digits.replace(/(.{4})/g, "$1 ").trim();
  cardNumberEl.classList.remove("input-error");

  if (digits.length > 0 && provider) {
    cardProviderBadge.textContent = provider.name;
    cardProviderBadge.dataset.provider = provider.key;
    cardCVVEl.maxLength = provider.cvv;
    cardCVVEl.placeholder = provider.cvv === 4 ? "****" : "***";
  } else if (digits.length > 0) {
    cardProviderBadge.textContent = "Unknown";
    cardProviderBadge.dataset.provider = "unknown";
    cardCVVEl.maxLength = 4;
    cardCVVEl.placeholder = "***";
  } else {
    cardProviderBadge.textContent = "";
    cardProviderBadge.removeAttribute("data-provider");
    cardCVVEl.maxLength = 4;
    cardCVVEl.placeholder = "***";
  }
});

// Auto-format expiry input and clear error on edit
cardExpiryEl.addEventListener("input", () => {
  let val = cardExpiryEl.value.replace(/\D/g, "").slice(0, 4);
  if (val.length >= 3) {
    val = val.slice(0, 2) + "/" + val.slice(2);
  }
  cardExpiryEl.value = val;
  cardExpiryEl.classList.remove("input-error");
});

cardCVVEl.addEventListener("input", () => {
  cardCVVEl.classList.remove("input-error");
});

showCardFormBtn.addEventListener("click", () => {
  cardFormWrapper.classList.remove("hidden");
  showCardFormBtn.classList.add("hidden");
});

cancelCardBtn.addEventListener("click", () => {
  cardFormWrapper.classList.add("hidden");
  showCardFormBtn.classList.remove("hidden");
  addCardFormEl.reset();
  cardProviderBadge.textContent = "";
  cardProviderBadge.removeAttribute("data-provider");
});

unlockVaultBtn.addEventListener("click", async () => {
  const pw = masterPasswordEl.value;
  if (!pw) {
    vaultStatusEl.textContent = "Please enter a master password.";
    return;
  }

  const salt = getOrCreateSalt();
  try {
    vaultKey = await deriveKey(pw, salt);
    const stored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (stored) {
      vaultCards = await decryptVault(vaultKey, stored);
    } else {
      vaultCards = [];
    }
    vaultLockEl.classList.add("hidden");
    vaultContentEl.classList.remove("hidden");
    vaultStatusEl.textContent = "";
    renderCards();
  } catch (_) {
    vaultKey = null;
    vaultStatusEl.textContent = "Wrong password or corrupted vault.";
  }
});

lockVaultBtn.addEventListener("click", () => {
  vaultKey = null;
  vaultCards = [];
  masterPasswordEl.value = "";
  vaultContentEl.classList.add("hidden");
  vaultLockEl.classList.remove("hidden");
  vaultStatusEl.textContent = "Vault locked.";
});

addCardFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const number = cardNumberEl.value.replace(/\s/g, "");
  const provider = detectProvider(number);

  if (!/^\d{13,19}$/.test(number)) {
    cardNumberEl.classList.add("input-error");
    vaultStatusEl.textContent = "Invalid card number.";
    cardNumberEl.focus();
    return;
  }
  if (!provider) {
    cardNumberEl.classList.add("input-error");
    vaultStatusEl.textContent = "Unrecognized card provider.";
    cardNumberEl.focus();
    return;
  }
  if (!provider.lengths.includes(number.length)) {
    cardNumberEl.classList.add("input-error");
    vaultStatusEl.textContent = `${provider.name} card must be ${provider.lengths.join(" or ")} digits.`;
    cardNumberEl.focus();
    return;
  }
  if (!luhnCheck(number)) {
    cardNumberEl.classList.add("input-error");
    vaultStatusEl.textContent = "Card number failed validation check.";
    cardNumberEl.focus();
    return;
  }

  const expiryValid = /^\d{2}\/\d{2}$/.test(cardExpiryEl.value);
  if (expiryValid) {
    const [mm] = cardExpiryEl.value.split("/").map(Number);
    if (mm < 1 || mm > 12) {
      cardExpiryEl.classList.add("input-error");
      vaultStatusEl.textContent = "Invalid month. Expiry must be MM/YY.";
      cardExpiryEl.focus();
      return;
    }
  } else {
    cardExpiryEl.classList.add("input-error");
    vaultStatusEl.textContent = "Expiry must be MM/YY.";
    cardExpiryEl.focus();
    return;
  }

  const expectedCvv = provider.cvv;
  if (cardCVVEl.value.length !== expectedCvv || !/^\d+$/.test(cardCVVEl.value)) {
    cardCVVEl.classList.add("input-error");
    vaultStatusEl.textContent = `${provider.name} CVV must be ${expectedCvv} digits.`;
    cardCVVEl.focus();
    return;
  }

  vaultCards.push({
    nickname: cardNicknameEl.value.trim(),
    holder: cardHolderEl.value.trim(),
    number: number,
    expiry: cardExpiryEl.value,
    cvv: cardCVVEl.value,
    provider: provider.name
  });

  await saveVault();
  renderCards();
  addCardFormEl.reset();
  cardFormWrapper.classList.add("hidden");
  showCardFormBtn.classList.remove("hidden");
  cardProviderBadge.textContent = "";
  cardProviderBadge.removeAttribute("data-provider");
  vaultStatusEl.textContent = "Card saved securely.";
});
