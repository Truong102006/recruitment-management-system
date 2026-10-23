# Kiểm chứng BE1 — 23/10/2026 00:28 Asia/Saigon

Người thực hiện: Codex hỗ trợ BE1. Nhánh `feat/be1-implementation`, HEAD tham chiếu `46b7e19`; source kiểm thử có thay đổi chưa commit, chưa gộp main. Không có PR/CI URL mới. Manifest local dùng HEAD thật để kiểm artifact, **không chứng minh thay đổi working tree thuộc commit đó**. Môi trường local Windows/PowerShell, Node24.21.0, npm11.19.0, Prisma6.19.0 và PostgreSQL thật.

| Lệnh thực chạy                                                                                                                                                            | Kết quả cuối                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run typecheck`                                                                                                                                                       | PASS backend + web                                                                    |
| `npm run typecheck:contracts:public`                                                                                                                                      | PASS                                                                                  |
| `npm run lint`                                                                                                                                                            | PASS; ignore output dist mọi workspace                                                |
| `npm run build`                                                                                                                                                           | PASS API/web/worker build; worker entry trống không chứng minh worker hoạt động       |
| `npm run db:validate`                                                                                                                                                     | PASS                                                                                  |
| Prisma generate + migrate deploy                                                                                                                                          | PASS; additive email_verified_at                                                      |
| `npm run test:unit:ci -- --runInBand`                                                                                                                                     | PASS26 suites/248 tests; lines91.88%, branches73.60%; không fail/skip                 |
| `npm run test:integration:ci`                                                                                                                                             | PASS13 suites/106 tests; không fail/skip                                              |
| `npm run test:contract:ci`                                                                                                                                                | PASS2 suites/21 tests; đã nằm trong106 integration, không cộng thành số test duy nhất |
| `npm run test:evidence`                                                                                                                                                   | PASS8 tests, gồm missing suite/failed/skipped/empty XML/coverage/commit controls      |
| `npm run evidence:manifest` + `npm run verify:evidence`                                                                                                                   | PASS local backend inventory/JUnit/coverage; không phải hosted CI                     |
| `node --env-file=.env --input-type=module -e "process.env.MIGRATION_TEST_DATABASE_URL=process.env.DATABASE_URL;await import('./scripts/database/verify-migrations.mjs')"` | PASS smoke trong schema UUID riêng, dọn schema sau kiểm; không reset DB               |
| `npm run format:check`, `git diff --check`                                                                                                                                | PASS; cảnh báo chuẩn hóa CRLF/LF không phải lỗi                                       |
| OpenAPI parse + local reference traversal                                                                                                                                 | PASS87 references                                                                     |
| Seed guard smoke bằng Node/tsx                                                                                                                                            | PASS: production bị chặn; thiếu SEED_DEMO_PASSWORD bị chặn trước DB                   |

Coverage là phạm vi cấu hình Jest hiện hữu: service/rules/policy được tính; bootstrap/config/controller/repository/adapter/DTO và một số entry loại trừ. Không mô tả91.88% là coverage toàn bộ backend.

## Hành vi đã thay đổi

- Admin canonical PATCH company/user, paged minimal lists, owner recovery, job close và interview security-cancel qua port owner; reason/version/allowlist và last ADMIN invariant dưới advisory lock + sorted account locks. Audit fault rollback account/session/token được kiểm PostgreSQL.
- Bền vững email_verified_at, verify/reset account-before-token CAS dùng DB clock, CSRF session UUID/hash nhất quán; thiếu service xác thực không chấp nhận token giả, Origin exact, log không ghi raw secret exception.
- Company/Job recheck ACTIVE verified actor và membership trong transaction theo account→company→job. Ordinary endpoints không có ADMIN bypass. Available OWNER cần ACTIVE verified. Job DTO có runtime validation chống spoofing và giới hạn truy vấn; submit dùng clock_timestamp sau locks.
- Thiếu required owner port trả503/rollback, không ghi thành công thiếu profile/event/audit. API helper có fake ports BE2/BE3 công khai; đây là test contract, không production integration.
- CI backend, inventory cố định file/tên suite, XML/coverage gate và migration smoke; setup/handoff/runbook cùng seed demo không có mật khẩu mặc định, chặn production.

## Bằng chứng local

JUnit/coverage: `reports/backend/unit/junit.xml`, `reports/backend/integration/junit.xml`, `reports/backend/contract/junit.xml`, `reports/backend/coverage/coverage-summary.json`; migration `reports/backend/migrations/result.json`; manifest `reports/backend/evidence.json`. Review/chi tiết: `reports/be1/code-review-current.md`, `reports/be1/verification-current.md`, `reports/be1/docs-review-current.md`. Thư mục reports bị gitignore; các artifact có trên máy hiện tại, không giả là đã đưa lên main/CI. Tài liệu này giữ tóm tắt để bàn giao.

## Điều kiện còn thiếu để đánh dấu DONE toàn bộ

1. BE2 profile/application/conflict và BE3 outbox/audit/interview/mail/security runtime phải được bind và kiểm cùng opaque Tx; security scope discovery/revalidation cần owner hoàn thiện. Không triển khai thay module ngoài phạm vi BE1.
2. Provider Jitsi thật: new join deny, token/kick≤60s; FE/HTTPS browser và peer review BE2→BE1/BE1→BE3. Chưa chạy do thiếu runtime/provider tương ứng.
3. Hosted GitHub CI/full negative-control runs/branch protection, FE-E2E jobs, DB runtime role permissions, historical upgrade fixture, clean clone độc lập, load TC29 và restore TC30. Chưa chạy; smoke local không thay nghiệm thu các gate này.
4. Dependency audit ghi46 vulnerability (11moderate/33high/2critical); cần xử lý/test theo owner, đặc biệt Vitest/Prisma/Jest có major upgrade. Chưa đạt điều kiện không còn Critical/High để release; không tự nâng major toàn workspace hoặc tự xuất bản.

Tám pha và UC BE1 giữ IN_PROGRESS theo tiêu chí đầy đủ. Local backend gates đã đạt; không có commit/push/deploy trong lượt này.
