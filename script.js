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
