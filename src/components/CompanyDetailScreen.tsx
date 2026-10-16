import React, { useState } from 'react';
import { Company } from '../data/du_lieu_app.ts';
import { formatNum } from '../utils/metrics.ts';
import {
  ArrowLeft,
  Play,
  Download,
  Info,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  FileSpreadsheet
} from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 20;

  // Filter preview rows
  const filteredPreview = company.preview.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const txId = String(row[0]).toLowerCase();
    const period = String(row[1]).toLowerCase();
    return txId.includes(term) || period.includes(term);
  });

  const totalPages = Math.ceil(filteredPreview.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = filteredPreview.slice(startIndex, startIndex + pageSize);

  // Generate & download CSV from preview
  const handleDownloadCSV = () => {
    const headers = ['transaction_id', 'period_t', 'raw_score', 'calibrated_score', 'label_actual'];
    const csvContent = [
      headers.join(','),
      ...company.preview.map((row) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cong_ty_${company.code}_${company.model.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Quay lại</span>
        </button>
      </div>

      {/* Company Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-2xl shadow-sm">
              {company.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {company.name}
                </h2>
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  giả định
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
                {company.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Mô hình đang dùng</span>
            <span className="px-3.5 py-1 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-mono">
              {company.model}
            </span>
          </div>
        </div>

        {/* Data Source Notice (Specific requirement) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-center gap-3">
          <Info className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <strong>Nguồn dữ liệu:</strong> bộ Elliptic (giao dịch Bitcoin, công khai) · <strong>Mô hình:</strong> {company.model} · Công ty là giả định, mọi con số là kết quả thật của mô hình trong bài báo.
          </div>
        </div>
      </div>

      {/* Dataset Description & Table Preview */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Dữ liệu công ty gửi sang</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bảng điểm số và nhãn điều tra được trích xuất từ môi trường giám sát thực tế
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Tải dữ liệu (CSV, bản trích 304 dòng)</span>
            </button>
          </div>
        </div>

        {/* Column Glossary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
          <div className="space-y-1">
            <span className="font-mono font-bold text-slate-800">transaction_id</span>
            <p className="text-slate-500">Mã giao dịch Bitcoin duy nhất</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono font-bold text-slate-800">period_t</span>
            <p className="text-slate-500">Kỳ thời gian (t31–49, mỗi kỳ ~2 tuần)</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono font-bold text-indigo-700">raw_score</span>
            <p className="text-slate-500">Điểm thô của mô hình, dùng tính AP</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono font-bold text-violet-700">calibrated_score</span>
            <p className="text-slate-500">Điểm đã hiệu chỉnh 0–1, dùng cho PSI & ECE</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono font-bold text-slate-800">label_actual</span>
            <p className="text-slate-500">1 = rửa tiền, 0 = sạch, trống = chưa điều tra</p>
          </div>
        </div>

        {/* Dataset Summary Stats */}
        <div className="flex items-center gap-6 py-2 px-4 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
          <div>
            <span className="text-slate-500">Tổng số dòng dữ liệu:</span>{' '}
            <strong className="text-slate-900 font-mono text-sm">{company.n_rows.toLocaleString('vi-VN')}</strong> giao dịch
          </div>
          <div className="h-4 w-px bg-indigo-200" />
          <div>
            <span className="text-slate-500">Tổng số vụ rửa tiền có nhãn:</span>{' '}
            <strong className="text-rose-700 font-mono text-sm">{company.n_pos.toLocaleString('vi-VN')}</strong> vụ ({formatNum((company.n_pos / company.n_rows) * 100, 2)}%)
          </div>
          <div className="h-4 w-px bg-indigo-200 hidden sm:block" />
          <div className="text-slate-400 italic hidden sm:block">
            *Bản trích xem trước 304 dòng (16 dòng mỗi kỳ t31–49)
          </div>
        </div>

        {/* Search & Pagination Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Lọc mã giao dịch hoặc kỳ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>
              Trang {currentPage} / {totalPages} (tổng {filteredPreview.length} dòng)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Preview Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 font-mono">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">transaction_id</th>
                <th className="py-2.5 px-3">period_t</th>
                <th className="py-2.5 px-3 text-right">raw_score</th>
                <th className="py-2.5 px-3 text-right">calibrated_score</th>
                <th className="py-2.5 px-3 text-center">label_actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {currentRows.map((row, idx) => {
                const globalIndex = startIndex + idx + 1;
                const label = row[4];
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-slate-400 text-2xs">{globalIndex}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{row[0]}</td>
                    <td className="py-2 px-3 text-slate-600">t={row[1]}</td>
                    <td className="py-2 px-3 text-right text-indigo-700">
                      {formatNum(Number(row[2]), 4)}
                    </td>
                    <td className="py-2 px-3 text-right text-violet-700">
                      {formatNum(Number(row[3]), 4)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {label === 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
                          1 (Rửa tiền)
                        </span>
                      ) : label === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 text-emerald-700">
                          0 (Sạch)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-2xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-2xs text-slate-400 italic text-right">
          Bản đầy đủ do nhóm nghiên cứu cung cấp.
        </p>
      </div>

      {/* Bottom Start Action Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={onStartTesting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Bắt đầu kiểm thử</span>
        </button>
      </div>
    </div>
  );
};
