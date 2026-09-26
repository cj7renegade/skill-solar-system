// Display spacing is reversible and never changes stored map coordinates.
// Keep these in step with the #sphere-spacing slider's min and max in index.html.
export const MIN_SPACING=.5, MAX_SPACING=10;
export function spacingValue(value) {
  const number=Number(value);
  return Number.isFinite(number)?Math.min(MAX_SPACING,Math.max(MIN_SPACING,number)):1;
}
export function displayPosition(position,spacing) { return position.map(v=>v*spacingValue(spacing)); }
export function storedPosition(position,spacing) { return position.map(v=>v/spacingValue(spacing)); }
export function spacingCameraShift(target,previous,next) {
  return target.map(v=>v*(spacingValue(next)/spacingValue(previous)-1));
}
