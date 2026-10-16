import React, { useState, useRef } from 'react';
import { CustomTestPayload } from './TestRunScreen.tsx';
import {
  calculateAP,
  calculateECE,
  calculatePSI,
  formatNum,
  formatPct
} from '../utils/metrics.ts';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Play,
  ArrowLeft,
  X,
  FileText
} from 'lucide-react';

interface UploadScreenProps {
  onBack: () => void;
  onRunCustomTest: (payload: CustomTestPayload) => void;
}

interface ParsedRow {
  transaction_id: string;
  period_t: number;
  raw_score: number;
  calibrated_score: number;
  label_actual: number | null; // 1, 0, or null
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  onBack,
  onRunCustomTest
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedPeriods, setDetectedPeriods] = useState<number[]>([]);
  const [selectedRefPeriods, setSelectedRefPeriods] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [modelDisplayName, setModelDisplayName] = useState('Mô hình AML của bạn');

  const parseCSV = (content: string) => {
    setErrorMessage(null);
    try {
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('Tệp CSV cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.');
      }

      // Parse header
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

      // Check required columns:
      // transaction_id, period_t, label_actual, and calibrated_score (or prediction_score)
      const txIdIdx = header.findIndex((h) => h === 'transaction_id');
      const periodIdx = header.findIndex((h) => h === 'period_t' || h === 'period' || h === 'kỳ');
      const labelIdx = header.findIndex((h) => h === 'label_actual' || h === 'label' || h === 'nhãn');
      
      let calibIdx = header.findIndex((h) => h === 'calibrated_score' || h === 'prediction_score');
      if (calibIdx === -1) {
        calibIdx = header.findIndex((h) => h === 'score' || h === 'điểm' || h === 'calibrated');
      }

      const rawIdx = header.findIndex((h) => h === 'raw_score');

      const missingCols: string[] = [];
      if (txIdIdx === -1) missingCols.push('transaction_id');
      if (periodIdx === -1) missingCols.push('period_t');
      if (labelIdx === -1) missingCols.push('label_actual');
      if (calibIdx === -1) missingCols.push('calibrated_score (hoặc prediction_score)');

      if (missingCols.length > 0) {
        throw new Error(`Tệp CSV thiếu các cột bắt buộc: ${missingCols.join(', ')}`);
      }

      const rows: ParsedRow[] = [];
      const periodSet = new Set<number>();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 4) continue;

        const txId = cols[txIdIdx] || `tx_${i}`;

        // period_t accepts number (35) or string ("t35")
        const rawPeriod = cols[periodIdx].replace(/^t/i, '');
        const pNum = parseInt(rawPeriod, 10);
        if (isNaN(pNum)) {
          throw new Error(`Dòng ${i + 1}: kỳ thời gian '${cols[periodIdx]}' không hợp lệ (phải là số hoặc dạng 't35').`);
        }
        periodSet.add(pNum);

        // calibrated_score / prediction_score
        const calibVal = parseFloat(cols[calibIdx]);
        if (isNaN(calibVal) || calibVal < 0 || calibVal > 1) {
          throw new Error(`Dòng ${i + 1}: calibrated_score phải là số trong khoảng [0, 1], nhận được: '${cols[calibIdx]}'`);
        }

        // raw_score (if present, use it; else fallback to calibrated_score)
        let rawVal = calibVal;
        if (rawIdx !== -1 && cols[rawIdx] !== undefined && cols[rawIdx] !== '') {
          const r = parseFloat(cols[rawIdx]);
          if (!isNaN(r)) rawVal = r;
        }

        // label_actual: 1, 0, or blank
        let lbl: number | null = null;
        const rawLbl = cols[labelIdx];
        if (rawLbl === '1' || rawLbl.toLowerCase() === 'true') {
          lbl = 1;
        } else if (rawLbl === '0' || rawLbl.toLowerCase() === 'false') {
          lbl = 0;
        } else if (rawLbl === '' || rawLbl === null || rawLbl === undefined) {
          lbl = null;
        } else {
          throw new Error(`Dòng ${i + 1}: label_actual '${rawLbl}' không hợp lệ (chỉ chấp nhận 1, 0 hoặc để trống).`);
        }

        rows.push({
          transaction_id: txId,
          period_t: pNum,
          raw_score: rawVal,
          calibrated_score: calibVal,
          label_actual: lbl
        });
      }

      if (rows.length === 0) {
        throw new Error('Không tìm thấy dòng dữ liệu hợp lệ nào.');
      }

      const sortedPeriods = Array.from(periodSet).sort((a, b) => a - b);
      if (sortedPeriods.length < 2) {
        throw new Error('Cần ít nhất 2 kỳ thời gian khác nhau để thiết lập mốc tham chiếu và kỳ kiểm tra.');
      }

      setParsedRows(rows);
      setDetectedPeriods(sortedPeriods);
      // Default reference periods: first 4 periods (or first half if fewer than 4)
      const defaultRef = sortedPeriods.slice(0, Math.min(4, Math.max(1, Math.floor(sortedPeriods.length / 2))));
      setSelectedRefPeriods(defaultRef);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đọc file CSV.');
      setParsedRows([]);
      setDetectedPeriods([]);
    }
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleStartCustomTesting = () => {
    if (parsedRows.length === 0 || selectedRefPeriods.length === 0) return;

    // Separate reference data vs test data
    const refRows = parsedRows.filter((r) => selectedRefPeriods.includes(r.period_t));
    const testPeriods = detectedPeriods.filter((p) => !selectedRefPeriods.includes(p));

    if (testPeriods.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 kỳ kiểm tra ngoài các kỳ tham chiếu.');
      return;
    }

    // 1. Reference metrics
    // PSI uses all rows (including unlabeled)
    const refAllCalibratedScores = refRows.map((r) => r.calibrated_score);
    // AP & ECE use labeled rows only
    const refLabeledRows = refRows.filter((r) => r.label_actual !== null);
    const refY = refLabeledRows.map((r) => r.label_actual as number);
    const refRaw = refLabeledRows.map((r) => r.raw_score);
    const refCalib = refLabeledRows.map((r) => r.calibrated_score);

    const refAp = calculateAP(refY, refRaw);
    const refEce = calculateECE(refY, refCalib);

    // 2. Compute metrics for each testing period
    const steps = testPeriods.map((t) => {
      const curRows = parsedRows.filter((r) => r.period_t === t);
      const curAllCalibratedScores = curRows.map((r) => r.calibrated_score);

      const curLabeledRows = curRows.filter((r) => r.label_actual !== null);
      const curY = curLabeledRows.map((r) => r.label_actual as number);
      const curRaw = curLabeledRows.map((r) => r.raw_score);
      const curCalib = curLabeledRows.map((r) => r.calibrated_score);

      const n_pos = curY.filter((y) => y === 1).length;
      const ap = calculateAP(curY, curRaw);
      const ece = calculateECE(curY, curCalib);
      const psi = calculatePSI(refAllCalibratedScores, curAllCalibratedScores);
      
      const ap_ratio = !isNaN(refAp) && refAp > 0 && !isNaN(ap) ? ap / refAp : 0;
      
      // flag = calibrated_score >= 0.5
      const flaggedCount = curAllCalibratedScores.filter((s) => s >= 0.5).length;
      const flag_rate = curAllCalibratedScores.length > 0 ? flaggedCount / curAllCalibratedScores.length : 0;

      return {
        t,
        ap: isNaN(ap) ? 0 : ap,
        ap_ratio,
        ece,
        psi,
        flag_rate,
        n_pos,
        n: curLabeledRows.length
      };
    });

    // 3. Blocks: Sớm, Giữa, Muộn, Gộp
    // Split test periods into 3 equal blocks
    const nSteps = steps.length;
    const split1 = Math.floor(nSteps / 3);
    const split2 = Math.floor((2 * nSteps) / 3);

    const somSteps = steps.slice(0, split1 || 1);
    const giuaSteps = steps.slice(split1 || 1, split2 || 2);
    const muonSteps = steps.slice(split2 || 2);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const payload: CustomTestPayload = {
      name: fileName ? fileName.replace(/\.csv$/i, '') : 'Bộ dữ liệu người dùng',
      model: modelDisplayName,
      isCustom: true,
      n_rows: parsedRows.length,
      n_pos: parsedRows.filter((r) => r.label_actual === 1).length,
      ref: {
        ap: isNaN(refAp) ? 1.0 : refAp,
        ece: refEce
      },
      step: steps,
      block: {
        Sớm: { ap: avg(somSteps.map((s) => s.ap)), ece: avg(somSteps.map((s) => s.ece)) },
        Giữa: { ap: avg(giuaSteps.map((s) => s.ap)), ece: avg(giuaSteps.map((s) => s.ece)) },
        Muộn: { ap: avg(muonSteps.map((s) => s.ap)), ece: avg(muonSteps.map((s) => s.ece)) },
        Gộp: { ap: avg(steps.map((s) => s.ap)), ece: avg(steps.map((s) => s.ece)) }
      }
    };

    onRunCustomTest(payload);
  };

  const toggleRefPeriod = (p: number) => {
    setSelectedRefPeriods((prev) => {
      if (prev.includes(p)) {
        if (prev.length <= 1) return prev; // Keep at least 1
        return prev.filter((item) => item !== p);
      } else {
        return [...prev, p].sort((a, b) => a - b);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Quay lại</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Tải lên bộ dữ liệu của bạn
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Chạy kiểm thử trực tiếp trong trình duyệt để đo độ suy giảm mô hình AML trên tập dữ liệu của bạn.
          </p>
        </div>

        {/* Requirements info card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Định dạng CSV được hỗ trợ:</span>
            <a
              href="/file_mau.csv"
              download="file_mau.csv"
              className="text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Tải tệp mẫu (file_mau.csv)
            </a>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>
              <strong>Cột bắt buộc:</strong> <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-indigo-700">transaction_id</code>,{' '}
              <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-indigo-700">period_t</code> (số 35 hoặc 't35'),{' '}
              <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-indigo-700">calibrated_score</code> (hoặc <code className="font-mono text-indigo-700">prediction_score</code>: số 0–1),{' '}
              <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-indigo-700">label_actual</code> (1: rửa tiền, 0: sạch, trống: chưa điều tra).
            </li>
            <li>
              <strong>Cột tùy chọn:</strong> <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">raw_score</code> (nếu có AP sẽ tính trên cột này, nếu không sẽ dùng calibrated_score), <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">timestamp</code>.
            </li>
          </ul>
        </div>

        {/* Model Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Tên mô hình hoặc hệ thống chấm điểm:
          </label>
          <input
            type="text"
            value={modelDisplayName}
            onChange={(e) => setModelDisplayName(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ví dụ: LightGBM Prod v2, Random Forest On-chain..."
          />
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60 scale-99'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {fileName ? fileName : 'Kéo thả tệp CSV vào đây hoặc bấm để chọn tệp'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ định dạng CSV tiêu chuẩn (UTF-8)
              </p>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-semibold">Tệp không hợp lệ:</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Data Summary & Reference Period Picker */}
        {parsedRows.length > 0 && !errorMessage && (
          <div className="space-y-5 p-5 bg-indigo-50/40 rounded-xl border border-indigo-200/80">
            <div className="flex items-center gap-2 text-indigo-800 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Đã phân tích thành công {parsedRows.length.toLocaleString('vi-VN')} giao dịch qua {detectedPeriods.length} kỳ!</span>
            </div>

            {/* Reference Period Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Chọn các kỳ tham chiếu mốc khỏe (Reference Periods):
              </label>
              <p className="text-2xs text-slate-500">
                Dữ liệu trong các kỳ này sẽ được gộp lại để thiết lập chuẩn phân bố PSI và điểm AP chuẩn.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {detectedPeriods.map((p) => {
                  const isSelected = selectedRefPeriods.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleRefPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      t={p} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-2xs text-slate-600 font-mono bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <div>Kỳ tham chiếu đã chọn: <strong>{selectedRefPeriods.map((p) => `t${p}`).join(', ')}</strong></div>
              <div>Kỳ kiểm tra suy giảm: <strong>{detectedPeriods.filter((p) => !selectedRefPeriods.includes(p)).map((p) => `t${p}`).join(', ')}</strong></div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="pt-2 flex justify-end">
          <button
            disabled={parsedRows.length === 0 || !!errorMessage}
            onClick={handleStartCustomTesting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Bắt đầu kiểm thử</span>
          </button>
        </div>
      </div>
    </div>
  );
};
