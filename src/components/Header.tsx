import React from 'react';
import { ThresholdConfig, formatPercent, formatNum } from '../utils/metrics.ts';

interface HeaderProps {
  onOpenThresholds: () => void;
  thresholds: ThresholdConfig;
}

export const Header: React.FC<HeaderProps> = ({ onOpenThresholds, thresholds }) => {
  return (
    <header className="sticky top-0 z-40 px-6 sm:px-8 py-3.5 bg-[#FAF4EB]/85 dark:bg-[#1A1513]/85 backdrop-blur-md border-b border-[#EFE4D6]/80 dark:border-[#38302A] flex justify-between items-center transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F6BEB0] to-[#E69686] flex items-center justify-center text-white text-sm font-black clay-disc shadow-sm">
            🛡️
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-[#38312C] dark:text-[#FAF6F0]">
            Trạm kiểm thử suy giảm mô hình AML
          </h1>
        </div>

        <span className="text-[11px] font-bold bg-[#E8F1FA] dark:bg-[#253240] text-[#4A7AA5] dark:text-[#B8D3EC] px-3 py-0.5 rounded-full border border-[#D0E2F3] dark:border-[#354B60] whitespace-nowrap clay-pill shadow-xs">
          Elliptic v49
        </span>

        <div className="relative group">
          <button
            type="button"
            className="w-5 h-5 rounded-full bg-[#FAF5EE] hover:bg-[#F2E8DC] dark:bg-[#2A2320] dark:hover:bg-[#38302A] text-[#8C7E74] hover:text-[#38312C] dark:text-[#B5A599] dark:hover:text-[#FAF6F0] flex items-center justify-center text-[11px] font-serif italic border border-[#EADBCC] dark:border-[#443832] transition cursor-help clay-pill"
            title="Bản minh họa · Dữ liệu Elliptic · Công ty giả định"
          >
            i
          </button>
          <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-72 p-3.5 bg-[#FFFDF9] dark:bg-[#231D1A] text-[#38312C] dark:text-[#FAF6F0] text-xs rounded-2xl shadow-xl border border-[#EADBCC] dark:border-[#443832] pointer-events-none transition-all clay-card">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#E69686]">
              <span>🛡️</span> Trạm kiểm thử suy giảm mô hình AML
            </div>
            <p className="text-[#635850] dark:text-[#D5C7BD] text-[11px] mt-1.5 leading-relaxed">
              Bản minh họa nghiên cứu · Dữ liệu Bitcoin Elliptic công khai · Tên công ty là giả định, mọi số liệu là kết quả thực nghiệm.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold text-[#8C7E74] dark:text-[#A8988C] hidden md:inline bg-[#F4EAE0]/70 dark:bg-[#2A2320]/70 px-3 py-1.5 rounded-full border border-[#EADBCC]/60 dark:border-[#38302A]">
          📦 203.769 giao dịch Bitcoin
        </span>
        <button
          type="button"
          onClick={onOpenThresholds}
          className="clay-btn bg-gradient-to-r from-[#E69686] to-[#D88170] hover:from-[#ED9E8E] hover:to-[#DE8776] text-white text-xs px-4 py-2 rounded-2xl font-bold flex items-center gap-2 border border-white/40 shadow-md cursor-pointer"
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

