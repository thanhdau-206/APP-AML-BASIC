@echo off
chcp 65001 >nul
title TRẠM KIỂM THỬ SUY GIẢM MÔ HÌNH AML
color 0B

echo ==============================================================================
echo    🛡️ TRẠM KIỂM THỬ SUY GIẢM MÔ HÌNH AML (AML MODEL DRIFT TESTING PLATFORM)
echo    Giao diện: Claymorphic Soft 3D Pastel UI
echo ==============================================================================
echo.

cd /d "%~dp0"

:: Kiểm tra cài đặt Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [LỖI] Máy tính của bạn chưa cài đặt Node.js!
    echo Vui lòng tải và cài đặt Node.js tại: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Kiểm tra node_modules
if not exist "node_modules\" (
    echo [1/3] Chưa phát hiện thư mục node_modules.
    echo       Đang tự động cài đặt thư viện cần thiết (npm install)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [LỖI] Cài đặt thư viện thất bại! Vui lòng kiểm tra lại mạng.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Thư viện dependencies: Đã sẵn sàng.
)

echo.
echo [2/3] Đang khởi động trình duyệt truy cập ứng dụng...
start "" "http://localhost:3000"

echo.
echo [3/3] Đang chạy máy chủ Vite tại cổng 3000 (http://localhost:3000)...
echo ==============================================================================
echo    * Giữ cửa sổ này mở trong khi sử dụng ứng dụng.
echo    * Để tắt ứng dụng: Nhấn phím Ctrl + C hoặc đóng cửa sổ này.
echo ==============================================================================
echo.

call npm run dev

pause
