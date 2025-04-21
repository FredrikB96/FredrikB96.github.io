let vocabList = [];
let currentCard = null;
let direction = 'jp-en';
let quizMode = 'random';
let showHints = false;
let showExample = false;
const maxNewByMode = { "1": 10, "2": 10, "3": 10, "4": 10 };
const maxReviewByMode = { "1": 100, "2": 100, "3": 100, "4": 100 };
let dailyStats;
let isVocabLoaded = false;


// ========== UI SETUP ==========
document.getElementById('quizMode').addEventListener('change', (e) => {
    quizMode = e.target.value;
    document.getElementById('directionWrapper').classList.toggle('hidden', quizMode !== '4');
    showNextCard();
});
document.getElementById('direction').addEventListener('change', showNextCard);
document.getElementById('showHints').addEventListener('change', (e) => {
    showHints = e.target.checked;
    document.getElementById('hints').classList.toggle('hidden', !showHints);
});
document.getElementById('showExample').addEventListener('change', (e) => {
    showExample = e.target.checked;
    document.getElementById('example').classList.toggle('hidden', !showExample);
});
document.getElementById('csvFile').addEventListener('change', handleFileUpload);
document.getElementById('loadDefaultBtn')?.addEventListener('click', loadDefaultVocab);
document.getElementById('nextBtn').addEventListener('click', () => {
    document.getElementById('nextBtn').classList.add('hidden');
    showNextCard();
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleStatsBtn');
    const statsPanel = document.getElementById('perModeStats');

    if (toggleBtn && statsPanel) {
        toggleBtn.addEventListener('click', () => {
            statsPanel.classList.toggle('hidden');
            toggleBtn.innerText = statsPanel.classList.contains('hidden')
                ? '📊 Show Stats'
                : '📉 Hide Stats';
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        const lastDeck = localStorage.getItem('lastUsedDeck') || 'ALL';
        const deckSelector = document.getElementById('deckSelector');
        if (deckSelector) deckSelector.value = lastDeck;
    });
});

function updateTodayDate() {
    const today = new Date();
    const formatted = today.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    document.getElementById('todayDate').innerText = formatted;
}

// ========== CORE FUNCTIONS ==========

function startApp() {
    dailyStats = loadDailyStats();
    updateModeStatsDisplay();
    showNextCard();
    updateTodayDate();
}

window.addEventListener('DOMContentLoaded', startApp);

function updateModeStatsDisplay() {
    ["1", "2", "3", "4"].forEach(mode => {
        const newDue = vocabList.filter(card => {
            const srs = card.srsByMode?.[mode];
            return srs && srs.repetitions === 0 && srs.due <= Date.now();
        }).length;

        const reviewDue = vocabList.filter(card => {
            const srs = card.srsByMode?.[mode];
            return srs && srs.repetitions > 0 && srs.due <= Date.now();
        }).length;

        const maxNew = Math.min(newDue, maxNewByMode[mode]);
        const maxReview = Math.min(reviewDue, 100);

        document.getElementById(`mode${mode}Count`).innerText = dailyStats.newShownByMode?.[mode] || 0;
        document.getElementById(`mode${mode}Max`).innerText = maxNew;

        document.getElementById(`mode${mode}ReviewCount`).innerText = dailyStats.reviewShownByMode?.[mode] || 0;
        document.getElementById(`mode${mode}ReviewMax`).innerText = maxReview;
    });
}


function loadDailyStats() {
    const today = new Date().toLocaleDateString('en-CA');
    let stats = JSON.parse(localStorage.getItem('dailyStats') || '{}');

    if (stats.date !== today) {
        stats = {
            date: today,
            newShownByMode: {},
            reviewShownByMode: {}
        };
    }

    // Ensure all 4 mode keys exist
    ["1", "2", "3", "4"].forEach(m => {
        stats.newShownByMode ||= {};
        stats.reviewShownByMode ||= {};

        stats.newShownByMode[m] ||= 0;
        stats.reviewShownByMode[m] ||= 0;
    });

    localStorage.setItem('dailyStats', JSON.stringify(stats));
    return stats;
}

function saveDailyStats() {
    localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
}

function createCard(entry) {
    const defaultSRS = () => ({
        repetitions: 0,
        interval: 1,
        ease: 2.5,
        due: Date.now()
    });

    return {
        ...entry,
        srsByMode: {
            "1": defaultSRS(),
            "2": defaultSRS(),
            "3": defaultSRS(),
            "4": defaultSRS()
        }
    };
}

function scheduleCard(card, grade, mode) {
    const srs = card.srsByMode[mode];

    if (grade < 3) {
        srs.repetitions = 0;
        srs.interval = 1;
    } else {
        srs.repetitions++;
        if (srs.repetitions === 1) {
            srs.interval = 1;
        } else if (srs.repetitions === 2) {
            srs.interval = 6;
        } else {
            srs.interval = Math.round(srs.interval * srs.ease);
        }
        srs.ease = Math.max(1.3, srs.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    }

    srs.due = Date.now() + srs.interval * 86400000;
    saveProgress();
}

function saveProgress() {
    localStorage.setItem('vocabProgress', JSON.stringify(vocabList));
}

function loadProgress() {
    const data = JSON.parse(localStorage.getItem('vocabProgress') || '[]');

    data.forEach(card => {
        // Auto-upgrade old format cards
        if (!card.srsByMode) {
            const defaultSRS = () => ({ repetitions: 0, interval: 1, ease: 2.5, due: Date.now() });

            card.srsByMode = {
                "1": defaultSRS(),
                "2": defaultSRS(),
                "3": defaultSRS(),
                "4": defaultSRS()
            };
        }
    });

    return data;
}

function extractReading(raw) {
    return raw ? raw.replace(/([^\[]*)\[([^\]]+)\]/g, (_, __, reading) => reading) : '';
}

function updateNewLeftCount() {
    const el = document.getElementById('newLeftCount');
    if (el) el.innerText = vocabList.filter(card => card.repetitions === 0).length;
}

function getCardPrompt(card, mode) {
    const dir = document.getElementById('direction').value;
    switch (mode) {
        case "1": return [card.english, card.word, `Reading: ${card.reading}`];
        case "2": return [card.word, card.reading, `English: ${card.english}`];
        case "3": return [card.word, card.english, `Reading: ${card.reading}`];
        case "4":
            return dir === "jp-en"
                ? [card.exampleJP, card.exampleEN, `Reading: ${card.reading}\nEnglish: ${card.english}`]
                : [card.exampleEN, card.exampleJP, `Reading: ${card.reading}\nEnglish: ${card.english}`];
    }
}

function generateOptions(correct, mode) {
    const direction = document.getElementById('direction').value;
    let options = [correct], tries = 0;

    while (options.length < 5 && tries < 100) {
        const rand = vocabList[Math.floor(Math.random() * vocabList.length)];
        let candidate = '';

        switch (mode) {
            case "1": candidate = rand.word; break;
            case "2": if (rand.word === rand.reading) continue; candidate = rand.reading; break;
            case "3": candidate = rand.english; break;
            case "4": candidate = direction === 'jp-en' ? rand.exampleEN : rand.exampleJP; break;
        }

        if (candidate && !options.includes(candidate)) options.push(candidate);
        tries++;
    }

    return shuffleArray(options);
}

function renderChoices(options, correctAnswer, mode) {
    const container = document.getElementById('choices');
    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.addEventListener('click', () => handleAnswer(btn, opt === correctAnswer, mode));
        container.appendChild(btn);
    });
}

