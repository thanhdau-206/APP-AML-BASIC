import React from 'react';
import { Company } from '../data/du_lieu_app.ts';
import { UploadCloud, FileSpreadsheet, ArrowRight, Database, Bot, Cpu } from 'lucide-react';

interface HomeScreenProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onGoToUpload: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  companies,
  onSelectCompany,
  onGoToUpload
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title & Introduction */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bot className="w-3.5 h-3.5" />
          <span>Kiểm định độ bền vững mô hình AML theo thời gian</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Chọn đối tượng kiểm thử
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Đánh giá xem điểm số mô hình của các đơn vị tài chính crypto có đang bị suy thoái hiệu năng do trôi dạt dữ liệu (data drift & concept drift) trên chuỗi Bitcoin hay không.
        </p>
      </div>

      {/* Grid of 8 Companies + 9th Upload Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => {
          return (
            <div
              key={company.code}
              onClick={() => onSelectCompany(company)}
              className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50/80 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header of card: Code badge & Model tag */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-800 flex items-center justify-center font-mono font-bold text-xl transition-colors shadow-2xs">
                    {company.code}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                    <Cpu className="w-3 h-3 text-slate-500 group-hover:text-indigo-500" />
                    <span>{company.model}</span>
                  </span>
                </div>

                {/* Company Name & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <span>{company.name}</span>
                    <span className="text-xs font-normal text-slate-400">(giả định)</span>
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {company.desc}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-2xs text-slate-400">
                  Mô hình: <strong className="text-slate-700 font-semibold">{company.model}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}

        {/* 9th Card: Upload User Dataset (Different Style) */}
        <div className="relative rounded-2xl p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 border-2 border-indigo-500/40 hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-800/80 text-indigo-200 border border-indigo-700/60 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-indigo-300" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-2xs font-semibold bg-indigo-800/90 text-indigo-200 border border-indigo-600/50">
                Tự kiểm thử
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Tải lên bộ dữ liệu của bạn
              </h3>
              <p className="mt-1.5 text-xs text-indigo-200/90 leading-relaxed">
                Gửi bảng điểm số dự báo từ mô hình của bạn để kiểm thử suy giảm AP, ECE và đo độ lệch phân bố PSI trực tiếp trong trình duyệt.
              </p>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-indigo-800/60 space-y-3">
            <button
              onClick={onGoToUpload}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <span>Tải lên dữ liệu ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-center">
              <a
                href="/file_mau.csv"
                download="file_mau.csv"
                className="inline-flex items-center gap-1.5 text-2xs font-medium text-indigo-300 hover:text-white underline decoration-indigo-400/50 underline-offset-2 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Tải xuống file CSV mẫu</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
