// An illustrative macro map, not a validated curriculum. Broad links are supports.
export const starter = {
  schemaVersion: 1,
  title: 'Skill Solar System',
  nodes: [
    ['arithmetic','Arithmetic','Mathematics',-230,0,0,'Number operations and numerical reasoning.'],
    ['algebra','Algebra','Mathematics',-250,95,0,'Expressions, equations, functions, and relationships.'],
    ['geometry','Geometry & trigonometry','Mathematics',-110,85,75,'Shape, distance, angles, and spatial relationships.'],
    ['calculus','Calculus','Mathematics',-240,205,-20,'Rates of change and accumulation.'],
    ['linear','Linear algebra','Mathematics',-100,200,85,'Vectors, matrices, and transformations.'],
    ['measurement','Measurement & units','Physics',-60,0,-100,'Quantities, units, uncertainty, and dimensional reasoning.'],
    ['physics','Classical mechanics','Physics',-75,120,-115,'Forces, motion, energy, and momentum.'],
    ['design','Mechanical design','Mechanics',135,125,-80,'Shape and assemble mechanisms under physical constraints.'],
    ['materials','Materials & fabrication','Mechanics',145,15,-80,'Material behavior and processes for making physical parts.'],
    ['circuits','Basic circuits','Electronics',185,30,70,'Voltage, current, resistance, and simple networks.'],
    ['electronics','Electronics & sensors','Electronics',220,160,90,'Signal circuits, instrumentation, and sensing.'],
    ['logic','Logic & programming','Computing',35,0,180,'Logical reasoning and describing computational procedures.'],
    ['embedded','Embedded systems','Computing',90,210,170,'Computing integrated with sensors, actuators, and timing constraints.'],
    ['control','Feedback control','Robotics',-60,325,75,'Use measured system behavior to adjust commands.'],
    ['kinematics','Robot kinematics','Robotics',-170,320,-85,'Relationships between joints, coordinate frames, and motion.'],
    ['actuation','Actuation & mechanisms','Mechanics',170,290,-50,'Create and transmit controlled physical motion.'],
    ['perception','Perception & estimation','Computing',130,330,135,'Infer useful information and system state from measurements.'],
    ['integration','Robot integration','Robotics',0,455,0,'Combine mechanical, electrical, and computational subsystems.' ]
  ].map(([id,name,domain,x,y,z,description]) => ({id,name,domain,position:[x,y,z],description,pinned:false})),
  edges: [
    ['arithmetic','algebra','prerequisite'], ['algebra','calculus','prerequisite'], ['algebra','linear','prerequisite'],
    ['arithmetic','geometry','supports'], ['measurement','physics','supports'], ['geometry','physics','supports'],
    ['physics','design','supports'], ['materials','design','supports'], ['measurement','circuits','supports'],
    ['circuits','electronics','supports'], ['logic','embedded','supports'], ['electronics','embedded','supports'],
    ['calculus','control','supports'], ['embedded','control','supports'], ['physics','control','supports'],
    ['linear','kinematics','supports'], ['geometry','kinematics','supports'], ['design','actuation','supports'],
    ['electronics','actuation','supports'], ['linear','perception','supports'], ['embedded','perception','supports'],
    ['control','integration','supports'], ['kinematics','integration','supports'], ['actuation','integration','supports'],
    ['perception','integration','supports'], ['control','actuation','related']
  ].map(([source,target,type]) => ({source,target,type}))
};
