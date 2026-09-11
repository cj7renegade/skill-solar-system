export function panDirection(key) {
  return {arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0],arrowup:[0,1],w:[0,1],arrowdown:[0,-1],s:[0,-1]}[key.toLowerCase()] || null;
}
// Track node IDs, not meshes or DOM elements, which are rebuilt on selection.
export function createActivationTracker() {
  let previous=null;
  return {
    reset(){previous=null;},
    click(id,x,y,time){
      const double=!!(id&&previous&&previous.id===id&&time-previous.time>=0&&time-previous.time<=450&&Math.hypot(x-previous.x,y-previous.y)<=6);
      previous=id&&!double?{id,x,y,time}:null;
      return double?'open':'select';
    }
  };
}
