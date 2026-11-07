import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DOMAINS, nodeColor } from './model.js';
import { panOffset, nearestAhead, typicalSpacing, navigationDistance, keyPanAmount, wheelPixels, wheelMove, centerOn } from './camera.js';
import { createActivationTracker } from './interaction.js';
import { visibleConnections } from './connections.js';
import { nameplateProjection, nameplateReadable } from './nameplates.js';
import { createEnvironment } from './environment.js';
import { spacingValue, displayPosition, storedPosition, spacingCameraShift } from './spacing.js';
import { pulseIntensity, pulseWave, steadyIntensity, pulsingIds, PULSE_COLORS } from './pulse.js';
import { isHelixMap, helixCourses, courseColors, matchesHelixFilters, activeFilters, bandView } from './helix.js';
import { buildStructure } from './structure.js';
import { clusterData, clusterMeshes, wantsDetail, placeLabels, LOD_MIN_NODES } from './lod.js';
import { FRONTIER_GLOW } from './palette.js';

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
  // Helix maps only: milestones are larger octahedra on the axis, checkpoints smaller spheres.
  const milestoneShape = new THREE.OctahedronGeometry(15);
  const markerScale = (helix, n) => !helix ? 1 : n.nodeKind === 'checkpoint' ? 0.6 : n.nodeKind === 'milestone' ? 1.7 : 1;
  // Where a skill is drawn: band gaps (helix maps, display only) and then display spacing. unplace
  // inverts both, so an edit-mode drag stores a position in the map's own coordinates.
  const place = n => displayPosition(bandView(graph, n), spacing);
  const unplace = (id, p) => { const n = graph.nodes.find(x => x.id === id); return bandView(graph, n, storedPosition(p, spacing), true); };
  // The helix's orientation aids (src/structure.js): spine, stage rings, ruler and band labels.
  const structureGroup = new THREE.Group(); scene.add(structureGroup);
  const structureHost = document.createElement('div'); structureHost.className = 'structure-labels'; structureHost.id = 'structure-labels'; labelHost.after(structureHost);
  let structureLabels = [], targetId = null;
  function refreshStructure() {
    for (const child of [...structureGroup.children]) { structureGroup.remove(child); child.geometry?.dispose(); child.material?.dispose(); }
    const built = buildStructure(graph, place, { target: targetId, spacing });
    structureGroup.add(built.group);
    structureHost.replaceChildren();
    structureLabels = built.labels.map(l => { const el = document.createElement('div'); el.className = `structure-label ${l.kind}${l.active ? ' active' : ''}${l.done ? ' done' : ''}${l.side === -1 ? ' left' : ''}`; el.textContent = l.text; if (l.color) el.style.color = l.color; structureHost.append(el); return { ...l, el }; });
    structureHost.dataset.count = String(structureLabels.length);
  }
  // Nameplate widths for the label budget's overlap test, measured once per label in the label font.
  const measure = document.createElement('canvas').getContext('2d');
  const textWidth = l => { if (l.width === undefined) { measure.font = "11px 'Segoe UI', system-ui, sans-serif"; l.width = measure.measureText(l.text).width; } return l.width; };
  // Level of detail (src/lod.js). lodMix runs from 0 (subject clusters) to 1 (individual skills) and
  // eases between them; the selected skill, milestones and the Next up skills are always drawn.
  const clusterGroup = new THREE.Group(); scene.add(clusterGroup);
  const clusterHost = document.createElement('div'); clusterHost.className = 'cluster-labels'; clusterHost.id = 'cluster-labels'; structureHost.after(clusterHost);
  let clusters = [], clusterShell = null, clusterCore = null, clusterLabels = [], mapBox = new THREE.Box3(), keepIds = new Set();
  let detail = true, lodMix = 1, lodFrame = null, lodEnabled = true;
  // Path mode: the skills on a remaining path stay lit, everything else dims, and only the
  // prerequisite links inside the path are drawn, as one batched line set.
  let pathIds = null, pathLines = null;
  const pathGroup = new THREE.Group(); scene.add(pathGroup);
  function refreshPath() {
    if (pathLines) { pathGroup.remove(pathLines); pathLines.geometry.dispose(); pathLines.material.dispose(); pathLines = null; }
    labelHost.dataset.path = String(pathIds?.size ?? 0);
    if (!pathIds || !graph) return;
    const at = new Map(graph.nodes.filter(n => pathIds.has(n.id)).map(n => [n.id, place(n)])), points = [];
    for (const e of graph.edges) if (e.type === 'prerequisite' && at.has(e.source) && at.has(e.target)) points.push(...at.get(e.source), ...at.get(e.target));
    pathLines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3)), new THREE.LineBasicMaterial({ color: 0xe9bd79, transparent: true, opacity: .5, depthWrite: false }));
    pathLines.raycast = () => {}; pathGroup.add(pathLines);
    labelHost.dataset.pathLinks = String(points.length / 6);
  }
  const alwaysShown = mesh => mesh.userData.id === selected || keepIds.has(mesh.userData.id) || mesh.userData.milestone;
  function refreshClusters() {
    for (const child of [...clusterGroup.children]) { clusterGroup.remove(child); child.material?.dispose(); }
    clusterShell = clusterCore = null; clusterHost.replaceChildren(); clusters = []; clusterLabels = [];
    if (!graph || graph.nodes.length < LOD_MIN_NODES) { detail = true; lodMix = 1; applyLod(); return; }
    const helix = isHelixMap(graph);
    clusters = clusterData(graph, place);
    // Grouping needs subjects: a map with few of them, or one subject per handful of skills, keeps every skill.
    if (!lodEnabled || clusters.length < 8 || clusters.length > graph.nodes.length / 3) { clusters = []; detail = true; lodMix = 1; applyLod(); return; }
    // In the proficiency view the shells go grey, so the gold cores alone carry the progress.
    ({ shell: clusterShell, core: clusterCore } = clusterMeshes(clusters, helix ? courseColors(helixCourses(graph)) : null, proficiencyOn));
    clusterGroup.add(clusterShell, clusterCore);
    clusterLabels = clusters.map(c => { const el = document.createElement('div'); el.className = 'cluster-label'; el.textContent = c.name; el.hidden = true; clusterHost.append(el); return { el, cluster: c, position: new THREE.Vector3(...c.centre) }; });
    clusterHost.dataset.count = String(clusters.length);
    applyLod();
  }
  function applyLod() {
    const skills = lodMix, groups = 1 - lodMix;
    for (const mesh of objects) {
      const always = alwaysShown(mesh);
      mesh.visible = always || skills > 0.01;
      mesh.material.opacity = mesh.userData.base * (always ? 1 : skills);
    }
    if (clusterShell) { clusterShell.visible = clusterCore.visible = groups > 0.01; clusterShell.material.opacity = .55 * groups; clusterCore.material.opacity = groups; }
    labelHost.dataset.lod = lodMix > .5 ? 'skills' : 'clusters';
  }
  function updateLod() {
    const want = !clusters.length || !!pathIds || wantsDetail(camera.position, mapBox, graph?.nodes.length || 0);
    if (want === detail) return;
    detail = want;
    if (lodFrame !== null) cancelAnimationFrame(lodFrame);
    if (reducedMotion?.matches) { lodMix = detail ? 1 : 0; applyLod(); return; }
    const from = lodMix, to = detail ? 1 : 0, started = performance.now();
    const step = now => {
      const t = Math.min(1, (now - started) / 280);
      lodMix = from + (to - from) * (t * t * (3 - 2 * t)); applyLod(); draw();
      lodFrame = t < 1 ? requestAnimationFrame(step) : null;
    };
    lodFrame = requestAnimationFrame(step);
  }
  let helixFilters = {};
  // Legend isolation (helix maps): course codes kept at full strength; every other skill fades to 15%.
  let isolated = null;
  // Subject halos: a domain-coloured shell around each highlighted sphere (visible up close) and a
  // fixed-size ring (still visible at overview distance). They live outside the node group, so a
  // toggle never rebuilds the graph, and they are never raycast, so every sphere stays selectable.
  const haloGroup = new THREE.Group(); scene.add(haloGroup);
  const ringTexture = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.lineWidth = 6; g.strokeStyle = '#fff'; g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.stroke(); return new THREE.CanvasTexture(c); })();
  let subjects = new Set();
  const halos = new Map();
  function disposeHalo(halo) { haloGroup.remove(halo.shells, halo.ring); halo.shells.material.dispose(); halo.shells.dispose(); halo.ring.geometry.dispose(); halo.ring.material.dispose(); }
  function refreshHalos() {
    const members = new Map([...subjects].map(domain => [domain, []]));
    for (const n of graph?.nodes || []) members.get(n.domain)?.push(n);
    for (const [domain, halo] of halos) if (!members.get(domain)?.length) { disposeHalo(halo); halos.delete(domain); }
    const matrix = new THREE.Matrix4();
    for (const [domain, nodes] of members) {
      if (!nodes.length) continue;
      let halo = halos.get(domain);
      if (!halo || halo.count !== nodes.length) {
        if (halo) disposeHalo(halo);
        const color = new THREE.Color(DOMAINS[domain]);
        halo = { count: nodes.length,
          shells: new THREE.InstancedMesh(sphere, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, transparent: true, opacity: .8, depthWrite: false }), nodes.length),
          ring: new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodes.length * 3), 3)), new THREE.PointsMaterial({ color, map: ringTexture, size: 20, sizeAttenuation: false, transparent: true, alphaTest: .3, depthWrite: false })) };
        halo.shells.raycast = () => {}; halo.ring.raycast = () => {};
        haloGroup.add(halo.shells, halo.ring); halos.set(domain, halo);
      }
      const positions = halo.ring.geometry.attributes.position;
      nodes.forEach((n, i) => { const p = place(n), s = (n.id === selected ? 1.35 : 1) * 1.6; matrix.makeScale(s, s, s).setPosition(...p); halo.shells.setMatrixAt(i, matrix); positions.setXYZ(i, ...p); });
      halo.shells.instanceMatrix.needsUpdate = true; positions.needsUpdate = true;
      halo.shells.computeBoundingSphere(); halo.ring.geometry.computeBoundingSphere();
    }
    labelHost.dataset.highlighted = String([...halos.values()].reduce((sum, h) => sum + h.count, 0));
  }
  // Frontier skills (ready to study: every prerequisite proficient) get a soft glow: one fixed-size
  // point sprite each, in a single draw call, never raycast, so it costs almost nothing per frame.
  const glowTexture = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 6, 32, 32, 31); r.addColorStop(0, '#ffffffff'); r.addColorStop(.35, '#ffffff88'); r.addColorStop(1, '#ffffff00'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  let frontierIds = new Set(), frontierGlow = null;
  function refreshFrontier() {
    if (frontierGlow) { haloGroup.remove(frontierGlow); frontierGlow.geometry.dispose(); frontierGlow.material.dispose(); frontierGlow = null; }
    const nodes = (graph?.nodes || []).filter(n => frontierIds.has(n.id));
    labelHost.dataset.frontier = String(nodes.length);
    if (!nodes.length) return;
    const points = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => points.set(place(n), i * 3));
    frontierGlow = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(points, 3)),
      new THREE.PointsMaterial({ color: new THREE.Color(FRONTIER_GLOW), map: glowTexture, size: 30, sizeAttenuation: false, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending }));
    frontierGlow.raycast = () => {};
    haloGroup.add(frontierGlow);
  }
  // Skills marked Yes pulse while proficiency colouring is on (see pulse.js). Only their glow changes,
  // so a pulse frame re-renders the scene without touching nameplates or map data.
  const reducedMotion = matchMedia?.('(prefers-reduced-motion: reduce)');
  let pulsing = [], pulseFrame = null, pulseStarted = 0;
  // The colour travels with the glow, from the marked-Yes gold to a pale cream at the peak.
  const pulseFrom = new THREE.Color(PULSE_COLORS.from), pulseTo = new THREE.Color(PULSE_COLORS.to), pulseTint = new THREE.Color();
  function stopPulse() { if (pulseFrame !== null) { cancelAnimationFrame(pulseFrame); pulseFrame = null; } }
  function syncPulse() {
    stopPulse();
    const marked = new Set(pulsingIds(graph, proficiencyOn));
    pulsing = objects.filter(mesh => marked.has(mesh.userData.id));
    if (!pulsing.length) return;
    const paint = wave => { pulseTint.copy(pulseFrom).lerp(pulseTo, wave); for (const mesh of pulsing) { mesh.material.color.copy(pulseTint); mesh.material.emissive.copy(pulseTint); } };
    if (reducedMotion?.matches) { paint(.5); for (const mesh of pulsing) mesh.material.emissiveIntensity = steadyIntensity(mesh.userData.id === selected); draw(); return; }
    pulseStarted = performance.now();
    const step = now => {
      const seconds = (now - pulseStarted) / 1000;
      paint(pulseWave(seconds));
      for (const mesh of pulsing) mesh.material.emissiveIntensity = pulseIntensity(seconds, mesh.userData.id === selected);
      renderScene();
      pulseFrame = requestAnimationFrame(step);
    };
    pulseFrame = requestAnimationFrame(step);
  }
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let graph, selected, labelsOn=true, selectedConnectionsOnly=true, proficiencyOn=false, editable=false, objects=[], labels=[], dragging=null, down=null, spacing=1, connections=[];
  // Wheel travel replaces OrbitControls zoom, so there is exactly one wheel handler (see camera.js).
  controls.enableZoom = false;
  let scale = { spacing:null, extent:0, key:'' };
  // Whole-map values that only change when positions do: how far the map reaches from the origin and
  // the sphere centres used for navigation speed. Kept here so a frame does not recompute them.
  let reach = 1000, navigationPoints = [];
  // The orbit centre follows the selection: a clicked sphere becomes the target (the camera turns
  // toward it over a short animation) and stays the target until the user pans or deselects.
  let anchor = null, flight = null;
  const meshFor = id => objects.find(o => o.userData.id === id);
  const anchored = () => { const mesh = anchor && meshFor(anchor); return !!mesh && mesh.position.distanceTo(controls.target) < 1e-3; };
  function stopFlight(complete) {
    if (!flight) return;
    cancelAnimationFrame(flight.frame); controls.minDistance = flight.minDistance;
    if (complete) { camera.position.copy(flight.camera); controls.target.copy(flight.target); controls.update(); }
    flight = null;
  }
  function centerOnNode(id) {
    stopFlight(false); anchor = id;
    const mesh = meshFor(id); if (!mesh) return;
    const end = centerOn(camera.position.toArray(), mesh.position.toArray(), controls.minDistance);
    animateTo(new THREE.Vector3(...end.camera), new THREE.Vector3(...end.target));
  }
  // Flies the camera up to a point, keeping the viewing direction, to a given distance from it (Next
  // up, Fly to, a clicked cluster). The orbit centre becomes that point.
  function approach(point, distance, id = null) {
    stopFlight(false); anchor = id;
    const direction = camera.position.clone().sub(controls.target);
    if (direction.lengthSq() < 1e-6) direction.set(0, 0, 1);
    direction.normalize();
    animateTo(point.clone().addScaledVector(direction, distance), point.clone(), 520);
  }
  function animateTo(endCamera, endTarget, duration = 320) {
    const from = { camera: camera.position.clone(), target: controls.target.clone() }, started = performance.now();
    flight = { camera: endCamera, target: endTarget, minDistance: controls.minDistance, frame: 0 };
    controls.minDistance = 0; // the moving target may pass closer than the limit mid-turn
    const step = now => {
      const t = Math.min(1, (now - started) / duration), ease = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      camera.position.lerpVectors(from.camera, flight.camera, ease); controls.target.lerpVectors(from.target, flight.target, ease); controls.update();
      if (t < 1) flight.frame = requestAnimationFrame(step); else stopFlight(true);
    };
    flight.frame = requestAnimationFrame(step);
  }
  function navigation() {
    const forward = camera.getWorldDirection(new THREE.Vector3()).toArray();
    const nearest = nearestAhead(navigationPoints, camera.position.toArray(), forward, 8);
    return navigationDistance({ nearest, orbit:camera.position.distanceTo(controls.target), spacing:scale.spacing, extent:scale.extent, minimum:controls.minDistance });
  }
  // Right-drag pans the content at the navigation depth, not at a possibly stale target depth.
  const syncPanSpeed = () => { const orbit=camera.position.distanceTo(controls.target); controls.panSpeed = orbit>0 ? navigation()/orbit : 1; };
  controls.addEventListener('start', syncPanSpeed);
  controls.addEventListener('change', syncPanSpeed);
  renderer.domElement.addEventListener('wheel', e => {
    if (!controls.enabled || dragging || e.buttons) return;
    e.preventDefault(); stopFlight(true);
    const pixels = wheelPixels(e, renderer.domElement.clientHeight);
    if (!pixels) return;
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const move = wheelMove(pixels, { orbit:camera.position.distanceTo(controls.target), distance:navigation(), minDistance:controls.minDistance, maxDistance:controls.maxDistance, anchored:anchored() });
    camera.position.addScaledVector(forward, move.camera); controls.target.addScaledVector(forward, move.target);
    controls.update();
  }, { passive:false });
  const getRay = event => { const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray; };
  function clear() {
    for(const child of [...group.children]) {group.remove(child);child.traverse(o=>{if(o.geometry && o.geometry!==sphere && o.geometry!==milestoneShape)o.geometry.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});}
    stopPulse(); pulsing=[];
    labelHost.replaceChildren(); objects=[];labels=[];connections=[];reach=1000;navigationPoints=[];
  }
  function rebuild() {
    clear(); if(!graph)return;
    const linked = new Set([selected]);
    for(const e of graph.edges)if(e.source===selected||e.target===selected){linked.add(e.source);linked.add(e.target);}
    // Helix maps colour by course and can filter; a filtered-out skill is dimmed and unlabelled, never removed.
    const helix=isHelixMap(graph),palette=helix?courseColors(helixCourses(graph)):null,filtering=helix&&activeFilters(helixFilters).length>0;
    for(const n of graph.nodes) {
      const offPath=!!pathIds&&n.id!==selected&&!pathIds.has(n.id);
      const color=nodeColor(n,proficiencyOn,palette),dimmed=offPath||filtering&&n.id!==selected&&!matchesHelixFilters(graph,n,helixFilters),faded=!dimmed&&!!isolated&&n.id!==selected&&!isolated.has(n.courseCode);
      const mesh = new THREE.Mesh(helix&&n.nodeKind==='milestone'?milestoneShape:sphere,new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.2,emissive:color,emissiveIntensity:n.id===selected?.6:.12,transparent:true,opacity:dimmed?.05:faded?.15:proficiencyOn||pathIds||!selected||linked.has(n.id)?1:.23}));
      if(helix&&n.nodeKind==='milestone'){mesh.material.wireframe=n.proficiency80!==true;if(n.id===targetId)mesh.material.emissiveIntensity=.9;}
      mesh.userData.base=mesh.material.opacity;mesh.userData.milestone=n.nodeKind==='milestone';mesh.position.fromArray(place(n));mesh.userData.id=n.id;mesh.scale.setScalar(markerScale(helix,n)*(n.id===selected?1.35:1));group.add(mesh);objects.push(mesh);
      const el=document.createElement('div');el.className='node-label'+(n.id===selected?' selected':'');el.textContent=n.name+(n.pinned?' · pinned':'');labelHost.append(el);labels.push({el,mesh,isSelected:n.id===selected,dimmed:dimmed||faded,milestone:helix&&n.nodeKind==='milestone',text:el.textContent});
    }
    labelHost.dataset.faded=String(labels.filter(l=>l.dimmed).length);
    const positions=new Map(graph.nodes.map(n=>[n.id,new THREE.Vector3(...place(n))]));
    for(const e of pathIds?[]:visibleConnections(graph.edges,selected,selectedConnectionsOnly)) {
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
    syncPulse();
  }
  function updatePositions() {
    if(!graph)return;
    const positions=new Map(graph.nodes.map(n=>[n.id,new THREE.Vector3(...place(n))]));
    // Local and overall scale for the navigation speed policy; recomputed only when positions change.
    const points=[...positions.values()].map(v=>v.toArray()),key=`${spacing}:${points.length}:${points.reduce((s,p)=>s+p[0]+p[1]*3+p[2]*7,0)}`;
    if(key!==scale.key){const box=new THREE.Box3().setFromPoints([...positions.values()]);scale={spacing:typicalSpacing(points),extent:box.isEmpty()?0:box.getSize(new THREE.Vector3()).length(),key};mapBox=box;}
    for(const mesh of objects)mesh.position.copy(positions.get(mesh.userData.id));
    navigationPoints=objects.map(o=>o.position.toArray());
    reach=1000;for(const o of objects)reach=Math.max(reach,o.position.length());
    for(const {source,target,line,tip} of connections){
      const a=positions.get(source),b=positions.get(target),delta=b.clone().sub(a),length=delta.length();
      line.visible=length>=24;if(tip)tip.visible=line.visible;if(!line.visible)continue;
      const direction=delta.normalize(),start=a.clone().addScaledVector(direction,11),end=b.clone().addScaledVector(direction,-11);
      const attribute=line.geometry.attributes.position;attribute.setXYZ(0,...start.toArray());attribute.setXYZ(1,...end.toArray());attribute.needsUpdate=true;
      line.geometry.computeBoundingSphere();line.computeLineDistances();
      if(tip){tip.position.copy(end).addScaledVector(direction,-4);tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);}
    }
    if(subjects.size||halos.size)refreshHalos();
    refreshFrontier();refreshStructure();refreshClusters();refreshPath();
  }
  function renderScene() {
    renderer.clear();
    environment.render(renderer,camera);
    renderer.render(scene,camera);
  }
  function draw() {
    // Keep expanded maps visible even after panning or fitting a large atlas.
    const far=Math.max(30000,camera.position.length()+reach+1000);
    if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix();}
    controls.maxDistance=Math.max(20000,reach*8);
    renderScene();
    const size=host.getBoundingClientRect();
    const cameraSpace=new THREE.Vector3();
    // Write the hidden flag only when it changes, so unchanged nameplates cost no DOM work.
    const hide=(el,value)=>{if(el.hidden!==value)el.hidden=value;};
    updateLod();
    // Skill nameplates: the selected skill and the Next up skills always; others only when the Labels
    // box is on and skills are shown (not clusters). Candidates are placed nearest first, up to the
    // label budget, and a nameplate that would overlap one already placed is left out.
    const candidates=[];
    for(const l of labels){
      const {el,mesh,dimmed,milestone}=l,id=mesh.userData.id,always=l.isSelected||keepIds.has(id);
      if(milestone||!(always||(labelsOn&&!dimmed&&lodMix>.5))){hide(el,true);continue;}
      const depth=-cameraSpace.copy(mesh.position).applyMatrix4(camera.matrixWorldInverse).z;
      const plate=nameplateProjection(size.height,camera.projectionMatrix.elements[5],depth,mesh.scale.x);
      // Too small to read: hidden before any projection or style work (see nameplates.js).
      if(!nameplateReadable(plate,always)){hide(el,true);continue;}
      const p=mesh.position.clone().project(camera);
      if(p.z>1||p.z< -1){hide(el,true);continue;}
      // A nameplate shrinks and grows with its sphere; one that must always show keeps at least its
      // normal size, so it stays readable from the overview.
      const s=always?Math.max(plate.scale,1):plate.scale,x=(p.x+1)*size.width/2,y=(-p.y+1)*size.height/2+(always?Math.max(plate.offsetY,11):plate.offsetY),w=(textWidth(l)+12)*s;
      // Off-screen nameplates are positioned as always but cost nothing visible, so they stay outside
      // the budget and the overlap test, which only govern what is on screen.
      candidates.push({l,x,y,s,depth,always,offscreen:Math.abs(p.x)>1.05||Math.abs(p.y)>1.05,rect:{x:x-w/2,y,w,h:21*s}});
    }
    // Nearest first, in depth bands of about 5%; inside a band, the one nearest the middle of the view.
    const mid={x:size.width/2,y:size.height/2},band=c=>Math.round(Math.log(Math.max(1,c.depth))/0.05);
    // Inside a depth band, nameplates shown last frame keep their place, so labels do not swap while
    // the camera pans; a nearer sphere still takes priority.
    candidates.sort((a,b)=>(b.always-a.always)||band(a)-band(b)||(!!b.l.shown-!!a.l.shown)||Math.hypot(a.x-mid.x,a.y-mid.y)-Math.hypot(b.x-mid.x,b.y-mid.y));
    const shown=placeLabels(candidates.filter(c=>!c.offscreen));
    for(const c of candidates)if(c.offscreen)shown.add(c);
    for(const l of labels)l.shown=false;
    for(const c of candidates){
      c.l.shown=shown.has(c);hide(c.l.el,!c.l.shown);if(!c.l.shown)continue;
      c.l.el.style.left=`${c.x}px`;c.l.el.style.top=`${c.y}px`;c.l.el.style.transform=`translateX(-50%) scale(${c.s})`;
    }
    labelHost.dataset.shown=String([...shown].filter(c=>!c.offscreen).length);
    const taken=drawStructureLabels(size);
    drawClusterLabels(size,[...taken,...[...shown].filter(c=>!c.offscreen).map(c=>c.rect)]);
  }
  // Subject names on the clusters, largest subjects first, never overlapping each other or the
  // orientation labels. Shown only while clusters are.
  function drawClusterLabels(size,taken){
    if(!clusterLabels.length)return;
    const on=lodMix<.5,candidates=[];
    for(const l of clusterLabels){
      if(!on){if(!l.el.hidden)l.el.hidden=true;continue;}
      const p=l.position.clone().project(camera);
      if(p.z>1||p.z< -1||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05){if(!l.el.hidden)l.el.hidden=true;continue;}
      const x=(p.x+1)*size.width/2,y=(-p.y+1)*size.height/2,w=l.cluster.name.length*6.4+10;
      candidates.push({l,x,y,count:l.cluster.count,rect:{x:x-w/2,y:y-8,w,h:16}});
    }
    candidates.sort((a,b)=>b.count-a.count);
    const shown=placeLabels([...taken.map(rect=>({always:true,rect,seed:true})),...candidates],140);
    let count=0;
    for(const c of candidates){const on=shown.has(c);if(c.l.el.hidden===on)c.l.el.hidden=!on;if(!on)continue;count++;c.l.el.style.left=`${c.x}px`;c.l.el.style.top=`${c.y}px`;}
    clusterHost.dataset.shown=String(count);
  }
  // Orientation labels keep a fixed, readable size. Milestone labels alternate sides of the axis and
  // are nudged apart vertically so neighbours on the spine never overlap.
  function drawStructureLabels(size) {
    const sides = { 1: [], '-1': [] };
    // Course labels move to the anchor on their band that most faces the camera.
    const view = new THREE.Vector2(camera.position.x - controls.target.x, camera.position.z - controls.target.z).normalize();
    for (const l of structureLabels) if (l.anchors) {
      let best = -Infinity;
      for (const a of l.anchors) { const r = Math.hypot(a.x, a.z) || 1, facing = (a.x * view.x + a.z * view.y) / r; if (facing > best + .05) { best = facing; l.position = a; } }
    }
    for (const l of structureLabels) {
      const p = l.position.clone().project(camera);
      const off = p.z > 1 || p.z < -1 || Math.abs(p.x) > 1.2 || Math.abs(p.y) > 1.2;
      if (l.el.hidden !== off) l.el.hidden = off;
      if (off) continue;
      l.x = (p.x + 1) * size.width / 2; l.y = (-p.y + 1) * size.height / 2;
      if (l.kind === 'milestone') sides[l.side].push(l);
      else { l.el.style.left = `${l.x}px`; l.el.style.top = `${l.y}px`; }
    }
    // Course and stage labels give way to each other: a label that would overlap one already placed
    // moves down a line, then up, and is hidden if neither fits.
    const placed = [];
    const box = (l, y) => { const w = l.text.length * 6.6 + 12, x = l.kind === 'stage' ? l.x + 8 : l.x - w / 2; return { x, y: y - 9, w, h: 18 }; };
    const hits = r => placed.some(q => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h);
    for (const l of structureLabels) {
      if (l.el.hidden || (l.kind !== 'course' && l.kind !== 'stage')) continue;
      const y = [l.y, l.y + 18, l.y - 18].find(y => !hits(box(l, y)));
      if (y === undefined) { l.el.hidden = true; continue; }
      placed.push(box(l, y)); l.el.style.top = `${y}px`;
    }
    for (const list of Object.values(sides)) {
      list.sort((a, b) => b.y - a.y);   // bottom of the screen first, so the chain reads upward
      let last = Infinity;
      for (const l of list) {
        const y = Math.min(l.y, last - 17), w = l.text.length * 7 + 14, x = l.x + l.side * 16; last = y;
        l.el.style.left = `${x}px`; l.el.style.top = `${y}px`;
        placed.push({ x: l.side > 0 ? x : x - w, y: y - 9, w, h: 18 });
      }
    }
    return placed;   // where orientation labels sit, so cluster names can keep clear of them
  }
  controls.addEventListener('change',draw);
  new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height);draw();}).observe(host);
  renderer.domElement.addEventListener('pointerdown',e=>{
    stopFlight(true);
    if(e.button!==0)return;down={x:e.clientX,y:e.clientY};
    const hit=getRay(e).intersectObjects(objects.filter(o=>o.visible))[0];
    if(editable&&e.shiftKey&&hit){
      activation.reset();
      controls.enabled=false;const normal=camera.getWorldDirection(new THREE.Vector3());const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,hit.object.position);
      const point=new THREE.Vector3();ray.ray.intersectPlane(plane,point);
      dragging={id:hit.object.userData.id,plane,offset:hit.object.position.clone().sub(point),position:unplace(hit.object.userData.id,hit.object.position.toArray())};renderer.domElement.setPointerCapture(e.pointerId);
    }
  },true);
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const point=new THREE.Vector3();if(getRay(e).ray.intersectPlane(dragging.plane,point)){point.add(dragging.offset);dragging.position=unplace(dragging.id,point.toArray());graph.nodes.find(n=>n.id===dragging.id).position=dragging.position;rebuild();}});
  const end=e=>{if(dragging){const d=dragging;dragging=null;controls.enabled=true;onMove(d.id,d.position);down=null;activation.reset();return;}if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){const hit=getRay(e).intersectObjects(objects.filter(o=>o.visible))[0];
      // Zoomed out, a click on a subject cluster flies in until its skills appear.
      const cluster=!hit&&lodMix<.5&&clusterShell?getRay(e).intersectObject(clusterShell)[0]:null;
      if(cluster){const c=clusters[cluster.instanceId];down=null;activation.reset();approach(new THREE.Vector3(...c.centre),Math.max(220,c.radius*7));return;}const id=hit?.object.userData.id||null;const action=activation.click(id,e.clientX,e.clientY,performance.now());onSelect(id);if(id)centerOnNode(id);else anchor=null;if(action==='open'&&!editable)onOpen(id);}else activation.reset();down=null;};
  renderer.domElement.addEventListener('pointerup',end);
  // A right-click (press and release without dragging) clears the selection and keeps the view where
  // it is. A right-drag still pans, and never deselects.
  let rightDown=null;
  renderer.domElement.addEventListener('pointerdown',e=>{rightDown=e.button===2?{x:e.clientX,y:e.clientY}:null;});
  renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==2||!rightDown)return;const still=Math.hypot(e.clientX-rightDown.x,e.clientY-rightDown.y)<5;rightDown=null;if(still&&selected&&!dragging){stopFlight(true);anchor=null;activation.reset();onSelect(null);}});
  renderer.domElement.addEventListener('pointercancel',()=>{activation.reset();if(dragging){const d=dragging;dragging=null;controls.enabled=true;onMove(d.id,d.position);}down=null;});
  // ids: frame only those skills (path mode); otherwise the whole map.
  function fit(front=false,ids=null) {
    stopFlight(false);anchor=null;
    const box=new THREE.Box3();for(const n of graph?.nodes||[])if(!ids||ids.has(n.id))box.expandByPoint(new THREE.Vector3(...place(n)));
    const center=box.isEmpty()?new THREE.Vector3(0,150,0):box.getCenter(new THREE.Vector3());const extent=box.isEmpty()?400:Math.max(box.getSize(new THREE.Vector3()).length(),300);
    const distance=extent/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.15/Math.min(camera.aspect||1,1);
    camera.position.copy(center).add(new THREE.Vector3(front?0:.18,front?0:.12,1).normalize().multiplyScalar(distance));controls.target.copy(center);controls.update();draw();
  }
  return {spacing(value){
    const next=spacingValue(value);if(next===spacing||dragging)return;stopFlight(true);
    const shift=new THREE.Vector3(...spacingCameraShift(controls.target.toArray(),spacing,next));
    spacing=next;camera.position.add(shift);controls.target.add(shift);
    updatePositions();controls.update();draw();
  },setGraph(value,id){graph=JSON.parse(JSON.stringify(value));selected=id;rebuild();},setEdit(value){editable=value;},highlight(value){subjects=new Set(value);refreshHalos();draw();},labels(value){labelsOn=value;draw();},selectedConnections(value){selectedConnectionsOnly=value;rebuild();},proficiency(value){proficiencyOn=value;rebuild();},filters(value){helixFilters={...value};rebuild();},isolate(codes){isolated=codes&&codes.size?new Set(codes):null;rebuild();},frontier(ids){frontierIds=new Set(ids);refreshFrontier();draw();},path(ids,now=true){const next=ids&&ids.size?new Set(ids):null;if(!next&&!pathIds)return;pathIds=next;if(now)rebuild();},grouping(value){lodEnabled=!!value;refreshClusters();draw();},keep(ids){const next=new Set(ids);if(next.size===keepIds.size&&[...next].every(id=>keepIds.has(id)))return;keepIds=next;applyLod();draw();},target(id){if(id===targetId)return;targetId=id;rebuild();},fly(id){const mesh=meshFor(id);if(mesh)approach(mesh.position,260*spacing,id);},pan(horizontal,vertical,seconds){
    stopFlight(true);camera.updateMatrixWorld();
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).toArray();
    const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).toArray();
    const view={navigation:navigation(),orbit:camera.position.distanceTo(controls.target),spacing:scale.spacing};
    const offset=new THREE.Vector3(...panOffset(right,up,horizontal,vertical,keyPanAmount(view,seconds)));
    camera.position.add(offset);controls.target.add(offset);controls.update();draw();
  },fit,focus(id){stopFlight(false);const n=graph.nodes.find(n=>n.id===id);if(!n)return;anchor=id;const next=new THREE.Vector3(...place(n)),offset=camera.position.clone().sub(controls.target);controls.target.copy(next);camera.position.copy(next).add(offset);controls.update();draw();}};
}
