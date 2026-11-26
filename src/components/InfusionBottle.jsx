// components/InfusionBottle.jsx
'use client';

import React from 'react';
import { Droplet, Activity, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function InfusionBottle({
  percentage = 100,
  volume = 500,
  totalCapacity = 500,
  flowRate = 0,
  status = 'normal',
}) {
  const numPercentage = Number(percentage) || 0;
  const clampedPercentage = Math.min(Math.max(numPercentage, 0), 100);
  const numFlowRate = Number(flowRate) || 0;
  const isFlowing = numFlowRate > 0 && clampedPercentage > 0;

  // Penentuan warna status klinis
  const getTheme = () => {
    switch (status) {
      case 'critical':
        return {
          fill: '#ef4444',
          badge: 'bg-rose-100 text-rose-700 border-rose-200',
          indicator: 'text-rose-600',
          pill: 'bg-rose-500',
        };
      case 'warning':
        return {
          fill: '#f59e0b',
          badge: 'bg-amber-100 text-amber-700 border-amber-200',
          indicator: 'text-amber-600',
          pill: 'bg-amber-500',
        };
      case 'normal':
      default:
        return {
          fill: '#00e5ff', // Khas Mifus Cyan
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          indicator: 'text-cyan-600',
          pill: 'bg-cyan-500',
        };
    }
  };

  const theme = getTheme();

  // Perhitungan ketinggian cairan tabung (Y=160 dasar, Y=20 puncak -> tinggi rongga 140)
  const cavityBottomY = 160;
  const cavityTotalHeight = 140;
  const liquidHeight = (clampedPercentage / 100) * cavityTotalHeight;
  const liquidY = cavityBottomY - liquidHeight;

  // Estimasi waktu habis
  const getEstimateTime = () => {
    if (numFlowRate <= 0 || volume <= 0) return 'Terhenti / Tidak Aktif';
    const totalSeconds = volume / numFlowRate;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row items-center gap-8 max-w-xl">
      
      {/* ========================================================= */}
      {/* 1. BAGIAN KIRI: Visual Aparatus Infus Proporsional (Tabung + Selang) */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center flex-shrink-0 select-none">
        
        {/* Gantungan Tiang Infus */}
        <div className="w-10 h-3 border-2 border-slate-300 rounded-t-full border-b-0"></div>

        {/* Tabung Infus Utama (Proporsi Lebar 120px) */}
        <div className="relative w-32 h-44 flex items-center justify-center">
          <svg viewBox="0 0 140 180" className="w-full h-full drop-shadow-sm">
            <defs>
              <clipPath id="innerCavityClip">
                <path d="M 40,24 C 40,16 100,16 100,24 L 100,135 C 100,146 84,147 84,152 L 84,162 L 56,162 L 56,152 C 56,147 40,146 40,135 Z" />
              </clipPath>
              <linearGradient id="fluidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.fill} stopOpacity="0.85" />
                <stop offset="100%" stopColor={theme.fill} stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Dasar Tabung Kosong */}
            <path
              d="M 40,24 C 40,16 100,16 100,24 L 100,135 C 100,146 84,147 84,152 L 84,162 L 56,162 L 56,152 C 56,147 40,146 40,135 Z"
              fill="#f8fafc"
            />

            {/* Cairan Dinamis */}
            <g clipPath="url(#innerCavityClip)">
              <rect
                x="30"
                y={liquidY}
                width="80"
                height={liquidHeight + 10}
                fill="url(#fluidGradient)"
                className="transition-all duration-700 ease-out"
              />
              {clampedPercentage > 0 && clampedPercentage < 100 && (
                <ellipse
                  cx="70"
                  cy={liquidY}
                  rx="30"
                  ry="3.5"
                  fill="#ffffff"
                  opacity="0.45"
                />
              )}
            </g>

            {/* Garis Skala Pengukur Volume */}
            <g stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
              <line x1="42" y1="52" x2="52" y2="52" />
              <line x1="42" y1="80" x2="48" y2="80" />
              <line x1="42" y1="108" x2="52" y2="108" />
              <line x1="42" y1="136" x2="48" y2="136" />
            </g>

            {/* Garis Kontur Luar Tabung */}
            <path
              d="M 40,24 C 40,12 100,12 100,24 L 100,135 C 100,148 85,148 85,152 L 85,163 L 55,163 L 55,152 C 55,148 40,148 40,135 Z"
              fill="none"
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Leher Penghubung */}
        <div className="w-3 h-2 bg-slate-400"></div>

        {/* Selang & Ruang Tetes / Drip Chamber (Proporsional terhadap Tabung) */}
        <div className="relative w-12 h-20 bg-slate-50 border-2 border-slate-700 rounded-b-xl rounded-t-sm flex flex-col items-center justify-between py-1 shadow-inner overflow-hidden">
          {/* Ujung penetes atas */}
          <div className="w-2 h-2.5 bg-slate-600 rounded-b-sm"></div>

          {/* Animasi tetesan jika mengalir */}
          {isFlowing ? (
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
          ) : (
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">OFF</span>
          )}

          {/* Genangan dasar ruang tetes */}
          <div className="w-full h-3 bg-cyan-400/80 rounded-b-lg"></div>
        </div>

        {/* Selang Pasien Menjuntai ke Bawah */}
        <div className="w-1.5 h-10 bg-slate-300"></div>
      </div>

      {/* ========================================================= */}
      {/* 2. BAGIAN KANAN: Deretan Parameter Kuantitatif ke Bawah   */}
      {/* ========================================================= */}
      <div className="flex-1 w-full space-y-3">
        
        {/* Parameter 1: Status & Persentase Sisa */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kapasitas Labu</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{clampedPercentage}%</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${theme.badge}`}>
            {status}
          </span>
        </div>

        {/* Parameter 2: Volume Cairan */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100/60 text-blue-600 flex-shrink-0">
            <Droplet size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sisa Volume</p>
            <p className="text-lg font-black text-slate-800">
              {volume} <span className="text-xs font-semibold text-slate-400">/ {totalCapacity} mL</span>
            </p>
          </div>
        </div>

        {/* Parameter 3: Laju Alir (Flow Rate) */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100/60 text-emerald-600 flex-shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laju Alir (*Flow Rate*)</p>
            <p className="text-lg font-black text-slate-800">
              {numFlowRate} <span className="text-xs font-semibold text-slate-400">mL/dtk</span>
            </p>
          </div>
        </div>

        {/* Parameter 4: Estimasi Waktu Habis */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100/60 text-amber-600 flex-shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimasi Waktu Habis</p>
            <p className={`text-sm font-black ${theme.indicator}`}>
              {getEstimateTime()}
            </p>
          </div>
        </div>

        {/* Parameter 5: Status Kondisi Saluran */}
        <div className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">Kondisi Aliran:</span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            {isFlowing ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-500" />
                Mengalir Normal
              </>
            ) : (
              <>
                <AlertCircle size={14} className="text-rose-500" />
                Aliran Terhenti
              </>
            )}
          </span>
        </div>

      </div>
    </div>
  );
}