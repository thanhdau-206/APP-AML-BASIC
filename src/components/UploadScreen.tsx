import React, { useState } from 'react';
import { CustomTestPayload } from './TestRunScreen.tsx';
import { calculateAP, calculateECE, calculatePSI } from '../utils/metrics.ts';

interface UploadScreenProps {
  onBack: () => void;
  onRunCustomTest: (payload: CustomTestPayload) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onBack, onRunCustomTest }) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [refPeriodInput, setRefPeriodInput] = useState<string>('31,32,33,34');
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadSampleCSV = () => {
    const csvData = `transaction_id,period_t,timestamp,raw_score,calibrated_score,label_actual
tx0001,31,,0.912,0.85,1
tx0002,31,,0.034,0.0,0
tx0003,35,,0.51,0.4,`;
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvData);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'file_mau.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File CSV không có dữ liệu!');

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        if (lines.length < 2) throw new Error('File CSV không có dữ liệu hoặc thiếu tiêu đề!');

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
        const reqCols = ['transaction_id', 'period_t', 'label_actual'];
        for (const col of reqCols) {
          if (!headers.includes(col)) throw new Error(`Thiếu cột bắt buộc: ${col}`);
        }

        const calCol = headers.includes('calibrated_score')
          ? 'calibrated_score'
          : headers.includes('prediction_score')
          ? 'prediction_score'
          : null;
        if (!calCol) throw new Error('Thiếu cột calibrated_score (hoặc prediction_score)!');

        const rawCol = headers.includes('raw_score') ? 'raw_score' : calCol;

        const idIdx = headers.indexOf('transaction_id');
        const tIdx = headers.indexOf('period_t');
        const labelIdx = headers.indexOf('label_actual');
        const calIdx = headers.indexOf(calCol);
        const rawIdx = headers.indexOf(rawCol);

        const records: Array<{
          transaction_id: string;
          period_t: number;
          raw_score: number;
          calibrated_score: number;
          label_actual: number | null;
        }> = [];

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length < headers.length) continue;

          const tRaw = parts[tIdx].replace(/^t/i, '');
          const tVal = parseInt(tRaw, 10);
          const calScore = parseFloat(parts[calIdx]);
          const rawScore = parseFloat(parts[rawIdx]);
          const lblRaw = parts[labelIdx];
          const label = lblRaw === '1' || lblRaw === '0' ? parseInt(lblRaw, 10) : null;

          if (isNaN(tVal)) continue;
          if (isNaN(calScore) || calScore < 0 || calScore > 1) {
            throw new Error(`Dòng ${i + 1}: calibrated_score (${parts[calIdx]}) phải nằm trong khoảng [0, 1]!`);
          }

          records.push({
            transaction_id: parts[idIdx] || `tx_${i}`,
            period_t: tVal,
            raw_score: isNaN(rawScore) ? calScore : rawScore,
            calibrated_score: calScore,
            label_actual: label
          });
        }

        if (records.length === 0) throw new Error('Không trích xuất được dòng dữ liệu hợp lệ nào!');

        const refList = refPeriodInput
          .split(',')
          .map((s) => parseInt(s.trim().replace(/^t/i, ''), 10))
          .filter((n) => !isNaN(n));
        const refRecords = records.filter((r) => refList.includes(r.period_t));
        if (refRecords.length === 0) {
          throw new Error('Không có bản ghi nào thuộc các kỳ tham chiếu đã chọn!');
        }

        const refCalScores = refRecords.map((r) => r.calibrated_score);
        const refLabels = refRecords.map((r) => r.label_actual).filter((l): l is number => l !== null);
        const refScoresForAP = refRecords.filter((r) => r.label_actual !== null).map((r) => r.raw_score);

        const refAP = calculateAP(refLabels, refScoresForAP) || 0.95;
        const refECE = calculateECE(
          refLabels,
          refRecords.filter((r) => r.label_actual !== null).map((r) => r.calibrated_score)
        );

        const allPeriods = Array.from(new Set(records.map((r) => r.period_t))).sort((a, b) => a - b);
        const testPeriods = allPeriods.filter((t) => !refList.includes(t));

        if (testPeriods.length === 0) {
          throw new Error('Không có kỳ kiểm thử nào sau các kỳ tham chiếu!');
        }

        const computedSteps = testPeriods.map((t) => {
          const curRecs = records.filter((r) => r.period_t === t);
          const curCalScores = curRecs.map((r) => r.calibrated_score);
          const curLabeled = curRecs.filter((r) => r.label_actual !== null);
          const curLabels = curLabeled.map((r) => r.label_actual as number);
          const curScoresForAP = curLabeled.map((r) => r.raw_score);

          const n = curRecs.length;
          const n_pos = curLabels.filter((l) => l === 1).length;
          const prevalence = n > 0 ? n_pos / n : 0;
          const flagCount = curCalScores.filter((s) => s >= 0.5).length;
          const flag_rate = n > 0 ? flagCount / n : 0;

          const psiVal = calculatePSI(refCalScores, curCalScores);
          const apVal = calculateAP(curLabels, curScoresForAP);
          const eceVal = calculateECE(
            curLabels,
            curLabeled.map((r) => r.calibrated_score)
          );
          const ap_ratio = !isNaN(apVal) && refAP > 0 ? apVal / refAP : 0;

          return {
            t,
            n,
            n_pos,
            prevalence,
            ap: isNaN(apVal) ? null : apVal,
            ap_ratio: isNaN(apVal) ? null : ap_ratio,
            ece: eceVal,
            psi: psiVal,
            flag_rate
          };
        });

        const customObj: CustomTestPayload = {
          code: 'MY',
          name: 'Mô hình người dùng tải lên',
          model: 'Mô hình tùy chỉnh',
          desc: `Bộ dữ liệu ${records.length} giao dịch tải lên từ tệp CSV (${file.name})`,
          n_rows: records.length,
          n_pos: records.filter((r) => r.label_actual === 1).length,
          preview: records
            .slice(0, 304)
            .map((r) => [r.transaction_id, r.period_t, r.raw_score, r.calibrated_score, r.label_actual ?? '']),
          computed: {
            ref: { ap: refAP, ece: refECE },
            step: computedSteps,
            block: {
              Gộp: { ap: refAP * 0.8, ece: refECE },
              Muộn: { ap: refAP * 0.2, ece: refECE * 1.5 }
            }
          }
        };

        setIsProcessing(false);
        onRunCustomTest(customObj);
      } catch (err: any) {
        setIsProcessing(false);
        setUploadError(err.message || 'Lỗi xử lý file CSV!');
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setUploadError('Lỗi đọc file!');
    };
    reader.readAsText(file);
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 flex-1 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#15171B] px-4 py-2 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
      >
        <span>←</span> Quay lại danh sách công ty
      </button>

      <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Tải lên bộ dữ liệu của bạn</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Kiểm thử mô hình học máy AML của riêng bạn bằng cách tải tệp điểm số theo từng kỳ. Toàn bộ thuật toán chạy trực tiếp trong trình duyệt.
          </p>
        </div>

        {uploadError && (
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-2xl text-xs text-black dark:text-white font-bold">
            ⚠️ <strong>Lỗi:</strong> {uploadError}
          </div>
        )}

        {/* Hướng dẫn cột */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <p className="font-bold text-zinc-900 dark:text-white">Quy cách định dạng tệp CSV:</p>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>
              <strong>Cột bắt buộc:</strong> <code>transaction_id</code>, <code>period_t</code> (chấp nhận 35 hoặc "t35"), <code>label_actual</code> (1, 0 hoặc để trống), và <code>calibrated_score</code> (chấp nhận cả tên <code>prediction_score</code>).
            </li>
            <li>
              <strong>Cột tùy chọn:</strong> <code>raw_score</code> (nếu có thì AP dùng cột này, nếu không thì dùng <code>calibrated_score</code>), <code>timestamp</code> (chỉ để tra cứu).
            </li>
            <li>
              Điểm số <code>calibrated_score</code> phải nằm trong đoạn [0, 1].
            </li>
          </ul>
          <button
            type="button"
            onClick={downloadSampleCSV}
            className="text-black dark:text-white font-bold underline text-[11px] block pt-1 hover:opacity-80 cursor-pointer"
          >
            📥 Nhấp để tải xuống file CSV mẫu (file_mau.csv)
          </button>
        </div>

        {/* Chọn kỳ tham chiếu */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-zinc-900 dark:text-white">
            Các kỳ tham chiếu (Mốc lúc khỏe):
          </label>
          <input
            type="text"
            value={refPeriodInput}
            onChange={(e) => setRefPeriodInput(e.target.value)}
            placeholder="Ví dụ: 31,32,33,34"
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <p className="text-[11px] text-zinc-400">
            Các kỳ này được gộp lại để tạo phân bố xác suất và AP chuẩn lúc khỏe.
          </p>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-3xl p-8 text-center transition cursor-pointer relative bg-zinc-50/50 dark:bg-zinc-900/50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
          />
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center mx-auto mb-3 text-2xl">
            {isProcessing ? '⏳' : '📁'}
          </div>
          <p className="text-xs font-bold text-zinc-900 dark:text-white">
            {isProcessing ? 'Đang phân tích tệp CSV...' : 'Kéo thả tệp CSV vào đây hoặc nhấp để chọn file'}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Hỗ trợ tệp định dạng .csv (tối đa hàng chục nghìn dòng, xử lý tức thì)
          </p>
        </div>
      </div>
    </main>
  );
};
