// CSS label dimensions are interpreted as world units at the sphere's depth.
// Use camera-space depth, not Euclidean camera distance: perspective projects
// a plane by depth, including when the camera pans or orbits.
export function nameplateProjection(viewportHeight,projectionY,depth,sphereScale=1) {
  if(![viewportHeight,projectionY,depth,sphereScale].every(Number.isFinite)||
     viewportHeight<=0||projectionY<=0||depth<=0||sphereScale<=0)return null;
  const pixelsPerUnit=viewportHeight*projectionY/(2*depth);
  return {scale:pixelsPerUnit*sphereScale,offsetY:11*pixelsPerUnit*sphereScale};
}
