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


## Tiếp tục sửa lỗi 25/10/2026

Codex sửa F02–F06 trên `fix/be1-acceptance-20261025` từ main `94d84c2`; chưa commit/chưa gộp main. Mọi mutation Job thường kiểm OWNER khả dụng dưới khóa company; company name/address không nhận trắng/null; văn bản company/Job và fullName đăng ký trim/NFC trước validation/persistence, độ dài theo Unicode code point chính xác. Password/token giữ nguyên. Search mặc định publication mới nhất (`publishedAt DESC, id DESC`), vẫn hỗ trợ createdAt tường minh và sortOrder; [đặc tả](project-specification.md) và [contract BE2](be2-integration-contract.md) ghi rõ biên và tương thích.

Baseline probe AppModule thật tái hiện 8 assertion lỗi; CandidateProfile/ApplicationConflict BE2 đã bind, còn thiếu 5 provider BE3 Outbox/Audit/InterviewMembership/InterviewSecurity/InterviewAdmin, register hợp lệ trả 503. Đây là blocker nghiệm thu runtime, không được thay bằng provider noop. Các số test/coverage 23/10 phía trên là snapshot lịch sử; lệnh/kết quả sau sửa, nhánh và bằng chứng mới đọc tại [sổ tiến độ](../progress/README.md).

Đã đồng bộ cả 8 pha kế hoạch, tất cả giữ IN_PROGRESS. Mail/video/revoke và barrier xuyên owner, HTTPS/browser, DB role/historical upgrade, hosted negative controls, load/restore/clean setup và peer review còn cần bằng chứng độc lập trước DONE toàn BE1. Đợt sửa không nâng dependency hoặc đổi CI để che gate chưa đạt.


### Triển khai dữ liệu cũ và bằng chứng trong đợt sửa

Cần migrate **trước API mới**: sau ba migration hiện có, chạy `npm run db:migrate:deploy` để áp [`20261025073000_be1_normalize_text`](../prisma/migrations/20261025073000_be1_normalize_text/migration.sql). Đây là additive data migration, không thay cấu trúc schema. Trình tự rollout: dừng API/worker cũ và mọi writer liên quan → migrate deploy → khởi động API/worker mới; không cho writer cũ ghi trong hoặc sau backfill để tránh tái đưa NFD vào dữ liệu. Một DO nguyên tử trim đúng ECMAScript whitespace rồi NFC cho ordinary text full_name/company/Job; NULL giữ nguyên, chỉ hàng đổi tăng version/updated_at. Giữ status/deadline/publication/close timestamp, password/session/token và BE2 snapshots; FE phải tải lại nếu version cũ trả 409. Overflow/constraint rollback toàn DO, không truncate; cần xử lý dữ liệu lỗi có kiểm soát. Publish cũng normalize draft legacy trước kiểm completeness/ghi publication. Lượt này chỉ chạy migrate trên PostgreSQL local disposable, không áp DB dùng chung.

Snapshot kiểm tra trước khi bổ sung migration legacy: 43 suites/366 unit, coverage cấu hình 91,60% lines/77,01% branches; integration 15 suites/123 tests đạt sau khi chỉnh hook setup 30 giây (lần đầu 5 failure do setup); workspace lint/build/typecheck/public contracts đạt; evidence-tool 8, DB guard 3 và migration smoke đạt. Những số này **chưa xác minh các thay đổi migration/legacy publish mới nhất**; xem sổ tiến độ cho kết quả cuối sau rerun. Audit vẫn 16 vulnerability, gồm 7 High/2 Critical; không dùng các gate local để tuyên bố release hoặc CI hosted đã đạt. FE tests và migration/legacy regression đang được root tổng hợp, không tự ghi số pass.
