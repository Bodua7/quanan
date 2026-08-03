/* ============================================================
   SCHEMA SUPABASE CHO APP "QUẢN LÝ CHUỖI QUÁN ĂN" (nhiều quán)
   Cách dùng:
   1. Tạo project mới tại https://supabase.com (miễn phí).
   2. Vào SQL Editor > New query > dán TOÀN BỘ file này > Run.
   3. Vào Storage > kiểm tra đã có bucket "images" (được tạo sẵn ở cuối file).
   4. Vào Project Settings > API > copy "Project URL" và "anon public key"
      rồi dán vào 2 biến SUPABASE_URL / SUPABASE_ANON_KEY trong index.html.
   5. Vào Table Editor > "restaurants" > bấm Insert > tạo quán đầu tiên
      (hoặc mở app, bấm 🔒 ở màn "Chọn quán", đăng nhập mã chủ chuỗi mặc
      định 9999, rồi "+ Thêm quán mới").
   ============================================================ */

create extension if not exists pgcrypto;

/* ---------- RESTAURANTS (hồ sơ công khai từng quán, KHÔNG chứa PIN) ---------- */
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  address text default '',
  tagline text default '',
  logo1 text default '', logo2 text default '', logo3 text default '',
  "walletUrl" text default '',
  lat text default '', lng text default '',
  phone1 text default '', phone2 text default '', phone3 text default '', phone4 text default '', phone5 text default '',
  "phoneLabel1" text default '', "phoneLabel2" text default '', "phoneLabel3" text default '', "phoneLabel4" text default '', "phoneLabel5" text default '',
  fb1 text default '', fb2 text default '', fb3 text default '', fb4 text default '', fb5 text default '',
  "fbLabel1" text default '', "fbLabel2" text default '', "fbLabel3" text default '', "fbLabel4" text default '', "fbLabel5" text default '',
  active boolean default true,
  "createdAt" bigint
);

/* ---------- RESTAURANT_PINS (tách riêng, KHÔNG cho anon đọc trực tiếp) ---------- */
create table if not exists restaurant_pins (
  id uuid primary key references restaurants(id) on delete cascade,
  "adminPin" text default '1234',
  "staffPin" text default '5678'
);

/* ---------- MASTER (mã chủ chuỗi, KHÔNG cho anon đọc trực tiếp) ---------- */
create table if not exists master (
  key text primary key,
  value text
);
insert into master (key, value) values ('masterPin', '9999')
on conflict (key) do nothing;

/* ---------- MENU ---------- */
create table if not exists menu (
  id uuid primary key default gen_random_uuid(),
  "restaurantId" uuid references restaurants(id) on delete cascade,
  name text,
  price numeric default 0,
  category text,
  available boolean default true,
  image text default '',
  sizes text default '[]',
  "spicyMax" integer default 0,
  toppings text default '[]'
);

/* ---------- ORDERS ---------- */
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  "restaurantId" uuid references restaurants(id) on delete cascade,
  "table" text,
  items text default '[]',
  total numeric default 0,
  note text default '',
  status text default 'pending',
  "createdAt" bigint,
  "updatedAt" bigint
);

/* ---------- FEEDBACK ---------- */
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  "restaurantId" uuid references restaurants(id) on delete cascade,
  "orderId" text,
  "table" text,
  rating integer,
  comment text default '',
  "createdAt" bigint
);

/* ---------- INVENTORY ---------- */
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  "restaurantId" uuid references restaurants(id) on delete cascade,
  name text,
  qty numeric default 0,
  unit text default '',
  "minQty" numeric default 0
);

/* ---------- STAFF ---------- */
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  "restaurantId" uuid references restaurants(id) on delete cascade,
  name text,
  pin text
);

/* ---------- CHECKIN ---------- */
create table if not exists checkin (
  "restaurantId" uuid references restaurants(id) on delete cascade,
  date text not null,
  "staffId" text not null,
  name text,
  "checkIn" bigint,
  "checkOut" bigint,
  primary key ("restaurantId", date, "staffId")
);

