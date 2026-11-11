import { store } from './store.js'

let ctx = null

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const enabled = () => store.sound

function blip({ freq = 440, to = freq, dur = 0.18, type = 'triangle', vol = 0.16, delay = 0 }) {
  if (!enabled()) return
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.014)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.03)
}

function noise({ dur = 0.16, vol = 0.18, delay = 0, type = 'lowpass', freq = 2000, q = 1 }) {
  if (!enabled()) return
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + delay
  const frames = Math.max(1, Math.floor(a.sampleRate * dur))
  const buf = a.createBuffer(1, frames, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = a.createBufferSource()
  src.buffer = buf
  const filter = a.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(freq, t0)
  filter.Q.value = q
  const g = a.createGain()
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(g).connect(a.destination)
  src.start(t0)
}

export const sfx = {
  tap() {
    blip({ freq: 520, to: 620, dur: 0.08, type: 'sine', vol: 0.09 })
  },
  pop() {
    noise({ dur: 0.09, vol: 0.28, type: 'bandpass', freq: 1400, q: 1.2 })
    blip({ freq: 780, to: 160, dur: 0.13, type: 'sine', vol: 0.15 })
  },
  correct(delay = 0) {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      blip({ freq: f, dur: 0.22, type: 'triangle', vol: 0.13, delay: delay + i * 0.085 }),
    )
  },
  wrong() {
    blip({ freq: 300, to: 250, dur: 0.16, type: 'sine', vol: 0.11 })
    blip({ freq: 240, to: 190, dur: 0.2, type: 'sine', vol: 0.1, delay: 0.14 })
  },
  chew(delay = 0) {
    noise({ dur: 0.14, vol: 0.16, type: 'lowpass', freq: 700, delay })
    blip({ freq: 150, to: 90, dur: 0.14, type: 'sine', vol: 0.12, delay })
  },
  whoosh() {
    noise({ dur: 0.4, vol: 0.1, type: 'bandpass', freq: 900, q: 0.8 })
  },
  sparkle() {
    for (let i = 0; i < 4; i++) {
      blip({
        freq: 1500 + Math.random() * 1300,
        dur: 0.14,
        type: 'sine',
        vol: 0.06,
        delay: i * 0.05,
      })
    }
  },
  star() {
    blip({ freq: 880, dur: 0.14, type: 'triangle', vol: 0.11 })
    blip({ freq: 1318.5, dur: 0.2, type: 'triangle', vol: 0.09, delay: 0.09 })
  },
  chime() {
    blip({ freq: 1046, dur: 0.18, type: 'sine', vol: 0.08 })
  },
  win() {
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      blip({ freq: f, dur: 0.3, type: 'triangle', vol: 0.12, delay: i * 0.11 }),
    )
    noise({ dur: 0.5, vol: 0.05, type: 'highpass', freq: 4000, delay: 0.4 })
  },
}
