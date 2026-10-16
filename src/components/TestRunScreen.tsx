import React, { useState, useEffect, useMemo } from 'react';
import { Company, baseConfig } from '../data/du_lieu_app.ts';
import {
  ThresholdConfig,
  formatNum,
  formatPct,
  evaluateStatus,
  generateSummaryNarrative,
  StatusEvaluation,
  StatusType
} from '../utils/metrics.ts';
import { CodeDisplay } from './CodeDisplay.tsx';
import { MetricExplainer } from './MetricExplainer.tsx';
import {
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  TrendingDown,
  ChevronRight,
  Database,
  BarChart3,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell
} from 'recharts';

export interface CustomTestPayload {
  name: string;
  model: string;
  isCustom: boolean;
  n_rows: number;
  n_pos: number;
  ref: {
    ap: number;
    ece: number;
  };
  step: {
    t: number;
    ap: number;
    ap_ratio: number;
    ece: number;
    psi: number;
    flag_rate: number;
    n_pos: number;
    n: number;
  }[];
  block: {
    Sớm: { ap: number; ece: number };
    Giữa: { ap: number; ece: number };
    Muộn: { ap: number; ece: number };
    Gộp: { ap: number; ece: number };
  };
}

interface TestRunScreenProps {
  company?: Company;
  customData?: CustomTestPayload;
  thresholds: ThresholdConfig;
  onBackToHome: () => void;
}

