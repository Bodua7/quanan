# Quán Ăn - Gọi Món & Quản Lý (PWA, hỗ trợ NHIỀU quán)

App gọi món qua QR + quản lý CHUỖI quán ăn (1 app, 1 backend, quản lý tập
trung nhiều quán), chạy hoàn toàn tĩnh (frontend) và dùng Google Apps Script +
Google Sheets làm backend/database miễn phí.

## ⚠️ Nâng cấp lên bản nhiều quán (đọc trước khi deploy)

Bản này đổi cấu trúc dữ liệu để 1 Google Sheet + 1 Apps Script quản lý được
NHIỀU quán cùng lúc (thay vì 1 Sheet = 1 quán như trước):

1. Bạn **bắt buộc phải cập nhật lại `Code_QuanAn.gs`** trên Apps Script (xem
   mục "Bắt buộc cập nhật lại Apps Script" bên dưới) - nếu bạn đang dùng Sheet
   cũ, dữ liệu món/đơn/kho/nhân viên cũ sẽ cần được thêm cột `restaurantId`
   thủ công (điền cùng 1 mã tự chọn, ví dụ `quan1`, cho toàn bộ dòng cũ) rồi
   thêm 1 dòng tương ứng trong sheet `Restaurants` với `id` trùng mã đó.
   Nếu quán của bạn còn mới/ít dữ liệu, cách nhanh nhất là **xóa Sheet cũ,
   tạo Sheet mới trống** rồi làm theo hướng dẫn cài đặt lại từ đầu.
2. Mở app → bấm 🔒 ở màn "Chọn quán" → đăng nhập **Mã chủ chuỗi** (mặc định
   `9999`) → bấm **+ Thêm quán mới** để tạo từng quán (tên, địa chỉ, PIN chủ
   quán/nhân viên riêng cho quán đó).
3. Sau khi tạo quán, bấm **🔑 Vào quản lý** để vào quản lý quán đó ngay (nhập
   Thực đơn, ảnh, vị trí GPS, số điện thoại... trong tab ⚙️ Cài đặt), hoặc
   nhân viên/chủ quán tự đăng nhập bằng PIN của quán đó từ màn "Chọn quán".
4. Mã QR mỗi quán tự chứa `?r=<mã quán>` (xem trong tab Cài đặt của từng
   quán) - khách quét đúng mã QR sẽ vào thẳng quán đó, không cần chọn quán.
