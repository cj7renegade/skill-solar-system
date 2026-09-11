// Camera and orbit target must translate together to preserve the view angle.
export function panTranslation(right, up, horizontal, vertical, distance) {
  const step = Math.max(1,distance) * 0.025;
  return right.map((value,i)=>(value*horizontal+up[i]*vertical)*step);
}
