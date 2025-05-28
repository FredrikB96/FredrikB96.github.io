

// === EVENT HANDLING ===
// Add event listeners to the buttons
window.addEventListener('DOMContentLoaded', () => {
    let mode = document.getElementById("quizMode").value;
    if (mode === "random") {
        const randomMode = MODES[Math.floor(Math.random() * MODES.length)];
        document.getElementById("quizMode").value = randomMode;
    }

    // UI elements
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    document.getElementById("themeToggle")?.addEventListener("click", (event) => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        showToast(`Theme changed to ${isDark ? 'dark' : 'light'}`);
    });

    window.addEventListener("click", function (e) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (!modal.classList.contains("hidden") && e.target === modal) {
                modal.classList.add("hidden");
            }
        });
    });

    document.getElementById("toggleStatsBtn")?.addEventListener("click", () => {
        const statsPanel = document.getElementById("statsPanel");
        statsPanel.classList.toggle("hidden");
        showToast(`Stats panel ${statsPanel.classList.contains("hidden") ? "hidden" : "visible"}`);
    });

    document.getElementById("debugToggle")?.addEventListener("click", (event) => {
        const isChecked = event.target.checked;
        document.getElementById("debugOptions").classList.toggle("hidden", !isChecked);
        showToast(`Debug mode ${isChecked ? "ON" : "OFF"}`);
    });

    document.getElementById("useDebugDate")?.addEventListener("change", (e) => {
        window.debugDateEnabled = e.target.checked;
    });

    document.getElementById("debugDateInput")?.addEventListener("change", (e) => {
        window.debugDateValue = e.target.value;
    });

    document.getElementById("loadDefaultBtn")?.addEventListener("click", async (event) => {
        const deckName = document.getElementById("deckSelector").value;
        vocabList = await loadDeck({ deckName: deckName, fieldMap: globalFieldMap });
        if (vocabList.length < 1) {
            showToast("No data found in file.");
        } else {
            showToast(`Cards loaded: ${vocabList.length}`);
            closeModal("defaultDeckModal");
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
                closeModal("customDeckModal");
                showFieldMapper(results.data);
            },
            error: (err) => {
                showToast("Error parsing file: " + err.message);
            }
        });
    });

    document.getElementById("quizMode")?.addEventListener("change", (event) => {
        const mode = event.target.value;
        if (mode === "random") {
            const randomMode = MODES[Math.floor(Math.random() * MODES.length)];
            event.target.value = randomMode;
        }

        if (document.getElementById("quizMode")?.value === "4") {
            document.getElementById("directionLabel").classList.remove("hidden");
        } else {
            document.getElementById("directionLabel").classList.add("hidden");
        }

        // If a question is already loaded, just re-render with new mode
        if (window.currentQuestionCard && window.currentOptions) {
            renderQuestionAndOptions(window.currentQuestionCard, window.currentOptions, parseInt(document.getElementById("quizMode").value));
        } else {
            showNextCard();
        }
    });

    document.getElementById("direction")?.addEventListener("change", (event) => {
        // Update the direction globally
        if (window.currentQuestionCard && window.currentOptions) {
            renderQuestionAndOptions(window.currentQuestionCard, window.currentOptions, parseInt(document.getElementById("quizMode").value));
        } else {
            showNextCard();
        }
    });

    document.getElementById("showHints")?.addEventListener("change", (event) => {
        const showHints = event.target.checked;
        document.getElementById("hints").classList.toggle("hidden", !showHints);
    });
    document.getElementById("showExample")?.addEventListener("change", (event) => {
        const showExample = event.target.checked;
        document.getElementById("example").classList.toggle("hidden", !showExample);
    });

});

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
    showNextCard();
}


// === Flashcard Logic ===

function renderQuestionAndOptions(card, options, mode) {
    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";

    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    ul.style.margin = "0";

    options.forEach((opt, idx) => {
        const li = document.createElement("li");
        li.style.marginBottom = "8px";
        const btn = document.createElement("button");
        let optionText = getQuestionOption(opt, mode);
        btn.textContent = optionText;
        btn.dataset.index = idx;
        btn.classList.add("option-button");
        // Add event listener for answer checking here if needed
        btn.addEventListener("click", () => handleAnswer(card, mode, opt));
        li.appendChild(btn);
        ul.appendChild(li);
    });

    choicesDiv.appendChild(ul);

    document.getElementById("question").textContent = getQuestionPrompt(card, mode) || "";
    document.getElementById("hints").textContent = getHint(card, mode);
    document.getElementById("example").textContent = getExample(card, mode);
    document.getElementById("quizSection").classList.remove("hidden");
}

function updateStatsPanel() {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`mode${i}Count`).textContent = window[`mode${i}Count`];
        document.getElementById(`mode${i}Max`).textContent = window[`mode${i}Max`];
        document.getElementById(`mode${i}ReviewCount`).textContent = window[`mode${i}ReviewCount`];
        document.getElementById(`mode${i}ReviewMax`).textContent = window[`mode${i}ReviewMax`];
    }

    document.getElementById('doneCount').textContent = window.doneCount;
    document.getElementById('dueCount').textContent = window.dueCount;
    document.getElementById('newLeftCount').textContent = window.newLeftCount;
}

