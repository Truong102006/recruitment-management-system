# Ma trận kiểm chứng và điều kiện nghiệm thu BE3

## Trạng thái và cách ghi bằng chứng

Toàn bộ test ứng dụng bên dưới **chưa chạy** ở lượt lập kế hoạch; coverage **chưa đo**. Lệnh là hướng dẫn tương lai dựa trên scripts hiện có, không phải kết quả đã đạt. Mỗi execution ghi branch/commit thực, người chạy, giờ Asia/Saigon, versions/image digest, DB/service/network/machine, số pass/fail/error/skipped, report path/CI URL thực và lỗi còn mở. Khi chưa commit ghi working tree cùng diff, không tạo SHA giả.

## Truy vết theo pha

| Pha / chủ sở hữu | UC/FR/BR | TC/EC | Bộ test và assertion cần có |
|---|---|---|---|
| 1 BE3 + BE1/BE2 | 6 UC; FR09–12/14/15; BR01/09–20 | Contract liên quan các ca dưới | DTO/event schema/version, một Tx, đúng owner, fixture scope và provider spike |
| 2 BE3, BE2 điều phối DB | BR10–14/17/20; INV05–08/10/12 | TC14/15/47/48; EC12/18/25/32 | pg_constraint/index và invalid SQL; exclusion global user; FK role; lease CHECK; runtime audit append-only; DB rỗng/upgrade |
| 3 BE3 | UC15/FR12; BR17/20 | TC24/51/58; EC25–27 | Crash lease/task/mail, CAS stale worker, cap6 claims, notification/delivery unique, owner read/unread, admin sanitized retry |
| 4 BE3 + BE2/BE1 | UC08/FR09; BR05/09–11 | TC14/15/44–46; EC10–13/17 | Last ACCEPT rollback, interval adjacency, replacement old preserved, one replacement, expire, cancellation fallback, multi-company user conflict |
| 5 BE3 + BE1/BE2 | UC03/FR10; BR12/15/16 | TC16–18/28; EC16/24; phối hợp TC43/56 EC22/33 | Join ±1ms, TTL/window, auth at provider, revoked old grant, kick≤60s, suspend/lock/withdraw/security-cancel, provider503 |
| 6 BE3 + BE2 | UC13/09 FR11/12; BR09/13/14/17 | TC20/47–50; EC08/09/14/15/18/27; phối hợp EC33/40 | Attendance/evaluation race, score/note boundaries, complete vs mark, no-show đúng mốc, final immutable, result vs withdraw, rollback outbox/key/history |
| 7 BE3 + BE1/BE2 read ports | UC16/FR14; BR19 | TC53/54 EC35 | Cohort distinct/milestones/asOf snapshot; zero/null, 10/4=40%, scope/job mismatch, period≤366d, duplicate JOIN |
| 8 BE3 điều phối, từng owner cung cấp | NFR02/04–06/08–10 | TC28–30/58–60; phối hợp TC55–57/59, EC22/24/25/26/32/33/40 | Provider/load/restore/gate/negative controls, runtime security, stale lease, audit, scope/privacy toàn luồng |

TC59 thuộc CV URL, BE2 thực hiện chính; BE3 phối hợp bằng chứng theo phân công8.5. TC29/30/60 là trách nhiệm chung, không báo BE3 đã hoàn thành phần BE1/BE2 chỉ vì script của mình chạy. FR09/10/11/12/14 phải có success, invalid data, permission, wrong state, retry và rollback cases.

## Các test files dự kiến

Paths thuộc `tests/{integration,api,concurrency,contract}/be3/` và unit colocated cạnh rule/service:

| Suite | Kiểm chứng quan trọng |
|---|---|
| `schema-constraints.spec.ts`, `migration-upgrade.spec.ts` | SQL constraint/index hiện hữu và insert sai bị DB chặn; runtime role |
| `ports.spec.ts`, `events.spec.ts`, `dto.spec.ts` | Input/output/Event JSON Schema, Tx identity, forbidden candidate fields |
| `outbox-lease.spec.ts`, `email-delivery.spec.ts` | Multi-worker/reclaim/late ack, persistent task trước DONE, delivery/mail crash |
| `notifications.spec.ts`, `admin-event-operations.spec.ts`, `audit.spec.ts` | Owner query/readAt stable, ADMIN sanitized filters/detail/retry/audit |
| `interview-scheduling.spec.ts`, `interview-replacement.spec.ts` | Proposal/respond/version/expire/cancel/replacement giữ old |
| `schedule-races.spec.ts`, `withdraw-confirm.spec.ts` | Nhiều connection/barrier, overlap toàn hệ thống; không slot/history giả |
| `video-access.spec.ts`, `video-revoke.spec.ts` | Scope/time/TTL/revoke state/fault; evidence provider thật lưu riêng |
| `evaluation.spec.ts`, `completion.spec.ts` | Role FK/attendance/score/edit locking/no-show/mark-interviewed |
| `result-withdraw.spec.ts`, `result-privacy.spec.ts` | Một commit, không event giả, public DTO/email/log đúng |
| `statistics.spec.ts` | Scope/cohort/rates/snapshot và không count duplicate |

