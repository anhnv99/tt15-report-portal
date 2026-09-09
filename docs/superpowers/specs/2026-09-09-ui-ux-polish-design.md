# Thiết Kế Chi Tiết: Rà Soát Toàn Diện Giao Diện & Tối Ưu Trải Nghiệm Người Dùng (UI/UX Polish)

## 1. Bối Cảnh & Mục Tiêu
- **Bối cảnh**: Hệ thống báo cáo tín dụng CIC (TT15 RegOne) đã hoàn thiện 5 luồng nghiệp vụ lõi (Cấu hình mẫu, Nạp & Đồng bộ BI Staging, Tổng hợp & Kiểm tra rules, Phê duyệt báo cáo 1-click trên Dashboard, và Truyền nhận CIC). Ngày mai hệ thống sẽ được trình chiếu demo trực tiếp trước ban lãnh đạo và hội đồng nghiệm thu.
- **Mục tiêu**:
  1. **Triệt tiêu 100% cảnh báo và lỗi console** (F12 DevTools sạch sẽ, đạt chuẩn production-ready).
  2. **Tối ưu trạng thái tải (Loading state)** và chống double-click trên tất cả các nút hành động đột biến dữ liệu.
  3. **Đảm bảo bố cục hiển thị hoàn hảo trên màn hình laptop và máy chiếu hội trường** (độ phân giải 1366x768 và 1920x1080), không bị tràn viền, vỡ bảng hoặc gãy dòng bất thường.
  4. **Nâng cấp Empty State & Thông báo lỗi/thành công** rõ ràng, thân thiện, mang tính định hướng người dùng.

---

## 2. Chi Tiết Các Hạng Mục Thiết Kế

### Hạng Mục 1: Bọc `<App>` Component & Chuẩn Hóa Props Ant Design v5
- **Vấn đề**: Ant Design v5 yêu cầu bọc component `<App>` bên trong `<ConfigProvider>` để các hàm tiện ích tĩnh như `message.success()`, `modal.confirm()`, `notification.open()` tiêu thụ đúng context theme và không in cảnh báo `Static function can not consume context`. Ngoài ra có một số props cũ từ v4 đã deprecated (`bodyStyle`, `valueStyle`, `direction="vertical"`, `destroyOnClose`, `rowKey(record, index)`).
- **Giải pháp**:
  - Trong `App.tsx`: Bọc component `<App>` của `antd` xung quanh các Route.
  - Chuẩn hóa `bodyStyle` thành `styles={{ body: ... }}` trên 9 `Card` components.
  - Chuẩn hóa `valueStyle` thành `styles={{ content: ... }}` trên các `Statistic` tại `DashboardKpiCards.tsx`.
  - Chuẩn hóa `destroyOnClose` thành `destroyOnHidden` tại `CreateTemplateModal.tsx`.
  - Chuẩn hóa `rowKey={(r, idx) => ...}` tại `StagedDataDrawer.tsx` và `TempoStagingTab.tsx` thành hàm trả về định danh duy nhất của bản ghi (`r.pk_id || r.id || r.tableName || r._index`), loại bỏ tham số `idx` gây cảnh báo.

### Hạng Mục 2: Loading States & Chống Double-Click Trên Toàn Bộ Nút Bấm
- **Vấn đề**: Người dùng khi demo có thể bấm đúp vào các nút gọi API nặng (như Đồng bộ BI, Tổng hợp báo cáo tự động, Ký duyệt, Gửi CIC) khiến backend nhận nhiều yêu cầu song song.
- **Giải pháp**:
  - Gán cờ `loading={isSubmitting}` và `disabled={isSubmitting}` vào các nút hành động chính:
    - **Dashboard**: Nút `[Ký Duyệt]` trên bảng Báo cáo nháp.
    - **ImportsPage**: Nút `[Đồng Bộ & Duyệt Ngay (Sẵn Sàng Làm Báo Cáo)]` và nút `[Phê Duyệt Lô Dữ Liệu]`.
    - **ReportsPage**: Nút `[Khởi Chạy Tổng Hợp Tự Động]`, nút `[Phê Duyệt Phiên Bản]`, nút `[Gửi Ngay]`.
    - **TemplatesPage**: Nút `[Lưu Chỉ Tiêu]` và nút `[Lưu Quy Tắc]`.
  - Thêm visual feedback bằng icon `LoadingOutlined` khi nút đang trong trạng thái xử lý.

### Hạng Mục 3: Tối Ưu Bảng Biểu & Chống Tràn Màn Hình (Table Horizontal Scroll & Ellipsis)
- **Vấn đề**: Các bảng nhiều cột như `CicReportVersionsTable` (Danh sách phiên bản báo cáo), `ReportAggregationsTable` (Lịch sử tổng hợp), `TemplateListView` khi xem trên màn hình nhỏ hoặc máy chiếu 1366x768 có thể bị bó hẹp cột hoặc tràn sang phải.
- **Giải pháp**:
  - Bổ sung cấu hình `scroll={{ x: 'max-content' }}` (hoặc giá trị pixel tối thiểu ví dụ `1100px`) cho:
    - `CicReportVersionsTable.tsx`
    - `ReportAggregationsTab.tsx`
    - `TemplateListView.tsx`
    - `TempoStagingTab.tsx` (bảng preview dữ liệu)
  - Áp dụng `ellipsis: true` kèm `Tooltip` hiển thị đầy đủ cho các cột text dài (Mô tả, Mã lô UUID, Tên file, Ghi chú kiểm tra).

### Hạng Mục 4: Nâng Cấp Empty State & Phản Hồi Khi Mảng Rỗng
- **Vấn đề**: Khi người dùng lọc một kỳ dữ liệu mới chưa có báo cáo hoặc chưa có lô import, bảng trống trơn có thể tạo cảm giác trang bị đơ hoặc lỗi.
- **Giải pháp**:
  - Tích hợp component `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="..." />` với lời giải thích rõ ràng và nút bấm gợi ý thao tác tiếp theo (ví dụ: "Chưa có lô dữ liệu cho kỳ này - [Đồng Bộ Ngay]").

---

## 3. Kế Hoạch Xác Minh (Verification Plan)
1. **Automated Console & Network Check**:
   - Dùng script Chrome Headless tự động duyệt qua tất cả 5 màn hình chính.
   - Bắt toàn bộ sự kiện `console.error` và `console.warn` để kiểm chứng console đạt độ sạch 100%.
2. **Responsive Screen Captures**:
   - Chụp ảnh màn hình ở độ phân giải máy chiếu `1366x768` và màn hình `1920x1080` để kiểm tra trực quan không có hiện tượng vỡ khung, tràn viền hoặc co chữ.
3. **Commit & Deploy**:
   - Build TypeScript (`npm run build`) kiểm tra không có lỗi biên dịch.
   - Push lên GitHub để Vercel cập nhật bản mới nhất.
