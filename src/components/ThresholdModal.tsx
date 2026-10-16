import React, { useState } from 'react';
import { ThresholdConfig, DEFAULT_THRESHOLDS, formatNum, formatPct } from '../utils/metrics.ts';
import { X, RotateCcw, Sliders, Check } from 'lucide-react';

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onSave: (newThresholds: ThresholdConfig) => void;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave
}) => {
  const [warnRatio, setWarnRatio] = useState<number>(thresholds.warn_ratio * 100);
  const [alertRatio, setAlertRatio] = useState<number>(thresholds.alert_ratio * 100);
  const [psiAlert, setPsiAlert] = useState<number>(thresholds.psi_alert);
  const [eceWarn, setEceWarn] = useState<number>(thresholds.ece_warn);
  const [minPos, setMinPos] = useState<number>(thresholds.min_pos);

  if (!isOpen) return null;

  const handleReset = () => {
    setWarnRatio(DEFAULT_THRESHOLDS.warn_ratio * 100);
    setAlertRatio(DEFAULT_THRESHOLDS.alert_ratio * 100);
    setPsiAlert(DEFAULT_THRESHOLDS.psi_alert);
    setEceWarn(DEFAULT_THRESHOLDS.ece_warn);
    setMinPos(DEFAULT_THRESHOLDS.min_pos);
  };

  const handleApply = () => {
    onSave({
      warn_ratio: warnRatio / 100,
      alert_ratio: alertRatio / 100,
      psi_alert: psiAlert,
      ece_warn: eceWarn,
      min_pos: minPos,
      psi_consecutive: 2
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Cấu hình ngưỡng kiểm thử</h3>
              <p className="text-xs text-slate-500">Mọi thay đổi sẽ tính toán lại trạng thái các kỳ ngay lập tức</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* AP Warn */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">
                Ngưỡng Chú ý AP (% mức khỏe)
              </label>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                {formatNum(warnRatio, 0)}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={warnRatio}
              onChange={(e) => setWarnRatio(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-xs text-slate-500">
              Dưới mức này (mặc định 70%), kỳ sẽ chuyển sang trạng thái <strong>! Cần chú ý</strong>.
            </p>
          </div>

          {/* AP Alert */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">
                Ngưỡng Báo động AP (% mức khỏe)
              </label>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs border border-rose-200">
                {formatNum(alertRatio, 0)}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={alertRatio}
              onChange={(e) => setAlertRatio(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-xs text-slate-500">
              Dưới mức này (mặc định 50%), kỳ sẽ phát tín hiệu <strong>✕ Báo động</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* PSI */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Ngưỡng PSI
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1.0"
                  value={psiAlert}
                  onChange={(e) => setPsiAlert(Number(e.target.value))}
                  className="w-full font-mono text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500">Lệch đáng kể khi &gt; {formatNum(psiAlert)}</p>
            </div>

            {/* ECE */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Ngưỡng ECE
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.5"
                  value={eceWarn}
                  onChange={(e) => setEceWarn(Number(e.target.value))}
                  className="w-full font-mono text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500">Hết tin cậy khi &gt; {formatNum(eceWarn)}</p>
            </div>
          </div>

          {/* Min Pos */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">
                Số nhãn rửa tiền tối thiểu (min_pos)
              </label>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                {minPos} vụ
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={minPos}
              onChange={(e) => setMinPos(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-xs text-slate-500">
              Nếu kỳ có ít hơn {minPos} vụ rửa tiền có nhãn, AP không đủ tin cậy để chấm và sẽ phân loại là <strong>– Chưa đủ nhãn</strong> (trừ khi PSI báo động).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200/70 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục mặc định
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Áp dụng ngưỡng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
