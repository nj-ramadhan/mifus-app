// src/components/DeviceStatusCard.jsx
import React from 'react';

export default function DeviceStatusCard({ device }) {
  const percentage = Number(device?.percentage) ?? 100;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const currentVolume = Number(device?.current_volume) ?? 500;
  const totalVolume = Number(device?.total_volume_prescribed) || 500;
  const flowRate = Number(device?.flow_rate) || 0;
  const battery = Number(device?.battery_level) ?? 100;
  const isNormal = (device?.status || 'Normal').toLowerCase() === 'normal';

  // Perhitungan ketinggian cairan SVG tabung (Rongga dalam: Y dasar = 160, Y atas = 24, total tinggi = 136px)
  const cavityBottomY = 160;
  const cavityTotalHeight = 136;
  const liquidHeight = (clampedPercentage / 100) * cavityTotalHeight;
  const liquidY = cavityBottomY - liquidHeight;

  // Warna cairan: Cyan bawaan Mifus (#00e5ff), berubah jika kritis/warning
  const fluidColor =
    clampedPercentage <= 10
      ? '#ef4444' // Merah kritis
      : clampedPercentage <= 20
      ? '#f59e0b' // Kuning warning
      : '#00e5ff'; // Cyan khas Mifus

  // Estimasi waktu habis
  const calculateTimeToEmpty = () => {
    if (flowRate <= 0 || currentVolume <= 0) return '-';
    const totalSecs = currentVolume / flowRate;
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-600/70 p-6 shadow-sm max-w-[390px] w-full font-sans text-slate-800">
      {/* 1. Header Card */}
      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
        <span className="tracking-wide">{device?.device_id || 'MF001'}</span>
        <span className={`font-bold ${isNormal ? 'text-emerald-600' : 'text-rose-600'}`}>
          {device?.status || 'Normal'}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-1">
        {device?.patient_name || 'Pasien belum dialokasikan'}
      </h3>

      <p className="text-xs text-slate-400 mt-0.5">
        {device?.hospital_name || 'Rumah Sakit Demo MIFUS'} · {device?.room_number || 'A001'} / {device?.bed_number || '1'}
      </p>

      {/* Progress Bar Horizontal */}
      <div className="w-full bg-slate-100 h-2 rounded-full my-4 overflow-hidden">
        <div
          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      {/* 2. Visual Tabung & Selang Terhubung (Kiri) + Parameter (Kanan) */}
      <div className="flex items-start gap-5 py-2">
        
        {/* Kolom Kiri: Tabung Bersambung Pas ke Selang */}
        <div className="flex flex-col items-center w-16 flex-shrink-0 select-none">
          
          {/* A. SVG Tabung Infus (Skala Pas & Presisi) */}
          <div className="relative w-14 h-28 flex items-center justify-center">
            <svg viewBox="0 0 140 180" className="w-full h-full overflow-visible">
              <defs>
                {/* Mask rongga dalam tabung */}
                <clipPath id={`cavity-${device?.device_id || 'default'}`}>
                  <path d="M 40,24 C 40,16 100,16 100,24 L 100,135 C 100,146 84,147 84,152 L 84,162 L 56,162 L 56,152 C 56,147 40,146 40,135 Z" />
                </clipPath>
              </defs>

              {/* Background Rongga Kosong */}
              <path
                d="M 40,24 C 40,16 100,16 100,24 L 100,135 C 100,146 84,147 84,152 L 84,162 L 56,162 L 56,152 C 56,147 40,146 40,135 Z"
                fill="#f8fafc"
              />

              {/* Cairan Dinamis */}
              <g clipPath={`url(#cavity-${device?.device_id || 'default'})`}>
                <rect
                  x="30"
                  y={liquidY}
                  width="80"
                  height={liquidHeight + 10}
                  fill={fluidColor}
                  className="transition-all duration-700 ease-out"
                />
              </g>

              {/* Outline Tabung Hitam Tebal Sesuai Desain Mifus */}
              <path
                d="M 40,24 C 40,12 100,12 100,24 L 100,135 C 100,148 85,148 85,152 L 85,163 L 55,163 L 55,152 C 55,148 40,148 40,135 Z"
                fill="none"
                stroke="#000000"
                strokeWidth="7"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* B. Selang & Drip Chamber yang Menyatu ke Mulut Bawah Tabung */}
          <div className="relative w-12 h-28 -mt-1 flex items-center justify-center">
            <img
              src="/infus_selang.png"
              alt="Selang Infus"
              className="w-full h-full object-contain pointer-events-none"
            />
            {/* Animasi tetesan jika mengalir */}
            {flowRate > 0 && clampedPercentage > 0 && (
              <span className="absolute top-[46%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping pointer-events-none" />
            )}
          </div>
        </div>

        {/* Kolom Kanan: Seluruh Parameter Berderet Rapi ke Bawah */}
        <div className="flex-1 space-y-4 pt-1">
          {/* Grup 1: Terkait Tabung */}
          <div className="space-y-1.5 pb-3 border-b border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium underline underline-offset-4 decoration-slate-300">Isi Labu</span>
              <span className="font-extrabold text-slate-800">{clampedPercentage}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium underline underline-offset-4 decoration-slate-300">Sisa Volume</span>
              <span className="font-bold text-slate-800">{currentVolume} / {totalVolume} mL</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Estimasi Habis</span>
              <span className="font-bold text-slate-800">{calculateTimeToEmpty()}</span>
            </div>
          </div>

          {/* Grup 2: Terkait Selang / Aliran */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Flow Rate</span>
              <span className="font-bold text-slate-800">{flowRate} mL/s</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Rata-rata</span>
              <span className="font-bold text-slate-800">{flowRate} mL/s</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Status Aliran</span>
              <span className={`font-bold ${flowRate > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                {flowRate > 0 ? 'Mengalir Normal' : 'Terhenti'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Footer Ringkasan Bawah */}
      <div className="pt-4 mt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1.5">
        <div className="flex justify-between">
          <span>Sisa cairan</span>
          <span className="font-black text-slate-800">{currentVolume} mL ({clampedPercentage}%)</span>
        </div>
        <div className="flex justify-between">
          <span>Flow rate</span>
          <span className="font-black text-slate-800">{flowRate} mL/s</span>
        </div>
        <div className="flex justify-between">
          <span>Baterai</span>
          <span className="font-black text-slate-800">{battery}%</span>
        </div>
      </div>
    </div>
  );
}