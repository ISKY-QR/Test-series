// script.js
let student = {};
let questions = [];
let answers = {};
let currentIndex = 0;
let timer;
let timeLeft = 600; // 10 mins for 10 questions
let language = "en"; // default language
let currentScreen = "start";

// Language toggle
document.getElementById("langToggle").addEventListener("click", () => {
  language = language === "en" ? "hi" : "en";
  document.getElementById("langToggle").innerText =
    "Switch to " + (language === "en" ? "Hindi" : "English");
  renderCurrentScreen();
});

// Detect coaching center
const urlParams = new URLSearchParams(window.location.search);
let coachingCenter = urlParams.get("center");
if (!coachingCenter) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  coachingCenter = pathParts[pathParts.length - 1];
}
if (!coachingCenter || coachingCenter.endsWith(".html")) {
  coachingCenter = "Ahmed-Coaching"; // default fallback
}

// Fetch questions
fetch(`questions/${coachingCenter}.json`)
  .then(res => res.json())
  .then(data => {
    questions = data.questions;

    // Update header with coaching name if present
    if (data.name) {
      document.querySelector(".app-title").innerText = data.name;
    }


    renderStartPage();
  })
  .catch(() => {
    document.getElementById("app").innerHTML = `
      <div class="card">
        <h2>⚠️ Invalid Coaching Center</h2>
        <p>No question file found for "${coachingCenter}".</p>
      </div>`;
  });

// ---------- Screens ----------
function renderCurrentScreen() {
  if (currentScreen === "start") renderStartPage();
  else if (currentScreen === "quiz") renderQuestion();
  else if (currentScreen === "result") submitTest(true);
  else if (currentScreen === "details") viewDetailedResult();
}