5. Nhân viên làm ở nhiều quán: chỉ cần biết PIN nhân viên của từng quán,
   chọn đúng quán ở màn "Chọn quán" rồi đăng nhập bằng PIN quán đó. Link
   chấm công riêng theo quán: `?checkin=1&r=<mã quán>` (nút "🕒 Chấm công
   của tôi" trong khu quản lý đã tự gắn sẵn mã quán đang chọn).
6. Đổi Mã chủ chuỗi: hiện chưa có UI riêng - sửa trực tiếp giá trị dòng
   `masterPin` trong sheet `Master` trên Google Sheet của bạn.

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

## Số điện thoại & Facebook trên trang chào (mới)

Trong tab **⚙️ Cài đặt** → mục **🎨 Trang chào khi quét QR**, giờ có thêm:
- **5 ô số điện thoại** (mỗi ô có thêm "Tên gọi" tuỳ chọn, VD: "Đặt bàn" -
  090xxx, "Giao hàng" - 091xxx). Khách bấm vào sẽ tự động gọi (`tel:`).
- **5 ô link Facebook** (mỗi ô có "Tên gọi" tuỳ chọn, VD: "Trang chính",
  "Chi nhánh 2"). Khách bấm vào sẽ mở trang Facebook ở tab mới.

Ô nào để trống sẽ không hiện trên trang chào. Không cần điền đủ cả 5 - có thể
chỉ dùng 1 SĐT và 1 Facebook, hoặc bất kỳ số lượng nào. Nhớ bấm **"Lưu trang
chào"** sau khi điền.

## Món ăn: ảnh, size, độ cay, topping (mới)

Trong tab **🍽️ Thực đơn** → bấm sửa (✏️) hoặc **+ Thêm món mới**, mỗi món giờ có thêm:

- **Hình món**: dán link ảnh HOẶC bấm "Chọn tệp" để tải thẳng ảnh từ điện thoại/máy
  tính (app tự nén nhỏ ảnh lại trước khi lưu, không cần upload lên Drive/Imgur nữa).
  Trang chào QR (mục Ảnh/logo trong Cài đặt) cũng dùng chung cách tải ảnh này.
- **Có nhiều size (M/L...)**: bật rồi thêm từng size với tên + giá riêng (VD: M -
  12.000đ, L - 15.000đ). Khi bật, khách phải chọn 1 size trước khi thêm vào giỏ;
  giá của size sẽ thay cho "Giá mặc định".
- **Có chọn độ cay**: bật rồi đặt mức cay tối đa (mặc định 0-7). Khách chọn mức
  cay khi đặt món, không cộng thêm tiền.
- **Có topping thêm**: bật rồi thêm từng topping với tên + giá cộng thêm (VD:
  Trân châu +5.000đ). Khách có thể chọn nhiều topping cùng lúc, giá sẽ cộng dồn.

Món có bất kỳ tùy chọn nào ở trên sẽ hiện nút **"Chọn"** thay vì nút +/- khi khách
xem menu; bấm vào sẽ mở màn hình chọn size/độ cay/topping/số lượng rồi mới thêm
vào giỏ. Món không có tùy chọn nào vẫn hoạt động như cũ (bấm +/- trực tiếp).

## Nhập nhanh nhiều món theo menu (mới)

Trong tab **🍽️ Thực đơn**, bấm **📋 Nhập nhanh theo menu** để dán một danh sách
món và tạo hàng loạt cùng lúc, tiện khi đã có sẵn bảng menu (như file ảnh thực
đơn). Định dạng:

```
## Trà trái cây
Trà đào - 25k
Trà nhiệt đới - 25k

## Rau má
Truyền thống - M:12k, L:15k
Đậu xanh - M:15k, L:20k

## Mì cay
Mì cay xúc xích - 30k
Mì cay gà - 40k
```

- Dòng bắt đầu bằng `##` là tên danh mục cho các món phía dưới nó.
- Mỗi dòng món viết `Tên món - Giá`. Có thể viết `25k` (=25.000đ) hoặc số đầy đủ.
- Món có nhiều size viết `Tên món - M:12k, L:15k` (có thể thêm nhiều size hơn,
  cách nhau bằng dấu phẩy).
- Sau khi nhập nhanh xong, mở lại từng món để thêm ảnh, độ cay, hoặc topping nếu
  cần - nhập nhanh chỉ tạo tên/giá/size/danh mục.

## ⚠️ Bắt buộc cập nhật lại Apps Script (quan trọng)

File `Code_QuanAn.gs` lần này có thêm cột dữ liệu mới cho món ăn (ảnh, size, độ
cay, topping), nên bạn cần cập nhật lại backend:

1. Mở Google Sheet của bạn → **Tiện ích mở rộng (Extensions) → Apps Script**.
2. Xóa hết code cũ, dán toàn bộ nội dung `Code_QuanAn.gs` (bản mới) vào, bấm lưu (💾).
3. Vào **Deploy → Manage deployments** → bấm ✏️ (Edit) ở deployment đang dùng →
   mục "Version" chọn **New version** → **Deploy**.
   (Chỉ lưu code mà không tạo "New version" thì link cũ vẫn chạy code cũ!)
4. Không cần đổi `API_URL` trong `index.html` vì link web app giữ nguyên.
5. Sheet "Menu" cũ sẽ tự động được thêm các cột mới (image, sizes, spicyMax,
   toppings) ở lần chạy đầu tiên sau khi cập nhật - không mất dữ liệu món cũ.

**Lưu ý dung lượng ảnh:** ảnh tải từ máy được nén và lưu trực tiếp vào ô Google
Sheet (dạng base64), mỗi ô Sheet giới hạn khoảng 50.000 ký tự. App đã tự nén ảnh
xuống cỡ nhỏ (~480px) trước khi lưu nên thường không vượt giới hạn, nhưng nếu
muốn ảnh đẹp/nét hơn hoặc dùng nhiều ảnh lớn, vẫn nên dán link ảnh public từ
Google Drive/Imgur như trước thay vì tải trực tiếp.

## Nếu cần đổi backend sau này

Mở `index.html`, tìm dòng `const API_URL = "..."` gần đầu thẻ `<script>`
và thay bằng Web app URL mới lấy từ Apps Script (Deploy > New deployment).
File backend gốc (`Code.gs`) dán vào Google Apps Script gắn với Google Sheet
của bạn — không cần đưa file này lên GitHub vì nó không phải phần tĩnh.
