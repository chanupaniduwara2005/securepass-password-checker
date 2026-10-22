/*
  SecurePass — script.js
  ═══════════════════════════════════════════════════════════════════
  HOW THIS FILE IS ORGANISED
  ──────────────────────────
  1.  COMMON WEAK PASSWORDS LIST  — top-200 most commonly used passwords
  2.  PREDICTABLE SEQUENCES LIST  — keyboard walks, number runs, etc.
  3.  ANALYSER                    — the core password scoring engine
  4.  UI UPDATER                  — pushes analysis results into the DOM
  5.  PASSWORD GENERATOR          — uses crypto.getRandomValues()
  6.  EVENT LISTENERS             — wires everything together

  SECURITY NOTES
  ──────────────
  • Passwords are ONLY held in memory for the duration of a single
    function call. They are never stored, logged, or transmitted.
  • We use textContent / value (not innerHTML) wherever user-controlled
    text touches the DOM to prevent injection attacks.
  • No third-party libraries, analytics, or network requests are made.
*/

'use strict'; // Strict mode catches common JavaScript mistakes early.

/* ═══════════════════════════════════════════════════════════════════
   1. COMMON WEAK PASSWORDS
   Why this matters: Attackers use pre-built lists (wordlists) of the
   most popular passwords. If yours is on this list it can be cracked
   in milliseconds even if it looks "long enough".
   ═══════════════════════════════════════════════════════════════════ */
const COMMON_PASSWORDS = new Set([
  'password','password1','password123','123456','123456789','12345678',
  '12345','1234567','1234567890','qwerty','qwerty123','qwertyuiop',
  'abc123','abcdef','iloveyou','admin','admin123','letmein','welcome',
  'monkey','dragon','master','pass','test','1111','111111','11111111',
  '000000','1234','12341234','654321','666666','696969','123321',
  'sunshine','princess','shadow','superman','batman','trustno1',
  'access','football','baseball','soccer','hockey','starwars',
  'liverpool','arsenal','chelsea','michael','jessica','password!',
  'passw0rd','p@ssword','p@ssw0rd','hello','hello123','changeme',
  'secret','hunter2','qazwsx','zxcvbn','zxcvbnm','asdfgh','asdfghjkl',
  '1q2w3e','1q2w3e4r','!@#$%^&*','password2','2password','god',
  'love','sex','fuck','ass','shit','damn','crap','bitch','bastard',
  'mypass','mypassword','letmein1','welcome1','login','guest',
  'computer','internet','email','office','outlook','gmail',
  '0000','9999','8888','7777','4321','13579','2580','7410',
  'abc','abcd','abcde','abcdefg','abcdefgh','aaaaa','aaaaaa',
  'qqqqq','qqqqqq','zzzzz','zzzzzz','ppppp','pppppp','lllll','llllll',
  'charlie','robert','thomas','jordan','nicole','jessica1','samantha',
  'cookie','cheese','butter','coffee','summer','winter','spring','autumn',
  'yellow','purple','silver','golden','diamond','crystal','forever',
  'matrix','hacker','cyber','phishing','firewall','rootkit',
]);

/* ═══════════════════════════════════════════════════════════════════
   2. PREDICTABLE SEQUENCES
   Why this matters: Keyboard walks (qwerty, asdf) and simple
   number runs (1234) are so common that all serious password-cracking
   tools try them first, before even touching the rest of the wordlist.
   ═══════════════════════════════════════════════════════════════════ */
const PREDICTABLE_SEQUENCES = [
  '01234','12345','23456','34567','45678','56789','67890',
  '0123456789','9876543210','98765','87654','76543','65432','54321',
  'abcde','bcdef','cdefg','defgh','efghi','fghij','ghijk','hijkl',
  'ijklm','jklmn','klmno','lmnop','mnopq','nopqr','opqrs','pqrst',
  'qrstu','rstuv','stuvw','tuvwx','uvwxy','vwxyz',
  'zyxwv','yxwvu','xwvut','wvuts','vutsr','utsrq','tsrqp','srqpo',
  'qwerty','wertyu','ertyui','rtyuio','tyuiop',
  'asdfg','sdfgh','dfghj','fghjk','ghjkl',
  'zxcvb','xcvbn','cvbnm',
  'qwer','asdf','zxcv','poiu','lkjh','mnbv',
  'aaaa','bbbb','cccc','dddd','eeee','ffff','gggg','hhhh',
  'iiii','jjjj','kkkk','llll','mmmm','nnnn','oooo','pppp',
  'qqqq','rrrr','ssss','tttt','uuuu','vvvv','wwww','xxxx',
  'yyyy','zzzz','1111','2222','3333','4444','5555','6666',
  '7777','8888','9999','0000',
];

