/**
 * securepass_test.mjs
 * Standalone test runner for the core password analysis and
 * password generator logic extracted from script.js.
 * Run with: node securepass_test.mjs
 */
// Node v24+ has globalThis.crypto built-in — no polyfill needed

// ══ Re-declare the pure functions (identical to script.js) ══════════

const COMMON_PASSWORDS = new Set([
  'password','password1','password123','123456','123456789','12345678',
  '12345','1234567','1234567890','qwerty','qwerty123','qwertyuiop',
  'abc123','abcdef','iloveyou','admin','admin123','letmein','welcome',
  'monkey','dragon','master','pass','test','1111','111111','11111111',
  '000000','1234','12341234','654321','666666','696969','123321',
  'sunshine','princess','shadow','superman','batman','trustno1',
  'access','football','baseball','soccer','hockey','starwars',
]);

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
  if (len >= 6)  score += 10;
  if (len >= 8)  score += 10;
  if (len >= 10) score += 10;
  if (len >= 12) score += 10;
  if (len >= 16) score += 10;
  if (len >= 20) score += 10;
  if (hasUpper)  score += 10;
  if (hasLower)  score += 10;
  if (hasNumber) score += 10;
  if (hasSymbol) score += 15;
  if (isCommon)             score -= 40;
  if (hasExcessiveRepeats)  score -= 15;
  if (hasSequence)          score -= 15;
  score = Math.max(0, Math.min(100, score));
  let strengthLabel, strengthClass;
  if (score >= 80)      { strengthLabel = 'Very Strong'; strengthClass = 'badge-strong'; }
  else if (score >= 60) { strengthLabel = 'Good';        strengthClass = 'badge-good'; }
  else if (score >= 40) { strengthLabel = 'Fair';        strengthClass = 'badge-fair'; }
  else if (score >= 20) { strengthLabel = 'Weak';        strengthClass = 'badge-weak'; }
  else                  { strengthLabel = 'Very Weak';   strengthClass = 'badge-very-weak'; }
  return { len, hasUpper, hasLower, hasNumber, hasSymbol,
           lengthOk, lengthGood, lengthExcellent,
           isCommon, hasExcessiveRepeats, hasSequence,
           score, strengthLabel, strengthClass };
}

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

// ══ Test runner ════════════════════════════════════════════════════

let passed = 0, failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✔ PASS — ${name}${detail ? ' | ' + detail : ''}`);
  } else {
    failed++;
    console.log(`  ✖ FAIL — ${name}${detail ? ' | ' + detail : ''}`);
  }
}

console.log('\n═══════════════════════════════════════');
console.log('   SecurePass — Core Logic Test Suite  ');
console.log('═══════════════════════════════════════\n');

// ── Analyser Tests ────────────────────────────────────────────────
console.log('[ ANALYSER TESTS ]\n');

// 1. Known common password
const r1 = analysePassword('password123');
check('password123 → isCommon = true',   r1.isCommon === true);
check('password123 → score < 20',         r1.score < 20, `score=${r1.score}`);
check('password123 → label = Very Weak', r1.strengthLabel === 'Very Weak');

// 2. Strong password
const r2 = analysePassword('Qx#9mK!pL2@rN5$vZ');
check('Strong pwd → score >= 80',     r2.score >= 80,  `score=${r2.score}`);
check('Strong pwd → hasUpper',        r2.hasUpper);
check('Strong pwd → hasLower',        r2.hasLower);
check('Strong pwd → hasNumber',       r2.hasNumber);
check('Strong pwd → hasSymbol',       r2.hasSymbol);
check('Strong pwd → label Very Strong', r2.strengthLabel === 'Very Strong');

// 3. Predictable sequence inside password
const r3 = analysePassword('MyPass1234qwerty');
check('MyPass1234qwerty → hasSequence = true', r3.hasSequence === true);

// 4. Excessive repeated characters
const r4 = analysePassword('Hello!!!World');
check('Hello!!!World → hasExcessiveRepeats = true', r4.hasExcessiveRepeats === true);

// 5. Length thresholds
const r5a = analysePassword('short');
check('short (5 chars) → lengthOk = false', r5a.lengthOk === false, `len=${r5a.len}`);

const r5b = analysePassword('TwelveChars!');
check('TwelveChars! (12) → lengthOk = true', r5b.lengthOk === true, `len=${r5b.len}`);

const r5c = analysePassword('SixteenCharsHere');
check('SixteenCharsHere (16) → lengthGood = true', r5c.lengthGood === true, `len=${r5c.len}`);

// 6. Score clamping
const r6a = analysePassword('');
check('Empty password → score = 0', r6a.score === 0);

const r6b = analysePassword('Qx#9mK!pL2@rN5$vZQx#9mK!pL2@vZ2!');
check('Long strong password → score <= 100', r6b.score <= 100, `score=${r6b.score}`);
check('Long strong password → score >= 0',  r6b.score >= 0,  `score=${r6b.score}`);

// 7. Only lowercase
const r7 = analysePassword('justlower');
check('justlower → hasUpper=false, hasNumber=false', !r7.hasUpper && !r7.hasNumber);

// 8. qwerty in common list
const r8 = analysePassword('qwerty');
check('qwerty → isCommon = true', r8.isCommon === true);

// 9. Repeated digits
const r9 = analysePassword('111122223333');
check('111122223333 → hasExcessiveRepeats = true', r9.hasExcessiveRepeats === true);

// 10. Uppercase-only common (case-insensitive check)
const r10 = analysePassword('ILOVEYOU');
check('ILOVEYOU (uppercase) → isCommon = true', r10.isCommon === true);

// ── Generator Tests ───────────────────────────────────────────────
console.log('\n[ GENERATOR TESTS ]\n');

const g1 = generatePassword(16, true, true, true, true);
check('Generate 16-char all types → length=16', g1.length === 16, `"${g1}"`);

const g2 = generatePassword(32, true, true, true, true);
check('Generate 32-char → length=32', g2.length === 32, `"${g2.substring(0, 20)}..."`);

const g3 = generatePassword(8, false, true, false, false);
check('Lowercase-only → length=8', g3.length === 8);
check('Lowercase-only → only a-z', /^[a-z]+$/.test(g3), `"${g3}"`);

const g4 = generatePassword(8, true, false, false, false);
check('Uppercase-only → only A-Z', /^[A-Z]+$/.test(g4), `"${g4}"`);

const g5 = generatePassword(8, false, false, true, false);
check('Numbers-only → only 0-9', /^[0-9]+$/.test(g5), `"${g5}"`);

const g6 = generatePassword(64, true, true, true, true);
check('Generate 64-char → length=64', g6.length === 64);

// Edge case: no charset selected → should fall back to lowercase
const g7 = generatePassword(10, false, false, false, false);
check('No charset selected → fallback to lowercase, length=10', g7.length === 10 && /^[a-z]+$/.test(g7), `"${g7}"`);

// Randomness test
const p1 = generatePassword(24, true, true, true, true);
const p2 = generatePassword(24, true, true, true, true);
check('Two 24-char passwords differ (randomness)', p1 !== p2, `"${p1}" vs "${p2}"`);

const p3 = generatePassword(24, true, true, true, true);
const p4 = generatePassword(24, true, true, true, true);
check('Another two 24-char passwords differ', p3 !== p4);

// ── Results ───────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`   Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
