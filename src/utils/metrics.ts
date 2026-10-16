/**
 * Utility functions for calculating AML Model Monitoring Metrics
 * Exact TypeScript implementation of tinh_chi_so_giam_sat.py
 */

export interface ThresholdConfig {
  warn_ratio: number;     // e.g. 0.70
  alert_ratio: number;    // e.g. 0.50
  psi_alert: number;      // e.g. 0.25
  ece_warn: number;       // e.g. 0.10
  min_pos: number;        // e.g. 10
  psi_consecutive?: number; // 2
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  warn_ratio: 0.70,
  alert_ratio: 0.50,
  psi_alert: 0.25,
  ece_warn: 0.10,
  min_pos: 10,
  psi_consecutive: 2
};

export type StatusType = 'on_dinh' | 'chu_y' | 'bao_dong' | 'chua_du_nhan';

export interface StatusEvaluation {
  status: StatusType;
  label: string;
  icon: string;
  colorClass: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  reason: string;
}

/**
 * Format number with Vietnamese decimal comma and 3 decimal places
 */
export function formatNum(val: number | null | undefined, digits = 3): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return val.toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

/**
 * Format percentage with Vietnamese decimal comma
 */
export function formatPct(val: number | null | undefined, digits = 1): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return (val * 100).toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }) + '%';
}

/**
 * Exact PSI Calculation
 * Matches Python:
 * def psi(ref, cur, n_bins=10, eps=1e-4):
 *     edges = np.linspace(0, 1, n_bins + 1)
 *     r = np.histogram(np.clip(ref, 0, 1), edges)[0] / len(ref)
 *     c = np.histogram(np.clip(cur, 0, 1), edges)[0] / len(cur)
 *     r = np.maximum(r, eps); c = np.maximum(c, eps)
 *     return float(np.sum((c - r) * np.log(c / r)))
 */
export function calculatePSI(ref: number[], cur: number[], nBins = 10, eps = 1e-4): number {
  if (!ref.length || !cur.length) return 0;

  const rCount = new Array(nBins).fill(0);
  const cCount = new Array(nBins).fill(0);

  // Helper to get bin index for value in [0, 1]
  // np.histogram with bins=10 on [0,1] includes [0, 0.1), [0.1, 0.2), ..., [0.9, 1.0]
  const getBin = (val: number): number => {
    const clamped = Math.max(0, Math.min(1, val));
    if (clamped >= 1.0) return nBins - 1;
    return Math.floor(clamped * nBins);
  };

  for (const v of ref) {
    rCount[getBin(v)]++;
  }
  for (const v of cur) {
    cCount[getBin(v)]++;
  }

  let totalPSI = 0;
  for (let k = 0; k < nBins; k++) {
    const rProp = Math.max(rCount[k] / ref.length, eps);
    const cProp = Math.max(cCount[k] / cur.length, eps);
    totalPSI += (cProp - rProp) * Math.log(cProp / rProp);
  }

  return totalPSI;
}

/**
 * Exact ECE Calculation
 * Matches Python:
 * def ece(y, p, n_bins=10):
 *     y = np.asarray(y, float); p = np.asarray(p, float)
 *     edges = np.linspace(0, 1, n_bins + 1)
 *     idx = np.clip(np.digitize(p, edges[1:-1], right=True), 0, n_bins - 1)
 *     out = 0.0
 *     for k in range(n_bins):
 *         m = idx == k
 *         if m.any():
 *             out += m.sum() / len(y) * abs(p[m].mean() - y[m].mean())
 *     return float(out)
 */
export function calculateECE(y: number[], p: number[], nBins = 10): number {
  if (!y.length || y.length !== p.length) return 0;

  const binItems: { p: number; y: number }[][] = Array.from({ length: nBins }, () => []);

  // np.digitize(p, [0.1, 0.2, ..., 0.9], right=True)
  // p <= 0.1 -> 0
  // 0.1 < p <= 0.2 -> 1, ..., p > 0.9 -> 9
  const getDigitizeBin = (val: number): number => {
    const clamped = Math.max(0, Math.min(1, val));
    if (clamped <= 0.1) return 0;
    for (let k = 1; k < nBins - 1; k++) {
      const edge = (k + 1) / nBins;
      if (clamped <= edge) return k;
    }
    return nBins - 1;
  };

  for (let i = 0; i < y.length; i++) {
    const bin = getDigitizeBin(p[i]);
    binItems[bin].push({ p: p[i], y: y[i] });
  }

  let out = 0.0;
  for (let k = 0; k < nBins; k++) {
    const items = binItems[k];
    if (items.length > 0) {
      let pSum = 0;
      let ySum = 0;
      for (const item of items) {
        pSum += item.p;
        ySum += item.y;
      }
      const pMean = pSum / items.length;
      const yMean = ySum / items.length;
      out += (items.length / y.length) * Math.abs(pMean - yMean);
    }
  }

  return out;
}

/**
 * Exact AP Calculation
 * Matches sklearn.metrics.average_precision_score:
 * Sắp điểm giảm dần; tại mỗi mức điểm khác nhau lấy precision và recall;
 * AP = tổng (recall_k - recall_{k-1}) * precision_k
 */
