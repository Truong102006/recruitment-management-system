---
phase: 7
title: 'Integration concurrency and API security'
status: in-progress
effort: ''
---

# Phase 7: Integration concurrency and API security

## Overview

Nối BE1/BE2/BE3 thật và rà quyền/rollback/race toàn luồng sau khi từng pha đã có test riêng. Phụ thuộc pha 1–6 cùng runtime các owner. NFR04/05/08/10; TC03/04/12/26/31–36/55–59 và EC17/19–24/29/34/37–40 theo trách nhiệm.

## Requirements

- Integration PostgreSQL thật nhiều connection/barrier; assert DB/ports/side effects, không SQLite/mock thay constraint/transaction.
- API harness dùng production guards/pipes/filters; permission checks trong service không chỉ guard.
- Thiếu DB/provider/suite phải fail hoặc ghi gate chưa chạy; không noop/skip để report xanh.

## Architecture

Test suites theo owner interface, shared fixture IDs/versions và dependency manifest. Không tạo test-only SQL setter trạng thái production hoặc endpoint clock backdoor. Fault adapters throw trong Tx để chứng minh rollback; provider faults ngoài Tx không rollback security/domain đã commit.

## Related Code Files

- Tạo/hoàn thiện `tests/concurrency/be1/{auth-races,owner-admin-races,submission-lifecycle-races,membership-schedule-races}.spec.ts`.
- Tạo `tests/contract/be1/{identity-ports,company-ports,job-ports,cross-team-events}.spec.ts`, API scope/security suites, shared test fixture utilities theo owner.
- Mở rộng `tests/helpers/create-test-api.ts`, `tests/fixtures/be1/`; không bypass production guards.
- Chỉ sửa implementation khi test tìm lỗi có liên quan; cập nhật spec/contract/OpenAPI/progress cùng lượt khi behavior thay đổi.

## Implementation Steps

1. Hợp nhất fixture2 company APPROVED+1SUSPENDED, owner/recruiter/interviewer/candidate/admin, locked/unverified/multi-role; jobs draft/published/closed/expired, app statuses và lịch unresolved từ owner seed.
2. Verify opaque Tx identity xuyên register→profile→outbox/audit, membership→app conflict→interview check, admin security→revoke. Lỗi event/audit/profile rollback toàn command, no nested commit/client global.
3. Barrier race email/code normalized duplicate; update job sameVersion, owner concurrent leave/transfer, two-admin security lock, token reset/verify single-use/resend; assert row count/status/version/audit/event/token/session.
4. BE2 races submit vs close/suspend/membership activation, actual waiting lock qua exact deadline; accepted only when state/time dưới khóa hợp lệ. Rút khi suspended vẫn allowed ở BE2, search/SavedJob visibility không leak draft/company suspended.
5. BE3 races membership revoke vs ACCEPT cuối, suspend/lock vs join, security-cancel vs withdraw; active membership không bị vô hiệu sau confirmed bất hợp lệ. Revoke generation/event same Tx và provider faults không khôi phục state cũ.
6. Production API security: role/body spoof, stale cookie role, mismatched company/job IDs, admin-only vs CV privileges, known403 vs outsider404, list total/query scope, Origin/CSRF/cookie absolute/idle/locked user.
7. Property/boundary matrices UnicodeNFC/codepoints, passwords byte/no normalization, datetime offset/deadline±1ms, boolean string false, page/skills/search limits, salaryNULL/decimal precision. SQL injection parameterized; XSS payload không chạy ở FE kiểm bởi owner FE, API không ghép HTML template unsafe.
8. Forbidden sentinel tests response/log/admin event/detail: password/hash/cookie/CSRF/token/encrypted material/CV/internal evaluation không rò. E2E logged out/expired sessions không được replay grant/token từ cache hoặc idempotency response.
9. Event schemas BE1 consume BE3 runtime registry thật; auth validity/material cleanup, email timeout, revoke pending/late ack; no business success event khi error. Ghi lỗi và fix theo owner, không lặng lẽ hạ coverage/suite.
10. Cập nhật ma trận thực run theo test ID/commit/artifact, OpenAPI fixtures FE1/FE2 và gate còn thiếu. Sau sửa, chỉ chạy lại suites bị ảnh hưởng và gate đầy đủ theo thay đổi, không broaden vô hạn không lý do.

## Success Criteria

- [ ] Test xuyên owner dùng implementation thật+PostgreSQL và barrier, verify rollback/constraints/side effects.
- [ ] Scope/CSRF/auth races/admin invariants/submit lifecycle đều có evidence, không Critical/High mở.
- [ ] Event/DTO schemas và FE fixtures cùng behavior production; log redaction được kiểm.
- [x] Gate chưa chạy/thiếu runtime/provider ghi rõ, không đổi trạng thái DONE khi mới mock.

## Risk Assessment

`Promise.all` không tự chứng minh overlap; test cần connection/barrier xác nhận đang chờ/chồng Tx. Không tự sửa test expectation khác spec để xanh. NFR/API security toàn hệ thống cần owner BE2/BE3/FE xác nhận, không BE1 báo hoàn thành thay.

## Đồng bộ kiểm chứng 23/10/2026 — Codex hỗ trợ BE1

API/DB security và lock-wait barrier có evidence; runtime BE2/BE3/FE/provider chưa được chứng minh. Pha giữ IN_PROGRESS theo tiêu chí đầy đủ; không coi fake ports là runtime acceptance. Báo cáo lịch sử giữ trong sổ chung. Bằng chứng cuối xem [tiến độ](../../progress/README.md), [bàn giao](../../Docs/be1-handoff.md) và artifact local `reports/be1/final-verification.md`. Chưa commit/chưa gộp main.


## Đồng bộ sửa lỗi 25/10/2026 — Codex hỗ trợ BE1

Bổ sung regression cho OWNER khả dụng, whitespace/null rollback, NFC/code point (kể cả surrogate pair/variation selector), thứ tự publication và tên đăng ký. Baseline probe AppModule thật xác nhận 8/8 assertion thất bại; kết quả sau sửa và lệnh thực chạy được cập nhật tại sổ tiến độ, không dùng baseline làm kết quả cuối. PostgreSQL/API test với Outbox/interview double không chứng minh integration BE3, HTTPS/browser hoặc provider đạt.

Trạng thái pha: **IN_PROGRESS**. Đợt sửa trên `fix/be1-acceptance-20261025`, chưa commit/chưa gộp main. Kết quả kiểm chứng cuối xem [sổ tiến độ](../../progress/README.md); các ghi nhận 23/10 phía trên là lịch sử, không thay kết quả mới.


Cập nhật dữ liệu legacy cùng đợt: [`20261025073000_be1_normalize_text`](../../prisma/migrations/20261025073000_be1_normalize_text/migration.sql) chạy sau ba migration hiện có, trước API mới. Một DO nguyên tử trim đúng ECMAScript whitespace rồi NFC cho full_name/company/Job ordinary text; NULL giữ nguyên, chỉ hàng đổi tăng version/updated_at; giữ trạng thái/deadline/publication/close timestamp/password/BE2 snapshots. Overflow/constraint rollback toàn DO, không truncate; xử lý dữ liệu lỗi có kiểm soát. Publish draft legacy cũng normalize trước completeness. Chỉ migrate deploy local disposable đã chạy, không áp DB chung; regression legacy/migration và kết quả sau sửa cuối xem sổ tiến độ, pha vẫn IN_PROGRESS.
