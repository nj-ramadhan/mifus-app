// components/InfusionBottle.jsx
export default function InfusionBottle({ percentage = 100, volume = 500, flowRate = 0, status = 'normal' }) {
  // Tentukan warna cairan berdasarkan status kondisi
  const fluidColor =
    status === 'critical'
      ? 'from-rose-500 to-rose-600 border-rose-400'
      : status === 'warning'
      ? 'from-amber-400 to-amber-500 border-amber-300'
      : 'from-sky-400 to-blue-500 border-sky-300';

  const isFlowing = flowRate > 0 && percentage > 0;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      {/* Gantungan Labu Infus */}
      <div className="w-8 h-3 border-2 border-slate-300 rounded-t-full border-b-0 mb-0.5"></div>

      {/* Badan Labu Infus */}
      <div className="relative w-24 h-48 bg-slate-100/80 rounded-2xl border-2 border-slate-300 shadow-inner flex flex-col justify-end overflow-hidden">
        {/* Garis Skala Ukur (Graduation Marks) */}
        <div className="absolute inset-y-2 left-2 flex flex-col justify-between text-[9px] font-mono text-slate-400 select-none z-10 pointer-events-none">
          <span>500</span>
          <span>400</span>
          <span>300</span>
          <span>200</span>
          <span>100</span>
        </div>

        {/* Level Cairan dengan Animasi Ketinggian */}
        <div
          className={`w-full bg-gradient-to-t ${fluidColor} transition-all duration-700 ease-in-out relative`}
          style={{ height: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        >
          {/* Efek Permukaan Meniskus Cairan */}
          <div className="w-full h-2 bg-white/30 absolute top-0 rounded-full animate-pulse"></div>
        </div>

        {/* Indikator Persentase Tengah */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm font-black px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-sm text-slate-800 shadow-sm">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Leher Botol / Drip Chamber (Ruang Tetes) */}
      <div className="w-6 h-8 bg-slate-200 border-x-2 border-b-2 border-slate-300 rounded-b-md relative flex flex-col items-center justify-between py-1">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
        
        {/* Animasi Tetesan Air */}
        {isFlowing ? (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        ) : (
          <div className="text-[8px] text-rose-500 font-bold">OFF</div>
        )}
      </div>

      {/* Selang Infus */}
      <div className="w-1 h-6 bg-slate-300"></div>
    </div>
  );
}