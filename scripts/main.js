import { WORDS } from './gameConstants.js';

import { SETTINGS } from './settings.js';

const startPage = document.querySelector('#startPage');
const gamePage = document.querySelector('#game');
const finishPage = document.querySelector('#finishPage');

// game variables/data storage

let currentWords = [];
let foundWords = [];
let score = 0;
let usedAttempts = 0;
let isWin = false;

// dynamic settings
let maxPoints;
let maxAttempts;

// GAME LOGIC

const generateWords = () => {
  // get a keyword
  // const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

  // returns an object mapping how many instances of each letter in given word
  // const getLetterCount = (word) => {
  //   const letterCount = {};
  //   for (const letter of word) {
  //     letterCount[letter] = (letterCount[letter] || 0) + 1;
  //   }
  //   return letterCount;
  // };

  // counting the letters in the keyword
  // const keywordLetterCount = getLetterCount(keyword);

  // filter the words that consist of the letters that make up the keyword
  // const words = BASEWORDS.filter((word) => {
  //   const wordLetterCount = getLetterCount(word);

  // check that if letter either doesnt exists in keyword, or occurs more times than i the keyword
  // return false if so
  //   for (const letter in wordLetterCount) {
  //     if ((keywordLetterCount[letter] || 0) < wordLetterCount[letter]) {
  //       return false;
  //     }
  //   }

  //   return true;
  // });

  // currentWords = words.map((word) => {
  //   return { word: word.toUpperCase(), isKeyword: false };
  // });

  // currentWords.push({ word: keyword.toUpperCase(), isKeyword: true });

  // ALT 2
  // get the keys (i.e the keywords)
  let keywords = Object.keys(WORDS);

  // get random keyword for current game round
  const current = keywords[Math.floor(Math.random() * keywords.length)];

  // joining keyword + related words in array
  const currentWordsLower = [current, ...WORDS[current]];

  // making all words uppercase
  currentWords = currentWordsLower.map((word) => {
    return word.toUpperCase();
  });

  // limit amount of words, max 4
  if (currentWords.length > 4) {
    let shuffledWords = shuffleList(currentWords);
    currentWords = [currentWords[0], ...limitWords(shuffledWords)];
  }

  // game settings for this round
  setScoreValues();
};

// generate board
const generateBoard = () => {
  // build the game board

  // clearing html
  gamePage.innerHTML = '';

  //   creating content

  //   STATS
  const statsDisplay = document.createElement('div');
  statsDisplay.id = 'statsDisplay';

  //   if attempts enabled, insert attempts
  if (SETTINGS.attemptsEnabled) {
    const attemptsSpan = document.createElement('span');
    attemptsSpan.classList.add('attempts');
    statsDisplay.append(attemptsSpan);
  }

  const scoreSpan = document.createElement('span');
  scoreSpan.classList.add('score');
  statsDisplay.append(scoreSpan);

  //   HELP BUTTON
  const helpBtn = document.createElement('div');
  helpBtn.id = 'help';

  //   BOARD
  const wordBoard = document.createElement('div');
  wordBoard.id = 'wordBoard';

  currentWords.forEach((word) => {
    // Skapa en rad för varje ord
    const row = document.createElement('div');
    row.className = 'letter-row';

    // Skapa en ruta för varje bokstav
    for (let i = 0; i < word.length; i++) {
      const box = document.createElement('div');
      box.className = 'letter-box';
      row.appendChild(box);
    }

    // Lägg till raden i containern
    wordBoard.appendChild(row);
  });

  //   LETTER CIRCLE
  const letterCircle = document.createElement('div');
  letterCircle.id = 'letterCircle';

  //   appending content
  gamePage.append(statsDisplay, helpBtn, wordBoard, letterCircle);

  //   logic
};