function showNextCard() {
    updateStatsPanel();
    const mode = parseInt(document.getElementById("quizMode").value);
    const card = decideCardType(["new", "review"], 3, mode);
    if (!card) {
        showToast("No cards available!");
        return;
    }
    const options = generateOptions(card, mode);

    // Store for mode switching
    window.currentQuestionCard = card;
    window.currentOptions = options;

    renderQuestionAndOptions(card, options, mode);
}


function decideCardType(sources = ["new", "review"], maxTries = 3,mode) {
    let tries = 0;

    const today = getToday();

    while (tries < maxTries) {
        // Get due and new cards for the current mode
        const dueCards = vocabList.filter(card => {
            const state = card.fsrsState[mode];
            return state && state.state >= 1 && isDue(state.due, today);
        });
        const newCards = vocabList.filter(card => {
            const state = card.fsrsState[mode];
            return state && state.state === 0;
        });

        // If no cards at all, return null
        if (newCards.length < 1 && dueCards.length < 1) {
            return null;
        }

        // Filter sources to only those with available cards
        const availableSources = sources.filter(type => {
            if (type === "new") return newCards.length > 0;
            if (type === "review") return dueCards.length > 0;
            return false;
        });

        if (availableSources.length === 0) {
            tries++;
            continue; // Try again (shouldn't happen, but safe)
        }

        // Pick randomly from available sources
        const pick = availableSources[Math.floor(Math.random() * availableSources.length)];

        if (pick === "new") {
            return newCards[Math.floor(Math.random() * newCards.length)];
        }
        if (pick === "review") {
            return dueCards[Math.floor(Math.random() * dueCards.length)];
        }

        return null;
    }

    dbg("[decideCardType] Max fallback attempts reached");
    return null;
}

function generateOptions(correctCard, mode) {
    // Get grammar tags as a Set for fast lookup
    const correctGrammars = new Set(
        correctCard.grammar.split(",").map(g => g.trim()).filter(Boolean)
    );

    // Pool: cards that share at least one grammar tag with correctCard, and are not the correct card itself
    const pool = vocabList.filter(card => {
        if (card === correctCard) return false;
        const cardGrammars = card.grammar.split(",").map(g => g.trim());
        return cardGrammars.some(g => correctGrammars.has(g));
    });

    // Shuffle pool for randomness
    const shuffledPool = shuffleArray(pool);

    // Pick up to 3 unique distractors
    const options = [correctCard];
    for (let i = 0; i < shuffledPool.length && options.length < 5; i++) {
        const candidate = shuffledPool[i];
        // Avoid duplicates (by word, or you can use another unique field)
        if (!options.some(opt => opt.word === candidate.word)) {
            options.push(candidate);
        }
    }

    // If not enough distractors, fill with random cards (fallback, should rarely happen)
    if (options.length < 5) {
        const fallbackPool = shuffleArray(
            vocabList.filter(card => !options.some(opt => opt.word === card.word))
        );
        for (let i = 0; i < fallbackPool.length && options.length < 4; i++) {
            options.push(fallbackPool[i]);
        }
    }

    // Shuffle final options so correct answer is not always first
    return shuffleArray(options);
}


async function handleAnswer(card, mode, selectedOption) {
    const correctAnswer = getQuestionOption(card, mode);

    // Find all option buttons
    const buttons = document.querySelectorAll(".option-button");
    let correctBtn = null;
    let selectedBtn = null;
    let isCorrect = false;

    buttons.forEach(btn => {
        // Mark the correct button
        if (btn.textContent === correctAnswer) {
            correctBtn = btn;
        }
        // Mark the selected button
        if (btn.textContent === getQuestionOption(selectedOption, mode)) {
            selectedBtn = btn;
        }
        // Disable all buttons after selection
        btn.disabled = true;
        // Remove previous selection/correct/wrong classes
        btn.classList.remove("selected", "correct", "wrong");
    });

    // Apply selection highlighting and correctness
    if (selectedBtn) {
        selectedBtn.classList.add("selected");
        if (selectedBtn === correctBtn) {
            selectedBtn.classList.add("correct");
            isCorrect = true;
            showToast("Correct!");

            const cardKey = `${card.word}|${mode}`;
            if (!window.cardsAnswered.has(cardKey)) {
                window[`mode${mode}Count`] = (window[`mode${mode}Count`] || 0) + 1;
                window.cardsAnswered.add(cardKey);
            }
        } else {
            selectedBtn.classList.add("wrong");
            if (correctBtn) correctBtn.classList.add("correct");
            showToast(`Incorrect! Correct answer: ${correctAnswer}`);
        }
    }

    card.fsrsState = await updateSRS(card, mode, isCorrect);

    // Show the Next button
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.classList.remove("hidden");
    nextBtn.onclick = () => {
        nextBtn.classList.add("hidden");
        showNextCard();
    };

    updateStatsPanel();
}



