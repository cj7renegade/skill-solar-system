import * as THREE from 'three';

// A screen-space ray/plane intersection has no mesh boundary. World-space
// coordinates keep the grid stationary while panning in any horizontal direction.
export function createEnvironment() {
  const scene=new THREE.Scene(), screenCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms={viewPosition:{value:new THREE.Vector3()},viewWorld:{value:new THREE.Matrix4()},projectionInverse:{value:new THREE.Matrix4()}};
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
        vec3 color=mix(vec3(0.025,0.042,0.071),vec3(0.09,0.145,0.205),haze*0.72);
        float safeY=abs(ray.y)<0.00001?(ray.y<0.0?-0.00001:0.00001):ray.y;
        float travel=(-25.0-viewPosition.y)/safeY;
        vec2 worldXZ=viewPosition.xz+ray.xz*travel;
        float minor=gridLine(worldXZ/50.0);
        float major=gridLine(worldXZ/250.0);
        float fade=exp(-abs(travel)/6500.0)*(1.0-smoothstep(0.96,1.0,haze));
        float visible=step(0.0,travel);
        color+=vec3(0.10,0.19,0.28)*minor*fade*0.48*visible;
        color+=vec3(0.16,0.27,0.36)*major*fade*0.50*visible;
        gl_FragColor=vec4(color,1.0);
      }`
  });
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);quad.frustumCulled=false;scene.add(quad);
  return {render(renderer,camera){
    camera.updateMatrixWorld();
    uniforms.viewPosition.value.copy(camera.position);
    uniforms.viewWorld.value.copy(camera.matrixWorld);
    uniforms.projectionInverse.value.copy(camera.projectionMatrixInverse);
    renderer.render(scene,screenCamera);
  }};
}
