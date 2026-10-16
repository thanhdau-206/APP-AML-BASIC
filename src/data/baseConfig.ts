export interface Config {
  ref_steps: number[];
  test_steps: number[];
  min_pos: number;
  warn_ratio: number;
  alert_ratio: number;
  ece_warn: number;
  psi_alert: number;
  psi_consecutive: number;
}

export interface StepInfo {
  t: number;
  n: number;
  n_pos: number;
  prevalence: number;
}

export interface RefInfo {
  n: number;
  n_pos: number;
  prevalence: number;
}

export interface StepMetric {
  t: number;
  ap: number;
  ap_sd?: number;
  ap_ratio: number;
  ece: number;
  psi: number;
  flag_rate: number;
}

export interface BlockMetric {
  ap: number;
  ap_sd?: number;
  lift?: number;
  ece: number;
}

export interface ModelRunData {
  ref: {
    ap: number;
    ap_sd?: number;
    ece: number;
  };
  step: StepMetric[];
  block: {
    Sớm: BlockMetric;
    Giữa: BlockMetric;
    Muộn: BlockMetric;
    Gộp: BlockMetric;
  };
}

export interface Company {
  code: string;
  model: string;
  name: string;
  desc: string;
  n_rows: number;
  n_pos: number;
  mean_5seed: ModelRunData;
  seed42: ModelRunData;
  preview: (string | number)[][];
}

export const baseConfig: {
  ghi_chu: string;
  config: Config;
  steps: StepInfo[];
  ref: RefInfo;
  preview_columns: string[];
} = {
  ghi_chu: "Du lieu Elliptic, ket qua chay lai 07/10/2026 (ket_qua_BTC5/btc3). mean_5seed = trung binh 5 seed; seed42 = mot lan chay. AP tinh tren raw_score; ECE, PSI, flag_rate tren calibrated_score; flag = calibrated_score >= 0.5.",
  config: {
    ref_steps: [31, 32, 33, 34],
    test_steps: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    min_pos: 10,
    warn_ratio: 0.7,
    alert_ratio: 0.5,
    ece_warn: 0.1,
    psi_alert: 0.25,
    psi_consecutive: 2
  },
  steps: [
    { t: 35, n: 1341, n_pos: 182, prevalence: 0.13571961222967935 },
    { t: 36, n: 1708, n_pos: 33, prevalence: 0.019320843091334895 },
    { t: 37, n: 498, n_pos: 40, prevalence: 0.08032128514056225 },
    { t: 38, n: 756, n_pos: 111, prevalence: 0.14682539682539683 },
    { t: 39, n: 1183, n_pos: 81, prevalence: 0.06846999154691462 },
    { t: 40, n: 1211, n_pos: 112, prevalence: 0.09248554913294797 },
    { t: 41, n: 1132, n_pos: 116, prevalence: 0.10247349823321555 },
    { t: 42, n: 2154, n_pos: 239, prevalence: 0.11095636025998143 },
    { t: 43, n: 1370, n_pos: 24, prevalence: 0.017518248175182483 },
    { t: 44, n: 1591, n_pos: 24, prevalence: 0.01508485229415462 },
    { t: 45, n: 1221, n_pos: 5, prevalence: 0.004095004095004095 },
    { t: 46, n: 712, n_pos: 2, prevalence: 0.0028089887640449437 },
    { t: 47, n: 846, n_pos: 22, prevalence: 0.026004728132387706 },
    { t: 48, n: 471, n_pos: 36, prevalence: 0.07643312101910828 },
    { t: 49, n: 476, n_pos: 56, prevalence: 0.11764705882352941 }
  ],
  ref: {
    n: 2989,
    n_pos: 508,
    prevalence: 0.16995650719304115
  },
  preview_columns: ["transaction_id", "period_t", "raw_score", "calibrated_score", "label_actual"]
};