function renderStartPage() {
  currentScreen = "start";
  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>Student Details</h2>
      <input type="text" id="name" placeholder="Enter your name">
      <input type="date" id="dob">
      <button onclick="startTest()">Start Test</button>
    </div>`;
}

function startTest() {
  student.name = document.getElementById("name").value;
  student.dob = document.getElementById("dob").value;
  if (!student.name || !student.dob) return alert("Please fill all details");

  startTimer();
  currentScreen = "quiz";
  renderQuestion();

  // Warn on page exit
  window.onbeforeunload = () => "Test is in progress. Are you sure you want to leave?";
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      alert("⏰ Time is up! Auto submitting your test.");
      submitTest(true);
    }
    renderTimer();
  }, 1000);
}

function renderTimer() {
  let min = Math.floor(timeLeft / 60);
  let sec = timeLeft % 60;
  let el = document.querySelector(".timer");
  if (el) el.innerText = `⏳ Time Left: ${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function renderNavigator() {
  return `
    <div class="navigator">
      ${questions.map((q, i) => {
    let answered = answers[q.id] !== undefined;
    let classes = "nav-circle";
    if (i === currentIndex) classes += " current";
    if (answered) classes += " answered";
    return `<div class="${classes}" onclick="jumpToQ(${i})">${i + 1}</div>`;
  }).join("")}
    </div>
  `;
}

function renderQuestion() {
  const q = questions[currentIndex];

  document.getElementById("app").innerHTML = `
    <div class="timer">Loading...</div>
    <div class="card">
      <div class="question">
        Q${currentIndex + 1}. ${q["question_" + language] || ""}
        ${q.question_img ? `<div><img src="${q.question_img}" class="q-img" alt="question image"></div>` : ""}
      </div>
      <div class="options">
        ${q["options_" + language].map((opt, i) => {
    let text = "";
    let img = "";

    if (typeof opt === "string") {
      // string option, could be text or URL
      if (opt.startsWith("http") || opt.endsWith(".png") || opt.endsWith(".jpg")) {
        img = `<img src="${opt}" alt="option" class="opt-img">`;
      } else {
        text = opt;
      }
    } else if (typeof opt === "object") {
      // object option with text + img
      text = opt.text || "";
      if (opt.img) {
        img = `<img src="${opt.img}" alt="option" class="opt-img">`;
      }
    }

    return `
            <label class="option-label option-box">
              <input type="radio" name="q${q.id}" value="${i}" ${answers[q.id] == i ? "checked" : ""}
                onchange="answers[${q.id}] = ${i}">
              <span>${text}</span>
              ${img}
            </label>
          `;
  }).join("")}
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button onclick="prevQ()" ${currentIndex === 0 ? "disabled" : ""}>Prev</button>
        <button onclick="nextQ()" ${currentIndex === questions.length - 1 ? "disabled" : ""}>Next</button>
      </div>

      <button style="margin-top:15px;" onclick="submitTest()">Submit Test</button>
      
      <!-- Question Navigation Circles at Bottom -->
      <div class="question-nav">
        ${questions.map((_, i) => `
          <span class="circle ${i === currentIndex ? "active" : (answers[questions[i].id] !== undefined ? "answered" : "")}" 
                onclick="goToQ(${i})">${i + 1}</span>
        `).join("")}
      </div>
    </div>`;

  renderTimer();
}


function goToQ(index) {
  currentIndex = index;
  renderQuestion();
}


function prevQ() { if (currentIndex > 0) { currentIndex--; renderQuestion(); } }
function nextQ() { if (currentIndex < questions.length - 1) { currentIndex++; renderQuestion(); } }
function jumpToQ(i) { currentIndex = i; renderQuestion(); }

function submitTest(skipConfirm = false) {
  if (!skipConfirm) {
    if (!confirm("Are you sure you want to submit?")) return;
  }

  clearInterval(timer);
  currentScreen = "result";

  let correct = 0, incorrect = 0, skipped = 0;

  questions.forEach(q => {
    if (answers[q.id] === undefined) skipped++;
    else if (answers[q.id] == q.answer) correct++;
    else incorrect++;
  });

  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>Result</h2>
      <div class="result-summary">
        <p><b>Name:</b> ${student.name}</p>
        <p><b>DOB:</b> ${student.dob}</p>
        <p class="correct">✅ Correct: ${correct}</p>
        <p class="incorrect">❌ Incorrect: ${incorrect}</p>
        <p class="skipped">⚪ Skipped: ${skipped}</p>
        <p><b>Score:</b> ${correct}/${questions.length}</p>
      </div>
      <button onclick="viewDetailedResult()">View Detailed Result</button>
      <button onclick="downloadResult(${correct}, ${incorrect}, ${skipped})">Download Result</button>
    </div>`;
}


function viewDetailedResult() {
  currentScreen = "details";

  let details = questions.map(q => {
    let questionHTML = `
      <div class="question">
        Q${q.id}. ${q["question_" + language] || ""}
        ${q.question_img ? `<div><img src="${q.question_img}" class="q-img"></div>` : ""}
      </div>
    `;
    let yourAnswerIndex = answers[q.id];
    let optionsHTML = q["options_" + language].map((opt, i) => {
      let text = typeof opt === "string" ? opt : opt.text || "";
      let img = (typeof opt === "object" && opt.img) ? `<img src="${opt.img}" class="opt-img">` : "";
      let selected = yourAnswerIndex === i ? "✅ Your Answer" : "";
      let correct = q.answer === i ? "✔ Correct Answer" : "";
      return `<div class="card option-result">
                <span>${text} ${selected} ${correct}</span>
                ${img}
              </div>`;
    }).join("");
    return `<div class="card">${questionHTML}${optionsHTML}</div>`;
  }).join("");

  document.getElementById("app").innerHTML = `
    <div class="timer">Test Finished</div>
    ${details}
    <button onclick="submitTest(true)">Back to Summary</button>`;
}


function downloadResult(correct, incorrect, skipped) {
  let text = `Name: ${student.name}\nDOB: ${student.dob}\nCorrect: ${correct}\nIncorrect: ${incorrect}\nSkipped: ${skipped}\nScore: ${correct}/${questions.length}\n\nDetailed Result:\n\n`;
  questions.forEach(q => {
    text += `Q${q.id}. ${q["question_" + language]}\nYour: ${answers[q.id] !== undefined ? q["options_" + language][answers[q.id]] : "Skipped"}\nCorrect: ${q["options_" + language][q.answer]}\n\n`;
  });
  let blob = new Blob([text], { type: "text/plain" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${student.name.replace(/\s+/g, "_")}_result.txt`;
  a.click();
}

