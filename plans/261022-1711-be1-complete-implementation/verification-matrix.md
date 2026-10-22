# Ma trận kiểm chứng và điều kiện nghiệm thu BE1

## Trạng thái

Các ca ứng dụng dưới đây **chưa chạy** trong lượt lập kế hoạch, coverage **chưa đo**; tên file/lệnh là đầu ra dự kiến khi triển khai. Không lấy TC/EC trên giấy hoặc HTTP200/bootstrap trống làm evidence. Mỗi run ghi branch/commit thật (working tree thì ghi diff), user/AI/giờ Asia/Saigon, versions/image digest/environment/machine/network, pass/fail/error/skipped, artifacts và lỗi còn mở. Không bịa SHA/URL CI/số đo.

## Truy vết chính

| Pha/chủ sở hữu | UC/FR/BR | TC/EC | Assertion bắt buộc |
|---|---|---|---|
| 1 BE1+BE2/BE3/FE | 5 UC; CONTRACT-01 | Contract tương ứng các ca dưới | A01–A15 rõ; Tx/Actor một nguồn, DTO/event schema/fixtures/canonical locks |
| 2 BE1; DB coord BE2 | Nền API/Identity; BR15/18/20 | TC31/32, schema checks | Email normalized UNIQUE/role/expiry/FK SQL; runtime role; DTO error envelope/redaction |
| 3 BE1 + BE2 profile/BE3 mail | UC04 FR01; BR15/18/20 | TC26/31–34; EC19/20/23 | Register atomic profile; tokens purpose/use/expiry, sessions reset/lock, BCrypt hash race, CSRF/Origin/429 |
| 4 BE1 + BE2/BE3 | UC11 FR02; BR01/05/15 | TC35/36; EC17/21/22 | Code UNIQUE/company+owner atomic; owner/membership versions; candidate conflict/ordinary schedule unresolved |
| 5 BE1 + BE2 | UC01/05 FR02/03/04; BR01–04/18/19 | TC01–04/25; EC34/37/38; phối hợp TC12 EC29 | Publish completeness/edit graph/version, salaryNULL, deadlineDB afterlocks, list/detail/total scope, submit vs close/suspend |
| 6 BE1 + BE3 | UC10 FR15; BR15/16/20 | TC55–57; EC21–24 | ADMIN không CV/phiếu, lastADMIN serialize, lastOWNER security/recovery, suspend/lock revoke intents atomic |
| 7 cả3BE | NFR04/05/08/10 | Ca trên + TC12/43/56/59, EC17/22/24/29/32–34/38–40 | Cross-module UoW rollback, barrier concurrency, secret/PII leak, ordinary vs security rights |
| 8 BE1 CI coord, BE3 OPS coord | NFR02/04–06/08–10 | TC29/30/60, phối hợp TC28/57/59 | CI evidence/negative controls, coverage, load/restore/provider/clean setup/runbooks |

TC36 là bảo vệ OWNER cuối và quyền company; TC52 lưu/bỏ lưu thuộc BE2. TC55/59 kiểm CV, BE2 chịu API/storage chính, BE1 chịu guard/account/company policy và phối hợp nghiệm thu. TC28/Jitsi do BE3 cung cấp evidence, không mock BE1 thay thế. EC32 Audit BE3/ApplicationHistory BE2; BE1 CI/gate/runtime role tích hợp không sửa owner history.

## Test inventory dự kiến

Module unit colocated `*.spec.ts` cạnh rules/policy/service; suites khác nằm dưới `tests/{integration,api,concurrency,contract}/be1/` phù hợp loại.

| Nhóm file | Cases cần thiết |
|---|---|
| `identity-schema.spec.ts`, `company-schema.spec.ts`, `job-schema.spec.ts`, `migration-upgrade.spec.ts` | pg_constraint/pg_indexes, invalid SQL FK/UNIQUE/CHECK, nullable checks, runtime/migration roles, DB rỗng/upgrade |
| `bootstrap-contract.spec.ts`, `dto.spec.ts`, `ports.spec.ts`, `events.spec.ts` | Production global config, error/envelope/code fields, forbid spoof fields, unicode/boolean/dates, same Tx/schema |
| `auth.spec.ts`, `auth-token.spec.ts`, `session.spec.ts`, `auth-races.spec.ts` | Password9/10+UTF8 71/72/73, tokenTTL±1ms/purpose/resend, login reset hash race, idle/absolute, CSRF/multi-tab/cookies/429 |
| `company.spec.ts`, `membership.spec.ts`, `owner-admin-races.spec.ts` | create rollback, two owners leave, lastADMIN lock, recovery target identity/version, approved/member context |
| `jobs.spec.ts`, `public-job-query.spec.ts`, `job-ports.spec.ts` | Boundaries/publish/close, field allowlists, public/private/detail/total/skills, no hard headcount cap |
| `submission-lifecycle-races.spec.ts`, `membership-schedule-races.spec.ts` | submit vs close/suspend/active membership; last ACCEPT vs revoke; wait locks across deadline |
| `admin-moderation.spec.ts`, `security-revocation.spec.ts`, `last-admin.spec.ts` | state edges/reason/version, lock/suspend+same Tx generation/event, provider down, no CV privileges |
| `scope-security.spec.ts`, `redaction.spec.ts` | cross-company404/known403, no internal field/token/CV leak, parameterized SQL, private total scope |

