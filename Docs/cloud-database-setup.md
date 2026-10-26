# PostgreSQL cloud dùng chung

Ứng dụng dùng PostgreSQL trên Neon qua Prisma6.19.0. Connection string thật chỉ lưu trong `.env` riêng, không nằm trong Git. File `.env.example` chỉ chứa thông tin mẫu local.

## Máy đã cấu hình

`DATABASE_URL` và `CLOUD_DATABASE_URL` trong `.env` trỏ tới Neon direct connection có SSL. `TEST_DATABASE_URL` và `MIGRATION_TEST_DATABASE_URL` vẫn trỏ PostgreSQL Docker local. `.env.test` giữ DATABASE_URL local. Ngày 23/10 cloud chỉ có 2 migration BE1. Theo yêu cầu sửa lỗi profile ngày 26/10, đã deploy đủ **6 migration** trong `prisma/migrations/` (BE1/BE2/BE3/normalize/backfill), không chạy SQL pending bằng tay. Hiện có 8 profile cho 8 account CANDIDATE, thiếu 0; thông tin đăng nhập/role và trạng thái nghiệp vụ cũ được kiểm không đổi sau migration. [Báo cáo sửa cloud](../plans/reports/261026-0100-cloud-profile-repair.md).

Runtime đã kiểm ở máy này: build API bằng `npm run build --workspace @rms/api`, sau đó `node --env-file=.env dist/api/apps/api/src/main.js`; FE dùng `npm run dev:web`. Lệnh dev API qua tsx từng lỗi decorator metadata, nên hướng dẫn này dùng JS đã build. `npm run db:studio` sẽ mở database theo DATABASE_URL, hiện là cloud. Sau khi sửa `.env`, khởi động lại API/worker để nhận cấu hình mới.

## Thành viên khác

1. Pull code và cài dependencies bằng `npm ci`.
2. Tạo `.env` từ `.env.example` nếu chưa có, nhận connection string Neon từ người quản lý project qua kênh riêng rồi đặt DATABASE_URL (không đẩy file `.env` lên Git).
3. Giữ TEST_DATABASE_URL là URL PostgreSQL local của máy mình. Khi cần, tạo `.env.test` với NODE_ENV=test và DATABASE_URL local; TEST_DATABASE_URL được ưu tiên.
4. Chạy `docker compose up -d --wait postgres` cho test local; `npm run db:generate` tạo Prisma Client. Khi local chưa có bảng, dùng `node --env-file=.env.test node_modules/prisma/build/index.js migrate deploy` sau khi đã tạo `.env.test` đúng local.
5. Mọi thành viên đặt DATABASE_URL cùng Neon database/schema sẽ dùng chung dữ liệu ứng dụng. Máy phát triển không cần bật Docker nếu chỉ dùng API/cloud; test local cần Docker.

## Migration và kiểm tra

Người điều phối migration dùng `npm run db:migrate:deploy` trên cloud; không dùng db push hoặc migrate reset để đồng bộ database chung. Không chạy demo seed mặc định lên cloud chung. Database local cũ vẫn giữ dữ liệu riêng; đổi connection string không tự chuyển dữ liệu.

Backend Jest unit/integration/contract kế thừa `scripts/database/test-environment.cjs`. Script chọn TEST_DATABASE_URL, sau đó `.env.test`, rồi fallback môi trường local; URL ngoài localhost/127.0.0.1/IPv6 loopback bị chặn trước khi import Prisma/Nest. Không hạ guard để chạy test vào database dùng chung. CI vẫn dùng PostgreSQL local service riêng.

Kiểm guard: `node --test scripts/database/test-environment.test.cjs`. Kiểm trạng thái cloud: `npm exec -- prisma migrate status` (đọc DATABASE_URL từ `.env`). Lượt 26/10 xác nhận 6 migration và schema up to date; GET/PATCH profile qua cloud đạt 33 kiểm API và một smoke browser đọc/lưu thật. 7 tài khoản demo được tạo theo yêu cầu riêng của người dùng, không thay guard seed mặc định local. Có schema đầy đủ không đồng nghĩa API CV/video/reporting hoặc các provider đã được nghiệm thu.
