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
        <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-300 dark:border-zinc-700 space-y-4 animate-pulse">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-900 dark:text-white">
            <span>Đang tiến hành kiểm thử toàn diện mô hình AML...</span>
            <span>{Math.round((progressStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-black dark:bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${(progressStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="space-y-1 font-mono text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
            {progressLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-black dark:text-white font-bold">✓</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Bar on Testing Screen */}
      <div className="bg-white dark:bg-[#15171B] p-4 px-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-bold flex items-center justify-center text-lg">
            {currentCompany.code}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{currentCompany.name}</h3>
            <p className="text-xs text-zinc-400">Mô hình: {currentCompany.model} · Đã chấm điểm t31–t49</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Badge nguồn kết quả */}
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 font-medium">
            {isCustomMode ? '⚙️ Tính trực tiếp trên dữ liệu của bạn' : '📦 Kết quả đã chạy sẵn (Pre-computed)'}
          </span>

          {/* Công tắc 5 seed / seed 42 */}
          {!isCustomMode && (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full flex text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDisplayMode('5seed')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  displayMode === '5seed'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                🎛️ Trung bình 5 seed
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('seed42')}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  displayMode === 'seed42'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
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
            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1 cursor-pointer"
          >
            💻 Code để chạy
          </button>
        </div>
      </div>

      {/* Khung Gập/Mở "Code để chạy" */}
      {showCodeSnippet && (
        <div className="bg-[#121316] text-zinc-200 p-5 rounded-3xl shadow-card border border-zinc-800 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-800">
            <span className="font-semibold text-white flex items-center gap-2">
              <span>🐍</span>
              <span>Trích từ tinh_chi_so_giam_sat.py – Định nghĩa & giải thích chi tiết từng dòng lệnh</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(CODE_SNIPPET);
                }}
                className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                title="Sao chép toàn bộ mã nguồn"
              >
                📋 Sao chép code
              </button>
              <button
                type="button"
                onClick={() => setShowCodeSnippet(false)}
                className="hover:text-white cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto text-[11px] leading-relaxed text-zinc-300 font-mono whitespace-pre">
            {CODE_SNIPPET}
          </pre>
        </div>
      )}

      {/* BƯỚC 1 – NHẬN DỮ LIỆU */}
      <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">BƯỚC 1 – NHẬN DỮ LIỆU</h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mô hình đã chấm điểm <strong>{formatInt(currentCompany.n_rows)}</strong> giao dịch; mỗi giao dịch có mã, kỳ thời gian, điểm số và nhãn điều tra.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="py-2.5 px-3">Kỳ thời gian</th>
                <th className="py-2.5 px-3">Số giao dịch có nhãn (n)</th>
                <th className="py-2.5 px-3">Số vụ rửa tiền (n_pos)</th>
                <th className="py-2.5 px-3">Tỉ lệ rửa tiền nền (Prevalence)</th>
                <th className="py-2.5 px-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr className="bg-zinc-100/70 dark:bg-zinc-800/40 font-bold text-zinc-950 dark:text-white">
                <td className="py-2.5 px-3">Tham chiếu t31–34</td>
                <td className="py-2.5 px-3">{formatInt(duLieuApp.ref.n)}</td>
                <td className="py-2.5 px-3">{formatInt(duLieuApp.ref.n_pos)}</td>
                <td className="py-2.5 px-3">{formatPercent(duLieuApp.ref.prevalence)}</td>
                <td className="py-2.5 px-3 font-semibold text-black dark:text-white">Mốc chuẩn lúc khỏe</td>
              </tr>
              {duLieuApp.steps.map((s) => (
                <tr key={s.t} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">Kỳ t{s.t}</td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{formatInt(s.n)}</td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{formatInt(s.n_pos)}</td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{formatPercent(s.prevalence)}</td>
                  <td className="py-2 px-3 text-zinc-400">
                    {s.n_pos < thresholds.min_pos ? (
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
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
      <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">BƯỚC 2 – GHI KẾT QUẢ</h3>
        </div>

        {/* 4 Ô Tóm tắt chỉ số */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 font-medium">AP mức khỏe (Tham chiếu t31–34)</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {formatNum(summaryCards.refAP)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Tỉ lệ rửa tiền nền: {formatPercent(duLieuApp.ref.prevalence)}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 font-medium">AP gộp t35–49</p>
            <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mt-1">
              {formatNum(summaryCards.gopAP)}
            </p>
            <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mt-1">
              ⚠️ Con số thường được báo cáo (Che lấp suy giảm)
            </p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border-2 border-black dark:border-white">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">AP khối Muộn (t45–49)</p>
            <p className="text-2xl font-black text-black dark:text-white mt-1">
              {formatNum(summaryCards.muocAP)}
            </p>
            <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mt-1">
              ✕ Sụp đổ hoàn toàn so với lúc khỏe
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 font-medium">Kỳ báo động đầu tiên</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {summaryCards.firstAlertPeriod}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 truncate" title={summaryCards.firstAlertReason}>
              {summaryCards.firstAlertReason}
            </p>
          </div>
        </div>

        {/* Bảng 15 dòng t35–49 */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="py-2.5 px-3">Kỳ</th>
                <th className="py-2.5 px-3">Số vụ RT</th>
                <th className="py-2.5 px-3">AP</th>
                <th className="py-2.5 px-3">% Mức khỏe</th>
                <th className="py-2.5 px-3">ECE</th>
                <th className="py-2.5 px-3">PSI</th>
                <th className="py-2.5 px-3">Gắn cờ (%)</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {evaluatedSteps.map((s) => {
                const isAPAlert = s.ap_ratio !== null && s.ap_ratio < thresholds.alert_ratio;
                const isPSIVuot = s.psi > thresholds.psi_alert;
                const isECEWarn = s.ece > thresholds.ece_warn;

                let rowBg = '';
                if (s.type === 'alert') rowBg = 'bg-zinc-200/50 dark:bg-zinc-800/70 font-semibold';
                else if (s.type === 'warn') rowBg = 'bg-zinc-100/50 dark:bg-zinc-800/30';

                return (
                  <tr key={s.t} className={`hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 ${rowBg}`}>
                    <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">t{s.t}</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">{s.n_pos}</td>
                    <td
                      className={`py-2.5 px-3 font-mono font-bold ${
                        isAPAlert ? 'text-black dark:text-white underline' : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {formatNum(s.ap)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{formatPercent(s.ap_ratio)}</td>
                    <td
                      className={`py-2.5 px-3 font-mono ${
                        isECEWarn ? 'font-bold underline text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {formatNum(s.ece)}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono font-bold ${
                        isPSIVuot ? 'underline text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {formatNum(s.psi)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {formatPercent(s.flag_rate)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          s.type === 'stable'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                            : s.type === 'warn'
                            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-400 dark:border-zinc-600'
                            : s.type === 'alert'
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {s.symbol} {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 text-[11px] max-w-xs truncate" title={s.reason}>
                      {s.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Khung Gập/Mở "Chú thích các chỉ số" */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-bold text-xs text-zinc-800 dark:text-zinc-200 flex justify-between items-center transition cursor-pointer"
          >
            <span>📘 Chú thích các chỉ số & Trường hợp đặc biệt trong dữ liệu Elliptic</span>
            <span>{showNotes ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
          </button>
          {showNotes && (
            <div className="p-5 text-xs text-zinc-700 dark:text-zinc-300 space-y-4 bg-white dark:bg-[#15171B] leading-relaxed">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">1. PSI (Population Stability Index) là gì?</h4>
                <p>
                  So hình dạng phân bố điểm số kỳ này với lúc khỏe. Chia thang 0–1 thành 10 ô bằng nhau, lấy tỉ lệ giao dịch mỗi ô, PSI = tổng (tỉ lệ mới − tỉ lệ cũ) × ln(tỉ lệ mới / tỉ lệ cũ). Không cần nhãn, biết ngay trong kỳ. Trên 0,25 là lệch đáng kể. Tính trên <code>calibrated_score</code>.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">2. AP (Average Precision) là gì?</h4>
                <p>
                  Mô hình còn xếp đúng kẻ gian lên đầu danh sách không. Tính trên <code>raw_score</code> vì AP chỉ quan tâm thứ hạng; hiệu chỉnh isotonic gộp nhiều điểm về cùng một mức nên làm mất thứ hạng. So với AP lúc khỏe: dưới 70% là cần chú ý, dưới 50% là báo động. Phải chờ nhãn điều tra; cần ít nhất 10 vụ rửa tiền có nhãn mới chấm.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">3. ECE (Expected Calibration Error) là gì?</h4>
                <p>
                  Điểm 0,8 có còn thật sự nghĩa là khoảng 80% khả năng không. Chia 10 ô theo điểm, lấy chênh lệch trung bình giữa điểm dự báo và tỉ lệ thực. Trên 0,10 là điểm số hết đáng tin. Tính trên <code>calibrated_score</code>.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">4. Cách nhận biết & Quy tắc 2 kỳ liên tiếp:</h4>
                <p>
                  PSI là tín hiệu nhanh (biết ngay, chưa chắc chắn); AP và ECE là tín hiệu chắc (chờ nhãn). PSI vượt 1 kỳ chỉ là "Cần chú ý"; vượt 2 kỳ liền mới "Báo động". Lý do lấy từ chính dữ liệu: ở t=36, PSI của XGBoost, LightGBM, Random Forest vượt 0,25 nhưng AP vẫn khoảng 100%, sang t=37 PSI tự hạ.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">5. Năm trường hợp đặc biệt:</h4>
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
      <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">BƯỚC 3 – PHÂN LUỒNG ĐÁNH GIÁ</h3>
        </div>

        {/* Dải 15 Ô Trạng Thái (t35 -> t49) */}
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              Dải trạng thái giám sát theo kỳ (t35 → t49)
            </span>
            <div className="flex flex-wrap space-x-3 text-[11px]">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 mr-1.5"></span>✓ Ổn định
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 mr-1.5"></span>! Cần chú ý
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white mr-1.5"></span>✕ Báo động
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mr-1.5"></span>– Chưa đủ nhãn
              </span>
            </div>
          </div>

          <div
            className="grid gap-1.5 text-center"
            style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
          >
            {evaluatedSteps.map((s) => {
              let cellClass = '';
              if (s.type === 'stable') {
                cellClass = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700';
              } else if (s.type === 'warn') {
                cellClass = 'bg-zinc-200 dark:bg-zinc-700 text-zinc-950 dark:text-white border-zinc-400 dark:border-zinc-600 font-semibold';
              } else if (s.type === 'alert') {
                cellClass = 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold shadow-md';
              } else {
                cellClass = 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800';
              }

              return (
                <div
                  key={s.t}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer hover:scale-105 ${cellClass}`}
                  title={`t${s.t}: ${s.status} (${s.reason})`}
                >
                  <div className="text-[10px] font-semibold">t{s.t}</div>
                  <div className="text-sm my-0.5">{s.symbol}</div>
                  <div className="text-[10px]">
                    {s.type === 'missing' ? `${s.n_pos} nhãn` : formatPercent(s.ap_ratio, 0)}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400 italic">
            * Dải ô cho biết mô hình hỏng từ khi nào và kéo dài bao lâu.
          </p>
        </div>

        {/* BIỂU ĐỒ RECHARTS (Đen Trắng Tối Giản) */}
        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Biểu đồ AP theo từng kỳ (t35–49)</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Biểu đồ cho biết tệ đến mức nào, tụt từ từ hay đột ngột. Đường nét đứt: Mức khỏe ({formatNum(summaryCards.refAP)}), Chú ý ({formatPercent(thresholds.warn_ratio, 0)} = {formatNum(summaryCards.refAP * thresholds.warn_ratio)}) và Báo động ({formatPercent(thresholds.alert_ratio, 0)} = {formatNum(summaryCards.refAP * thresholds.alert_ratio)}).
            </p>
          </div>

          {/* Recharts AP Line Chart */}
          <div className="h-64 w-full bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evaluatedSteps} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#27272A' : '#E5E7EB'} vertical={false} />
                <XAxis dataKey="t" tickFormatter={(t) => `t${t}`} tick={{ fontSize: 11, fill: isDarkMode ? '#A1A1AA' : '#6B7280' }} />
                <YAxis domain={[0, 1.05]} tickFormatter={(v) => formatNum(v, 2)} tick={{ fontSize: 11, fill: isDarkMode ? '#A1A1AA' : '#6B7280' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as EvaluatedStep;
                      return (
                        <div className="bg-black text-white dark:bg-white dark:text-black p-3 rounded-xl text-xs space-y-1 shadow-2xl border border-zinc-800 dark:border-zinc-200">
                          <p className="font-bold">Kỳ t{label} ({d.symbol} {d.status})</p>
                          <p>AP thực tế: <span className="font-mono font-bold">{formatNum(d.ap)}</span></p>
                          <p>% Mức khỏe: <span className="font-mono">{formatPercent(d.ap_ratio)}</span></p>
                          <p>PSI: <span className="font-mono">{formatNum(d.psi)}</span> | ECE: <span className="font-mono">{formatNum(d.ece)}</span></p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1 max-w-xs">{d.reason}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={summaryCards.refAP}
                  stroke={isDarkMode ? '#A1A1AA' : '#6B7280'}
                  strokeDasharray="4 4"
                  label={{ value: 'Mức khỏe', fill: isDarkMode ? '#A1A1AA' : '#6B7280', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={summaryCards.refAP * thresholds.warn_ratio}
                  stroke={isDarkMode ? '#D4D4D8' : '#4B5563'}
                  strokeDasharray="5 5"
                  label={{ value: `Chú ý (${formatPercent(thresholds.warn_ratio, 0)})`, fill: isDarkMode ? '#D4D4D8' : '#4B5563', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={summaryCards.refAP * thresholds.alert_ratio}
                  stroke={isDarkMode ? '#FFFFFF' : '#000000'}
                  strokeDasharray="5 5"
                  label={{ value: `Báo động (${formatPercent(thresholds.alert_ratio, 0)})`, fill: isDarkMode ? '#FFFFFF' : '#000000', fontSize: 10, position: 'top' }}
                />
                <Line
                  type="monotone"
                  dataKey="ap"
                  stroke={isDarkMode ? '#FFFFFF' : '#000000'}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1, fill: isDarkMode ? '#FFFFFF' : '#000000' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recharts PSI Bar Chart (Đen Trắng) */}
          <div className="space-y-1 pt-2">
            <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Độ lệch phân phối PSI theo kỳ (Đường chuẩn: Ngưỡng {formatNum(thresholds.psi_alert, 2)})
            </h5>
            <div className="h-32 w-full bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evaluatedSteps} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#27272A' : '#E5E7EB'} vertical={false} />
                  <XAxis dataKey="t" tickFormatter={(t) => `t${t}`} tick={{ fontSize: 10, fill: isDarkMode ? '#A1A1AA' : '#6B7280' }} />
                  <YAxis tickFormatter={(v) => formatNum(v, 2)} tick={{ fontSize: 10, fill: isDarkMode ? '#A1A1AA' : '#6B7280' }} />
                  <ReferenceLine
                    y={thresholds.psi_alert}
                    stroke={isDarkMode ? '#FFFFFF' : '#000000'}
                    strokeDasharray="4 4"
                    label={{ value: formatNum(thresholds.psi_alert, 2), fill: isDarkMode ? '#FFFFFF' : '#000000', fontSize: 10, position: 'right' }}
                  />
                  <Bar
                    dataKey="psi"
                    fill={isDarkMode ? '#E4E4E7' : '#27272A'}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* BỐN KHUNG LUỒNG XỬ LÝ (ĐEN TRẮNG) */}
        <div className="space-y-3 pt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Khung hành động theo phân luồng</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Luồng 1: Ổn định */}
            {(() => {
              const periods = evaluatedSteps.filter((s) => s.type === 'stable').map((s) => `t${s.t}`);
              const isActive = periods.length > 0;
              return (
                <div
                  className={`p-4 rounded-2xl border transition ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>✓ Luồng Ổn định</span>
                    <span className="text-[11px] bg-white dark:bg-zinc-900 text-black dark:text-white px-2 py-0.5 rounded-full font-mono border border-zinc-200 dark:border-zinc-700">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
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
                  className={`p-4 rounded-2xl border transition ${
                    isActive
                      ? 'bg-zinc-200 dark:bg-zinc-700/80 border-zinc-400 dark:border-zinc-500 text-black dark:text-white shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>! Luồng Cần chú ý</span>
                    <span className="text-[11px] bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full font-mono">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
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
                  className={`p-4 rounded-2xl border-2 transition ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                      : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5 font-black">
                    <span>✕ Luồng Báo động</span>
                    <span className="text-[11px] bg-white text-black dark:bg-black dark:text-white px-2 py-0.5 rounded-full font-mono font-bold">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
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
                  className={`p-4 rounded-2xl border transition ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span>– Luồng Chưa đủ nhãn</span>
                    <span className="text-[11px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                      {periods.length ? periods.join(', ') : 'Không có kỳ nào'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Chưa kết luận về AP, tạm thời dựa vào chỉ số không cần nhãn (PSI), chủ động thúc đẩy điều tra để thu thập thêm nhãn thực tế.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Khung Kết Luận Tự Động (Đen Trắng) */}
        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 space-y-1">
          <p className="font-black flex items-center gap-1.5">
            <span>🤖</span> Kết luận tự động từ hệ thống:
          </p>
          <p className="leading-relaxed">{autoConclusion}</p>
        </div>

        {/* Nút Tải Báo Cáo & Về Trang Chủ */}
        <div className="flex flex-wrap justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800 gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 transition cursor-pointer"
          >
            🔄 Kiểm thử công ty khác
          </button>

          <button
            type="button"
            onClick={downloadReportCSV}
            className="text-xs bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <span>📥 Tải báo cáo kiểm thử (CSV)</span>
          </button>
        </div>
      </div>
    </main>
  );
};
