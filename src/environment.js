import * as THREE from 'three';
import { GRID_SHADER } from './grid.js';

// A screen-space ray/plane intersection has no mesh boundary. World-space
// coordinates keep the grid stationary while panning in any horizontal direction.
// Colours come from a theme: Classic keeps its original values exactly; the Cyberpunk HUD uses a
// near-black base with a subtle vignette and a thin, low-opacity cyan grid that fades with distance.
export const ENVIRONMENT_THEMES = {
  classic: { baseLow: [0.025, 0.042, 0.071], baseHigh: [0.09, 0.145, 0.205], minor: [0.10, 0.19, 0.28], major: [0.17, 0.29, 0.39], vignette: 0, distanceFade: 0 },
  cyberpunk: { baseLow: [0.024, 0.031, 0.045], baseHigh: [0.05, 0.075, 0.1], minor: [0.07, 0.36, 0.38], major: [0.11, 0.55, 0.58], vignette: 0.45, distanceFade: 0.7 }
};
export function createEnvironment() {
  const scene=new THREE.Scene(), screenCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const v3=a=>new THREE.Vector3(...a), classic=ENVIRONMENT_THEMES.classic;
  const uniforms={viewPosition:{value:new THREE.Vector3()},viewWorld:{value:new THREE.Matrix4()},projectionInverse:{value:new THREE.Matrix4()},
    baseLow:{value:v3(classic.baseLow)},baseHigh:{value:v3(classic.baseHigh)},minorColor:{value:v3(classic.minor)},majorColor:{value:v3(classic.major)},vignette:{value:0},distanceFade:{value:0}};
  const material=new THREE.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:`varying vec2 screenUV;
      void main(){screenUV=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`
      precision highp float;
      varying vec2 screenUV;
      uniform vec3 viewPosition;
      uniform mat4 viewWorld;
      uniform mat4 projectionInverse;
      uniform vec3 baseLow, baseHigh, minorColor, majorColor;
      uniform float vignette, distanceFade;
      ${GRID_SHADER}
      float gridLine(vec2 coordinate){
        vec2 footprint=max(fwidth(coordinate),vec2(0.0001));
        vec2 distanceToLine=abs(fract(coordinate-0.5)-0.5)/footprint;
        float line=1.0-min(min(distanceToLine.x,distanceToLine.y),1.0);
        // Fade subpixel cells rather than letting distant lines shimmer.
        return line*(1.0-smoothstep(0.3,1.0,max(footprint.x,footprint.y)));
      }
      void main(){
        vec4 endpoint=projectionInverse*vec4(screenUV*2.0-1.0,1.0,1.0);
        endpoint/=endpoint.w;
        vec3 ray=normalize((viewWorld*endpoint).xyz-viewPosition);
        float haze=exp(-abs(ray.y)*16.0);
        vec3 color=mix(baseLow,baseHigh,haze*0.72);
        float safeY=abs(ray.y)<0.00001?(ray.y<0.0?-0.00001:0.00001):ray.y;
        float travel=(-25.0-viewPosition.y)/safeY;
        vec2 worldXZ=viewPosition.xz+ray.xz*travel;
        // The spacing steps up as the camera pulls back, so cells keep a usable size on screen and the
        // floor stays visible at any distance. The finer subdivision fades as the next level takes over.
        vec2 cell=fwidth(worldXZ);
        float perPixel=max(max(cell.x,cell.y),0.0001);
        float spacing=gridSpacing(perPixel);
        float minor=gridLine(worldXZ/spacing);
        float major=gridLine(worldXZ/(spacing*GRID_STEP));
        // Only the horizon fades now: a fade by distance is what made the floor vanish when zoomed out.
        float fade=(1.0-smoothstep(0.90,1.0,haze))*step(0.0,travel);
        // Cyberpunk only: the grid thins out with distance, relative to the camera's height.
        fade*=1.0-distanceFade*clamp(travel/(abs(viewPosition.y+25.0)*14.0+1.0),0.0,1.0);
        color+=minorColor*minor*(1.0-gridBlend(perPixel))*fade*0.62;
        color+=majorColor*major*fade*0.85;
        color*=1.0-vignette*smoothstep(0.35,1.05,length((screenUV-0.5)*vec2(1.25,1.0))*1.4);
        gl_FragColor=vec4(color,1.0);
      }`
  });
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);quad.frustumCulled=false;scene.add(quad);
  return {setTheme(name){const t=ENVIRONMENT_THEMES[name]||classic;uniforms.baseLow.value.set(...t.baseLow);uniforms.baseHigh.value.set(...t.baseHigh);
      uniforms.minorColor.value.set(...t.minor);uniforms.majorColor.value.set(...t.major);uniforms.vignette.value=t.vignette;uniforms.distanceFade.value=t.distanceFade;},
    render(renderer,camera){
    camera.updateMatrixWorld();
    uniforms.viewPosition.value.copy(camera.position);
    uniforms.viewWorld.value.copy(camera.matrixWorld);
    uniforms.projectionInverse.value.copy(camera.projectionMatrixInverse);
    renderer.render(scene,screenCamera);
  }};
}
