# Kiểm tra hoàn thành BE1 — 25/10/2026

## Kết luận

**BE1 chưa hoàn thành đầy đủ và đúng kế hoạch.** UC01, UC04, UC05, UC10, UC11 tiếp tục `IN_PROGRESS`. Có source, migration và nhiều test đạt, nhưng vẫn có lỗi nghiệp vụ tái hiện được và thiếu runtime liên nhóm. Không đánh DONE từ kết quả test hiện hữu.

Codex kiểm working tree nhánh `main`, HEAD `94d84c231da68428a55e5a25ce13229785c85043`. Các thay đổi FE/tiến độ đã tồn tại trước lượt kiểm tra; kết quả dưới đây thuộc working tree local, không phải chứng nhận CI mới cho HEAD. Không sửa source nghiệp vụ, DB/API/contract; không commit/push/deploy.

Nguồn đối chiếu: toàn bộ danh mục kế hoạch BE1 (plan, architecture-and-contracts, verification-matrix, 8 phase, plan-review); [đặc tả](../../../Docs/project-specification.md) BR01–04/15/18/20, UC01/04/05/10/11, mục 6–7; [báo cáo gốc](../../../Docs/Bao_Cao_SE113_Final.md) mục 8.3/8.6/8.7; các tài liệu setup/cloud, handoff/verification/runbook BE1, contract/handoff/migration BE2, ghi chú BE1–BE3, handoff FE2 và journal trong Docs. `agent-progress.md` là lịch sử; [sổ chung](../../../progress/README.md) là nguồn tiến độ. Một số handoff/phase giữ snapshot cũ; source và kết quả chạy mới được ưu tiên khi xác định đã triển khai.

## Kết quả chạy mới

Windows/PowerShell, Node 24.21.0, npm 11.19.0; dependencies có sẵn, không chạy lại `npm ci` và không nâng dependency. Docker Engine 29.4.0; PostgreSQL `postgres:17.6-alpine` trong container riêng `rms-be1-audit-20261025`, database `rms_audit`, host port 6519. Không mount volume, không dùng cloud hoặc database local chung.

| Kiểm tra thực chạy | Kết quả |
| --- | --- |
| `npm run typecheck` | PASS backend và web |
| `npm run typecheck:contracts:public` | PASS |
| `npm run build` | PASS API/web/worker; web cảnh báo chunk >500 kB; worker compile không chứng minh consumer hoạt động |
| `npm run db:validate` | PASS |
| `npm run verify:migrations` với URL test riêng | PASS deploy schema UUID rỗng, deploy lặp giữ fixture, constraints/index; script tự dọn schema |
| `npm run db:migrate:deploy` với URL test riêng | PASS cả 3 migration BE1/BE2 trên database rỗng |
| `npm run test:unit:ci -- --runInBand` | PASS **41 suites / 330 tests**, không fail/skip |
| Coverage unit hiện tại | **91,28% lines / 74,16% branches**, đạt gate cấu hình 80/70 |
| `npm run test:integration:ci`, lần 1 | FAIL: **13 suites pass / 1 suite fail; 102 tests pass / 11 fail**; hook `beforeAll` suite Jobs vượt 5000 ms, teardown cũng lỗi vì app chưa được gán |
| Cùng lệnh integration, lần 2 | PASS **14 suites / 113 tests**, không sửa code, không tăng timeout, không skip |
| `npm run test:contract:ci` | PASS **2 suites / 25 tests**; đã nằm trong 113 integration, không cộng hai lần |
| `npm run test:evidence` | PASS **8 tests**, gồm negative controls của parser/gate |
| `node --test scripts/database/test-environment.test.cjs` | PASS **3 tests** chặn DB cloud/malformed URL |
| `npm run lint` | FAIL **3 lỗi FE**: confetti.tsx:101 unused animationFrameId; todo-list.test.tsx:2 và pipeline-kanban-page.test.tsx:2 unused vi |
| `npm exec -- eslint apps/api apps/worker libs tests --max-warnings=0` | PASS phần backend; không thay kết quả lint toàn workspace |
| `npm audit --json` | Exit 1: **16 vulnerabilities: 7 moderate, 7 high, 2 critical**, toàn workspace theo lockfile tại thời điểm chạy; chưa phân tích exploitability từng package |
| [Acceptance probes bổ sung](261025-be1-acceptance-probes.cjs) | Exit 1 đúng khi còn sai lệch: **8/8 assertion nghiệm thu fail**, chi tiết bên dưới; không phải suite Jest hiện hữu |