/* ---------- STOCKTAKE ---------- */
create table if not exists stocktake (
  "restaurantId" uuid references restaurants(id) on delete cascade,
  date text not null,
  "itemId" text not null,
  "systemQty" numeric default 0,
  "actualQty" numeric default 0,
  diff numeric default 0,
  primary key ("restaurantId", date, "itemId")
);

/* ============================================================
   BẢO MẬT (RLS)
   - Các bảng dữ liệu quán (menu/orders/feedback/inventory/staff/
     checkin/stocktake) và bảng restaurants (hồ sơ công khai) mở
     đọc/ghi công khai (anon) giống bản Apps Script cũ - app này
     dùng PIN đơn giản chứ không có tài khoản đăng nhập thật.
   - Bảng restaurant_pins và master GIẤU HOÀN TOÀN khỏi anon (bật
     RLS, không tạo policy nào) - chỉ truy cập được qua các hàm
     RPC SECURITY DEFINER bên dưới (check_login, master_login,
     set_restaurant_pins), không lộ giá trị PIN thật ra ngoài.
   ============================================================ */

alter table restaurants enable row level security;
alter table menu enable row level security;
alter table orders enable row level security;
alter table feedback enable row level security;
alter table inventory enable row level security;
alter table staff enable row level security;
alter table checkin enable row level security;
alter table stocktake enable row level security;
alter table restaurant_pins enable row level security;
alter table master enable row level security;
-- restaurant_pins và master: KHÔNG tạo policy nào => anon bị từ chối hoàn toàn.

create policy "public all restaurants" on restaurants for all to anon using (true) with check (true);
create policy "public all menu" on menu for all to anon using (true) with check (true);
create policy "public all orders" on orders for all to anon using (true) with check (true);
create policy "public all feedback" on feedback for all to anon using (true) with check (true);
create policy "public all inventory" on inventory for all to anon using (true) with check (true);
create policy "public all staff" on staff for all to anon using (true) with check (true);
create policy "public all checkin" on checkin for all to anon using (true) with check (true);
create policy "public all stocktake" on stocktake for all to anon using (true) with check (true);

/* Kiểm tra đăng nhập PIN quán (chủ quán/nhân viên) - chạy với quyền chủ sở
   hữu (SECURITY DEFINER) nên đọc được restaurant_pins dù anon không có
   quyền SELECT trực tiếp bảng đó. */
create or replace function check_login(p_rid uuid, p_pin text)
returns table(ok boolean, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from restaurant_pins where id = p_rid and "adminPin" = p_pin) then
    return query select true, 'admin';
  elsif exists (select 1 from restaurant_pins where id = p_rid and "staffPin" = p_pin) then
    return query select true, 'staff';
  else
    return query select false, ''::text;
  end if;
end;
$$;
grant execute on function check_login(uuid, text) to anon;

/* Kiểm tra mã chủ chuỗi (Master PIN) */
create or replace function master_login(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (select 1 from master where key = 'masterPin' and value = p_pin);
end;
$$;
grant execute on function master_login(text) to anon;

/* Tạo/đổi PIN quán - dùng khi tạo quán mới (seed mặc định 1234/5678) hoặc
   khi đổi PIN (chủ chuỗi sửa quán, hoặc chủ quán tự đổi PIN trong Cài đặt).
   Truyền NULL cho tham số nào muốn GIỮ NGUYÊN giá trị cũ. */
create or replace function set_restaurant_pins(p_rid uuid, p_admin_pin text default null, p_staff_pin text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into restaurant_pins (id, "adminPin", "staffPin")
  values (p_rid, coalesce(p_admin_pin, '1234'), coalesce(p_staff_pin, '5678'))
  on conflict (id) do update set
    "adminPin" = coalesce(p_admin_pin, restaurant_pins."adminPin"),
    "staffPin" = coalesce(p_staff_pin, restaurant_pins."staffPin");
end;
$$;
grant execute on function set_restaurant_pins(uuid, text, text) to anon;

/* ============================================================
   STORAGE: bucket "images" để lưu ảnh món ăn / logo (public đọc)
   ============================================================ */
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "public read images" on storage.objects
  for select to anon using (bucket_id = 'images');
create policy "public upload images" on storage.objects
  for insert to anon with check (bucket_id = 'images');
create policy "public update images" on storage.objects
  for update to anon using (bucket_id = 'images');