export const TestRunScreen: React.FC<TestRunScreenProps> = ({
  company,
  customData,
  thresholds,
  onBackToHome
}) => {
  const isCustom = !company && !!customData;
  const [seedMode, setSeedMode] = useState<'mean_5seed' | 'seed42'>('mean_5seed');

  // Simulation loading state
  const [progressStep, setProgressStep] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Active step in process viewing (1: Nhận dữ liệu, 2: Ghi kết quả, 3: Phân luồng)
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  const activeData = useMemo(() => {
    if (customData) {
      return {
        ref: customData.ref,
        step: customData.step,
        block: customData.block
      };
    }
    if (company) {
      return seedMode === 'mean_5seed' ? company.mean_5seed : company.seed42;
    }
    return null;
  }, [company, customData, seedMode]);

  const companyName = company ? company.name : customData?.name || 'Dữ liệu tùy chỉnh';
  const modelName = company ? company.model : customData?.model || 'Mô hình tùy chỉnh';
  const nRows = company ? company.n_rows : customData?.n_rows || 0;
  const nPosTotal = company ? company.n_pos : customData?.n_pos || 0;

  // Simulate execution timeline on mount
  useEffect(() => {
    setProgressStep(1);
    const t1 = setTimeout(() => setProgressStep(2), 500);
    const t2 = setTimeout(() => setProgressStep(3), 1100);
    const t3 = setTimeout(() => setProgressStep(4), 1600);
    const t4 = setTimeout(() => {
      setProgressStep(5);
      setLoadingComplete(true);
      setActiveStepTab(1);
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [company, customData]);

  // Evaluate status for 15 steps t35 -> t49
  const evaluatedSteps = useMemo(() => {
    if (!activeData) return [];
    let prevPsiVuot = false;

    return activeData.step.map((s, idx) => {
      // Get n_pos from global steps table if pre-computed, or from step if custom
      let n_pos = 0;
      if (customData && 'n_pos' in s) {
        n_pos = s.n_pos;
      } else {
        const stepMeta = baseConfig.steps.find((item) => item.t === s.t);
        n_pos = stepMeta ? stepMeta.n_pos : 15;
      }

      const ev = evaluateStatus(
        n_pos,
        s.ap_ratio,
        s.ece,
        s.psi,
        prevPsiVuot,
        thresholds
      );

      prevPsiVuot = ev.psi_vuot;

      return {
        ...s,
        n_pos,
        evaluation: ev
      };
    });
  }, [activeData, customData, thresholds]);

  // First alert period
  const firstAlertPeriod = useMemo(() => {
    const alert = evaluatedSteps.find((s) => s.evaluation.status === 'bao_dong');
    return alert ? `t=${alert.t}` : 'Không có';
  }, [evaluatedSteps]);

  // Group steps by status for workflow routing cards
  const stepsByStatus = useMemo(() => {
    const groups: Record<StatusType, number[]> = {
      on_dinh: [],
      chu_y: [],
      bao_dong: [],
      chua_du_nhan: []
    };
    evaluatedSteps.forEach((s) => {
      groups[s.evaluation.status].push(s.t);
    });
    return groups;
  }, [evaluatedSteps]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!activeData) return [];
    const refAp = activeData.ref.ap;

    return evaluatedSteps.map((s) => {
      const apSd = 'ap_sd' in s ? (s.ap_sd as number) || 0 : 0;
      return {
        t: `t${s.t}`,
        periodNum: s.t,
        ap: s.ap,
        ap_upper: Math.min(1.0, s.ap + apSd),
        ap_lower: Math.max(0, s.ap - apSd),
        apSd,
        psi: s.psi,
        ece: s.ece,
        ap_ratio: s.ap_ratio,
        status: s.evaluation.status,
        statusLabel: s.evaluation.label,
        reason: s.evaluation.reason,
        refAp: refAp,
        warnAp: refAp * thresholds.warn_ratio,
        alertAp: refAp * thresholds.alert_ratio
      };
    });
  }, [activeData, evaluatedSteps, thresholds]);

  // Summary narrative sentence
  const narrative = useMemo(() => {
    if (!activeData) return '';
    return generateSummaryNarrative(
      companyName,
      modelName,
      activeData.ref.ap,
      activeData.block.Gộp.ap,
      activeData.block.Muộn.ap,
      evaluatedSteps.map((s) => ({
        t: s.t,
        ap: s.ap,
        ap_ratio: s.ap_ratio,
        psi: s.psi,
        ece: s.ece,
        n_pos: s.n_pos
      })),
      evaluatedSteps.map((s) => ({
        t: s.t,
        status: s.evaluation.status,
        reason: s.evaluation.reason
      })),
      thresholds
    );
  }, [companyName, modelName, activeData, evaluatedSteps, thresholds]);

  // Export CSV Report
  const handleDownloadReport = () => {
    if (!activeData) return;
    const headerLines = [
      `BÁO CÁO KIỂM THỬ SUY GIẢM MÔ HÌNH AML`,
      `Công ty: ${companyName}`,
      `Mô hình: ${modelName}`,
      `Chế độ: ${isCustom ? 'Tính trực tiếp từ dữ liệu tải lên' : seedMode === 'mean_5seed' ? 'Trung bình 5 seed' : 'Seed 42 đơn lẻ'}`,
      `Ngưỡng áp dụng: AP Chú ý (${formatPct(thresholds.warn_ratio, 0)}), AP Báo động (${formatPct(thresholds.alert_ratio, 0)}), PSI (${formatNum(thresholds.psi_alert, 2)}), ECE (${formatNum(thresholds.ece_warn, 2)}), Số nhãn tối thiểu (${thresholds.min_pos})`,
      `Tóm tắt: "${narrative.replace(/"/g, '""')}"`,
      ``,
      `Kỳ (t),Số vụ rửa tiền (n_pos),AP,AP so với tham chiếu (ap_ratio),ECE,PSI,Tỉ lệ gắn cờ (flag_rate),Trạng thái,Lý do chi tiết`
    ];

    const dataLines = evaluatedSteps.map((s) => {
      return [
        `t${s.t}`,
        s.n_pos,
        s.ap.toFixed(5),
        s.ap_ratio.toFixed(5),
        s.ece.toFixed(5),
        s.psi.toFixed(5),
        s.flag_rate.toFixed(5),
        `"${s.evaluation.label}"`,
        `"${s.evaluation.reason.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [...headerLines, ...dataLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_kiem_thu_${company?.code || 'custom'}_${modelName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status dot color mapping for Recharts
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'on_dinh':
        return '#059669'; // Emerald
      case 'chu_y':
        return '#d97706'; // Amber
      case 'bao_dong':
        return '#dc2626'; // Red
      case 'chua_du_nhan':
        return '#64748b'; // Slate
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Control Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {companyName}
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              {modelName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình kiểm định suy giảm hiệu năng qua 15 kỳ (t35–t49) so với mốc tham chiếu (t31–t34)
          </p>
        </div>

        {/* Right Corner Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isCustom ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚙️ Tính trực tiếp trên dữ liệu của bạn</span>
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                <span>📦 Kết quả đã chạy sẵn (Pre-computed)</span>
              </span>

              {/* Seed Mode Toggle Switch */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <span className="text-2xs font-semibold text-slate-500 px-2">
                  🎛️ Chế độ:
                </span>
                <button
                  onClick={() => setSeedMode('mean_5seed')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    seedMode === 'mean_5seed'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Trung bình 5 seed
                </button>
                <button
                  onClick={() => setSeedMode('seed42')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    seedMode === 'seed42'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Seed 42 đơn lẻ
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Code Display Panel */}
      <CodeDisplay />

      {/* Progress Simulation (if not completed) */}
      {!loadingComplete ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-5 animate-pulse">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2 text-indigo-600">
              <Clock className="w-4 h-4 animate-spin" />
              Đang thực thi tiến trình kiểm thử...
            </span>
            <span className="font-mono">{Math.min(100, progressStep * 25)}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, progressStep * 25)}%` }}
            />
          </div>

          <div className="space-y-1.5 font-mono text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className={progressStep >= 1 ? 'text-indigo-700 font-semibold' : 'text-slate-400'}>
              ✓ Đọc dữ liệu công ty {companyName}…
            </div>
            <div className={progressStep >= 2 ? 'text-indigo-700 font-semibold' : 'text-slate-400'}>
              {progressStep >= 2 ? '✓' : '•'} Tách mốc tham chiếu t31–34…
            </div>
            <div className={progressStep >= 3 ? 'text-indigo-700 font-semibold' : 'text-slate-400'}>
              {progressStep >= 3 ? '✓' : '•'} Tính PSI, AP, ECE cho 15 kỳ…
            </div>
            <div className={progressStep >= 4 ? 'text-indigo-700 font-semibold' : 'text-slate-400'}>
              {progressStep >= 4 ? '✓' : '•'} Phân luồng trạng thái…
            </div>
          </div>
        </div>
      ) : (
        /* The 3 Steps Process Sequence */
        <div className="space-y-6">
          {/* Stepper Navigation Bar */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              {/* Step 1 Pill */}
              <button
                onClick={() => {
                  setActiveStepTab(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeStepTab === 1
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                    : activeStepTab > 1
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono bg-white/20 shrink-0">
                  {activeStepTab > 1 ? '✓' : '1'}
                </span>
                <span className="truncate">Bước 1: Nhận dữ liệu</span>
              </button>

              {/* Step 2 Pill */}
              <button
                onClick={() => {
                  setActiveStepTab(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeStepTab === 2
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                    : activeStepTab > 2
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono bg-white/20 shrink-0">
                  {activeStepTab > 2 ? '✓' : '2'}
                </span>
                <span className="truncate">Bước 2: Ghi kết quả</span>
              </button>

              {/* Step 3 Pill */}
              <button
                onClick={() => {
                  setActiveStepTab(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeStepTab === 3
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono bg-white/20 shrink-0">
                  3
                </span>
                <span className="truncate">Bước 3: Phân luồng</span>
              </button>
            </div>
          </div>

          {/* Step 1: Nhận dữ liệu */}
          {activeStepTab === 1 && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      BƯỚC 1 – NHẬN DỮ LIỆU
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tổng hợp số lượng giao dịch, vụ gian lận có nhãn và tỉ lệ nền trên từng kỳ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  Trang 1 / 3
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                Mô hình đã chấm điểm <strong>{nRows.toLocaleString('vi-VN')}</strong> giao dịch; mỗi giao dịch có mã, kỳ thời gian, điểm số và nhãn điều tra.
              </div>

              {/* Table of periods t31-49 */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Kỳ thời gian (t)</th>
                      <th className="py-2.5 px-3 text-right">Số giao dịch có nhãn (n)</th>
                      <th className="py-2.5 px-3 text-right">Số vụ rửa tiền (n_pos)</th>
                      <th className="py-2.5 px-3 text-right">Tỉ lệ rửa tiền (prevalence)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {/* Reference period row t31-34 */}
                    <tr className="bg-indigo-50/70 font-semibold text-indigo-950">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        <span>Tham chiếu t31–34 (Khỏe)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {baseConfig.ref.n.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-700">
                        {baseConfig.ref.n_pos.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatPct(baseConfig.ref.prevalence, 3)}
                      </td>
                    </tr>

                    {/* Test periods t35 to t49 */}
                    {baseConfig.steps.map((st) => (
                      <tr key={st.t} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-slate-800">Kỳ t={st.t}</td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {st.n.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-600 font-medium">
                          {st.n_pos.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          {formatPct(st.prevalence, 3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Navigation for Step 1 -> Step 2 */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={onBackToHome}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ← Thoát kiểm thử
                </button>
                <button
                  onClick={() => {
                    setActiveStepTab(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <span>Xác nhận</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* Step 2: Ghi kết quả */}
          {activeStepTab === 2 && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      BƯỚC 2 – GHI KẾT QUẢ ĐO LƯỜNG
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bảng chi tiết AP, độ lệch PSI, sai số hiệu chuẩn ECE và tỉ lệ gắn cờ 15 kỳ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  Trang 2 / 3
                </span>
              </div>

            {/* 4 Summary Metric Boxes */}
            {activeData && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. AP ref */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    AP mức khỏe t31–34
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
                    {formatNum(activeData.ref.ap, 3)}
                  </div>
                  <span className="text-2xs text-slate-400">Điểm chuẩn tham chiếu</span>
                </div>

                {/* 2. AP Gop */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    AP gộp t35–49
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700">
                    {formatNum(activeData.block.Gộp.ap, 3)}
                  </div>
                  <span className="text-2xs text-slate-500 italic">
                    con số thường được báo cáo
                  </span>
                </div>

                {/* 3. AP Muon (Red Border) */}
                <div className="p-4 rounded-xl bg-rose-50/70 border-2 border-rose-500 space-y-1 shadow-xs">
                  <span className="text-xs text-rose-800 font-bold block">
                    AP khối Muộn t45–49
                  </span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-rose-700">
                    {formatNum(activeData.block.Muộn.ap, 3)}
                  </div>
                  <span className="text-2xs text-rose-600 font-semibold">
                    Suy sụp nghiêm trọng!
                  </span>
                </div>

                {/* 4. First Alert Period */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    Kỳ báo động đầu tiên
                  </span>
                  <div className={`text-xl sm:text-2xl font-black font-mono ${firstAlertPeriod !== 'Không có' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {firstAlertPeriod}
                  </div>
                  <span className="text-2xs text-slate-400">Thời điểm kích hoạt cảnh báo</span>
                </div>
              </div>
            )}

            {/* Table of 15 Steps (t35–49) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/90 text-slate-700 font-semibold font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Kỳ (t)</th>
                    <th className="py-2.5 px-3 text-right">Số vụ (n_pos)</th>
                    <th className="py-2.5 px-3 text-right">AP</th>
                    <th className="py-2.5 px-3 text-right">% AP so mức khỏe</th>
                    <th className="py-2.5 px-3 text-right">ECE</th>
                    <th className="py-2.5 px-3 text-right">PSI</th>
                    <th className="py-2.5 px-3 text-right">Tỉ lệ gắn cờ</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {evaluatedSteps.map((s) => {
                    // Cell tinting rules
                    const apRatioAlert = s.n_pos >= thresholds.min_pos && s.ap_ratio < thresholds.alert_ratio;
                    const apRatioWarn = s.n_pos >= thresholds.min_pos && s.ap_ratio < thresholds.warn_ratio && !apRatioAlert;
                    const eceWarn = s.ece > thresholds.ece_warn;
                    const psiAlert = s.psi > thresholds.psi_alert;

                    return (
                      <tr key={s.t} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800">t={s.t}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {s.n_pos < thresholds.min_pos ? (
                            <span className="text-slate-400" title="Chưa đủ nhãn tối thiểu">
                              {s.n_pos} (thiếu)
                            </span>
                          ) : (
                            s.n_pos
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                          {formatNum(s.ap, 3)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-semibold ${apRatioAlert ? 'bg-rose-50 text-rose-700' : apRatioWarn ? 'bg-amber-50 text-amber-700' : 'text-slate-700'}`}>
                          {formatPct(s.ap_ratio, 1)}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${eceWarn ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-slate-600'}`}>
                          {formatNum(s.ece, 3)}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${psiAlert ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-600'}`}>
                          {formatNum(s.psi, 3)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatPct(s.flag_rate, 1)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold border ${s.evaluation.badgeBg}`}
                            title={s.evaluation.reason}
                          >
                            <span>{s.evaluation.icon}</span>
                            <span>{s.evaluation.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

              {/* Metric Explainer Panel */}
              <MetricExplainer />

              {/* Bottom Navigation for Step 2 -> Step 3 */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveStepTab(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ← Quay lại Bước 1 (Nhận dữ liệu)
                </button>
                <button
                  onClick={() => {
                    setActiveStepTab(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <span>Xem đánh giá</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Phân luồng đánh giá */}
          {activeStepTab === 3 && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-7 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      BƯỚC 3 – PHÂN LUỒNG ĐÁNH GIÁ &amp; QUYẾT ĐỊNH XỬ LÝ
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dải trạng thái theo thời gian, biểu đồ suy thoái AP, phân tích độ lệch PSI và kịch bản can thiệp
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  Trang 3 / 3
                </span>
              </div>

            {/* Dải 15 ô màu t35 -> t49 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dải trạng thái 15 kỳ (t35 → t49)
              </h4>
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-15 gap-1.5">
                {evaluatedSteps.map((s) => {
                  const ev = s.evaluation;
                  return (
                    <div
                      key={s.t}
                      className={`group relative p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-help transition-all hover:scale-105 hover:shadow-md ${ev.colorClass}`}
                    >
                      <span className="font-mono text-2xs font-bold text-slate-600">
                        t{s.t}
                      </span>
                      <span className="text-base font-black my-0.5 leading-none">
                        {ev.icon}
                      </span>
                      <span className="text-3xs font-mono font-semibold truncate max-w-full">
                        {s.n_pos < thresholds.min_pos ? `${s.n_pos} nhãn` : formatPct(s.ap_ratio, 0)}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-52 p-2 bg-slate-900 text-white text-2xs rounded-lg shadow-xl pointer-events-none text-left">
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1 flex items-center justify-between">
                          <span>Kỳ t={s.t}</span>
                          <span className="font-mono">{ev.label}</span>
                        </div>
                        <p className="text-slate-200">{ev.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-2xs text-slate-500 italic text-center sm:text-left">
                Dải ô cho biết mô hình hỏng từ khi nào và kéo dài bao lâu.
              </p>
            </div>

            {/* Biểu đồ đường AP theo từng kỳ */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Biểu đồ đường "AP theo từng kỳ" (t35–49)
                  </h4>
                  <p className="text-2xs text-slate-500">
                    Đường AP thực tế so với đường tham chiếu và các mốc cảnh báo
                  </p>
                </div>
                <div className="flex items-center gap-3 text-2xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-3 h-0.5 bg-indigo-600 inline-block" /> AP thực tế
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed inline-block" /> Tham chiếu
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed inline-block" /> 70% Chú ý
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed inline-block" /> 50% Báo động
                  </span>
                </div>
              </div>

              <div className="h-72 w-full bg-slate-50/50 rounded-xl p-3 border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="t"
                      tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    />
                    <YAxis
                      domain={[0, 1.05]}
                      tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                      tickFormatter={(v) => v.toFixed(2).replace('.', ',')}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 font-sans max-w-xs">
                              <div className="font-bold font-mono border-b border-slate-700 pb-1 flex justify-between">
                                <span>{data.t}</span>
                                <span>{data.statusLabel}</span>
                              </div>
                              <div className="font-mono text-2xs space-y-0.5">
                                <div>AP thực tế: <strong>{formatNum(data.ap, 3)}</strong></div>
                                {seedMode === 'mean_5seed' && data.apSd > 0 && (
                                  <div className="text-slate-400">Độ lệch chuẩn (sd): ±{formatNum(data.apSd, 4)}</div>
                                )}
                                <div>So với mức khỏe: <strong>{formatPct(data.ap_ratio, 1)}</strong></div>
                                <div>ECE: {formatNum(data.ece, 3)}</div>
                                <div>PSI: {formatNum(data.psi, 3)}</div>
                              </div>
                              <p className="text-3xs text-slate-300 pt-1 border-t border-slate-800 leading-tight">
                                {data.reason}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Reference Lines */}
                    {chartData[0] && (
                      <>
                        <ReferenceLine
                          y={chartData[0].refAp}
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          label={{ value: 'Tham chiếu khỏe', fill: '#059669', fontSize: 10, position: 'right' }}
                        />
                        <ReferenceLine
                          y={chartData[0].warnAp}
                          stroke="#f59e0b"
                          strokeDasharray="3 3"
                          label={{ value: '70% Chú ý', fill: '#d97706', fontSize: 10, position: 'right' }}
                        />
                        <ReferenceLine
                          y={chartData[0].alertAp}
                          stroke="#ef4444"
                          strokeDasharray="3 3"
                          label={{ value: '50% Báo động', fill: '#dc2626', fontSize: 10, position: 'right' }}
                        />
                      </>
                    )}

                    {/* Standard deviation shaded band (in 5 seed mode) */}
                    {seedMode === 'mean_5seed' && (
                      <Area
                        type="monotone"
                        dataKey="ap_upper"
                        stroke="none"
                        fill="#818cf8"
                        fillOpacity={0.2}
                      />
                    )}

                    {/* Main AP Line */}
                    <Line
                      type="monotone"
                      dataKey="ap"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const fill = getStatusColor(payload.status);
                        return (
                          <circle
                            key={payload.t}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={fill}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-2xs text-slate-500 italic text-center sm:text-left">
                Biểu đồ cho biết tệ đến mức nào, tụt từ từ hay đột ngột.
              </p>
            </div>

            {/* Biểu đồ cột nhỏ PSI theo kỳ */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  Biểu đồ cột PSI theo từng kỳ
                </h4>
                <span className="text-2xs font-mono text-slate-500">
                  Ngưỡng lệch: <strong>0,25</strong>
                </span>
              </div>
              <div className="h-36 w-full bg-slate-50/50 rounded-xl p-3 border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.toFixed(2).replace('.', ',')} />
                    <Tooltip
                      formatter={(val: any) => [formatNum(Number(val), 3), 'PSI']}
                      labelFormatter={(lbl) => `Kỳ ${lbl}`}
                    />
                    <ReferenceLine
                      y={thresholds.psi_alert}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: '0,25', fill: '#ef4444', fontSize: 10 }}
                    />
                    <Bar dataKey="psi" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.psi > thresholds.psi_alert ? '#ef4444' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bốn khung luồng xử lý */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Khung luồng can thiệp &amp; Hành động xử lý
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Ổn định */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    stepsByStatus.on_dinh.length > 0
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ✓ Ổn định
                    </span>
                    {stepsByStatus.on_dinh.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-emerald-200/80 text-emerald-900">
                        {stepsByStatus.on_dinh.length} kỳ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Giữ mô hình đang vận hành, tiếp tục theo dõi và ghi nhật ký giám sát định kỳ.
                  </p>
                  {stepsByStatus.on_dinh.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/60 font-mono text-2xs text-emerald-800">
                      Kỳ rơi vào: {stepsByStatus.on_dinh.map((t) => `t${t}`).join(', ')}
                    </div>
                  )}
                </div>

                {/* 2. Cần chú ý */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    stepsByStatus.chu_y.length > 0
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-300'
                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ! Cần chú ý
                    </span>
                    {stepsByStatus.chu_y.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-amber-200/80 text-amber-900">
                        {stepsByStatus.chu_y.length} kỳ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Rà soát thủ công một mẫu giao dịch điểm thấp, kiểm tra nguồn dữ liệu và đặc trưng; cân nhắc hiệu chỉnh lại (isotonic recalibration) trên dữ liệu gần nhất.
                  </p>
                  {stepsByStatus.chu_y.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/60 font-mono text-2xs text-amber-900 font-semibold">
                      Kỳ rơi vào: {stepsByStatus.chu_y.map((t) => `t${t}`).join(', ')}
                    </div>
                  )}
                </div>

                {/* 3. Báo động */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    stepsByStatus.bao_dong.length > 0
                      ? 'bg-rose-50 border-rose-400 shadow-sm ring-2 ring-rose-300'
                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-rose-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      ✕ Báo động
                    </span>
                    {stepsByStatus.bao_dong.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-rose-200 text-rose-900">
                        {stepsByStatus.bao_dong.length} kỳ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Không dựa vào điểm mô hình để bỏ qua giao dịch; chuyển sang chế độ dự phòng (hạ ngưỡng chấm, tăng xem xét thủ công); huấn luyện lại với dữ liệu có nhãn mới nhất rồi lập lại mốc tham chiếu. Báo động hai kỳ liền thì mở quy trình huấn luyện lại.
                  </p>
                  {stepsByStatus.bao_dong.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 font-mono text-2xs text-rose-900 font-bold">
                      Kỳ rơi vào: {stepsByStatus.bao_dong.map((t) => `t${t}`).join(', ')}
                    </div>
                  )}
                </div>

                {/* 4. Chưa đủ nhãn */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    stepsByStatus.chua_du_nhan.length > 0
                      ? 'bg-slate-100 border-slate-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      – Chưa đủ nhãn
                    </span>
                    {stepsByStatus.chua_du_nhan.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-slate-200 text-slate-800">
                        {stepsByStatus.chua_du_nhan.length} kỳ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Chưa kết luận về AP do số ca gian lận có nhãn quá thấp; tạm thời dựa vào PSI phân bố điểm để giám sát trôi dạt và chờ kết quả điều tra bổ sung.
                  </p>
                  {stepsByStatus.chua_du_nhan.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 font-mono text-2xs text-slate-700">
                      Kỳ rơi vào: {stepsByStatus.chua_du_nhan.map((t) => `t${t}`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-generated summary sentence */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs sm:text-sm leading-relaxed shadow-sm">
              <span className="text-2xs font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                Kết luận tổng hợp tự động:
              </span>
              <p className="text-slate-100">{narrative}</p>
            </div>

            {/* Footer action buttons */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => {
                  setActiveStepTab(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                ← Quay lại Bước 2 (Ghi kết quả)
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onBackToHome}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kiểm thử công ty khác
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 Tải báo cáo kiểm thử (CSV)</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    )}
    </div>
  );
};
