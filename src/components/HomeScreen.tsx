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
    <main className="max-w-7xl mx-auto px-6 py-8 flex-1 space-y-8">
      {/* Organic Wavy Pastel Hero Banner (Sooti Art Aesthetic) */}
      <div className="relative overflow-hidden rounded-[32px] clay-card p-8 sm:p-10 border border-[#EFE4D6] dark:border-[#38302A]">
        {/* Soft Decorative Vector Wavy Blobs in Background */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#F6BEB0]/40 to-[#E69686]/25 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-gradient-to-tr from-[#B8D3EC]/35 to-[#8BAFD4]/20 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-[#EFE4D6]/40 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EE] dark:bg-[#2A2320] border border-[#EADBCC] dark:border-[#443832] clay-pill text-xs font-bold text-[#E69686] dark:text-[#F6BEB0]">
              <span className="w-2 h-2 rounded-full bg-[#E69686] animate-pulse" />
              <span>SÂN GA THỬ NGHIỆM MÔ HÌNH AML · PHONG CÁCH TÁC PHẨM ĐẤT SÉT SOOTI</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#38312C] dark:text-[#FAF6F0] leading-tight">
              Chọn tổ chức kiểm thử suy giảm
            </h2>

            <p className="text-sm text-[#635850] dark:text-[#CBBDB2] leading-relaxed">
              Theo dõi và chẩn đoán mức độ trôi dạt (drift) phân phối dữ liệu và sụt giảm độ chính xác theo thời gian thực của 8 mô hình AML trên bộ dữ liệu 49 kỳ Bitcoin Elliptic.
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#FAF5EE]/90 dark:bg-[#2A2320]/90 px-4 py-2.5 rounded-2xl border border-[#EADBCC] dark:border-[#443832] clay-pill">
              <span className="text-base">📊</span>
              <span className="text-xs font-bold text-[#38312C] dark:text-[#FAF6F0]">
                8 Công ty · 15 Kỳ thử
              </span>
            </div>
            <button
              type="button"
              onClick={onGoToUpload}
              className="clay-btn bg-gradient-to-r from-[#8BAFD4] to-[#668FB7] hover:from-[#9BBDE0] hover:to-[#739BC3] text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/40 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>📤</span>
              <span>Tải dữ liệu của bạn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid 8 Thẻ Công Ty + Thẻ Thứ 9 Upload (Phong cách Claymorphic Soft 3D Pastel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((c, idx) => {
          const isWarm = idx % 2 === 0;
          return (
            <div
              key={c.code}
              onClick={() => onSelectCompany(c)}
              className="clay-card p-6 rounded-[28px] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle top-right accent badge */}
              <div className="flex items-start justify-between">
                {/* 3D Convex Letter Disc */}
                <div
                  className={`w-14 h-14 rounded-2xl ${
                    isWarm
                      ? 'bg-gradient-to-br from-[#F6BEB0] via-[#E69686] to-[#D88170] text-white'
                      : 'bg-gradient-to-br from-[#B8D3EC] via-[#8BAFD4] to-[#668FB7] text-white'
                  } font-black text-2xl flex items-center justify-center clay-disc shadow-md transform group-hover:scale-105 transition-transform duration-200 border border-white/40`}
                >
                  {c.code}
                </div>

                <span className="text-[11px] font-bold bg-[#FAF5EE] dark:bg-[#2A2320] text-[#635850] dark:text-[#CBBDB2] px-3.5 py-1 rounded-full border border-[#EADBCC] dark:border-[#443832] clay-pill">
                  {c.model}
                </span>
              </div>

              <div className="my-5 space-y-2">
                <h3 className="text-lg font-black text-[#38312C] dark:text-[#FAF6F0] group-hover:text-[#E69686] dark:group-hover:text-[#F6BEB0] transition-colors">
                  {c.name}{' '}
                  <span className="text-xs font-normal text-[#94867C] dark:text-[#8C7E74]">(giả định)</span>
                </h3>
                <p className="text-xs text-[#635850] dark:text-[#CBBDB2] leading-relaxed line-clamp-2">
                  {c.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#EFE4D6] dark:border-[#38302A] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#8C7E74] dark:text-[#A8988C] bg-[#FAF5EE] dark:bg-[#2A2320] px-2.5 py-1 rounded-xl border border-[#EADBCC]/60 dark:border-[#443832]/60">
                  {formatInt(c.n_rows)} GD
                </span>
                <span className="font-bold text-[#E69686] dark:text-[#F6BEB0] group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1">
                  Xem chi tiết ➔
                </span>
              </div>
            </div>
          );
        })}

        {/* Thẻ Thứ 9: Tải lên bộ dữ liệu (Clay Pod Tùy Biến) */}
        <div className="clay-card p-6 rounded-[28px] border-2 border-dashed border-[#E69686]/60 dark:border-[#D88170]/60 hover:border-[#E69686] transition-all duration-300 flex flex-col justify-between bg-gradient-to-b from-[#FFFDF9] to-[#FAF4EB] dark:from-[#231D1A] dark:to-[#1F1917]">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F6BEB0] to-[#E69686] text-white font-extrabold text-2xl flex items-center justify-center clay-disc shadow-md border border-white/40">
              📤
            </div>
            <span className="text-[11px] font-bold bg-[#FDEEEA] dark:bg-[#3D2520] text-[#D88170] dark:text-[#F6BEB0] px-3.5 py-1 rounded-full border border-[#F6BEB0]/60 dark:border-[#5C322B] clay-pill">
              Tùy biến
            </span>
          </div>

          <div className="my-5 space-y-2">
            <h3 className="text-lg font-black text-[#38312C] dark:text-[#FAF6F0]">
              Tải lên dữ liệu của bạn
            </h3>
            <p className="text-xs text-[#635850] dark:text-[#CBBDB2] leading-relaxed">
              Tải lên file CSV chứa điểm số và nhãn điều tra để kiểm thử suy giảm mô hình AML trực tiếp bằng thuật toán phía máy khách.
            </p>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-[#EFE4D6] dark:border-[#38302A]">
            <button
              type="button"
              onClick={onGoToUpload}
              className="w-full py-2.5 clay-btn bg-gradient-to-r from-[#E69686] to-[#D88170] hover:from-[#ED9E8E] hover:to-[#DE8776] text-white font-bold text-xs rounded-2xl shadow-md border border-white/40 transition cursor-pointer"
            >
              Chuyển sang màn hình Tải lên
            </button>
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="w-full text-center text-xs text-[#8C7E74] dark:text-[#A8988C] hover:text-[#38312C] dark:hover:text-[#FAF6F0] font-semibold py-1 transition cursor-pointer"
            >
              📥 Tải xuống file CSV mẫu (file_mau.csv)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

