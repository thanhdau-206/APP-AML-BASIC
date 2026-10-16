import React from 'react';
import { ThresholdConfig, formatPercent, formatNum } from '../utils/metrics.ts';

interface HeaderProps {
  onOpenThresholds: () => void;
  thresholds: ThresholdConfig;
}

export const Header: React.FC<HeaderProps> = ({ onOpenThresholds, thresholds }) => {
  return (
    <header className="bg-white/80 dark:bg-[#121316]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-40 px-8 py-3.5 flex justify-between items-center shadow-xs">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Trạm kiểm thử suy giảm mô hình AML
        </h1>
        <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
          Elliptic v49
        </span>
        <div className="relative group">
          <button
            type="button"
            className="w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-black dark:hover:text-white flex items-center justify-center text-[11px] font-serif italic border border-zinc-200 dark:border-zinc-700 transition cursor-help"
            title="Bản minh họa · Dữ liệu Elliptic · Công ty giả định"
          >
            i
          </button>
          <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-72 p-3 bg-black dark:bg-zinc-900 text-white text-xs rounded-2xl shadow-2xl border border-zinc-800 pointer-events-none transition-all">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <span>🛡️</span> Trạm kiểm thử suy giảm mô hình AML
            </div>
            <p className="text-zinc-300 text-[11px] mt-1.5 leading-relaxed">
              Bản minh họa nghiên cứu · Dữ liệu Bitcoin Elliptic công khai · Tên công ty là giả định, mọi số liệu là kết quả thực nghiệm.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-xs text-zinc-400 hidden sm:inline">
          📦 203.769 giao dịch Bitcoin
        </span>
        <button
          type="button"
          onClick={onOpenThresholds}
          className="bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <span>⚙️</span>
          <span>
            Ngưỡng ({formatPercent(thresholds.warn_ratio, 0)} / {formatPercent(thresholds.alert_ratio, 0)} / {formatNum(thresholds.psi_alert, 2)})
          </span>
        </button>
      </div>
    </header>
  );
};
