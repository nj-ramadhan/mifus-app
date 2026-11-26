// components/FlowRateWidget.jsx
export default function FlowRateWidget({ flowRate = 0, averageRate = 0 }) {
  const isFlowing = flowRate > 0;

  return (
    <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm">
      {/* Gambar Selang & Drip Chamber */}
      <div className="relative w-16 h-36 flex items-center justify-center flex-shrink-0">
        <img
          src="/infus_selang.png"
          alt="Visualisasi Selang Infus"
          className="w-full h-full object-contain pointer-events-none"
        />
        {/* Indikator Animasi Tetesan Aktif */}
        {isFlowing && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Rincian Parameter */}
      <div className="flex-1 space-y-2 text-sm">
        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-400 font-medium text-xs">Flow Rate</span>
          <span className="font-extrabold text-slate-800 text-base">{flowRate} <span className="text-xs font-normal text-slate-400">mL/s</span></span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-400 font-medium text-xs">Rata-rata</span>
          <span className="font-bold text-slate-700">{averageRate || flowRate} <span className="text-xs font-normal text-slate-400">mL/s</span></span>
        </div>
        <div className="flex justify-between items-center pt-0.5">
          <span className="text-slate-400 font-medium text-xs">Status Aliran</span>
          <span className={`text-xs font-bold ${isFlowing ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isFlowing ? 'Mengalir Normal' : 'Mampet / Terhenti'}
          </span>
        </div>
      </div>
    </div>
  );
}