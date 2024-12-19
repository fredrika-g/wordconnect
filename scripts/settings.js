// GAME SETTINGS

// Set if attempts should be enabled below: true = yes, false = no
const attemptsEnabled = true;

// Set if hints should be enabled below: true = yes, false = no
const hintsEnabled = true;

// Set points value per regular word below
const pointsPerRegWord = 1;
// Set points value per keyword below
const pointsPerKeyword = 5;
// Set max amount of words on board below, recommended max = 5
const maxAmountOfWords = 5;

// graphics settings
const pickerTextColor = '#fff'; // the color of the letters in the letter picker

// end of graphics settings

const appStyles = window.getComputedStyle(document.querySelector(':root'));

// retrieving value from styles.css to set color of letter picker
const primaryColorHex = appStyles.getPropertyValue('--primary-color');
// converting from hex to numerical, as accepted by phaser
const primaryColorConv = `0x${primaryColorHex.slice(
  1,
  primaryColorHex.length
)}`;

const letterPicker = {
  primary: primaryColorConv,
  lineWidth: 15,
  get lineColor() {
    return modifyColor(this.primary);
  },
  get bubbleColor() {
    return modifyColor(this.primary);
  },
  bubbleBorderWidth: 1,
  get bubbleBorderColor() {
    return modifyColor(this.bubbleColor);
  },
  letterColor: pickerTextColor,
  fontFamily: 'Arial',
};

// setting object
export const SETTINGS = {
  attemptsEnabled,
  hintsEnabled,
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
