class DropForgeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 0.86, minValue: 0, maxValue: 1.4, automationRate: 'k-rate' },
      { name: 'pick', defaultValue: 0.72, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'palm', defaultValue: 0.82, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'stringBuzz', defaultValue: 0.32, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'scale', defaultValue: 0.62, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ];
  }

  constructor() {
    super();
    this.voices = [];
    this.noise = 0.22222;
    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  handleMessage(message) {
    if (message.type === 'noteOn') this.noteOn(message.note, message.velocity ?? 1, message.mode ?? 'seven');
    if (message.type === 'noteOff') this.noteOff(message.note);
    if (message.type === 'panic') this.voices = [];
  }

  noteOn(note, velocity, mode) {
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    const length = Math.max(8, Math.round(sampleRate / frequency));
    const buffer = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      buffer[i] = (this.random() * 2 - 1) * velocity;
    }
    this.voices.push({
      note,
      frequency,
      buffer,
      index: 0,
      age: 0,
      env: 1,
      released: false,
      mode,
      lp: 0,
      hp: 0,
      hpLast: 0,
      body: 0
    });
    if (this.voices.length > 12) this.voices.shift();
  }

  noteOff(note) {
    this.voices.forEach((voice) => {
      if (voice.note === note) voice.released = true;
    });
  }

  random() {
    this.noise = (this.noise * 16807) % 2147483647;
    return (this.noise - 1) / 2147483646;
  }

  process(_inputs, outputs, parameters) {
    const out = outputs[0];
    const left = out[0];
    const right = out[1] || out[0];
    const gain = parameters.gain[0];
    const pick = parameters.pick[0];
    const palm = parameters.palm[0];
    const buzz = parameters.stringBuzz[0];
    const scale = parameters.scale[0];

    for (let i = 0; i < left.length; i += 1) {
      let sample = 0;
      for (const voice of this.voices) {
        const current = voice.buffer[voice.index];
        const nextIndex = (voice.index + 1) % voice.buffer.length;
        const next = voice.buffer[nextIndex];
        const damping = 0.492 - palm * 0.13 + scale * 0.035;
        const newValue = (current + next) * damping;
        const pluckClick = voice.age < 70 ? (this.random() * 2 - 1) * pick * (1 - voice.age / 70) : 0;
        const fretRattle = Math.tanh((current - next) * (8 + buzz * 24)) * buzz * 0.08;
        voice.buffer[voice.index] = newValue + fretRattle;
        voice.index = nextIndex;
        voice.age += 1;
        voice.env *= voice.released ? 0.985 : 0.99972 - palm * 0.00018;
        voice.lp += (current - voice.lp) * (0.12 + (1 - palm) * 0.08);
        const hp = voice.lp - voice.hpLast + 0.995 * voice.hp;
        voice.hpLast = voice.lp;
        voice.hp = hp;
        voice.body = voice.body * 0.997 + Math.sin(voice.age * voice.frequency * 0.00019) * 0.003;
        sample += (hp + pluckClick + voice.body) * voice.env;
      }
      this.voices = this.voices.filter((voice) => voice.env > 0.0008);
      sample = Math.tanh(sample * gain * 1.8);
      left[i] = sample;
      right[i] = sample * 0.985 + (this.random() * 2 - 1) * 0.002;
    }
    return true;
  }
}

registerProcessor('dropforge-processor', DropForgeProcessor);
