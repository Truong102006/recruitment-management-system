# Kiểm chứng sửa lỗi BE1 — 25/10/2026

## Kết quả và phạm vi

Codex tiếp tục từ [audit](261025-be1-completion-audit.md) theo [kế hoạch](../plan.md), AGENTS và đặc tả. **F02–F06 đã sửa và có regression; toàn BE1 vẫn IN_PROGRESS.** UC01/04/05/10/11 và cả tám pha chưa đủ gate runtime/provider/operations. Không thay provider BE3 bằng noop để tuyên bố hoàn thành.

Nhánh `fix/be1-acceptance-20261025`, base main `94d84c231da68428a55e5a25ce13229785c85043`. Mọi sửa đổi mới còn local, chưa commit/chưa gộp main; ba file audit/tiến độ có sẵn được giữ. Không push/deploy hoặc truy cập DB cloud. Review trong lượt này do AI, không thay review BE2/BE3 hay nghiệm thu con người.

## Sửa lỗi

| Finding / yêu cầu | Hành vi sau sửa | Bằng chứng |
| --- | --- | --- |
| F02; BR15; UC01/10 | Create/update/close kiểm OWNER khả dụng sau scope policy dưới khóa company trong cùng Tx; publish giữ kiểm tra. OWNER LOCKED, chưa verified hoặc membership inactive đều chặn mutation; không ghi/version/event; phục hồi OWNER cho phép tiếp tục. | `job/tests/mutation-security.spec.ts`, `tests/api/be1/jobs.spec.ts` |
| F03; BR18; UC11 | Create/update/resubmit normalize trước validation/persistence; required name/address trắng/null bị từ chối; omitted PATCH giữ cũ, website/description nullable giữ contract; lỗi không đổi row/version. | `company/tests/company-text.spec.ts`, `tests/api/be1/company.spec.ts` |
| F04/F05; BR18; UC01 | Title/description/location/close reason trim/NFC và đếm Unicode code point. Cả HTTP và service nội bộ được bảo vệ; variation selector không bị bỏ khỏi độ dài. Publish chuẩn hóa cả draft legacy dưới lock. | `job/tests/publication.rules.spec.ts`, `job/tests/services.spec.ts`, Jobs HTTP |
| F06; UC05/TC25 | Mặc định publishedAt DESC/id DESC; phân trang ổn định; explicit createdAt vẫn hỗ trợ, sortOrder có hiệu lực. q/location normalize. DTO/OpenAPI/public TS contract và compile consumer đồng bộ. | `tests/api/be1/public-search.spec.ts`, `tests/contract/public-consumer.ts` |
| Cùng lớp lỗi BR18; UC04 | fullName 1–120 code point sau trim/NFC; từ chối trắng/overflow ở DTO và direct service; không sửa password. | `identity/tests/text-validation.spec.ts` |
| Review: dữ liệu NFD cũ | Data migration chuẩn hóa dữ liệu đã lưu để query NFC vẫn tìm thấy tin cũ; publish không giữ raw NFD legacy. | `tests/integration/be1/text-normalization-migration.spec.ts`, Jobs unit/HTTP |

Source sửa trong `apps/api/src/modules/{company,identity,job}/`, helper `apps/api/src/common/validation/text.ts`, query repository, contracts và các test nêu trên. Inventory `scripts/evidence/required-suites.json` bắt buộc cả bốn suite mới, không chỉ chạy tùy chọn. Đặc tả/contract/handoff/journal và plan/tám phase đã đồng bộ.

## Chuyển đổi dữ liệu cũ

Migration mới: [`20261025073000_be1_normalize_text`](../../../prisma/migrations/20261025073000_be1_normalize_text/migration.sql), sau ba migration hiện có. Một DO nguyên tử trim đúng tập whitespace của ECMAScript rồi NFC cho full_name, văn bản company và title/description/location/close_reason của job. NULL giữ nguyên; chỉ row thay đổi tăng version và updated_at. Giữ password, trạng thái, publication/close/deadline, quan hệ và BE2 candidate snapshot.

Rollout phải dừng API/worker/writer cũ, migrate deploy rồi khởi động bản mới. Không cho writer cũ tái ghi NFD sau backfill. Client version cũ có thể nhận 409 và cần tải lại. Nếu NFC expansion hoặc dữ liệu lịch sử vi phạm giới hạn/constraint, toàn DO rollback, cần xử lý dữ liệu có kiểm soát; không truncate. Lượt này chỉ deploy database disposable riêng, chưa áp migration DB chung.

Regression dùng schema UUID riêng, migrate rỗng rồi đưa legacy fixture vào và chạy đúng SQL backfill: kiểm dữ liệu/version/timestamp, tính idempotent, snapshot/mật khẩu/trạng thái giữ nguyên, HTTP tìm tin đã chuyển đổi và rollback toàn bộ khi U+0344 nở vượt varchar. Đây là kiểm populated backfill, chưa chứng minh mọi historical release upgrade hoặc runtime DB permissions.

## Kiểm tra thực chạy

Windows/PowerShell, Node24.21.0/npm11.19.0, PostgreSQL17.6-alpine trong container `rms-be1-fix-20261025`, loopback port6520, database disposable `rms_audit`, không volume. Không dùng URL/cloud DB có sẵn. Dependencies/lockfile không nâng trong lượt này.

