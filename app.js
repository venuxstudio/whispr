// ── Elements ────────────────────────────────────────────────

const recordBtn       = document.getElementById("recordBtn");
const micIcon         = recordBtn.querySelector(".mic-icon");
const stopIcon        = recordBtn.querySelector(".stop-icon");
const statusText      = document.getElementById("status");
const statusHint      = document.getElementById("statusHint");
const waveContainer   = document.getElementById("waveContainer");
const timer           = document.getElementById("timer");
const timerDisplay    = document.getElementById("timerDisplay");

const processingCard  = document.getElementById("processingCard");
const step1           = document.getElementById("step1");
const step2           = document.getElementById("step2");
const step3           = document.getElementById("step3");

const resultCard      = document.getElementById("resultCard");
const refinedText     = document.getElementById("refinedText");
const playBtn         = document.getElementById("playBtn");
const playIco         = playBtn.querySelector(".play-ico");
const pauseIco        = playBtn.querySelector(".pause-ico");
const waveformBars    = document.getElementById("waveformBars");
const audioTime       = document.getElementById("audioTime");
const confidenceFill  = document.getElementById("confidenceFill");
const confidenceValue = document.getElementById("confidenceValue");
const copyBtn         = document.getElementById("copyBtn");
const downloadBtn     = document.getElementById("downloadBtn");
const shareBtn        = document.getElementById("shareBtn");
const redoBtn         = document.getElementById("redoBtn");

const historyBtn      = document.getElementById("historyBtn");
const historyPanel    = document.getElementById("historyPanel");
const closeHistory    = document.getElementById("closeHistory");
const historyList     = document.getElementById("historyList");
const historyEmpty    = document.getElementById("historyEmpty");
const overlay         = document.getElementById("overlay");

// ── State ────────────────────────────────────────────────────

let mediaRecorder;
let audioChunks = [];
let recording   = false;
let timerInterval;
let timerSeconds = 0;
let selectedTone = "Professional";
let audioBlob;
let audioObjectURL;
let audioEl;
let playbackInterval;
let totalDuration = 0;

// ── Tone Selection ────────────────────────────────────────────

document.querySelectorAll(".tone").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tone").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    selectedTone = btn.dataset.tone;
  });
});

// ── Timer ─────────────────────────────────────────────────────

function startTimer() {
  timerSeconds = 0;
  timer.classList.remove("hidden");
  timerDisplay.textContent = "0:00";
  timerInterval = setInterval(() => {
    timerSeconds++;
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    timerDisplay.textContent = `${m}:${s.toString().padStart(2,"0")}`;
    // Auto-stop at 3 minutes
    if (timerSeconds >= 180) stopRecording();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timer.classList.add("hidden");
}

// ── Record ────────────────────────────────────────────────────

recordBtn.onclick = async () => {
  if (!recording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      audioChunks = [];
      recording = true;

      micIcon.classList.add("hidden");
      stopIcon.classList.remove("hidden");
      recordBtn.classList.add("recording");
      waveContainer.classList.add("recording");
      statusText.textContent = "Recording...";
      statusText.classList.add("active");
      statusHint.textContent = "Tap again to stop when you're done.";
      startTimer();

      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = handleAudioReady;

    } catch (err) {
      statusText.textContent = "Microphone access denied";
      statusHint.textContent = "Please allow microphone access in your browser settings.";
    }
  } else {
    stopRecording();
  }
};

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  }
  recording = false;
  micIcon.classList.remove("hidden");
  stopIcon.classList.add("hidden");
  recordBtn.classList.remove("recording");
  waveContainer.classList.remove("recording");
  stopTimer();
}

redoBtn.onclick = () => {
  resultCard.classList.add("hidden");
  statusText.textContent = "Tap to start recording";
  statusText.classList.remove("active");
  statusHint.textContent = "Hold nothing back. We'll take care of the rest.";
};

// ── Process Audio ─────────────────────────────────────────────

async function handleAudioReady() {
  audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  audioObjectURL = URL.createObjectURL(audioBlob);

  // Show processing
  resultCard.classList.add("hidden");
  processingCard.classList.remove("hidden");
  statusText.textContent = "Working on it...";
  statusHint.textContent = "Transcribing, refining, and voicing your message.";

  // Step 1 — Transcribe
  setStep(step1, "active");
  await delay(1400);
  setStep(step1, "done");

  // Step 2 — Refine
  setStep(step2, "active");
  await delay(1600);
  setStep(step2, "done");

  // Step 3 — Generate voice
  setStep(step3, "active");
  await delay(1400);
  setStep(step3, "done");

  await delay(400);

  // Reset steps for next time
  [step1, step2, step3].forEach(s => {
    s.classList.remove("active","done");
    s.classList.add("pending");
  });
  processingCard.classList.add("hidden");

  // ── MOCK result ────────────────────────────────────────────
  // In the real version, this is where you'd call:
  // 1) Whisper API for transcription
  // 2) Claude/GPT for rewriting
  // 3) ElevenLabs/OpenAI TTS for voice generation

  const toneMessages = {
    "Professional": `Hi, just a quick update on the task — I've completed the main work and will send over the final version shortly. Please let me know if you'd like any adjustments.`,
    "Friendly":     `Hey! Just wanted to give you a quick heads up — I've done most of the work and the final version is on its way. Let me know if you need anything changed!`,
    "Confident":    `Update: the task is done. Final version coming your way shortly. Ping me if you need changes.`,
    "Casual":       `Hey so I finished most of it, sending the final thing soon. Let me know if anything needs tweaking!`
  };

  const refined = toneMessages[selectedTone] || toneMessages["Professional"];
  refinedText.value = refined;

  // Fake audio duration
  totalDuration = timerSeconds > 0 ? Math.max(8, Math.round(timerSeconds * 0.6)) : 12;

  // Build waveform
  buildWaveform();

  // Confidence score (simulated)
  const score = Math.min(95, 72 + Math.floor(Math.random() * 20));
  confidenceValue.textContent = `${score}%`;
  setTimeout(() => {
    confidenceFill.style.width = `${score}%`;
  }, 200);

  // Show result
  resultCard.classList.remove("hidden");
  statusText.textContent = "Ready to send";
  statusText.classList.remove("active");
  statusHint.textContent = "Listen, tweak if needed, then share.";

  saveHistory(refined);
}