Test mutation phải assert HTTP **và** row counts/versions/token/session/profile/membership/job/audit/outbox/revoke generation. Fault injection tại profile/history/audit/outbox chứng minh rollback nguyên tử; call provider failure ngoàiTx phải giữ commit. Ít nhất2 connection+barrier cho races, assert overlap thật; không dùng `sleep` dài hay Promise.all với mock mộtconnection.

## Ma trận auth quyền cần nghiệm thu

| Tình huống | Kết quả |
|---|---|
| Khách đọc public jobs/skills | 200/scoped data, invalid filter400; DRAFT/suspended/private404 |
| Session expired/revoked/idle/LOCKED | Không protected access; last_seen không revive phiên; logout current only/reset all |
| Origin lạ/missing theo policy hoặc session CSRF sai |403, không mutation/audit success/event |
| Candidate giả body role/company/createdBy |400 allowlist hoặc403/404 đúng scope, không privilege escalation |
| Recruiter A đọc/sửa company/job B |404, list total không chứa B |
| Member biết company nhưng không OWNER |403 cho action OWNER, không bỏ qua nhờ roleADMIN |
| ADMIN-only đoán CV/evaluation |404/403 theo read scope; không token/URL/note |
| OWNER/RECRUITER muốn evaluate |Phải global INTERVIEWER+membership+assignment theo BE3, không tự được quyền |
| Suspended company |Không public search/submit/CV/join/recruiting mutations; candidate vẫn ownread/withdraw |

Public register201 mới/202 trùng theo spec có khác biệt status; forgot/resend202 chung. Không ghi kết luận chống enumeration tuyệt đối. Password không trim/NFC, text khác normalize/codepoints. Auth encrypted material không được xuất qua admin/events/log dù là ciphertext.

## Lệnh thực thi sau khi đã code

PowerShell tại root; dùng DB test riêng. Copy env chỉ khi chưa có, không override secrets/dev DB; chuẩn bị HTTPS/proxy A05 trước browser cookie test.

```powershell
node --version
npm --version
npm ci
docker compose --env-file .env.example config --quiet
# Tạo .env local/test và bật các service theo Docs/development-setup.md.
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run typecheck
npm run lint
npm run build
npm run test:unit:ci -- --runInBand
npm run test:integration:ci
```

Targeted: `npm exec -- jest --config jest.integration.config.cjs --runInBand --runTestsByPath <test-file-thuc-da-tao>`; không chạy path chưa có rồi coi “0tests” là đạt. API test cần config global production; unit glob `apps/api/src/**/*.spec.ts`, worker/libs tương tự; integration glob `tests/{integration,api,concurrency,contract}/**/*.spec.ts` theo config hiện tại.

`typecheck/build` có toàn workspace; phần FE/BE khác chưa sẵn sàng phải ghi fail/owner/giới hạn, không exclude source để xanh. `verify:evidence`/`verify:migrations` hiện chưa có script, tạo implementation ở pha 8 cùng BE2/BE3 rồi mới thêm script/lệnh CI. `npm run test:e2e` cần app/browser/providers thực và FE owner, không chạy trên trang trống để claim E2E.

Reports cấu hình sẵn: `reports/backend/unit/junit.xml`, `reports/backend/integration/junit.xml`, `reports/backend/coverage/{lcov.info,coverage-summary.json}`; evidence BE1 bổ sung `reports/be1/`/CI artifacts kèm manifest/môi trường/commit. Không commit log secrets hoặc CV/data thật.

## Ngưỡng và bằng chứng nghiệm thu

| Hạng mục | Gate |
|---|---|
| Schema | Deploy rỗng/upgrade fixture, invalid SQL bị chặn, runtime không migrate hoặc sửa lịch sử |
| Auth/security | Cookie/HTTPS same-origin/browser thật, CAS token, reset/login/lock race, CSRF/rate/privacy assertions |
| Business | UC01/04/05/10/11 đủ success/input/error/permission/wrongstate/retry/rollback cases |
| CI | Required suites>0, failures/errors/skipped0, no focused tests; BE/FE lines≥80%, branches≥70%; negative TC60 gate đỏ đúng |
| Performance | 100VU warm-up2m/steady15m;10k jobs/100kmetadata;4vCPU/8GiB/SSD; p95≤2s/lỗi ngoài4xx hợp lệ<1%, BE3 điều phối |
| Provider | BE3 Jitsi30phiên/ít nhất29join≤10s, new join deny/active revoke≤60s; BE1 lock/suspend triggers được thử |
| Restore | DB daily/object versioning, RPO≤24h/RTO≤4h restore sạch; owner đối soát dữ liệu, auth restored-session policy có runbook |
| Handoff | Không Critical/High mở, reviewBE2→BE1 và BE1→BE3; người khác clean setup/demo được |

## Phối hợp FE và status

FE1 UI01/02 và UI03–06; FE2 UI16–18/26–28, member options UI21; skills còn dùng UI07/18. Truy vết FE01–06/08–12/26–29/39–41 và phối hợp FE24/25/34/38 khi account/company ảnh hưởng lịch/stats. Từng lát cắt xuất OpenAPI/error examples + fixtures/commit demo, không đợi code toàn BE mới bàn giao.

DOC-06 DONE chỉ là kế hoạch. UC vẫn TODO đến triển khai; một phần fake/unit thì IN_PROGRESS, thiếu runtime/provider ghi dependency/owner/điều kiện gỡ. Không tự báo kết quả trên nhánh người khác hoặc đã tích hợp main khi chưa có bằng chứng.
