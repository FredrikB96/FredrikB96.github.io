/* =================================================================== *
 *  1.  CONSTANTS & GLOBAL STATE                                       *
 * =================================================================== */
const MAX_NEW_CARDS = 30;
const MAX_REVIEW_CARDS = 100;
const MAX_NEW_BY_MODE    = { "1": MAX_NEW_CARDS,  "2": MAX_NEW_CARDS,  "3": MAX_NEW_CARDS,  "4": MAX_NEW_CARDS  };
const MAX_REVIEW_BY_MODE = { "1": MAX_REVIEW_CARDS, "2": MAX_REVIEW_CARDS, "3": MAX_REVIEW_CARDS, "4": MAX_REVIEW_CARDS };
const MODES              = ["1", "2", "3", "4"];
const MODE_LABELS        = {
  "1": "EN → Kanji",
  "2": "Kanji → Reading",
  "3": "Kanji → English",
  "4": "Sentence → Translation",
  "random": "Random"
};
const DAY_MS             = 86_400_000;
const LAPSE_DELAY_MS = 120_000; 

let vocabList        = [];               // deck currently in memory
let currentCard      = null;             // card being shown
let quizMode         = "random";         // "1" | "2" | "3" | "4" | "random"
let direction        = "jp-en";          // only matters for mode-4
let showHints        = false;
let showExample      = false;
let isVocabLoaded    = false;
let dailyStats       = loadDailyStats(); // {date,newShownByMode,reviewShownByMode}

let DEBUG = false;                // default = off
function dbg(...args) { if (DEBUG) console.log(...args); }

/* =================================================================== *
 *  2.  DOM-LOADERS (UI EVENT WIRING)                                   *
 * =================================================================== */
const $      = id  => document.getElementById(id);
const toggle = (id, show) => $(id).classList.toggle("hidden", !show);

/* ---- on page ready ------------------------------------------------ */
window.addEventListener("DOMContentLoaded", () => {
  $("deckSelector").value   = localStorage.getItem("lastUsedDeck") || "ALL";
  $("todayDate").innerText  = new Date().toLocaleDateString(undefined,
                                {year:"numeric",month:"long",day:"numeric",weekday:"short"});
  $("debugToggle").addEventListener("change", e => {
    DEBUG = e.target.checked;
    showToast(`Debug ${DEBUG ? "ON" : "OFF"}`);
  });
  attachEventHandlers();
  updateModeStatsDisplay();
});

/* ---- UI controls -------------------------------------------------- */
$("quizMode").addEventListener("change", e => {
  quizMode = e.target.value;
  toggle("directionWrapper", quizMode === "4");
  showToast(`Mode set to ${MODE_LABELS[quizMode]}`);
  showNextCard();
});
$("direction").addEventListener("change", e => { direction = e.target.value; showNextCard(); });
$("showHints")   .addEventListener("change", e => { showHints   = e.target.checked; toggle("hints",   showHints);   });
$("showExample") .addEventListener("change", e => { showExample = e.target.checked; toggle("example", showExample); });
$("nextBtn")     .addEventListener("click",  () => { $("nextBtn").classList.add("hidden"); showNextCard(); });

$("csvFile")         .addEventListener("change", handleFileUpload);
$("loadDefaultBtn")  .addEventListener("click",  loadDefaultVocab);
$("downloadBackupBtn").addEventListener("click", downloadBackup);
$("uploadBackupInput").addEventListener("change", uploadBackup);

/* stats toggle */
$("toggleStatsBtn").addEventListener("click", () => {
  toggle("perModeStats", $("perModeStats").classList.contains("hidden"));
  $("toggleStatsBtn").innerText =
    $("perModeStats").classList.contains("hidden") ? "📊 Show Stats" : "📉 Hide Stats";
});

/* =================================================================== *
 *  3.  HELPERS                                                        *
 * =================================================================== */