export function calculateAP(y: number[], s: number[]): number {
  if (!y.length || y.length !== s.length) return NaN;

  let totalPos = 0;
  for (const label of y) {
    if (label === 1) totalPos++;
  }
  if (totalPos === 0) return NaN;

  // Pair up and sort by score descending
  const paired = y.map((label, idx) => ({ y: label, s: s[idx] }));
  paired.sort((a, b) => b.s - a.s);

  let truePos = 0;
  let falsePos = 0;
  let prevRecall = 0;
  let ap = 0;

  let i = 0;
  const n = paired.length;

  while (i < n) {
    const currentScore = paired[i].s;
    // accumulate all items with the identical score
    while (i < n && paired[i].s === currentScore) {
      if (paired[i].y === 1) {
        truePos++;
      } else {
        falsePos++;
      }
      i++;
    }

    const precision = truePos / (truePos + falsePos);
    const recall = truePos / totalPos;
    const deltaRecall = recall - prevRecall;

    ap += deltaRecall * precision;
    prevRecall = recall;
  }

  return ap;
}

/**
 * Evaluate period status and reason according to the exact rules in prompt:
 *
 * Duyệt t35 -> t49 theo thứ tự;
 * "psi_vuot" = psi > ngưỡng PSI (0.25);
 * "psi_vuot_ky_truoc" = psi_vuot của kỳ liền trước (t35 coi là false):
 *
 * 1) Nếu n_pos của kỳ < số nhãn tối thiểu:
 *    - nếu psi_vuot và psi_vuot_ky_truoc -> "Báo động" (lý do: Thiếu nhãn & PSI vượt 2 kỳ liên tiếp)
 *    - nếu chỉ psi_vuot -> "Cần chú ý" (lý do: Thiếu nhãn & PSI vượt ngưỡng)
 *    - còn lại -> "Chưa đủ nhãn" (lý do: Thiếu nhãn (< min_pos vụ rửa tiền))
 * 2) Ngược lại, nếu ap_ratio < ngưỡng báo động -> "Báo động" (lý do: AP)
 * 3) Ngược lại, nếu psi_vuot và psi_vuot_ky_truoc -> "Báo động" (lý do: PSI vượt 2 kỳ liên tiếp)
 * 4) Ngược lại, nếu ap_ratio < ngưỡng chú ý hoặc ece > ngưỡng ECE hoặc psi_vuot -> "Cần chú ý" (lý do: AP/ECE/PSI)
 * 5) Còn lại -> "Ổn định"
 */
export function evaluateStatus(
  n_pos: number,
  ap_ratio: number,
  ece: number,
  psi: number,
  psi_vuot_ky_truoc: boolean,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): StatusEvaluation & { psi_vuot: boolean } {
  const psi_vuot = psi > thresholds.psi_alert;

  // 1) Nếu n_pos < min_pos
  if (n_pos < thresholds.min_pos) {
    if (psi_vuot && psi_vuot_ky_truoc) {
      return {
        status: 'bao_dong',
        label: 'Báo động',
        icon: '✕',
        colorClass: 'text-rose-600 bg-rose-50 border-rose-300',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        textColor: 'text-rose-700',
        borderColor: 'border-rose-400',
        reason: `Chưa đủ nhãn (chỉ có ${n_pos} vụ) nhưng PSI (${formatNum(psi)}) vượt ngưỡng 2 kỳ liên tiếp.`,
        psi_vuot
      };
    }
    if (psi_vuot) {
      return {
        status: 'chu_y',
        label: 'Cần chú ý',
        icon: '!',
        colorClass: 'text-amber-600 bg-amber-50 border-amber-300',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-400',
        reason: `Chưa đủ nhãn (${n_pos} < ${thresholds.min_pos}) và PSI (${formatNum(psi)}) vượt ngưỡng ${formatNum(thresholds.psi_alert)}.`,
        psi_vuot
      };
    }
    return {
      status: 'chua_du_nhan',
      label: 'Chưa đủ nhãn',
      icon: '–',
      colorClass: 'text-slate-600 bg-slate-100 border-slate-300',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      reason: `Số vụ rửa tiền có nhãn (${n_pos}) thấp hơn mức tối thiểu ${thresholds.min_pos}. Cần chờ thêm kết quả điều tra.`,
      psi_vuot
    };
  }

  // 2) Nếu ap_ratio < ngưỡng báo động
  if (ap_ratio < thresholds.alert_ratio) {
    const reasons: string[] = [`AP chỉ còn ${formatPct(ap_ratio)} so với mức khỏe (< ${formatPct(thresholds.alert_ratio)})`];
    if (psi_vuot) {
      reasons.push(`PSI (${formatNum(psi)}) vượt ngưỡng`);
    }
    if (ece > thresholds.ece_warn) {
      reasons.push(`ECE (${formatNum(ece)}) vượt ngưỡng`);
    }
    return {
      status: 'bao_dong',
      label: 'Báo động',
      icon: '✕',
      colorClass: 'text-rose-600 bg-rose-50 border-rose-300',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-400',
      reason: reasons.join('; ') + '.',
      psi_vuot
    };
  }

  // 3) Ngược lại, nếu psi_vuot và psi_vuot_ky_truoc -> Báo động
  if (psi_vuot && psi_vuot_ky_truoc) {
    return {
      status: 'bao_dong',
      label: 'Báo động',
      icon: '✕',
      colorClass: 'text-rose-600 bg-rose-50 border-rose-300',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-400',
      reason: `Độ lệch phân bố PSI (${formatNum(psi)}) vượt ngưỡng ${formatNum(thresholds.psi_alert)} trong 2 kỳ liên tiếp.`,
      psi_vuot
    };
  }

  // 4) Ngược lại, nếu ap_ratio < ngưỡng chú ý hoặc ece > ngưỡng ECE hoặc psi_vuot -> Cần chú ý
  const reasons: string[] = [];
  if (ap_ratio < thresholds.warn_ratio) {
    reasons.push(`AP giảm còn ${formatPct(ap_ratio)} mức khỏe (< ${formatPct(thresholds.warn_ratio)})`);
  }
  if (ece > thresholds.ece_warn) {
    reasons.push(`ECE tăng lên ${formatNum(ece)} (> ${formatNum(thresholds.ece_warn)})`);
  }
  if (psi_vuot) {
    reasons.push(`PSI đạt ${formatNum(psi)} (> ${formatNum(thresholds.psi_alert)})`);
  }

  if (reasons.length > 0) {
    return {
      status: 'chu_y',
      label: 'Cần chú ý',
      icon: '!',
      colorClass: 'text-amber-600 bg-amber-50 border-amber-300',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-400',
      reason: reasons.join('; ') + '.',
      psi_vuot
    };
  }

  // 5) Còn lại -> Ổn định
  return {
    status: 'on_dinh',
    label: 'Ổn định',
    icon: '✓',
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-400',
    reason: `Mô hình hoạt động tốt (AP giữ ${formatPct(ap_ratio)} mức khỏe, PSI = ${formatNum(psi)}, ECE = ${formatNum(ece)}).`,
    psi_vuot
  };
}