330 unit và 113 integration là tổng backend trong config, gồm BE2 và thư viện chung, không phải số test riêng BE1. Coverage loại bootstrap/common/config, controller, repository, adapter, DTO, module/entry và public contracts theo `jest.config.cjs`; không mô tả đây là coverage toàn backend. Lần integration pass lại không xóa failure lần đầu: đây là dấu hiệu test/setup chưa ổn định khi khởi động lạnh, chưa chứng minh lỗi nghiệp vụ hoặc xác định chắc nguyên nhân timeout.

Log mới trong `reports/be1-audit-20261025/`: `typecheck.log`, `public-contracts.log`, `build.log`, `db-validate.log`, `migrations.log`, `deploy.log`, `unit.log`, `integration.log`, `integration-rerun.log`, `contract.log`, `evidence-tools.log`, `test-db-guard.log`, `lint.log`, `backend-lint.log`, `npm-audit-normalized.json`, `acceptance-probes.log/json`; bản sao JUnit/coverage đặt cùng thư mục. Đây là artifact local bị gitignore, không phải URL CI hoặc artifact đã xuất bản.

Kiểm bàn giao: `node --check` script PASS; kiểm các liên kết local trong báo cáo và progress không có link hỏng; `git diff --check -- progress/README.md` PASS. `git diff --check` toàn workspace còn báo blank line EOF ở `apps/web/src/styles/global.css:474` và `apps/web/src/test/setup.ts:27`, thuộc thay đổi FE có sẵn. Đã giữ các thay đổi đó.

## Finding có bằng chứng

### F01 — High: runtime chưa có đủ provider, đăng ký thật trả 503

Khởi tạo đúng `AppModule` và `configureApi`, không inject `TestDependencyModule`: CandidateProfile và ApplicationConflict **đã được BE2 bind thật**; Outbox, Audit, InterviewMembership, InterviewSecurity, InterviewAdmin chưa bind. POST `/api/auth/register` với dữ liệu hợp lệ nhận **503**, thay vì 201. Vì vậy không thể nghiệm thu email verification/reset qua mail thật, company creation/membership, publish/close và admin security xuyên module.

[RegisterService](../../../apps/api/src/modules/identity/services/register.service.ts:60) chủ động fail closed khi thiếu dependency; đây là hành vi bảo vệ đúng khi thiếu provider, đồng thời là blocker hoàn thành sản phẩm. [Test harness](../../../tests/helpers/create-test-api.ts:7) dùng port giả, trong đó Outbox append không ghi dữ liệu và conflict check trả false. Test harness pass không chứng minh Outbox/Audit/revoke/mail production đã hoạt động. BE3 cung cấp provider, BE1/BE2 phối hợp composition root và kiểm cùng Tx.

### F02 — High: công ty mất OWNER khả dụng vẫn tạo được tin nháp

Fixture PostgreSQL: company APPROVED, actor ACTIVE verified có membership RECRUITER; OWNER duy nhất có membership active nhưng account LOCKED. POST `/api/jobs` với session/CSRF hợp lệ vẫn nhận **201**, tạo tin mới.

[CreateJobService](../../../apps/api/src/modules/job/services/create-job.service.ts:56) chỉ gọi [JobPolicy](../../../apps/api/src/modules/job/policies/job.policy.ts:5), kiểm actor membership và APPROVED, không kiểm còn OWNER khả dụng. Trái BR15, UC10 bước 4 và phase 5 bước 3: công ty bị chặn mutation nghiệp vụ đến khi phục hồi OWNER. Publish đã có countAvailableOwners nhưng không bảo vệ đường tạo nháp; cần kiểm các đường sửa/đóng liên quan theo cùng ma trận quyền. Đây là phần BE1 có thể sửa độc lập BE3.

