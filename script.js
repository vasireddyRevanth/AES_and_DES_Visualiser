// ===== Utility =====
const textToBytes = (str) => {
  const arr = Array.from(new TextEncoder().encode(str));
  // pad or trim to 16 bytes
  while (arr.length < 16) arr.push(0);
  return arr.slice(0, 16);
};

const bytesToHex = (arr) =>
  arr.map((b) => ((b ?? 0) & 0xff).toString(16).padStart(2, "0")).join(" ");

const xorArrays = (a, b) => a.map((v, i) => (v ?? 0) ^ (b[i % b.length] ?? 0));

// ===== AES-like (educational) =====
const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe,
  0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4,
  0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7,
  0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3,
  0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09,
  0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3,
  0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe,
  0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,
  0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92,
  0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c,
  0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19,
  0x73,
];

function aesRound(state, roundKey, roundNum) {
  const log = [];
  log.push(`Round ${roundNum} start: ${bytesToHex(state)}`);

  // SubBytes
  state = state.map((b) => SBOX[b]);
  log.push(`SubBytes: ${bytesToHex(state)}`);

  // ShiftRows
  for (let r = 0; r < 4; r++) {
    const row = [state[r], state[r + 4], state[r + 8], state[r + 12]];
    const shifted = row.slice(r).concat(row.slice(0, r));
    for (let c = 0; c < 4; c++) state[r + 4 * c] = shifted[c];
  }
  log.push(`ShiftRows: ${bytesToHex(state)}`);

  // MixColumns (simplified)
  for (let c = 0; c < 4; c++) {
    const col = [
      state[4 * c],
      state[4 * c + 1],
      state[4 * c + 2],
      state[4 * c + 3],
    ];
    const mixed = col.map((b, i) => col.reduce((x, y) => x ^ y) ^ b);
    for (let r = 0; r < 4; r++) state[4 * c + r] = mixed[r];
  }
  log.push(`MixColumns: ${bytesToHex(state)}`);

  // AddRoundKey
  state = xorArrays(state, roundKey);
  log.push(`AddRoundKey: ${bytesToHex(state)}`);

  return { state, log };
}

// ===== DES-like (educational Feistel) =====
function feistelRound(L, R, key, round) {
  const log = [];
  const f = (r, k) =>
    xorArrays(
      r,
      k.map((x) => (x + round) % 256),
    ); // simple fake F
  const newL = R;
  const newR = xorArrays(L, f(R, key));
  log.push(
    `Round ${round}: L=${bytesToHex(L)} R=${bytesToHex(R)} → newL=${bytesToHex(newL)} newR=${bytesToHex(newR)}`,
  );
  return { L: newL, R: newR, log };
}

// ===== Visualization state =====
let steps = [];
let prevState = null;
let currentStep = 0;
let playInterval = null;

function showState(state, title) {
  const grid = document.getElementById("stateGrid");
  grid.innerHTML = "";
  document.getElementById("stateTitle").textContent = title;

  state.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = "byte";
    div.textContent = b.toString(16).padStart(2, "0").toUpperCase();

    // highlight if value changed from previous step
    if (prevState && prevState[i] !== b) {
      div.classList.add("highlight");
      setTimeout(() => div.classList.remove("highlight"), 600);
    }
    grid.appendChild(div);
  });

  prevState = [...state];
}

function logMsg(msgs) {
  const logArea = document.getElementById("logArea");
  msgs.forEach((m) => {
    logArea.textContent += m + "\n";
  });
  logArea.scrollTop = logArea.scrollHeight;
}

function resetVisualizer() {
  steps = [];
  currentStep = 0;
  clearInterval(playInterval);
  document.getElementById("pauseBtn").disabled = true;
  document.getElementById("playBtn").disabled = false;
  document.getElementById("logArea").textContent = "";
  document.getElementById("stateGrid").innerHTML = "";
  document.getElementById("stateTitle").textContent = "Press Start";
}

function generateSteps() {
  resetVisualizer();
  const text = document.getElementById("textInput").value;
  const keyText = document.getElementById("keyInput").value;
  const cipher = document.getElementById("cipherSelect").value;
  const rounds = parseInt(document.getElementById("roundCount").value);

  const key = textToBytes(keyText);
  if (cipher === "aes") {
    let state = textToBytes(text);
    for (let i = 1; i <= rounds; i++) {
      const roundKey = xorArrays(key, Array(16).fill(i));
      const { state: newState, log } = aesRound([...state], roundKey, i);
      steps.push({ title: `AES Round ${i}`, state: newState, log });
      state = newState;
    }
  } else {
    let bytes = textToBytes(text);
    let L = bytes.slice(0, 8),
      R = bytes.slice(8, 16);
    for (let i = 1; i <= rounds; i++) {
      const { L: newL, R: newR, log } = feistelRound(L, R, key, i);
      steps.push({ title: `DES Round ${i}`, state: [...newL, ...newR], log });
      L = newL;
      R = newR;
    }
  }

  document.getElementById("stepCounter").textContent = "0";
  logMsg(["Ready. Click Next to begin visualization."]);
  updateProgress();
}

function nextStep() {
  if (currentStep < steps.length) {
    const s = steps[currentStep];
    showState(s.state, s.title);
    logMsg(s.log);
    currentStep++;
    document.getElementById("stepCounter").textContent = currentStep;
    updateProgress();

    if (currentStep === steps.length) {
      logMsg(["--- Encryption Complete ---"]);
      const hexOut = document.getElementById("hexOut");
      hexOut.textContent = bytesToHex(steps.at(-1).state);
    }
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    const s = steps[currentStep];
    showState(s.state, s.title);
    document.getElementById("stepCounter").textContent = currentStep;
    updateProgress();
  }
}

function playSteps() {
  document.getElementById("playBtn").disabled = true;
  document.getElementById("pauseBtn").disabled = false;
  playInterval = setInterval(() => {
    if (currentStep < steps.length) nextStep();
    else pausePlay();
  }, 800);
}

function updateProgress() {
  let pct = (currentStep / steps.length) * 100;
  document.querySelector(".progress-bar").style.width = pct + "%";
}

function pausePlay() {
  clearInterval(playInterval);
  document.getElementById("pauseBtn").disabled = true;
  document.getElementById("playBtn").disabled = false;
}

// ===== Event bindings =====
document.getElementById("startBtn").addEventListener("click", generateSteps);
document.getElementById("nextBtn").addEventListener("click", nextStep);
document.getElementById("prevBtn").addEventListener("click", prevStep);
document.getElementById("playBtn").addEventListener("click", playSteps);
document.getElementById("pauseBtn").addEventListener("click", pausePlay);
document.getElementById("resetBtn").addEventListener("click", resetVisualizer);
