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
    <div className="fixed inset-0 bg-[#2B2521]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="clay-card rounded-[32px] max-w-md w-full p-7 space-y-6 border border-[#EFE4D6] dark:border-[#38302A] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-[#EFE4D6] dark:border-[#38302A] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F6BEB0] to-[#E69686] text-white flex items-center justify-center text-sm font-bold clay-disc">
              ⚙️
            </div>
            <h3 className="text-base font-black text-[#38312C] dark:text-[#FAF6F0]">
              Cấu hình ngưỡng kiểm thử AML
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF5EE] dark:bg-[#2A2320] text-[#8C7E74] hover:text-[#38312C] dark:hover:text-[#FAF6F0] flex items-center justify-center font-bold text-xs cursor-pointer clay-pill transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Ngưỡng AP Chú ý */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF5EE]/60 dark:bg-[#2A2320]/40 border border-[#EADBCC]/60 dark:border-[#443832]/60">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#635850] dark:text-[#CBBDB2]">
                Ngưỡng Chú ý (% AP mức khỏe):
              </label>
              <span className="font-black text-[#E69686] bg-[#FAF5EE] dark:bg-[#2A2320] px-2.5 py-0.5 rounded-full border border-[#EADBCC] text-xs">
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
              className="w-full accent-[#E69686] cursor-pointer"
            />
          </div>

          {/* Ngưỡng AP Báo động */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF5EE]/60 dark:bg-[#2A2320]/40 border border-[#EADBCC]/60 dark:border-[#443832]/60">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#635850] dark:text-[#CBBDB2]">
                Ngưỡng Báo động (% AP mức khỏe):
              </label>
              <span className="font-black text-[#D88170] bg-[#FAF5EE] dark:bg-[#2A2320] px-2.5 py-0.5 rounded-full border border-[#EADBCC] text-xs">
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
              className="w-full accent-[#D88170] cursor-pointer"
            />
          </div>

          {/* Ngưỡng PSI */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-bold text-[#635850] dark:text-[#CBBDB2]">
                Ngưỡng lệch phân phối PSI:
              </label>
              <span className="font-black text-[#38312C] dark:text-[#FAF6F0]">
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
              className="w-full p-2.5 clay-input rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8BAFD4]"
            />
          </div>

          {/* Ngưỡng ECE */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-bold text-[#635850] dark:text-[#CBBDB2]">
                Ngưỡng sai số tin cậy ECE:
              </label>
              <span className="font-black text-[#38312C] dark:text-[#FAF6F0]">
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
              className="w-full p-2.5 clay-input rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8BAFD4]"
            />
          </div>

          {/* Số nhãn tối thiểu */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="font-bold text-[#635850] dark:text-[#CBBDB2]">
                Số vụ rửa tiền tối thiểu mỗi kỳ (min_pos):
              </label>
              <span className="font-black text-[#38312C] dark:text-[#FAF6F0]">
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
              className="w-full p-2.5 clay-input rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8BAFD4]"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[#EFE4D6] dark:border-[#38302A]">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#8C7E74] hover:text-[#38312C] dark:text-[#A8988C] dark:hover:text-[#FAF6F0] font-bold underline cursor-pointer"
          >
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="clay-btn bg-gradient-to-r from-[#E69686] to-[#D88170] hover:from-[#ED9E8E] hover:to-[#DE8776] text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-md border border-white/40 transition cursor-pointer active:scale-98"
          >
            Áp dụng ngay
          </button>
        </div>
      </div>
    </div>
  );
};

