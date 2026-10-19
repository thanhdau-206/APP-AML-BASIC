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
        className="text-xs font-bold text-[#635850] hover:text-[#38312C] dark:text-[#CBBDB2] dark:hover:text-[#FAF6F0] bg-[#FAF5EE] dark:bg-[#2A2320] px-4 py-2.5 rounded-full border border-[#EADBCC] dark:border-[#443832] clay-btn transition flex items-center gap-2 cursor-pointer shadow-xs"
      >
        <span>←</span> Quay lại danh sách công ty
      </button>

      {/* Header Company Card */}
      <div className="clay-card p-6 sm:p-8 rounded-[32px] flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F6BEB0] via-[#E69686] to-[#D88170] text-white font-black text-3xl flex items-center justify-center clay-disc shadow-md border border-white/40">
            {company.code}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-[#38312C] dark:text-[#FAF6F0]">
                {company.name} <span className="text-sm font-normal text-[#94867C] dark:text-[#8C7E74]">(giả định)</span>
              </h2>
              <span className="bg-[#FAF5EE] dark:bg-[#2A2320] text-[#635850] dark:text-[#CBBDB2] text-xs px-3.5 py-1 rounded-full font-bold border border-[#EADBCC] dark:border-[#443832] clay-pill">
                Mô hình: {company.model}
              </span>
            </div>
            <p className="text-xs text-[#635850] dark:text-[#CBBDB2] mt-1.5 max-w-2xl leading-relaxed">
              {company.desc}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadPreviewCSV}
            className="text-xs bg-[#FAF5EE] hover:bg-[#F2E8DC] dark:bg-[#2A2320] dark:hover:bg-[#38302A] text-[#38312C] dark:text-[#FAF6F0] font-bold px-4 py-2.5 rounded-2xl border border-[#EADBCC] dark:border-[#443832] clay-btn transition cursor-pointer shadow-xs"
          >
            📥 Tải dữ liệu (CSV, bản trích 304 dòng)
          </button>
        </div>
      </div>

      {/* Nguồn dữ liệu & Ghi chú riêng */}
      <div className="bg-[#FAF5EE]/90 dark:bg-[#231D1A]/90 border border-[#EADBCC] dark:border-[#38302A] p-4 px-5 rounded-2xl text-xs text-[#635850] dark:text-[#CBBDB2] flex flex-wrap items-center justify-between gap-3 clay-pill">
        <p>
          <strong className="text-[#38312C] dark:text-[#FAF6F0]">Nguồn dữ liệu:</strong> bộ Elliptic (giao dịch Bitcoin, công khai) · <strong className="text-[#38312C] dark:text-[#FAF6F0]">Mô hình:</strong> {company.model} · <em className="text-[#E69686]">Công ty là giả định, mọi con số là kết quả thật của mô hình trong bài báo.</em>
        </p>
        <span className="text-[11px] text-[#94867C] dark:text-[#8C7E74] italic shrink-0">* Bản đầy đủ do nhóm nghiên cứu cung cấp.</span>
      </div>

      {/* Thống kê dữ liệu & Bảng xem trước preview */}
      <div className="clay-card p-6 sm:p-8 rounded-[32px] space-y-5">
        <div className="flex flex-wrap justify-between items-center pb-4 border-b border-[#EFE4D6] dark:border-[#38302A] gap-3">
          <div>
            <h3 className="text-lg font-black text-[#38312C] dark:text-[#FAF6F0]">Dữ liệu công ty gửi sang</h3>
            <p className="text-xs text-[#8C7E74] dark:text-[#A8988C] mt-0.5">
              Tổng số dòng: <strong className="text-[#38312C] dark:text-[#FAF6F0]">{formatInt(company.n_rows)}</strong> giao dịch · Số vụ rửa tiền phát hiện: <strong className="text-[#E69686]">{formatInt(company.n_pos)}</strong> vụ
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#635850] dark:text-[#CBBDB2]">
            <span className="bg-[#FAF5EE] dark:bg-[#2A2320] px-3 py-1 rounded-xl border border-[#EADBCC] dark:border-[#443832] font-semibold">
              Trang {previewPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={previewPage === 1}
              onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-xl bg-[#FAF5EE] dark:bg-[#2A2320] border border-[#EADBCC] dark:border-[#443832] disabled:opacity-30 hover:bg-[#F2E8DC] dark:hover:bg-[#38302A] cursor-pointer flex items-center justify-center font-bold text-[#38312C] dark:text-[#FAF6F0] clay-btn"
            >
              ◀
            </button>
            <button
              type="button"
              disabled={previewPage >= totalPages}
              onClick={() => setPreviewPage((p) => p + 1)}
              className="w-8 h-8 rounded-xl bg-[#FAF5EE] dark:bg-[#2A2320] border border-[#EADBCC] dark:border-[#443832] disabled:opacity-30 hover:bg-[#F2E8DC] dark:hover:bg-[#38302A] cursor-pointer flex items-center justify-center font-bold text-[#38312C] dark:text-[#FAF6F0] clay-btn"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Chú thích các cột */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-[#FAF5EE]/80 dark:bg-[#2A2320]/60 rounded-2xl text-[11px] text-[#635850] dark:text-[#CBBDB2] border border-[#EADBCC] dark:border-[#443832] clay-inset">
          <div>
            <strong className="text-[#38312C] dark:text-[#FAF6F0] font-mono">transaction_id:</strong> Mã giao dịch
          </div>
          <div>
            <strong className="text-[#38312C] dark:text-[#FAF6F0] font-mono">period_t:</strong> Kỳ thời gian
          </div>
          <div>
            <strong className="text-[#38312C] dark:text-[#FAF6F0] font-mono">raw_score:</strong> Điểm thô (tính AP)
          </div>
          <div>
            <strong className="text-[#38312C] dark:text-[#FAF6F0] font-mono">calibrated_score:</strong> Điểm hiệu chỉnh (PSI, ECE)
          </div>
          <div>
            <strong className="text-[#38312C] dark:text-[#FAF6F0] font-mono">label_actual:</strong> 1 = rửa tiền, 0 = sạch, trống = chưa điều tra
          </div>
        </div>

        {/* Table Preview */}
        <div className="overflow-x-auto rounded-2xl border border-[#EADBCC] dark:border-[#38302A] shadow-inner bg-[#FFFDF9] dark:bg-[#231D1A]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FAF5EE] dark:bg-[#2A2320] text-[#635850] dark:text-[#CBBDB2] font-bold border-b border-[#EADBCC] dark:border-[#38302A]">
              <tr>
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">transaction_id</th>
                <th className="py-3 px-3.5">period_t</th>
                <th className="py-3 px-3.5">raw_score</th>
                <th className="py-3 px-3.5">calibrated_score</th>
                <th className="py-3 px-3.5">label_actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE4D6]/60 dark:divide-[#38302A]/60 font-normal">
              {previewRows
                .slice((previewPage - 1) * previewPerPage, previewPage * previewPerPage)
                .map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF5EE]/60 dark:hover:bg-[#2A2320]/40 transition-colors">
                    <td className="py-2.5 px-3.5 text-[#94867C] dark:text-[#8C7E74] text-[11px]">
                      {(previewPage - 1) * previewPerPage + idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-[#38312C] dark:text-[#FAF6F0]">{row[0]}</td>
                    <td className="py-2.5 px-3.5 text-[#8BAFD4] font-bold">t{row[1]}</td>
                    <td className="py-2.5 px-3.5 font-medium text-[#38312C] dark:text-[#FAF6F0]">
                      {formatNum(row[2])}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-[#38312C] dark:text-[#FAF6F0]">
                      {formatNum(row[3])}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {row[4] === 1 ? (
                        <span className="bg-gradient-to-r from-[#F6BEB0] to-[#E69686] text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-xs inline-block">
                          1 (Rửa tiền)
                        </span>
                      ) : row[4] === 0 ? (
                        <span className="bg-[#E8F1FA] dark:bg-[#253240] text-[#4A7AA5] dark:text-[#B8D3EC] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[#D0E2F3] dark:border-[#354B60] inline-block">
                          0 (Sạch)
                        </span>
                      ) : (
                        <span className="text-[#94867C] italic text-[10px]">—</span>
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
          className="clay-btn bg-gradient-to-r from-[#E69686] via-[#DE8776] to-[#D88170] hover:from-[#ED9E8E] hover:to-[#DE8776] text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg border border-white/40 transition flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <span>Bắt đầu kiểm thử</span>
          <span>➔</span>
        </button>
      </div>
    </main>
  );
};