// ── Step helper ───────────────────────────────────────────────

function setStep(el, state) {
  el.classList.remove("pending", "active", "done");
  el.classList.add(state);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Waveform ──────────────────────────────────────────────────

function buildWaveform() {
  waveformBars.innerHTML = "";
  const count = 52;
  for (let i = 0; i < count; i++) {
    const bar = document.createElement("div");
    bar.className = "waveform-bar";
    const h = 10 + Math.random() * 26;
    bar.style.height = `${h}px`;
    bar.dataset.index = i;
    waveformBars.appendChild(bar);
  }
}

function updateWaveformProgress(pct) {
  const bars = waveformBars.querySelectorAll(".waveform-bar");
  const played = Math.floor(bars.length * pct);
  bars.forEach((b, i) => {
    b.classList.toggle("played", i < played);
  });
}

// ── Playback (using original audio blob as placeholder) ───────

playBtn.onclick = () => {
  if (!audioObjectURL) return;

  if (!audioEl) {
    audioEl = new Audio(audioObjectURL);
    audioEl.onended = () => {
      playIco.classList.remove("hidden");
      pauseIco.classList.add("hidden");
      clearInterval(playbackInterval);
      updateWaveformProgress(0);
      audioTime.textContent = "0:00";
    };
  }

  if (audioEl.paused) {
    audioEl.play();
    playIco.classList.add("hidden");
    pauseIco.classList.remove("hidden");
    playbackInterval = setInterval(() => {
      const dur = audioEl.duration || totalDuration;
      const pct = audioEl.currentTime / dur;
      updateWaveformProgress(pct);
      const remaining = Math.round(dur - audioEl.currentTime);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      audioTime.textContent = `${m}:${s.toString().padStart(2,"0")}`;
    }, 100);
  } else {
    audioEl.pause();
    playIco.classList.remove("hidden");
    pauseIco.classList.add("hidden");
    clearInterval(playbackInterval);
  }
};

// ── Copy ──────────────────────────────────────────────────────

copyBtn.onclick = async () => {
  await navigator.clipboard.writeText(refinedText.value);
  const orig = copyBtn.innerHTML;
  copyBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
  setTimeout(() => { copyBtn.innerHTML = orig; }, 1800);
};

// ── Download ──────────────────────────────────────────────────

downloadBtn.onclick = () => {
  if (!audioObjectURL) return;
  const a = document.createElement("a");
  a.href = audioObjectURL;
  a.download = `whispr-${Date.now()}.webm`;
  a.click();
};

// ── Share WhatsApp ────────────────────────────────────────────

shareBtn.onclick = () => {
  // Download the audio first
  if (audioObjectURL) {
    const a = document.createElement("a");
    a.href = audioObjectURL;
    a.download = `whispr-message.webm`;
    a.click();
  }
  // Then open WhatsApp
  setTimeout(() => {
    const text = encodeURIComponent("Hey! Sending you a voice message via Whispr 🎙️");
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, 800);
};

// ── History ───────────────────────────────────────────────────

function saveHistory(text) {
  let history = JSON.parse(localStorage.getItem("whisprHistory") || "[]");
  history.unshift({ text, tone: selectedTone, date: new Date().toISOString() });
  if (history.length > 30) history = history.slice(0, 30);
  localStorage.setItem("whisprHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  let history = JSON.parse(localStorage.getItem("whisprHistory") || "[]");

  if (history.length === 0) {
    historyEmpty.classList.remove("hidden");
    historyList.innerHTML = "";
    return;
  }

  historyEmpty.classList.add("hidden");
  historyList.innerHTML = "";

  history.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "history-item";

    const date = new Date(item.date);
    const formatted = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
      " · " + date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    div.innerHTML = `
      <div class="history-item-meta">${formatted} · ${item.tone || "Professional"}</div>
      ${item.text || item}
    `;

    div.onclick = () => {
      refinedText.value = item.text || item;
      resultCard.classList.remove("hidden");
      closeHistoryPanel();
    };

    historyList.appendChild(div);
  });
}

renderHistory();

// ── Panel ─────────────────────────────────────────────────────

historyBtn.onclick = () => {
  historyPanel.classList.remove("hidden");
  overlay.classList.remove("hidden");
  renderHistory();
};

function closeHistoryPanel() {
  historyPanel.classList.add("closing");
  overlay.classList.add("hidden");
  setTimeout(() => {
    historyPanel.classList.add("hidden");
    historyPanel.classList.remove("closing");
  }, 260);
}

closeHistory.onclick = closeHistoryPanel;
overlay.onclick = closeHistoryPanel;
