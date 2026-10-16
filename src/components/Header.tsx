import React from 'react';
import { Sliders, ShieldAlert, Activity, ArrowLeft } from 'lucide-react';
import { ThresholdConfig, formatNum, formatPct } from '../utils/metrics.ts';

interface HeaderProps {
  onOpenThresholds: () => void;
  thresholds: ThresholdConfig;
  onNavigateHome?: () => void;
  showBackHome?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenThresholds,
  thresholds,
  onNavigateHome,
  showBackHome = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Title and Branding */}
          <div className="flex items-center gap-3">
            {showBackHome && onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 mr-1"
                title="Về trang chủ"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Trạm kiểm thử suy giảm mô hình AML</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium hidden md:block">
                  Bản minh họa · Dữ liệu Elliptic · Công ty giả định
                </p>
              </div>
            </div>
          </div>

          {/* Right Action: Badge + Threshold Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="md:hidden inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700">
              Minh họa Elliptic
            </span>

            {/* Threshold Quick Indicator Pills */}
            <div className="hidden lg:flex items-center gap-2 text-2xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span title="Ngưỡng chú ý AP">AP Chú ý: <strong>{formatPct(thresholds.warn_ratio, 0)}</strong></span>
              <span className="text-slate-300">|</span>
              <span title="Ngưỡng báo động AP">Báo động: <strong className="text-rose-600">{formatPct(thresholds.alert_ratio, 0)}</strong></span>
              <span className="text-slate-300">|</span>
              <span title="Ngưỡng PSI">PSI: <strong>{formatNum(thresholds.psi_alert, 2)}</strong></span>
              <span className="text-slate-300">|</span>
              <span title="Ngưỡng ECE">ECE: <strong>{formatNum(thresholds.ece_warn, 2)}</strong></span>
            </div>

            <button
              onClick={onOpenThresholds}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl shadow-2xs hover:shadow-xs transition-all active:scale-98"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Ngưỡng</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
