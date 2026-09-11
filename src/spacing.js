// Display spacing is reversible and never changes stored map coordinates.
export function spacingValue(value) {
  const number=Number(value);
  return Number.isFinite(number)?Math.min(4,Math.max(.5,number)):1;
}
export function displayPosition(position,spacing) { return position.map(v=>v*spacingValue(spacing)); }
export function storedPosition(position,spacing) { return position.map(v=>v/spacingValue(spacing)); }
export function spacingCameraShift(target,previous,next) {
  return target.map(v=>v*(spacingValue(next)/spacingValue(previous)-1));
}
