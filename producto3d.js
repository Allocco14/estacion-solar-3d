// Render 3D del producto para la portada: caja de control (306 × 176 × 121 mm) y seguidor de 1 eje con el panel de 20 W.
// Modelo de presentación, no de ingeniería: las proporciones de la caja son las del diseño; las del panel y el soporte son indicativas.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const host = document.querySelector("[data-producto3d]");
if (host) iniciar(host);

function iniciar(host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    host.classList.add("sin3d");
    return;
  }
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 20);
  camera.position.set(1.02, 0.66, 1.4);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.04, 0.13, -0.01);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.95;
  controls.maxPolarAngle = 1.42;
  controls.autoRotate = !reducir;
  controls.autoRotateSpeed = -0.55;
  let reanudar;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(reanudar); });
  controls.addEventListener("end", () => { if (!reducir) reanudar = setTimeout(() => (controls.autoRotate = true), 5000); });

  // ── materiales ──
  const M = {
    shell: new THREE.MeshPhysicalMaterial({ color: 0x232a33, roughness: 0.42, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.28 }),
    face: new THREE.MeshStandardMaterial({ color: 0x151a20, roughness: 0.62, metalness: 0.0 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.0 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0a0c0f, roughness: 0.92 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xc3cad2, roughness: 0.28, metalness: 1.0 }),
    aluDark: new THREE.MeshStandardMaterial({ color: 0x8e979f, roughness: 0.35, metalness: 1.0 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0d1014, roughness: 0.5 }),
    port: new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.4 }),
    usbTongue: new THREE.MeshStandardMaterial({ color: 0x1b6fd8, roughness: 0.4, emissive: 0x0b4fa8, emissiveIntensity: 0.35 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.55 }),
  };

  const station = new THREE.Group();
  scene.add(station);
  const add = (geo, mat, x, y, z, parent = station) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const rbox = (w, h, d, r = 0.006, s = 3) => {
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r * 0.6, bevelEnabled: true, bevelSize: r * 0.6, bevelThickness: r * 0.6, bevelSegments: s, curveSegments: 6 });
    g.translate(0, 0, -(d - 2 * r * 0.6) / 2);
    return g;
  };

  // ── caja de control ──
  const W = 0.306, H = 0.121, D = 0.176;
  const caja = new THREE.Group();
  caja.position.set(-0.13, 0, 0.16);
  caja.rotation.y = 0.12;
  station.add(caja);
  const FY = 0.008 + H / 2; // centro vertical (patas de 8 mm)
  add(rbox(W, H, D, 0.012, 4), M.shell, 0, FY, 0, caja);
  [[-0.125, -0.065], [0.125, -0.065], [-0.125, 0.065], [0.125, 0.065]].forEach(([x, z]) =>
    add(new THREE.CylinderGeometry(0.009, 0.01, 0.008, 20), M.rubber, x, 0.004, z, caja));
  // franja ámbar inferior y cara frontal
  add(new THREE.BoxGeometry(W - 0.03, 0.006, 0.002), M.amber, 0, 0.022, D / 2 + 0.0005, caja);
  const zF = D / 2 + 0.001;
  add(rbox(W - 0.03, H - 0.034, 0.003, 0.006, 2), M.face, 0, FY + 0.006, zF, caja);

  // pantalla LCD (textura de lienzo)
  const lcd = lienzo(512, 224, (c, w, h, noche) => {
    c.fillStyle = noche ? "#0a1a26" : "#081520"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#5cc8ff"; c.font = "600 30px 'IBM Plex Mono', monospace"; c.fillText("SOLAR SAVER", 30, 52);
    c.fillStyle = noche ? "#f5b043" : "#5cc8ff"; c.font = "500 24px 'IBM Plex Mono', monospace";
    c.fillText(noche ? "● LUZ  ● USB" : "☀ CARGANDO", 300, 52);
    c.strokeStyle = "#5cc8ff"; c.lineWidth = 6; c.strokeRect(32, 90, 380, 100); c.fillStyle = "#5cc8ff"; c.fillRect(414, 120, 14, 40);
    const n = noche ? 2 : 3;
    for (let i = 0; i < 4; i++) { c.fillStyle = i < n ? "#f59e0b" : "#163042"; c.fillRect(46 + i * 91, 104, 80, 72); }
  });
  const lcdMat = new THREE.MeshStandardMaterial({ map: lcd.tex, emissive: 0xffffff, emissiveMap: lcd.tex, emissiveIntensity: 0.55, roughness: 0.25 });
  add(new THREE.BoxGeometry(0.094, 0.044, 0.004), M.black, -0.088, FY + 0.012, zF + 0.002, caja);
  add(new THREE.PlaneGeometry(0.084, 0.036), lcdMat, -0.088, FY + 0.012, zF + 0.0042, caja).castShadow = false;

  // 3 interruptores
  for (let i = 0; i < 3; i++) {
    const x = -0.118 + i * 0.03;
    add(rbox(0.018, 0.024, 0.006, 0.003, 2), M.black, x, FY - 0.03, zF + 0.003, caja);
    const lev = add(rbox(0.008, 0.012, 0.008, 0.002, 2), i < 2 ? M.amber : M.aluDark, x, FY - 0.026, zF + 0.008, caja);
    lev.rotation.x = -0.35;
  }

  // bocina (rejilla perforada)
  const rej = lienzo(256, 256, (c, w) => {
    c.fillStyle = "#151a20"; c.fillRect(0, 0, w, w); c.fillStyle = "#020304";
    for (let y = 14; y < w; y += 20) for (let x = 14 + ((y / 20) % 2) * 10; x < w; x += 20)
      if ((x - 128) ** 2 + (y - 128) ** 2 < 112 ** 2) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
  });
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.003, 48).rotateX(Math.PI / 2), M.aluDark, 0.03, FY + 0.004, zF + 0.002, caja);
  add(new THREE.CircleGeometry(0.0275, 48), new THREE.MeshStandardMaterial({ map: rej.tex, roughness: 0.7 }), 0.03, FY + 0.004, zF + 0.0037, caja).castShadow = false;

  // 2 puertos USB
  for (let i = 0; i < 2; i++) {
    const y = FY + 0.018 - i * 0.026;
    add(rbox(0.026, 0.012, 0.004, 0.002, 2), M.aluDark, 0.105, y, zF + 0.002, caja);
    add(new THREE.BoxGeometry(0.02, 0.0065, 0.002), M.port, 0.105, y, zF + 0.0035, caja);
    add(new THREE.BoxGeometry(0.014, 0.0022, 0.001), M.usbTongue, 0.105, y + 0.0008, zF + 0.0042, caja);
  }
  add(new THREE.BoxGeometry(0.03, 0.0025, 0.001), M.amber, 0.105, FY - 0.03, zF + 0.002, caja);

  // rejillas de ventilación laterales
  for (let i = 0; i < 5; i++) add(rbox(0.004, 0.05, 0.002, 0.0015, 1), M.black, -W / 2 - 0.0005, FY, -0.04 + i * 0.02, caja).rotation.y = Math.PI / 2;

  // asa superior plegable
  [-0.07, 0.07].forEach((x) => add(rbox(0.018, 0.016, 0.026, 0.004, 2), M.black, x, 0.008 + H + 0.008, 0, caja));
  add(new THREE.CylinderGeometry(0.0065, 0.0065, 0.14, 24).rotateZ(Math.PI / 2), M.alu, 0, 0.008 + H + 0.015, 0, caja);

  // lámpara LED lateral
  const lamp = new THREE.Group();
  lamp.position.set(W / 2 + 0.002, FY + 0.02, 0.02);
  caja.add(lamp);
  add(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 16), M.black, 0.004, 0.035, 0, lamp);
  const head = new THREE.Group(); head.position.set(0.004, 0.072, 0); head.rotation.set(2.0, 0, -0.5); lamp.add(head);
  add(new THREE.CylinderGeometry(0.02, 0.014, 0.03, 32), M.shell, 0, 0.012, 0, head);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xfff3dc, emissive: 0xffc070, emissiveIntensity: 0.0, roughness: 0.2 });
  add(new THREE.CylinderGeometry(0.0175, 0.0175, 0.002, 32), ledMat, 0, 0.028, 0, head).castShadow = false;
  const luz = new THREE.SpotLight(0xffb25e, 0, 3, 0.8, 0.7, 1.2);
  const halo = new THREE.PointLight(0xffa850, 0, 0.9, 1.5); halo.position.set(W / 2 + 0.05, FY + 0.12, 0.06); caja.add(halo);
  luz.position.set(0, 0.03, 0); head.add(luz);
  const objetivo = new THREE.Object3D(); objetivo.position.set(0, 0.5, 0); head.add(objetivo); luz.target = objetivo;
  luz.castShadow = true; luz.shadow.mapSize.set(1024, 1024); luz.shadow.bias = -0.0005;

  // ── seguidor de 1 eje con el panel ──
  const seg = new THREE.Group();
  seg.position.set(0.22, 0, -0.16);
  seg.rotation.y = -0.62;
  station.add(seg);
  [0, Math.PI / 2].forEach((r) => add(rbox(0.3, 0.012, 0.03, 0.004, 2), M.aluDark, 0, 0.006, 0, seg).rotation.y = r);
  add(new THREE.CylinderGeometry(0.03, 0.034, 0.012, 32), M.black, 0, 0.018, 0, seg);
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.25, 24), M.alu, 0, 0.145, 0, seg);
  const yugo = new THREE.Group(); yugo.position.y = 0.285; seg.add(yugo);
  add(rbox(0.05, 0.02, 0.2, 0.004, 2), M.black, 0, -0.012, 0, yugo);
  add(rbox(0.044, 0.04, 0.03, 0.005, 2), M.black, 0, 0.0, 0.118, yugo); // servo
  add(new THREE.BoxGeometry(0.006, 0.004, 0.028), M.amber, 0.023, 0.006, 0.118, yugo);
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 16).rotateX(Math.PI / 2), M.alu, 0, 0.012, 0, yugo); // eje
  const panel = new THREE.Group(); panel.position.y = 0.022; yugo.add(panel);
  const PW = 0.46, PD = 0.36;
  add(rbox(PW, 0.022, PD, 0.004, 2), M.alu, 0, 0, 0, panel);
  const celdas = lienzo(1024, 800, (c, w, h) => {
    c.fillStyle = "#c9d1d9"; c.fillRect(0, 0, w, h);
    const cols = 6, rows = 4, g = 10, cw = (w - g * (cols + 1)) / cols, ch = (h - g * (rows + 1)) / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = g + i * (cw + g), y = g + j * (ch + g);
      const gr = c.createLinearGradient(x, y, x + cw, y + ch); gr.addColorStop(0, "#14223a"); gr.addColorStop(1, "#0a1220");
      c.fillStyle = gr; c.fillRect(x, y, cw, ch);
      c.fillStyle = "rgba(190,205,220,.55)"; for (let k = 1; k < 4; k++) c.fillRect(x + (cw * k) / 4 - 1.5, y, 3, ch);
      c.fillStyle = "rgba(190,205,220,.14)"; for (let k = 1; k < 12; k++) c.fillRect(x, y + (ch * k) / 12, cw, 1);
    }
  });
  const vidrio = new THREE.MeshPhysicalMaterial({ map: celdas.tex, roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
  add(new THREE.PlaneGeometry(PW - 0.02, PD - 0.02).rotateX(-Math.PI / 2), vidrio, 0, 0.0148, 0, panel).castShadow = false;
  [-1, 1].forEach((s) => add(rbox(0.014, 0.01, 0.014, 0.003, 1), M.amber, s * (PW / 2 - 0.006), 0.017, -PD / 2 + 0.01, panel)); // LDR este y oeste

  // cable de la caja al seguidor
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.13 + 0.12, 0.03, 0.16 - 0.09), new THREE.Vector3(0.03, 0.006, 0.0),
    new THREE.Vector3(0.15, 0.006, -0.1), new THREE.Vector3(0.21, 0.02, -0.15), new THREE.Vector3(0.214, 0.1, -0.158),
  ]);
  add(new THREE.TubeGeometry(curva, 60, 0.0035, 10), M.cable, 0, 0, 0);

  // ── suelo y luces ──
  const fade = lienzo(256, 256, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, "#fff"); g.addColorStop(0.35, "#999"); g.addColorStop(0.8, "#111"); g.addColorStop(1, "#000"); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  fade.tex.colorSpace = THREE.NoColorSpace;
  const pisoMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.9, metalness: 0, alphaMap: fade.tex, transparent: true, opacity: 0, depthWrite: false });
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(0.95, 64).rotateX(-Math.PI / 2), pisoMat);
  suelo.position.set(0.15, 0, 0.25);
  const sombraMat = new THREE.ShadowMaterial({ opacity: 0.32, depthWrite: false });
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2), sombraMat);
  sombra.position.y = 0.0005; sombra.receiveShadow = true; scene.add(sombra);
  suelo.receiveShadow = true; suelo.renderOrder = -1; scene.add(suelo);
  const sol = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sol.position.set(1.4, 2.2, 1.0); sol.castShadow = true;
  Object.assign(sol.shadow.camera, { left: -0.8, right: 0.8, top: 0.8, bottom: -0.8, near: 0.5, far: 6 });
  sol.shadow.mapSize.set(2048, 2048); sol.shadow.radius = 5; sol.shadow.bias = -0.0003; sol.shadow.normalBias = 0.01;
  scene.add(sol);
  const luna = new THREE.DirectionalLight(0x7aa6ff, 0); luna.position.set(-1.2, 1.6, 0.6); scene.add(luna);
  const relleno = new THREE.HemisphereLight(0xdfe9ff, 0x2a2118, 0.35); scene.add(relleno);

  // centrar la composición
  station.position.x = -0.03;

  // ── día / noche ──
  let noche = 0, nocheObjetivo = 0;
  const botones = document.querySelectorAll("[data-modo]");
  botones.forEach((b) => b.addEventListener("click", () => {
    nocheObjetivo = b.dataset.modo === "noche" ? 1 : 0;
    botones.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
    document.documentElement.classList.toggle("es-noche", nocheObjetivo === 1);
    lcd.dibujar(nocheObjetivo === 1);
    activo = true; pedirCuadro();
  }));

  // ── tamaño, visibilidad y bucle ──
  function ajustar() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 34 : 28;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(() => { ajustar(); pedirCuadro(); }).observe(host);
  ajustar();

  let visible = true, activo = true, pendiente = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedirCuadro(); }).observe(host);
  document.addEventListener("visibilitychange", pedirCuadro);
  function pedirCuadro() { if (!pendiente && visible && !document.hidden) { pendiente = true; requestAnimationFrame(cuadro); } }

  const reloj = new THREE.Clock();
  let t = 0;
  panel.rotation.z = -0.42;
  function cuadro() {
    pendiente = false;
    const dt = Math.min(reloj.getDelta(), 0.05);
    if (!reducir) t += dt;
    noche += (nocheObjetivo - noche) * Math.min(1, dt * 3);
    // de noche el panel queda mirando al este, listo para el amanecer
    const ang = (1 - noche) * (-0.42 + Math.sin(t * 0.35) * 0.25) + noche * -0.12;
    panel.rotation.z += (ang - panel.rotation.z) * Math.min(1, dt * 4);
    sol.intensity = 2.6 * (1 - noche);
    luna.intensity = 0.55 * noche;
    relleno.intensity = 0.35 - 0.25 * noche;
    scene.environmentIntensity = 0.9 - 0.75 * noche;
    luz.intensity = 14 * noche;
    pisoMat.opacity = noche;
    sombraMat.opacity = 0.32 * (1 - noche);
    halo.intensity = 0.5 * noche;
    ledMat.emissiveIntensity = 3.0 * noche;
    lcdMat.emissiveIntensity = 0.55 + 0.6 * noche;
    controls.update();
    renderer.render(scene, camera);
    host.classList.add("listo");
    const enMovimiento = !reducir || Math.abs(nocheObjetivo - noche) > 0.002 || controls.autoRotate;
    if (enMovimiento || activo) { activo = Math.abs(nocheObjetivo - noche) > 0.002; pedirCuadro(); }
  }
  controls.addEventListener("change", pedirCuadro);
  pedirCuadro();
  if (new URLSearchParams(location.search).get("modo") === "noche") { document.querySelector('[data-modo="noche"]')?.click(); noche = 1; panel.rotation.z = -0.12; }
}

function lienzo(w, h, pintar) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const c = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const dibujar = (noche = false) => { pintar(c, w, h, noche); tex.needsUpdate = true; };
  dibujar(false);
  if (document.fonts) document.fonts.ready.then(() => dibujar(document.documentElement.classList.contains("es-noche")));
  return { tex, dibujar };
}
