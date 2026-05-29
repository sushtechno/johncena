const FACTORY_PRESETS = {
  'Drop A Chug Wall': {
    synthGain: 0.96, pick: 0.8, palm: 0.9, stringBuzz: 0.36, scale: 0.72,
    gateThreshold: 0.34, gateRelease: 0.08, boostDrive: 0.74, boostTone: 0.68,
    fuzzBlend: 0.12, ampGain: 0.88, ampSag: 0.34, scoop: 0.74, presence: 0.7,
    cabMix: 0.92, room: 0.08, output: 0.74
  },
  'Baritone Sludge Bite': {
    synthGain: 0.9, pick: 0.66, palm: 0.74, stringBuzz: 0.48, scale: 0.92,
    gateThreshold: 0.26, gateRelease: 0.16, boostDrive: 0.54, boostTone: 0.56,
    fuzzBlend: 0.22, ampGain: 0.8, ampSag: 0.58, scoop: 0.45, presence: 0.54,
    cabMix: 0.88, room: 0.16, output: 0.7
  },
  'Razor 7-String Tight': {
    synthGain: 1.02, pick: 0.92, palm: 0.96, stringBuzz: 0.25, scale: 0.62,
    gateThreshold: 0.42, gateRelease: 0.045, boostDrive: 0.82, boostTone: 0.78,
    fuzzBlend: 0.05, ampGain: 0.94, ampSag: 0.22, scoop: 0.82, presence: 0.82,
    cabMix: 0.95, room: 0.04, output: 0.7
  }
};

const CONTROL_GROUPS = [
  ['String engine', [
    ['synthGain', 'Pickup output', 0, 1.4, 0.01], ['pick', 'Pick attack', 0, 1, 0.01],
    ['palm', 'Palm mute choke', 0, 1, 0.01], ['stringBuzz', 'Fret buzz', 0, 1, 0.01], ['scale', 'Baritone scale', 0, 1, 0.01]
  ]],
  ['Stompboxes', [
    ['boostDrive', 'Tube boost drive', 0, 1, 0.01], ['boostTone', 'Boost tone', 0, 1, 0.01], ['fuzzBlend', 'Octave fuzz blend', 0, 1, 0.01]
  ]],
  ['Amp stack', [
    ['ampGain', 'High-gain preamp', 0, 1, 0.01], ['ampSag', 'Power amp sag', 0, 1, 0.01],
    ['scoop', 'Nu-metal mid scoop', 0, 1, 0.01], ['presence', 'Presence bite', 0, 1, 0.01]
  ]],
  ['Cab / space', [
    ['cabMix', 'Cab IR mix', 0, 1, 0.01], ['room', 'Room thump', 0, 0.5, 0.01], ['output', 'Master output', 0, 1, 0.01]
  ]],
  ['Noise gate', [
    ['gateThreshold', 'Gate threshold', 0, 1, 0.01], ['gateRelease', 'Gate release', 0.02, 0.5, 0.005]
  ]]
];

const NOTE_LAYOUT = [
  ['A', 33, 'low A'], ['S', 35, 'B string'], ['D', 38, 'D'], ['F', 40, 'E'], ['G', 43, 'G'], ['H', 45, 'A'], ['J', 47, 'B']
];

const state = { ...FACTORY_PRESETS['Drop A Chug Wall'] };
const midiMap = new Map();
let learnParam = null;
let customPresetCount = 1;

class DropForgeEngine {
  constructor() {
    this.context = null;
    this.node = null;
    this.analyser = null;
    this.levelAnalyser = null;
    this.gate = null;
    this.cab = null;
    this.master = null;
    this.inputLevel = 0;
    this.gateEnvelope = 0;
    this.currentIr = 'oversized412';
  }

