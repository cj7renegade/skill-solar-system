// CSS label dimensions are interpreted as world units at the sphere's depth.
// Use camera-space depth, not Euclidean camera distance: perspective projects
// a plane by depth, including when the camera pans or orbits.
export function nameplateProjection(viewportHeight,projectionY,depth,sphereScale=1) {
  if(![viewportHeight,projectionY,depth,sphereScale].every(Number.isFinite)||
     viewportHeight<=0||projectionY<=0||depth<=0||sphereScale<=0)return null;
  const pixelsPerUnit=viewportHeight*projectionY/(2*depth);
  return {scale:pixelsPerUnit*sphereScale,offsetY:11*pixelsPerUnit*sphereScale};
}

// A nameplate drawn with text smaller than this many pixels cannot be read, and thousands of them
// cost most of each frame, so it is not drawn until the camera comes close enough. The selected
// skill's nameplate always shows.
export const LABEL_TEXT_PX = 11;
export const MIN_READABLE_TEXT_PX = 4;
export function nameplateReadable(plate, selected = false) {
  return !!plate && (selected || plate.scale * LABEL_TEXT_PX >= MIN_READABLE_TEXT_PX);
}
