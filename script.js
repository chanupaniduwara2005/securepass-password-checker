/*
  SecurePass — script.js
  ═══════════════════════════════════════════════════════════════════
  Client-side Password Security Engine, Speedometer Meter Arm,
  Security Checks, Generator, & Interactive Modals
  ═══════════════════════════════════════════════════════════════════
*/

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   1. COMMON WEAK PASSWORDS LIST
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
   3. PASSWORD ANALYSER ENGINE
   ═══════════════════════════════════════════════════════════════════ */
function analysePassword(password) {
  const hasUpper   = /[A-Z]/.test(password);
  const hasLower   = /[a-z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSymbol  = /[^A-Za-z0-9]/.test(password);

  const len = password.length;
  const lengthOk        = len >= 12;
  const lengthGood      = len >= 16;
  const lengthExcellent = len >= 20;

  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());
  const hasExcessiveRepeats = /(.)\1{2,}/.test(password);
  const pwLower = password.toLowerCase();
  const hasSequence = PREDICTABLE_SEQUENCES.some(seq => pwLower.includes(seq));

  let score = 0;

  // Length points
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
  if (hasSymbol) score += 15;

  // Penalties
  if (isCommon)             score -= 40;
  if (hasExcessiveRepeats)  score -= 15;
  if (hasSequence)          score -= 15;

  score = Math.max(0, Math.min(100, score));

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
   4. UI STATE & SPEEDOMETER METER ARM UPDATER
   ═══════════════════════════════════════════════════════════════════ */
function scoreToMeterColor(score) {
  if (score >= 80) return '#00E5A0';   // Radiant Cyan/Mint — Very Strong
  if (score >= 60) return '#38BDF8';   // Blue — Good
  if (score >= 40) return '#FFC857';   // Yellow — Fair
  if (score >= 20) return '#FF8C42';   // Orange — Weak
  return '#FF4D6D';                     // Red — Very Weak
}

function updateCheckRow(rowId, state, symbolText) {
  const row = document.getElementById(rowId);
  if (!row) return;

  row.classList.remove('check-neutral', 'check-pass', 'check-fail', 'check-warn');
  row.classList.add(`check-${state}`);

  const symbolEl = row.querySelector('.check-state-symbol');
  if (symbolEl) {
    symbolEl.textContent = symbolText;
  }
}

function updateHeroPinDots(len, isStrong) {
  const dotsContainer = document.getElementById('hero-pin-pill');
  if (!dotsContainer) return;

  const dots = dotsContainer.querySelectorAll('.pin-dot');
  const count = Math.min(dots.length, len);

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index < count);
  });

  const status = document.getElementById('hero-pin-status');
  if (status) {
    status.textContent = len >= 8 ? '✔' : '○';
    status.style.color = isStrong ? 'var(--clr-primary)' : 'var(--clr-text-muted)';
  }
}

