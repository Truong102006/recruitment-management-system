# Bàn giao BE1

Phạm vi source: UC04 auth, UC11 company/membership, UC01 job lifecycle, UC05 public search, UC10 admin. Trạng thái tích hợp và bằng chứng thực xem [sổ tiến độ](../progress/README.md), không suy từ tài liệu này là đã lên main.

- Thiết lập, migration, seed, cổng và test: [be1-setup.md](be1-setup.md). Runbook: [be1-security-runbook.md](be1-security-runbook.md).
- API/schema/event/port: [đặc tả](project-specification.md), [BE2 integration contract](be2-integration-contract.md), `libs/contracts/`, `apps/api/src/` và `prisma/migrations/` là nguồn cần đối chiếu. Triển khai migration trước chạy API mới; không dùng Prisma db push thay lịch sử migration.
- BE2 cần review DB/constraint và Job/CandidateAccess contract; BE1 cần review BE3 auth/access/security-revocation. Các review này cần người review và kết quả thật, hiện tài liệu không ghi nhận phê duyệt.
- CI backend thực thi install/generate/validate/typecheck/lint/build/evidence-tool tests/migration/unit/integration/contract, rồi parse JUnit/coverage/commit manifest. Job tổng `always` chặn skipped/cancelled/failure. Actions được pin theo SHA lấy từ remote tags; image PostgreSQL có version cụ thể. Chưa có xác nhận GitHub run hay cấu hình required branch check.
- Gate hiện bao phủ backend; FE/E2E, historical upgrade và DB role permission, full negative-control GitHub runs, clean clone độc lập, load TC29, restore TC30, provider NFR04/09 còn cần phối hợp. Thiếu các bằng chứng này không được đánh dấu toàn bộ BE1 hoặc CI toàn hệ thống DONE.
- Server standalone chưa bind provider BE3 outbox/audit/interview-security. Mutation phụ thuộc provider fail 503; fixture provider trong API test không chứng minh email hay video hoạt động. Worker entry còn trống. Cần bind provider transactional thực trước demo liên nhóm.
- Production startup kiểm `SESSION_SECRET`, `CSRF_SECRET`, `AUTH_TOKEN_ENCRYPTION_KEY` (64 hex), `DATABASE_URL` và HTTPS `WEB_ORIGIN`. Chi tiết xoay key/phiên và giới hạn hiện tại nằm trong runbook.
- Coverage gate 80/70 áp dụng tập source đang được `jest.config.cjs` instrument; config hiện loại common/config/repository/controller/adapter/DTO và entry/module. Không diễn giải con số này thành coverage toàn backend; API/integration bổ sung hành vi nhưng không tự mở rộng mẫu số coverage unit.

Demo liên nhóm cần đi từ duyệt company → publish job → BE2 apply → BE3 interview/result. Source BE1 và các mock contract không thay thế triển khai BE2/BE3/FE. Không đưa credential thật hay dữ liệu ứng viên vào report demo.

Rủi ro dependency: lần `npm install` trong lượt triển khai báo 46 vulnerability (11 moderate, 33 high, 2 critical). Chưa xử lý toàn bộ; nâng Vitest major có thể ảnh hưởng FE nên cần owner đánh giá và chạy regression. Không được tuyên bố không còn Critical/High hoặc đạt điều kiện release an toàn từ backend test pass.

23/10/2026: Job DTO chuyển thành class để ValidationPipe kiểm whitelist/giới hạn thật. Canonical account UUID locks trước company/job; ADMIN không bypass quyền business thông thường. Evidence inventory cố định tại `scripts/evidence/required-suites.json` kiểm cả file và tên suite XML, nên xóa suite không tạo gate xanh. Seed demo bị chặn production và cần SEED_DEMO_PASSWORD riêng.

Kết quả gate cuối và điều kiện nghiệm thu còn thiếu: [kiểm chứng BE1](be1-verification.md). Backend local đạt248 unit/106 integration/21 contract (contract đã bao gồm trong integration); coverage theo phạm vi cấu hình91.88% lines/73.60% branches. Không coi đây là CI/provider acceptance.
