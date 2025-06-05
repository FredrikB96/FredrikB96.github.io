
// === NODALS ===
function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
    document.getElementById(id).classList.add("hidden");

    if (id === "startNote") 
        document.getElementById("startNote").classList.add("hidden");
}

function extractReading(raw) {
    if (!raw) return "";

    // Match all kana characters (from anywhere in the string)
    const matches = raw.match(/[ぁ-んァ-ヶー]/g);

    // Join them into a string, or return empty if none
    return matches ? matches.join("") : "";
}

function dbg(level, ...args) {
    if (!document.getElementById("debugToggle")?.checked) return;
    const logger = console[level] || console.log;
    logger(...args);
}
function isDue(dueDateStr, todayDateObj) {
    const due = new Date(dueDateStr);
    const today = new Date(todayDateObj);
    //due.setHours(0, 0, 0, 0);
    //today.setHours(0, 0, 0, 0);
    return due <= today;
}

function showToast(msg) {
    // Inject toast container if not already there
    const err = new Error();
    const stackLines = err.stack?.split("\n");
    const callerLine = stackLines?.[2] || "unknown";
    dbg(`info`,`[showToast] Called by: ${callerLine.trim()} → ${msg}`);

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

function shuffleArray(arr) {
    return arr.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
}

function getToday() {
    if (window.debugDateEnabled && window.debugDateValue) {
        // Return as Date object
        return new Date(window.debugDateValue);
    }
    return new Date();
}

function getQuestionPrompt(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === 1) return card.definition;
    if (mode === 2) return card.word;
    if (mode === 3) return card.word;
    if (mode === 4) {
        if (dir === "jp-en") {
            return card.sentence
        }
        else {
            return card.sentenceDefinition;
        }
    }
}

function getQuestionOption(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === 1) return card.word;
    if (mode === 2) return card.reading;
    if (mode === 3) return card.definition;
    if (mode === 4) {
        if (dir === "jp-en") {
            return card.sentenceDefinition
        }
        else {
            return card.sentence;
        }
    } 
}

function getHint(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === 1) return card.reading || "";
    if (mode === 2) return card.definition || "";
    if (mode === 3) return card.reading || "";
    if (mode === 4) return `${card.word || ""} ${card.reading || ""}`.trim();
    return "";
}

function getExample(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === 1 || mode === 2 || mode === 3) return card.sentence || "";
    if (mode === 4) {
        if (dir === "jp-en") return card.sentenceDefinition || "";
        else return card.sentence || "";
    }
    return "";
}

function loadNewCardsSeen() {
    const saved = JSON.parse(localStorage.getItem("newCardsSeenInfo"));
    const today = getToday().toISOString().slice(0, 10);

    if (saved && saved.date === today) {
        return new Set(saved.words);
    }
    return new Set(); // New day or nothing stored
}

function saveNewCardsSeen(set) {
    localStorage.setItem(
        "newCardsSeenInfo",
        JSON.stringify({
            date: getToday().toISOString().slice(0, 10),
            words: Array.from(set)
        })
    );
}
function saveReviewCardsSeen(set) {
    localStorage.setItem(
        "reviewCardsSeenInfo",
        JSON.stringify({
            date: getToday().toISOString().slice(0, 10),
            words: Array.from(set)
        })
    );
}

function loadReviewCardsSeen() {
    const saved = JSON.parse(localStorage.getItem("reviewCardsSeenInfo"));
    const today = getToday().toISOString().slice(0, 10);
    if (saved && saved.date === today) {
        return new Set(saved.words);
    }
    return new Set(); // New day or nothing stored
}

function loadNewCardsSeen() {
    const saved = JSON.parse(localStorage.getItem("newCardsSeenInfo"));
    const today = getToday().toISOString().slice(0, 10);
    if (saved && saved.date === today) {
        return new Set(saved.words);
    }
    return new Set(); // New day or nothing stored
}

function saveSessionSettings(settings) {
    localStorage.setItem("sessionSettings", JSON.stringify(settings));
}

function loadSessionSettings() {
    const saved = localStorage.getItem("sessionSettings");
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse session settings:", e);
        }
    }
    return {}; // Return empty object if nothing saved
}


function resetSessionIfNeeded() {
    const today = getToday().toISOString().slice(0, 10);
    if (!window.sessionDate || window.sessionDate !== today) {
        window.sessionDate = today;
        window.cardsAnswered = new Set();
        window.newCardsSeen = new Set();
        window.reviewCardsSeen = new Set();
        saveNewCardsSeen(window.newCardsSeen);
        saveReviewCardsSeen(window.reviewCardsSeen);
        // Reset any other session-specific state here if needed
    }
}

function checkAndResetSessionForLocalStorageKeys(keys, resetFn) {
    const today = getToday().toISOString().slice(0, 10);
    let resetNeeded = false;

    // update newCardsSeen and reviewCardsSeen globals as int



    keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (key === "newCardsSeenInfo") {
                window.newCardsSeen = new Set(data.words);
            }
            if (key === "reviewCardsSeenInfo") {
                window.reviewCardsSeen = new Set(data.words);
            }
            // Check for a 'date' property in the stored object
            if (data.date && data.date !== today) {
                resetNeeded = true;
            }
        } catch (e) {
            // If parsing fails, assume reset is needed
            resetNeeded = true;
        }
    });

    if (resetNeeded && typeof resetFn === "function") {
        resetFn();
    }
}

function getEligibleNewCards(mode) {
    const maxNewReached = window.newCardsSeen.size >= window.MaxNewCards;
    if (!maxNewReached) {
        // Not at limit: show new cards not yet seen
        return vocabList.filter(card => {
            const state = card.fsrsState[mode];
            return state && state.state === 0;
        });
    } else {
        // At limit: show new cards that have been seen before, but not yet answered in this mode
        return vocabList.filter(card => {
            const state = card.fsrsState[mode];
            return state && state.state === 0 && window.newCardsSeen.has(card.word);
        });
    }
}

function getEligibleReviewCards(mode) {
    const maxReviewReached = window.reviewCardsSeen.size >= window.MaxReviewCount;
    const today = getToday();
    if (!maxReviewReached) {
        // Not at limit: show due review cards not yet seen
        return vocabList.filter(card => {
            const state = card.fsrsState[mode];
            return state && state.state >= 1 && isDue(state.due, today);
        });
    } else {
        // At limit: show due review cards that have been seen before, but not yet answered in this mode
        return vocabList.filter(card => {
            const state = card.fsrsState[mode];
            return state && state.state >= 1 && isDue(state.due, today) && window.reviewCardsSeen.has(card.word);
        });
    }
}

async function printAllReviews() {
    const cards = await getAllCards();
    const now = new Date();

    cards.forEach(card => {
        let isDue = false;
        let dueModes = [];
        let dueDates = [];

        // Check each mode (1-4) for due review
        for (let mode = 1; mode <= 4; mode++) {
            const state = card.fsrsState && card.fsrsState[mode];
            if (state && state.state >= 1 && state.due && new Date(state.due) <= now) {
                isDue = true;
                dueModes.push(mode);
                dueDates.push(state.due.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZoneName: 'long'
                }).replace(/ GMT[^\)]*\)/, ')'));
            }
        }

        console.log(
            `word: ${card.word}, Due: ${isDue ? "Yes" : "No"}, Modes due: ${dueModes.join(",")}, DueDates: ${dueDates.join(",")}`
        );
    });
}