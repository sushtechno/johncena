# DropForge 7 — Nu-Metal Guitar Synth

DropForge 7 is a browser-based baritone / 7-string guitar synthesizer built for aggressive modern rock and nu-metal parts. It focuses on tight palm-muted chugging, high-gain amp saturation, stompbox crunch, cabinet impulse response coloration, MIDI hardware control, and low-latency recording workflows.

## Features

- **7-string and baritone guitar engine** using an AudioWorklet plucked-string processor with pick transient, palm-mute damping, string buzz, and scale-length controls.
- **High-gain distortion presets** for drop-tuned riffs: `Drop A Chug Wall`, `Baritone Sludge Bite`, and `Razor 7-String Tight`.
- **Integrated stompbox simulations** including a tube-style boost, tone shaping, and octave-fuzz blend for extra crunch before the amp.
- **Amp stack controls** for preamp gain, sag, mid scoop, and presence so chugs stay saturated but articulate.
- **Custom cabinet IRs**: upload audio impulse responses or switch between generated oversized 4×12, scooped 4×12, and baritone 2×12 cabinets.
- **Built-in noise gate** with threshold and release controls for tight stop/start articulation.
- **MIDI-mappable parameter section** with Web MIDI note input and MIDI learn for hardware CC control.
- **Low-latency / ASIO-ready interface panel** that exposes interactive Web Audio mode, external ASIO host/loopback workflow notes, and 64/128/256-sample buffer targets.

## Run locally

```bash
npm start
```

Then open <http://localhost:5173>, click **Arm audio engine**, and play the on-screen pads or keyboard keys `A S D F G H J`.

## Recording and ASIO workflow notes

Web browsers do not open native ASIO drivers directly. For real-time recording on Windows, run your audio interface's ASIO driver in a DAW or ASIO-capable host, keep buffers around 64–128 samples, and route DropForge 7 into that environment with loopback, virtual audio routing, or interface mixer routing. The app itself uses `AudioContext({ latencyHint: 'interactive' })` plus an `AudioWorklet` processor to keep synth generation off the UI thread.

## Research-informed voicing choices

- Low-tuned 7-string and baritone guitars need strong low-mid body while removing flubby sub-bass before distortion, so the rig high-passes before the boost and cabinet stage.
- Nu-metal chug tones commonly combine a tight front-end boost, heavy preamp clipping, scooped mids, and bright presence; those stages are exposed separately.
- Palm-muted articulation depends as much on gating as distortion, so the gate has hysteresis-like smoothing and fast closure after each note.
- Cabinet IR coloration is critical for realistic high-gain guitars, so the amp output always passes through a convolver with either factory or custom IR buffers.