const generateLetterCircle = () => {
  // build the letter picker

  const config = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    backgroundColor: SETTINGS.letterPicker.bg,
    font: {
      fontFamily: 'system-ui',
    },
    parent: 'letterCircle',
    scene: {
      preload,
      create,
      update,
    },
  };

  const game = new Phaser.Game(config);
  let letters = [];
  let isDrawing = false;
  let currentPath = [];
  let graphics;
  const words = currentWords.map((word) => word);

  // getting each letter in keyword and placing them in array
  const lettersSet = Array.from(words[0]);

  // phaser build
  function preload() {
    this.load.image('dot', 'https://via.placeholder.com/10'); // node placeholder
  }

  // phaser build
  function create() {
    const { width, height } = this.scale.gameSize; // dynamically fetch width and height
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50; // radius based on min dimension minus margin

    const angleStep = (2 * Math.PI) / lettersSet.length;

    const bubbleGraphics = this.add.graphics(); // "letter bubbles" graphic object
    // line graphic object
    graphics = this.add.graphics({
      lineStyle: {
        width: SETTINGS.letterPicker.lineWidth,
        color: SETTINGS.letterPicker.lineColor,
      },
    });

    // calculating the bubble size
    const calculateBubbleSize = () => {
      const baseBubbleSize = 64; // base size
      const scaleFactor = Math.min(width, height) / 500; // scale based on dimensions
      return Math.round(baseBubbleSize * scaleFactor); // return adjusted size
    };

    const bubbleSize = calculateBubbleSize(); //set bubble size

    // placing letters in a circle
    lettersSet.forEach((letter, index) => {
      const angle = index * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      bubbleGraphics.lineStyle(
        SETTINGS.letterPicker.bubbleBorderWidth,
        SETTINGS.letterPicker.bubbleBorderColor
      ); // border width, color
      bubbleGraphics.strokeCircle(x, y, bubbleSize / 2); // draw the border

      // create the circle shaped background for the letter
      bubbleGraphics.fillStyle(
        SETTINGS.letterPicker.bubbleColor,
        SETTINGS.letterPicker.bubbleColorAlpha
      ); // background color
      bubbleGraphics.fillCircle(x, y, bubbleSize / 2); // set circle size

      const textStyle = {
        fontFamily: 'Arial',
        fontSize: `${bubbleSize / 2}px`, //adjusting the font size dynamically
        color: '#fff',
        fontStyle: 'bold',
        align: 'center',
      };

      const text = this.add.text(x, y, letter, textStyle).setOrigin(0.5);
      text.setInteractive({ useHandCursor: true });
      letters.push({ letter, x, y, text });
    });

    // event listeners
    this.input.on('pointerdown', startPath, this);
    this.input.on('pointermove', drawPath, this);
    this.input.on('pointerup', endPath, this);
  }

  const startPath = (pointer) => {
    isDrawing = true;
    currentPath = [];
    graphics.clear();
    const letter = getLetterAt(pointer.x, pointer.y);
    if (letter) {
      currentPath.push(letter);
      drawContinuousLine();
    }
  };

  const drawPath = (pointer) => {
    if (!isDrawing) return;

    const letter = getLetterAt(pointer.x, pointer.y);
    if (letter && !currentPath.includes(letter)) {
      currentPath.push(letter);
      drawContinuousLine();
    }
  };

  const endPath = (pointer) => {
    isDrawing = false;

    const word = currentPath.map((l) => l.letter).join('');
    validateMove(word);

    // reset graphics
    setTimeout(() => graphics.clear(), 1000);
  };

  const drawContinuousLine = () => {
    // graphics.clear();
    graphics.beginPath();
    if (currentPath.length > 0) {
      graphics.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        graphics.lineTo(currentPath[i].x, currentPath[i].y);
      }
    }
    graphics.strokePath();
  };

  const validateMove = (word) => {
    // check if attempts are enabled, if true increase attempts used
    if (SETTINGS.attemptsEnabled) {
      usedAttempts++;
    }

    if (validateWord(words, word)) {
      // todo:  score keeping logic ++
      // todo: attempts logic if enabled

      // checking if word has already been entered
      if (foundWords.find((w) => w === word)) {
        console.log(`Word ${word} already entered`);
        return null;
      }

      foundWords.push(word);

      // temporary
      console.log('Correct word, ' + isKeyword(word), word);

      // add points based on type of word
      isKeyword(word)
        ? (score += SETTINGS.pointsPerKeyword)
        : (score += SETTINGS.pointsPerRegWord);

      // update the scoreboard
      generateScoreBoard();

      // draw the line
      graphics.lineStyle(
        SETTINGS.letterPicker.lineWidth,
        SETTINGS.letterPicker.lineColor
      );
      drawContinuousLine();

      // check if win or lose
      checkGameStatus();
    } else {
      // todo:  score keeping logic
      // todo: attempts logic if enabled

      generateScoreBoard();

      graphics.lineStyle(
        SETTINGS.letterPicker.lineWidth,
        SETTINGS.letterPicker.lineColor
      );
      drawContinuousLine();

      // check if win or lose
      checkGameStatus();
    }
  };

  const getLetterAt = (x, y) => {
    return letters.find(
      (letter) => Phaser.Math.Distance.Between(letter.x, letter.y, x, y) < 32
    );
  };

  // phaser build
  function update() {}
};

