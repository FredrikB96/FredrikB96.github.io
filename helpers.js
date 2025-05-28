
// === NODALS ===
function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
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
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
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