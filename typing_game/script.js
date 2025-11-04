const quotes = [
  'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
  'There is nothing more deceptive than an obvious fact.',
  'I never make exceptions. An exception disproves the rule.',
  'What one man can invent another can discover.',
  'Nothing clears up a case so much as stating it to another person.',
  'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
  'The world is full of obvious things which nobody by any chance ever observes.'
];

let words = [];
let wordIndex = 0;
let startTime = null;
let typedChars = 0;
let prevLen = 0;
let timerId = null;

const quoteEl = document.getElementById('quote');
const messageEl = document.getElementById('message');
const inputEl = document.getElementById('typed-value');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');
const barEl = document.getElementById('progress-bar');
const timerEl = document.getElementById('timer');

const pad2 = (n) => String(n).padStart(2, '0');
const fmtTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
};

function setQuote(text) {
  words = text.split(' ');
  wordIndex = 0;
  quoteEl.innerHTML = words.map(w => `<span>${w} </span>`).join('');
  [...quoteEl.childNodes].forEach(n => n.className = '');
  quoteEl.childNodes[0].className = 'highlight';
  setProgress(0);
}

function setProgress(pct) { barEl.style.width = `${pct}%`; }

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timerEl.textContent = fmtTime(elapsed);
  }, 200);
}

function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

function begin() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  setQuote(q);
  startTime = Date.now();
  typedChars = 0;
  prevLen = 0;
  inputEl.value = '';
  inputEl.removeAttribute('disabled');
  inputEl.classList.remove('error');
  inputEl.focus();
  startBtn.disabled = true;
  messageEl.textContent = '';
  messageEl.className = 'message';
  startTimer();
}

function finish() {
  stopTimer();
  const elapsed = Date.now() - startTime;
  messageEl.textContent = `완료! ${ (elapsed / 1000).toFixed(2) }초`;
  messageEl.className = 'message success';
  inputEl.setAttribute('disabled', 'true');
  startBtn.disabled = false;
}

function hardReset() {
  stopTimer();
  quoteEl.innerHTML = '';
  inputEl.value = '';
  inputEl.classList.remove('error');
  inputEl.removeAttribute('disabled');
  startBtn.disabled = false;
  timerEl.textContent = '00:00';
  setProgress(0);
  messageEl.textContent = '';
  messageEl.className = 'message';
  words = [];
  wordIndex = 0;
  startTime = null;
  typedChars = 0;
  prevLen = 0;
}

startBtn.addEventListener('click', begin);
resetBtn.addEventListener('click', hardReset);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !startBtn.disabled) begin();
});

inputEl.addEventListener('input', () => {
  if (!words.length) return;
  const current = words[wordIndex];
  const typed = inputEl.value;
  typedChars += typed.length - prevLen;
  prevLen = typed.length;

  if (typed === current && wordIndex === words.length - 1) {
    quoteEl.childNodes[wordIndex].className = 'done';
    setProgress(100);
    finish();
    return;
  }

  if (typed.endsWith(' ') && typed.trim() === current) {
    quoteEl.childNodes[wordIndex].className = 'done';
    inputEl.value = '';
    prevLen = 0;
    wordIndex++;
    [...quoteEl.childNodes].forEach(n => n.classList.remove('highlight'));
    if (quoteEl.childNodes[wordIndex]) {
      quoteEl.childNodes[wordIndex].classList.add('highlight');
    }
    setProgress(Math.round((wordIndex / words.length) * 100));
    inputEl.classList.remove('error');
    messageEl.textContent = '';
    return;
  }

  if (current.startsWith(typed)) {
    inputEl.classList.remove('error');
    messageEl.textContent = '';
  } else {
    inputEl.classList.add('error');
    messageEl.textContent = '오타가 있어요';
    messageEl.className = 'message warn';
  }
});
