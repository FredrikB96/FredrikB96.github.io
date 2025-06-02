const globalFieldMap = {
    word: 0,
    definition: 1,
    reading: 2,
    grammar: 3,
    sentence: 5,
    sentenceDefinition: 7,
};

const MODES = [1, 2, 3, 4];

window.APP_VERSION = "1.2.0";

window.MaxReviewCount = 200; // Maximum number of reviews per session
window.MaxNewCards = 20; // Maximum number of new cards per session


window.mode1Count = 0;
window.mode1Max = 0;
window.mode1ReviewCount = 0;
window.mode1ReviewMax = 0;
window.mode2Count = 0;
window.mode2Max = 0;
window.mode2ReviewCount = 0;
window.mode2ReviewMax = 0;
window.mode3Count = 0;
window.mode3Max = 0;
window.mode3ReviewCount = 0;
window.mode3ReviewMax = 0;
window.mode4Count = 0;
window.mode4Max = 0;
window.mode4ReviewCount = 0;
window.mode4ReviewMax = 0;

window.doneCount = 0; // Total cards answered in this session
window.dueCount = 0; // Total cards due for this session
window.newLeftCount = 0; // Total new cards left in deck

window.cardsAnswered = new Set();
window.newCardsSeen = new Set();
window.reviewCardsSeen = new Set();

let vocabList = [];

window.debugDateEnabled = false;
window.debugDateValue = null;

window.currentQuestionCard = null;
window.currentOptions = null;