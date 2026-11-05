/**
 * EXERGY // THERMODYNAMIC EV TELEMETRY
 * Domain: exergy.science
 * Zero-radius, pure telemetry, Grassmann flow physics engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initTelemetryTicker();
  initFlowSimulator();
  initShowcaseTabs();
  initDocSidebar();
  initCopyButtons();
});

/* --------------------------------------------------------------------------
   1. Live Telemetry Ticker Simulation
   -------------------------------------------------------------------------- */
function initTelemetryTicker() {
  const vbusElem = document.getElementById('ticker-vbus');
  const powerElem = document.getElementById('ticker-power');
  const tempElem = document.getElementById('ticker-temp');
  const freqElem = document.getElementById('ticker-freq');

  if (!vbusElem || !powerElem) return;

  let baseVbus = 394.2;
  let baseKw = 21.4;
  let baseTemp = 18.2;

  setInterval(() => {
    // Subtle physical jitter typical of CAN-bus 10 Hz sampling
    const vDelta = (Math.random() - 0.5) * 0.4;
    const pDelta = (Math.random() - 0.5) * 0.8;
    const tDelta = (Math.random() - 0.5) * 0.05;

    vbusElem.textContent = (baseVbus + vDelta).toFixed(1) + ' V';
    powerElem.textContent = (baseKw + pDelta).toFixed(1) + ' kW';
    if (tempElem) tempElem.textContent = (baseTemp + tDelta).toFixed(1) + ' °C';
  }, 1200);
}

/* --------------------------------------------------------------------------
   2. Interactive Grassmann / Sankey Energy Flow Simulator
   Decomposes total EV power into physical sinks:
   - Aerodynamic drag: P_aero = 0.5 * rho * Cd * A * v^3
   - Rolling resistance: P_roll = Crr * m * g * v
   - Gravitational climb: P_climb = m * g * v * grade
   - Cabin HVAC: Heat pump thermodynamic COP function
   - Auxiliary 12V: Computer, sensors, lighting
   - Regen recovery: Kinetic/Potential loopback
   -------------------------------------------------------------------------- */
