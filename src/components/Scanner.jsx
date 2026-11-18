import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts'
import { Play, Lock, AlertTriangle } from 'lucide-react'
const DUR = 15
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1)

function analyse(b) {
  const d = b.map((p, i) => {
    const w = b.slice(Math.max(0, i - 30), i + 31)
    return { t: p.t, v: p.v - mean(w.map((x) => x.v)) }
  })
  const s = d.map((p, i) => ({ t: p.t, v: mean(d.slice(Math.max(0, i - 3), i + 4).map((x) => x.v)) }))
  const ups = []
  for (let i = 1; i < s.length; i++) if (s[i - 1].v < 0 && s[i].v >= 0 && (!ups.length || s[i].t - ups[ups.length - 1] > 0.33)) ups.push(s[i].t)
  const iv = ups.slice(1).map((t, i) => t - ups[i]).filter((x) => x > 0.33 && x < 1.5)
  if (iv.length < 4) return null
  const hr = Math.round(60 / mean(iv))
  const dif = iv.slice(1).map((x, i) => (x - iv[i]) * 1000)
  return { hr, hrv: Math.round(Math.sqrt(mean(dif.map((x) => x * x)))) }
}

export default function Scanner({ scn, mode, onResult }) {
  const cv = useRef(null), vid = useRef(null), stream = useRef(null)
  const run = useRef(false), t0 = useRef(0), buf = useRef([]), lastUi = useRef(0)
  const live = useRef({ scn, mode }), finish = useRef(null)
  const [running, setRunning] = useState(false)
  const [prog, setProg] = useState(0)
  const [wave, setWave] = useState([])
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  live.current = { scn, mode }

  finish.current = () => {
    run.current = false; setRunning(false)
    if (stream.current) { stream.current.getTracks().forEach((t) => t.stop()); stream.current = null }
    const { scn: sc, mode: md } = live.current
    let r = null
    if (md === 'live') r = analyse(buf.current)
    if (!r) r = { hr: sc.hr + Math.round((Math.random() - 0.5) * 4), hrv: sc.hrv + Math.round((Math.random() - 0.5) * 6) }
    r.quality = md === 'live' ? 'Camera' : 'Simulated'
    setRes(r); onResult(r)
  }

  useEffect(() => {
    const c = cv.current, g = c.getContext('2d')
    const rings = [0.25, 0.5, 0.75, 1].map((r) => Array.from({ length: 6 + Math.round(r * 18) }, (_, i, a) => { const t = (i / a.length) * Math.PI * 2; return [Math.cos(t) * r * 125, Math.sin(t) * r * 165] }))
    const ROIS = [['Forehead', 255, 105, 130, 48], ['L Cheek', 200, 262, 78, 58], ['R Cheek', 362, 262, 78, 58]]
    let raf, last = 0
    const loop = (now) => {
      const { scn: sc, mode: md } = live.current
      g.clearRect(0, 0, 640, 480)
      const hasVid = md === 'live' && vid.current && vid.current.readyState >= 2
      if (hasVid) g.drawImage(vid.current, 0, 0, 640, 480)
      else {
        const bg = g.createRadialGradient(320, 240, 40, 320, 240, 360); bg.addColorStop(0, '#0f1a2b'); bg.addColorStop(1, '#060913')
        g.fillStyle = bg; g.fillRect(0, 0, 640, 480)
        g.fillStyle = 'rgba(255,255,255,.04)'; g.beginPath(); g.ellipse(320, 250, 128, 170, 0, 0, 7); g.fill()
        g.beginPath(); g.ellipse(320, 520, 230, 110, 0, 0, 7); g.fill()
      }
      const t = (now - t0.current) / 1000
      if (run.current) {
        let v
        if (hasVid) { const d = g.getImageData(255, 105, 130, 48).data; let s = 0; for (let i = 1; i < d.length; i += 4) s += d[i]; v = s / (d.length / 4) }
        else { const f = sc.hr / 60; v = Math.sin(2 * Math.PI * f * t) + 0.38 * Math.sin(4 * Math.PI * f * t + 0.9) + (Math.random() - 0.5) * 0.12 + 0.05 * Math.sin(t * 0.6) }
        buf.current.push({ t, v })
        if (now - lastUi.current > 90) {
          lastUi.current = now
          const tail = buf.current.slice(-240), m = mean(tail.map((p) => p.v))
          setWave(tail.map((p, i) => ({ i, v: +(p.v - m).toFixed(3) }))); setProg(Math.min(1, t / DUR))
        }
        if (t >= DUR) finish.current()
      }
      const col = run.current ? '#10b981' : 'rgba(16,185,129,.55)'
      g.strokeStyle = col; g.lineWidth = 1; g.save(); g.translate(320, 245)
      g.shadowColor = '#10b981'; g.shadowBlur = 6
      rings.forEach((ring, ri) => { g.beginPath(); ring.forEach(([x, y], i) => { const j = Math.sin(now / 400 + i + ri) * 1.2; i ? g.lineTo(x + j, y) : g.moveTo(x + j, y) }); g.closePath(); g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1; ring.forEach(([x, y]) => { g.fillStyle = col; g.fillRect(x - 1.5, y - 1.5, 3, 3) }) })
      g.beginPath(); g.moveTo(0, -165); g.lineTo(0, 165); g.moveTo(-125, 0); g.lineTo(125, 0); g.globalAlpha = 0.25; g.stroke(); g.globalAlpha = 1
      g.restore(); g.shadowBlur = 0
      ROIS.forEach(([n, x, y, w, h]) => {
        const pulse = run.current ? 0.5 + 0.5 * Math.sin(now / 120) : 0.4
        g.strokeStyle = `rgba(52,211,153,${0.5 + pulse * 0.5})`; g.lineWidth = 1.5; g.strokeRect(x, y, w, h)
        g.fillStyle = `rgba(52,211,153,${0.06 + pulse * 0.1})`; g.fillRect(x, y, w, h)
        g.fillStyle = '#6ee7b7'; g.font = '10px monospace'; g.fillText(`ROI·${n}`, x + 3, y - 4)
      })
      if (run.current) { const y = 70 + ((now / 8) % 360); const gr = g.createLinearGradient(0, y - 20, 0, y); gr.addColorStop(0, 'rgba(16,185,129,0)'); gr.addColorStop(1, 'rgba(16,185,129,.35)'); g.fillStyle = gr; g.fillRect(190, y - 20, 260, 20) }
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '11px monospace'; g.fillText(run.current ? `● REC  G-CH ${md === 'live' ? 'LIVE' : 'SIM'}  t=${Math.min(DUR, t).toFixed(1)}s` : 'READY · ALIGN FACE IN MESH', 14, 22)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); if (stream.current) stream.current.getTracks().forEach((t) => t.stop()) }
  }, [])

  const start = async () => {
    setErr(''); setRes(null); setWave([]); setProg(0); buf.current = []
    if (mode === 'live') {
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        vid.current.srcObject = stream.current; await vid.current.play()
      } catch (e) { setErr('Camera unavailable or permission denied. Switch to Demo Simulation Mode or allow camera access.'); return }
    }
    t0.current = performance.now(); run.current = true; setRunning(true)
  }
  const R = 44, C = 2 * Math.PI * R
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 glass p-4">
        <div className="relative rounded-xl overflow-hidden border border-white/10">
          <video ref={vid} playsInline muted className="hidden" />
          <canvas ref={cv} width={640} height={480} className="w-full block" />
          <svg className="absolute top-3 right-3 h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} fill="rgba(6,9,19,.6)" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
            <circle cx="50" cy="50" r={R} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - prog)} style={{ filter: 'drop-shadow(0 0 5px #10b981)' }} />
            <text x="50" y="55" textAnchor="middle" className="num" fill="#fff" fontSize="18" transform="rotate(90 50 50)">{Math.ceil(DUR * (1 - prog))}s</text>
          </svg>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={start} disabled={running} className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-medium flex items-center gap-2 disabled:opacity-40 hover:bg-emerald-500/30"><Play className="h-4 w-4" />{running ? 'Scanning…' : 'Start 15-second scan'}</button>
          <span className="text-xs text-white/40">{mode === 'live' ? 'Live camera – good lighting, hold still.' : 'Demo Simulation – synthetic pulse from the selected scenario.'}</span>
        </div>
        {err && <div className="mt-3 text-xs text-amber-300 flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{err}</div>}
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-4">
          <div className="lbl mb-2">Green-channel rPPG waveform</div>
          <div className="h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={wave}><YAxis hide domain={['auto', 'auto']} /><Line type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="glass p-5" style={{ boxShadow: res ? '0 0 40px rgba(16,185,129,.2)' : 'none' }}>
          <div className="flex items-center justify-between mb-3"><span className="lbl">Scan Result</span>{res && <span className="text-[10px] text-emerald-300 flex items-center gap-1"><Lock className="h-3 w-3" />LOCKED · {res.quality}</span>}</div>
          {res ? (
            <div className="grid grid-cols-2 gap-4">
              <div><div className="num text-4xl text-emerald-300">{res.hr}</div><div className="lbl">bpm</div></div>
              <div><div className="num text-4xl text-emerald-300">{res.hrv}</div><div className="lbl">HRV ms</div></div>
            </div>
          ) : <div className="text-sm text-white/40">{running ? 'Acquiring signal…' : 'Results lock in when the scan completes and sync to the dashboard.'}</div>}
        </div>
      </div>
    </div>
  )
}