function showNextCard() {
    const mode = quizMode === 'random' ? getRandomMode() : quizMode;
    dailyStats = loadDailyStats();
    //const maxNew = maxNewByMode[mode];
    const newShown = dailyStats.newShownByMode[mode] || 0;

    const dueWords = vocabList.filter(card => {
        const srs = card.srsByMode[mode];
        if (!srs) return false;

        const isNew = srs.repetitions === 0;
        const isDue = srs.due <= Date.now();

        // Skip katakana-style (non-kanji) words in mode 2
        if (mode === "2" && card.word === card.reading) return false;

        // Respect new/review limits
        if (isNew && dailyStats.newShownByMode[mode] < maxNewByMode[mode] && isDue) return true;
        if (!isNew && dailyStats.reviewShownByMode[mode] < maxReviewByMode[mode] && isDue) return true;

        return false;
    });

    if (!dueWords.length) {
	  if (isVocabLoaded) {
          alert("No cards due! Come back later.");
	  }
	   return;
	}

    currentCard = dueWords[Math.floor(Math.random() * dueWords.length)];
    const isNew = currentCard.repetitions === 0;
    console.log(`[DEBUG] Selected card: ${currentCard.word}`);
    console.log(`[DEBUG] Status: ${isNew ? 'NEW' : 'REVIEW'}`);


    const [question, correctAnswer, hint] = getCardPrompt(currentCard, mode);
    const options = generateOptions(correctAnswer, mode);

    document.getElementById('question').innerText = question;
    document.getElementById('hints').textContent = hint;
    document.getElementById('example').textContent = `JP: ${currentCard.exampleJP}\nEN: ${currentCard.exampleEN}`;
    renderChoices(options, correctAnswer, mode);

    updateNewLeftCount();
    updateModeStatsDisplay();

}

