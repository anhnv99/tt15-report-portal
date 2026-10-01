# P2: giảm tải JavaScript ban đầu

Ngày kiểm tra: 01/10/2026. Sửa P2 bundle lớn được ghi trong rà soát D31 ngày 30/09.

## Thay đổi

- Bảy trang dùng React.lazy và dynamic import; Suspense đặt trong vùng nội dung của MainLayout, menu vẫn hiển thị khi tải trang.
- Thư viện xlsx chỉ import khi đọc/xuất Excel, không nạp lúc mở dashboard hoặc chuyển trang.
- Modal điều chỉnh báo cáo chỉ import khi mở.
- Tách React/ReactDOM/scheduler thành chunk dùng chung bằng codeSplitting của Rolldown; không nâng ngưỡng cảnh báo.

## Số đo build

| Chỉ số | Trước | Sau |
|---|---:|---:|
| JS entry và modulepreload trong index.html | 1.96 MB | 780,920 bytes |
| Gzip của các tệp bootstrap | khoảng 614 KB | 256,491 bytes |
| Chunk lớn nhất | 1.96 MB | 423,995 bytes |
| Cảnh báo chunk >500 KB | Có | Không |

Bootstrap giảm khoảng 60% dung lượng thô. Số bootstrap chỉ tính các script/modulepreload trong HTML; trang đang mở còn tải chunk trang và các phụ thuộc cần thiết. Đây không phải số byte tổng của toàn bộ app hoặc phép đo thời gian/API dashboard. Các tệp lazy vẫn cần tải khi người dùng sử dụng chức năng.

## Kiểm tra

`npm run typecheck` và `npm run build` đạt. Smoke trên production preview với Chrome headless chuyển client-side qua dashboard, reports, imports, catalog, templates, workflows và settings: không có pageerror hoặc chunk HTTP lỗi. Excel và modal điều chỉnh chưa tải ở dashboard; Excel chưa tải sau khi chuyển cả 7 trang. Gọi handler tải mẫu D31 thực tế: tải được workbook mở được với đủ 7 sheet; xlsx chunk mới được nạp khi tải file.

Smoke này kiểm tra frontend và tải mẫu, không chứng nhận nội dung API, luồng duyệt hoặc logic báo cáo. Modal điều chỉnh được kiểm tra deferred loading ở dashboard; chưa chạy lại toàn bộ luồng điều chỉnh dữ liệu trong smoke.

Chạy lại sau build:

```powershell
npm run preview -- --host 127.0.0.1 --port 4173
# Trong terminal khác:
npm run smoke:lazy
```

Cần Chrome cục bộ; có thể đặt CHROME_PATH và SMOKE_BASE_URL. Script dùng puppeteer-core có sẵn, không điều khiển phiên Chrome của người dùng, tải fixture vào thư mục temp riêng rồi dọn lại.
