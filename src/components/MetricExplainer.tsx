import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle, HelpCircle } from 'lucide-react';

export const MetricExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/70 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800">
            📘 Chú thích các chỉ số &amp; Cơ chế giám sát
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>{isOpen ? 'Thu gọn' : 'Mở rộng hướng dẫn chi tiết'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 space-y-6">
          {/* PSI */}
          <div className="pt-0 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              PSI (Population Stability Index) là gì?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Đo mức độ thay đổi hình dạng phân bố điểm số của kỳ hiện tại so với lúc mô hình còn khỏe (mốc tham chiếu t31–34).
              Chia thang điểm 0–1 thành 10 ô bằng nhau, lấy tỉ lệ giao dịch rơi vào mỗi ô:
            </p>
            <div className="p-3 bg-slate-50 rounded-lg font-mono text-xs text-slate-800 border border-slate-200">
              PSI = tổng (tỉ lệ mới − tỉ lệ cũ) × ln(tỉ lệ mới / tỉ lệ cũ)
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Ưu điểm lớn nhất:</strong> Không cần chờ kết quả điều tra có nhãn, biết ngay trong kỳ khi giao dịch vừa được chấm điểm.
              Khi <strong>PSI &gt; 0,25</strong>, phân bố điểm đã lệch đáng kể so với thời kỳ tham chiếu. Tính trên <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">calibrated_score</code>.
            </p>
          </div>

          {/* AP */}
          <div className="pt-5 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              AP (Average Precision) là gì?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Đo lường năng lực phân loại: mô hình còn xếp đúng kẻ gian (rửa tiền) lên đầu danh sách cảnh báo hay không.
              Tính trên <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">raw_score</code> vì AP chỉ quan tâm đến thứ hạng; kỹ thuật hiệu chỉnh đơn điệu (isotonic) gộp nhiều điểm số về cùng một giá trị làm phẳng thứ hạng cục bộ.
            </p>
            <p className="text-slate-600 leading-relaxed">
              So với mức AP lúc khỏe: dưới <strong>70%</strong> là <em>cần chú ý</em>, dưới <strong>50%</strong> là <em>báo động sụp đổ</em>.
              AP bắt buộc phải chờ nhãn điều tra thực tế và cần ít nhất <strong>10 vụ rửa tiền</strong> có nhãn trong kỳ mới đủ độ tin cậy để chấm điểm.
            </p>
          </div>

          {/* ECE */}
          <div className="pt-5 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              ECE (Expected Calibration Error) là gì?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Đo độ tin cậy của xác suất: điểm số 0,8 có thật sự nghĩa là giao dịch có khoảng 80% xác suất rửa tiền hay không.
              Chia 10 ô theo điểm số dự báo, tính chênh lệch trung bình giữa điểm dự báo trung bình và tỉ lệ gian lận thực tế trong từng ô.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Khi <strong>ECE &gt; 0,10</strong>, độ tin cậy của điểm số bị suy giảm nghiêm trọng, chuyên viên tuân thủ không thể căn cứ trực tiếp vào độ lớn xác suất để ước lượng rủi ro. Tính trên <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">calibrated_score</code>.
            </p>
          </div>

          {/* Cach nhan biet */}
          <div className="pt-5 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              Cách nhận biết và phối hợp tín hiệu
            </h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>PSI là tín hiệu nhanh:</strong> Nhận diện ngay lập tức khi kết thúc kỳ mà chưa cần nhãn, nhưng có thể báo động giả do cấu trúc luồng tiền thay đổi lành tính.<br />
              <strong>AP và ECE là tín hiệu chắc:</strong> Phản ánh chính xác năng lực phát hiện tội phạm nhưng có độ trễ do cần thời gian điều tra và gán nhãn thực tế.
            </p>
          </div>

          {/* Quy tac 2 ky */}
          <div className="pt-5 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Quy tắc 2 kỳ liên tiếp đối với PSI
            </h4>
            <p className="text-slate-600 leading-relaxed">
              PSI vượt ngưỡng 1 kỳ đơn lẻ chỉ được xếp vào diện <em>"Cần chú ý"</em>; chỉ khi vượt ngưỡng 2 kỳ liền nhau mới kích hoạt <em>"Báo động"</em>.
            </p>
            <p className="text-slate-600 leading-relaxed bg-amber-50/70 p-3 rounded-lg border border-amber-200">
              <strong>Bằng chứng thực nghiệm từ dữ liệu:</strong> Ở kỳ t=36, PSI của XGBoost, LightGBM và Random Forest đều vượt mạnh 0,25 (đạt 0,30–0,39) do thị trường có biến động ngắn hạn, nhưng AP thực tế vẫn đạt xấp xỉ 100% mức khỏe. Đến kỳ t=37, PSI tự hạ về mức an toàn mà mô hình không hề hỏng. Quy tắc 2 kỳ giúp triệt tiêu các báo động giả này.
            </p>
          </div>

          {/* Truong hop dac biet */}
          <div className="pt-5 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-800" />
              5 Trường hợp đặc biệt phát hiện trong nghiên cứu
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700 block mb-1">1. PSI báo động giả ở t=36</span>
                Thấy rõ ở công ty A (XGBoost), B (LightGBM), C (Random Forest): PSI &gt; 0,30 nhưng AP vẫn đạt 0,95–0,99, kỳ sau tự bình ổn.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-rose-700 block mb-1">2. PSI im lặng dù mô hình hỏng</span>
                Logistic Regression (công ty H) tại t=36 có PSI chỉ 0,09 (rất đẹp) nhưng AP đã sụp xuống còn 26% mức khỏe. Do đó, PSI bình thường chưa đồng nghĩa mô hình đang ổn!
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-amber-700 block mb-1">3. PSI chậm một nhịp</span>
                MLP (công ty G) tại t=43 có PSI là 0,23 (chưa chạm ngưỡng 0,25) trong khi năng lực xếp hạng AP đã hoàn toàn sụp đổ (dưới 5% mức khỏe).
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">4. Kỳ quá ít nhãn điều tra</span>
                Kỳ t45 chỉ có 5 vụ và t46 chỉ có 2 vụ rửa tiền có nhãn trên đồ thị. Tính AP trên mẫu này sẽ sai số ngẫu nhiên rất lớn, bắt buộc phải ghi "Chưa đủ nhãn" và tạm dựa vào PSI.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                <span className="font-bold text-blue-700 block mb-1">5. Tác động của tỉ lệ nền (Base Rate Shift)</span>
                Tỉ lệ rửa tiền tự nhiên tụt từ 17% (giai đoạn tham chiếu t31–34) xuống chỉ 1,75% (ở t43) kéo AP toán học đi xuống theo. Việc dùng ngưỡng AP theo % mức khỏe giúp trung hòa một phần biến động tỉ lệ nền này.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