function initFlowSimulator() {
  const speedSlider = document.getElementById('slider-speed');
  const tempSlider = document.getElementById('slider-temp');
  const gradeSlider = document.getElementById('slider-grade');
  const speedVal = document.getElementById('val-speed');
  const tempVal = document.getElementById('val-temp');
  const gradeVal = document.getElementById('val-grade');

  const modeButtons = document.querySelectorAll('.mode-btn');
  let hvacMode = 'comfort'; // 'off', 'eco', 'comfort'

  if (!speedSlider) return;

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hvacMode = btn.dataset.mode;
      updatePhysics();
    });
  });

  [speedSlider, tempSlider, gradeSlider].forEach(input => {
    input.addEventListener('input', updatePhysics);
  });

  function updatePhysics() {
    const vKmh = parseFloat(speedSlider.value);
    const tExt = parseFloat(tempSlider.value);
    const gradePct = parseFloat(gradeSlider.value);

    speedVal.textContent = vKmh + ' km/h';
    tempVal.textContent = (tExt > 0 ? '+' : '') + tExt + ' °C';
    gradeVal.textContent = (gradePct > 0 ? '+' : '') + gradePct.toFixed(1) + ' %';

    // Physical Constants for typical AAOS EV (Polestar 2 / Volvo EX40 class)
    const mass = 2150; // kg
    const Cd = 0.278;  // Drag coefficient
    const frontalArea = 2.45; // m^2
    const Crr = 0.0105; // Rolling resistance coefficient
    const g = 9.80665; // m/s^2
    const vMs = vKmh / 3.6;

    // Air density with temperature correction
    const rho = 1.293 * (273.15 / (273.15 + tExt));

    // Power calculations in Kilowatts
    const pAero = (0.5 * rho * Cd * frontalArea * Math.pow(vMs, 3)) / 1000;
    const pRoll = (Crr * mass * g * vMs) / 1000;
    const pTraction = pAero + pRoll;

    const pClimb = (mass * g * vMs * (gradePct / 100)) / 1000;

    // HVAC Heat Pump load with temperature delta
    let pHvac = 0;
    if (hvacMode !== 'off') {
      const deltaT = Math.abs(tExt - 21.0);
      const cop = tExt < 0 ? 2.1 : 3.4; // Heat pump COP degrades below freezing
      const thermalLossW = deltaT * 115; // Cabin envelope thermal conductance
      pHvac = (thermalLossW / cop) / 1000;
      if (hvacMode === 'eco') pHvac *= 0.65;
      pHvac = Math.max(0.2, pHvac);
    }

    // 12V Auxiliary load (telemetry computer, screens, radar, lighting)
    const pAux = 0.38 + (vKmh > 0 ? 0.08 : 0);

    // Standby baseline
    const pStandby = 0.06;

    // Total gross output required or regenerative recovery
    let pGross = pTraction + Math.max(0, pClimb) + pHvac + pAux + pStandby;
    let pRegen = 0;

    if (pClimb < 0) {
      // Descending slope regenerates energy
      const pDescentKinetic = Math.abs(pClimb);
      const regenEfficiency = 0.82;
      const netDescentExcess = pDescentKinetic - (pTraction + pHvac + pAux);
      if (netDescentExcess > 0) {
        pRegen = netDescentExcess * regenEfficiency;
        pGross = pHvac + pAux; // Aux runs from regen surplus
      } else {
        pGross = pTraction + pClimb + pHvac + pAux + pStandby;
      }
    }

    // Efficiency metrics: kWh / 100 km
    const efficiencyKwh100km = vKmh > 5 ? (pGross / vKmh) * 100 : 0;

    // Update Telemetry Display Cells
    updateMetricText('metric-gross-kw', pGross.toFixed(1) + ' kW');
    updateMetricText('metric-kwh-100', efficiencyKwh100km.toFixed(1) + ' kWh/100 km');
    updateMetricText('metric-aero-kw', pAero.toFixed(1) + ' kW');
    updateMetricText('metric-roll-kw', pRoll.toFixed(1) + ' kW');
    updateMetricText('metric-climb-kw', pClimb.toFixed(1) + ' kW');
    updateMetricText('metric-hvac-kw', pHvac.toFixed(1) + ' kW');
    updateMetricText('metric-aux-kw', pAux.toFixed(1) + ' kW');
    updateMetricText('metric-regen-kw', pRegen.toFixed(1) + ' kW');

    // Update SVG Mitred Grassmann Path Widths
    renderSvgGrassmann({
      gross: pGross,
      traction: pTraction,
      aero: pAero,
      roll: pRoll,
      climb: pClimb,
      hvac: pHvac,
      aux: pAux,
      regen: pRegen
    });
  }

  function updateMetricText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Draw or update SVG Grassmann streams with strict 90/45 degree mitred turns
  function renderSvgGrassmann(data) {
    const svg = document.getElementById('sankey-svg');
    if (!svg) return;

    // Stream width scaling factor
    const scale = 3.6; // pixels per kW
    const wGross = Math.max(12, data.gross * scale);
    const wTraction = Math.max(6, data.traction * scale);
    const wClimb = Math.max(0, data.climb * scale);
    const wHvac = Math.max(4, data.hvac * scale);
    const wAux = Math.max(3, data.aux * scale);
    const wRegen = Math.max(0, data.regen * scale);

    // Set SVG elements
    setPathWidth('stream-gross', wGross);
    setPathWidth('stream-traction', wTraction);
    setPathWidth('stream-hvac', wHvac);
    setPathWidth('stream-climb', Math.max(2, wClimb));
    setPathWidth('stream-aux', wAux);

    const regenStream = document.getElementById('stream-regen');
    if (regenStream) {
      if (data.regen > 0.5) {
        regenStream.style.display = 'block';
        regenStream.setAttribute('stroke-width', Math.min(24, Math.max(3, wRegen)));
      } else {
        regenStream.style.display = 'none';
      }
    }
  }

  function setPathWidth(id, width) {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('stroke-width', width.toFixed(1));
    }
  }

  // Initial calculation
  updatePhysics();
}

/* --------------------------------------------------------------------------
   3. Multi-Surface Showcase Switcher
   -------------------------------------------------------------------------- */
function initShowcaseTabs() {
  const tabs = document.querySelectorAll('.showcase-tab');
  const panels = document.querySelectorAll('.showcase-panel');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Privacy Documentation Sidebar ScrollSpy
   -------------------------------------------------------------------------- */
function initDocSidebar() {
  const links = document.querySelectorAll('.doc-nav a');
  const sections = document.querySelectorAll('.doc-section');

  if (!links.length || !sections.length) return;

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 140;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. Clipboard Copy Utility
   -------------------------------------------------------------------------- */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.dataset.target;
      const targetEl = document.querySelector(targetSelector);
      if (!targetEl) return;

      const textToCopy = targetEl.textContent.trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'COPIED TO CLIPBOARD';
        btn.classList.add('btn-sink-regen');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('btn-sink-regen');
        }, 2000);
      });
    });
  });
}
