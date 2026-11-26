// components/InfusionBottle.jsx
'use client';

import React from 'react';

export default function InfusionBottle({
  percentage = 100,
  volume = 500,
  totalCapacity = 500,
  flowRate = 0,
  status = 'normal',
  showDetails = true,
  imageSrc = '/infus_tabung.png', // Pastikan file berada di folder public/
}) {
  // Pastikan batas persentase antara 0% hingga 100%
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Warna cairan dinamis berdasarkan status triage klinis
  const getFluidColor = () => {
    switch (status) {
      case 'critical':
        return 'bg-gradient-to-t from-rose-600 to-rose-400';
      case 'warning':
        return 'bg-gradient-to-t from-amber-500 to-amber-300';
      case 'normal':
      default:
        // Warna Cyan khas asli Mifus (#00e5ff / sky blue)
        return 'bg-gradient-to-t from-cyan-500 to-sky-300';
    }
  };

  // Estimasi waktu habis cairan infus
  const getEstimateTime = () => {
    if (!flowRate || flowRate <= 0 || !volume || volume <= 0) return 'Tidak terdeteksi';
    const totalSeconds = volume / flowRate;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}j ${minutes}m` : `${minutes} menit`;
  };

  return (
    <div className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      {/* Container Ilustrasi Tabung */}
      <div className="relative w-28 h-40 flex items-center justify-center select-none flex-shrink-0">
        
        {/* Layer 1: Background Cairan Dinamis (Ditempatkan di dalam rongga tabung) */}
        <div 
          className="absolute rounded-t-[18px] rounded-b-[6px] overflow-hidden flex flex-col justify-end"
          style={{
            top: '10.5%',
            bottom: '18%',
            left: '25.8%',
            width: '48.4%',
          }}
        >
          {/* Level Cairan yang bergerak sesuai persentase */}
          <div
            className={`w-full transition-all duration-700 ease-out ${getFluidColor()} relative`}
            style={{ height: `${clampedPercentage}%` }}
          >
            {/* Animasi kilau meniskus permukaan air */}
            <div className="w-full h-1.5 bg-white/40 absolute top-0 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Layer 2: Gambar Asli infus_tabung.png (Sebagai Masking / Bingkai Luar) */}
        <img
          src={imageSrc}
          alt="Visualisasi Tabung Infus"
          className="relative z-10 w-full h-full object-contain pointer-events-none drop-shadow-sm"
          onError={(e) => {
            // Fallback elegan jika gambar belum disalin ke folder public
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Badge Persentase Melayang di Atas Tabung */}
        <div className="absolute z-20 bottom-1 flex items-center justify-center">
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm border ${
            status === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
            status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-slate-900 text-cyan-400 border-slate-800'
          }`}>
            {clampedPercentage}%
          </span>
        </div>
      </div>

      {/* Rincian Parameter Klinis (Mengikuti format Buku Panduan Mifus) */}
      {showDetails && (
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium text-xs">Isi Labu</span>
            <span className="font-extrabold text-slate-800 text-base">{clampedPercentage}%</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium text-xs">Sisa Volume</span>
            <span className="font-bold text-slate-800">
              {volume} <span className="text-xs font-normal text-slate-400">/ {totalCapacity} mL</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-400 font-medium text-xs">Laju Alir</span>
            <span className="font-bold text-slate-800">
              {flowRate} <span className="text-xs font-normal text-slate-400">mL/s</span>
            </span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-400 font-medium text-xs">Estimasi Habis</span>
            <span className={`text-xs font-bold ${
              status === 'critical' ? 'text-rose-600' : 'text-blue-600'
            }`}>
              {getEstimateTime()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}