function getCorrectAnswerText(mode) {
    const dir = document.getElementById('direction').value;
    switch (mode) {
        case "1": return currentCard.word;
        case "2": return currentCard.reading;
        case "3": return currentCard.english;
        case "4":
            return dir === 'jp-en' ? currentCard.exampleEN : currentCard.exampleJP;
        default: return '';
    }
}

function handleAnswer(clickedBtn, isCorrect, mode) {
    const isNew = currentCard.repetitions === 0; //
    const correctAnswer = clickedBtn.textContent;

    const buttons = document.querySelectorAll('#choices button');
    buttons.forEach(btn => {
        if (btn.textContent === correctAnswer) {
            btn.classList.add(isCorrect ? 'correct' : 'wrong');
        } else if (btn.textContent === getCorrectAnswerText(mode)) {
            btn.classList.add('correct');
        } else {
            btn.classList.add('wrong');
        }

        btn.style.pointerEvents = 'none';
    });

    clickedBtn.classList.add('selected'); // 👇 adds visual border to the one clicked

    scheduleCard(currentCard, isCorrect ? 5 : 2, mode);

    console.log(`[DEBUG] [HandleAnswer] Status: ${isNew ? 'NEW' : 'REVIEW'}`);

    if (isNew) dailyStats.newShownByMode[mode]++;
    else dailyStats.reviewShownByMode[mode]++;

    saveDailyStats();
    updateModeStatsDisplay();

    document.getElementById('question').innerText += `\n🔄 New Schedule: ${new Date(currentCard.due).toLocaleDateString()}`;
    document.getElementById('nextBtn').classList.remove('hidden');
}

function shuffleArray(arr) {
    return arr.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
}

function getRandomMode() {
    return ['1', '2', '3'][Math.floor(Math.random() * 3)];
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    isVocabLoaded = true;
    if (!file) return;
    Papa.parse(file, {
        delimiter: '\t',
        skipEmptyLines: true,
        complete: function ({ data }) {
            const saved = loadProgress();
            const map = new Map(saved.map(w => [w.word, w]));

            vocabList = data.map(row => {
                if (row.length < 4) return null;
                const [word, english, readingRaw, grammar, , jp, , en] = row;
                if (!word || !english || !readingRaw) return null;
                const reading = extractReading(readingRaw);
                const entry = { word, english, reading, grammar, exampleJP: jp, exampleEN: en };
                return map.has(word) ? map.get(word) : createCard(entry);
            }).filter(Boolean);

            document.getElementById('quizSection').classList.remove('hidden');
            showNextCard();
        }
    });
}

function resetStats() {
  dailyStats = loadDailyStats(); // get today's stats (with mode keys reset)
  currentCard = null;
  currentNewCount = 0;
  currentReviewCount = 0;
  updateModeStatsDisplay();      // refresh UI
}

function attachEventHandlers() {
  const directionEl = document.getElementById('direction');
  if (directionEl && !directionEl.dataset.bound) {
    directionEl.addEventListener('change', (e) => {
      direction = e.target.value;
      showNextCard();
    });
    directionEl.dataset.bound = true;
  }
}

function loadDefaultVocab() {
  const selector = document.getElementById('deckSelector');
  const selectedDeck = selector?.value || 'ALL';
  isVocabLoaded = true;
  localStorage.setItem('lastUsedDeck', selectedDeck);

  const filePath = `default-decks/${selectedDeck}.txt`;
  
  console.log(`Loaded deck: ${selectedDeck}`);




  fetch(filePath)
    .then(res => res.text())
    .then(text => {
      Papa.parse(text, {
        delimiter: '\t',
        skipEmptyLines: true,
        complete: function ({ data }) {
          const saved = loadProgress();
          const map = new Map(saved.map(w => [w.word, w]));

          vocabList = data.map(row => {
            if (row.length < 4) return null;
            const [word, english, readingRaw, grammar, , jp, , en] = row;
            if (!word || !english || !readingRaw) return null;
            const reading = extractReading(readingRaw);
            const entry = { word, english, reading, grammar, exampleJP: jp, exampleEN: en };
            return map.has(word) ? map.get(word) : createCard(entry);
          }).filter(Boolean);

          // Reset stats and show UI
          resetStats();
          document.getElementById('quizSection').classList.remove('hidden');

          // ✅ Ensure controls are connected BEFORE first card
          attachEventHandlers();

          // 👇 Only now show first card
          showNextCard();
		  
        }
      });
    })
    .catch(err => {
      console.error(`Error loading ${selectedDeck} deck:`, err);
      alert(`Could not load ${selectedDeck} deck file.`);
    });
}

