# PostgreSQL cloud dùng chung

Ứng dụng dùng PostgreSQL trên Neon qua Prisma6.19.0. Connection string thật chỉ lưu trong `.env` riêng, không nằm trong Git. File `.env.example` chỉ chứa thông tin mẫu local.

## Máy đã cấu hình

`DATABASE_URL` và `CLOUD_DATABASE_URL` trong `.env` trỏ tới Neon direct connection có SSL. `TEST_DATABASE_URL` và `MIGRATION_TEST_DATABASE_URL` vẫn trỏ PostgreSQL Docker local. `.env.test` giữ DATABASE_URL local. Hai migration BE1 đã deploy lên cloud ngày23/10/2026; database ban đầu rỗng, không import dữ liệu local, không seed tài khoản mẫu. SQL BE2 trong `prisma/pending/` chưa phải migration và không được tự chạy từ bước cấu hình này.

Chạy `npm run dev:api` để API đọc `.env` hiện tại. `npm run db:studio` sẽ mở database theo DATABASE_URL, hiện là cloud. Sau khi sửa `.env`, khởi động lại API/worker để nhận cấu hình mới.

## Thành viên khác

1. Pull code và cài dependencies bằng `npm ci`.
2. Tạo `.env` từ `.env.example` nếu chưa có, nhận connection string Neon từ người quản lý project qua kênh riêng rồi đặt DATABASE_URL (không đẩy file `.env` lên Git).
3. Giữ TEST_DATABASE_URL là URL PostgreSQL local của máy mình. Khi cần, tạo `.env.test` với NODE_ENV=test và DATABASE_URL local; TEST_DATABASE_URL được ưu tiên.
4. Chạy `docker compose up -d --wait postgres` cho test local; `npm run db:generate` tạo Prisma Client. Khi local chưa có bảng, dùng `node --env-file=.env.test node_modules/prisma/build/index.js migrate deploy` sau khi đã tạo `.env.test` đúng local.
5. Mọi thành viên đặt DATABASE_URL cùng Neon database/schema sẽ dùng chung dữ liệu ứng dụng. Máy phát triển không cần bật Docker nếu chỉ dùng API/cloud; test local cần Docker.

## Migration và kiểm tra

Người điều phối migration dùng `npm run db:migrate:deploy` trên cloud; không dùng db push hoặc migrate reset để đồng bộ database chung. Không chạy demo seed mặc định lên cloud chung. Database local cũ vẫn giữ dữ liệu riêng; đổi connection string không tự chuyển dữ liệu.

Backend Jest unit/integration/contract kế thừa `scripts/database/test-environment.cjs`. Script chọn TEST_DATABASE_URL, sau đó `.env.test`, rồi fallback môi trường local; URL ngoài localhost/127.0.0.1/IPv6 loopback bị chặn trước khi import Prisma/Nest. Không hạ guard để chạy test vào database dùng chung. CI vẫn dùng PostgreSQL local service riêng.

Kiểm guard: `node --test scripts/database/test-environment.test.cjs`. Kiểm trạng thái cloud: `npm exec -- prisma migrate status` (đọc DATABASE_URL từ `.env`). PostgreSQL Neon thực tế đã kiểm:18.6; hai migration hiện hành áp dụng thành công. Schema Prisma còn có model BE2 chưa được deploy bằng migration: kết nối thành công không đồng nghĩa toàn hệ thống đã có đủ bảng/endpoint.