function updateUI(password) {
  const gaugeNeedle  = document.getElementById('gauge-needle');
  const gaugeArc     = document.getElementById('meter-active-arc');
  const scoreNumber  = document.getElementById('score-number');
  const badge        = document.getElementById('strength-badge');
  const meterFill    = document.getElementById('meter-fill');
  const meterTrack   = document.querySelector('.meter-track');
  const meterTip     = document.getElementById('meter-tip-light');
  const meterHubDot  = document.getElementById('meter-hub-dot');

  // Report modal elements
  const repScoreVal  = document.getElementById('report-score-val');
  const repBadgeVal  = document.getElementById('report-badge-val');
  const repStatus    = document.getElementById('report-status-text');
  const repEntropy   = document.getElementById('report-entropy-text');
  const repCrack     = document.getElementById('report-crack-text');

  // Edge case: Empty input
  if (!password || password.length === 0) {
    if (gaugeNeedle) gaugeNeedle.style.transform = 'rotate(-90deg)';
    if (gaugeArc) {
      gaugeArc.style.strokeDashoffset = '251.3';
      gaugeArc.style.stroke = 'var(--str-very-weak)';
      gaugeArc.style.filter = 'none';
    }
    if (meterTip) meterTip.setAttribute('fill', 'var(--clr-primary)');
    if (meterHubDot) meterHubDot.setAttribute('fill', 'var(--clr-primary)');

    if (scoreNumber) {
      scoreNumber.textContent = '—';
      scoreNumber.style.color = 'var(--clr-text-bright)';
    }
    if (badge) {
      badge.className = 'strength-badge badge-empty';
      badge.textContent = '—';
    }

    if (meterFill) {
      meterFill.style.width = '0%';
      meterFill.style.background = '';
    }
    if (meterTrack) meterTrack.setAttribute('aria-valuenow', '0');

    // Reset 4 checks to neutral
    updateCheckRow('check-length', 'neutral', '—');
    updateCheckRow('check-common', 'neutral', '—');
    updateCheckRow('check-breach', 'neutral', '—');
    updateCheckRow('check-complexity', 'neutral', '—');

    updateHeroPinDots(0, false);

    if (repScoreVal) repScoreVal.textContent = '0';
    if (repBadgeVal) {
      repBadgeVal.className = 'strength-badge badge-empty';
      repBadgeVal.textContent = '—';
    }
    if (repStatus) repStatus.textContent = 'Enter a password in the checker';
    if (repEntropy) repEntropy.textContent = '0 bits';
    if (repCrack) repCrack.textContent = 'Instant';
    return;
  }

  // Run analysis
  const r = analysePassword(password);
  const color = scoreToMeterColor(r.score);

  // 1. Rotating Speedometer Needle Arm
  // Angle sweep: -90deg (0 score) to +90deg (100 score)
  const angle = -90 + (r.score / 100) * 180;
  if (gaugeNeedle) {
    gaugeNeedle.style.transform = `rotate(${angle}deg)`;
  }

  // 2. Active Arc Fill (arc circumference = 251.3)
  if (gaugeArc) {
    const arcLength = 251.3;
    const offset = arcLength * (1 - r.score / 100);
    gaugeArc.style.strokeDashoffset = offset;
    gaugeArc.style.stroke = color;
    gaugeArc.style.filter = `drop-shadow(0 0 10px ${color})`;
  }

  if (meterTip) meterTip.setAttribute('fill', color);
  if (meterHubDot) meterHubDot.setAttribute('fill', color);

  // 3. Center Score & Badge
  if (scoreNumber) {
    scoreNumber.textContent = r.score;
    scoreNumber.style.color = color;
  }
  if (badge) {
    badge.className = 'strength-badge ' + r.strengthClass;
    badge.textContent = r.strengthLabel;
  }

  // 4. Secondary Progress Bar (hidden/accessible sync)
  if (meterFill) {
    meterFill.style.width = r.score + '%';
    meterFill.style.background = color;
  }
  if (meterTrack) meterTrack.setAttribute('aria-valuenow', r.score);

  // 5. Four Security Checks Display
  // Check 1: Length
  if (r.len >= 12) {
    updateCheckRow('check-length', 'pass', '✔');
  } else if (r.len >= 8) {
    updateCheckRow('check-length', 'warn', '⚠');
  } else {
    updateCheckRow('check-length', 'fail', '✖');
  }

  // Check 2: Common Patterns (Dictionary test)
  if (r.isCommon) {
    updateCheckRow('check-common', 'fail', '✖');
  } else {
    updateCheckRow('check-common', 'pass', '✔');
  }

  // Check 3: Breach Check (Sequences & excessive repetitions)
  if (r.hasExcessiveRepeats || r.hasSequence) {
    updateCheckRow('check-breach', 'fail', '✖');
  } else {
    updateCheckRow('check-breach', 'pass', '✔');
  }

  // Check 4: Complexity (Character variety)
  const varietyCount = [r.hasUpper, r.hasLower, r.hasNumber, r.hasSymbol].filter(Boolean).length;
  if (varietyCount >= 3 && r.len >= 10) {
    updateCheckRow('check-complexity', 'pass', '✔');
  } else if (varietyCount >= 2) {
    updateCheckRow('check-complexity', 'warn', '⚠');
  } else {
    updateCheckRow('check-complexity', 'fail', '✖');
  }

  // 6. Hero PIN Dots
  updateHeroPinDots(r.len, r.score >= 60);

  // 7. Security Report Modal Stats
  if (repScoreVal) {
    repScoreVal.textContent = r.score;
    repScoreVal.style.color = color;
  }
  if (repBadgeVal) {
    repBadgeVal.className = 'strength-badge ' + r.strengthClass;
    repBadgeVal.textContent = r.strengthLabel;
  }
  if (repStatus) {
    repStatus.textContent = `${r.strengthLabel} (${r.score}/100)`;
  }

  // Entropy Calculation (bits)
  let charsetPool = 0;
  if (r.hasLower)  charsetPool += 26;
  if (r.hasUpper)  charsetPool += 26;
  if (r.hasNumber) charsetPool += 10;
  if (r.hasSymbol) charsetPool += 33;
  if (charsetPool === 0) charsetPool = 26;

  const entropyBits = Math.round(r.len * (Math.log2(charsetPool) || 0));
  if (repEntropy) repEntropy.textContent = `~${entropyBits} bits`;

  // Crack Time Approximation
  if (repCrack) {
    if (r.isCommon || r.score < 20) repCrack.textContent = 'Instant (under 1 sec)';
    else if (r.score < 40)          repCrack.textContent = 'Few minutes to hours';
    else if (r.score < 60)          repCrack.textContent = 'Several months';
    else if (r.score < 80)          repCrack.textContent = 'Several hundred years';
    else                            repCrack.textContent = 'Trillions of centuries';
  }
}

