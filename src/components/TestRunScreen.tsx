import React, { useState, useEffect, useMemo } from 'react';
import { Company, duLieuApp } from '../data/du_lieu_app.ts';
import {
  ThresholdConfig,
  formatNum,
  formatPercent,
  formatInt,
  calculatePSI,
  calculateAP,
  calculateECE,
  evaluateSteps,
  generateAutoConclusion,
  EvaluatedStep,
  CODE_SNIPPET
} from '../utils/metrics.ts';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

export interface CustomTestPayload {
  code: string;
  name: string;
  model: string;
  desc: string;
  n_rows: number;
  n_pos: number;
  preview: any[];
  computed: {
    ref: { ap: number; ece: number };
    step: any[];
    block: {
      Gộp: { ap: number; ece: number };
      Muộn: { ap: number; ece: number };
    };
  };
}

interface TestRunScreenProps {
  company?: Company;
  customData?: CustomTestPayload;
  thresholds: ThresholdConfig;
  onBackToHome: () => void;
  isDarkMode?: boolean;
}

export const TestRunScreen: React.FC<TestRunScreenProps> = ({
  company,
  customData,
  thresholds,
  onBackToHome,
  isDarkMode = false
}) => {
  const isCustomMode = !!customData;
  const currentCompany = useMemo(() => {
    if (customData) return customData;
    return company || duLieuApp.companies[0];
  }, [customData, company]);

  const [displayMode, setDisplayMode] = useState<'5seed' | 'seed42'>('5seed');
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Testing progress simulation state
  const [isTestingRunning, setIsTestingRunning] = useState(true);
  const [progressStep, setProgressStep] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  useEffect(() => {
    setIsTestingRunning(true);
    setProgressStep(0);
    setProgressLogs([]);

    const logs = [
      `Đọc dữ liệu công ty ${currentCompany.name}...`,
      'Tách mốc tham chiếu t31–34...',
      'Tính PSI, AP, ECE cho 15 kỳ...',
      'Phân luồng trạng thái giám sát...'
    ];

    let step = 0;
    const timer = setInterval(() => {
      if (step < logs.length) {
        const nextLog = logs[step];
        setProgressLogs((prev) => [...prev, nextLog]);
        setProgressStep(step + 1);
        step++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setIsTestingRunning(false);
        }, 300);
      }
    }, 350);

    return () => clearInterval(timer);
  }, [currentCompany]);

  // Active Model Results (mean_5seed or seed42 or custom computed)
  const activeResult = useMemo(() => {
    if (isCustomMode && customData) return customData.computed;
    const comp = currentCompany as Company;
    return displayMode === '5seed' ? comp.mean_5seed : comp.seed42;
  }, [isCustomMode, customData, displayMode, currentCompany]);

  // Evaluated Steps with 5 Rules
  const evaluatedSteps: EvaluatedStep[] = useMemo(() => {
    if (!activeResult || !activeResult.step) return [];
    return evaluateSteps(activeResult.step, activeResult.ref.ap, thresholds, duLieuApp.steps);
  }, [activeResult, thresholds]);

  // Summary Metrics Cards
  const summaryCards = useMemo(() => {
    if (!activeResult || !evaluatedSteps.length) {
      return {
        refAP: 0,
        gopAP: 0,
        muocAP: 0,
        firstAlertPeriod: 'Không có',
        firstAlertReason: 'Mô hình không chạm ngưỡng báo động'
      };
    }
    const refAP = activeResult.ref.ap;
    const gopAP = activeResult.block ? activeResult.block['Gộp']?.ap : 0.795;
    const muocAP = activeResult.block ? activeResult.block['Muộn']?.ap : 0.055;
    const firstAlert = evaluatedSteps.find((s) => s.type === 'alert');

    return {
      refAP,
      gopAP,
      muocAP,
      firstAlertPeriod: firstAlert ? `Kỳ t${firstAlert.t}` : 'Không có',
      firstAlertReason: firstAlert ? firstAlert.reason : 'Mô hình không chạm ngưỡng báo động'
    };
  }, [activeResult, evaluatedSteps]);

  // Dynamic Conclusion Narrative
  const autoConclusion = useMemo(() => {
    return generateAutoConclusion(currentCompany, evaluatedSteps, activeResult, thresholds);
  }, [currentCompany, evaluatedSteps, activeResult, thresholds]);

  // Download Report CSV
  const downloadReportCSV = () => {
    const headerInfo = [
      `# BÁO CÁO KIỂM THỬ SUY GIẢM MÔ HÌNH AML`,
      `# Công ty: ${currentCompany.name} (Mã: ${currentCompany.code})`,
      `# Mô hình: ${currentCompany.model}`,
      `# Chế độ hiển thị: ${displayMode === '5seed' ? 'Trung bình 5 seed' : 'Seed 42 đơn lẻ'}`,
      `# Ngưỡng AP Chú ý: ${formatPercent(thresholds.warn_ratio)} | Ngưỡng AP Báo động: ${formatPercent(thresholds.alert_ratio)}`,
      `# Ngưỡng PSI: ${formatNum(thresholds.psi_alert)} | Ngưỡng ECE: ${formatNum(thresholds.ece_warn)} | Số nhãn tối thiểu: ${thresholds.min_pos}`,
      `# Thời gian xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      `Kỳ,Số vụ RT,AP,Tỉ lệ % so với mức khỏe,ECE,PSI,Tỉ lệ gắn cờ,Trạng thái,Lý do`
    ];

    const rows = evaluatedSteps.map((s) =>
      [
        `t${s.t}`,
        s.n_pos,
        formatNum(s.ap),
        formatPercent(s.ap_ratio),
        formatNum(s.ece),
        formatNum(s.psi),
        formatPercent(s.flag_rate),
        `"${s.symbol} ${s.status}"`,
        `"${s.reason}"`
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [...headerInfo, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao_cao_kiem_thu_${currentCompany.code}_${currentCompany.model}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-6 flex-1 space-y-6">
      {/* Running Progress Bar Simulation */}
      {isTestingRunning && (
        <div className="clay-card p-6 sm:p-7 rounded-[32px] border border-[#EFE4D6] dark:border-[#38302A] space-y-4 animate-pulse">
          <div className="flex justify-between items-center text-xs font-black text-[#38312C] dark:text-[#FAF6F0]">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E69686] animate-ping" />
              Đang tiến hành kiểm thử toàn diện mô hình AML...
            </span>
            <span className="bg-[#FAF5EE] dark:bg-[#2A2320] px-3 py-1 rounded-full border border-[#EADBCC] dark:border-[#443832]">
              {Math.round((progressStep / 4) * 100)}%
            </span>
          </div>
          <div className="w-full bg-[#FAF5EE] dark:bg-[#2A2320] h-3 rounded-full overflow-hidden p-0.5 border border-[#EADBCC] dark:border-[#443832] clay-inset">
            <div
              className="bg-gradient-to-r from-[#F6BEB0] via-[#E69686] to-[#D88170] h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${(progressStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="space-y-1.5 font-mono text-xs text-[#635850] dark:text-[#CBBDB2] bg-[#FAF5EE]/90 dark:bg-[#231D1A]/90 p-4 rounded-2xl border border-[#EADBCC] dark:border-[#443832] clay-inset">
            {progressLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#8BAFD4] text-white text-[10px] flex items-center justify-center font-bold">
                  ✓
                </span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Bar on Testing Screen */}
      <div className="clay-card p-5 px-7 rounded-[32px] border border-[#EFE4D6] dark:border-[#38302A] flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F6BEB0] via-[#E69686] to-[#D88170] text-white font-black flex items-center justify-center text-xl clay-disc shadow-md border border-white/40">
            {currentCompany.code}
          </div>
          <div>
            <h3 className="text-base font-black text-[#38312C] dark:text-[#FAF6F0]">{currentCompany.name}</h3>
            <p className="text-xs text-[#8C7E74] dark:text-[#A8988C]">Mô hình: {currentCompany.model} · Đã chấm điểm t31–t49</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Badge nguồn kết quả */}
          <span className="bg-[#FAF5EE] dark:bg-[#2A2320] text-[#635850] dark:text-[#CBBDB2] text-xs px-3.5 py-1.5 rounded-full border border-[#EADBCC] dark:border-[#443832] font-bold clay-pill">
            {isCustomMode ? '⚙️ Tính trực tiếp trên dữ liệu của bạn' : '📦 Kết quả đã chạy sẵn (Pre-computed)'}
          </span>

          {/* Công tắc 5 seed / seed 42 */}
          {!isCustomMode && (
            <div className="bg-[#FAF5EE] dark:bg-[#2A2320] p-1 rounded-full flex text-xs font-bold border border-[#EADBCC] dark:border-[#443832] clay-inset">
              <button
                type="button"
                onClick={() => setDisplayMode('5seed')}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  displayMode === '5seed'
                    ? 'clay-btn bg-gradient-to-r from-[#8BAFD4] to-[#668FB7] text-white shadow-sm border border-white/40'
                    : 'text-[#8C7E74] hover:text-[#38312C] dark:hover:text-[#FAF6F0]'
                }`}
              >
                🎛️ Trung bình 5 seed
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('seed42')}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  displayMode === 'seed42'
                    ? 'clay-btn bg-gradient-to-r from-[#8BAFD4] to-[#668FB7] text-white shadow-sm border border-white/40'
                    : 'text-[#8C7E74] hover:text-[#38312C] dark:hover:text-[#FAF6F0]'
                }`}
              >
                Seed 42 đơn lẻ
              </button>
            </div>
          )}

          {/* Nút Code để chạy */}
          <button
            type="button"
            onClick={() => setShowCodeSnippet(!showCodeSnippet)}
            className="text-xs bg-[#FAF5EE] hover:bg-[#F2E8DC] dark:bg-[#2A2320] dark:hover:bg-[#38302A] text-[#38312C] dark:text-[#FAF6F0] font-bold px-4 py-2 rounded-full border border-[#EADBCC] dark:border-[#443832] clay-btn transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            💻 Code để chạy
          </button>
        </div>
      </div>

      {/* Khung Gập/Mở "Code để chạy" */}
      {showCodeSnippet && (
        <div className="clay-card bg-[#231D1A] text-[#FAF6F0] p-6 rounded-[32px] border border-[#443832] space-y-4 font-mono text-xs shadow-2xl">
          <div className="flex justify-between items-center text-[#B5A599] pb-3 border-b border-[#38302A]">
            <span className="font-bold text-[#F6BEB0] flex items-center gap-2">
              <span>🐍</span>
              <span>Trích từ tinh_chi_so_giam_sat.py – Định nghĩa & giải thích chi tiết từng dòng lệnh</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(CODE_SNIPPET);
                }}
                className="text-[11px] bg-[#38302A] hover:bg-[#443832] text-[#FAF6F0] font-bold px-3 py-1.5 rounded-xl border border-[#52443C] clay-btn transition cursor-pointer"
                title="Sao chép toàn bộ mã nguồn"
              >
                📋 Sao chép code
              </button>
              <button
                type="button"
                onClick={() => setShowCodeSnippet(false)}
                className="text-xs hover:text-white cursor-pointer px-2 py-1"
              >
                ✕ Đóng
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#D5C7BD] font-mono whitespace-pre max-h-96">
            {CODE_SNIPPET}
          </pre>
        </div>
      )}

      {/* BƯỚC 1 – NHẬN DỮ LIỆU */}
      <div className="clay-card p-6 sm:p-8 rounded-[32px] border border-[#EFE4D6] dark:border-[#38302A] space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8BAFD4] to-[#668FB7] text-white text-xs font-black flex items-center justify-center clay-disc shadow-sm border border-white/40">
            1
          </span>
          <h3 className="text-lg font-black text-[#38312C] dark:text-[#FAF6F0]">BƯỚC 1 – NHẬN DỮ LIỆU</h3>
        </div>
        <p className="text-xs text-[#635850] dark:text-[#CBBDB2]">
          Mô hình đã chấm điểm <strong className="text-[#38312C] dark:text-[#FAF6F0]">{formatInt(currentCompany.n_rows)}</strong> giao dịch; mỗi giao dịch có mã, kỳ thời gian, điểm số và nhãn điều tra.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-[#EADBCC] dark:border-[#38302A] shadow-inner bg-[#FFFDF9] dark:bg-[#231D1A]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] dark:bg-[#2A2320] text-[#635850] dark:text-[#CBBDB2] font-bold border-b border-[#EADBCC] dark:border-[#38302A]">
              <tr>
                <th className="py-3 px-3.5">Kỳ thời gian</th>
                <th className="py-3 px-3.5">Số giao dịch có nhãn (n)</th>
                <th className="py-3 px-3.5">Số vụ rửa tiền (n_pos)</th>
                <th className="py-3 px-3.5">Tỉ lệ rửa tiền nền (Prevalence)</th>
                <th className="py-3 px-3.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE4D6]/60 dark:divide-[#38302A]/60 font-normal">
              <tr className="bg-[#F4EAE0]/80 dark:bg-[#2A2320]/60 font-bold text-[#38312C] dark:text-[#FAF6F0]">
                <td className="py-3 px-3.5">Tham chiếu t31–34</td>
                <td className="py-3 px-3.5">{formatInt(duLieuApp.ref.n)}</td>
                <td className="py-3 px-3.5">{formatInt(duLieuApp.ref.n_pos)}</td>
                <td className="py-3 px-3.5">{formatPercent(duLieuApp.ref.prevalence)}</td>
                <td className="py-3 px-3.5 font-bold text-[#8BAFD4]">Mốc chuẩn lúc khỏe</td>
              </tr>
              {duLieuApp.steps.map((s) => (
                <tr key={s.t} className="hover:bg-[#FAF5EE]/60 dark:hover:bg-[#2A2320]/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-[#38312C] dark:text-[#FAF6F0]">Kỳ t{s.t}</td>
                  <td className="py-2.5 px-3.5 text-[#635850] dark:text-[#CBBDB2]">{formatInt(s.n)}</td>
                  <td className="py-2.5 px-3.5 text-[#635850] dark:text-[#CBBDB2]">{formatInt(s.n_pos)}</td>
                  <td className="py-2.5 px-3.5 text-[#635850] dark:text-[#CBBDB2]">{formatPercent(s.prevalence)}</td>
                  <td className="py-2.5 px-3.5 text-[#8C7E74] dark:text-[#A8988C]">
                    {s.n_pos < thresholds.min_pos ? (
                      <span className="font-bold text-[#D88170]">
                        ⚠️ Dưới {thresholds.min_pos} nhãn
                      </span>
                    ) : (
                      'Đầy đủ nhãn'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BƯỚC 2 – GHI KẾT QUẢ & 4 Ô TÓM TẮT */}
      <div className="clay-card p-6 sm:p-8 rounded-[32px] border border-[#EFE4D6] dark:border-[#38302A] space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F6BEB0] to-[#E69686] text-white text-xs font-black flex items-center justify-center clay-disc shadow-sm border border-white/40">
            2
          </span>
          <h3 className="text-lg font-black text-[#38312C] dark:text-[#FAF6F0]">BƯỚC 2 – GHI KẾT QUẢ</h3>
        </div>

        {/* 4 Ô Tóm tắt chỉ số */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="clay-card bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EE] dark:from-[#231D1A] dark:to-[#1E1916] p-5 rounded-[24px] border border-[#EFE4D6] dark:border-[#38302A]">
            <p className="text-xs text-[#8C7E74] dark:text-[#A8988C] font-bold">AP mức khỏe (Tham chiếu t31–34)</p>
            <p className="text-3xl font-black text-[#4A7AA5] dark:text-[#8BAFD4] mt-2">
              {formatNum(summaryCards.refAP)}
            </p>
            <p className="text-[11px] text-[#8C7E74] dark:text-[#A8988C] mt-1.5">
              Tỉ lệ rửa tiền nền: {formatPercent(duLieuApp.ref.prevalence)}
            </p>
          </div>
          <div className="clay-card bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EE] dark:from-[#231D1A] dark:to-[#1E1916] p-5 rounded-[24px] border border-[#EFE4D6] dark:border-[#38302A]">
            <p className="text-xs text-[#8C7E74] dark:text-[#A8988C] font-bold">AP gộp t35–49</p>
            <p className="text-3xl font-black text-[#635850] dark:text-[#CBBDB2] mt-2">
              {formatNum(summaryCards.gopAP)}
            </p>
            <p className="text-[11px] font-bold text-[#B58522] mt-1.5">
              ⚠️ Thường được báo cáo (Che lấp suy giảm)
            </p>
          </div>
          <div className="clay-card bg-gradient-to-br from-[#FFF5F2] to-[#FDEEEA] dark:from-[#2E1E1B] dark:to-[#241715] p-5 rounded-[24px] border-2 border-[#E69686] dark:border-[#D88170] shadow-md">
            <p className="text-xs font-black text-[#D88170] dark:text-[#F6BEB0]">AP khối Muộn (t45–49)</p>
            <p className="text-3xl font-black text-[#D88170] dark:text-[#F6BEB0] mt-2">
              {formatNum(summaryCards.muocAP)}
            </p>
            <p className="text-[11px] font-black text-[#D88170] mt-1.5">
              ✕ Sụp đổ hoàn toàn so với lúc khỏe
            </p>
          </div>
          <div className="clay-card bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EE] dark:from-[#231D1A] dark:to-[#1E1916] p-5 rounded-[24px] border border-[#EFE4D6] dark:border-[#38302A]">
            <p className="text-xs text-[#8C7E74] dark:text-[#A8988C] font-bold">Kỳ báo động đầu tiên</p>
            <p className="text-3xl font-black text-[#38312C] dark:text-[#FAF6F0] mt-2">
              {summaryCards.firstAlertPeriod}
            </p>
            <p className="text-[11px] text-[#8C7E74] dark:text-[#A8988C] mt-1.5 truncate" title={summaryCards.firstAlertReason}>
              {summaryCards.firstAlertReason}
            </p>
          </div>
        </div>

        {/* Bảng 15 dòng t35–49 */}
        <div className="overflow-x-auto rounded-2xl border border-[#EADBCC] dark:border-[#38302A] shadow-inner bg-[#FFFDF9] dark:bg-[#231D1A]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] dark:bg-[#2A2320] text-[#635850] dark:text-[#CBBDB2] font-bold border-b border-[#EADBCC] dark:border-[#38302A]">
              <tr>
                <th className="py-3 px-3.5">Kỳ</th>
                <th className="py-3 px-3.5">Số vụ RT</th>
                <th className="py-3 px-3.5">AP</th>
                <th className="py-3 px-3.5">% Mức khỏe</th>
                <th className="py-3 px-3.5">ECE</th>
                <th className="py-3 px-3.5">PSI</th>
                <th className="py-3 px-3.5">Gắn cờ (%)</th>
                <th className="py-3 px-3.5">Trạng thái</th>
                <th className="py-3 px-3.5">Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE4D6]/60 dark:divide-[#38302A]/60 font-normal">
              {evaluatedSteps.map((s) => {
                const isAPAlert = s.ap_ratio !== null && s.ap_ratio < thresholds.alert_ratio;
                const isPSIVuot = s.psi > thresholds.psi_alert;
                const isECEWarn = s.ece > thresholds.ece_warn;

                let rowBg = '';
                if (s.type === 'alert') rowBg = 'bg-[#FDEEEA]/40 dark:bg-[#3D2520]/40 font-semibold';
                else if (s.type === 'warn') rowBg = 'bg-[#FEF7DE]/30 dark:bg-[#2C271E]/30';

                return (
                  <tr key={s.t} className={`hover:bg-[#FAF5EE]/60 dark:hover:bg-[#2A2320]/40 transition-colors ${rowBg}`}>
                    <td className="py-2.5 px-3.5 font-bold text-[#38312C] dark:text-[#FAF6F0]">t{s.t}</td>
                    <td className="py-2.5 px-3.5 text-[#635850] dark:text-[#CBBDB2]">{s.n_pos}</td>
                    <td
                      className={`py-2.5 px-3.5 font-mono font-bold ${
                        isAPAlert ? 'text-[#D88170] underline' : 'text-[#38312C] dark:text-[#FAF6F0]'
                      }`}
                    >
                      {formatNum(s.ap)}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[#38312C] dark:text-[#FAF6F0]">{formatPercent(s.ap_ratio)}</td>
                    <td
                      className={`py-2.5 px-3.5 font-mono ${
                        isECEWarn ? 'font-black underline text-[#D88170]' : 'text-[#635850] dark:text-[#CBBDB2]'
                      }`}
                    >
                      {formatNum(s.ece)}
                    </td>
                    <td
                      className={`py-2.5 px-3.5 font-mono font-bold ${
                        isPSIVuot ? 'underline text-[#D88170]' : 'text-[#635850] dark:text-[#CBBDB2]'
                      }`}
                    >
                      {formatNum(s.psi)}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[#635850] dark:text-[#CBBDB2]">
                      {formatPercent(s.flag_rate)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                          s.type === 'stable'
                            ? 'bg-[#E8F1FA] text-[#4A7AA5] border-[#D0E2F3]'
                            : s.type === 'warn'
                            ? 'bg-[#FEF7DE] text-[#8C6415] border-[#F2DE9D]'
                            : s.type === 'alert'
                            ? 'bg-gradient-to-r from-[#F6BEB0] to-[#E69686] text-white border-white/40 shadow-xs font-black'
                            : 'bg-[#FAF5EE] text-[#94867C] border-[#EADBCC]'
                        }`}
                      >
                        {s.symbol} {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-[#8C7E74] dark:text-[#A8988C] text-[11px] max-w-xs truncate" title={s.reason}>
                      {s.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Khung Gập/Mở "Chú thích các chỉ số" */}
        <div className="clay-card border border-[#EADBCC] dark:border-[#38302A] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="w-full p-4 bg-[#FAF5EE]/90 dark:bg-[#2A2320]/80 hover:bg-[#F2E8DC] dark:hover:bg-[#38302A] text-left font-black text-xs text-[#38312C] dark:text-[#FAF6F0] flex justify-between items-center transition cursor-pointer"
          >
            <span>📘 Chú thích các chỉ số & Trường hợp đặc biệt trong dữ liệu Elliptic</span>
            <span>{showNotes ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
          </button>
          {showNotes && (
            <div className="p-5 text-xs text-[#635850] dark:text-[#CBBDB2] space-y-4 bg-[#FFFDF9] dark:bg-[#231D1A] leading-relaxed border-t border-[#EADBCC] dark:border-[#38302A]">
              <div>
                <h4 className="font-bold text-[#38312C] dark:text-[#FAF6F0] mb-1">1. PSI (Population Stability Index) là gì?</h4>
                <p>
                  So hình dạng phân bố điểm số kỳ này với lúc khỏe. Chia thang 0–1 thành 10 ô bằng nhau, lấy tỉ lệ giao dịch mỗi ô, PSI = tổng (tỉ lệ mới − tỉ lệ cũ) × ln(tỉ lệ mới / tỉ lệ cũ). Không cần nhãn, biết ngay trong kỳ. Trên 0,25 là lệch đáng kể. Tính trên <code>calibrated_score</code>.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#38312C] dark:text-[#FAF6F0] mb-1">2. AP (Average Precision) là gì?</h4>
                <p>
                  Mô hình còn xếp đúng kẻ gian lên đầu danh sách không. Tính trên <code>raw_score</code> vì AP chỉ quan tâm thứ hạng; hiệu chỉnh isotonic gộp nhiều điểm về cùng một mức nên làm mất thứ hạng. So với AP lúc khỏe: dưới 70% là cần chú ý, dưới 50% là báo động. Phải chờ nhãn điều tra; cần ít nhất 10 vụ rửa tiền có nhãn mới chấm.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#38312C] dark:text-[#FAF6F0] mb-1">3. ECE (Expected Calibration Error) là gì?</h4>
                <p>
                  Điểm 0,8 có còn thật sự nghĩa là khoảng 80% khả năng không. Chia 10 ô theo điểm, lấy chênh lệch trung bình giữa điểm dự báo và tỉ lệ thực. Trên 0,10 là điểm số hết đáng tin. Tính trên <code>calibrated_score</code>.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#38312C] dark:text-[#FAF6F0] mb-1">4. Cách nhận biết & Quy tắc 2 kỳ liên tiếp:</h4>
                <p>
                  PSI là tín hiệu nhanh (biết ngay, chưa chắc chắn); AP và ECE là tín hiệu chắc (chờ nhãn). PSI vượt 1 kỳ chỉ là "Cần chú ý"; vượt 2 kỳ liền mới "Báo động". Lý do lấy từ chính dữ liệu: ở t=36, PSI của XGBoost, LightGBM, Random Forest vượt 0,25 nhưng AP vẫn khoảng 100%, sang t=37 PSI tự hạ.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#38312C] dark:text-[#FAF6F0] mb-1">5. Năm trường hợp đặc biệt:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>(1) PSI báo động giả ở t=36</strong> (công ty A, B, C).</li>
                  <li><strong>(2) PSI im lặng dù mô hình hỏng:</strong> Logistic Regression ở t=36 có PSI 0,09 nhưng AP chỉ còn 26% mức khỏe.</li>
                  <li><strong>(3) PSI chậm một nhịp:</strong> MLP ở t=43 có PSI 0,23 (chưa vượt) dù AP đã sụp.</li>
                  <li><strong>(4) Kỳ quá ít nhãn:</strong> t45 chỉ 5 vụ, t46 chỉ 2 vụ, nên ghi "Chưa đủ nhãn".</li>
                  <li><strong>(5) Tỉ lệ rửa tiền nền tụt</strong> từ 17% (t31–34) xuống 1,75% (t43) cũng kéo AP xuống, nên ngưỡng theo % mức khỏe phản ánh một phần thay đổi tỉ lệ nền.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BƯỚC 3 – PHÂN LUỒNG ĐÁNH GIÁ */}
      <div className="clay-card p-6 sm:p-8 rounded-[32px] border border-[#EFE4D6] dark:border-[#38302A] space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#A2C4B5] to-[#7EA997] text-white text-xs font-black flex items-center justify-center clay-disc shadow-sm border border-white/40">
            3
          </span>
          <h3 className="text-lg font-black text-[#38312C] dark:text-[#FAF6F0]">BƯỚC 3 – PHÂN LUỒNG ĐÁNH GIÁ</h3>
        </div>

        {/* Dải 15 Ô Trạng Thái (t35 -> t49) */}
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
            <span className="font-black text-[#38312C] dark:text-[#FAF6F0]">
              Dải trạng thái giám sát theo kỳ (t35 → t49)
            </span>
            <div className="flex flex-wrap space-x-3 text-[11px] font-bold">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8BAFD4] mr-1.5"></span>✓ Ổn định
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373] mr-1.5"></span>! Cần chú ý
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E69686] mr-1.5"></span>✕ Báo động
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9C8B8] mr-1.5"></span>– Chưa đủ nhãn
              </span>
            </div>
          </div>

          <div
            className="grid gap-2 text-center"
            style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
          >
            {evaluatedSteps.map((s) => {
              let cellClass = '';
              if (s.type === 'stable') {
                cellClass = 'bg-gradient-to-b from-[#F4F8FC] to-[#E5EFF8] dark:from-[#202933] dark:to-[#17202A] text-[#345D82] dark:text-[#B8D3EC] border-[#BCD4EC] dark:border-[#35485B]';
              } else if (s.type === 'warn') {
                cellClass = 'bg-gradient-to-b from-[#FFFDF5] to-[#FEF7DE] dark:from-[#2B271C] dark:to-[#221D12] text-[#8C6415] dark:text-[#F3D990] border-[#F2DE9D] dark:border-[#4D3F1E] font-bold';
              } else if (s.type === 'alert') {
                cellClass = 'bg-gradient-to-b from-[#FDEEEA] to-[#F7CCC3] dark:from-[#3D2520] dark:to-[#2D1713] text-[#A64532] dark:text-[#F8C8BE] border-[#E69686] dark:border-[#7A3629] font-black shadow-sm';
              } else {
                cellClass = 'bg-[#FAF5EE] dark:bg-[#231D1A] text-[#94867C] dark:text-[#8C7E74] border-[#EADBCC] dark:border-[#38302A]';
              }

              return (
                <div
                  key={s.t}
                  className={`p-2.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer hover:scale-105 hover:-translate-y-0.5 clay-disc ${cellClass}`}
                  title={`t${s.t}: ${s.status} (${s.reason})`}
                >
                  <div className="text-[10px] font-bold">t{s.t}</div>
                  <div className="text-sm my-0.5">{s.symbol}</div>
                  <div className="text-[10px] font-bold">
                    {s.type === 'missing' ? `${s.n_pos} nhãn` : formatPercent(s.ap_ratio, 0)}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#8C7E74] dark:text-[#A8988C] italic">
            * Dải ô cho biết mô hình hỏng từ khi nào và kéo dài bao lâu theo 5 quy tắc giám sát chuyên sâu.
          </p>
        </div>

        {/* BIỂU ĐỒ RECHARTS (Phong cách Đất Sét Pastel Sooti) */}
        <div className="space-y-5 pt-4 border-t border-[#EFE4D6] dark:border-[#38302A]">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-[#38312C] dark:text-[#FAF6F0]">Biểu đồ AP theo từng kỳ (t35–49)</h4>
            <p className="text-xs text-[#635850] dark:text-[#CBBDB2]">
              Biểu đồ cho biết mức độ suy giảm theo thời gian. Đường nét đứt: Mức khỏe ({formatNum(summaryCards.refAP)}), Chú ý ({formatPercent(thresholds.warn_ratio, 0)} = {formatNum(summaryCards.refAP * thresholds.warn_ratio)}) và Báo động ({formatPercent(thresholds.alert_ratio, 0)} = {formatNum(summaryCards.refAP * thresholds.alert_ratio)}).
            </p>
          </div>

          {/* Recharts AP Line Chart */}
          <div className="h-64 w-full bg-[#FAF5EE]/70 dark:bg-[#231D1A]/60 p-3 rounded-2xl border border-[#EADBCC] dark:border-[#38302A] clay-inset">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evaluatedSteps} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#38302A' : '#EFE4D6'} vertical={false} />
                <XAxis dataKey="t" tickFormatter={(t) => `t${t}`} tick={{ fontSize: 11, fill: isDarkMode ? '#CBBDB2' : '#635850', fontWeight: 'bold' }} />
                <YAxis domain={[0, 1.05]} tickFormatter={(v) => formatNum(v, 2)} tick={{ fontSize: 11, fill: isDarkMode ? '#CBBDB2' : '#635850', fontWeight: 'bold' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as EvaluatedStep;
                      return (
                        <div className="clay-card p-3.5 rounded-2xl border border-[#EADBCC] dark:border-[#38302A] text-xs space-y-1 shadow-xl bg-[#FFFDF9] dark:bg-[#231D1A] text-[#38312C] dark:text-[#FAF6F0]">
                          <p className="font-black text-[#E69686]">Kỳ t{label} ({d.symbol} {d.status})</p>
                          <p>AP thực tế: <span className="font-mono font-bold">{formatNum(d.ap)}</span></p>
                          <p>% Mức khỏe: <span className="font-mono font-bold">{formatPercent(d.ap_ratio)}</span></p>
                          <p>PSI: <span className="font-mono">{formatNum(d.psi)}</span> | ECE: <span className="font-mono">{formatNum(d.ece)}</span></p>
                          <p className="text-[10px] text-[#8C7E74] dark:text-[#A8988C] mt-1 max-w-xs">{d.reason}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={summaryCards.refAP}
                  stroke="#8BAFD4"
                  strokeDasharray="4 4"
                  label={{ value: 'Mức khỏe', fill: '#4A7AA5', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                />
                <ReferenceLine
                  y={summaryCards.refAP * thresholds.warn_ratio}
                  stroke="#D4A373"
                  strokeDasharray="5 5"
                  label={{ value: `Chú ý (${formatPercent(thresholds.warn_ratio, 0)})`, fill: '#B58522', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                />
                <ReferenceLine
                  y={summaryCards.refAP * thresholds.alert_ratio}
                  stroke="#E69686"
                  strokeDasharray="5 5"
                  label={{ value: `Báo động (${formatPercent(thresholds.alert_ratio, 0)})`, fill: '#D88170', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="ap"
                  stroke="#8BAFD4"
                  strokeWidth={3}
                  dot={{ r: 4.5, strokeWidth: 2, fill: '#668FB7', stroke: '#FFFDF9' }}
                  activeDot={{ r: 7, fill: '#E69686', stroke: '#FFFDF9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recharts PSI Bar Chart (Pastel Coral) */}
          <div className="space-y-1.5 pt-2">
            <h5 className="text-xs font-black text-[#38312C] dark:text-[#FAF6F0]">
              Độ lệch phân phối PSI theo kỳ (Đường chuẩn: Ngưỡng {formatNum(thresholds.psi_alert, 2)})
            </h5>
            <div className="h-32 w-full bg-[#FAF5EE]/70 dark:bg-[#231D1A]/60 p-3 rounded-2xl border border-[#EADBCC] dark:border-[#38302A] clay-inset">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evaluatedSteps} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#38302A' : '#EFE4D6'} vertical={false} />
                  <XAxis dataKey="t" tickFormatter={(t) => `t${t}`} tick={{ fontSize: 10, fill: isDarkMode ? '#CBBDB2' : '#635850', fontWeight: 'bold' }} />
                  <YAxis tickFormatter={(v) => formatNum(v, 2)} tick={{ fontSize: 10, fill: isDarkMode ? '#CBBDB2' : '#635850', fontWeight: 'bold' }} />
                  <ReferenceLine
                    y={thresholds.psi_alert}
                    stroke="#D88170"
                    strokeDasharray="4 4"
                    label={{ value: formatNum(thresholds.psi_alert, 2), fill: '#D88170', fontSize: 10, position: 'right', fontWeight: 'bold' }}
                  />
                  <Bar
                    dataKey="psi"
                    fill="#E69686"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* BỐN KHUNG LUỒNG XỬ LÝ (CLAY CARDS) */}
        <div className="space-y-3 pt-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#8C7E74] dark:text-[#A8988C]">
            Khung hành động theo phân luồng
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Luồng 1: Ổn định */}
            {(() => {
              const periods = evaluatedSteps.filter((s) => s.type === 'stable').map((s) => `t${s.t}`);
              const isActive = periods.length > 0;
              return (
                <div
                  className={`p-5 rounded-[24px] border transition-all ${
                    isActive
                      ? 'clay-card bg-[#F4F8FC] dark:bg-[#1E2730] border-[#D0E2F3] dark:border-[#35485B] text-[#38312C] dark:text-[#FAF6F0] shadow-sm'
                      : 'bg-[#FAF5EE]/40 dark:bg-[#231D1A]/30 border-[#EADBCC]/60 dark:border-[#38302A] text-[#94867C] opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2 font-black">
                    <span className="text-[#4A7AA5]">✓ Luồng Ổn định</span>
                    <span className="text-[11px] bg-[#FFFDF9] dark:bg-[#15171B] text-[#4A7AA5] px-2.5 py-0.5 rounded-full font-mono border border-[#D0E2F3] font-bold clay-pill">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#635850] dark:text-[#CBBDB2]">
                    Giữ nguyên mô hình phục vụ chấm điểm tự động. Tiếp tục ghi nhận nhật ký giao dịch và theo dõi định kỳ.
                  </p>
                </div>
              );
            })()}

            {/* Luồng 2: Cần chú ý */}
            {(() => {
              const periods = evaluatedSteps.filter((s) => s.type === 'warn').map((s) => `t${s.t}`);
              const isActive = periods.length > 0;
              return (
                <div
                  className={`p-5 rounded-[24px] border transition-all ${
                    isActive
                      ? 'clay-card bg-[#FFFDF5] dark:bg-[#29251D] border-[#F2DE9D] dark:border-[#4D3F1E] text-[#38312C] dark:text-[#FAF6F0] shadow-sm'
                      : 'bg-[#FAF5EE]/40 dark:bg-[#231D1A]/30 border-[#EADBCC]/60 dark:border-[#38302A] text-[#94867C] opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2 font-black">
                    <span className="text-[#B58522]">! Luồng Cần chú ý</span>
                    <span className="text-[11px] bg-[#FEF7DE] text-[#8C6415] px-2.5 py-0.5 rounded-full font-mono font-bold border border-[#F2DE9D] clay-pill">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#635850] dark:text-[#CBBDB2]">
                    Rà soát thủ công một mẫu giao dịch điểm thấp, kiểm tra nguồn dữ liệu và đặc trưng, cân nhắc hiệu chỉnh lại isotonic trên dữ liệu gần nhất.
                  </p>
                </div>
              );
            })()}

            {/* Luồng 3: Báo động */}
            {(() => {
              const periods = evaluatedSteps.filter((s) => s.type === 'alert').map((s) => `t${s.t}`);
              const isActive = periods.length > 0;
              return (
                <div
                  className={`p-5 rounded-[24px] border-2 transition-all ${
                    isActive
                      ? 'clay-card bg-[#FDF4F2] dark:bg-[#301F1C] border-[#E69686] dark:border-[#7A3629] text-[#38312C] dark:text-[#FAF6F0] shadow-md'
                      : 'bg-[#FAF5EE]/40 dark:bg-[#231D1A]/30 border-[#EADBCC]/60 dark:border-[#38302A] text-[#94867C] opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2 font-black">
                    <span className="text-[#D88170]">✕ Luồng Báo động</span>
                    <span className="text-[11px] bg-gradient-to-r from-[#F6BEB0] to-[#E69686] text-white px-2.5 py-0.5 rounded-full font-mono font-black shadow-xs">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#635850] dark:text-[#CBBDB2]">
                    Không dựa vào điểm mô hình để bỏ qua giao dịch, chuyển chế độ dự phòng (hạ ngưỡng, tăng xem xét thủ công), huấn luyện lại với dữ liệu có nhãn mới nhất rồi lập lại mốc tham chiếu. Báo động hai kỳ liền thì mở quy trình huấn luyện lại.
                  </p>
                </div>
              );
            })()}

            {/* Luồng 4: Chưa đủ nhãn */}
            {(() => {
              const periods = evaluatedSteps.filter((s) => s.type === 'missing').map((s) => `t${s.t}`);
              const isActive = periods.length > 0;
              return (
                <div
                  className={`p-5 rounded-[24px] border transition-all ${
                    isActive
                      ? 'clay-card bg-[#FAF5EE] dark:bg-[#231D1A] border-[#EADBCC] dark:border-[#38302A] text-[#38312C] dark:text-[#FAF6F0] shadow-sm'
                      : 'bg-[#FAF5EE]/40 dark:bg-[#231D1A]/30 border-[#EADBCC]/60 dark:border-[#38302A] text-[#94867C] opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2 font-black">
                    <span className="text-[#8C7E74]">– Luồng Chưa đủ nhãn</span>
                    <span className="text-[11px] bg-[#FFFDF9] dark:bg-[#2A2320] text-[#8C7E74] px-2.5 py-0.5 rounded-full font-mono font-bold border border-[#EADBCC] clay-pill">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#635850] dark:text-[#CBBDB2]">
                    Chưa kết luận về AP, tạm thời dựa vào chỉ số không cần nhãn (PSI), chủ động thúc đẩy điều tra để thu thập thêm nhãn thực tế.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Khung Kết Luận Tự Động (Claymorphic) */}
        <div className="clay-card bg-[#FAF5EE]/90 dark:bg-[#2A2320]/80 border border-[#EADBCC] dark:border-[#443832] p-5 rounded-[24px] text-xs text-[#38312C] dark:text-[#FAF6F0] space-y-1.5 shadow-xs">
          <p className="font-black flex items-center gap-2 text-sm text-[#E69686]">
            <span>🤖</span> Kết luận tự động từ hệ thống:
          </p>
          <p className="leading-relaxed text-[#635850] dark:text-[#CBBDB2]">{autoConclusion}</p>
        </div>

        {/* Nút Tải Báo Cáo & Về Trang Chủ */}
        <div className="flex flex-wrap justify-between items-center pt-5 border-t border-[#EFE4D6] dark:border-[#38302A] gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs bg-[#FAF5EE] hover:bg-[#F2E8DC] dark:bg-[#2A2320] dark:hover:bg-[#38302A] text-[#38312C] dark:text-[#FAF6F0] font-bold px-5 py-3 rounded-2xl border border-[#EADBCC] dark:border-[#443832] clay-btn transition cursor-pointer shadow-xs"
          >
            🔄 Kiểm thử công ty khác
          </button>

          <button
            type="button"
            onClick={downloadReportCSV}
            className="text-xs clay-btn bg-gradient-to-r from-[#E69686] via-[#DE8776] to-[#D88170] hover:from-[#ED9E8E] text-white font-black px-7 py-3 rounded-2xl shadow-lg border border-white/40 transition flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <span>📥 Tải báo cáo kiểm thử (CSV)</span>
          </button>
        </div>
      </div>
    </main>
  );
};