const checkGameStatus = () => {
  if (
    SETTINGS.attemptsEnabled &&
    usedAttempts === maxAttempts &&
    score < maxPoints
  ) {
    isWin = false;
    displayFinish();
  }

  if (score === maxPoints) {
    isWin = true;
    displayFinish();
  }
};

const validateWord = (wordList, word) => {
  return wordList.includes(word);
};
const isKeyword = (word) => {
  const index = currentWords.indexOf(word);

  // return true if index of word is 0 (the keyword is always placed a index 0)
  return index === 0;
};

const limitWords = (wordsList) => {
  return wordsList.splice(0, 3);
};

const shuffleList = (arr) => {
  // copying currentWords
  let arrCopy = [...arr].splice(1, arr.length - 1);

  // shuffle copied and altered array
  for (let i = arrCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
  }

  return arrCopy;
};

const generateScoreBoard = () => {
  // display stats

  if (gamePage.querySelector('.attempts')) {
    gamePage.querySelector('.attempts').innerHTML =
      usedAttempts + '/' + maxAttempts;
  }

  gamePage.querySelector('.score').innerHTML = score + '/' + maxPoints;
};

const setScoreValues = () => {
  // setting maxpoints to the length of the list of possible words, minus the keyword which is worth more
  maxPoints = currentWords.length - 1;
  // adding the point value of the keyword
  maxPoints += SETTINGS.pointsPerKeyword;

  maxAttempts = currentWords.length + 3;
};

// game init
const initGame = () => {
  // generate words
  generateWords();

  // start game: render game page and contents

  startPage.innerHTML = '';
  finishPage.innerHTML = '';

  // set active page
  removeActive();

  gamePage.classList.add('active');

  //   game elements
  generateBoard();
  generateLetterCircle();
  generateScoreBoard();
};

// START PAGE
const displayStart = () => {
  // clear html
  gamePage.innerHTML = '';
  finishPage.innerHTML = '';

  // set active page
  removeActive();

  startPage.classList.add('active');

  // create content
  // 1. title
  const titleElem = document.createElement('h1');
  titleElem.innerText = 'Word Connect';
  titleElem.id = 'title';

  // 2. instructions
  const instructionsElem = document.createElement('p');
  instructionsElem.innerText = 'lorem ipsum blablabla';
  instructionsElem.classList.add('instructions');

  // 3. start btn
  const startBtn = document.createElement('button');
  startBtn.innerText = 'Starta';
  startBtn.id = 'startBtn';
  startBtn.classList.add('btn');
  startBtn.addEventListener('click', initGame);

  // append content on page
  startPage.append(titleElem, instructionsElem, startBtn);
  startPage.classList.add('active');
};

// FINISH PAGE

const displayFinish = () => {
  // clear html
  startPage.innerHTML = '';
  gamePage.innerHTML = '';
  // set active page
  removeActive();
  finishPage.classList.add('active');

  // creating content
  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper');

  const heading = document.createElement('h1');
  heading.innerText = isWin ? 'Du klarade det!' : 'Nästan! Försök igen';

  // game stats summary
  const summary = document.createElement('div');
  summary.classList.add('summary');

  const pointsStat = document.createElement('div');
  pointsStat.classList.add('statRow');

  pointsStat.innerHTML = `<span class="currentStat">${score}</span> / ${maxPoints} <span>poäng</span>`;

  summary.append(pointsStat);

  if (SETTINGS.attemptsEnabled) {
    const attemptsStat = document.createElement('div');
    attemptsStat.classList.add('statRow');
    attemptsStat.innerHTML = `<span class="currentStat">${usedAttempts}</span> / ${maxAttempts} <span>försök</span>`;
    summary.append(attemptsStat);
  }

  // reset btn/play again
  const resetBtn = document.createElement('button');
  resetBtn.classList.add('btn');
  resetBtn.id = 'resetBtn';
  resetBtn.innerText = 'Spela igen';
  resetBtn.addEventListener('click', initGame);

  // appending content
  wrapper.append(heading, summary, resetBtn);
  finishPage.append(wrapper);
};

const removeActive = () => {
  document.querySelectorAll('.container > .active').forEach((elem) => {
    elem.classList.remove('active');
  });
};

// APPLICATION ENTRY POINT
const renderPage = () => {
  // show start page
  console.log('START OF APPLICATION');
  displayStart();
};

document.addEventListener('DOMContentLoaded', renderPage);
