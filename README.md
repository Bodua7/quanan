# Quán Ăn - Gọi Món & Quản Lý (PWA)

App gọi món qua QR + quản lý quán ăn, chạy hoàn toàn tĩnh (frontend) và dùng
Google Apps Script + Google Sheets làm backend/database miễn phí.

Đã cấu hình sẵn với backend Apps Script của bạn:
`https://script.google.com/macros/s/AKfycbzsCEgrjPZM6q0OuxRniFuDCf5sywvs-CfJBy_A3bll9_zCKk-17k35BRH2LSPudl54JA/exec`

## Cấu trúc thư mục
```
index.html      - toàn bộ giao diện + logic app
manifest.json   - khai báo PWA (tên, icon, màu)
sw.js           - service worker để cài đặt & dùng offline
icons/          - icon 192x192 và 512x512
```

## Đưa lên GitHub Pages (miễn phí, có HTTPS - bắt buộc để cài PWA)

1. Tạo repo mới trên GitHub, ví dụ `quanan-app` (Public).
2. Upload toàn bộ nội dung thư mục này lên **nhánh gốc** của repo
   (kéo-thả trên GitHub web, hoặc dùng git):
   ```
   git init
   git add .
   git commit -m "Quan an PWA"
   git branch -M main
   git remote add origin https://github.com/<username>/quanan-app.git
   git push -u origin main
   ```
3. Vào repo → **Settings → Pages**.
4. Ở mục "Build and deployment": Source = **Deploy from a branch**,
   Branch = **main**, folder = **/ (root)** → Save.
5. Sau 1-2 phút, app sẽ chạy tại:
   `https://<username>.github.io/quanan-app/`

## Trang chào khi quét QR (mới)

