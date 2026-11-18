import { HeartPulse, Camera, FlaskConical } from 'lucide-react'
import { SCENARIOS } from '../data/presets'
export default function Header({ sid, setSid, mode, setMode }) {
  return (
    <header className="flex flex-wrap items-center gap-4 justify-between px-6 py-4 border-b border-white/10 bg-obsidian/70 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl grid place-items-center bg-emerald-500/15 border border-emerald-400/30 shadow-[0_0_24px_rgba(16,185,129,.35)]"><HeartPulse className="h-5 w-5 text-emerald-400" /></div>
        <div><div className="font-semibold tracking-tight">SilentPulse</div><div className="lbl">Zero-hardware maternal early warning</div></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass p-1 flex text-xs">
          {Object.entries(SCENARIOS).map(([k, s]) => (
            <button key={k} onClick={() => setSid(k)} className={`px-3 py-1.5 rounded-lg transition ${sid === k ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>{s.label}</button>
          ))}
        </div>
        <div className="glass p-1 flex text-xs">
          <button onClick={() => setMode('demo')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${mode === 'demo' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/50'}`}><FlaskConical className="h-3.5 w-3.5" />Demo Simulation Mode</button>
          <button onClick={() => setMode('live')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${mode === 'live' ? 'bg-sky-500/20 text-sky-300' : 'text-white/50'}`}><Camera className="h-3.5 w-3.5" />Live Hardware Mode</button>
        </div>
      </div>
    </header>
  )
}
