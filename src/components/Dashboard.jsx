import { Heart, Activity, Gauge as GaugeIcon, Mic, ScanLine, Filter, Waves, ChevronRight } from 'lucide-react'
import Gauge from './Gauge'
import { statusOf } from '../data/presets'
function Vital({ icon: Icon, label, value, unit, note, bad, hex }) {
  const c = bad ? '#ef4444' : hex
  return (
    <div className="glass p-4" style={{ boxShadow: bad ? '0 0 32px rgba(239,68,68,.18)' : 'none', borderColor: bad ? 'rgba(239,68,68,.45)' : undefined }}>
      <div className="flex items-center justify-between"><span className="lbl">{label}</span><Icon className="h-4 w-4" style={{ color: c }} /></div>
      <div className="mt-3 flex items-baseline gap-1.5"><span className="num text-3xl font-semibold">{value}</span><span className="text-xs text-white/40">{unit}</span></div>
      <div className="mt-2 text-[11px]" style={{ color: bad ? '#fca5a5' : 'rgba(255,255,255,.45)' }}>{bad ? 'ABOVE CLINICAL THRESHOLD' : note}</div>
    </div>
  )
}
function Slider({ label, k, min, max, th, setTh, unit }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-white/60">{label}</span><span className="num text-emerald-300">{th[k]}{unit}</span></div>
      <input type="range" min={min} max={max} value={th[k]} onChange={(e) => setTh({ ...th, [k]: +e.target.value })} />
    </div>
  )
}
export default function Dashboard({ v, th, setTh, scn }) {
  const st = statusOf(v.risk)
  const steps = [
    { icon: ScanLine, t: 'ROI Extraction', d: 'Forehead + cheek skin ROIs tracked per frame; mean green-channel reflectance sampled at 30 fps.' },
    { icon: Filter, t: 'Bandpass Filter (0.7–4 Hz)', d: 'Butterworth band isolates 42–240 bpm cardiac band, rejecting motion and illumination drift.' },
    { icon: Waves, t: 'FFT + MFCC Fusion', d: 'Pulse spectrum peak + vocal MFCC / jitter / shimmer fused into a single maternal risk index.' }
  ]
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass p-6 lg:col-span-1" style={{ boxShadow: `0 0 60px ${st.hex}22` }}>
          <div className="lbl mb-4">Maternal Risk Index</div>
          <Gauge value={v.risk} color={st.hex} label={st.label} />
          <p className="text-xs text-white/50 mt-5 leading-relaxed">Scenario: <span className="text-white/80">{scn.label}</span>. Fused from optical pulse features, estimated BP trend and vocal edema markers for preeclampsia and postpartum hemorrhage screening.</p>
        </div>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <Vital icon={Heart} label="Heart Rate" value={v.hr} unit="bpm" note="rPPG pulse estimate" bad={v.hr > 110} hex="#10b981" />
          <Vital icon={Activity} label="HRV (RMSSD)" value={v.hrv} unit="ms" note="Autonomic balance" bad={v.hrv < th.hrv} hex="#10b981" />
          <Vital icon={GaugeIcon} label="Estimated BP Trend" value={`${v.sys}/${v.dia}`} unit="mmHg" note="Pulse-transit-time model" bad={v.sys >= th.sys} hex="#10b981" />
          <Vital icon={Mic} label="Vocal Edema Index" value={v.edema} unit="/100" note="Laryngeal fluid retention" bad={v.edema >= th.edema} hex="#10b981" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass p-6">
          <div className="lbl mb-4">Clinical Thresholds</div>
          <div className="space-y-4">
            <Slider label="Systolic alert" k="sys" min={120} max={180} th={th} setTh={setTh} unit=" mmHg" />
            <Slider label="HRV floor" k="hrv" min={10} max={60} th={th} setTh={setTh} unit=" ms" />
            <Slider label="Vocal edema alert" k="edema" min={20} max={90} th={th} setTh={setTh} unit="" />
            <Slider label="Dispatch risk index" k="risk" min={40} max={95} th={th} setTh={setTh} unit="" />
          </div>
        </div>
        <div className="glass p-6 lg:col-span-2">
          <div className="lbl mb-4">Signal Processing Pipeline</div>
          <div className="grid md:grid-cols-3 gap-3 items-stretch">
            {steps.map((s, i) => (
              <div key={s.t} className="relative rounded-xl border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium"><s.icon className="h-4 w-4" />{s.t}</div>
                <p className="text-[11px] text-white/50 mt-2 leading-relaxed">{s.d}</p>
                {i < 2 && <ChevronRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400/70 z-10" />}
              </div>
            ))}
          </div>
          <svg className="w-full h-6 mt-4" viewBox="0 0 400 24" preserveAspectRatio="none"><line x1="0" y1="12" x2="400" y2="12" stroke="#10b981" strokeWidth="2" className="flow" opacity=".7" /></svg>
          <div className="num text-[11px] text-white/40">fs = 30 Hz · band 0.7–4.0 Hz · FFT 512 pts · 13 MFCC · risk = f(HR, HRV, PTT-BP, edema)</div>
        </div>
      </div>
    </div>
  )
}
