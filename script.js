const QUESTIONS = [
  {id:1,q:"Smallest prime number?",opts:["0","1","2","3"],ans:2},
  {id:2,q:"Chemical symbol 'O'?",opts:["Gold","Oxygen","Iron","Silver"],ans:1},
  {id:3,q:"12 x 8?",opts:["96","108","86","88"],ans:0},
  {id:4,q:"Red Planet?",opts:["Venus","Saturn","Mars","Jupiter"],ans:2},
  {id:5,q:"Author of Romeo & Juliet?",opts:["Dickens","Shakespeare","Twain","Tolstoy"],ans:1},
  {id:6,q:"H2O is?",opts:["Salt","Water","Ammonia","Hydrogen"],ans:1},
  {id:7,q:"Language for web pages?",opts:["Python","JavaScript","C++","Swift"],ans:1},
  {id:8,q:"Capital of India?",opts:["Mumbai","New Delhi","Kolkata","Chennai"],ans:1},
  {id:9,q:"Device AC→DC?",opts:["Transformer","Rectifier","Oscillator","Amplifier"],ans:1},
  {id:10,q:"CPU stands for?",opts:["Central Processing Unit","Computer Personal Unit","Central Performance Unit","Control Processing Unit"],ans:0}
];

const TOTAL_MINUTES=10, STORAGE_KEY="omr_attempts_v2";
let state={student:null,answers:{},current:0,endsAt:null,timer:null};

// DOM refs
const startScreen=document.getElementById("startScreen"),
 quizScreen=document.getElementById("quizScreen"),
 scoreScreen=document.getElementById("scoreScreen"),
 startBtn=document.getElementById("startBtn"),
 nameInput=document.getElementById("studentName"),
 dobInput=document.getElementById("studentDob"),
 studentBadge=document.getElementById("studentBadge"),
 dobBadge=document.getElementById("dobBadge"),
 timerEl=document.getElementById("timer"),
 qCount=document.getElementById("qCount"),
 progBar=document.getElementById("progBar"),
 qBox=document.getElementById("questionBox"),
 prevBtn=document.getElementById("prevBtn"),
 nextBtn=document.getElementById("nextBtn"),
 submitBtn=document.getElementById("submitBtn"),
 qNav=document.getElementById("qNav"),
 marksText=document.getElementById("marksText"),
 correctCount=document.getElementById("correctCount"),
 incorrectCount=document.getElementById("incorrectCount"),
 resultTable=document.getElementById("resultTable"),
 resultBody=resultTable.querySelector("tbody"),
 toggleDetailsBtn=document.getElementById("toggleDetailsBtn"),
 backBtn=document.getElementById("backToStartBtn"),
 downloadBtn=document.getElementById("downloadJsonBtn"),
 attemptsList=document.getElementById("attemptsList"),
 historyBtn=document.getElementById("viewHistoryBtn");

function fmt(sec){let m=Math.floor(sec/60),s=sec%60;return `${m}:${s.toString().padStart(2,"0")}`;}

function renderQ(){
 let q=QUESTIONS[state.current];
 qCount.textContent=`Q ${state.current+1}/${QUESTIONS.length}`;
 qBox.innerHTML=`<div><b>${q.q}</b></div>`;
 q.opts.forEach((o,i)=>{
   let d=document.createElement("div");
   d.className="option"+(state.answers[q.id]==i?" selected":"");
   d.textContent=o;
   d.onclick=()=>{state.answers[q.id]=i;renderQ();renderNav();};
   qBox.appendChild(d);
 });
 prevBtn.disabled=state.current===0;
 nextBtn.disabled=state.current===QUESTIONS.length-1;
 progBar.style.width=`${Object.keys(state.answers).length/QUESTIONS.length*100}%`;
}

function renderNav(){
 qNav.innerHTML="";
 QUESTIONS.forEach((q,i)=>{
   let b=document.createElement("button");b.textContent=i+1;
   if(state.answers[q.id]!=null){b.style.background="#2563eb";b.style.color="#fff";}
   b.onclick=()=>{state.current=i;renderQ();};qNav.appendChild(b);
 });
}

function startTimer(){
 clearInterval(state.timer);
 state.timer=setInterval(()=>{
   let remain=Math.max(0,Math.floor((state.endsAt-Date.now())/1000));
   timerEl.textContent=fmt(remain);
   if(remain<=0){clearInterval(state.timer);submit();}
 },1000);
}

startBtn.onclick=()=>{
 if(!nameInput.value||!dobInput.value) return alert("Fill name and DOB");
 state.student={name:nameInput.value,dob:dobInput.value};
 state.answers={};state.current=0;
 state.endsAt=Date.now()+TOTAL_MINUTES*60000;
 studentBadge.textContent="Student: "+state.student.name;
 dobBadge.textContent="DOB: "+state.student.dob;
 startScreen.style.display="none";quizScreen.style.display="block";
 renderQ();renderNav();startTimer();
};

prevBtn.onclick=()=>{if(state.current>0){state.current--;renderQ();}};
nextBtn.onclick=()=>{if(state.current<QUESTIONS.length-1){state.current++;renderQ();}};
submitBtn.onclick=()=>{if(confirm("Submit test?"))submit();};

function submit(){
 clearInterval(state.timer);
 let details=QUESTIONS.map(q=>{
   let sel=state.answers[q.id],ok=sel===q.ans;
   return {q:q.q,opts:q.opts,sel,correct:q.ans,mark:ok?1:0};
 });
 let total=details.reduce((a,b)=>a+b.mark,0);
 let attempt={student:state.student,details,total,submitted:Date.now()};
 let arr=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");arr.unshift(attempt);
 localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));
 showResult(attempt);
}

function showResult(at){
 quizScreen.style.display="none";scoreScreen.style.display="block";
 let correct=at.details.filter(d=>d.mark).length;
 let incorrect=at.details.length-correct;
 marksText.textContent=`${at.total}/${QUESTIONS.length}`;
 correctCount.textContent=correct; incorrectCount.textContent=incorrect;
 resultBody.innerHTML="";
 at.details.forEach((d,i)=>{
   let tr=document.createElement("tr");
   tr.innerHTML=`<td>${i+1}</td><td>${d.q}</td>
     <td>${d.sel!=null?d.opts[d.sel]:"-"}</td>
     <td>${d.opts[d.correct]}</td>
     <td>${d.mark?'<span class="correct">1</span>':'<span class="wrong">0</span>'}</td>`;
   resultBody.appendChild(tr);
 });
 renderAttempts();
}

toggleDetailsBtn.onclick=()=>{
 resultTable.style.display=resultTable.style.display==="none"?"table":"none";
 toggleDetailsBtn.textContent=resultTable.style.display==="none"?"View Detailed Results":"Hide Details";
};
backBtn.onclick=()=>{scoreScreen.style.display="none";startScreen.style.display="block";};
downloadBtn.onclick=()=>{
 let arr=localStorage.getItem(STORAGE_KEY);if(!arr)return;
 let blob=new Blob([arr],{type:"application/json"});
 let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="results.json";a.click();
};

function renderAttempts(){
 attemptsList.innerHTML="";
 let arr=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
 if(arr.length===0){attemptsList.textContent="No attempts yet";return;}
 arr.forEach(at=>{
   let d=document.createElement("div");
   d.innerHTML=`${at.student.name} - ${at.total}/${QUESTIONS.length} (${new Date(at.submitted).toLocaleString()})`;
   attemptsList.appendChild(d);
 });
}
historyBtn.onclick=()=>{startScreen.style.display="none";scoreScreen.style.display="block";renderAttempts();};
