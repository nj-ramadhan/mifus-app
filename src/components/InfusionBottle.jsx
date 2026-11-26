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
}) {
  // 1. Pastikan nilai persentase berupa angka valid antara 0 - 100
  const numPercentage = Number(percentage) || 0;
  const clampedPercentage = Math.min(Math.max(numPercentage, 0), 100);

  // 2. Warna cairan berdasarkan status klinis Mifus
  const getFluidColors = () => {
    switch (status) {
      case 'critical':
        return {
          fill: '#ef4444',      // Red / Rose
          glow: 'rgba(239, 68, 68, 0.4)',
          text: 'text-rose-600',
          badge: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
        };
      case 'warning':
        return {
          fill: '#f59e0b',      // Amber / Yellow
          glow: 'rgba(245, 158, 11, 0.4)',
          text: 'text-amber-600',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'normal':
      default:
        return {
          fill: '#00e5ff',      // Cyan khas asli Mifus
          glow: 'rgba(0, 229, 255, 0.4)',
          text: 'text-cyan-600',
          badge: 'bg-slate-900 text-cyan-400 border-slate-800',
        };
    }
  };

  const colors = getFluidColors();

  // 3. Perhitungan geometri koordinat tabung (sesuai infus_tabung.png: 140 x 180)
  // Dasar rongga cairan: Y = 160, Puncak rongga: Y = 20 (Tinggi total rongga = 140px)
  const cavityBottomY = 160;
  const cavityTotalHeight = 140;
  const liquidHeight = (clampedPercentage / 100) * cavityTotalHeight;
  const liquidY = cavityBottomY - liquidHeight;

  // 4. Estimasi waktu habis
  const getEstimateTime = () => {
    const numVol = Number(volume) || 0;
    const numRate = Number(flowRate) || 0;
    if (numRate <= 0 || numVol <= 0) return 'Terhenti';
    const totalSeconds = numVol / numRate;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}j ${minutes}m` : `${minutes} mnt`;
  };

  return (
    <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm">
      {/* Visual Tabung Infus Vektor Presisi */}
      <div className="flex flex-col items-center justify-center flex-shrink-0 relative w-16 h-16">
        <svg
          viewBox="0 0 140 180"
          className="w-28 h-36 drop-shadow-md select-none"
        >
          <defs>
            {/* Mask rongga dalam tabung agar cairan terpotong rapi mengikuti lekukan */}
            <clipPath id="mifusBottleInnerCavity">
              <path
                d="M 40,24 
                   C 40,16 100,16 100,24 
                   L 100,135 
                   C 100,146 84,147 84,152 
                   L 84,162 
                   L 56,162 
                   L 56,152 
                   C 56,147 40,146 40,135 
                   Z"
              />
            </clipPath>

            {/* Efek gradasi cairan */}
            <linearGradient id="fluidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.fill} stopOpacity="0.8" />
              <stop offset="100%" stopColor={colors.fill} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* LAYER 1: Background Rongga Kosong */}
          <path
            d="M 40,24 C 40,16 100,16 100,24 L 100,135 C 100,146 84,147 84,152 L 84,162 L 56,162 L 56,152 C 56,147 40,146 40,135 Z"
            fill="#f8fafc"
          />

          {/* LAYER 2: Cairan Dinamis (Dipotong oleh clipPath rongga tabung) */}
          <g clipPath="url(#mifusBottleInnerCavity)">
            <rect
              x="30"
              y={liquidY}
              width="80"
              height={liquidHeight + 10}
              fill="url(#fluidGradient)"
              className="transition-all duration-700 ease-out"
            />
            {/* Permukaan gelombang/meniskus cairan */}
            {clampedPercentage > 0 && clampedPercentage < 100 && (
              <ellipse
                cx="70"
                cy={liquidY}
                rx="30"
                ry="3"
                fill="#ffffff"
                opacity="0.4"
                className="transition-all duration-700 ease-out"
              />
            )}
          </g>

          {/* LAYER 3: Garis Skala Pengukur (Graduation Marks) */}
          <g stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
            <line x1="42" y1="52" x2="52" y2="52" />
            <line x1="42" y1="80" x2="48" y2="80" />
            <line x1="42" y1="108" x2="52" y2="108" />
            <line x1="42" y1="136" x2="48" y2="136" />
          </g>

          {/* LAYER 4: Garis Luar (Outline Tabung Asli Mifus) */}
          <path
            d="M 40,24 
               C 40,12 100,12 100,24 
               L 100,135 
               C 100,148 85,148 85,152 
               L 85,163 
               L 55,163 
               L 55,152 
               C 55,148 40,148 40,135 
               Z"
            fill="none"
            stroke="#000000"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Rincian Parameter Klinis */}
      {showDetails && (
        <div className="flex flex-col items-left justify-left flex-shrink-0">
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium text-xs">Isi Labu</span>
                    <span className="font-extrabold text-slate-800 text-base">{clampedPercentage}%</span>
                </div>
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-medium text-xs">Sisa Volume</span>
                    <span className="font-bold text-slate-800">
                    {volume} <span className="text-xs font-normal text-slate-400">/ {totalCapacity} mL</span>
                    </span>
                </div>
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-400 font-medium text-xs">Estimasi Habis</span>
                    <span className={`text-xs font-bold ${colors.text}`}>
                    {getEstimateTime()}
                    </span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}