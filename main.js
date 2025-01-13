const startPage = document.getElementById('startPage');
const gamePage = document.getElementById('game');
const finishPage = document.getElementById('finishPage');

/* -------------------------------------------- */

// CUSTOMIZABLE SETTINGS HERE

// PROVIDED KEYWORDS HERE: FOLLOW GIVEN FORMAT

const WORDS = {
  snabb: ['ban', 'bas', 'sa', 'sabb', 'as'],
  enkel: ['en', 'len', 'elen', 'klen', 'kel', 'ek', 'lek', 'leken', 'el'],
  trygg: ['try', 'gry', 'gryt', 'rygg', 'ryt'],
  grön: ['örn', 'rön', 'gör', 'ön'],
  smart: ['mars', 'arm', 'mast', 'stram', 'ram', 'rast', 'tam', 'tar', 'trams'],
};

// WORDS variable needs to follow this format (an object):
/**
 {
  snabb: ['ban', 'bas', 'sa'],
  enkel: ['en', 'len', 'elen', 'klen'],
  trygg: ['try', 'gry', 'gryt'],
  grön: ['örn', 'rön'],
  smart: ['mars', 'arm', 'mast', 'stram', 'ram', 'rast'],
}
 */

// GAME SETTINGS

// the title/name of the game
const appTitle = 'Word Connect';
// game instructions
const instructions = `Fyll i de tomma rutorna på brädet genom att dra en linje mellan bokstäverna i cirkeln så att ord formas! 
Du har ett begränsat antal försök på dig att hitta alla ord, och din utmaning är att bli klar innan dina försök tar slut. `;

// start button text content
const startBtnText = 'Starta';

// reset btn text content (on finish page)
const resetBtnText = 'Spela igen';

// win message
const winMsg = 'Du klarade det!';

// lose message
const loseMsg = 'Nästan! Försök igen';

// x "out of" y: set "out of" value
const outOf = 'av';

// help page heading text
const helpHeadingText = 'Så här spelar du';

// "points" text
const pointsText = 'poäng';
// "attempts" text
const attemptsText = 'försök';

// Set if attempts should be enabled below: true = yes, false = no
const attemptsEnabled = true;

// Set if hints should be enabled below: true = yes, false = no
const hintsEnabled = true;

// Set points value per regular word below
const pointsPerRegWord = 1;

// Set points value per keyword below
const pointsPerKeyword = 5;

// Set max amount of words on board below, recommended max = 5
const maxAmountOfWords = 4;

// GRAPHICS SETTINGS
// design element: the wavey line below scoreboard
const waveThickness = 10;
const waveColor = '#fff';
const wave = document.getElementById('wave');

const appStyles = window.getComputedStyle(document.querySelector(':root'));

// retrieving value from styles.css to set color of letter picker
const primaryColorHex = appStyles.getPropertyValue('--primary-color');
// converting from hex to numerical, as accepted by phaser
const primaryColorConv = `0x${primaryColorHex.slice(
  1,
  primaryColorHex.length
)}`;

// letter picker settings as object
const letterPicker = {
  primary: primaryColorConv, // the primary color of the picker, based on value provided in the CSS
  lineWidth: 15, // width of the drawn line
  get lineColor() {
    // color of the drawn line
    return modifyColor(this.primary);
  },
  get bubbleColor() {
    // color of the "bubbles" containing the letters
    return modifyColor(this.primary);
  },
  bubbleBorderWidth: 1, // the border surrounding each "bubble"
  get bubbleBorderColor() {
    // color of the border surrounding each "bubble"
    return modifyColor(this.bubbleColor);
  },
  letterColor: '#fff', // color of the letters
  fontFamily: 'Arial', // font
};

// helper function for creating new color based on given hex color; factor = dark to light. The lower the factor the darker the color
function modifyColor(hexColor, factor = 0.8) {
  // extracting the rgb values
  let r = (hexColor >> 16) & 0xff;
  let g = (hexColor >> 8) & 0xff;
  let b = hexColor & 0xff;

  // modify the color values (darker/lighter depending on the factor: lower factor: darker color)
  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));

  // return the modified color values as rgb
  return (r << 16) | (g << 8) | b;
}

// END OF CUSTOMIZABLE SETTINGS

/* -------------------------------------------- */

// game variables/data storage !!! DONT CHANGE
let phaserGame;
let currentWords = [];
let foundWords = [];
let score = 0;
let usedAttempts = 0;
let isWin = false;

// global variables !!! DONT CHANGE
let maxPoints;
let maxAttempts;
let modal = document.getElementById('modal');

// GAME LOGIC

const generateWords = () => {
  // reset points and attempts
  maxPoints = 0;
  score = 0;

  maxAttempts = 0;
  usedAttempts = 0;

  foundWords = [];
  currentWords = [];

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

  // limit amount of words
  if (currentWords.length > maxAmountOfWords) {
    let shuffledWords = shuffleList(currentWords, true);
    currentWords = [currentWords[0], ...limitWords(shuffledWords)];
  }

  // game settings for this round
  setScoreValues();
};

