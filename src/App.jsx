import { useState, useEffect, useMemo } from 'react'
import { LayoutDashboard, ScanFace, AudioLines, Siren } from 'lucide-react'
import { SCENARIOS, DEFAULT_THRESHOLDS } from './data/presets'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Scanner from './components/Scanner'
import VoiceLab from './components/VoiceLab'
import Triage from './components/Triage'
const NAV = [['dash', 'Command Dashboard', LayoutDashboard], ['scan', 'rPPG Vitals Scanner', ScanFace], ['voice', 'Vocal Biomarker Lab', AudioLines], ['triage', 'Triage & ER Packet', Siren]]
export default function App() {
  const [view, setView] = useState('dash')
  const [sid, setSid] = useState('healthy')
  const [mode, setMode] = useState('demo')
  const [th, setTh] = useState(DEFAULT_THRESHOLDS)
  const [scan, setScan] = useState(null)
  const [voice, setVoice] = useState(null)
  const [tick, setTick] = useState(0)
  const scn = SCENARIOS[sid]
  useEffect(() => { setScan(null); setVoice(null) }, [sid])
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(i) }, [])
  const v = useMemo(() => {
    const w = (x, a, s) => Math.round(x + Math.sin(tick * 1.3 + s) * a)
    return { hr: w(scan ? scan.hr : scn.hr, 1.5, 0), hrv: w(scan ? scan.hrv : scn.hrv, 1.5, 1), sys: w(scn.sys, 1.5, 2), dia: w(scn.dia, 1, 3), edema: w(voice ? voice.edema : scn.edema, 1, 4), risk: Math.max(0, Math.min(100, w(scn.risk, 1, 5))) }
  }, [tick, scn, scan, voice])
  return (
    <div className="min-h-screen flex flex-col">
      <Header sid={sid} setSid={setSid} mode={mode} setMode={setMode} />
      <div className="flex flex-1 flex-col md:flex-row">
        <nav className="md:w-60 shrink-0 p-4 md:border-r border-white/10 flex md:flex-col gap-2 overflow-x-auto">
          {NAV.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setView(k)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm whitespace-nowrap transition ${view === k ? 'bg-white/10 text-white border border-white/15' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}><Icon className="h-4 w-4 text-emerald-400" />{label}</button>
          ))}
          <div className="hidden md:block mt-auto text-[10px] text-white/30 leading-relaxed pt-6">Prototype for demonstration. Not a diagnostic or medical device. Simulated data in Demo Mode.</div>
        </nav>
        <main className="flex-1 p-6 min-w-0">
          {view === 'dash' && <Dashboard v={v} th={th} setTh={setTh} scn={scn} />}
          {view === 'scan' && <Scanner scn={scn} mode={mode} onResult={setScan} />}
          {view === 'voice' && <VoiceLab scn={scn} mode={mode} onResult={setVoice} />}
          {view === 'triage' && <Triage v={v} th={th} scn={scn} />}
        </main>
      </div>
    </div>
  )
}
