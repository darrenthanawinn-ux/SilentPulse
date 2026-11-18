export const SCENARIOS = {
  healthy: { label: 'Healthy Baseline', hr: 72, hrv: 68, sys: 114, dia: 72, edema: 12, risk: 14, jitter: 0.38, shimmer: 2.1, hnr: 22.4, f0: 208, mfcc: [-212, 96, 14, 22, -6, 9] },
  early: { label: 'Early Preeclampsia Warning', hr: 88, hrv: 41, sys: 134, dia: 86, edema: 47, risk: 52, jitter: 0.82, shimmer: 4.6, hnr: 16.1, f0: 192, mfcc: [-238, 81, 6, 15, -12, 3] },
  critical: { label: 'Critical Hypertensive Spike', hr: 112, hrv: 22, sys: 168, dia: 108, edema: 81, risk: 91, jitter: 1.48, shimmer: 8.9, hnr: 9.3, f0: 171, mfcc: [-271, 62, -4, 7, -21, -8] }
}
export const DEFAULT_THRESHOLDS = { sys: 140, hrv: 30, edema: 60, risk: 70 }
export const statusOf = (risk) =>
  risk < 35 ? { key: 'stable', hex: '#10b981', label: 'STABLE' }
  : risk < 70 ? { key: 'elevated', hex: '#f59e0b', label: 'ELEVATED' }
  : { key: 'critical', hex: '#ef4444', label: 'CRITICAL' }
export const RED_FLAGS = [
  { id: 'headache', label: 'Severe or persistent headache' },
  { id: 'vision', label: 'Vision changes (blurring, spots, light sensitivity)' },
  { id: 'ruq', label: 'Upper-right abdominal pain' },
  { id: 'swelling', label: 'Sudden face / hand swelling' },
  { id: 'sob', label: 'Shortness of breath' },
  { id: 'bleed', label: 'Heavy bleeding (soaking >1 pad/hour)' }
]
export const PROMPT = 'The rainbow is a division of white light into many beautiful colors'
