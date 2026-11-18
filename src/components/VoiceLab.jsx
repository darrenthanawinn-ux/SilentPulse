import { useEffect, useRef, useState } from 'react'
import { Mic, Lock, AlertTriangle } from 'lucide-react'
import { PROMPT } from '../data/presets'
const DUR = 5, BARS = 48
export default function VoiceLab({ scn, mode, onResult }) {
  const cv = useRef(null), run = useRef(false), t0 = useRef(0), an = useRef(null), ctx = useRef(null), strm = useRef(null)
  const live = useRef({ scn, mode }), lastUi = useRef(0), fin = useRef(null)
  const [running, setRunning] = useState(false)
  const [prog, setProg] = useState(0)
  const [m, setM] = useState(null)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  live.current = { scn, mode }
  const words = PROMPT.split(' ')

  fin.current = () => {
    run.current = false; setRunning(false)
    if (strm.current) { strm.current.getTracks().forEach((t) => t.stop()); strm.current = null }
    if (ctx.current) { ctx.current.close(); ctx.current = null }
    const s = live.current.scn
    const r = { jitter: s.jitter, shimmer: s.shimmer, hnr: s.hnr, f0: s.f0, edema: s.edema }
    setRes(r); onResult(r)
  }

  useEffect(() => {
    const c = cv.current, g = c.getContext('2d'), arr = new Uint8Array(128)
    let raf
    const loop = (now) => {
      const { scn: sc, mode: md } = live.current
      const t = (now - t0.current) / 1000
      g.clearRect(0, 0, 800, 220)
      const w = 800 / BARS
      if (run.current && md === 'live' && an.current) an.current.getByteFrequencyData(arr)
      const vals = []
      for (let i = 0; i < BARS; i++) {
        let v
        if (run.current && md === 'live' && an.current) v = arr[Math.floor(i * 1.6)] / 255
        else if (run.current) {
          const base = Math.exp(-((i - 6) ** 2) / 20) + 0.7 * Math.exp(-((i - 17) ** 2) / 30) + 0.45 * Math.exp(-((i - 30) ** 2) / 40) + 0.12
          v = Math.min(1, base * (0.5 + 0.5 * Math.abs(Math.sin(t * 7 + i * 0.15))) * (0.8 + Math.random() * 0.2 * (1 + sc.jitter)))
        } else v = 0.04 + 0.03 * Math.sin(now / 500 + i * 0.4)
        vals.push(v)
        const h = Math.max(3, v * 200), hue = 160 - v * 50
        g.fillStyle = `hsl(${hue},80%,${45 + v * 15}%)`; g.shadowColor = `hsl(${hue},80%,50%)`; g.shadowBlur = v * 14
        g.beginPath(); g.roundRect(i * w + 2, 210 - h, w - 4, h, 3); g.fill()
      }
      g.shadowBlur = 0
      if (run.current) {
        const p = Math.min(1, t / DUR)
        if (now - lastUi.current > 90) {
          lastUi.current = now; setProg(p)
          const k = 1 + Math.sin(now / 160) * 0.08
          const en = mean(vals)
          setM({ jitter: sc.jitter * k * (md === 'live' ? 0.8 + en : 1), shimmer: sc.shimmer * (2 - k), hnr: sc.hnr * (1 + (k - 1) / 2), f0: sc.f0 + Math.sin(now / 90) * 4, mfcc: sc.mfcc.map((x, i) => x + Math.sin(now / 130 + i) * 2.5) })
        }
        if (t >= DUR) fin.current()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); if (strm.current) strm.current.getTracks().forEach((t) => t.stop()); if (ctx.current) ctx.current.close() }
  }, [])
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length

  const start = async () => {
    setErr(''); setRes(null); setProg(0)
    if (mode === 'live') {
      try {
        strm.current = await navigator.mediaDevices.getUserMedia({ audio: true })
        ctx.current = new (window.AudioContext || window.webkitAudioContext)()
        an.current = ctx.current.createAnalyser(); an.current.fftSize = 256
        ctx.current.createMediaStreamSource(strm.current).connect(an.current)
      } catch (e) { setErr('Microphone unavailable or permission denied. Switch to Demo Simulation Mode or allow mic access.'); return }
    } else an.current = null
    t0.current = performance.now(); run.current = true; setRunning(true)
  }
  const cur = m || { jitter: 0, shimmer: 0, hnr: 0, f0: 0, mfcc: [0, 0, 0, 0, 0, 0] }
  const idx = Math.floor(prog * words.length)
  const f = res ? res.edema : 0
  const parts = [['Jitter (cycle-to-cycle F0 variation)', 0.9], ['Shimmer (amplitude perturbation)', 0.8], ['HNR degradation (breathiness)', 0.7], ['Formant / F0 shift (tissue swelling)', 1.05]]
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 glass p-5">
        <div className="lbl mb-2">Standardized speech prompt</div>
        <p className="text-xl leading-relaxed">{words.map((w, i) => <span key={i} className={`mr-1.5 transition-colors ${running || res ? (i < idx || res ? 'text-emerald-300' : 'text-white/40') : 'text-white/80'}`}>{w}</span>)}</p>
        <canvas ref={cv} width={800} height={220} className="w-full mt-5 rounded-xl bg-black/20 border border-white/10" />
        <div className="h-1.5 rounded bg-white/10 mt-4 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${prog * 100}%`, boxShadow: '0 0 10px #10b981' }} /></div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={start} disabled={running} className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-medium flex items-center gap-2 disabled:opacity-40 hover:bg-emerald-500/30"><Mic className="h-4 w-4" />{running ? `Recording… ${Math.ceil(DUR * (1 - prog))}s` : 'Start 5-second capture'}</button>
          <span className="text-xs text-white/40">{mode === 'live' ? 'Live mic: spectrum is real; biomarker model is a prototype heuristic.' : 'Demo Simulation – synthetic voice.'}</span>
        </div>
        {err && <div className="mt-3 text-xs text-amber-300 flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{err}</div>}
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-5">
          <div className="lbl mb-3">Live telemetry</div>
          <div className="grid grid-cols-2 gap-3 num text-sm">
            <div>Jitter <span className="text-emerald-300 float-right">{cur.jitter.toFixed(2)} %</span></div>
            <div>Shimmer <span className="text-emerald-300 float-right">{cur.shimmer.toFixed(2)} %</span></div>
            <div>HNR <span className="text-emerald-300 float-right">{cur.hnr.toFixed(1)} dB</span></div>
            <div>F0 <span className="text-emerald-300 float-right">{cur.f0.toFixed(0)} Hz</span></div>
          </div>
          <div className="lbl mt-4 mb-2">MFCC 1–6</div>
          <div className="grid grid-cols-6 gap-1 num text-[11px] text-center">{cur.mfcc.map((x, i) => <div key={i} className="rounded bg-white/5 py-1.5 border border-white/10">{x.toFixed(0)}</div>)}</div>
        </div>
        <div className="glass p-5" style={{ boxShadow: res ? `0 0 40px ${f >= 60 ? 'rgba(239,68,68,.25)' : f >= 35 ? 'rgba(245,158,11,.2)' : 'rgba(16,185,129,.2)'}` : 'none' }}>
          <div className="flex items-center justify-between mb-3"><span className="lbl">Laryngeal fluid-retention risk</span>{res && <span className="text-[10px] text-emerald-300 flex items-center gap-1"><Lock className="h-3 w-3" />LOCKED</span>}</div>
          {res ? (<>
            <div className="num text-4xl mb-4" style={{ color: f >= 60 ? '#ef4444' : f >= 35 ? '#f59e0b' : '#10b981' }}>{f}<span className="text-sm text-white/40"> /100</span></div>
            {parts.map(([n, k]) => { const val = Math.min(100, Math.round(f * k)); return (<div key={n} className="mb-3"><div className="flex justify-between text-[11px] text-white/60 mb-1"><span>{n}</span><span className="num">{val}</span></div><div className="h-1.5 rounded bg-white/10"><div className="h-full rounded" style={{ width: `${val}%`, background: val >= 60 ? '#ef4444' : val >= 35 ? '#f59e0b' : '#10b981' }} /></div></div>) })}
          </>) : <div className="text-sm text-white/40">Read the prompt aloud during the capture. Results sync to the dashboard.</div>}
        </div>
      </div>
    </div>
  )
}
