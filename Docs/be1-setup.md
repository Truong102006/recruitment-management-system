# Thiết lập BE1

Phạm vi: API/worker BE1 và kiểm tra backend; pipeline này chưa nghiệm thu FE/E2E, tải, restore hay Jitsi. Xem [đặc tả](project-specification.md), [tiến độ](../progress/README.md) và [bàn giao](be1-handoff.md).

1. Cài Node theo `package.json` (24.15 trở lên, dưới 25), npm 11 và Docker Compose. Chạy `npm ci`.
2. Sao chép `.env.example` thành `.env`. Chỉ dùng mật khẩu mẫu ở máy phát triển; thay các secret. `npm run infra:up` bật các fixture theo [development-setup.md](development-setup.md).
3. Export `DATABASE_URL` tới database phát triển. Prisma đọc `.env`; shell và test cần nhận đúng biến môi trường. Chạy `npm run db:generate`, `npm run db:validate`, `npm run db:migrate:deploy`.
4. Chỉ trong database phát triển, đặt `SEED_DEMO_PASSWORD` riêng (10–72 byte UTF-8), rồi chạy `npm run db:seed`. Seed từ chối production và không có mật khẩu mặc định. Fixture ACTIVE mới có emailVerifiedAt; upsert không tự xác minh account đã tồn tại.
5. Chạy `npm run dev:api` và `npm run dev:web` ở các terminal riêng. API mặc định cổng 3000, prefix `/api`, web 5173. PostgreSQL mặc định 5432, MinIO API/console 9000/9001, Mailpit SMTP/UI 1025/8025; tất cả binding dịch vụ local theo `compose.yaml`. Script `dev:worker` có sẵn nhưng entry worker hiện còn trống, chưa gửi email hay xử lý outbox.
6. Chạy `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:evidence`, `npm run test:unit:ci -- --runInBand`, `npm run test:integration:ci`, `npm run test:contract:ci`. PostgreSQL phải sẵn sàng; database down là lỗi, không skip suite.

`MIGRATION_TEST_DATABASE_URL` phải trỏ tới database test dùng riêng. `npm run verify:migrations` tạo schema UUID riêng, migrate từ rỗng, ghi fixture và deploy lặp lại, kiểm constraint/index rồi xóa đúng schema đó. Lệnh không reset schema của URL đầu vào. Chưa có fixture nâng cấp từ release cũ và chưa chứng minh quyền runtime/migration tách biệt.

Để kiểm artifact local, dùng một thư mục report sạch, chạy toàn bộ producer thành công, đặt `EVIDENCE_COMMIT` bằng commit thật (`git rev-parse HEAD`), chạy `npm run evidence:manifest` rồi `npm run verify:evidence`. Manifest gắn commit nhưng không chứng minh source chưa commit hoặc report cũ; CI clean checkout là nơi tạo bằng chứng cho commit. Không tự đổi manifest thành success để bỏ qua suite lỗi.

BE report nằm ở `reports/backend/`: unit/integration/contract JUnit, coverage JSON và migration JSON. Integration hiện gộp DB/API/concurrency theo Jest config. Gate yêu cầu mọi suite có test, không failure/error/skip; lines ≥80%, branches ≥70%, không focused/skipped tests. Không xem backend gate là nghiệm thu toàn hệ thống. Workflow chưa có FE/E2E do sản phẩm/suite tương ứng chưa hoàn chỉnh; chủ sở hữu phải thêm job và đưa vào `needs` trước nghiệm thu TC60 toàn hệ thống.

Clean clone bởi người khác và GitHub Actions phải ghi kết quả thật vào sổ tiến độ. Tài liệu này không xác nhận các bước đó đã được người khác chạy.

API hiện có thể bootstrap nhưng chưa có provider BE3 cho outbox/audit/interview-security được bind trong `AppModule`. Các mutation cần những provider đó trả 503 thay vì ghi dữ liệu mà thiếu event/audit: đăng ký, phát hành token email, tạo company, thay đổi membership/recovery và admin moderation có thể chưa dùng được trên server standalone. Các API test inject fixture provider chỉ chứng minh contract trong môi trường test. Mailpit chạy không tự hoàn thành luồng gửi email.

Khi dùng `NODE_ENV=production`, cấu hình bắt buộc hiện gồm `DATABASE_URL`; `SESSION_SECRET` và `CSRF_SECRET` riêng, ít nhất 32 byte và không mang giá trị mặc định/placeholder; `AUTH_TOKEN_ENCRYPTION_KEY` đúng 64 ký tự hex; `WEB_ORIGIN` là HTTPS origin không có path hay dấu `/` cuối. Tên biến mã hóa là `AUTH_TOKEN_ENCRYPTION_KEY`, không phải `AUTH_ENCRYPTION_KEY`. Kiểm tra này bảo vệ lúc khởi động, chưa thay thế tích hợp provider, HTTPS hay permission test trên deployment thực.