### F03 — Medium: cập nhật company chấp nhận trường bắt buộc toàn khoảng trắng

PATCH `/api/companies/:id` với `{name:"  ", address:"     ", version:0}` nhận **200**, DB lưu cả name và address thành `""`. Mong đợi 400 và dữ liệu/version giữ nguyên theo BR18.

[DTO](../../../apps/api/src/modules/company/dto/company.dto.ts:57) kiểm độ dài trước trim; [CompanyService](../../../apps/api/src/modules/company/services/company.service.ts:62) trim rồi ghi mà không kiểm lại chuỗi bắt buộc. Cần normalize trước validation và bảo vệ đường resubmit/create tương ứng. Probe hiện chứng minh PATCH; không suy mọi đường khác đã được test.

### F04 — Medium: Job ghi nguyên văn, chưa trim/NFC

POST `/api/jobs` với title `"  Backend engineer  "`, location `"  HCM  "`, description `"e\u0301"` lặp 100 lần nhận **201**. PostgreSQL giữ nguyên khoảng trắng và description chưa NFC. Trái BR18 và phase 7 bước 7.

[CreateJobService](../../../apps/api/src/modules/job/services/create-job.service.ts:70) chuyển DTO thẳng sang repository. PublicationRules trim để kiểm nhưng không trả văn bản đã chuẩn hóa; repository cũng ghi nguyên bản. Cần cùng quy tắc cho create/update/query và test Unicode trước/sau NFC.

### F05 — Medium: độ dài Job tính theo UTF-16 thay vì Unicode code point

Gọi rule thật `PublicationRules.validateTitle`: **5 emoji được chấp nhận**, còn **150 emoji bị từ chối**. Theo BR03/BR18: 5 code points phải bị từ chối, 150 code points hợp lệ. [Các phép `.length`](../../../apps/api/src/modules/job/rules/publication.rules.ts:43) đếm code unit sau trim; chưa NFC. Description/location có cùng mẫu code cần rà lại.

Hai assertion này kiểm rule trực tiếp, không tuyên bố đã công bố tin qua HTTP/provider. DTO và DB có thể tạo thêm sai khác ở pipeline; cần regression đi hết API sau sửa.

### F06 — Medium: thứ tự mặc định tìm việc không theo thời điểm công bố

Tạo 2 tin hợp lệ với createdAt và publishedAt có thứ tự ngược nhau; GET `/api/jobs?q=<marker>` trả tin tạo gần nhất trước, dù tin còn lại vừa công bố sau. Mong đợi published_at DESC, id theo UC05 bước 3 và TC25.

[JobQueryRepository](../../../apps/api/src/modules/job/repositories/job-query.repository.ts:124) mặc định orderBy createdAt. Cần sửa default và đồng bộ OpenAPI/DTO/FE nếu contract hiện hành đang mô tả createdAt; không thay đặc tả để hợp thức hóa test hiện tại.

## Đối chiếu 8 pha

