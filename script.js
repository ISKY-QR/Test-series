let student = {};
let questions = [];
let answers = {};
let currentIndex = 0;
let timer;
let timeLeft = 600; // 10 mins for 10 questions
let language = "en"; // default language

// Language toggle (always visible)
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
  coachingCenter = "success-coaching-center"; // default fallback
}

// Fetch questions
fetch(`questions/${coachingCenter}.json`)
  .then(res => res.json())
  .then(data => {
    questions = data.questions;
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
let currentScreen = "start"; // track what to render

function renderCurrentScreen() {
  if (currentScreen === "start") renderStartPage();
  else if (currentScreen === "quiz") renderQuestion();
  else if (currentScreen === "result") submitTest();
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
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) { clearInterval(timer); submitTest(); }
    renderTimer();
  }, 1000);
}

function renderTimer() {
  let min = Math.floor(timeLeft / 60);
  let sec = timeLeft % 60;
  document.querySelector(".timer").innerText = `⏳ Time Left: ${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function renderQuestion() {
  currentScreen = "quiz";
  const q = questions[currentIndex];
  document.getElementById("app").innerHTML = `
    <div class="timer">Loading...</div>
    <div class="card">
      <div class="question">Q${currentIndex+1}. ${q["question_"+language]}</div>
      <div class="options">
        ${q["options_"+language].map((opt, i) => `
          <label>
            <input type="radio" name="q${q.id}" value="${i}" ${answers[q.id]==i?"checked":""}
              onchange="answers[${q.id}] = ${i}">
            <span>${opt}</span>
          </label>`).join("")}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button onclick="prevQ()" ${currentIndex===0?"disabled":""}>Prev</button>
        <button onclick="nextQ()" ${currentIndex===questions.length-1?"disabled":""}>Next</button>
      </div>
      <button style="margin-top:15px;" onclick="submitTest()">Submit Test</button>
    </div>`;
  renderTimer();
}

function prevQ(){ if(currentIndex>0){ currentIndex--; renderQuestion(); }}
function nextQ(){ if(currentIndex<questions.length-1){ currentIndex++; renderQuestion(); }}

function submitTest() {
  currentScreen = "result";
  clearInterval(timer);
  let correct = 0, incorrect = 0;
  questions.forEach(q => {
    if (answers[q.id] == q.answer) correct++;
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
        <p><b>Score:</b> ${correct}/${questions.length}</p>
      </div>
      <button onclick="viewDetailedResult()">View Detailed Result</button>
      <button onclick="downloadResult(${correct}, ${incorrect})">Download Result</button>
    </div>`;
}

function viewDetailedResult() {
  currentScreen = "details";
  let details = questions.map(q => `
    <div class="card">
      <div class="question">Q${q.id}. ${q["question_"+language]}</div>
      <p><b>Your Answer:</b> ${answers[q.id]!==undefined?q["options_"+language][answers[q.id]]:"Not Attempted"}</p>
      <p><b>Correct Answer:</b> ${q["options_"+language][q.answer]}</p>
    </div>`).join("");

  document.getElementById("app").innerHTML = `
    <div class="timer">Test Finished</div>
    ${details}
    <button onclick="submitTest()">Back to Summary</button>`;
}

function downloadResult(correct, incorrect) {
  let text = `Name: ${student.name}\nDOB: ${student.dob}\nCorrect: ${correct}\nIncorrect: ${incorrect}\nScore: ${correct}/${questions.length}\n\nDetailed Result:\n\n`;
  questions.forEach(q=>{
    text += `Q${q.id}. ${q["question_"+language]}\nYour: ${answers[q.id]!==undefined?q["options_"+language][answers[q.id]]:"Not Attempted"}\nCorrect: ${q["options_"+language][q.answer]}\n\n`;
  });
  let blob = new Blob([text], {type:"text/plain"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${student.name.replace(/\s+/g,"_")}_result.txt`;
  a.click();
}
