// GAME SETTINGS

const maxPoints = 100;

const maxAttempts = 20;

const attemptsEnabled = true;

// graphics

const letterPicker = {
  bg: 0x90ee90,
  lineWidth: 10,
  lineColor: 0xffffff,
  get bubbleColor() {
    return modifyColor(this.bg);
  },
  bubbleColorAlpha: 0.3,
  bubbleBorderWidth: 1,
  get bubbleBorderColor() {
    return modifyColor(this.bubbleColor);
  },
};

export const SETTINGS = {
  maxPoints,
  maxAttempts,
  attemptsEnabled,
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
