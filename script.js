// To be implemented as main javascript file

// ====== CONSTANTS ======
const MODES = ["1", "2", "3", "4"];
const DEFAULT_MAX_NEW = 10;
const DEFAULT_MAX_REVIEW = 100;
const NEW_CARD_CHANCE = 0.5;
const GRADE_CORRECT = 5;

const MaxTries = 10;
const CurrentTries = 0;

let vocabList = [];
let quizMode = "1";
let newCardsQuizzed;
let reviewCardsQuizzed;
let NEW_CARD_LIMIT = DEFAULT_MAX_NEW;
let REVIEW_CARD_LIMIT = DEFAULT_MAX_REVIEW;
let retryList = [];
let newWordList = [];
let reviewWordList = [];
let wordProgress = {};



// ====== EVENT HANDLING =====
window.addEventListener("DOMContentLoaded", setupEventListeners);


function setupEventListeners() {
    console.log("Version 1.2");

    document.getElementById("loadDefaultBtn")?.addEventListener("click", async (event) => {
        vocabList = await loadDefaultDeck((document.getElementById("deckSelector").value));
        if (vocabList.length < 1) {
            showToast("No data found in file.");
        } else {
            showToast(`Cards loaded: ${vocabList.length}`);
            sortDecks();
            showNextCard();
        }
    });
    document.getElementById("csvFile")?.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            preview: 5,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (results) => {
                if (!results || !results.data || results.data.length === 0) {
                    showToast("No data found in the file.");
                    return;
                }
                showFieldMapper(results.data);
            },
            error: (err) => {
                showToast("Error parsing file: " + err.message);
            }
        });
    });
    document.getElementById("toggleSettingsBtn")?.addEventListener("click", () => {
        const panel = document.getElementById("settingsPanel");
        panel.classList.toggle("hidden");
        document.getElementById("toggleSettingsBtn").innerText = panel.classList.contains("hidden") ? "⚙️ Settings" : "❌ Hide Settings";
    });

    document.getElementById("debugToggle")?.addEventListener("change", (e) => {
        DEBUG = e.target.checked;
        document.getElementById("debugDate").classList.toggle("hidden");
    });

    document.getElementById("showHints")?.addEventListener("change", () => updateHints(getCurrentCard()));
    document.getElementById("showExample")?.addEventListener("change", () => updateHints(getCurrentCard()));
    document.getElementById("quizMode")?.addEventListener("change", showNextCard);


    document.getElementById("nextBtn")?.addEventListener("click", () => {
        document.getElementById("nextBtn").classList.add("hidden");
        showNextCard();
    });
}

// ====== Field Mapper Logic ======

function showFieldMapper(data) {
    const table = document.getElementById('sampleDataTable');
    table.innerHTML = '';

    // Render header
    const fields = ['word', 'definition', 'reading', 'grammar', 'sentence', 'sentenceDefinition'];

    const headerRow = document.createElement('tr');
    data[0].forEach((_, colIndex) => {
        const th = document.createElement('th');

        const select = document.createElement('select');
        select.dataset.col = colIndex;

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = `Field ${colIndex}`;
        select.appendChild(emptyOption);

        fields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.textContent = field;
            select.appendChild(option);
        });

        th.appendChild(select);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);


    // Render sample data
    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    document.getElementById('fieldMapperModal').classList.remove('hidden');
}

async function confirmFieldMapping() {
    const selectedFields = document.querySelectorAll('#sampleDataTable select');
    const map = {};
    selectedFields.forEach(select => {
        const field = select.value;
        const colIndex = parseInt(select.dataset.col);
        if (field) {
            map[field] = colIndex;
        }
    });


    // Save map for use in actual data loading
    window.userFieldMap = map;

    document.getElementById('fieldMapperModal').classList.add('hidden');

    // Now reload full file using this map
    const file = document.getElementById('csvFile').files[0];
    const cards = await loadCustomDeck(file, map);
    vocabList = cards;
    showToast(`Cards loaded: ${vocabList.length}`);
    dbg(`[ConfirmFieldMapping] Cards loaded: ${vocabList.length}`);
    sortDecks();
    showNextCard();
}

// ====== MAIN LOGIC ======

// main logic helpers

function getQuestionPrompt(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === "1") return card.definition;
    if (mode === "2") return card.word;
    if (mode === "3") return card.word;
    if (mode === "4") return dir === "jp-en" ? card.sentence : card.sentenceDefinition;
}

