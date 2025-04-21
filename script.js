let vocabList = [];
let currentCard = null;
let direction = 'jp-en';
let showHints = false;
let showExample = false;
let lastActiveDate = "2025-04-20";
let reviewCount = 12;
let newCount = 10;
let dailyStats = loadDailyStats();
let currentNewCount = 0;
let currentReviewCount = 0;


function updateNewLeftCount() {
  const remaining = vocabList.filter(card => card.repetitions === 0).length;
  document.getElementById('newLeftCount').innerText = remaining;
}


let quizMode = 'random';
document.getElementById('quizMode').addEventListener('change', (e) => {
  quizMode = e.target.value;
  showNextCard();
});

function getRandomMode() {
  return ['1', '2', '3'][Math.floor(Math.random() * 3)];
}

function getLocalDate() {
  return new Date().toLocaleDateString('en-CA'); // → "YYYY-MM-DD"
}

function loadDailyStats() {
  const today = getLocalDate();
  const stored = JSON.parse(localStorage.getItem('dailyStats') || '{}');

  if (stored.date !== today) {
    const resetStats = { date: today, newShown: 0, reviewShown: 0 };
    localStorage.setItem('dailyStats', JSON.stringify(resetStats));
    return resetStats;
  }
  
  updateNewLeftCount();

  return stored;
}

function saveDailyStats() {
  localStorage.setItem('dailyStats', JSON.stringify(dailyStats));
}

function createCard(entry) {
  return {
    ...entry,
    interval: 1,
    ease: 2.5,
    repetitions: 0,
    due: Date.now()
  };
}

function scheduleCard(card, grade) {
  if (grade < 3) {
    card.repetitions = 0;
    card.interval = 1;
  } else {
    card.repetitions++;
    if (card.repetitions === 1) {
      card.interval = 1;
    } else if (card.repetitions === 2) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.ease);
    }
    card.ease = Math.max(1.3, card.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  }
  card.due = Date.now() + card.interval * 86400000;
  saveProgress();
}

function saveProgress() {
  localStorage.setItem('vocabProgress', JSON.stringify(vocabList));
}

function loadProgress() {
  const data = localStorage.getItem('vocabProgress');
  return data ? JSON.parse(data) : [];
}

document.getElementById('csvFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: false,
    delimiter: '\t',
    skipEmptyLines: true,
    complete: function (results) {
      const saved = loadProgress();
      const map = new Map(saved.map((w) => [w.word, w]));

      vocabList = results.data.map((row) => {
        const [word, english, readingRaw, grammar, , exampleJP, , exampleEN] = row;
        const reading = extractReading(readingRaw);
        const entry = { word, english, reading, grammar, exampleJP, exampleEN };
        return map.has(word) ? map.get(word) : createCard(entry);
      });

      document.getElementById('quizSection').classList.remove('hidden');
      showNextCard();
    }
  });
});

document.getElementById('direction').addEventListener('change', (e) => {
  direction = e.target.value;
  showNextCard();
});
document.getElementById('showHints').addEventListener('change', (e) => {
  showHints = e.target.checked;
  document.getElementById('hints').classList.toggle('hidden', !showHints);
});
document.getElementById('showExample').addEventListener('change', (e) => {
  showExample = e.target.checked;
  document.getElementById('example').classList.toggle('hidden', !showExample);
});

function extractReading(furiganaFormat) {
  return furiganaFormat
    ? furiganaFormat.replace(/([^\[]*)\[([^\]]+)\]/g, (_, __, reading) => reading)
    : '';
}

