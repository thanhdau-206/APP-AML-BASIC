import React, { useState } from 'react';
import { Company } from '../data/du_lieu_app.ts';
import { formatNum, formatInt } from '../utils/metrics.ts';

interface CompanyDetailScreenProps {
  company: Company;
  onBack: () => void;
  onStartTesting: () => void;
}

export const CompanyDetailScreen: React.FC<CompanyDetailScreenProps> = ({
  company,
  onBack,
  onStartTesting
}) => {
  const [previewPage, setPreviewPage] = useState(1);
  const previewPerPage = 20;

  const previewRows = company.preview || [];
  const totalPages = Math.ceil(previewRows.length / previewPerPage) || 1;

  const downloadPreviewCSV = () => {
    const cols = ['transaction_id', 'period_t', 'raw_score', 'calibrated_score', 'label_actual'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [cols.join(','), ...previewRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cong_ty_${company.code}_${company.model.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex-1 space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#15171B] px-4 py-2 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
      >
        <span>←</span> Quay lại danh sách công ty
      </button>

      {/* Header Company Card */}
      <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white font-black text-2xl flex items-center justify-center">
            {company.code}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                {company.name} <span className="text-sm font-normal text-zinc-400">(giả định)</span>
              </h2>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs px-3 py-1 rounded-full font-bold border border-zinc-200 dark:border-zinc-700">
                Mô hình: {company.model}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
              {company.desc}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadPreviewCSV}
            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 transition cursor-pointer"
          >
            📥 Tải dữ liệu (CSV, bản trích 304 dòng)
          </button>
        </div>
      </div>

      {/* Nguồn dữ liệu & Ghi chú riêng */}
      <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-xs text-zinc-800 dark:text-zinc-300 flex flex-wrap items-center justify-between gap-2">
        <p>
          <strong>Nguồn dữ liệu:</strong> bộ Elliptic (giao dịch Bitcoin, công khai) · <strong>Mô hình:</strong> {company.model} · <em>Công ty là giả định, mọi con số là kết quả thật của mô hình trong bài báo.</em>
        </p>
        <span className="text-[11px] text-zinc-500 italic shrink-0">* Bản đầy đủ do nhóm nghiên cứu cung cấp.</span>
      </div>

      {/* Thống kê dữ liệu & Bảng xem trước preview */}
      <div className="bg-white dark:bg-[#15171B] p-6 rounded-3xl shadow-card border border-zinc-200/80 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Dữ liệu công ty gửi sang</h3>
            <p className="text-xs text-zinc-400">
              Tổng số dòng: <strong>{formatInt(company.n_rows)}</strong> giao dịch · Số vụ rửa tiền phát hiện: <strong>{formatInt(company.n_pos)}</strong> vụ
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>
              Xem trang {previewPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={previewPage === 1}
              onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              ◀
            </button>
            <button
              type="button"
              disabled={previewPage >= totalPages}
              onClick={() => setPreviewPage((p) => p + 1)}
              className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Chú thích các cột */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
          <div>
            <strong className="text-zinc-900 dark:text-white font-mono">transaction_id:</strong> Mã giao dịch
          </div>
          <div>
            <strong className="text-zinc-900 dark:text-white font-mono">period_t:</strong> Kỳ thời gian
          </div>
          <div>
            <strong className="text-zinc-900 dark:text-white font-mono">raw_score:</strong> Điểm thô (tính AP)
          </div>
          <div>
            <strong className="text-zinc-900 dark:text-white font-mono">calibrated_score:</strong> Điểm hiệu chỉnh (PSI, ECE)
          </div>
          <div>
            <strong className="text-zinc-900 dark:text-white font-mono">label_actual:</strong> 1 = rửa tiền, 0 = sạch, trống = chưa điều tra
          </div>
        </div>

        {/* Table Preview */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">transaction_id</th>
                <th className="py-2.5 px-3">period_t</th>
                <th className="py-2.5 px-3">raw_score</th>
                <th className="py-2.5 px-3">calibrated_score</th>
                <th className="py-2.5 px-3">label_actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-normal">
              {previewRows
                .slice((previewPage - 1) * previewPerPage, previewPage * previewPerPage)
                .map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-2 px-3 text-zinc-400 text-[11px]">
                      {(previewPage - 1) * previewPerPage + idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-white">{row[0]}</td>
                    <td className="py-2 px-3 text-zinc-500">t{row[1]}</td>
                    <td className="py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                      {formatNum(row[2])}
                    </td>
                    <td className="py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                      {formatNum(row[3])}
                    </td>
                    <td className="py-2 px-3">
                      {row[4] === 1 ? (
                        <span className="bg-zinc-900 text-white dark:bg-white dark:text-black font-bold px-2 py-0.5 rounded text-[10px]">
                          1 (Rửa tiền)
                        </span>
                      ) : row[4] === 0 ? (
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded text-[10px]">
                          0 (Sạch)
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Nút lớn Bắt đầu kiểm thử */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onStartTesting}
          className="bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <span>Bắt đầu kiểm thử</span>
          <span>➔</span>
        </button>
      </div>
    </main>
  );
};
