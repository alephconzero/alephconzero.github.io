(() => {
  "use strict";

  const canvas = document.getElementById("pendulum-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const controls = {
    
    angle1Range: document.getElementById("angle1-range"),
    angle1Number: document.getElementById("angle1-number"),
    angle2Range: document.getElementById("angle2-range"),
    angle2Number: document.getElementById("angle2-number"),
    perturbationRange: document.getElementById("perturbation-range"),
    perturbationNumber: document.getElementById("perturbation-number"),
    compare: document.getElementById("compare-toggle"),
    trails: document.getElementById("trails-toggle"),
    speed: document.getElementById("speed-range"),
    speedOutput: document.getElementById("speed-output"),
    perturbationControl: document.getElementById("perturbation-control")
  };

  const startPauseButton = document.getElementById("start-pause");
  const resetButton = document.getElementById("reset");
  const clearTrailsButton = document.getElementById("clear-trails");
  const timeOutput = document.getElementById("simulation-time");
  const divergenceOutput = document.getElementById("divergence");
  const divergenceWrap = document.getElementById("divergence-wrap");
  const legendB = document.getElementById("legend-b");
  const canvasMessage = document.getElementById("canvas-message");
  const presetButtons = document.querySelectorAll(".preset-button");
  const frameElement = canvas.closest(".canvas-frame");

  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;
  const GRAVITY = 9.81;
  const MASS_1 = 1;
  const MASS_2 = 1;
  const LENGTH_1 = 1;
  const LENGTH_2 = 1;
  const INTEGRATION_STEP = 1 / 240;
  const MAX_TRAIL_POINTS = 1100;
  const READOUT_INTERVAL_MS = 120;
  const DIVERGENCE_SMOOTHING = 0.24;

  let stateA;
  let stateB;
  let trailA = [];
  let trailB = [];
  let simulationTime = 0;
  let running = false;
  let lastTimestamp = null;
  let accumulator = 0;
  let animationFrameId = null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let lastReadoutTimestamp = 0;
  let displayedDivergence = 0;

  const css = getComputedStyle(document.documentElement);
  const palette = {
    background: css.getPropertyValue("--bg-paper").trim() || "#fcfaf6",
    grid: "rgba(72, 96, 106, 0.10)",
    pivot: css.getPropertyValue("--text-main").trim() || "#2b2b2b",
    a: css.getPropertyValue("--lab-a").trim() || "#48606a",
    b: css.getPropertyValue("--lab-b").trim() || "#a66b43",
    rod: css.getPropertyValue("--text-soft").trim() || "#5d5d5d"
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatNumber(value, digits) {
    return new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  function numberValue(element, fallback) {
    const value = Number.parseFloat(element.value);
    return Number.isFinite(value) ? value : fallback;
  }

   function getParameters() {
  return {
    length1: LENGTH_1,
    length2: LENGTH_2,
    angle1: numberValue(controls.angle1Number, 120) * DEG_TO_RAD,
    angle2: numberValue(controls.angle2Number, -10) * DEG_TO_RAD,
    perturbation: numberValue(controls.perturbationNumber, 0.05) * DEG_TO_RAD,
    compare: controls.compare.checked,
    speed: numberValue(controls.speed, 1)
  };
}

  function createInitialState(theta1, theta2) {
    return {
      theta1,
      theta2,
      omega1: 0,
      omega2: 0
    };
  }

  function derivatives(state, length1, length2) {
    const { theta1, theta2, omega1, omega2 } = state;
    const delta = theta1 - theta2;
    const denominatorCommon = 2 * MASS_1 + MASS_2 - MASS_2 * Math.cos(2 * delta);

    const alpha1Numerator =
      -GRAVITY * (2 * MASS_1 + MASS_2) * Math.sin(theta1)
      - MASS_2 * GRAVITY * Math.sin(theta1 - 2 * theta2)
      - 2 * Math.sin(delta) * MASS_2
        * (omega2 * omega2 * length2 + omega1 * omega1 * length1 * Math.cos(delta));

    const alpha2Numerator =
      2 * Math.sin(delta)
      * (
        omega1 * omega1 * length1 * (MASS_1 + MASS_2)
        + GRAVITY * (MASS_1 + MASS_2) * Math.cos(theta1)
        + omega2 * omega2 * length2 * MASS_2 * Math.cos(delta)
      );

    return {
      theta1: omega1,
      theta2: omega2,
      omega1: alpha1Numerator / (length1 * denominatorCommon),
      omega2: alpha2Numerator / (length2 * denominatorCommon)
    };
  }

  function addScaled(state, derivative, scale) {
    return {
      theta1: state.theta1 + derivative.theta1 * scale,
      theta2: state.theta2 + derivative.theta2 * scale,
      omega1: state.omega1 + derivative.omega1 * scale,
      omega2: state.omega2 + derivative.omega2 * scale
    };
  }

  function rk4Step(state, dt, length1, length2) {
    const k1 = derivatives(state, length1, length2);
    const k2 = derivatives(addScaled(state, k1, dt / 2), length1, length2);
    const k3 = derivatives(addScaled(state, k2, dt / 2), length1, length2);
    const k4 = derivatives(addScaled(state, k3, dt), length1, length2);

    return {
      theta1: state.theta1 + dt * (k1.theta1 + 2 * k2.theta1 + 2 * k3.theta1 + k4.theta1) / 6,
      theta2: state.theta2 + dt * (k1.theta2 + 2 * k2.theta2 + 2 * k3.theta2 + k4.theta2) / 6,
      omega1: state.omega1 + dt * (k1.omega1 + 2 * k2.omega1 + 2 * k3.omega1 + k4.omega1) / 6,
      omega2: state.omega2 + dt * (k1.omega2 + 2 * k2.omega2 + 2 * k3.omega2 + k4.omega2) / 6
    };
  }

  function bobPositions(state, length1, length2) {
    const x1 = length1 * Math.sin(state.theta1);
    const y1 = length1 * Math.cos(state.theta1);
    const x2 = x1 + length2 * Math.sin(state.theta2);
    const y2 = y1 + length2 * Math.cos(state.theta2);
    return { x1, y1, x2, y2 };
  }

  function wrapAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  function angularDivergenceDegrees() {
    if (!stateA || !stateB) return 0;
    const delta1 = wrapAngle(stateB.theta1 - stateA.theta1);
    const delta2 = wrapAngle(stateB.theta2 - stateA.theta2);
    return Math.sqrt(delta1 * delta1 + delta2 * delta2) * RAD_TO_DEG;
  }

  function clearTrails() {
    trailA = [];
    trailB = [];
  }

  function appendTrailPoint() {
    if (!controls.trails.checked) return;
    const params = getParameters();
    const pointA = bobPositions(stateA, params.length1, params.length2);
    trailA.push({ x: pointA.x2, y: pointA.y2 });
    if (trailA.length > MAX_TRAIL_POINTS) trailA.shift();

    if (params.compare) {
      const pointB = bobPositions(stateB, params.length1, params.length2);
      trailB.push({ x: pointB.x2, y: pointB.y2 });
      if (trailB.length > MAX_TRAIL_POINTS) trailB.shift();
    }
  }

 function updateReadouts({ force = false, timestamp = performance.now() } = {}) {
  if (!force && timestamp - lastReadoutTimestamp < READOUT_INTERVAL_MS) return;

  lastReadoutTimestamp = timestamp;

  const rawDivergence = angularDivergenceDegrees();

  if (force || !running) {
    displayedDivergence = rawDivergence;
  } else {
    displayedDivergence +=
      (rawDivergence - displayedDivergence) * DIVERGENCE_SMOOTHING;
  }

  const timeDigits = running ? 1 : 2;

  timeOutput.textContent =
    `${formatNumber(simulationTime, timeDigits)} s`;

  const digits =
    displayedDivergence < 0.1
      ? 3
      : displayedDivergence < 10
        ? 2
        : 1;

  divergenceOutput.textContent =
    `${formatNumber(displayedDivergence, digits)}°`;
}

  function updateComparisonVisibility() {
    const enabled = controls.compare.checked;
    controls.perturbationControl.hidden = !enabled;
    legendB.hidden = !enabled;
    divergenceWrap.hidden = !enabled;
  }

  function resetSimulation({ keepRunning = false, showMessage = true } = {}) {
    const params = getParameters();
    stateA = createInitialState(params.angle1, params.angle2);
    stateB = createInitialState(params.angle1, params.angle2 + params.perturbation);
    simulationTime = 0;
    accumulator = 0;
    lastTimestamp = null;
  clearTrails();
appendTrailPoint();
displayedDivergence = angularDivergenceDegrees();
updateReadouts({ force: true });
updateComparisonVisibility();
    draw();

    if (!keepRunning) pauseSimulation();
    canvasMessage.textContent = "Premi “Avvia” per iniziare";
    canvasMessage.classList.toggle("is-hidden", !showMessage || running);
  }

  function setRunningUi(isRunning) {
    startPauseButton.textContent = isRunning ? "Pausa" : "Avvia";
    startPauseButton.setAttribute("aria-pressed", String(isRunning));
    canvasMessage.classList.toggle("is-hidden", isRunning);
  }

  function startSimulation() {
    if (running) return;
    running = true;
    lastTimestamp = null;
    setRunningUi(true);
    animationFrameId = requestAnimationFrame(animate);
  }

  function pauseSimulation() {
    running = false;
    lastTimestamp = null;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    setRunningUi(false);
    updateReadouts({ force: true });
  }

  function toggleSimulation() {
    if (running) pauseSimulation();
    else startSimulation();
  }

  function animate(timestamp) {
    if (!running) return;

    if (lastTimestamp === null) lastTimestamp = timestamp;
    const realElapsed = clamp((timestamp - lastTimestamp) / 1000, 0, 0.05);
    lastTimestamp = timestamp;

    const params = getParameters();
    accumulator += realElapsed * params.speed;

    while (accumulator >= INTEGRATION_STEP) {
      stateA = rk4Step(stateA, INTEGRATION_STEP, params.length1, params.length2);
      if (params.compare) {
        stateB = rk4Step(stateB, INTEGRATION_STEP, params.length1, params.length2);
      }
      simulationTime += INTEGRATION_STEP;
      accumulator -= INTEGRATION_STEP;
    }

    appendTrailPoint();
    updateReadouts(timestamp);
    draw();
    animationFrameId = requestAnimationFrame(animate);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = Math.max(1, rect.width);
    canvasHeight = Math.max(1, rect.height);
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function drawingGeometry() {
    const params = getParameters();
    const totalLength = params.length1 + params.length2;
    const horizontalScale = canvasWidth * 0.42 / totalLength;
    const verticalScale = canvasHeight * 0.70 / totalLength;
    return {
      pivotX: canvasWidth / 2,
      pivotY: Math.max(44, canvasHeight * 0.16),
      scale: Math.min(horizontalScale, verticalScale),
      params
    };
  }

  function toCanvas(point, geometry) {
    return {
      x: geometry.pivotX + point.x * geometry.scale,
      y: geometry.pivotY + point.y * geometry.scale
    };
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    const spacing = Math.max(36, Math.round(canvasWidth / 14));
    ctx.beginPath();
    for (let x = spacing; x < canvasWidth; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    for (let y = spacing; y < canvasHeight; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawTrail(points, color, geometry) {
    if (!controls.trails.checked || points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Quattro segmenti con opacità crescente: mantiene l'effetto scia
    // evitando centinaia di chiamate di disegno separate a ogni fotogramma.
    const chunks = 4;
    for (let chunk = 0; chunk < chunks; chunk += 1) {
      const start = Math.floor((points.length - 1) * chunk / chunks);
      const end = Math.max(start + 1, Math.floor((points.length - 1) * (chunk + 1) / chunks));
      const first = toCanvas(points[start], geometry);
      ctx.globalAlpha = 0.14 + chunk * 0.16;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = start + 1; i <= end && i < points.length; i += 1) {
        const current = toCanvas(points[i], geometry);
        ctx.lineTo(current.x, current.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPendulum(state, color, geometry, isSecondary = false) {
    const positions = bobPositions(state, geometry.params.length1, geometry.params.length2);
    const pivot = { x: geometry.pivotX, y: geometry.pivotY };
    const bob1 = toCanvas({ x: positions.x1, y: positions.y1 }, geometry);
    const bob2 = toCanvas({ x: positions.x2, y: positions.y2 }, geometry);
    const mass1Radius = clamp(9 + geometry.scale * 0.025, 9, 16);
    const mass2Radius = clamp(11 + geometry.scale * 0.03, 11, 19);

    ctx.save();
    ctx.globalAlpha = isSecondary ? 0.86 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = isSecondary ? 4 : 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(bob1.x, bob1.y);
    ctx.lineTo(bob2.x, bob2.y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bob1.x, bob1.y, mass1Radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bob2.x, bob2.y, mass2Radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    if (!stateA || canvasWidth <= 0 || canvasHeight <= 0) return;

    const geometry = drawingGeometry();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawGrid();

    drawTrail(trailA, palette.a, geometry);
    if (geometry.params.compare) drawTrail(trailB, palette.b, geometry);

    if (geometry.params.compare) drawPendulum(stateB, palette.b, geometry, true);
    drawPendulum(stateA, palette.a, geometry, false);

    ctx.save();
    ctx.fillStyle = palette.pivot;
    ctx.beginPath();
    ctx.arc(geometry.pivotX, geometry.pivotY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function syncRangeAndNumber(range, number, digits) {
    const min = Number.parseFloat(range.min);
    const max = Number.parseFloat(range.max);

    range.addEventListener("input", () => {
      const value = Number.parseFloat(range.value);
      number.value = value.toFixed(digits);
      resetSimulation({ keepRunning: running, showMessage: !running });
    });

    number.addEventListener("input", () => {
      const raw = Number.parseFloat(number.value);
      if (!Number.isFinite(raw)) return;
      const value = clamp(raw, min, max);
      range.value = String(value);
      resetSimulation({ keepRunning: running, showMessage: !running });
    });

    number.addEventListener("change", () => {
      const raw = Number.parseFloat(number.value);
      const value = clamp(Number.isFinite(raw) ? raw : Number.parseFloat(range.value), min, max);
      number.value = value.toFixed(digits);
      range.value = String(value);
      resetSimulation({ keepRunning: running, showMessage: !running });
    });
  }

  function setPair(range, number, value, digits) {
    range.value = String(value);
    number.value = Number(value).toFixed(digits);
  }

  const presets = {
  classico: {
    angle1: 120,
    angle2: -10,
    perturbation: 0.05
  },
  caotico: {
    angle1: 135,
    angle2: 80,
    perturbation: 0.01
  },
  simmetrico: {
    angle1: 90,
    angle2: 90,
    perturbation: 0.1
  }
};

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
  
    setPair(controls.angle1Range, controls.angle1Number, preset.angle1, 0);
    setPair(controls.angle2Range, controls.angle2Number, preset.angle2, 0);
    setPair(controls.perturbationRange, controls.perturbationNumber, preset.perturbation, 3);
    controls.compare.checked = true;
    resetSimulation();
  }
  syncRangeAndNumber(controls.angle1Range, controls.angle1Number, 0);
  syncRangeAndNumber(controls.angle2Range, controls.angle2Number, 0);
  syncRangeAndNumber(controls.perturbationRange, controls.perturbationNumber, 3);

  controls.compare.addEventListener("change", () => {
    resetSimulation({ keepRunning: running, showMessage: !running });
  });

  controls.trails.addEventListener("change", () => {
    if (controls.trails.checked) appendTrailPoint();
    draw();
  });

  controls.speed.addEventListener("input", () => {
    controls.speedOutput.textContent = `${formatNumber(numberValue(controls.speed, 1), 2).replace(/,00$/, ",0")}×`;
  });

  startPauseButton.addEventListener("click", toggleSimulation);
  resetButton.addEventListener("click", () => resetSimulation());
  clearTrailsButton.addEventListener("click", () => {
    clearTrails();
    appendTrailPoint();
    draw();
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement || target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    toggleSimulation();
  });

  if ("ResizeObserver" in window && frameElement) {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(frameElement);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  controls.speed.dispatchEvent(new Event("input"));
  resetSimulation();
  requestAnimationFrame(resizeCanvas);
})();
