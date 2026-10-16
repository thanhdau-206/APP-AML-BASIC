import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Copy, Check } from 'lucide-react';

export const CodeDisplay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pythonCode = `# Trích từ tinh_chi_so_giam_sat.py – mã Python của nhóm nghiên cứu

# Lệnh chạy:
# python tinh_chi_so_giam_sat.py "<thư mục btc3\\predictions>" <thư mục ra>

import numpy as np
from sklearn.metrics import average_precision_score

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
    return float(average_precision_score(y, s)) if y.sum() > 0 else float("nan")
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Code2 className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">
            💻 Code để chạy
          </span>
          <span className="text-2xs text-slate-500 hidden sm:inline">
            (Trích từ tinh_chi_so_giam_sat.py – mã Python của nhóm nghiên cứu)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{isOpen ? 'Thu gọn' : 'Xem mã Python'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-2xs flex items-center gap-1 border border-slate-700"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
          <pre className="text-2xs leading-relaxed">{pythonCode}</pre>
        </div>
      )}
    </div>
  );
};