function showNextCard() {
  //const dueWords = vocabList.filter((w) => w.due <= Date.now());
	
	dailyStats = loadDailyStats();
	currentNewCount = dailyStats.newShown;
	currentReviewCount = dailyStats.reviewShown;


	console.log('TODAY:', getLocalDate());
	console.log('Daily stats:', dailyStats);

	const newCardsDue = vocabList.filter(w => w.repetitions === 0 && w.due <= Date.now());
	console.log('New cards due:', newCardsDue.length);

    const dueWords = vocabList.filter((w) => {
        const isDue = w.due <= Date.now();
        const isNew = w.repetitions === 0;
        if (isDue && isNew && dailyStats.newShown < 20) return true;
        if (isDue && !isNew && dailyStats.reviewShown < 100) return true;
        return false;
    });

    if (!dueWords.length) {
    alert('No cards due! Come back later.');
    return;
  }

    currentCard = dueWords[Math.floor(Math.random() * dueWords.length)];
    const isNew = currentCard.repetitions === 0;
	const mode = quizMode === 'random' ? getRandomMode() : quizMode;
	let questionText = '';
	let correctAnswer = '';
	let hint = '';
	
	if (mode === '2') {
		// Remove entries where word === reading
		for (let i = dueWords.length - 1; i >= 0; i--) {
			if (dueWords[i].word === dueWords[i].reading) {
			dueWords.splice(i, 1);
			}
		}
	}
	
	switch (mode) {
	  case '1':
		questionText = currentCard.english;
		correctAnswer = currentCard.word;
		hint = `Reading: ${currentCard.reading}`;
		break;
	  case '2':
		questionText = currentCard.word;
		correctAnswer = currentCard.reading;
		hint = `English: ${currentCard.english}`;
		break;
	  case '3':
		questionText = currentCard.word;
		correctAnswer = currentCard.english;
		hint = `Reading: ${currentCard.reading}`;
		break;
	}
	
	
	let options = [correctAnswer];

	while (options.length < 5) {
	  const rand = vocabList[Math.floor(Math.random() * vocabList.length)];

	  let optionCandidate = '';
	  switch (mode) {
		case '1':
		  optionCandidate = rand.word;
		  break;
		case '2':
		  optionCandidate = rand.reading;
		  break;
		case '3':
		  optionCandidate = rand.english;
		  break;
	  }

	  if (!options.includes(optionCandidate)) {
		options.push(optionCandidate);
	  }
	  
	}

  options = shuffleArray(options);

  document.getElementById('question').innerText = questionText;


    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = '';
    options.forEach((opt) => {
        const button = document.createElement('button');
        button.textContent = opt;
        button.addEventListener('click', () => handleAnswer(button, opt === correctAnswer));
        choicesContainer.appendChild(button);
    });

    document.getElementById('newCount').innerText = currentNewCount;
    document.getElementById('reviewCount').innerText = currentReviewCount;

	console.log("HINT:", hint);
	console.log("EXAMPLE JP:", currentCard.exampleJP);
	console.log("EXAMPLE EN:", currentCard.exampleEN);

	document.getElementById('hints').textContent = hint;
	document.getElementById('example').textContent = `JP: ${currentCard.exampleJP}\nEN: ${currentCard.exampleEN}`;
    updateNewLeftCount();

}

function handleAnswer(clickedButton, isCorrect) {
  const buttons = document.querySelectorAll('#choices button');
  buttons.forEach((btn) => {
    if (btn === clickedButton && isCorrect) {
      btn.classList.add('correct');
    } else if (btn !== clickedButton && btn.textContent === currentCard.word || btn.textContent === currentCard.english || btn.textContent === currentCard.reading) {
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
    }
    btn.style.pointerEvents = 'none';
  });
  
  buttons.forEach((btn) => {
	if(btn == clickedButton){
		btn.style.border = "solid";
	}		
  });

  scheduleCard(currentCard, isCorrect ? 5 : 2);

  const isNew = currentCard.repetitions === 0;
  if (isNew) {
    dailyStats.newShown++;
    currentNewCount++;
  } else {
    dailyStats.reviewShown++;
    currentReviewCount++;
  }

  saveDailyStats();

  const dueDate = new Date(currentCard.due).toLocaleDateString();
  document.getElementById('question').innerText += `\n🔄 New Schedule: ${dueDate}`;

  document.getElementById('nextBtn').classList.remove('hidden');
}

document.getElementById('nextBtn').addEventListener('click', () => {
  document.getElementById('nextBtn').classList.add('hidden');
  showNextCard();
});

function shuffleArray(arr) {
  return arr.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
}


document.getElementById('downloadBackupBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(vocabList, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vocabProgress.json';
    a.click();
});

document.getElementById('uploadBackupInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        vocabList = JSON.parse(reader.result);
	    updateNewLeftCount();
        saveProgress();
        showNextCard();
    };
    reader.readAsText(file);
});

document.getElementById('loadDefaultBtn').addEventListener('click', () => {
  fetch('default-vocab.txt')
    .then(response => response.text())
    .then(data => {
      Papa.parse(data, {
        delimiter: '\t',
        skipEmptyLines: true,
        complete: function (results) {
          const saved = loadProgress();
          const map = new Map(saved.map((w) => [w.word, w]));

          vocabList = results.data.map((row) => {
            const [word, english, readingRaw, grammar, , exampleJP, , exampleEN] = row;
            const reading = extractReading(readingRaw);
            const entry = { word, english, reading, grammar, exampleJP, exampleEN };
            return map.has(word) ? map.get(word) : createCard(entry);
          });

          document.getElementById('quizSection').classList.remove('hidden');
          showNextCard();
          updateNewLeftCount();
        }
      });
    })
    .catch(err => {
      console.error("Failed to load default vocab file:", err);
      alert("Failed to load default vocab file.");
    });
	document.getElementById('loadDefaultBtn').classList.add('hidden');
});