// ====== FSRS HANDLING ======

const fsrsParams = FSRS.generatorParameters({ enable_fuzz: false, maximum_interval: 365 });
const scheduler = FSRS.fsrs(fsrsParams);

function getFSRSState(word) {
    const raw = localStorage.getItem("SRS_" + word);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (_) {
        return null;
    }
}

function saveFSRSState(word, state) {
    if (!word || !state) return;
    localStorage.setItem(word, JSON.stringify(state));
}

function computeElapsedDays(lastReviewDate) {
    const today = new Date();
    const last = new Date(lastReviewDate);
    return Math.floor((today - last) / (1000 * 60 * 60 * 24));
}

function getRatingFromTries(tries) {
    if (tries === 0) return FSRS.Rating.Good;
    if (tries === 1) return FSRS.Rating.Hard;
    return FSRS.Rating.Again;
}

function applyFSRS(card, wasCorrect, retryCount) {
    const now = new Date();
    const stored = getFSRSState(card.word);

    let fsrsCard;
    if (stored) {
        const elapsed_days = computeElapsedDays(stored.lastReview || stored.due);
        fsrsCard = {
            due: new Date(stored.due),
            stability: stored.stability,
            difficulty: stored.difficulty,
            elapsed_days: elapsed_days,
            scheduled_days: stored.scheduled,
            reps: stored.reps,
            lapses: stored.lapses,
            state: "review"
        };
    } else {
        fsrsCard = FSRS.createEmptyCard();
        fsrsCard.state = "new";
        fsrsCard.elapsed_days = 0;
        fsrsCard.scheduled_days = 0;
    }

    const rating = wasCorrect ? getRatingFromTries(retryCount) : FSRS.Rating.Again;
    const outcome = scheduler.next(fsrsCard, now, rating);
    const updatedCard = outcome.card;

    saveFSRSState(card.word, {
        due: updatedCard.due.toDateString(),
        lastReview: now.toDateString(),
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        reps: updatedCard.reps,
        lapses: updatedCard.lapses,
        scheduled: updatedCard.scheduled_days
    });
}
