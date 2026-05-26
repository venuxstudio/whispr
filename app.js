const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");

const refinedText = document.getElementById("refinedText");

const resultCard = document.getElementById("resultCard");

const shareBtn = document.getElementById("shareBtn");
const copyBtn = document.getElementById("copyBtn");

const historyBtn = document.getElementById("historyBtn");
const historyPanel = document.getElementById("historyPanel");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");

let mediaRecorder;
let audioChunks = [];
let recording = false;

let selectedTone = "Professional";


// TONE SELECTION

document.querySelectorAll(".tone").forEach(btn => {

  btn.addEventListener("click", () => {

    document.querySelectorAll(".tone")
      .forEach(t => t.classList.remove("active"));

    btn.classList.add("active");

    selectedTone = btn.innerText;

  });

});


// RECORD

recordBtn.onclick = async () => {

  if (!recording) {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    mediaRecorder =
      new MediaRecorder(stream);

    mediaRecorder.start();

    audioChunks = [];

    recording = true;

    statusText.innerText =
      "Listening...";

    recordBtn.innerHTML = "■";

    mediaRecorder.ondataavailable =
      event => {
        audioChunks.push(event.data);
      };

    mediaRecorder.onstop = async () => {

      statusText.innerText =
        "Refining your message...";

      const audioBlob =
        new Blob(audioChunks, {
          type: "audio/webm"
        });

      // TEMP MOCK RESPONSE

      setTimeout(() => {

        const refined =
`Hey! Just wanted to quickly update you regarding the task. I've completed most of the work and will send the final version shortly. Let me know if anything else needs to be added.`;

        refinedText.value = refined;

        resultCard.classList.remove("hidden");

        statusText.innerText =
          "Done";

        saveHistory(refined);

      }, 2500);

    };

  } else {

    mediaRecorder.stop();

    recording = false;

    recordBtn.innerHTML = "🎤";

  }

};


// COPY

copyBtn.onclick = async () => {

  await navigator.clipboard.writeText(
    refinedText.value
  );

  copyBtn.innerText = "Copied";

  setTimeout(() => {

    copyBtn.innerText = "Copy";

  }, 1500);

};


// SHARE WHATSAPP

shareBtn.onclick = () => {

  const text =
    encodeURIComponent(refinedText.value);

  window.open(
    `https://wa.me/?text=${text}`,
    "_blank"
  );

};


// HISTORY

function saveHistory(text) {

  let history =
    JSON.parse(localStorage.getItem("whisprHistory"))
    || [];

  history.unshift(text);

  localStorage.setItem(
    "whisprHistory",
    JSON.stringify(history)
  );

  renderHistory();

}


function renderHistory() {

  let history =
    JSON.parse(localStorage.getItem("whisprHistory"))
    || [];

  historyList.innerHTML = "";

  history.forEach(item => {

    const div =
      document.createElement("div");

    div.className = "history-item";

    div.innerText = item;

    historyList.appendChild(div);

  });

}

renderHistory();


// PANEL

historyBtn.onclick = () => {

  historyPanel.classList.remove("hidden");

};

closeHistory.onclick = () => {

  historyPanel.classList.add("hidden");

};