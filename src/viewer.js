import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { nodeColor, proficiencyLabel } from './model.js';
import { panOffset, nearestAhead, typicalSpacing, navigationDistance, keyPanAmount, wheelPixels, wheelMove } from './camera.js';
import { createActivationTracker } from './interaction.js';
import { visibleConnections } from './connections.js';
import { nameplateProjection } from './nameplates.js';
import { createEnvironment } from './environment.js';
import { spacingValue, displayPosition, storedPosition, spacingCameraShift } from './spacing.js';

export function createViewer(host, labelHost, onSelect, onMove, onOpen=()=>{}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 1, 30000);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  host.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false; controls.minDistance = 30; controls.maxDistance = 20000;
  scene.add(new THREE.AmbientLight(0xffffff,1.6));
  const sun = new THREE.DirectionalLight(0xffffff,3); sun.position.set(-200,600,500); scene.add(sun);
  const environment=createEnvironment();renderer.autoClear=false;
  const activation=createActivationTracker();
  const group = new THREE.Group(); scene.add(group);
  const sphere = new THREE.SphereGeometry(8,24,16);
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let graph, selected, labelsOn=true, selectedConnectionsOnly=true, proficiencyOn=false, editable=false, objects=[], labels=[], dragging=null, down=null, spacing=1, connections=[];
  // Wheel travel replaces OrbitControls zoom, so there is exactly one wheel handler (see camera.js).
  controls.enableZoom = false;
  let scale = { spacing:null, extent:0, key:'' };
  function navigation() {
    const forward = camera.getWorldDirection(new THREE.Vector3()).toArray();
    const nearest = nearestAhead(objects.map(o=>o.position.toArray()), camera.position.toArray(), forward, 8);
    return navigationDistance({ nearest, orbit:camera.position.distanceTo(controls.target), spacing:scale.spacing, extent:scale.extent, minimum:controls.minDistance });
  }
  // Right-drag pans the content at the navigation depth, not at a possibly stale target depth.
  const syncPanSpeed = () => { const orbit=camera.position.distanceTo(controls.target); controls.panSpeed = orbit>0 ? navigation()/orbit : 1; };
  controls.addEventListener('start', syncPanSpeed);
  controls.addEventListener('change', syncPanSpeed);
  renderer.domElement.addEventListener('wheel', e => {
    if (!controls.enabled || dragging || e.buttons) return;
    e.preventDefault();
    const pixels = wheelPixels(e, renderer.domElement.clientHeight);
    if (!pixels) return;
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const move = wheelMove(pixels, { orbit:camera.position.distanceTo(controls.target), distance:navigation(), minDistance:controls.minDistance, maxDistance:controls.maxDistance });
    camera.position.addScaledVector(forward, move.camera); controls.target.addScaledVector(forward, move.target);
    controls.update();
  }, { passive:false });
  const getRay = event => { const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray; };
  function clear() {
    for(const child of [...group.children]) {group.remove(child);child.traverse(o=>{if(o.geometry && o.geometry!==sphere)o.geometry.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});}
    labelHost.replaceChildren(); objects=[];labels=[];connections=[];
  }
  function rebuild() {
    clear(); if(!graph)return;
    const linked = new Set([selected]);
    for(const e of graph.edges)if(e.source===selected||e.target===selected){linked.add(e.source);linked.add(e.target);}
    for(const n of graph.nodes) {
      const color=nodeColor(n,proficiencyOn);
      const mesh = new THREE.Mesh(sphere,new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.2,emissive:color,emissiveIntensity:n.id===selected?.6:.12,transparent:true,opacity:proficiencyOn||!selected||linked.has(n.id)?1:.23}));
      mesh.position.fromArray(displayPosition(n.position,spacing));mesh.userData.id=n.id;if(n.id===selected)mesh.scale.setScalar(1.35);group.add(mesh);objects.push(mesh);
      const el=document.createElement('div');el.className='node-label'+(n.id===selected?' selected':'');el.textContent=n.name+(proficiencyOn?' · '+proficiencyLabel(n.proficiency80):'')+(n.pinned?' · pinned':'');labelHost.append(el);labels.push({el,mesh});
    }
    const positions=new Map(graph.nodes.map(n=>[n.id,new THREE.Vector3(...displayPosition(n.position,spacing))]));
    for(const e of visibleConnections(graph.edges,selected,selectedConnectionsOnly)) {
      const a=positions.get(e.source),b=positions.get(e.target),delta=b.clone().sub(a),length=delta.length();
      const direction=delta.normalize(),start=a.clone().addScaledVector(direction,11),end=b.clone().addScaledVector(direction,-11);
      const bright=!selected||e.source===selected||e.target===selected;
      const color=e.type==='prerequisite'?0xe9bd79:e.type==='supports'?0x638aa6:0x777eaa;
      const material=e.type==='supports'?new THREE.LineDashedMaterial({color,dashSize:7,gapSize:6,transparent:true,opacity:bright?.6:.09}):new THREE.LineBasicMaterial({color,transparent:true,opacity:bright?.7:.09});
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),material);line.computeLineDistances();group.add(line);
      let tip=null;
      if(e.type!=='related') {
        tip=new THREE.Mesh(new THREE.ConeGeometry(2.7,8,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:bright?.8:.1}));
        tip.position.copy(end).addScaledVector(direction,-4);tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);group.add(tip);
      }
      connections.push({source:e.source,target:e.target,line,tip});
    }
    updatePositions();
    draw();
  }
  function updatePositions() {
    if(!graph)return;
    const positions=new Map(graph.nodes.map(n=>[n.id,new THREE.Vector3(...displayPosition(n.position,spacing))]));
    // Local and overall scale for the navigation speed policy; recomputed only when positions change.
    const points=[...positions.values()].map(v=>v.toArray()),key=`${spacing}:${points.length}:${points.reduce((s,p)=>s+p[0]+p[1]*3+p[2]*7,0)}`;
    if(key!==scale.key){const box=new THREE.Box3().setFromPoints([...positions.values()]);scale={spacing:typicalSpacing(points),extent:box.isEmpty()?0:box.getSize(new THREE.Vector3()).length(),key};}
    for(const mesh of objects)mesh.position.copy(positions.get(mesh.userData.id));
    for(const {source,target,line,tip} of connections){
      const a=positions.get(source),b=positions.get(target),delta=b.clone().sub(a),length=delta.length();
      line.visible=length>=24;if(tip)tip.visible=line.visible;if(!line.visible)continue;
      const direction=delta.normalize(),start=a.clone().addScaledVector(direction,11),end=b.clone().addScaledVector(direction,-11);
      const attribute=line.geometry.attributes.position;attribute.setXYZ(0,...start.toArray());attribute.setXYZ(1,...end.toArray());attribute.needsUpdate=true;
      line.geometry.computeBoundingSphere();line.computeLineDistances();
      if(tip){tip.position.copy(end).addScaledVector(direction,-4);tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);}
    }
  }
  function draw() {
    // Keep expanded maps visible even after panning or fitting a large atlas.
    const reach=Math.max(1000,...objects.map(o=>o.position.length()));
    const far=Math.max(30000,camera.position.length()+reach+1000);
    if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix();}
    controls.maxDistance=Math.max(20000,reach*8);
    renderer.clear();
    environment.render(renderer,camera);
    renderer.render(scene,camera);
    const size=host.getBoundingClientRect();
    const cameraSpace=new THREE.Vector3();
    for(const {el,mesh}of labels){
      const p=mesh.position.clone().project(camera);
      const depth=-cameraSpace.copy(mesh.position).applyMatrix4(camera.matrixWorldInverse).z;
      const plate=nameplateProjection(size.height,camera.projectionMatrix.elements[5],depth,mesh.scale.x);
      el.hidden=!labelsOn||!plate||p.z>1||p.z< -1;
      if(el.hidden)continue;
      el.style.left=`${(p.x+1)*size.width/2}px`;
      el.style.top=`${(-p.y+1)*size.height/2+plate.offsetY}px`;
      // No minimum screen size, including selection: name and background
      // shrink/grow together with their sphere and remain camera-facing.
      el.style.transform=`translateX(-50%) scale(${plate.scale})`;
    }
  }
  controls.addEventListener('change',draw);
  new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height);draw();}).observe(host);
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;down={x:e.clientX,y:e.clientY};
    const hit=getRay(e).intersectObjects(objects)[0];
    if(editable&&e.shiftKey&&hit){
      activation.reset();
      controls.enabled=false;const normal=camera.getWorldDirection(new THREE.Vector3());const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,hit.object.position);
      const point=new THREE.Vector3();ray.ray.intersectPlane(plane,point);
      dragging={id:hit.object.userData.id,plane,offset:hit.object.position.clone().sub(point),position:storedPosition(hit.object.position.toArray(),spacing)};renderer.domElement.setPointerCapture(e.pointerId);
    }
  },true);
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const point=new THREE.Vector3();if(getRay(e).ray.intersectPlane(dragging.plane,point)){point.add(dragging.offset);dragging.position=storedPosition(point.toArray(),spacing);graph.nodes.find(n=>n.id===dragging.id).position=dragging.position;rebuild();}});
  const end=e=>{if(dragging){const d=dragging;dragging=null;controls.enabled=true;onMove(d.id,d.position);down=null;activation.reset();return;}if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){const hit=getRay(e).intersectObjects(objects)[0];const id=hit?.object.userData.id||null;const action=activation.click(id,e.clientX,e.clientY,performance.now());onSelect(id);if(action==='open'&&!editable)onOpen(id);}else activation.reset();down=null;};
  renderer.domElement.addEventListener('pointerup',end);
  renderer.domElement.addEventListener('pointercancel',()=>{activation.reset();if(dragging){const d=dragging;dragging=null;controls.enabled=true;onMove(d.id,d.position);}down=null;});
  function fit(front=false) {
    const box=new THREE.Box3();for(const n of graph?.nodes||[])box.expandByPoint(new THREE.Vector3(...displayPosition(n.position,spacing)));
    const center=box.isEmpty()?new THREE.Vector3(0,150,0):box.getCenter(new THREE.Vector3());const extent=box.isEmpty()?400:Math.max(box.getSize(new THREE.Vector3()).length(),300);
    const distance=extent/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.15/Math.min(camera.aspect||1,1);
    camera.position.copy(center).add(new THREE.Vector3(front?0:.18,front?0:.12,1).normalize().multiplyScalar(distance));controls.target.copy(center);controls.update();draw();
  }
  return {spacing(value){
    const next=spacingValue(value);if(next===spacing||dragging)return;
    const shift=new THREE.Vector3(...spacingCameraShift(controls.target.toArray(),spacing,next));
    spacing=next;camera.position.add(shift);controls.target.add(shift);
    updatePositions();controls.update();draw();
  },setGraph(value,id){graph=JSON.parse(JSON.stringify(value));selected=id;rebuild();},setEdit(value){editable=value;},labels(value){labelsOn=value;draw();},selectedConnections(value){selectedConnectionsOnly=value;rebuild();},proficiency(value){proficiencyOn=value;rebuild();},pan(horizontal,vertical,seconds){
    camera.updateMatrixWorld();
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).toArray();
    const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).toArray();
    const offset=new THREE.Vector3(...panOffset(right,up,horizontal,vertical,keyPanAmount(navigation(),seconds)));
    camera.position.add(offset);controls.target.add(offset);controls.update();draw();
  },fit,focus(id){const n=graph.nodes.find(n=>n.id===id);if(!n)return;const next=new THREE.Vector3(...displayPosition(n.position,spacing)),offset=camera.position.clone().sub(controls.target);controls.target.copy(next);camera.position.copy(next).add(offset);controls.update();draw();}};
}