// generate board
const generateBoard = () => {
  const wavePath = wave.querySelector('path');
  wavePath.setAttribute('stroke', waveColor);
  wavePath.setAttribute('stroke-width', waveThickness);
  // build the game board

  //   STATS

  //   if attempts enabled, insert attempts
  const attemptsSpan = document.getElementById('attemptsSpan');
  if (!attemptsEnabled) {
    attemptsSpan.classList.add('notVisible');
  }

  const helpBtn = document.createElement('div');
  helpBtn.id = 'help';
  helpBtn.addEventListener('click', toggleModal);

  document.getElementById('statsDisplay').append(helpBtn);

  //   BOARD
  const wordBoard = document.getElementById('wordBoard');

  currentWords.forEach((word, i) => {
    // create a row for each word
    const row = document.createElement('div');
    row.className = 'letter-row';
    // tracking which word in which row (by index)
    row.dataset.index = i;

    // insert hint: one given letter if enabled
    const hintIndex = Math.floor(Math.random() * word.length); // getting index of a randm letter in word

    // create a box for each letter
    for (let j = 0; j < word.length; j++) {
      const box = document.createElement('div');
      box.className = 'letter-box';

      if (hintsEnabled) {
        // if index of letter matches index of the hint, set is a clue
        if (j === hintIndex) {
          box.textContent = word[j];
          box.classList.add('hint');
        }
      }

      row.appendChild(box);
    }

    // append row to board
    wordBoard.appendChild(row);
  });

  //   LETTER CIRCLE
  const letterCircle = document.getElementById('letterCircle');

  const imageDiv = document.createElement('div');
  imageDiv.id = 'imageArea';

  letterCircle.append(imageDiv);
};