/* ═══════════════════════════════════════════════════════════════════
   3. ANALYSER
   This is the brain of the app. It takes a password string and
   returns a structured result object describing all its properties.
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Analyses a password and returns a detailed result object.
 *
 * @param {string} password - The password to analyse (never stored).
 * @returns {object} result  - See inline comments for each property.
 */
function analysePassword(password) {

  // ── Basic character-class detection ─────────────────────────────
  // Regular expressions (regex) let us check what kinds of characters
  // exist in the password with a single test() call.
  const hasUpper   = /[A-Z]/.test(password);       // at least one A-Z
  const hasLower   = /[a-z]/.test(password);       // at least one a-z
  const hasNumber  = /[0-9]/.test(password);       // at least one digit
  const hasSymbol  = /[^A-Za-z0-9]/.test(password);// anything that isn't a letter or digit

  // ── Length thresholds ────────────────────────────────────────────
  // Each threshold gives a different amount of "length points" below.
  const len = password.length;
  const lengthOk   = len >= 12;
  const lengthGood  = len >= 16;
  const lengthExcellent = len >= 20;

  // ── Common password check ────────────────────────────────────────
  // .toLowerCase() makes the check case-insensitive, so "PASSWORD123"
  // is also caught by the common-password list.
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());

  // ── Repeated characters check ────────────────────────────────────
  // The regex /(.)\1{2,}/ matches ANY character (.) that immediately
  // repeats 2 or more times in a row — e.g. "aaa", "111", "!!!".
  // \1 is a back-reference: it matches the same character as group 1.
  const hasExcessiveRepeats = /(.)\1{2,}/.test(password);

  // ── Predictable sequence check ───────────────────────────────────
  // We convert to lowercase and then check whether any known
  // sequence string appears INSIDE the password with .includes().
  const pwLower = password.toLowerCase();
  const hasSequence = PREDICTABLE_SEQUENCES.some(seq => pwLower.includes(seq));

  // ── Scoring algorithm ────────────────────────────────────────────
  // We build a score out of 100 by adding and subtracting points.
  // Think of it like a checklist where good things earn points and
  // bad things cost points.
  let score = 0;

  // Length points — the single biggest factor in password strength
  if (len >= 6)  score += 10;
  if (len >= 8)  score += 10;
  if (len >= 10) score += 10;
  if (len >= 12) score += 10;
  if (len >= 16) score += 10;
  if (len >= 20) score += 10;

  // Character variety points
  if (hasUpper)  score += 10;
  if (hasLower)  score += 10;
  if (hasNumber) score += 10;
  if (hasSymbol) score += 15;  // symbols are rarer → bigger bonus

  // Penalties — subtract points for bad patterns
  if (isCommon)             score -= 40;  // huge penalty: known to attackers
  if (hasExcessiveRepeats)  score -= 15;
  if (hasSequence)          score -= 15;

  // Clamp to [0, 100] so we never show a negative or >100 score
  score = Math.max(0, Math.min(100, score));

  // ── Strength label ────────────────────────────────────────────────
  // Convert the numeric score into a human-readable label.
  let strengthLabel, strengthClass;
  if (score >= 80) {
    strengthLabel = 'Very Strong'; strengthClass = 'badge-strong';
  } else if (score >= 60) {
    strengthLabel = 'Good';        strengthClass = 'badge-good';
  } else if (score >= 40) {
    strengthLabel = 'Fair';        strengthClass = 'badge-fair';
  } else if (score >= 20) {
    strengthLabel = 'Weak';        strengthClass = 'badge-weak';
  } else {
    strengthLabel = 'Very Weak';   strengthClass = 'badge-very-weak';
  }

  // Return all computed values so the UI can display them.
  return {
    len,
    hasUpper, hasLower, hasNumber, hasSymbol,
    lengthOk, lengthGood, lengthExcellent,
    isCommon,
    hasExcessiveRepeats,
    hasSequence,
    score,
    strengthLabel,
    strengthClass,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   4. UI UPDATER
   Takes the analysis result object and updates every DOM element
   (meter, badges, check items) to reflect it.
   ═══════════════════════════════════════════════════════════════════ */

// Helper: update a single check item (pass / fail / warn / neutral)
function setCheck(id, state, detailText) {
  const item = document.getElementById(id);
  if (!item) return;

  // Remove all state classes then add the new one
  item.classList.remove('check-pass', 'check-fail', 'check-warn', 'check-neutral');
  item.classList.add('check-' + state);

  // Update the icon
  const iconEl = item.querySelector('.check-icon');
  if (iconEl) {
    if (state === 'pass') iconEl.textContent = '✔';
    else if (state === 'fail') iconEl.textContent = '✖';
    else if (state === 'warn') iconEl.textContent = '⚠';
    else iconEl.textContent = '○';
  }

  // Update the detail text safely (textContent prevents XSS injection)
  const detailEl = item.querySelector('.check-detail');
  if (detailEl) detailEl.textContent = detailText;
}

// Helper: determine the CSS colour variable name based on score
function scoreToMeterColor(score) {
  if (score >= 80) return '#00c8ff';   // cyan  — Very Strong
  if (score >= 60) return '#00e5a0';   // green — Good
  if (score >= 40) return '#ffc857';   // yellow — Fair
  if (score >= 20) return '#ff8c42';   // orange — Weak
  return '#ff4d6d';                     // red — Very Weak
}

function updateUI(password) {
  const meterFill   = document.getElementById('meter-fill');
  const scoreNumber = document.getElementById('score-number');
  const badge       = document.getElementById('strength-badge');
  const meterTrack  = document.querySelector('.meter-track');

  // Edge case: empty password → reset everything to neutral
  if (!password || password.length === 0) {
    meterFill.style.width = '0%';
    meterFill.style.background = '';
    scoreNumber.textContent = '0';
    badge.className = 'strength-badge badge-empty';
    badge.textContent = '—';
    meterTrack.setAttribute('aria-valuenow', '0');

    ['check-length','check-uppercase','check-lowercase',
     'check-numbers','check-symbols','check-common',
     'check-repeated','check-sequence'].forEach(id => {
      setCheck(id.replace('check-','check-'), 'neutral', '—');
    });
    // Reset check items properly using IDs
    setCheck('check-length',   'neutral', 'Enter a password to begin');
    setCheck('check-uppercase','neutral', '—');
    setCheck('check-lowercase','neutral', '—');
    setCheck('check-numbers',  'neutral', '—');
    setCheck('check-symbols',  'neutral', '—');
    setCheck('check-common',   'neutral', '—');
    setCheck('check-repeated', 'neutral', '—');
    setCheck('check-sequence', 'neutral', '—');
    return;
  }

  // Run the analysis
  const r = analysePassword(password);

  // ── Meter fill ────────────────────────────────────────────────────
  meterFill.style.width = r.score + '%';
  meterFill.style.background = scoreToMeterColor(r.score);
  meterFill.style.boxShadow = `0 0 10px ${scoreToMeterColor(r.score)}`;

  // Update ARIA value for screen readers
  meterTrack.setAttribute('aria-valuenow', r.score);

  // ── Score number ──────────────────────────────────────────────────
  scoreNumber.textContent = r.score;
  scoreNumber.style.color = scoreToMeterColor(r.score);

  // ── Strength badge ────────────────────────────────────────────────
  badge.className = 'strength-badge ' + r.strengthClass + ' badge-animate';
  badge.textContent = r.strengthLabel;
  // Remove animation class after it plays so it can re-trigger next time
  badge.addEventListener('animationend', () => badge.classList.remove('badge-animate'), { once: true });

  // ── Individual check items ─────────────────────────────────────────
  // Length
  let lengthDetail;
  if (r.len === 0)       lengthDetail = 'No characters entered';
  else if (r.len < 8)    lengthDetail = `${r.len} chars — too short, minimum 8`;
  else if (r.len < 12)   lengthDetail = `${r.len} chars — acceptable, aim for 12+`;
  else if (r.len < 16)   lengthDetail = `${r.len} chars — good, aim for 16+`;
  else if (r.len < 20)   lengthDetail = `${r.len} chars — very good`;
  else                   lengthDetail = `${r.len} chars — excellent`;

  setCheck('check-length',
    r.len >= 12 ? 'pass' : r.len >= 8 ? 'warn' : 'fail',
    lengthDetail
  );

  setCheck('check-uppercase',
    r.hasUpper ? 'pass' : 'fail',
    r.hasUpper ? 'Contains uppercase letters ✓' : 'Missing — add at least one A–Z character'
  );

  setCheck('check-lowercase',
    r.hasLower ? 'pass' : 'fail',
    r.hasLower ? 'Contains lowercase letters ✓' : 'Missing — add at least one a–z character'
  );

  setCheck('check-numbers',
    r.hasNumber ? 'pass' : 'warn',
    r.hasNumber ? 'Contains digits ✓' : 'None found — adding numbers increases strength'
  );

  setCheck('check-symbols',
    r.hasSymbol ? 'pass' : 'warn',
    r.hasSymbol ? 'Contains special symbols ✓' : 'None found — symbols greatly increase strength'
  );

  setCheck('check-common',
    r.isCommon ? 'fail' : 'pass',
    r.isCommon
      ? '⚠ This is a well-known password — change it immediately'
      : 'Not found in common-password list ✓'
  );

  setCheck('check-repeated',
    r.hasExcessiveRepeats ? 'fail' : 'pass',
    r.hasExcessiveRepeats
      ? 'Found 3+ consecutive repeated characters (e.g. "aaa")'
      : 'No excessive repeats detected ✓'
  );

  setCheck('check-sequence',
    r.hasSequence ? 'fail' : 'pass',
    r.hasSequence
      ? 'Contains a predictable sequence (e.g. 1234, qwerty, abcd)'
      : 'No predictable sequences detected ✓'
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. PASSWORD GENERATOR
   Uses the Web Crypto API (crypto.getRandomValues) which is built
   into all modern browsers and provides truly unpredictable random
   numbers — unlike Math.random() which can sometimes be predicted.

   HOW IT WORKS:
   1. Build an "alphabet" string from the selected character types.
   2. Create a Uint8Array (an array of integers 0–255).
   3. Fill it with random bytes using crypto.getRandomValues().
   4. Map each random byte to a character in the alphabet using modulo
      (remainder) division — but with bias rejection so every character
      has an exactly equal chance of being chosen.
   ═══════════════════════════════════════════════════════════════════ */

const CHARSET_UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_NUMBERS = '0123456789';
const CHARSET_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

function generatePassword(length, useUpper, useLower, useNumbers, useSymbols) {
  // Build the alphabet from the selected options
  let alphabet = '';
  if (useUpper)   alphabet += CHARSET_UPPER;
  if (useLower)   alphabet += CHARSET_LOWER;
  if (useNumbers) alphabet += CHARSET_NUMBERS;
  if (useSymbols) alphabet += CHARSET_SYMBOLS;

  // Safety: always fall back to lowercase if no types are selected
  if (alphabet.length === 0) alphabet = CHARSET_LOWER;

  // Bias rejection: to avoid statistical bias when the alphabet length
  // doesn't divide evenly into 256, we discard values above the last
  // "safe" threshold. This ensures every character is equally likely.
  const maxUsable = Math.floor(256 / alphabet.length) * alphabet.length;

  const result = [];
  // We may need more than `length` random bytes because some might be
  // discarded by bias rejection, so we generate in batches.
  while (result.length < length) {
    // Fill a buffer of 256 random bytes at once (more efficient than one-at-a-time)
    const randomBytes = new Uint8Array(256);
    crypto.getRandomValues(randomBytes); // This is the secure random call

    for (const byte of randomBytes) {
      if (result.length >= length) break; // Done
      if (byte >= maxUsable) continue;    // Discard — bias rejection
      result.push(alphabet[byte % alphabet.length]);
    }
  }

  return result.join('');
}

/* ═══════════════════════════════════════════════════════════════════
   6. EVENT LISTENERS
   This section wires all the interactive elements together.
   'DOMContentLoaded' fires when the HTML has been fully loaded,
   so we know all elements exist before we try to access them.
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Grab DOM elements ─────────────────────────────────────────────
  const passwordInput     = document.getElementById('password-input');
  const toggleVisibility  = document.getElementById('toggle-visibility');
  const eyeIcon           = document.getElementById('eye-icon');
  const clearBtn          = document.getElementById('clear-btn');

  const genLengthSlider   = document.getElementById('gen-length');
  const genLengthDisplay  = document.getElementById('gen-length-display');
  const genUpperCheck     = document.getElementById('gen-uppercase');
  const genLowerCheck     = document.getElementById('gen-lowercase');
  const genNumbersCheck   = document.getElementById('gen-numbers');
  const genSymbolsCheck   = document.getElementById('gen-symbols');
  const generateBtn       = document.getElementById('generate-btn');
  const genOutput         = document.getElementById('gen-output');
  const copyGenBtn        = document.getElementById('copy-gen-btn');
  const useGenBtn         = document.getElementById('use-gen-btn');
  const copyToast         = document.getElementById('copy-toast');

  // Keep track of the currently generated password
  let currentGenerated = '';

  // ── Password input: analyse on every keystroke ────────────────────
  // The 'input' event fires whenever the value changes (typing, paste,
  // cut, autocomplete, etc.) — more reliable than 'keyup'.
  passwordInput.addEventListener('input', () => {
    // We read .value (not innerHTML) — safe for user-controlled content
    updateUI(passwordInput.value);
  });

  // ── Show / hide password toggle ───────────────────────────────────
  // We just swap the input type between 'password' (dots) and 'text'.
  toggleVisibility.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeIcon.textContent = isHidden ? '🙈' : '👁️';
    toggleVisibility.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    // Move cursor to end of input after toggle
    const len = passwordInput.value.length;
    passwordInput.setSelectionRange(len, len);
    passwordInput.focus();
  });

  // ── Clear button ──────────────────────────────────────────────────
  clearBtn.addEventListener('click', () => {
    passwordInput.value = '';
    updateUI('');
    passwordInput.focus();
  });

  // ── Generator: length slider ──────────────────────────────────────
  genLengthSlider.addEventListener('input', () => {
    // Update the displayed number next to the slider as it moves
    genLengthDisplay.textContent = genLengthSlider.value;
  });

  // ── Generator: generate button ────────────────────────────────────
  generateBtn.addEventListener('click', () => {
    const length     = parseInt(genLengthSlider.value, 10);
    const useUpper   = genUpperCheck.checked;
    const useLower   = genLowerCheck.checked;
    const useNumbers = genNumbersCheck.checked;
    const useSymbols = genSymbolsCheck.checked;

    currentGenerated = generatePassword(length, useUpper, useLower, useNumbers, useSymbols);

    // Safe: textContent avoids any possible injection
    genOutput.textContent = currentGenerated;
    clearToast();
  });

  // ── Generator: copy button ────────────────────────────────────────
  copyGenBtn.addEventListener('click', async () => {
    if (!currentGenerated) {
      showToast('⚡ Generate a password first!', false);
      return;
    }
    await copyToClipboard(currentGenerated);
  });

  // ── Generator: "Use in checker" button ───────────────────────────
  // Copies the generated password into the checker input and triggers
  // a live analysis so the user can see its strength score.
  useGenBtn.addEventListener('click', () => {
    if (!currentGenerated) {
      showToast('⚡ Generate a password first!', false);
      return;
    }
    // Set the value and manually fire the 'input' event so the
    // analyser picks up the change (programmatic assignment doesn't
    // automatically fire 'input' in most browsers).
    passwordInput.value = currentGenerated;
    passwordInput.dispatchEvent(new Event('input'));
    passwordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    passwordInput.focus();
    showToast('✓ Password loaded into checker!', true);
  });

  // ── Clipboard helper ──────────────────────────────────────────────
  // The Clipboard API is asynchronous (it returns a Promise), so we
  // use async/await to wait for it to finish before showing feedback.
  async function copyToClipboard(text) {
    try {
      // navigator.clipboard.writeText() is the modern, secure API
      await navigator.clipboard.writeText(text);
      showToast('✓ Copied to clipboard!', true);
    } catch {
      // Fall back for browsers/contexts where clipboard API is blocked
      try {
        legacyCopy(text);
        showToast('✓ Copied (fallback method)!', true);
      } catch {
        showToast('✗ Copy failed — please copy manually.', false);
      }
    }
  }

  // Legacy copy using a temporary textarea element (works in older browsers)
  function legacyCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy'); // deprecated but still works as a fallback
    document.body.removeChild(textarea);
  }

  // ── Toast notification helpers ────────────────────────────────────
  let toastTimer = null;

  function showToast(message, success) {
    copyToast.textContent = message;
    copyToast.style.color = success ? 'var(--clr-green)' : 'var(--clr-red)';
    copyToast.style.opacity = '1';

    // Auto-hide after 2.5 seconds
    clearTimeout(toastTimer);
    toastTimer = setTimeout(clearToast, 2500);
  }

  function clearToast() {
    copyToast.textContent = '';
  }

  // ── Initial UI state ──────────────────────────────────────────────
  // Run once on load so check items are in their neutral state.
  updateUI('');
});