  async start() {
    if (this.context) {
      await this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
    await this.context.audioWorklet.addModule('chug-processor.js');
    this.node = new AudioWorkletNode(this.context, 'dropforge-processor', { outputChannelCount: [2] });
    this.preFilter = new BiquadFilterNode(this.context, { type: 'highpass', frequency: 72, Q: 0.7 });
    this.boost = new WaveShaperNode(this.context, { curve: makeDriveCurve(0.45, 1.4), oversample: '4x' });
    this.tone = new BiquadFilterNode(this.context, { type: 'highshelf', frequency: 1650, gain: 4 });
    this.amp = new WaveShaperNode(this.context, { curve: makeAmpCurve(0.8, 0.35), oversample: '4x' });
    this.scoop = new BiquadFilterNode(this.context, { type: 'peaking', frequency: 650, Q: 0.9, gain: -9 });
    this.presence = new BiquadFilterNode(this.context, { type: 'highshelf', frequency: 3100, gain: 5 });
    this.gate = new GainNode(this.context, { gain: 0 });
    this.cab = new ConvolverNode(this.context, { buffer: makeCabIr(this.context, this.currentIr) });
    this.cabDry = new GainNode(this.context, { gain: 0.08 });
    this.cabWet = new GainNode(this.context, { gain: 0.92 });
    this.room = new DelayNode(this.context, { delayTime: 0.018, maxDelayTime: 0.05 });
    this.roomGain = new GainNode(this.context, { gain: 0.08 });
    this.master = new GainNode(this.context, { gain: 0.74 });
    this.levelAnalyser = new AnalyserNode(this.context, { fftSize: 1024, smoothingTimeConstant: 0.38 });
    this.analyser = new AnalyserNode(this.context, { fftSize: 1024, smoothingTimeConstant: 0.64 });

    this.node.connect(this.preFilter).connect(this.boost).connect(this.tone).connect(this.amp).connect(this.scoop).connect(this.presence);
    this.presence.connect(this.levelAnalyser);
    this.presence.connect(this.cab);
    this.presence.connect(this.cabDry);
    this.cab.connect(this.cabWet);
    this.cabWet.connect(this.gate);
    this.cabDry.connect(this.gate);
    this.gate.connect(this.room).connect(this.roomGain).connect(this.master);
    this.gate.connect(this.master).connect(this.analyser).connect(this.context.destination);
    this.applyAll();
    this.runGate();
  }

  noteOn(note, velocity = 1) { this.node?.port.postMessage({ type: 'noteOn', note, velocity, mode: state.scale > 0.8 ? 'baritone' : 'seven' }); }
  noteOff(note) { this.node?.port.postMessage({ type: 'noteOff', note }); }
  panic() { this.node?.port.postMessage({ type: 'panic' }); if (this.gate) this.gate.gain.value = 0; }

  setParam(param, value) {
    state[param] = Number(value);
    if (!this.context) return;
    const now = this.context.currentTime;
    if (['synthGain', 'pick', 'palm', 'stringBuzz', 'scale'].includes(param)) {
      const workletParam = param === 'synthGain' ? 'gain' : param;
      this.node.parameters.get(workletParam).setTargetAtTime(state[param], now, 0.01);
    }
    if (param === 'boostDrive') this.boost.curve = makeDriveCurve(state.boostDrive, 1.2 + state.boostDrive * 2.2);
    if (param === 'boostTone') this.tone.gain.setTargetAtTime(-2 + state.boostTone * 10, now, 0.015);
    if (param === 'fuzzBlend') this.preFilter.frequency.setTargetAtTime(60 + state.fuzzBlend * 90, now, 0.015);
    if (param === 'ampGain' || param === 'ampSag') this.amp.curve = makeAmpCurve(state.ampGain, state.ampSag);
    if (param === 'scoop') this.scoop.gain.setTargetAtTime(-2 - state.scoop * 14, now, 0.015);
    if (param === 'presence') this.presence.gain.setTargetAtTime(-1 + state.presence * 10, now, 0.015);
    if (param === 'cabMix') {
      this.cabWet.gain.setTargetAtTime(state.cabMix, now, 0.015);
      this.cabDry.gain.setTargetAtTime(1 - state.cabMix, now, 0.015);
    }
    if (param === 'room') this.roomGain.gain.setTargetAtTime(state.room, now, 0.015);
    if (param === 'output') this.master.gain.setTargetAtTime(state.output, now, 0.015);
  }

  applyAll() { Object.entries(state).forEach(([param, value]) => this.setParam(param, value)); }

  async loadIr(file) {
    await this.start();
    const arrayBuffer = await file.arrayBuffer();
    this.cab.buffer = await this.context.decodeAudioData(arrayBuffer);
    this.currentIr = file.name;
  }

  setFactoryIr(name) {
    if (!this.context) return;
    this.currentIr = name;
    this.cab.buffer = makeCabIr(this.context, name);
  }

  runGate() {
    const data = new Float32Array(this.analyser.fftSize);
    const tick = () => {
      if (!this.context) return;
      this.levelAnalyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const sample of data) sum += sample * sample;
      this.inputLevel = Math.sqrt(sum / data.length);
      const open = this.inputLevel > state.gateThreshold * 0.12;
      const target = open ? 1 : 0;
      const speed = open ? 0.55 : Math.max(0.035, 1 - state.gateRelease * 2.1) * 0.12;
      this.gateEnvelope += (target - this.gateEnvelope) * speed;
      this.gate.gain.setTargetAtTime(this.gateEnvelope, this.context.currentTime, 0.006);
      requestAnimationFrame(tick);
    };
    tick();
  }
}

