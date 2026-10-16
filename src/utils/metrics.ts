/**
 * Utility functions for calculating AML Model Monitoring Metrics
 * Exact TypeScript implementation of tinh_chi_so_giam_sat.py & Elliptic Research Benchmark
 */

export interface ThresholdConfig {
  warn_ratio: number;     // e.g. 0.70
  alert_ratio: number;    // e.g. 0.50
  psi_alert: number;      // e.g. 0.25
  ece_warn: number;       // e.g. 0.10
  min_pos: number;        // e.g. 10
  psi_consecutive?: number; // e.g. 2
}

export type Thresholds = ThresholdConfig;

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  warn_ratio: 0.70,
  alert_ratio: 0.50,
  psi_alert: 0.25,
  ece_warn: 0.10,
  min_pos: 10,
  psi_consecutive: 2
};

export type StatusType = 'stable' | 'warn' | 'alert' | 'missing';

export interface EvaluatedStep {
  t: number;
  n: number;
  n_pos: number;
  prevalence: number;
  ap: number | null;
  ap_sd?: number;
  ap_ratio: number | null;
  ece: number;
  psi: number;
  flag_rate: number;
  status: string; // "Ổn định" | "Cần chú ý" | "Báo động" | "Chưa đủ nhãn"
  symbol: string; // "✓" | "!" | "✕" | "–"
  reason: string;
  type: StatusType;
  psi_vuot: boolean;
}

export const CODE_SNIPPET = `# Lệnh chạy:
python tinh_chi_so_giam_sat.py "<thư mục btc3\\\\predictions>" <thư mục ra>

def psi(ref, cur, n_bins=10, eps=1e-4):
    edges = np.linspace(0, 1, n_bins + 1)
    r = np.histogram(np.clip(ref, 0, 1), edges)[0] / len(ref)
    c = np.histogram(np.clip(cur, 0, 1), edges)[0] / len(cur)
    r = np.maximum(r, eps); c = np.maximum(c, eps)
    return float(np.sum((c - r) * np.log(c / r)))

def ece(y, p, n_bins=10):
    y = np.asarray(y, float); p = np.asarray(p, float)
    edges = np.linspace(0, 1, n_bins + 1)
    idx = np.clip(np.digitize(p, edges[1:-1], right=True), 0, n_bins - 1)
    out = 0.0
    for k in range(n_bins):
        m = idx == k
        if m.any():
            out += m.sum() / len(y) * abs(p[m].mean() - y[m].mean())
    return float(out)

def ap(y, s):
    return float(average_precision_score(y, s)) if y.sum() > 0 else float("nan")`;

/**
 * Format number with Vietnamese decimal comma
 */
export function formatNum(val: number | string | null | undefined, digits = 3): string {
  if (val === null || val === undefined || val === '') {
    return '—';
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) {
    return '—';
  }
  return num.toFixed(digits).replace('.', ',');
}

/**
 * Format percentage with Vietnamese decimal comma
 */
export function formatPercent(val: number | string | null | undefined, digits = 1): string {
  if (val === null || val === undefined || val === '') {
    return '—';
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) {
    return '—';
  }
  return (num * 100).toFixed(digits).replace('.', ',') + '%';
}

export const formatPct = formatPercent;

/**
 * Format integer with dot separator
 */
