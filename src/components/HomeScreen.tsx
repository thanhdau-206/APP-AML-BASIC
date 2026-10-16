import React from 'react';
import { Company } from '../data/du_lieu_app.ts';
import { formatInt } from '../utils/metrics.ts';

interface HomeScreenProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onGoToUpload: () => void;
  onDownloadSampleCSV?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  companies,
  onSelectCompany,
  onGoToUpload,
  onDownloadSampleCSV
}) => {
  const downloadSampleCSV = () => {
    if (onDownloadSampleCSV) {
      onDownloadSampleCSV();
      return;
    }
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

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex-1 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Chọn đối tượng kiểm thử
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Đánh giá mức độ suy giảm hiệu năng theo thời gian của mô hình AML trên bộ dữ liệu Bitcoin Elliptic (49 kỳ).
        </p>
      </div>

      {/* Grid 8 Thẻ Công Ty + Thẻ Thứ 9 Upload (Phong cách Đen Trắng) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((c) => (
          <div
            key={c.code}
            onClick={() => onSelectCompany(c)}
            className="bg-white dark:bg-[#15171B] p-5 rounded-3xl shadow-card border border-zinc-200/90 dark:border-zinc-800/90 hover:border-black dark:hover:border-zinc-400 hover:-translate-y-1 transition duration-200 cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white font-black text-xl flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition">
                {c.code}
              </div>
              <span className="text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                Mô hình: {c.model}
              </span>
            </div>

            <div className="my-4 space-y-1.5">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white group-hover:underline transition">
                {c.name} <span className="text-xs font-normal text-zinc-400">(giả định)</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {c.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span>Quy mô: {formatInt(c.n_rows)} GD</span>
              <span className="text-black dark:text-white font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                Chi tiết ➔
              </span>
            </div>
          </div>
        ))}

        {/* Thẻ Thứ 9: Tải lên bộ dữ liệu (Đen trắng tối giản) */}
        <div className="bg-zinc-50 dark:bg-[#121316] p-5 rounded-3xl shadow-card border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white transition duration-200 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-2xl flex items-center justify-center shadow-md">
              📤
            </div>
            <span className="text-[11px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1 rounded-full">
              Tùy biến
            </span>
          </div>

          <div className="my-4 space-y-1.5">
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-white">
              Tải lên bộ dữ liệu của bạn
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Tải lên file CSV chứa điểm số và nhãn điều tra để kiểm thử suy giảm mô hình AML trực tiếp trong trình duyệt.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onGoToUpload}
              className="w-full py-2.5 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs rounded-xl shadow-sm transition"
            >
              Chuyển sang màn hình Tải lên
            </button>
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="w-full text-center text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium py-1"
            >
              📥 Tải xuống file CSV mẫu (file_mau.csv)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