Tên và vị trí final được chốt cùng suite; không tạo hai file cùng tên khi không cần. Mỗi test mutation assert response **và** DB state/reservation/history/audit/outbox/key. Concurrency dùng ít nhất2 connection và barrier chứng minh overlap, timeout giới hạn; không dùng sleep dài. Clock fake chỉ unit; time checks integration dùng DB clock và cơ chế test có phạm vi riêng, không thêm backdoor production.

## Quy trình lệnh khi bắt đầu triển khai

PowerShell tại root; chỉ copy `.env` nếu chưa có và chỉ dùng DB test dành riêng. Không in secrets ra report.

```powershell
node --version
npm --version
npm ci
docker compose --env-file .env.example config --quiet
# Chuẩn bị .env local/test và dịch vụ theo development-setup trước các lệnh DB.
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run typecheck
npm run lint
npm run build
npm run test:unit:ci -- --runInBand
npm run test:integration:ci
```

Chạy targeted khi phát triển bằng `npm exec -- jest --config jest.integration.config.cjs --runInBand --runTestsByPath <file-thuc-da-tao>`; command global ở trên là gate cuối khi toàn source sẵn sàng. `typecheck/build` có cả frontend, lỗi phần chưa có phải ghi đúng owner/giới hạn; không chỉnh exclude để làm xanh giả. Unit glob hiện bắt `apps/api/src/**/*.spec.ts`, `apps/worker/src/**/*.spec.ts`, `libs/**/*.spec.ts`; integration glob bắt `tests/{integration,api,concurrency,contract}/**/*.spec.ts`.

Sau implementation scripts evidence/migration mới nối `npm run verify:evidence` và `npm run verify:migrations`; hiện chưa có hai scripts này. E2E `npm run test:e2e` cần web/API/worker thật và browser; phối hợp FE, không chạy rồi coi source trống là đạt.

Reports đã cấu hình: `reports/backend/unit/junit.xml`, `reports/backend/integration/junit.xml`, `reports/backend/coverage/{lcov.info,coverage-summary.json}`. Các report provider/load/restore dự kiến `reports/be3/`; CI lưu artifacts kèm manifest và commit thật. Không loại service/policy/rules khỏi coverage.

## Ngưỡng nghiệm thu

| Nhóm | Gate |
|---|---|
| Unit/CI | Backend lines≥80%, branches≥70%; suite bắt buộc tests>0, failures/errors/skipped=0; no focused tests |
| PostgreSQL | DB rỗng và upgrade fixture; constraint invalid SQL, tx rollback và concurrency barrier |
| Video | 30 phiên Jitsi thật, ít nhất29/30 join≤10s; deny new join sau revoke, active connection mục tiêu≤60s; ghi giới hạn mẫu |
| Load | 100VU, warm-up2m/đo15m, fixture10k jobs/100k metadata, máy mục tiêu4vCPU/8GiB/SSD; p95≤2s, lỗi ngoài4xx hợp lệ<1% |
| Restore | DB backup hàng ngày + object versioning; RPO≤24h/RTO≤4h; restore sạch, CV version/checksum đúng cùng owner BE2 |
| Handoff | Clean setup người khác, OpenAPI/seed/runbook/demo, review BE1→BE3 và BE3→BE2; không Critical/High mở |

## Phối hợp frontend và trạng thái

FE1: UI11/public result, UI24/notifications; FE2: UI13–15/20–23/25/28. Ca FE21/23–25/33–38/41 và phối hợp FE20/32/39/40 phải có API fixtures theo commit/lát cắt, 404/409 giữ input/refresh version, room revoke đang xử lý, note không lộ. BE3 cung cấp backend contract, FE owner thực hiện UI/a11y/viewport, không gán DONE thay họ.

Chỉ đánh UC DONE khi gate áp dụng có bằng chứng. Unit/mock hoàn thành nhưng chưa integration/provider giữ IN_PROGRESS; thiếu dịch vụ ghi blocker, owner và điều kiện gỡ. DOC-05 DONE chỉ có nghĩa kế hoạch đã viết và kiểm tài liệu.
