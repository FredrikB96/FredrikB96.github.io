
// === FILE HANDLING ===

// field mapping
const fieldMap = {
    word: 0,
    definition: 1,
    reading: 2,
    grammar: 3,
    sentence: 5,
    sentenceDefinition: 7,
};

let DEBUG = false;

function loadCustomDeck(file, fieldMap, delimiter = "\t") {
    dbg(`loading file: ${file.value}`);
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            delimiter: delimiter,
            skipEmptyLines: true,
            complete: ({ data }) => {
                try {
                    const cards = data
                        .filter(row => row.length > Math.max(...Object.values(fieldMap)))
                        .map(row => new Card(
                            row[fieldMap.word],
                            row[fieldMap.definition],
                            row[fieldMap.reading],
                            row[fieldMap.grammar],
                            row[fieldMap.sentence],
                            row[fieldMap.sentenceDefinition],
                            getDueDateForWord(row[fieldMap.word])
                        ));

                    window.userCards = cards;
                    //cards.forEach(carddbg);
                    showToast(`${cards.length} cards loaded!`);
                    resolve(cards); 
                } catch (err) {
                    reject("Failed to parse custom deck: " + err);
                }
            },
            error: (err) => reject("PapaParse error: " + err)
        });
    });
}

async function loadDefaultDeck(deckName, delimiter = "\t") {
    const filePath = `default-decks/${deckName}.txt`;
    dbg(`loading file: ${filePath}`);
    const res = await fetch(filePath);
    const text = await res.text();
    return await loadDeckFromText(text, delimiter);
}
function loadDeckFromText(text, delimiter = "\t") {
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            delimiter: delimiter,
            skipEmptyLines: true,
            complete: function ({ data }) {
                try {
                    const cards = data
                        .filter(row => row.length >= 7)
                        .map(row => new Card(
                            row[fieldMap.word],
                            row[fieldMap.definition],
                            row[fieldMap.reading],
                            row[fieldMap.grammar],
                            row[fieldMap.sentence],
                            row[fieldMap.sentenceDefinition],
                            getDueDateForWord(row[fieldMap.word])
                        ));

                    window.userCards = cards;
                    showToast(`${cards.length} cards loaded!`);
                    resolve(cards); 
                } catch (err) {
                    reject("Failed to convert rows to Card instances: " + err);
                }
            },
            error: function (err) {
                reject("PapaParse error: " + err);
            }
        });
    });
}


// debugs ///

function carddbg(card) {
    if (document.getElementById("debugToggle")?.checked) {
        const err = new Error();
        const stackLines = err.stack?.split("\n");
        const callerLine = stackLines?.[2] || "unknown";
        dbg(`[CardDBG] Called by: ${callerLine.trim()} → Word: ${card.word} | Definition: ${card.definition} | Reading: ${card.reading} | Sentence: ${card.sentence} | SentenceDefinition: ${card.sentenceDefinition}`);
    }
}
function dbg(...args) { if (document.getElementById("debugToggle")?.checked) console.warn(...args); }

function showToast(msg) {
    // Inject toast container if not already there
    const err = new Error();
    const stackLines = err.stack?.split("\n");
    const callerLine = stackLines?.[2] || "unknown";
    dbg(`[showToast] Called by: ${callerLine.trim()} → ${msg}`);

    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        container.style.display = "flex";
        container.style.flexDirection = "column-reverse"; // newest on bottom
        container.style.gap = "6px";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    // Inject style only once
    if (!document.getElementById("toast-style")) {
        const style = document.createElement("style");
        style.id = "toast-style";
        style.textContent = `
            .toast {
                background:#333;color:#fff;padding:10px 16px;border-radius:6px;
                font-size:14px; opacity:0.92; transition: opacity .6s, transform .6s;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
            .toast.fade {
                opacity: 0;
                transform: translateY(20px);
            }
        `;
        document.head.appendChild(style);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);

    // Fade and remove
    setTimeout(() => toast.classList.add("fade"), 2000);
    setTimeout(() => toast.remove(), 2600);
}

// ====== MISC AND HELPER FUNCTIONS ======

function isDue(word) {
    let dueDate = getDueDateForWord(word).toDateString();;
    let today = new Date().toDateString();

    return new Date(dueDate) <= new Date(today);
}

function getDueDateForWord(word) {
    word = "村";
    if (!word) return new Date(); // fallback

    if (document.getElementById("useDebugDate")?.checked) {
        const debugVal = document.getElementById("debugDate")?.value;
        dbg(`[GET_DATE] Used debug date: ${debugVal} for word: ${word}`);
        return new Date(debugVal + "T00:00:00");
    }

    const raw = localStorage.getItem(word);
    if (!raw) {
        dbg(`[GET_DATE] No stored progress for word: ${word}, using today`);
        return new Date();
    }

    try {
        const parsed = JSON.parse(raw);
        const due = parsed?.due;
        if (due) {
            dbg(`[GET_DATE] Loaded due date for ${word}: ${due}`);
            return new Date(due);
        }
    } catch (e) {
        console.warn(`[GET_DATE] Failed to parse progress for ${word}`, e);
    }

    return new Date(); 
}


function shuffleArray(arr) {
    return arr.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