/**
 * Generate human-readable summary narrative based on metrics and rules
 */
export function generateSummaryNarrative(
  companyName: string,
  modelName: string,
  refAp: number,
  gopAp: number,
  muonAp: number,
  steps: { t: number; ap: number; ap_ratio: number; psi: number; ece: number; n_pos: number }[],
  evaluatedSteps: { t: number; status: StatusType; reason: string }[],
  thresholds: ThresholdConfig
): string {
  // Find where AP drops first
  let beforeDropMax = 0;
  let firstAlertT: number | null = null;
  let firstDropT: number | null = null;
  let dropRatio = 0;
  let dropPsi = 0;

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const ev = evaluatedSteps[i];

    if (ev.status === 'bao_dong' && firstAlertT === null) {
      firstAlertT = s.t;
    }

    if (s.ap_ratio < thresholds.alert_ratio && firstDropT === null) {
      firstDropT = s.t;
      dropRatio = s.ap_ratio;
      dropPsi = s.psi;
      if (i > 0) {
        beforeDropMax = Math.min(...steps.slice(0, i).map(x => x.ap_ratio));
      }
    }
  }

  // Check silent PSI: AP < 50% but PSI <= psi_alert
  const silentPsiSteps = steps.filter(
    s => s.n_pos >= thresholds.min_pos && s.ap_ratio < thresholds.alert_ratio && s.psi <= thresholds.psi_alert
  );

  let sentence = '';
  if (firstDropT !== null) {
    const preText = beforeDropMax > 0 ? `AP giữ ít nhất ${formatPct(beforeDropMax, 0)} mức khỏe trước t=${firstDropT}, rồi rơi còn ${formatPct(dropRatio, 0)} ở t=${firstDropT}. ` : `AP rơi xuống ${formatPct(dropRatio, 0)} ở t=${firstDropT}. `;
    const psiText = dropPsi > thresholds.psi_alert 
      ? `PSI ${formatNum(dropPsi, 2)} vượt ngưỡng nên bắt được ngay trong kỳ. `
      : `Tuy nhiên PSI chỉ đạt ${formatNum(dropPsi, 2)} (chưa vượt ngưỡng). `;
    sentence = `${companyName} (${modelName}): ${preText}${psiText}AP gộp t35–49 là ${formatNum(gopAp, 3)} nhưng khối Muộn chỉ ${formatNum(muonAp, 3)}.`;
  } else {
    sentence = `${companyName} (${modelName}): Mô hình duy trì độ ổn định tương đối tốt trên các kỳ kiểm tra. AP gộp là ${formatNum(gopAp, 3)} và khối Muộn đạt ${formatNum(muonAp, 3)}.`;
  }

  if (silentPsiSteps.length > 0) {
    const periods = silentPsiSteps.map(s => `t=${s.t}`).join(', ');
    sentence += ` Lưu ý: ở ${periods}, PSI không báo nhưng AP đã sụp – PSI im lặng chưa chắc là ổn.`;
  }

  return sentence;
}