| Lệnh | Kết quả cuối | Artifact local trong `reports/` |
| --- | --- | --- |
| `npm run test:unit:ci -- --runInBand` | PASS43 suites/**368 tests**, không fail/skip | `be1-fix-unit-final.log`, `backend/unit/junit.xml` |
| Coverage unit tập cấu hình | **91,61% lines / 77,56% branches**, gate80/70 đạt | `backend/coverage/coverage-summary.json` |
| `npm run test:integration:ci` | PASS16 suites/**126 tests**, không fail/skip; có3 legacy migration tests | `be1-fix-integration-final.log`, `backend/integration/junit.xml` |
| `npm run test:contract:ci` | PASS2 suites/**25 tests**, đã nằm trong126 integration, không cộng hai lần | `be1-fix-contract-final.log`, `backend/contract/junit.xml` |
| `npm run test:web:ci` | PASS30 files/**124 tests**; lines84,21%/branches78,19% tập cấu hình | `be1-fix-web.log` |
| `npm run typecheck` | PASS backend/web sau sửa publish | `be1-fix-typecheck-final.log` |
| `npm run typecheck:contracts:public` | PASS canonical search + negative compile case | `be1-fix-public-types-final.log` |
| `npm run lint` | PASS toàn workspace | `be1-fix-lint-final.log` |
| `npm run build` và build API sau sửa publish | PASS API/web/worker; Vite cảnh báo chunk lớn hơn500kB | `be1-fix-build-final.log`, `be1-fix-api-build-final.log` |
| `npm run db:migrate:deploy` | PASS4 migrations local | `be1-fix-migrate-final.log` |
| `npm run verify:migrations` | PASS DB schema cô lập rỗng/lặp/constraint/index/BE2 fixture | `be1-fix-migration-smoke-final.log` |
| `npm run db:validate` | PASS | `be1-fix-db-validate.log` |
| `npm run test:evidence` | PASS8 tests, gồm negative controls parser/gate | `be1-fix-evidence-tools-final.log` |
| `node --test scripts/database/test-environment.test.cjs` | PASS3 tests | `be1-fix-dbguard.log` |
| `npm run evidence:manifest`, `npm run verify:evidence` | PASS required inventory/JUnit/coverage; manifest gắn HEAD base thật, source chạy là working tree chưa commit, không phải CI cho commit đó | `be1-fix-evidence-final.log`, `backend/evidence.json` |
| Prettier check phạm vi source/test/contracts sửa và `git diff --check` | PASS sau format3 file mới | `be1-fix-format-final.log` |
| `npm audit --json` | Exit1: **16 vulnerability**, 7Moderate/7High/2Critical, chưa nâng dependency hoặc phân tích exploitability | `be1-fix-audit.json` |
| Probe gốc AppModule/HTTP/PostgreSQL | **6/8 PASS**, exit1 vì F01 vẫn mở | `be1-fix-probes-final.log` |

Các con số unit/integration bao gồm BE2 và thư viện chung. Coverage BE loại common/config/DTO/repository/controller/adapter/module/entry theo cấu hình hiện tại, không phải toàn backend. Artifact `reports/` bị gitignore, chưa xuất bản CI. Manifest local không chứng minh working tree đã tích hợp main.

Kiểm tra bàn giao cuối: 42 liên kết local mới hợp lệ;5 link media thiếu từ trước giữ nguyên. `git diff --check` đạt. Đã xác minh không còn schema `be1_text_*`/`be1_verify_*` rồi dừng/xóa đúng container test riêng; giữ logs/JUnit/coverage. Không dừng container hoặc sửa DB chung.

### Baseline và thất bại trung gian được giữ

- Build/migrate trước sửa rồi probe gốc: **0/8 PASS**; log `be1-fix-probes-baseline.log`.
- Regression đỏ trước sửa: Company21/23 fail; Job4/28 fail; Search3/5 fail; Auth6/6 fail. Sau đó từng nhóm và full suite đạt. Company/Job được ghi nhận qua output lệnh của worker trong phiên; Search/Auth có log `be1-fix-search-before.log`/`be1-fix-auth-before.log`.
- Full integration đầu:118 pass/5fail do hook setup public-search vượt5000ms. Không kết luận thành phần khởi tạo chậm khi chưa có đo chi tiết. Jobs và Search cấp30s riêng hook; migration CLI/fixture cấp60s riêng setup; assertion nghiệp vụ vẫn5s. Helper/teardown đóng tài nguyên khi init lỗi. Full cuối126/126 đạt.
- Migration regression đầu lỗi fixture thiếu `headline:null`, bị `ck_application_snapshot` từ chối; sửa fixture đủ bốn key, không nới constraint. Publish unit có một expected fixture NFD150/10 không khớp, đã sửa expected10 theo dữ liệu hợp lệ của varchar150. Không che thất bại bằng skip.
- Lint đầu bắt helper API mới bị newline trước `[method]`; sửa helper và chạy lại toàn workspace đạt. Format đầu thấy3 file mới chưa định dạng; đã format/check lại đạt. Các lint FE của audit trước đồng bộ không tái hiện trên main94d84c2 hiện tại.

## Phần chưa hoàn thành

F01 vẫn xác minh bằng AppModule thật: BE2 CandidateProfile/ApplicationConflict đã bind; thiếu Outbox/Audit/InterviewMembership/InterviewSecurity/InterviewAdmin. Register hợp lệ vẫn503. Probe fail hai assertion này là đúng thực trạng, không coi exit1 là toàn bộ nghiệm thu đạt.

BE3 cần cung cấp/bind transactional providers/worker/mail/security và cùng BE1/BE2 kiểm rollback/barrier/runtime. Còn HTTPS/browser/E2E thật, provider join/revoke, DB runtime roles, historical release upgrade tổng thể, loadTC29/restoreTC30, clean setup độc lập, hosted negative-controls/branch checks và peer review. Audit còn High/Critical nên chưa đạt release gate. Tám phase và năm UC giữ IN_PROGRESS; [sổ chung](../../../progress/README.md) là trạng thái chính thức.
