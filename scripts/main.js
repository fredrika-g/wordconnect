import { KEYWORDS } from './gameConstants.js';
import { BASEWORDS } from './gameConstants.js';

import { SETTINGS } from './settings.js';

const startPage = document.querySelector('#startPage');
const game = document.querySelector('#game');
const finishPage = document.querySelector('#finishPage');

// game variables/data storage

let usedLetters = [];
let currentWords = [];
let score = 0;
let usedAttempts = 0;

// GAME LOGIC

// generate board
const generateBoard = () => {
  // build the game board

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
    backgroundColor: '#90ee90',
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
  // const words = ['RANGE', 'ANGER', 'GONE']; // Exempelord
  const words = KEYWORDS;
  const lettersSet = [...new Set(words.join('').split(''))]; // Unika bokstäver

  function preload() {
    this.load.image('dot', 'https://via.placeholder.com/10'); // Placeholder för nod
  }

  function create() {
    const { width, height } = this.scale.gameSize; // Dynamiskt hämta bredd och höjd
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50; // Radie baserad på minst dimension minus marginal

    const angleStep = (2 * Math.PI) / lettersSet.length;
    graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xffffff } });

    const calculateFontSize = () => {
      const baseFontSize = 32; // base font size
      const scaleFactor = Math.min(width, height) / 500; // using width and height to scale
      return Math.round(baseFontSize * scaleFactor); // return value: adjusted size
    };

    // placing letters in a circle
    lettersSet.forEach((letter, index) => {
      const angle = index * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const textStyle = {
        fontFamily: 'Arial',
        fontSize: `${calculateFontSize()}px`, //adjusting the font size dynamically
        color: '#fff',
        // fontStyle: 'bold',
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

  function startPath(pointer) {
    isDrawing = true;
    currentPath = [];
    graphics.clear();
    const letter = getLetterAt(pointer.x, pointer.y);
    if (letter) {
      currentPath.push(letter);
      drawContinuousLine();
    }
  }

  function drawPath(pointer) {
    if (!isDrawing) return;

    const letter = getLetterAt(pointer.x, pointer.y);
    if (letter && !currentPath.includes(letter)) {
      currentPath.push(letter);
      drawContinuousLine();
    }
  }

  function endPath(pointer) {
    isDrawing = false;

    const word = currentPath.map((l) => l.letter).join('');
    if (validateWord(word)) {
      console.log('Correct word:', word);
      // Färga linje grön vid korrekt ord
      graphics.lineStyle(4, 0x00ff00);
      drawContinuousLine();
    } else {
      console.log('Incorrect word:', word);
      // Färga linje röd vid fel ord
      graphics.lineStyle(4, 0xff0000);
      drawContinuousLine();
    }
    // Återställ efter en stund
    setTimeout(() => graphics.clear(), 1000);
  }

  function drawContinuousLine() {
    graphics.clear();
    graphics.beginPath();
    if (currentPath.length > 0) {
      graphics.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        graphics.lineTo(currentPath[i].x, currentPath[i].y);
      }
    }
    graphics.strokePath();
  }

  function getLetterAt(x, y) {
    return letters.find(
      (letter) => Phaser.Math.Distance.Between(letter.x, letter.y, x, y) < 32
    );
  }

  function validateWord(word) {
    return words.includes(word);
  }

  function update() {}
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

  //   game elements
  generateBoard();
  generateLetterCircle();
  generateScoreBoard();
};

// START PAGE

// FINISH PAGE

// APPLICATION ENTRY POINT
const renderPage = () => {
  // show start page
  console.log('START OF APPLICATION');
  initGame();
};

renderPage();