function getQuestionOption(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === "1") return card.word;
    if (mode === "2") return card.reading;
    if (mode === "3") return card.definition    ;
    if (mode === "4") return dir === "jp-en" ? card.sentence : card.sentenceDefinition;
}

function decideCardType(sources, tries = 0, maxTries = 3, retryChecked = false, reviewChecked = false, newChecked = false) {
    if (tries >= maxTries) {
        dbg("[decideCardType] Max fallback attempts reached");
        return null;
    }

    const pick = sources[Math.floor(Math.random() * sources.length)];
    let newSources = [];
    if (pick === "retry" && (retryList.length < 1)) {
        dbg("[DecideCardType] retry list empty!");
        if (!reviewChecked) {
            newSources.push("review");
            reviewChecked = true;
        }
        if (!newChecked) {
            newSources.push("new");
            newChecked = true;
        }
        return decideCardType(newSources, tries + 1, maxTries, reviewChecked, newChecked);
    }
    if (pick === "new" && ((newWordList.length < 1))) {
        dbg("[DecideCardType] new list empty!");
        if (!retryChecked) {
            newSources.push("retry");
            reviewChecked = true;
        }
        if (!reviewChecked) {
            newSources.push("review");
            newChecked = true;
        }

        return decideCardType(newSources, tries + 1, maxTries,retryChecked,reviewChecked);
    }
    if (pick === "review" && ((reviewWordList.length < 1))) {
        dbg("[DecideCardType] review list empty!");
        if (!retryChecked) {
            newSources.push("retry");
            reviewChecked = true;
        }
        if (!newChecked) {
            newSources.push("new");
            newChecked = true;
        }
        return decideCardType(newSources, tries + 1, maxTries, retryChecked, newChecked);
    }

    return pick;
}

function getNewCard() {
    if (newCardsQuizzed > NEW_CARD_LIMIT) {
        dbg("[getNewCard] limit reached!");
        return null;
    }
    if (newWordList.length < 1) {
        dbg("[getNewCard] New card list empty!");
    }

    let card = newWordList[Math.floor(Math.random() * newWordList.length)];
    dbg(`[getNewCard] Card selected: ${card.word} `);
    return card;
}

function getReviewCard() {
    if (newCardsQuizzed > REVIEW_CARD_LIMIT) {
        dbg("[getNewCard] limit reacged!");
        return null;
    }
    if (reviewWordList.length < 1) {
        dbg("[getNewCard] New card list empty!");
    }

    let candidates = reviewWordList.filter(card => isDue(card.word));
    let card = candidates[Math.floor(Math.random() * candidates.length)];

    dbg(`[getReviewCard] Card selected: ${card.word} `);

    return card;
}

function getRetryCard() {
    if (newCardsQuizzed > REVIEW_CARD_LIMIT) {
        dbg("[getNewCard] limit reached!");
        return null;
    }
    if (retryList.length < 1) {
        dbg("[getNewCard] Retry card list empty!");
        return null;
    }

    let card = retryList[Math.floor(Math.random() * retryList.length)];
    dbg(`[getNewCard] Card selected: ${card.word} `);
    return card;
}

function getCandidate(card, mode, dir) {
    switch (mode) {
        case "1": return card.word;
        case "2": return card.word === card.reading ? null : card.reading;
        case "3": return card.definition;
        case "4": return dir === "jp-en" ? card.sentenceDefinition : card.sentence;
    }
}

function generateOptions(correctCard, grammar, mode) {
    const dir = document.getElementById("direction")?.value || direction;

    if (!Array.isArray(vocabList)) {
        console.warn("[generateOptions] vocabList is not an array", vocabList);
        return [];
    }

    const pool = vocabList.filter(card => {
        if (card.grammar !== grammar) return false;
        if (mode === "2" && card.word === card.reading) return false;
        return true;
    });

    const correct = getCandidate(correctCard, mode, dir);
    const options = [correct];
    const used = new Set([correct]);

    let tries = 0;
    const MAX_TRIES = 100;

    while (options.length < 5 && tries < MAX_TRIES) {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        if (rand === correctCard) {
            tries++;
            continue;
        }

        const candidate = getCandidate(rand, mode, dir);
        if (candidate && !used.has(candidate)) {
            options.push(candidate);
            used.add(candidate);
        }
        tries++;
    }

    return shuffleArray(options);
}

function isReview(card) {
    const cardDate = new Date(card.dueToday);
    if (cardDate < new Date()) {
        return true;
    }

    return false;
}