// ------- toast notification -----------------------------------------
function showToast(msg) {
  if (!document.getElementById("toast-style")) {
    const style = document.createElement("style");
    style.id = "toast-style";
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 20px; left: 50%; transform: translateX(-50%);
        background:#333;color:#fff;padding:10px 16px;border-radius:6px;
        font-size:14px; opacity:0.92; transition: opacity .6s, transform .6s;
        z-index: 9999;
      }
      .toast.fade { opacity:0; transform: translateX(-50%) translateY(20px); }
    `;
    document.head.appendChild(style);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add("fade"), 2000);   // start fade
  setTimeout(()=>t.remove(), 2600);                // remove from DOM
}

// ------- daily stats -----------------------------------------------
function todayISO() { return new Date().toLocaleDateString("en-CA"); }
function loadDailyStats() {
  const saved = JSON.parse(localStorage.getItem("dailyStats") || "{}");
  if (saved.date !== todayISO()) {
    const blank = { date: todayISO(), newShownByMode:{}, reviewShownByMode:{} };
    MODES.forEach(m => { blank.newShownByMode[m]=0; blank.reviewShownByMode[m]=0; });
    localStorage.setItem("dailyStats", JSON.stringify(blank));
    return blank;
  }
  MODES.forEach(m => { saved.newShownByMode[m] ??= 0; saved.reviewShownByMode[m] ??= 0; });
  return saved;
}
function saveDailyStats() { localStorage.setItem("dailyStats", JSON.stringify(dailyStats)); }

// ------- SRS utilities ---------------------------------------------
function defaultSRS() { return { repetitions:0, interval:0, ease:2.5, due:Date.now() }; }
function createCard(base, savedSRS = {}) { MODES.forEach(m => savedSRS[m] ??= defaultSRS());  return { ...base, srsByMode:savedSRS }; }
function scheduleCard(card, mode, grade) {
  const s = card.srsByMode[mode];

  if (grade < 3) {                // ✘ wrong answer → “lapse”
    if (s.repetitions === 0) {
      // Card was new, so promote to "review" by setting repetitions=1
      s.repetitions = 1;
    }
    s.interval = 0;
    s.due      = Date.now() + LAPSE_DELAY_MS;
  } else {                        // ✔ correct answer → normal SM-2 increments
    if (s.interval === 0) {
      // If this was a lapsed card, treat as first review (interval=1 day)
      s.interval = 1;
    } else {
      s.interval = (s.repetitions === 1) ? 1
                 : (s.repetitions === 2) ? 6
                 : Math.round(s.interval * s.ease);
    }
    s.repetitions++;
    s.ease = Math.max(1.3,
      s.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    s.due  = Date.now() + s.interval * DAY_MS;
  }

  saveProgress();
}
// ------- storage ----------------------------------------------------
function saveProgress() {
  const compact = vocabList.map(({word,srsByMode}) => ({word,srsByMode}));
  localStorage.setItem("vocabProgress", JSON.stringify(compact));
}
function loadProgress() { return JSON.parse(localStorage.getItem("vocabProgress") || "[]"); }

// ------- misc utilities --------------------------------------------
function shuffleArray(arr){ return arr.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]); }
function extractReading(raw) {
    if (!raw) return "";
  
    return raw
      //     ([^\s\p{Script=Hiragana}\p{Script=Katakana}\[\]]+)  → kanji chunk
      //     \[([^\]]+)\]                                        → reading inside [...]
      .replace(/([^\s\p{sc=Hiragana}\p{sc=Katakana}\[\]]+)\[([^\]]+)\]/gu, "$2")
  
      .replace(/\s+/g, "");
  }
function dueCardsForMode(mode){
  return vocabList.filter(card=>{
    const s=card.srsByMode[mode]; if(!s) return false;
    const due = s.due<=Date.now(), isNew=s.repetitions===0;
    if(isNew  && dailyStats.newShownByMode[mode]    < MAX_NEW_BY_MODE[mode]    && due) return true;
    if(!isNew && dailyStats.reviewShownByMode[mode] < MAX_REVIEW_BY_MODE[mode] && due) return true;
    return false;
  });
}
function modesWithDue(){ return MODES.filter(m=>dueCardsForMode(m).length); }
function getRandomMode(){ return MODES[Math.floor(Math.random()*MODES.length)]; }


/* =================================================================== *
 *  4.  CORE FUNCTIONS                                                 *
 * =================================================================== */
// ---------- quiz core -----------------
function showNextCard(){
  dbg("=== showNextCard() start ===");
  if(!vocabList.length) return;
  dbg("userChoice", quizMode, "mode pool before pick", modesWithDue());

  /* pick a mode with cards */
  const userChoice = quizMode;  
  let mode = (userChoice === "random") ? getRandomMode() : userChoice;
  let due  = dueCardsForMode(mode);
  dbg(`[dueCardsForMode] mode=${mode}  due=${due.length}`);


  if(!due.length){
    const alt = modesWithDue().filter(m=>m!==mode);
    if(!alt.length){ if(isVocabLoaded) alert("No cards due! Come back later."); return; }
        mode = alt[Math.random()*alt.length|0];
        due  = dueCardsForMode(mode);
    
       /* Only notify & change the drop-down if the user did NOT choose “Random”. */
        if (userChoice !== "random") {
         $("quizMode").value = mode;                      // reflect the new mode in the UI
          toggle("directionWrapper", mode === "4");
          showToast(`Auto-switched to ${MODE_LABELS[mode]}`);
        } else {
          /* keep the selector on “Random”; still adjust the JP/EN direction UI for mode-4 */
          toggle("directionWrapper", mode === "4");
        }
  }

  currentCard = due[Math.random()*due.length|0];
  const [q, correct, hint] = getCardPrompt(currentCard, mode);
  const opts = generateOptions(correct, currentCard.grammar, mode);

  $("question").innerText  = q;
  $("hints").textContent   = hint;
  $("example").textContent = `JP: ${currentCard.exampleJP??""}\nEN: ${currentCard.exampleEN??""}`;
  toggle("hints", showHints); toggle("example", showExample);
  dbg("Picked mode", mode,
    "| pool size", due.length,
    "| card:", currentCard.word);
  renderChoices(opts, correct, mode);
  updateModeStatsDisplay();
}

function getCardPrompt(card, mode){
  const dir=$("direction").value;
  switch(mode){
    case "1": return [card.english, card.word,   `Reading: ${card.reading}`];
    case "2": return [card.word,   card.reading, `English: ${card.english}`];
    case "3": return [card.word,   card.english, `Reading: ${card.reading}`];
    case "4": return dir==="jp-en"
                ? [card.exampleJP, card.exampleEN, `Reading: ${card.reading}\nEnglish: ${card.english}`]
                : [card.exampleEN, card.exampleJP, `Reading: ${card.reading}\nEnglish: ${card.english}`];
  }
}
function generateOptions(correct, grammar, mode){
  const dir=$("direction").value;
  const pool=vocabList.filter(c=>c.grammar===grammar&&c!==currentCard);
  const fallback=vocabList.filter(c=>c!==currentCard);
  const src=(pool.length>=4?pool:fallback);

  const set = new Set([correct]); let guard=0;
  while(set.size<5 && guard<200){
    const r=src[Math.random()*src.length|0]; if(!r){guard++;continue;}
    let cand="";
    switch(mode){
      case "1": cand=r.word; break;
      case "2": cand=r.word===r.reading?"":r.reading; break;
      case "3": cand=r.english; break;
      case "4": cand=dir==="jp-en"?r.exampleEN:r.exampleJP; break;
    }
    if(cand) set.add(cand); guard++;
    if(set.size===src.length) break;          // early-out for tiny decks
  }
  return shuffleArray([...set]);
}
function renderChoices(opts, correct, mode){
  const box=$("choices"); box.innerHTML="";
  opts.forEach(opt=>{
    const b=document.createElement("button");
    b.textContent=opt; b.classList.remove("selected");
    b.onclick=()=>handleAnswer(b,opt===correct,mode);
    box.appendChild(b);
  });
}
function getCorrectAnswerText(mode){
  const dir=$("direction").value;
  switch(mode){
    case "1": return currentCard.word;
    case "2": return currentCard.reading;
    case "3": return currentCard.english;
    case "4": return dir==="jp-en"?currentCard.exampleEN:currentCard.exampleJP;
  }
}
function handleAnswer(btn, isCorrect, mode){
  dbg(`Answer ${isCorrect?"✔":"✘"}  word=${currentCard.word}  mode=${mode}`);

  /*  visual feedback  */
  $("choices").querySelectorAll("button").forEach(b=>{
    b.classList.remove("correct","wrong","selected");
    if(b===btn) b.classList.add(isCorrect?"correct":"wrong","selected");
    else if(b.textContent===getCorrectAnswerText(mode)) b.classList.add("correct");
    else b.classList.add("wrong");
    b.disabled=true;
  });

  /*  determine status BEFORE scheduling  */
  const srs     = currentCard.srsByMode[mode];
  const wasNew  = (srs.repetitions===0);
  const today   = todayISO();

  /*  schedule next review  */
  scheduleCard(currentCard, mode, isCorrect?5:2);

  /*  update daily stats – count a new card once per day, regardless of correctness */
  if (wasNew) {
    if (srs._countedDate !== today) {
      dailyStats.newShownByMode[mode]++; srs._countedDate = today;
    }
  } else {
    dailyStats.reviewShownByMode[mode]++;
  }
  saveDailyStats(); updateModeStatsDisplay();

  const nextDate=new Date(srs.due).toLocaleDateString("en-GB");
  $("question").innerHTML += `<br><span class="nextDue">🔄 New Schedule: ${nextDate}</span>`;
  $("nextBtn").classList.remove("hidden");
  dbg("Stats → newShown", dailyStats.newShownByMode,
    "| reviewShown", dailyStats.reviewShownByMode);

  if(!isCorrect)
    showToast("Wrong answer, new try in 2 minutes");
}

// ---------- stats ----------
function updateModeStatsDisplay(){
  MODES.forEach(mode=>{
    const newDue= vocabList.filter(c=>c.srsByMode[mode].repetitions===0 && c.srsByMode[mode].due<=Date.now()).length;
    const revDue= vocabList.filter(c=>c.srsByMode[mode].repetitions>0  && c.srsByMode[mode].due<=Date.now()).length;
    $("mode"+mode+"Count")      .innerText = dailyStats.newShownByMode[mode];
    $("mode"+mode+"Max")        .innerText = Math.min(newDue , MAX_NEW_BY_MODE[mode]);
    $("mode"+mode+"ReviewCount").innerText = dailyStats.reviewShownByMode[mode];
    $("mode"+mode+"ReviewMax")  .innerText = Math.min(revDue , MAX_REVIEW_BY_MODE[mode]);
  });
}

// ---------- deck loaders -------------
function handleFileUpload(e){
  const f=e.target.files[0]; if(!f) return; isVocabLoaded=true;
  Papa.parse(f,{delimiter:"\t",skipEmptyLines:true,complete:({data})=>ingestRows(data)});
}
function loadDefaultVocab(){
  const deck=$("deckSelector").value; localStorage.setItem("lastUsedDeck",deck);
  fetch(`default-decks/${deck}.txt`)
    .then(r=>r.text()).then(txt=>Papa.parse(txt,{delimiter:"\t",skipEmptyLines:true,complete:({data})=>ingestRows(data)}))
    .catch(()=>alert(`Could not load ${deck} deck file.`));
}
function ingestRows(rows){
  const savedMap=new Map(loadProgress().map(o=>[o.word,o.srsByMode]));
  vocabList = rows.map(r=>{
    if(r.length<4) return null;
    const [word,en,readRaw,grammar,,jp,,enSent]=r;
    if(!word||!en||!readRaw) return null;
    return createCard(
      { word, english:en, reading:extractReading(readRaw), grammar, exampleJP:jp, exampleEN:enSent },
      savedMap.get(word)
    );
  }).filter(Boolean);

  $("quizSection").classList.remove("hidden");
  dailyStats = loadDailyStats(); updateModeStatsDisplay(); showNextCard();

  if (DEBUG) {
    let newCards = 0, reviewCards = 0;
  
    vocabList.forEach(card => {
      const isNew = MODES.some(m => card.srsByMode[m]?.repetitions === 0);
      if (isNew) newCards++;
      else reviewCards++;
    });
  
    const newDue = vocabList.filter(c =>
      MODES.some(m => c.srsByMode[m].repetitions === 0 && c.srsByMode[m].due <= Date.now())
    ).length;
  
    const revDue = vocabList.filter(c =>
      MODES.some(m => c.srsByMode[m].repetitions > 0 && c.srsByMode[m].due <= Date.now())
    ).length;
  
    dbg(`[Deck Loaded] ${vocabList.length} total → ${newCards} new / ${reviewCards} review cards`);
    dbg(`[Due Now] ${newDue} new due / ${revDue} review due`);
  }
}

// ---------- backup / restore ----------
function downloadBackup(){
  const blob=new Blob([localStorage.getItem("vocabProgress")||"[]"],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="vocabProgress.json"; a.click();
}
function uploadBackup(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{ localStorage.setItem("vocabProgress",r.result); vocabList=[]; showNextCard(); };
  r.readAsText(f);
}

// ---------- misc ----------
function attachEventHandlers(){
  const dirEl=$("direction");
  if(dirEl&&!dirEl.dataset.bound){
    dirEl.addEventListener("change", e=>{ direction=e.target.value; showNextCard(); });
    dirEl.dataset.bound="true";
  }
}