const engine = new DropForgeEngine();

function makeDriveCurve(amount, level = 2) {
  const curve = new Float32Array(4096);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    const pushed = x * (1 + amount * 18);
    curve[i] = Math.tanh(pushed) * level * (0.45 + amount * 0.16);
  }
  return curve;
}

function makeAmpCurve(gain, sag) {
  const curve = new Float32Array(8192);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    const asym = x + sag * 0.18;
    const clipped = Math.tanh(asym * (3 + gain * 30));
    const folded = Math.sin(clipped * (1.45 + gain * 0.9));
    curve[i] = (clipped * 0.72 + folded * 0.28) * (1 - sag * 0.18);
  }
  return curve;
}

function makeCabIr(context, name) {
  const seconds = name === 'baritone212' ? 0.72 : 0.5;
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const profiles = {
    oversized412: { low: 0.95, mid: 0.58, high: 0.34, decay: 8.5 },
    scooped412: { low: 0.82, mid: 0.28, high: 0.42, decay: 10 },
    baritone212: { low: 1.12, mid: 0.7, high: 0.22, decay: 6.8 }
  };
  const p = profiles[name] || profiles.oversized412;
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / context.sampleRate;
      const envelope = Math.exp(-t * p.decay);
      const low = Math.sin(2 * Math.PI * 115 * t) * p.low;
      const cone = Math.sin(2 * Math.PI * 920 * t + channel * 0.16) * p.mid;
      const fizz = (Math.random() * 2 - 1) * p.high * Math.exp(-t * 28);
      data[i] = (low + cone + fizz) * envelope * 0.16;
    }
  }
  return buffer;
}

function buildControls() {
  const host = document.querySelector('#controls');
  host.innerHTML = '';
  CONTROL_GROUPS.forEach(([title, controls]) => {
    const card = document.createElement('article');
    card.className = 'panel control-card';
    card.innerHTML = `<h3>${title}</h3>`;
    controls.forEach(([param, label, min, max, step]) => {
      const row = document.createElement('label');
      row.className = 'knob';
      row.dataset.param = param;
      row.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${state[param]}"><output>${formatValue(state[param])}</output>`;
      const input = row.querySelector('input');
      const output = row.querySelector('output');
      input.addEventListener('input', () => {
        output.value = formatValue(input.value);
        engine.setParam(param, input.value);
        if (learnParam === null && document.querySelector('#midiLearn').classList.contains('active')) setLearnParam(param);
      });
      card.append(row);
    });
    host.append(card);
  });
}

function formatValue(value) { return Number(value).toFixed(2); }

function applyPreset(name) {
  Object.assign(state, FACTORY_PRESETS[name]);
  document.querySelectorAll('.knob').forEach((row) => {
    const param = row.dataset.param;
    const input = row.querySelector('input');
    input.value = state[param];
    row.querySelector('output').value = formatValue(state[param]);
  });
  engine.applyAll();
}

function setLearnParam(param) {
  learnParam = param;
  document.querySelector('#midiLearn').textContent = `MIDI learn: move CC for ${param}`;
}

function setupUi() {
  const presetSelect = document.querySelector('#presetSelect');
  Object.keys(FACTORY_PRESETS).forEach((name) => presetSelect.append(new Option(name, name)));
  presetSelect.addEventListener('change', () => applyPreset(presetSelect.value));
  document.querySelector('#startAudio').addEventListener('click', async () => {
    await engine.start();
    updateEngineStatus();
  });
  document.querySelector('#panic').addEventListener('click', () => engine.panic());
  document.querySelector('#savePreset').addEventListener('click', () => {
    const name = `Custom chug ${customPresetCount++}`;
    FACTORY_PRESETS[name] = { ...state };
    presetSelect.append(new Option(name, name));
    presetSelect.value = name;
  });
  document.querySelector('#midiLearn').addEventListener('click', (event) => {
    event.currentTarget.classList.toggle('active');
    learnParam = null;
    event.currentTarget.textContent = event.currentTarget.classList.contains('active') ? 'MIDI learn: touch a slider' : 'MIDI learn: off';
  });
  document.querySelector('#irUpload').addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    await engine.loadIr(file);
    document.querySelector('#irStatus').textContent = `Custom IR loaded: ${file.name}`;
  });
  document.querySelectorAll('[data-ir]').forEach((button) => button.addEventListener('click', async () => {
    await engine.start();
    engine.setFactoryIr(button.dataset.ir);
    document.querySelector('#irStatus').textContent = `Factory IR: ${button.textContent}`;
  }));
  document.querySelector('#driverMode').addEventListener('change', updateEngineStatus);
  document.querySelector('#bufferTarget').addEventListener('change', updateEngineStatus);
  buildStringPad();
  drawScope();
}

