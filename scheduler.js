const DB_NAME = "srs-trainer";
const DB_VERSION = 1;
const CARD_STORE = "cards";
const fsrsParams = FSRS.generatorParameters({ enable_fuzz: false, maximum_interval: 365 });
const scheduler = FSRS.fsrs(fsrsParams);

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(CARD_STORE)) {
                db.createObjectStore(CARD_STORE, { keyPath: "word" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getCard(word) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CARD_STORE, "readonly");
        const store = tx.objectStore(CARD_STORE);
        const req = store.get(word);
        req.onsuccess = () => {
            let card = req.result;
            // Initialize streaks if missing
            if (card) {
                if (typeof card.correctStreak !== "number") card.correctStreak = 0;
                if (typeof card.wrongStreak !== "number") card.wrongStreak = 0;
            }
            resolve(card);
        };
        req.onerror = () => reject(req.error);
    });
}

async function putCard(card) {
    // Always ensure streaks are present
    if (typeof card.correctStreak !== "number") card.correctStreak = 0;
    if (typeof card.wrongStreak !== "number") card.wrongStreak = 0;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CARD_STORE, "readwrite");
        const store = tx.objectStore(CARD_STORE);
        const req = store.put(card);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/* Get cards from db */
async function getAllCards() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CARD_STORE, "readonly");
        const store = tx.objectStore(CARD_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}


async function loadDeck({
    file = null,
    deckName = null,
    fieldMap,
    delimiter = "\t"
}) {
    let input, isCustom = false;

    if (file) {
        input = file;
        isCustom = true;
        dbg('loading custom file:', file.name || file.value);
    } else if (deckName) {
        const filePath = `default-decks/${deckName}.txt`;
        dbg('loading default deck:', filePath);
        const res = await fetch(filePath);
        input = await res.text();
    } else {
        throw new Error("Either file or deckName must be provided.");
    }

    return new Promise((resolve, reject) => {
        Papa.parse(input, {
            delimiter,
            skipEmptyLines: true,
            complete: async ({ data }) => {
                try {
                    const minFields = isCustom ? Math.max(...Object.values(fieldMap)) + 1 : 7;
                    const filtered = data.filter(row => row.length >= minFields);

                    // Fetch FSRS state for all cards in parallel
                    const flashcards = await Promise.all(filtered.map(async row => {
                        const word = row[fieldMap.word];
                        const fsrsState = await getFSRSState(word);
                        const card = new Flashcard(
                            word,
                            row[fieldMap.definition],
                            extractReading(row[fieldMap.reading]),
                            row[fieldMap.grammar],
                            row[fieldMap.sentence],
                            row[fieldMap.sentenceDefinition],
                            fsrsState
                        );
                        // Save card to IndexedDB (ensures all cards are present)
                        await putCard({ word, fsrsState, ...card });
                        return card;
                    }));

                    window.userCards = flashcards;

                    updateModeStats(flashcards);

                    showToast(`${flashcards.length} cards loaded!`);
                    resolve(flashcards);
                } catch (err) {
                    reject("Failed to parse deck: " + err);
                }
            },
            error: (err) => reject("PapaParse error: " + err)
        });
    });
}

function updateModeStats(flashcards) {
    // Reset answered counters and max counters
    for (let i = 1; i <= 4; i++) {
        window[`mode${i}Count`] = 0; // answered in this session
        window[`mode${i}Max`] = 0;   // total due for this session
        window[`mode${i}ReviewCount`] = 0; // answered review in this session
        window[`mode${i}ReviewMax`] = 0;   // total review due for this session
    }

    const now = new Date();

    // Count due cards per mode
    for (let mode = 1; mode <= 4; mode++) {
        let dueNew = 0;
        let dueReview = 0;
        flashcards.forEach(card => {
            const state = card.fsrsState[mode];
            if (!state) return;
            if (state.state === 0) {
                dueNew++;
            } else if (state.state >= 1 && new Date(state.due) <= now) {
                dueReview++;
            }
        });
        window[`mode${mode}Max`] = dueNew;
        window[`mode${mode}ReviewMax`] = dueReview;
    }

    // Update other global counters (total due for all modes)
    window.dueCount = 0;
    window.newLeftCount = 0;
    for (let i = 1; i <= 4; i++) {
        window.dueCount += window[`mode${i}ReviewMax`];
        window.newLeftCount += window[`mode${i}Max`];
    }
}


async function getFSRSState(word) {
    let card = await getCard(word);

    // If card and its fsrsState exist, return it
    if (card && card.fsrsState) {
        return card.fsrsState;
    }

    // Otherwise, create a new card with default state

    // make an array of fsrs states per mode and word to fsrsState.word
    const newCard = {
        word: word,
        fsrsState: {
            1: FSRS.createEmptyCard(),
            2: FSRS.createEmptyCard(),
            3: FSRS.createEmptyCard(),
            4: FSRS.createEmptyCard()
        }
    };



    // Ensure streaks are initialized
    if (typeof newCard.correctStreak !== "number") newCard.correctStreak = 0;
    if (typeof newCard.wrongStreak !== "number") newCard.wrongStreak = 0;

    await putCard(newCard);

    return newCard.fsrsState;
}


async function saveFSRSState(word, stateObj, correctStreak = 0, wrongStreak = 0) {
    let card = await getCard(word);
    if (!card) card = { word };
    card.fsrsState = stateObj;
    card.correctStreak = correctStreak;
    card.wrongStreak = wrongStreak;
    await putCard(card);
}


async function updateSRS(card, mode, isCorrect) {
    // Ensure streaks are present
    if (typeof card.correctStreak !== "number") card.correctStreak = 0;
    if (typeof card.wrongStreak !== "number") card.wrongStreak = 0;

    const fsrsState = card.fsrsState || {};
    const state = fsrsState[mode];

    // Convert dates from string to Date
    const now = new Date();
    const prev = {
        stability: state.stability,
        difficulty: state.difficulty,
        reps: state.reps,
        lapses: state.lapses,
        state: state.state,
        scheduled_days: state.scheduled,
        last_review: state.lastReview ? new Date(state.lastReview) : now,
        due: state.due ? new Date(state.due) : now,
    };

    // Determine rating
    let rating;
    if (isCorrect) {
        card.correctStreak++;
        card.wrongStreak = 0;
        rating = (card.correctStreak > 4)
            ? FSRS.Rating.Easy
            : FSRS.Rating.Good;
    } else {
        card.wrongStreak++;
        card.correctStreak = 0;
        rating = (card.wrongStreak > 4)
            ? FSRS.Rating.Again
            : FSRS.Rating.Hard;
    }

    // Use FSRS API
    const outcome = scheduler.repeat(prev, now);
    const updated = outcome[rating].card;

    // Update your state object with the new values
    state.stability = updated.stability;
    state.difficulty = updated.difficulty;
    state.reps = updated.reps;
    state.lapses = updated.lapses;
    state.state = updated.state;
    state.scheduled = updated.scheduled_days;
    state.lastReview = updated.last_review;
    state.due = updated.due;

    card.fsrsState = fsrsState;
    showToast(`Next scheduled date: ${card.fsrsState[mode].due}`);
    await putCard(card);

    return card.fsrsState;
}

window.loadDeck = loadDeck;