function getCurrentCard() {
    const question = document.getElementById("question")?.innerText;

    return vocabList.find(card =>
        card.word === question ||
        card.definition === question ||
        card.reading === question ||
        card.grammar === question ||
        card.sentence === question ||
        card.sentenceDefinition === question
    );
}

function getCorrectAnswer(card, mode) {
    const dir = document.getElementById("direction")?.value || direction;
    if (mode === "1") return card.word;
    if (mode === "2") return card.reading;
    if (mode === "3") return card.definition;
    if (mode === "4") return dir === "jp-en" ? card[0].sentence : card[0].sentenceDefinition;
}

// main logic ui

//  quizselection
function updateHints(currentCard) {
    document.getElementById("hints").textContent = `Reading: ${currentCard.reading}, English: ${currentCard.definition}, Grammar: ${currentCard.grammar}`;
    document.getElementById("example").textContent = `JP: ${currentCard.sentence}\nEN: ${currentCard.sentenceDefinition}`;
    document.getElementById("hints").classList.toggle("hidden", !document.getElementById("showHints").checked);
    document.getElementById("example").classList.toggle("hidden", !document.getElementById("showExample").checked);
}

function renderOptions(options, correct, mode) {
    const container = document.getElementById("choices");
    container.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.addEventListener("click", () => handleAnswer(btn, opt === correct, mode));
        container.appendChild(btn);
    });
    document.getElementById("nextBtn").classList.add("hidden");
}

function updateQuestionSection(currentCard, alternatives, mode) {
    document.getElementById("todayDate").innerText = new Date().toLocaleDateString("en-CA");
    renderOptions(alternatives, getQuestionOption(currentCard,mode), mode);
    updateHints(currentCard);
    document.getElementById("question").innerText = getQuestionPrompt(currentCard,mode);
    document.getElementById("quizSection").classList.remove('hidden');
}

// main logic

function sortDecks() {
    reviewWordList = [];
    newWordList = [];

    for (const card of vocabList) {
        if (isReview(card.word)) {
            dbg(`[sortDecks] ${card.word} is ${card.dueToday}. Adding to review list`);
            reviewWordList.push(card);
        } else {
            dbg(`[sortDecks] ${card.word} is ${card.dueToday}. Adding to new word list`);
            newWordList.push(card);
        }
    }
}

function showNextCard() {
    const sources = ["retry", "new", "review"];
    let mode = document.getElementById("quizMode").value;
    if (mode === "random") {
        mode = String((Math.floor(Math.random() * 3) + 1));
        dbg(`[showNextCard] Selected mode: ${document.getElementById("quizMode").value} \n       randomly selected mode ${mode}`);
    } else {
        dbg(`[showNextCard] Selected mode: ${document.getElementById("quizMode").value}`);
    }

    const selectedSource = decideCardType(sources);
    dbg(`[showNextCard] Randomly selected source: ${selectedSource}`);

    let currentCard;

    if (selectedSource === null) {
        showToast("No more cards due!");
        return;
    }

    switch (selectedSource) {
        case "retry":
            currentCard = getRetryCard();
            break;
        case "review":
            currentCard = getReviewCard();
            break;
        case "new":
            currentCard = getNewCard();
            break;
    }

    carddbg(currentCard);
    let options = generateOptions(currentCard, currentCard.grammar, mode);
    updateQuestionSection(currentCard, options, mode);
}


function handleAnswer(btn, isCorrect, mode) {
    if (!btn) {
        console.warn("Invalid card or mode in handleAnswer.");
        return;
    }

    let currentCard = getCurrentCard();
    let correctAnswer = getCorrectAnswer(currentCard, mode);
    wordProgress[currentCard.word] = (wordProgress[currentCard.word] || 0) + 1;
    document.querySelectorAll("#choices button").forEach(b => {
        b.classList.add(b.textContent === correctAnswer ? "correct" : "wrong");
        b.style.pointerEvents = "none";
    });

    btn.classList.add("selected");
    document.getElementById("nextBtn").classList.remove("hidden");

    if (!isCorrect) {
        if (newWordList.includes(currentCard)) {
            let index = newWordList.indexOf(currentCard);
            newWordList.splice(index, 1);
        }
        if (reviewWordList.includes(currentCard)) {
            let index = reviewWordList.indexOf(currentCard);
            reviewWordList.splice(index, 1);
        }
        retryList.push(currentCard);
        retryList.forEach(carddbg);
        return;
    }


    const retries = wordProgress[currentCard.word] || 0;
    applyFSRS(currentCard, true, retries);
    delete wordProgress[currentCard.word];

}

// ====== SRS HANDLING ======
