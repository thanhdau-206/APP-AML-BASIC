import React from 'react';
import { ThresholdConfig, formatPercent, formatNum } from '../utils/metrics.ts';

export type ScreenState = 'home' | 'company_detail' | 'testing' | 'upload';

interface SidebarProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenThresholds: () => void;
  thresholds: ThresholdConfig;
  currentCompanyName?: string;
  hasSelectedCompany: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isDarkMode,
  onToggleTheme,
  onOpenThresholds,
  thresholds,
  currentCompanyName,
  hasSelectedCompany
}) => {
  return (
    <aside className="w-20 shrink-0 h-screen sticky top-0 bg-[#FFFDF9]/90 dark:bg-[#231D1A]/90 backdrop-blur-md border-r border-[#EFE2D4] dark:border-[#382E28] flex flex-col items-center justify-between py-6 z-50 select-none shadow-[4px_0_24px_rgba(184,153,136,0.1)]">
      {/* Top: Logo & Navigation Icons */}
      <div className="flex flex-col items-center space-y-7">
        {/* Logo Vector AML Squircle (Tactile Clay Disc) */}
        <div
          onClick={() => onNavigate('home')}
          className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-[#E69686] to-[#F6BEB0] text-white flex items-center justify-center shadow-[0_8px_18px_rgba(230,150,134,0.38),inset_0_2px_3px_rgba(255,255,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Trạm kiểm thử suy giảm mô hình AML"
        >
          <svg
            className="w-6 h-6 transition-transform duration-200 group-hover:scale-110 drop-shadow-xs"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="2.5" fill="currentColor" />
            <path d="M12 7v1.5M12 13.5V15M8.5 11H7M17 11h-1.5" />
          </svg>
        </div>

        {/* Cột biểu tượng điều hướng */}
        <nav className="flex flex-col items-center space-y-3.5">
          {/* 1. Trang chủ */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                currentScreen === 'home'
                  ? 'bg-gradient-to-tr from-[#8BAFD4] to-[#B8D3EC] text-white shadow-[0_6px_16px_rgba(139,175,212,0.45),inset_0_2px_3px_rgba(255,255,255,0.7)] scale-105'
                  : 'text-[#8D8075] hover:text-[#38312C] dark:text-[#A89A90] dark:hover:text-white hover:bg-[#F5ECE0] dark:hover:bg-[#322A25]'
              }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-[#FFFDF9] dark:bg-[#2B231F] text-[#38312C] dark:text-[#F5EFE8] text-xs font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-[#EFE2D4] dark:border-[#443831] whitespace-nowrap">
                Trang chủ
              </div>
            </div>
          </div>

          {/* 2. Thông tin công ty */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                if (hasSelectedCompany) onNavigate('company_detail');
              }}
              className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                currentScreen === 'company_detail'
                  ? 'bg-gradient-to-tr from-[#8BAFD4] to-[#B8D3EC] text-white shadow-[0_6px_16px_rgba(139,175,212,0.45),inset_0_2px_3px_rgba(255,255,255,0.7)] scale-105'
                  : 'text-[#8D8075] hover:text-[#38312C] dark:text-[#A89A90] dark:hover:text-white hover:bg-[#F5ECE0] dark:hover:bg-[#322A25]'
              }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
              </svg>
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-[#FFFDF9] dark:bg-[#2B231F] text-[#38312C] dark:text-[#F5EFE8] text-xs font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-[#EFE2D4] dark:border-[#443831] whitespace-nowrap">
                Thông tin công ty ({currentCompanyName || 'Chưa chọn'})
              </div>
            </div>
          </div>

          {/* 3. Kiểm thử */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                if (hasSelectedCompany) onNavigate('testing');
              }}
              className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                currentScreen === 'testing'
                  ? 'bg-gradient-to-tr from-[#8BAFD4] to-[#B8D3EC] text-white shadow-[0_6px_16px_rgba(139,175,212,0.45),inset_0_2px_3px_rgba(255,255,255,0.7)] scale-105'
                  : 'text-[#8D8075] hover:text-[#38312C] dark:text-[#A89A90] dark:hover:text-white hover:bg-[#F5ECE0] dark:hover:bg-[#322A25]'
              }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                <path d="M8.5 2h7" />
                <path d="M7 16h10" />
              </svg>
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-[#FFFDF9] dark:bg-[#2B231F] text-[#38312C] dark:text-[#F5EFE8] text-xs font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-[#EFE2D4] dark:border-[#443831] whitespace-nowrap">
                Kiểm thử suy giảm AML
              </div>
            </div>
          </div>

          {/* 4. Tải lên dữ liệu */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                currentScreen === 'upload'
                  ? 'bg-gradient-to-tr from-[#8BAFD4] to-[#B8D3EC] text-white shadow-[0_6px_16px_rgba(139,175,212,0.45),inset_0_2px_3px_rgba(255,255,255,0.7)] scale-105'
                  : 'text-[#8D8075] hover:text-[#38312C] dark:text-[#A89A90] dark:hover:text-white hover:bg-[#F5ECE0] dark:hover:bg-[#322A25]'
              }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m16 16-4-4-4 4" />
              </svg>
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-[#FFFDF9] dark:bg-[#2B231F] text-[#38312C] dark:text-[#F5EFE8] text-xs font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-[#EFE2D4] dark:border-[#443831] whitespace-nowrap">
                Tải lên bộ dữ liệu CSV
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom: Settings + Dark/Light Theme Icons */}
      <div className="flex flex-col items-center space-y-3.5">
        {/* Cấu hình ngưỡng */}
        <div className="relative group">
          <button
            type="button"
            onClick={onOpenThresholds}
            className="w-11 h-11 rounded-[18px] flex items-center justify-center text-[#8D8075] hover:text-[#38312C] dark:text-[#A89A90] dark:hover:text-white hover:bg-[#F5ECE0] dark:hover:bg-[#322A25] transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-[#FFFDF9] dark:bg-[#2B231F] text-[#38312C] dark:text-[#F5EFE8] text-xs font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-[#EFE2D4] dark:border-[#443831] whitespace-nowrap">
              Cấu hình ngưỡng ({formatPercent(thresholds.warn_ratio, 0)} / {formatPercent(thresholds.alert_ratio, 0)} / {formatNum(thresholds.psi_alert, 2)})
            </div>
          </div>
        </div>

        {/* Theme Toggle (Sáng / Tối) */}
        <div className="relative group">
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-11 h-11 rounded-[18px] flex items-center justify-center text-[#8D8075] hover:text-[#38312C] dark:text-[#A89A90] dark:hover:text-white hover:bg-[#F5ECE0] dark:hover:bg-[#322A25] transition-all duration-200 cursor-pointer"
          >
            {isDarkMode ? (
              <svg
                className="w-5 h-5 text-[#F6BEB0]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-[#635850]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-[#FFFDF9] dark:bg-[#2B231F] text-[#38312C] dark:text-[#F5EFE8] text-xs font-bold px-3 py-1.5 rounded-2xl shadow-xl border border-[#EFE2D4] dark:border-[#443831] whitespace-nowrap">
              {isDarkMode ? 'Đổi sang Nền Sáng Pastel' : 'Đổi sang Nền Tối Mịn'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