// generate letter picker
const generateLetterCircle = () => {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }

  // build the letter picker

  const config = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    transparent: true,
    parent: 'letterCircle',
    resolution: 2,
    scene: {
      preload,
      create,
      update,
    },
  };

  phaserGame = new Phaser.Game(config);

  // saving each letter traced
  let letters = [];
  // flag to keep track of user action
  let isDrawing = false;

  let currentPath = [];
  let graphics;
  const words = currentWords.map((word) => word);

  // getting each letter in keyword and placing them in array
  const lettersSet = shuffleList(Array.from(words[0]));

  // phaser build
  function preload() {
    resizeCanvas();
    // creating a graphic placeholder dynamically
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1); // color
    graphics.fillRect(0, 0, 10, 10); // 10x10px
    graphics.generateTexture('dot', 10, 10); // generate texture
    graphics.destroy(); // remove the temporary object
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
        width: letterPicker.lineWidth,
        color: letterPicker.lineColor,
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
        letterPicker.bubbleBorderWidth,
        letterPicker.bubbleBorderColor
      ); // border width, color
      bubbleGraphics.strokeCircle(x, y, bubbleSize / 2); // draw the border

      // create the circle shaped background for the letter
      bubbleGraphics.fillStyle(letterPicker.bubbleColor, 1); // background color
      bubbleGraphics.fillCircle(x, y, bubbleSize / 2); // set circle size

      const textStyle = {
        fontFamily: letterPicker.fontFamily,
        fontSize: `${bubbleSize / 2}px`, //adjusting the font size dynamically
        color: letterPicker.letterColor,
        fontStyle: 'bold',
        align: 'center',
        resolution: 2,
      };

      const text = this.add.text(x, y, letter, textStyle).setOrigin(0.5);
      text.setInteractive({ useHandCursor: true });
      letters.push({ letter, x, y, text });
    });

    // event listeners
    this.input.removeAllListeners();

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
    if (attemptsEnabled) {
      usedAttempts++;
    }

    // checking if entered word is is word list
    if (validateWord(words, word)) {
      // checking if word has already been entered
      if (foundWords.find((w) => w === word)) {
        // do nothing if word has already been entered, exit out
        return null;
      }

      // push word to the list of found words
      foundWords.push(word);

      // add points based on type of word
      isKeyword(word)
        ? (score += pointsPerKeyword)
        : (score += pointsPerRegWord);

      // update the scoreboard
      generateScoreBoard();

      // draw the line
      graphics.lineStyle(letterPicker.lineWidth, letterPicker.lineColor);
      drawContinuousLine();

      // place letters on board
      placeLetters(word);
    } else {
      // if word is not a valid word
      generateScoreBoard();

      graphics.lineStyle(letterPicker.lineWidth, letterPicker.lineColor);
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

const resizeCanvas = () => {
  const letterCircle = document.getElementById('letterCircle');
  const width = letterCircle.offsetWidth;
  const height = letterCircle.offsetHeight;

  if (phaserGame) {
    phaserGame.scale.resize(width, height); // Dynamiskt ändra storlek
  }
};
window.addEventListener('resize', resizeCanvas);

// check if win or loss
const checkGameStatus = () => {
  if (attemptsEnabled && usedAttempts === maxAttempts && score < maxPoints) {
    isWin = false;
    displayFinish();
  }

  if (score === maxPoints) {
    isWin = true;
    displayFinish();
  }
};

// validate a word
const validateWord = (wordList, word) => {
  return wordList.includes(word);
};

// check if word is keyword
const isKeyword = (word) => {
  const index = currentWords.indexOf(word);

  // return true if index of word is 0 (the keyword is always placed a index 0)
  return index === 0;
};

// limit amount of words per round
const limitWords = (wordsList) => {
  return wordsList.splice(0, maxAmountOfWords - 1);
};

// helper: shuffle an array
const shuffleList = (arr, removeFirst = false) => {
  // copying array (splicing first value if removeFirst = true)
  let arrCopy;
  if (removeFirst) {
    arrCopy = [...arr].splice(1, arr.length - 1);
  } else {
    arrCopy = [...arr];
  }

  // shuffle copied and altered array
  for (let i = arrCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
  }

  return arrCopy;
};

// update the scoreboard
const generateScoreBoard = () => {
  // render stats

  console.log(currentWords.length + 5, 'maxPoints', maxPoints);

  if (attemptsEnabled) {
    document.getElementById('currentAttemptsSpan').innerText = usedAttempts;
    document.getElementById('maxAttemptsSpan').innerText = maxAttempts;
  }

  document.getElementById('currentPointsSpan').innerText = score;
  document.getElementById('maxPointsSpan').innerText = maxPoints;
};

// calculate the max points and max attempts based on amount of words
const setScoreValues = () => {
  // setting maxpoints to the length of the list of possible words, minus the keyword which is worth more
  maxPoints = currentWords.length - 1;
  // adding the point value of the keyword
  maxPoints += pointsPerKeyword;

  maxAttempts = currentWords.length + 3;
};

// place letters on board
const placeLetters = (word) => {
  const index = currentWords.indexOf(word);
  const letters = Array.from(word);

  const wordRow = game.querySelector(`div[data-index="${index}"]`);

  const boxes = wordRow.querySelectorAll('div');

  boxes.forEach((box, i) => {
    box.classList.add('filled');
    {
      index === 0 && box.classList.add('keyword');
    }
    box.innerHTML = `<span class="letter">${letters[i]}</span>`;
  });

  const allAreFilled = Array.from(boxes).every((box) =>
    box.classList.contains('filled')
  );

  if (allAreFilled) {
    setTimeout(() => {
      checkGameStatus();
    }, 1000);
  } else {
    return;
  }
};

const toggleModal = () => {
  const isOpen = modal.style.display === 'flex';

  if (isOpen) {
    modal.style.display = 'none';
  } else {
    modal.style.display = 'flex';
  }
};

// game init
const initGame = () => {
  document.getElementById('wordBoard').innerHTML = '';
  document.getElementById('letterCircle').innerHTML = '';

  // generate words
  generateWords();

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
  // set active page
  removeActive();
  startPage.classList.add('active');
};

// FINISH PAGE

const displayFinish = () => {
  // set active page
  removeActive();
  finishPage.classList.add('active');

  if (isWin) {
    document.getElementById('lossHeading').style.display = 'none';
    document.getElementById('winHeading').style.display = 'block';
  } else {
    document.getElementById('winHeading').style.display = 'none';
    document.getElementById('lossHeading').style.display = 'block';
  }

  const pointsSpan = document.getElementById('endingPointsSpan');
  pointsSpan.innerText = score;
  console.log('Score', score);
  const maxPointsSpan = document.getElementById('maxPointsSpan');
  maxPointsSpan.innerText = maxPoints;
  console.log('maxPointsSpan', maxPointsSpan);

  if (attemptsEnabled) {
    const attemptsSpan = document.getElementById('endingAttemptsSpan');
    attemptsSpan.innerText = usedAttempts;
    const maxAttemptsSpan = document.getElementById('maxAttemptsSpan');
    maxAttemptsSpan.innerText = maxAttempts;
  }
};

// function that removes .active class on all relevant elements
const removeActive = () => {
  document.querySelectorAll('.container > .active').forEach((elem) => {
    elem.classList.remove('active');
  });
};

const addingEventListeners = () => {
  // start game btn
  document.getElementById('startBtn').addEventListener('click', initGame);

  // hiding modal if click outside content
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      toggleModal();
    }
  });

  // close modal btn
  document
    .getElementById('closeModalBtn')
    .addEventListener('click', toggleModal);

  // reset game btn
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('help').remove();
    initGame();
  });
};

// APPLICATION ENTRY POINT
const renderPage = () => {
  addingEventListeners();
  // show start page
  displayStart();
};

document.addEventListener('DOMContentLoaded', renderPage);