| Pha | Đã có và kiểm được | Còn thiếu/sai để nghiệm thu |
| --- | --- | --- |
| 1 Contract | Actor/Tx/ports, OpenAPI/event schema và contract tests chạy được; BE2 profile/conflict runtime đã bind | Registry/consumer BE3, security scope discovery/revalidation, chốt/review liên nhóm A01–A15 và ví dụ FE nhất quán; tài liệu cũ chưa phản ánh hết binding BE2 mới |
| 2 Bootstrap/DB | Nest pipeline, Identity schema, constraints; 3 migration BE1/BE2 deploy DB rỗng và smoke đạt | Runtime/migration role permissions, lịch sử upgrade từ release cũ; chưa đủ schema/index/constraint scenarios của ma trận chỉ từ smoke |
| 3 UC04 Auth | Register/token/session/reset/login rules; API/DB/CAS/rollback tests hiện có pass lần chạy cuối | F01; mail consumer/material cleanup/key lifecycle thực, BCrypt benchmark, HTTPS browser/multi-tab và cross-owner atomic profile/outbox thực |
| 4 UC11 Company | Tạo company/membership, scope/version/owner concurrency/recovery có code và test | F01/F03; audit nguyên tử, application-conflict và interview checks với provider thật; membership-vs-submit/confirm barrier liên nhóm |
| 5 UC01/05 Job | Draft/update/publish/close/search/skills và ports đã có; API/lifecycle tests pass | F02/F04/F05/F06; publish/close Outbox runtime, audit; submit-vs-close/suspend và publish-vs-suspend đầy đủ; load/query plan/FE |
| 6 UC10 Admin | Canonical PATCH, minimal reads, last ADMIN serialization và rollback PostgreSQL | F01/F02; scope discovery/canonical locks xuyên interview, generation/revoke intent thật, provider join-deny/kick ≤60s, audit/event read/retry BE3 |
| 7 Integration/security | 113 integration/API/concurrency/contract đạt lần cuối với PostgreSQL thật; nhiều BE3 port vẫn là double | Không có full BE1–BE2–BE3 integration, provider/privacy/browser toàn luồng; F02–F06 chưa được suite cũ bắt; cold-start timeout cần xử lý |
| 8 CI/operations/handoff | Backend workflow, XML/inventory/coverage gate, migration smoke, seed/runbooks; 8 evidence-tool tests pass | Lint toàn workspace đỏ; audit còn High/Critical; CI chưa có jobs FE/E2E trong needs; hosted negative controls/branch protection, clean setup độc lập, DB roles, load TC29/restore TC30/provider và peer review chưa được kiểm trong lượt này |

Tất cả 8 pha vẫn **IN_PROGRESS theo toàn bộ tiêu chí**, không có tỷ lệ % hoàn thành được xác nhận. Không gán trách nhiệm implement worker/Jitsi/Outbox của BE3 cho BE1; đây là điều kiện phối hợp bắt buộc để nghiệm thu BE1 theo kế hoạch đã giao.

## Tái chạy và bước tiếp theo

Script probe dùng build thật, `AppModule` thật, PostgreSQL thật, session/Origin/CSRF thật; không inject Outbox/Audit/Interview fake. Chỉ phần Unicode gọi rule trực tiếp. Fixture được tạo bằng Prisma để cô lập điều kiện kiểm tra, không phải endpoint backdoor. Script chỉ cho phép DATABASE_URL loopback với database tên `rms_audit`, xóa đúng các row fixture của nó trong finally; container test của lượt kiểm tra được dừng sau khi thu thập bằng chứng.

Từ root, tạo PostgreSQL disposable riêng và migrate; đặt DATABASE_URL/TEST_DATABASE_URL tới đó, NODE_ENV=test. Không dùng URL cloud hay database đang dùng chung. Sau `npm run build`, chạy:

```powershell
node plans/261022-1711-be1-complete-implementation/reports/261025-be1-acceptance-probes.cjs
```

Exit 1 là còn assertion nghiệm thu fail, exit 2 là lỗi setup/execution, exit 0 mới là tất cả probe đạt. Log/JSON không in cookie/password/token/URL database. Đây là script audit, không tự thêm vào CI inventory hoặc thay thế test regression chính thức.

Ưu tiên BE1 sửa F02–F06 và bổ sung regression test vào suites sở hữu; nối provider BE3 và chạy các race/rollback xuyên owner cho F01; ổn định hook/cleanup integration; phối hợp FE xử lý 3 lint errors và owner dependency xử lý High/Critical rồi chạy lại gate. Sau đó hoàn tất HTTPS/provider/load/restore/role/clean-setup/peer-review còn thiếu trước khi đổi UC sang DONE. Không có thay đổi nghiệp vụ trong lượt audit nên không sửa contract hoặc đặc tả.