function buildStringPad() {
  const pad = document.querySelector('#stringPad');
  NOTE_LAYOUT.forEach(([key, note, label]) => {
    const button = document.createElement('button');
    button.dataset.note = note;
    button.innerHTML = `<strong>${key}</strong><span>${label} / MIDI ${note}</span>`;
    const down = async () => { await engine.start(); button.classList.add('active'); engine.noteOn(note, 1); updateEngineStatus(); };
    const up = () => { button.classList.remove('active'); engine.noteOff(note); };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointerleave', up);
    pad.append(button);
  });
  window.addEventListener('keydown', async (event) => {
    const item = NOTE_LAYOUT.find(([key]) => key.toLowerCase() === event.key.toLowerCase());
    if (!item || event.repeat) return;
    await engine.start();
    engine.noteOn(item[1], 1);
    document.querySelector(`[data-note="${item[1]}"]`)?.classList.add('active');
    updateEngineStatus();
  });
  window.addEventListener('keyup', (event) => {
    const item = NOTE_LAYOUT.find(([key]) => key.toLowerCase() === event.key.toLowerCase());
    if (!item) return;
    engine.noteOff(item[1]);
    document.querySelector(`[data-note="${item[1]}"]`)?.classList.remove('active');
  });
}

async function setupMidi() {
  if (!navigator.requestMIDIAccess) {
    document.querySelector('#midiStatus').textContent = 'Web MIDI unavailable in this browser';
    return;
  }
  try {
    const access = await navigator.requestMIDIAccess();
    const refresh = () => {
      document.querySelector('#midiStatus').textContent = `${access.inputs.size} MIDI input(s) ready`;
      access.inputs.forEach((input) => { input.onmidimessage = handleMidi; });
    };
    access.onstatechange = refresh;
    refresh();
  } catch (error) {
    document.querySelector('#midiStatus').textContent = `MIDI blocked: ${error.message}`;
  }
}

async function handleMidi(event) {
  const [status, data1, data2] = event.data;
  const command = status & 0xf0;
  if (command === 0x90 && data2 > 0) { await engine.start(); engine.noteOn(data1, data2 / 127); }
  if (command === 0x80 || (command === 0x90 && data2 === 0)) engine.noteOff(data1);
  if (command === 0xb0) {
    if (learnParam) {
      midiMap.set(data1, learnParam);
      document.querySelector('#midiLearn').textContent = `MIDI learn: CC${data1} → ${learnParam}`;
      document.querySelector('#midiLearn').classList.remove('active');
      learnParam = null;
      return;
    }
    const param = midiMap.get(data1);
    if (!param) return;
    const row = document.querySelector(`[data-param="${param}"]`);
    const input = row.querySelector('input');
    const normalized = data2 / 127;
    const value = Number(input.min) + normalized * (Number(input.max) - Number(input.min));
    input.value = value;
    row.querySelector('output').value = formatValue(value);
    engine.setParam(param, value);
  }
}

function updateEngineStatus() {
  const context = engine.context;
  const driver = document.querySelector('#driverMode').value;
  const target = document.querySelector('#bufferTarget').value;
  const latency = context ? Math.round((context.baseLatency || 0) * 1000) : '--';
  document.querySelector('#engineStatus').textContent = context ? `Engine ${context.state} · ${context.sampleRate} Hz` : 'Engine idle';
  document.querySelector('#latencyReadout').textContent = `Latency: ${latency} ms · ${driver} · ${target} samples target`;
}

function drawScope() {
  const canvas = document.querySelector('#scope');
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(1024);
  const draw = () => {
    requestAnimationFrame(draw);
    ctx.fillStyle = '#060507';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff3b19';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (engine.analyser) engine.analyser.getByteTimeDomainData(data);
    for (let i = 0; i < data.length; i += 1) {
      const x = (i / (data.length - 1)) * canvas.width;
      const y = engine.analyser ? (data[i] / 255) * canvas.height : canvas.height / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    document.querySelector('#gateMeter').value = engine.gateEnvelope || 0;
    updateEngineStatus();
  };
  draw();
}

setupUi();
setupMidi();
