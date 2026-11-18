import { useMemo, useState, useEffect } from 'react'
import { Siren, Download, Printer, Check, Loader2, FileJson, FileText } from 'lucide-react'
import { RED_FLAGS, statusOf } from '../data/presets'
const STEPS = ['Alert created & risk packet signed', 'FHIR bundle transmitted to OB-GYN on-call', 'On-call obstetrician acknowledged', 'ER charge nurse notified – bed & magnesium protocol prepped', 'Transport / tele-visit window confirmed']
export default function Triage({ v, th, scn }) {
  const [flags, setFlags] = useState({})
  const [tab, setTab] = useState('json')
  const [step, setStep] = useState(-1)
  const st = statusOf(v.risk)
  const n = Object.values(flags).filter(Boolean).length
  const urgent = v.risk >= th.risk || v.sys >= th.sys || n >= 2
  useEffect(() => { if (step >= 0 && step < STEPS.length) { const t = setTimeout(() => setStep(step + 1), 1300); return () => clearTimeout(t) } }, [step])
  const bundle = useMemo(() => {
    const now = new Date().toISOString()
    const obs = (id, code, display, value, unit) => ({ resource: { resourceType: 'Observation', id, status: 'preliminary', code: { coding: [{ system: 'http://loinc.org', code, display }] }, subject: { reference: 'Patient/sp-demo-001' }, effectiveDateTime: now, valueQuantity: { value, unit, system: 'http://unitsofmeasure.org' } } })
    return {
      resourceType: 'Bundle', type: 'collection', timestamp: now,
      entry: [
        { resource: { resourceType: 'Patient', id: 'sp-demo-001', name: [{ text: 'Demo Patient' }], gender: 'female' } },
        obs('hr', '8867-4', 'Heart rate', v.hr, 'beats/min'),
        obs('hrv', '80404-7', 'R-R interval standard deviation (HRV)', v.hrv, 'ms'),
        obs('sys', '8480-6', 'Systolic blood pressure (estimated)', v.sys, 'mm[Hg]'),
        obs('dia', '8462-4', 'Diastolic blood pressure (estimated)', v.dia, 'mm[Hg]'),
        { resource: { resourceType: 'RiskAssessment', id: 'sp-risk', status: 'preliminary', subject: { reference: 'Patient/sp-demo-001' }, occurrenceDateTime: now, method: { text: 'SilentPulse rPPG + vocal biomarker fusion (prototype)' }, prediction: [{ outcome: { text: 'Preeclampsia / postpartum hemorrhage risk' }, probabilityDecimal: +(v.risk / 100).toFixed(2), qualitativeRisk: { text: st.label } }], note: [{ text: `Vocal edema index ${v.edema}/100. Red flags: ${RED_FLAGS.filter((f) => flags[f.id]).map((f) => f.label).join('; ') || 'none reported'}.` }] } }
      ]
    }
  }, [v.hr, v.hrv, v.sys, v.dia, v.risk, v.edema, flags])
  const json = JSON.stringify(bundle, null, 2)
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/fhir+json' })); a.download = 'silentpulse-er-packet.json'; a.click() }
  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-5">
          <div className="lbl mb-3">Red-flag symptom checklist</div>
          <div className="space-y-2">
            {RED_FLAGS.map((f) => (
              <button key={f.id} onClick={() => setFlags({ ...flags, [f.id]: !flags[f.id] })} className={`w-full flex items-center gap-3 text-left text-sm px-3 py-2.5 rounded-lg border transition ${flags[f.id] ? 'border-red-400/50 bg-red-500/10 text-red-200' : 'border-white/10 bg-white/[.03] text-white/70'}`}>
                <span className={`h-4 w-4 rounded grid place-items-center border ${flags[f.id] ? 'bg-red-500 border-red-500' : 'border-white/30'}`}>{flags[f.id] && <Check className="h-3 w-3 text-white" />}</span>{f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="glass p-5" style={{ boxShadow: urgent ? '0 0 40px rgba(239,68,68,.2)' : 'none', borderColor: urgent ? 'rgba(239,68,68,.4)' : undefined }}>
          <div className="flex items-center justify-between"><span className="lbl">Triage status</span><span className="num text-xs px-2 py-0.5 rounded" style={{ color: urgent ? '#ef4444' : st.hex, background: 'rgba(255,255,255,.05)' }}>{urgent ? 'URGENT' : st.label}</span></div>
          <p className="text-xs text-white/50 mt-2">{urgent ? 'Thresholds exceeded or ≥2 red flags. Immediate obstetric review recommended.' : 'No urgent criteria met. Continue monitoring.'}</p>
          <button disabled={step >= 0} onClick={() => setStep(0)} className="mt-4 w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-red-500/20 border border-red-400/50 text-red-200 hover:bg-red-500/30 disabled:opacity-50" style={{ boxShadow: step < 0 && urgent ? '0 0 24px rgba(239,68,68,.35)' : 'none' }}><Siren className="h-4 w-4" />Dispatch Urgent OB-GYN Alert</button>
          {step >= 0 && (
            <ol className="mt-5 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className={`flex items-center gap-3 text-xs ${i <= step ? 'text-white' : 'text-white/30'}`}>
                  <span className={`h-5 w-5 rounded-full grid place-items-center border ${i < step ? 'bg-emerald-500 border-emerald-500' : i === step ? 'border-amber-400' : 'border-white/20'}`}>{i < step ? <Check className="h-3 w-3 text-black" /> : i === step ? <Loader2 className="h-3 w-3 text-amber-400 animate-spin" /> : null}</span>{s}
                </li>
              ))}
              {step >= STEPS.length && <div className="text-xs text-emerald-300 pt-1">Alert complete (simulated workflow – no real clinician contacted).</div>}
            </ol>
          )}
        </div>
      </div>
      <div className="lg:col-span-3 glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 text-xs glass p-1">
            <button onClick={() => setTab('json')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'json' ? 'bg-white/10' : 'text-white/50'}`}><FileJson className="h-3.5 w-3.5" />FHIR JSON</button>
            <button onClick={() => setTab('pdf')} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${tab === 'pdf' ? 'bg-white/10' : 'text-white/50'}`}><FileText className="h-3.5 w-3.5" />PDF Preview</button>
          </div>
          <div className="flex gap-2 text-xs">
            <button onClick={download} className="px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Download</button>
            <button onClick={() => { setTab('pdf'); setTimeout(() => window.print(), 100) }} className="px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 flex items-center gap-1.5"><Printer className="h-3.5 w-3.5" />Print / PDF</button>
          </div>
        </div>
        {tab === 'json' ? (
          <pre className="num text-[11px] leading-relaxed text-emerald-200/90 bg-black/30 rounded-xl border border-white/10 p-4 overflow-auto max-h-[560px]">{json}</pre>
        ) : (
          <div id="pdf-sheet" className="bg-white text-slate-900 rounded-xl p-8 max-h-[560px] overflow-auto text-sm">
            <div className="flex justify-between border-b border-slate-300 pb-3 mb-4"><div><div className="text-lg font-bold">SilentPulse ER Transfer Packet</div><div className="text-xs text-slate-500">Prototype – not a medical device</div></div><div className="text-right text-xs text-slate-500">{new Date().toLocaleString()}<br />Scenario: {scn.label}</div></div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Risk Index', `${v.risk}/100 (${st.label})`], ['Heart Rate', `${v.hr} bpm`], ['HRV', `${v.hrv} ms`], ['Est. BP', `${v.sys}/${v.dia} mmHg`], ['Vocal Edema', `${v.edema}/100`], ['Patient', 'Demo Patient · sp-demo-001']].map(([a, b]) => <div key={a} className="border border-slate-200 rounded p-2"><div className="text-[10px] uppercase text-slate-500">{a}</div><div className="font-semibold">{b}</div></div>)}
            </div>
            <div className="font-semibold mb-1">Reported red flags</div>
            <ul className="list-disc ml-5 mb-4">{RED_FLAGS.filter((f) => flags[f.id]).map((f) => <li key={f.id}>{f.label}</li>)}{n === 0 && <li>None reported</li>}</ul>
            <div className="font-semibold mb-1">Recommendation</div>
            <p>{urgent ? 'Urgent obstetric evaluation; assess BP, urine protein, and labs for preeclampsia / HELLP; evaluate for postpartum hemorrhage if bleeding.' : 'Routine monitoring; repeat screening within 24 hours or sooner if symptoms develop.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