Khi khách (hoặc nhân viên) quét mã QR mở app, màn hình đầu tiên hiện ra là
**trang chào thương hiệu** (logo, tên quán, địa chỉ, khẩu hiệu, nút "Xem Menu
& Gọi Món"), thay vì vào thẳng menu. Có một nút khóa 🔒 ở góc phải trên để
vào nhanh màn đăng nhập quản lý.

Tùy biến trang này: đăng nhập quản lý (PIN) → tab **⚙️ Cài đặt** → mục
**🎨 Trang chào khi quét QR**:
- Địa chỉ quán, câu khẩu hiệu (tagline)
- 3 link ảnh logo/món ăn tiêu biểu (dán link ảnh public, ví dụ upload lên
  Google Drive rồi "Share > Anyone with the link", hoặc dùng Imgur)
- Nếu để trống ảnh, app tự hiện icon món ăn mặc định (🍜🥤🍰)

Lưu xong, khách quét lại QR sẽ thấy ngay bản cập nhật (không cần deploy lại).

## Phân quyền 2 cổng: Nhân viên & Chủ quán (mới)

Nút "🔐 Quản lý" giờ có **2 mã PIN khác nhau**, tự động phân quyền theo mã
nhập vào:

| PIN | Vai trò | Thấy được |
|---|---|---|
| `5678` (mặc định) | 👨‍🍳 Nhân viên | Đơn hàng/bếp, Kho hàng, Kiểm kê, link tự chấm công |
| `1234` (mặc định) | 🔐 Chủ quán | Tất cả - kể cả Thực đơn, Nhân viên, Cài đặt |

Đổi 2 mã này ở tab **⚙️ Cài đặt** (chỉ chủ quán mới thấy tab này) → mục
**🔑 Mã PIN đăng nhập**. Nên đổi cả 2 mã khỏi mặc định trước khi dùng thật.

Khách hàng (quét QR bàn) không cần PIN gì cả - chỉ thấy gọi món, xem bill,
theo dõi món đang làm, và gửi góp ý như bình thường.

## Kết hợp với app Ví (Sổ Thu Chi Đa Ví)

Nếu bạn cũng dùng app **Thu Chi Đa Ví** (thư mục `thuchi-pwa` gửi kèm) để
quản lý dòng tiền, app đó có một **cổng ngầm** (chấm khóa 🔒 nhỏ trên logo)
để mở thẳng sang trang quản lý quán ăn này mà không cần nhớ link riêng.
Sau khi deploy app này lên GitHub Pages, dán link (kèm `?admin=1`) vào phần
cài đặt cổng ngầm của app Ví - xem chi tiết trong `thuchi-pwa/README.md`.

Chiều ngược lại: trang chào của app Quán Ăn này cũng có **cổng ngầm sang app
Ví** - icon 👛 nằm ngay cạnh khóa 🔒 ở góc phải trên, không có chữ giải
thích (chỉ chủ quán biết đó là gì). Đăng nhập PIN chủ quán → tab ⚙️ Cài đặt
→ mục **👛 Cổng ngầm sang app Ví**, dán link app Ví của bạn vào và lưu. Nếu
chưa dán link, bấm vào icon 👛 sẽ không có gì xảy ra (ẩn hoàn toàn, không lộ
ra là có cổng ngầm).

## Định vị bắt buộc khi nhân viên đăng nhập (mới)

Để tránh nhân viên đăng nhập/chấm công hộ nhau từ xa, màn đăng nhập bằng
**PIN nhân viên** (không áp dụng cho PIN chủ quán) giờ bắt buộc phải:
- Thiết bị đã bật định vị (GPS) và cho phép trình duyệt truy cập vị trí.
- Vị trí hiện tại cách tọa độ quán không quá **20 mét**.

Nếu thiếu định vị, bị từ chối quyền truy cập, hoặc đứng xa quán hơn 20m, app
sẽ báo lỗi và không cho vào khu vực quản lý.

**Cách cài đặt (chủ quán làm 1 lần):** đăng nhập PIN chủ quán → tab
⚙️ Cài đặt → mục **📍 Vị trí quán**. Đứng ngay tại quán, bấm "📍 Lấy vị trí
hiện tại" để tự động điền tọa độ, rồi bấm "Lưu vị trí quán". Có thể nhập tay
tọa độ (lat/lng) nếu muốn chỉnh chính xác hơn.

**Lưu ý về độ chính xác GPS:** GPS trên điện thoại thường chỉ chính xác
trong khoảng 5-20m ngoài trời (và kém hơn nhiều trong nhà/gần tòa nhà cao
tầng), nên nhân viên đứng đúng trong quán vẫn có thể thỉnh thoảng bị từ
chối. Nếu vẫn gặp tình trạng này thường xuyên, có thể nới thêm bằng cách
sửa hằng số `STAFF_LOGIN_RADIUS_M` (hiện là `20`) trong `index.html`.

## Nhân viên được sửa Thực đơn (cập nhật)

Tab **🍽️ Thực đơn** giờ hiện cho cả PIN nhân viên, không còn giới hạn riêng
chủ quán. Nhân viên đăng nhập bằng PIN nhân viên (và đã qua kiểm tra định vị
ở trên) có thể thêm/sửa/xóa món, đổi giá, bật/tắt trạng thái đang bán. Các
tab còn lại (Nhân viên, Cài đặt) vẫn chỉ chủ quán mới thấy.

## Sau khi lên mạng

- **Trang khách gọi món**: mở link gốc, khách nhập số bàn (hoặc dùng link
  `?table=5` để in QR cho từng bàn).
- **Trang quản lý**: bấm nút "🔐 Quản lý" ở góc trên, nhập PIN nhân viên
  (`5678`) hoặc PIN chủ quán (`1234`) tùy vai trò - đổi ngay 2 mã này trong
  tab Cài đặt (chỉ chủ quán thấy) sau khi đăng nhập lần đầu.
- **Trang chấm công nhân viên**: link `?checkin=1`.
- Tạo mã QR cho từng bàn: vào tab Cài đặt trong trang quản lý, hoặc dùng
  bất kỳ trình tạo QR nào trỏ tới `https://<username>.github.io/quanan-app/?table=<số bàn>`.
- Trên điện thoại, mở link bằng Chrome/Safari rồi chọn "Thêm vào màn hình
  chính" để cài như app thật (nhờ manifest.json + sw.js).

## Nếu cần đổi backend sau này

Mở `index.html`, tìm dòng `const API_URL = "..."` gần đầu thẻ `<script>`
và thay bằng Web app URL mới lấy từ Apps Script (Deploy > New deployment).
File backend gốc (`Code.gs`) dán vào Google Apps Script gắn với Google Sheet
của bạn — không cần đưa file này lên GitHub vì nó không phải phần tĩnh.
