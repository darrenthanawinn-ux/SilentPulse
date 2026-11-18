export default function Gauge({ value, color, label }) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <svg viewBox="0 0 220 128" className="w-full">
        <path d="M20 110 A90 90 0 0 1 200 110" pathLength="100" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" strokeLinecap="round" />
        <path d="M20 110 A90 90 0 0 1 200 110" pathLength="100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${value} 100`} style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'all .8s ease' }} />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="num text-5xl font-semibold" style={{ color, textShadow: `0 0 24px ${color}66` }}>{value}</div>
        <div className="lbl mt-1" style={{ color }}>{label}</div>
      </div>
    </div>
  )
}
