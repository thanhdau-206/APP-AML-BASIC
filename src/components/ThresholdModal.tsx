import React, { useState, useEffect } from 'react';
import { ThresholdConfig, DEFAULT_THRESHOLDS, formatPercent, formatNum } from '../utils/metrics.ts';

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
  const [localThresholds, setLocalThresholds] = useState<ThresholdConfig>(thresholds);

  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalThresholds(DEFAULT_THRESHOLDS);
  };

  const handleApply = () => {
    onSave(localThresholds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#15171B] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full p-6 space-y-5">
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            ⚙️ Cấu hình ngưỡng kiểm thử AML
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-black dark:hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Ngưỡng AP Chú ý */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Ngưỡng Chú ý (% AP mức khỏe):
              </label>
              <span className="font-bold text-zinc-900 dark:text-white">
                {formatPercent(localThresholds.warn_ratio, 0)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={localThresholds.warn_ratio}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, warn_ratio: parseFloat(e.target.value) })
              }
              className="w-full accent-black dark:accent-white cursor-pointer"
            />
          </div>

          {/* Ngưỡng AP Báo động */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Ngưỡng Báo động (% AP mức khỏe):
              </label>
              <span className="font-bold text-zinc-900 dark:text-white">
                {formatPercent(localThresholds.alert_ratio, 0)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={localThresholds.alert_ratio}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, alert_ratio: parseFloat(e.target.value) })
              }
              className="w-full accent-black dark:accent-white cursor-pointer"
            />
          </div>

          {/* Ngưỡng PSI */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Ngưỡng lệch phân phối PSI:
              </label>
              <span className="font-bold text-zinc-900 dark:text-white">
                {formatNum(localThresholds.psi_alert, 2)}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="1.0"
              value={localThresholds.psi_alert}
              onChange={(e) =>
                setLocalThresholds({
                  ...localThresholds,
                  psi_alert: parseFloat(e.target.value) || 0.25
                })
              }
              className="w-full p-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {/* Ngưỡng ECE */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Ngưỡng sai số tin cậy ECE:
              </label>
              <span className="font-bold text-zinc-900 dark:text-white">
                {formatNum(localThresholds.ece_warn, 2)}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="0.5"
              value={localThresholds.ece_warn}
              onChange={(e) =>
                setLocalThresholds({
                  ...localThresholds,
                  ece_warn: parseFloat(e.target.value) || 0.1
                })
              }
              className="w-full p-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {/* Số nhãn tối thiểu */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Số vụ rửa tiền tối thiểu mỗi kỳ (min_pos):
              </label>
              <span className="font-bold text-zinc-900 dark:text-white">
                {localThresholds.min_pos}
              </span>
            </div>
            <input
              type="number"
              step="1"
              min="1"
              max="50"
              value={localThresholds.min_pos}
              onChange={(e) =>
                setLocalThresholds({
                  ...localThresholds,
                  min_pos: parseInt(e.target.value, 10) || 10
                })
              }
              className="w-full p-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-white underline font-semibold cursor-pointer"
          >
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer active:scale-98"
          >
            Áp dụng ngay
          </button>
        </div>
      </div>
    </div>
  );
};