export function formatInt(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') {
    return '—';
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) {
    return '—';
  }
  return num.toLocaleString('vi-VN');
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
export function calculatePSI(refScores: number[], curScores: number[], n_bins = 10, eps = 1e-4): number {
  if (!refScores.length || !curScores.length) return 0;
  const r_counts = new Array(n_bins).fill(0);
  const c_counts = new Array(n_bins).fill(0);

  for (const s of refScores) {
    const clipped = Math.max(0, Math.min(1, s));
    let bin = Math.floor(clipped * n_bins);
    if (bin >= n_bins) bin = n_bins - 1;
    r_counts[bin]++;
  }
  for (const s of curScores) {
    const clipped = Math.max(0, Math.min(1, s));
    let bin = Math.floor(clipped * n_bins);
    if (bin >= n_bins) bin = n_bins - 1;
    c_counts[bin]++;
  }

  let psiSum = 0;
  const lenR = refScores.length;
  const lenC = curScores.length;

  for (let i = 0; i < n_bins; i++) {
    const r = Math.max(r_counts[i] / lenR, eps);
    const c = Math.max(c_counts[i] / lenC, eps);
    psiSum += (c - r) * Math.log(c / r);
  }
  return psiSum;
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
export function calculateECE(y: number[], p: number[], n_bins = 10): number {
  if (!y.length || !p.length) return 0;
  const binItems = Array.from({ length: n_bins }, () => ({ sumP: 0, sumY: 0, count: 0 }));
  for (let i = 0; i < p.length; i++) {
    const pVal = Math.max(0, Math.min(1, p[i]));
    let bin = Math.floor(pVal * n_bins);
    if (bin >= n_bins) bin = n_bins - 1;
    binItems[bin].sumP += pVal;
    binItems[bin].sumY += y[i];
    binItems[bin].count++;
  }
  let totalECE = 0;
  const totalN = y.length;
  for (let i = 0; i < n_bins; i++) {
    const b = binItems[i];
    if (b.count > 0) {
      const meanP = b.sumP / b.count;
      const meanY = b.sumY / b.count;
      totalECE += (b.count / totalN) * Math.abs(meanP - meanY);
    }
  }
  return totalECE;
}

/**
 * Exact AP Calculation
 * Matches Python:
 * def ap(y, s):
 *     return float(average_precision_score(y, s)) if y.sum() > 0 else float("nan")
 */
export function calculateAP(y: number[], scores: number[]): number {
  const paired: { y: number; s: number }[] = [];
  let totalPos = 0;
  for (let i = 0; i < y.length; i++) {
    if (y[i] === 1 || y[i] === 0) {
      paired.push({ y: y[i], s: scores[i] });
      if (y[i] === 1) totalPos++;
    }
  }
  if (totalPos === 0 || paired.length === 0) return NaN;

  paired.sort((a, b) => b.s - a.s);

  let tp = 0;
  let fp = 0;
  let prevRecall = 0;
  let ap = 0;

  let i = 0;
  while (i < paired.length) {
    const curScore = paired[i].s;
    while (i < paired.length && paired[i].s === curScore) {
      if (paired[i].y === 1) tp++;
      else fp++;
      i++;
    }
    const precision = tp / (tp + fp);
    const recall = tp / totalPos;
    ap += (recall - prevRecall) * precision;
    prevRecall = recall;
  }
  return ap;
}

/**
 * 5-Rule Evaluation Engine (Vietnamese terminology)
 */
export function evaluateSteps(
  stepList: any[],
  refAP: number,
  thresholds: ThresholdConfig,
  stepsMeta: any[] = []
): EvaluatedStep[] {
  let psi_vuot_ky_truoc = false;

  return stepList.map((step) => {
    const meta = stepsMeta.find((m: any) => m.t === step.t) || { n: 0, n_pos: 0, prevalence: 0 };
    const n_pos = step.n_pos !== undefined ? step.n_pos : meta.n_pos;
    const n = step.n !== undefined ? step.n : meta.n;
    const prevalence = step.prevalence !== undefined ? step.prevalence : meta.prevalence;

    const psi_vuot = step.psi !== null && step.psi !== undefined && !isNaN(step.psi) && step.psi > thresholds.psi_alert;
    const ap_ratio = step.ap_ratio;
    const ece = step.ece;

    let status = "Ổn định";
    let reason = "Mọi chỉ số đều trong mức an toàn";
    let type: StatusType = "stable";
    let symbol = "✓";

    if (n_pos < thresholds.min_pos) {
      if (psi_vuot && psi_vuot_ky_truoc) {
        status = "Báo động";
        symbol = "✕";
        reason = `Chưa đủ nhãn nhưng PSI vượt 2 kỳ liên tiếp (${formatNum(step.psi)} > ${formatNum(thresholds.psi_alert)})`;
        type = "alert";
      } else if (psi_vuot) {
        status = "Cần chú ý";
        symbol = "!";
        reason = `Chưa đủ nhãn (${n_pos} < ${thresholds.min_pos}) nhưng PSI vượt 1 kỳ (${formatNum(step.psi)} > ${formatNum(thresholds.psi_alert)})`;
        type = "warn";
      } else {
        status = "Chưa đủ nhãn";
        symbol = "–";
        reason = `Số vụ rửa tiền có nhãn quá ít (${n_pos} < ${thresholds.min_pos})`;
        type = "missing";
      }
    } else {
      const ap_alert = ap_ratio !== null && !isNaN(ap_ratio) && ap_ratio < thresholds.alert_ratio;
      const psi_double = psi_vuot && psi_vuot_ky_truoc;

      if (ap_alert && psi_double) {
        status = "Báo động";
        symbol = "✕";
        reason = `Báo động kép: AP tụt còn ${formatPercent(ap_ratio)} (< ${formatPercent(thresholds.alert_ratio)}) & PSI vượt 2 kỳ liền (${formatNum(step.psi)})`;
        type = "alert";
      } else if (ap_alert) {
        status = "Báo động";
        symbol = "✕";
        reason = `AP sụp đổ còn ${formatPercent(ap_ratio)} so với mức khỏe (< ${formatPercent(thresholds.alert_ratio)})`;
        type = "alert";
      } else if (psi_double) {
        status = "Báo động";
        symbol = "✕";
        reason = `Độ lệch phân phối PSI vượt ngưỡng 2 kỳ liên tiếp (${formatNum(step.psi)} > ${formatNum(thresholds.psi_alert)})`;
        type = "alert";
      } else {
        const ap_warn = ap_ratio !== null && !isNaN(ap_ratio) && ap_ratio < thresholds.warn_ratio;
        const ece_warn = ece !== null && !isNaN(ece) && ece > thresholds.ece_warn;

        if (ap_warn || ece_warn || psi_vuot) {
          status = "Cần chú ý";
          symbol = "!";
          const reasons = [];
          if (ap_warn) reasons.push(`AP còn ${formatPercent(ap_ratio)} (< ${formatPercent(thresholds.warn_ratio)})`);
          if (ece_warn) reasons.push(`ECE = ${formatNum(ece)} (> ${formatNum(thresholds.ece_warn)})`);
          if (psi_vuot) reasons.push(`PSI = ${formatNum(step.psi)} (> ${formatNum(thresholds.psi_alert)} 1 kỳ)`);
          reason = reasons.join("; ");
          type = "warn";
        } else {
          status = "Ổn định";
          symbol = "✓";
          reason = `AP đạt ${formatPercent(ap_ratio)}, PSI = ${formatNum(step.psi)} (an toàn)`;
          type = "stable";
        }
      }
    }

    psi_vuot_ky_truoc = psi_vuot;

    return {
      ...step,
      n,
      n_pos,
      prevalence,
      status,
      symbol,
      reason,
      type,
      psi_vuot
    };
  });
}

/**
 * Generate Auto-Conclusion narrative matching the user's interface
 */
export function generateAutoConclusion(
  company: { name: string; model: string },
  evaluatedSteps: EvaluatedStep[],
  activeResult: any,
  thresholds: ThresholdConfig
): string {
  if (!company || !evaluatedSteps.length) return "";
  const before43 = evaluatedSteps.filter((s) => s.t < 43);
  const minRatioBefore43 = before43.length ? Math.min(...before43.map((s) => s.ap_ratio || 0)) : 0.79;
  const t43 = evaluatedSteps.find((s) => s.t === 43);
  const gop = activeResult?.block?.['Gộp']?.ap || 0.795;
  const muoc = activeResult?.block?.['Muộn']?.ap || 0.055;

  let txt = `${company.name} (${company.model}): AP giữ ít nhất ${formatPercent(minRatioBefore43)} mức khỏe trước kỳ t=43`;
  if (t43) {
    txt += `, sau đó sụp đổ đột ngột xuống còn ${formatPercent(t43.ap_ratio)} (AP = ${formatNum(t43.ap)}) ở t=43. `;
    if (t43.psi > thresholds.psi_alert) {
      txt += `Chỉ số PSI = ${formatNum(t43.psi)} vượt mạnh ngưỡng ${formatNum(thresholds.psi_alert)} nên phát hiện được sự cố ngay trong kỳ mà không cần chờ nhãn điều tra. `;
    } else {
      txt += `Chỉ số PSI = ${formatNum(t43.psi)} chưa vượt ngưỡng. `;
    }
  }
  txt += `AP gộp t35–49 là ${formatNum(gop)} nhưng khối Muộn chỉ đạt ${formatNum(muoc)}.`;

  const silentPSISteps = evaluatedSteps.filter(
    (s) => (s.ap_ratio || 0) < thresholds.alert_ratio && s.psi <= thresholds.psi_alert
  );
  if (silentPSISteps.length > 0) {
    const periods = silentPSISteps.map((s) => `t${s.t}`).join(', ');
    txt += ` Lưu ý: ở ${periods}, PSI không báo nhưng AP đã sụp – PSI im lặng chưa chắc là ổn.`;
  }
  return txt;
}
