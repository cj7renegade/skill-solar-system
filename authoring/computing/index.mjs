// Computing foundation edition: authored skills, relationships, the coverage checklist, and the
// coverage-reference register. The references record which public curricula and official
// documentation were used to check coverage and accuracy; they are kept apart from the authored
// descriptions and relationship rationales, and no source text was copied. Prerequisites are
// editorial judgments at each skill's stated scope, not an official curriculum graph.
import * as programming from './programming.mjs';
import * as development from './development.mjs';
import * as algorithms from './algorithms.mjs';
import * as architecture from './architecture.mjs';
import * as systems from './systems.mjs';
import * as networking from './networking.mjs';
import * as embedded from './embedded.mjs';
import * as roboticsSoftware from './robotics-software.mjs';
import * as machineLearning from './machine-learning.mjs';

export const MODULES = [programming, development, algorithms, architecture, systems, networking, embedded, roboticsSoftware, machineLearning];
export const EDITION = { id: 'computing-foundations-2026-09-11', version: '1.0', created: '2026-09-11' };

// Checked 2026-09-11. "urls" lists the pages consulted for headings; titles and URLs were verified.
export const REFERENCES = {
  CS2023: { title: 'CS2023: ACM/IEEE-CS/AAAI Computer Science Curricula', publisher: 'ACM, IEEE Computer Society, AAAI', urls: ['https://csed.acm.org/', 'https://dl.acm.org/doi/book/10.1145/3664191'], scope: 'Knowledge areas SDF, AL, AR, OS, NC, PDC, SE, SPD, AI used as a coverage checklist.' },
  CSTA: { title: 'CSTA PK–12 Computer Science Standards (2026)', publisher: 'Computer Science Teachers Association', urls: ['https://csteachers.org/pk12standards/'], scope: 'Introductory programming, data, and systems concepts.' },
  PYTUT: { title: 'The Python Tutorial', publisher: 'Python Software Foundation', urls: ['https://docs.python.org/3/tutorial/'], scope: 'Control flow, data structures, modules, input and output, errors and exceptions, classes, virtual environments, floating-point arithmetic.' },
  PYUNITTEST: { title: 'unittest — Unit testing framework; doctest — Test interactive Python examples', publisher: 'Python Software Foundation', urls: ['https://docs.python.org/3/library/unittest.html', 'https://docs.python.org/3/library/doctest.html'], scope: 'Test cases, discovery, fixtures, and example-based tests.' },
  PEP257: { title: 'PEP 257 – Docstring Conventions', publisher: 'Python Software Foundation', urls: ['https://peps.python.org/pep-0257/'], scope: 'One-line and multi-line docstrings.' },
  NUMPY: { title: 'NumPy: the absolute basics for beginners', publisher: 'NumPy project', urls: ['https://numpy.org/doc/stable/user/absolute_beginners.html'], scope: 'Arrays, shape, indexing and slicing, basic operations, broadcasting.' },
  OPENSSH: { title: 'SSH(1): OpenSSH remote login client', publisher: 'OpenBSD / OpenSSH', urls: ['https://man.openbsd.org/ssh'], scope: 'Remote login, public-key authentication, host-key verification.' },
  SYSTEMD: { title: 'systemd.service(5): Service unit configuration', publisher: 'systemd project (Linux man-pages mirror)', urls: ['https://man7.org/linux/man-pages/man5/systemd.service.5.html'], scope: 'Service units, restart policy, and execution options.' },
  MISSING: { title: 'The Missing Semester of Your CS Education', publisher: 'MIT CSAIL', urls: ['https://missing.csail.mit.edu/'], scope: 'Shell, command-line environment, debugging and profiling, version control, packaging, code quality.' },
  PROGIT: { title: 'Pro Git, 2nd edition', publisher: 'Apress (CC BY-NC-SA 3.0), hosted by git-scm.com', urls: ['https://git-scm.com/book/en/v2'], scope: 'Git basics, branching, distributed Git.' },
  MIT6006: { title: 'Introduction to Algorithms (6.006), Spring 2020', publisher: 'MIT OpenCourseWare', urls: ['https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/'], scope: 'Data structures, sorting, hashing, binary trees, heaps, graph search, complexity.' },
  MIT6004: { title: 'Computation Structures (6.004), Spring 2017', publisher: 'MIT OpenCourseWare', urls: ['https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/'], scope: 'Information representation, finite-state machines, instruction sets, assembly, caches, pipelining, virtual memory, devices and interrupts.' },
  OSTEP: { title: 'Operating Systems: Three Easy Pieces, v1.10', publisher: 'Arpaci-Dusseau Books', urls: ['https://pages.cs.wisc.edu/~remzi/OSTEP/'], scope: 'Processes, scheduling, address spaces, memory API, threads, locks, condition variables, concurrency bugs, I/O devices.' },
  WG14C: { title: 'ISO/IEC 9899:2024 working draft N3220', publisher: 'ISO/IEC JTC1/SC22/WG14', urls: ['https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf'], scope: 'Types, address and indirection operators, additive operators on pointers, memory management functions.' },
  RFC791: { title: 'RFC 791: Internet Protocol', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc791'], scope: 'IPv4 addressing and header format.' },
  RFC4632: { title: 'RFC 4632: Classless Inter-domain Routing (CIDR)', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc4632'], scope: 'Prefix-length notation.' },
  RFC768: { title: 'RFC 768: User Datagram Protocol', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc768'], scope: 'UDP datagrams without delivery guarantees.' },
  RFC8085: { title: 'RFC 8085: UDP Usage Guidelines', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc8085'], scope: 'Loss, reordering, and duplication with UDP.' },
  RFC9293: { title: 'RFC 9293: Transmission Control Protocol (TCP)', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc9293'], scope: 'Reliable, in-order byte stream; sequence numbers, acknowledgements, retransmission.' },
  RFC3629: { title: 'RFC 3629: UTF-8, a transformation format of ISO 10646', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc3629'], scope: 'One to four octets per character.' },
  RFC7679: { title: 'RFC 7679: A One-Way Delay Metric for IP Performance Metrics', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc7679'], scope: 'Definition and statistics of one-way delay; clock issues.' },
  RFC3393: { title: 'RFC 3393: IP Packet Delay Variation Metric', publisher: 'IETF / RFC Editor', urls: ['https://www.rfc-editor.org/rfc/rfc3393'], scope: 'Delay variation (jitter).' },
  MAN7: { title: 'socket(7) and tcp(7), Linux manual pages', publisher: 'Linux man-pages project', urls: ['https://man7.org/linux/man-pages/man7/socket.7.html', 'https://man7.org/linux/man-pages/man7/tcp.7.html'], scope: 'Socket interface; TCP does not preserve record boundaries.' },
  RP2040DS: { title: 'RP2040 Datasheet', publisher: 'Raspberry Pi Ltd', urls: ['https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf'], scope: 'GPIO, PWM, timer, and watchdog peripherals of one microcontroller, as a concrete example.' },
  PICOSDK: { title: 'Raspberry Pi Pico-series C/C++ SDK', publisher: 'Raspberry Pi Ltd', urls: ['https://datasheets.raspberrypi.com/pico/raspberry-pi-pico-c-sdk.pdf'], scope: 'Build system, hardware_gpio, hardware_pwm, hardware_timer APIs.' },
  ZEPHYR: { title: 'Zephyr Project Documentation: GPIO, PWM, Counter; Building, Flashing and Debugging', publisher: 'Zephyr Project (Linux Foundation)', urls: ['https://docs.zephyrproject.org/latest/hardware/peripherals/gpio.html', 'https://docs.zephyrproject.org/latest/hardware/peripherals/pwm.html', 'https://docs.zephyrproject.org/latest/develop/west/build-flash-debug.html'], scope: 'Portable peripheral APIs, open-drain configuration, build and flash workflow.' },
  CMSIS: { title: 'CMSIS-Core (Cortex-M)', publisher: 'Arm', urls: ['https://arm-software.github.io/CMSIS_6/latest/Core/index.html'], scope: 'Startup, SysTick, and NVIC access on Cortex-M.' },
  ARMCM: { title: 'Cortex-M3 Technical Reference Manual: Exception priority levels', publisher: 'Arm', urls: ['https://developer.arm.com/documentation/ddi0337/e/Exceptions/Exception-priority/Priority-levels'], scope: 'Configurable priorities where a lower number is more urgent; fixed-priority exceptions.' },
  NXPI2C: { title: 'UM10204: I2C-bus specification and user manual', publisher: 'NXP Semiconductors', urls: ['https://www.nxp.com/docs/en/user-guide/UM10204.pdf'], scope: 'Open-drain bus with pull-ups, addressing, acknowledge.' },
  ADISPI: { title: 'Introduction to SPI Interface (Analog Dialogue)', publisher: 'Analog Devices', urls: ['https://www.analog.com/en/resources/analog-dialogue/articles/introduction-to-spi-interface.html'], scope: 'Clock modes and per-device chip select.' },
  ADIUART: { title: 'UART: A Hardware Communication Protocol (Analog Dialogue)', publisher: 'Analog Devices', urls: ['https://www.analog.com/en/resources/analog-dialogue/articles/uart-a-hardware-communication-protocol.html'], scope: 'Asynchronous framing with start and stop bits.' },
  FREERTOS: { title: 'FreeRTOS kernel documentation: queues, mutexes and semaphores', publisher: 'FreeRTOS (Amazon Web Services)', urls: ['https://freertos.org/Documentation/02-Kernel/02-Kernel-features/02-Queues-mutexes-and-semaphores/04-Mutexes'], scope: 'Tasks, queues, mutexes with priority inheritance, binary semaphores.' },
  LL73: { title: 'Liu and Layland, Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment, JACM 20(1), 1973', publisher: 'ACM', urls: ['https://doi.org/10.1145/321738.321743'], scope: 'Rate-monotonic priority assignment and utilization bound.' },
  ROS2: { title: 'ROS 2 Documentation (Jazzy): Basic Concepts, Quality of Service settings, tf2, Launch', publisher: 'Open Robotics / ROS 2 project', urls: ['https://docs.ros.org/en/jazzy/Concepts/Basic.html', 'https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html', 'https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Tf2.html'], scope: 'Nodes, topics, services, actions, parameters, executors, QoS, tf2, ros2 bag, launch.' },
  ROS2CTRL: { title: 'ros2_control documentation: Getting Started; Controller Manager', publisher: 'ros2_control project', urls: ['https://control.ros.org/rolling/doc/getting_started/getting_started.html', 'https://control.ros.org/rolling/doc/ros2_control/controller_manager/doc/userdoc.html'], scope: 'Read, update, and write cycle at a configured update rate.' },
  ROS2LIFECYCLE: { title: 'Managed nodes (ROS 2 design article)', publisher: 'Open Robotics', urls: ['https://design.ros2.org/articles/node_lifecycle.html'], scope: 'Lifecycle states and transitions as a standard state machine.' },
  BTCPP: { title: 'BehaviorTree.CPP: Introduction to BTs', publisher: 'BehaviorTree.CPP project', urls: ['https://www.behaviortree.dev/docs/learn-the-basics/BT_basics/'], scope: 'Behaviour trees as an alternative to large state machines.' },
  GAZEBO: { title: 'Gazebo documentation: SDF worlds; Use ROS 2 to interact with Gazebo', publisher: 'Open Robotics / Gazebo', urls: ['https://gazebosim.org/docs/latest/sdf_worlds/', 'https://gazebosim.org/docs/latest/ros2_integration/'], scope: 'Physics step size, real-time factor, ROS 2 bridge.' },
  REP103: { title: 'REP 103: Standard Units of Measure and Coordinate Conventions', publisher: 'ROS.org', urls: ['https://www.ros.org/reps/rep-0103.html'], scope: 'SI units, right-handed frames, axis orientation, rotation representation.' },
  REP105: { title: 'REP 105: Coordinate Frames for Mobile Platforms', publisher: 'ROS.org', urls: ['https://www.ros.org/reps/rep-0105.html'], scope: 'map, odom, and base_link frames and their relationships.' },
  FBS: { title: 'Feedback Systems: An Introduction for Scientists and Engineers (Åström and Murray), chapter 10 PID Control', publisher: 'Princeton University Press (free electronic edition)', urls: ['https://fbswiki.org/wiki/index.php/Feedback_Systems:_An_Introduction_for_Scientists_and_Engineers'], scope: 'Integrator windup and computer implementation of PID.' },
  MLCC: { title: 'Machine Learning Crash Course', publisher: 'Google for Developers', urls: ['https://developers.google.com/machine-learning/crash-course'], scope: 'Linear and logistic regression, classification, data, generalization and overfitting, neural networks, production systems.' },
  SKLEARN: { title: 'scikit-learn User Guide: Cross-validation; Metrics and scoring', publisher: 'scikit-learn developers', urls: ['https://scikit-learn.org/stable/modules/cross_validation.html', 'https://scikit-learn.org/stable/modules/model_evaluation.html'], scope: 'Held-out evaluation, cross-validation, classification and regression metrics.' },
  LITERT: { title: 'LiteRT for Microcontrollers', publisher: 'Google AI Edge', urls: ['https://developers.google.com/edge/litert/microcontrollers/overview'], scope: 'On-device inference under tight memory, without an operating system or dynamic allocation.' }
};

// The user's required coverage areas, each item mapped to the skills that cover it. Items may be
// covered by reused skills from other domains; those keep their domain.
export const CHECKLIST = {
  'Programming foundations': { values: ['c-values-types'], types: ['c-values-types', 'c-type-conversion', 'c-static-types'], variables: ['c-variables'], expressions: ['c-expressions'], conditions: ['c-conditions'], loops: ['c-loops'], functions: ['c-functions'], scope: ['c-scope'], collections: ['c-collections', 'c-references'], 'error handling': ['c-errors'] },
  'Practical development': { files: ['c-files'], 'terminal navigation': ['c-terminal', 'c-shell-pipes'], dependencies: ['c-dependencies', 'c-modules'], debugging: ['c-debugging', 'c-debugger'], testing: ['c-testing'], Git: ['c-git-commits', 'c-git-branches', 'c-git-remotes'], documentation: ['c-documentation'] },
  'Data structures and algorithms': { arrays: ['c-arrays', 'c-numeric-arrays'], 'linked structures': ['c-linked-lists'], stacks: ['c-stacks'], queues: ['c-queues'], 'hash tables': ['c-hash-tables'], trees: ['c-trees', 'c-heaps'], graphs: ['c-graph-code', 'm-graph', 'm-search'], searching: ['c-searching'], sorting: ['c-sorting'], recursion: ['c-recursion'], complexity: ['m-complexity', 'c-code-cost'] },
  'Computer architecture': { 'data representation': ['m-binary', 'c-integers', 'c-floats', 'c-text-encoding', 'c-bitwise', 'c-byte-order'], instructions: ['c-instructions'], processors: ['c-processor'], registers: ['c-registers'], memory: ['c-memory'], caches: ['c-caches'], 'input/output': ['c-io'] },
  'Systems programming': { pointers: ['c-pointers'], 'memory allocation': ['c-allocation', 'c-memory-layout'], processes: ['c-processes'], threads: ['c-threads'], synchronization: ['c-synchronization', 'c-deadlock'], 'OS foundations': ['c-kernel', 'c-virtual-memory', 'c-os-scheduling'], concurrency: ['c-race-conditions', 'c-event-loops'] },
  Networking: { addressing: ['c-ip-addressing'], packets: ['c-packets'], protocols: ['c-transport', 'c-framing'], sockets: ['c-sockets'], latency: ['c-latency'], 'reliable communication': ['c-reliable-delivery', 'c-checksums'] },
  'Embedded and real-time computing': { microcontrollers: ['c-microcontrollers'], firmware: ['c-firmware', 'c-watchdog'], GPIO: ['c-gpio'], interrupts: ['c-interrupts'], timers: ['c-timers'], 'serial interfaces': ['c-serial-drivers', 'e-bus'], scheduling: ['c-rt-scheduling', 'c-rtos'], 'timing constraints': ['c-timing-constraints'] },
  'Robotics software': { 'sensor acquisition': ['c-sensor-acquisition'], 'coordinate transforms in software': ['c-transforms'], messaging: ['c-messaging'], 'state machines': ['c-state-machines'], 'control-loop implementation': ['c-control-loop'], simulation: ['c-simulation', 'c-replay-testing'], logging: ['c-logging'], integration: ['c-integration'] },
  'AI/ML foundations for robotics': { datasets: ['c-datasets', 'c-features'], 'training vs inference': ['c-train-inference'], regression: ['c-ml-regression', 'm-regression'], classification: ['c-classification'], evaluation: ['c-evaluation'], overfitting: ['c-overfitting'], 'neural-network basics': ['c-neural-networks', 'c-gradient-descent'], 'deployment constraints': ['c-model-deployment'] }
};
// Authored skills that support the checklist without being named in it.
export const BEYOND_CHECKLIST = ['c-strings', 'c-objects', 'c-build', 'c-c-language', 'c-linux-admin', 'c-fixed-point', 'c-time-sync'];

const LINKS = [['after', 'prerequisite', false], ['helpedBy', 'supports', false], ['helps', 'supports', true], ['related', 'related', true]];
// Nodes and edges in map form. An edge's rationale is the text authored next to the link.
export function edition() {
  const nodes = [], edges = [];
  for (const module of MODULES) for (const n of module.nodes) {
    nodes.push({ id: n.id, name: n.name, domain: 'Computing', subdomain: module.subdomain, description: n.summary, details: n.details, icon: n.icon, refs: n.refs });
    for (const [field, type, outgoing] of LINKS) for (const [other, rationale] of Object.entries(n[field] || {}))
      edges.push({ source: outgoing ? n.id : other, target: outgoing ? other : n.id, type, authorship: 'editorial', rationale });
  }
  return { nodes, edges };
}
