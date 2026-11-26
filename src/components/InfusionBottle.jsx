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
  tabungSrc = '/infus_tabung.png', // File di folder public/infus_tabung.png
  selangSrc = '/infus_selang.png', // File di folder public/infus_selang.png
}) {
  const numPercentage = Number(percentage) || 0;
  const clampedPercentage = Math.min(Math.max(numPercentage, 0), 100);
  const numFlowRate = Number(flowRate) || 0;
  const isFlowing = numFlowRate > 0 && clampedPercentage > 0;

  // Warna dinamis indikator & cairan
  const getTheme = () => {
    switch (status) {
      case 'critical':
        return {
          fluidGradient: 'from-rose-600 to-rose-400',
          badge: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse',
          text: 'text-rose-600',
        };
      case 'warning':
        return {
          fluidGradient: 'from-amber-500 to-amber-300',
          badge: 'bg-amber-100 text-amber-700 border-amber-200',
          text: 'text-amber-600',
        };
      case 'normal':
      default:
        return {
          // Warna Cyan khas bawaan Mifus
          fluidGradient: 'from-cyan-500 to-sky-300',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          text: 'text-cyan-600',
        };
    }
  };

  const theme = getTheme();

  // Estimasi waktu habis
  const getEstimateTime = () => {
    if (numFlowRate <= 0 || volume <= 0) return 'Terhenti / Tidak Aktif';
    const totalSeconds = volume / numFlowRate;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center gap-8 max-w-2xl">
      
      {/* ========================================================= */}
      {/* 1. SISI KIRI: Visual Tabung & Selang Asli yang Proporsional */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center flex-shrink-0 select-none">
        
        {/* A. Wadah Tabung Infus Asli (Lebar 130px, Tinggi 165px) */}
        <div className="relative w-32 h-40 flex items-center justify-center">
          
          {/* Layer Level Cairan Dinamis (Diletakkan di dalam rongga tabung gambar asli) */}
          <div 
            className="absolute rounded-t-[16px] rounded-b-[4px] overflow-hidden flex flex-col justify-end pointer-events-none"
            style={{
              top: '11%',
              bottom: '18%',
              left: '26%',
              width: '48%',
            }}
          >
            <div
              className={`w-full bg-gradient-to-t ${theme.fluidGradient} transition-all duration-700 ease-out relative`}
              style={{ height: `${clampedPercentage}%` }}
            >
              {/* Animasi kilau permukaan cairan */}
              <div className="w-full h-1 bg-white/40 absolute top-0 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Gambar Asli infus_tabung.png */}
          <img
            src={tabungSrc}
            alt="Tabung Infus Mifus"
            className="relative z-10 w-full h-full object-contain pointer-events-none drop-shadow-sm"
          />
        </div>

        {/* B. Selang & Drip Chamber Asli (Proporsional Lebih Kecil di Bawah Tabung) */}
        <div className="relative w-14 h-24 -mt-1 flex items-center justify-center">
          {/* Gambar Asli infus_selang.png */}
          <img
            src={selangSrc}
            alt="Selang Drip Chamber Mifus"
            className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
          />

          {/* Indikator Animasi Titik Tetesan Mengalir */}
          {isFlowing && (
            <span className="absolute top-[48%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 animate-ping pointer-events-none" />
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. SISI KANAN: Rincian Parameter Kuantitatif Berderet ke Bawah */}
      {/* ========================================================= */}
      <div className="flex-1 w-full space-y-3">
        
        {/* Parameter 1: Kapasitas Labu & Status */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Isi Labu</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{clampedPercentage}%</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${theme.badge}`}>
            {status}
          </span>
        </div>

        {/* Parameter 2: Sisa Volume Cairan */}
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laju Alir</p>
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
            <p className={`text-sm font-black ${theme.text}`}>
              {getEstimateTime()}
            </p>
          </div>
        </div>

        {/* Parameter 5: Status Saluran Aliran */}
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