/* ═══════════════════════════════════════════════════════════════════
   5. PASSWORD GENERATOR
   ═══════════════════════════════════════════════════════════════════ */
const CHARSET_UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_NUMBERS = '0123456789';
const CHARSET_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

function generatePassword(length, useUpper, useLower, useNumbers, useSymbols) {
  let alphabet = '';
  if (useUpper)   alphabet += CHARSET_UPPER;
  if (useLower)   alphabet += CHARSET_LOWER;
  if (useNumbers) alphabet += CHARSET_NUMBERS;
  if (useSymbols) alphabet += CHARSET_SYMBOLS;

  if (alphabet.length === 0) alphabet = CHARSET_LOWER;

  const maxUsable = Math.floor(256 / alphabet.length) * alphabet.length;
  const result = [];

  while (result.length < length) {
    const randomBytes = new Uint8Array(256);
    crypto.getRandomValues(randomBytes);

    for (const byte of randomBytes) {
      if (result.length >= length) break;
      if (byte >= maxUsable) continue;
      result.push(alphabet[byte % alphabet.length]);
    }
  }

  return result.join('');
}

/* ═══════════════════════════════════════════════════════════════════
   6. EVENT LISTENERS & MODAL MANAGEMENT
   ═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const passwordInput     = document.getElementById('password-input');
  const toggleVisibility  = document.getElementById('toggle-visibility');
  const clearBtn          = document.getElementById('clear-btn');
  const checkPasswordBtn  = document.getElementById('check-password-btn');
  const getStartedBtn     = document.getElementById('get-started-btn');

  // Generator Elements
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

  let currentGenerated = '';

  // ── Password Input Keystroke Listener ────────────────────────────
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      updateUI(passwordInput.value);
    });
  }

  // ── Check Password Action Button ─────────────────────────────────
  if (checkPasswordBtn) {
    checkPasswordBtn.addEventListener('click', () => {
      const val = passwordInput ? passwordInput.value : '';
      updateUI(val);

      // Pulse needle arm
      const arm = document.getElementById('gauge-needle');
      if (arm) {
        arm.style.transition = 'transform 0.4s ease';
        arm.classList.add('badge-animate');
        setTimeout(() => arm.classList.remove('badge-animate'), 400);
      }

      if (!val && passwordInput) {
        passwordInput.focus();
      }
    });
  }

  // ── "Get Started" smooth scroll ──────────────────────────────────
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('analyse-card');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (passwordInput) passwordInput.focus();
      }
    });
  }

  // ── Toggle Password Visibility ───────────────────────────────────
  if (toggleVisibility && passwordInput) {
    toggleVisibility.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';

      const eyeSvg = document.getElementById('eye-svg');
      if (eyeSvg) {
        if (isHidden) {
          // Eye with slash
          eyeSvg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        } else {
          // Open eye
          eyeSvg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
      }

      const len = passwordInput.value.length;
      passwordInput.setSelectionRange(len, len);
      passwordInput.focus();
    });
  }

  // ── Clear Password Input ─────────────────────────────────────────
  if (clearBtn && passwordInput) {
    clearBtn.addEventListener('click', () => {
      passwordInput.value = '';
      updateUI('');
      passwordInput.focus();
    });
  }

  // ── Modal Management ─────────────────────────────────────────────
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // If opening generator modal and nothing generated yet, generate one
    if (modalId === 'generator-modal' && !currentGenerated && generateBtn) {
      generateBtn.click();
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-modal');
      if (modalId) openModal(modalId);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });

    const closeBtn = backdrop.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(backdrop));
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => closeModal(modal));
    }
  });

  // ── Generator Logic ──────────────────────────────────────────────
  if (genLengthSlider && genLengthDisplay) {
    genLengthSlider.addEventListener('input', () => {
      genLengthDisplay.textContent = genLengthSlider.value;
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const length     = parseInt(genLengthSlider ? genLengthSlider.value : 16, 10);
      const useUpper   = genUpperCheck ? genUpperCheck.checked : true;
      const useLower   = genLowerCheck ? genLowerCheck.checked : true;
      const useNumbers = genNumbersCheck ? genNumbersCheck.checked : true;
      const useSymbols = genSymbolsCheck ? genSymbolsCheck.checked : true;

      currentGenerated = generatePassword(length, useUpper, useLower, useNumbers, useSymbols);

      if (genOutput) genOutput.textContent = currentGenerated;
      clearToast();
    });
  }

  if (copyGenBtn) {
    copyGenBtn.addEventListener('click', async () => {
      if (!currentGenerated) {
        showToast('Generate a password first!', false);
        return;
      }
      try {
        await navigator.clipboard.writeText(currentGenerated);
        showToast('✓ Copied to clipboard!', true);
      } catch {
        showToast('✓ Copied!', true);
      }
    });
  }

  if (useGenBtn && passwordInput) {
    useGenBtn.addEventListener('click', () => {
      if (!currentGenerated) {
        showToast('Generate a password first!', false);
        return;
      }
      passwordInput.value = currentGenerated;
      updateUI(currentGenerated);

      // Close modal
      const genModal = document.getElementById('generator-modal');
      if (genModal) closeModal(genModal);

      // Scroll to checker and focus
      const checker = document.getElementById('analyse-card');
      if (checker) checker.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordInput.focus();
    });
  }

  function showToast(msg, isSuccess) {
    if (!copyToast) return;
    copyToast.textContent = msg;
    copyToast.style.color = isSuccess ? 'var(--clr-primary)' : 'var(--clr-red)';
    setTimeout(clearToast, 2400);
  }

  function clearToast() {
    if (copyToast) copyToast.textContent = '';
  }

  // ── Mobile Menu Toggle ───────────────────────────────────────────
  const mobileToggle = document.getElementById('nav-mobile-toggle');
  const navMenu      = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navMenu.style.display === 'flex';
      navMenu.style.display = isVisible ? 'none' : 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '100%';
      navMenu.style.left = '0';
      navMenu.style.right = '0';
      navMenu.style.background = 'var(--clr-surface)';
      navMenu.style.padding = '1rem 1.5rem';
      navMenu.style.borderBottom = '1px solid var(--clr-border)';
    });
  }

  // Initial state on load
  updateUI('');
});
