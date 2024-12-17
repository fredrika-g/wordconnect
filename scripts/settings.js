// GAME SETTINGS

// Set if attempts should be enabled below: true = yes, false = no
const attemptsEnabled = true;

// Set points value per regular word below
const pointsPerRegWord = 1;
// Set points value per keyword below
const pointsPerKeyword = 5;
// Set max amount of words on board below
const maxAmountOfWords = 4;

// graphics

// CHANGE COLOR OF LETTER PICKER: change property "bg"
const letterPicker = {
  bg: 0x7ad0a0,
  lineWidth: 15,
  get lineColor() {
    return modifyColor(this.bg, 1.1);
  },
  get bubbleColor() {
    return modifyColor(this.bg);
  },
  bubbleColorAlpha: 0.3,
  bubbleBorderWidth: 1,
  get bubbleBorderColor() {
    return modifyColor(this.bubbleColor);
  },
  letterColor: '#fff',
  fontFamily: 'Arial',
};

// setting object
export const SETTINGS = {
  attemptsEnabled,
  pointsPerKeyword,
  pointsPerRegWord,
  maxAmountOfWords,
  letterPicker,
};

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
