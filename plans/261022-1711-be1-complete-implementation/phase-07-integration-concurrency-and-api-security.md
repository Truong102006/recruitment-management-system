---
phase: 7
title: "Integration concurrency and API security"
status: pending
effort: ""
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
- [ ] Gate chưa chạy/thiếu runtime/provider ghi rõ, không đổi trạng thái DONE khi mới mock.

## Risk Assessment

`Promise.all` không tự chứng minh overlap; test cần connection/barrier xác nhận đang chờ/chồng Tx. Không tự sửa test expectation khác spec để xanh. NFR/API security toàn hệ thống cần owner BE2/BE3/FE xác nhận, không BE1 báo hoàn thành thay.
