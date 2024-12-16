import { KEYWORDS } from './gameConstants.js';
import { BASEWORDS } from './gameConstants.js';
import { keywordsJSON } from './gameConstants.js';

import { SETTINGS } from './settings.js';

const startPage = document.querySelector('#startPage');
const game = document.querySelector('#game');
const finishPage = document.querySelector('#finishPage');

// game variables/data storage

let currentWords = [];
let score = 0;
let usedAttempts = 0;

// GAME LOGIC

const generateWords = () => {
  // get a keyword
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

  // returns an object mapping how many instances of each letter in given word
  const getLetterCount = (word) => {
    const letterCount = {};
    for (const letter of word) {
      letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    return letterCount;
  };

  // counting the letters in the keyword
  const keywordLetterCount = getLetterCount(keyword);

  // filter the words that consist of the letters that make up the keyword
  const words = BASEWORDS.filter((word) => {
    const wordLetterCount = getLetterCount(word);

    // check that if letter either doesnt exists in keyword, or occurs more times than i the keyword
    // return false if so
    for (const letter in wordLetterCount) {
      if ((keywordLetterCount[letter] || 0) < wordLetterCount[letter]) {
        return false;
      }
    }

    return true;
  });

  currentWords = words.map((word) => {
    return { word: word.toUpperCase(), isKeyword: false };
  });

  currentWords.push({ word: keyword.toUpperCase(), isKeyword: true });

  // ALT 2
  // get the keys (i.e the keywords)
  let keywords = Object.keys(keywordsJSON);

  // get random keyword for current game round
  const current = keywords[Math.floor(Math.random() * keywords.length)];

  // joining keyword + related words in array
  const currentWordsLower = [current, ...keywordsJSON[current]];

  // making all words uppercase
  currentWords = currentWordsLower.map((word) => {
    return word.toUpperCase();
  });
  console.log(currentWords);
};

// generate board
const generateBoard = () => {
  // build the game board

  // clearing html
  game.innerHTML = '';

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

  //   LETTER CIRCLE
  const letterCircle = document.createElement('div');
  letterCircle.id = 'letterCircle';

  //   appending content
  game.append(statsDisplay, helpBtn, wordBoard, letterCircle);

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

  // todo: ensure that several of the same letter in a word are taken into account
  const lettersSet = [...new Set(words.join('').split(''))]; // currently getting unique letters

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
    if (validateWord(words, word)) {
      // todo:  score keeping logic ++
      // todo: attempts logic if enabled

      // temporary
      console.log('Correct word, ' + isKeyword(word), word);

      isKeyword(word) ? (score += 5) : score++;
      if (SETTINGS.attemptsEnabled) {
        // do logic
        usedAttempts++;
      }
      generateScoreBoard();

      graphics.lineStyle(SETTINGS.letterPicker.lineWidth, 0x00ff00);
      drawContinuousLine();
    } else {
      // todo:  score keeping logic
      // todo: attempts logic if enabled

      console.log('Incorrect word:', word);

      if (SETTINGS.attemptsEnabled) {
        //do logic
        usedAttempts++;
      }
      generateScoreBoard();

      graphics.lineStyle(SETTINGS.letterPicker.lineWidth, 0xff0000);
      drawContinuousLine();
    }
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

  const getLetterAt = (x, y) => {
    return letters.find(
      (letter) => Phaser.Math.Distance.Between(letter.x, letter.y, x, y) < 32
    );
  };

  // phaser build
  function update() {}
};

const validateWord = (wordList, word) => {
  return wordList.includes(word);
};
const isKeyword = (word) => {
  const match = currentWords.find(
    (item) => item.word === word && item.isKeyword === true
  );
  return match ? true : false;
};

const generateScoreBoard = () => {
  // display stats

  if (game.querySelector('.attempts')) {
    game.querySelector('.attempts').innerHTML = usedAttempts;
  }

  game.querySelector('.score').innerHTML = score;
};

// game init
const initGame = () => {
  // start game: render game page and contents

  startPage.innerHTML = '';
  finishPage.innerHTML = '';

  // set active page
  document.querySelectorAll('.container > .active').forEach((elem) => {
    elem.classList.remove('active');
  });

  game.classList.add('active');

  //   game elements
  generateBoard();
  generateLetterCircle();
  generateScoreBoard();
};

// START PAGE
const displayStart = () => {
  // clear html
  game.innerHTML = '';
  finishPage.innerHTML = '';

  // set active page
  document.querySelectorAll('.container > .active').forEach((elem) => {
    elem.classList.remove('active');
  });

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

// APPLICATION ENTRY POINT
const renderPage = () => {
  // show start page
  console.log('START OF APPLICATION');
  displayStart();
  // initGame();
  generateWords();
};

document.addEventListener('DOMContentLoaded', renderPage);
