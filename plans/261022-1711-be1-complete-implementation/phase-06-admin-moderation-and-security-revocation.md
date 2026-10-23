---
phase: 6
title: 'Admin moderation and security revocation'
status: in-progress
effort: ''
---

# Phase 6: Admin moderation and security revocation

## Overview

Triển khai UC10 và nối đầy đủ security paths xuyên BE1/BE3, bảo vệ ADMIN cuối và recovery OWNER. Phụ thuộc pha 1–5, InterviewSecurityPort/Outbox/Audit BE3; provider thật cho gate revoke. FR15, BR15/16/20, TC55–57, EC21–24.

## Requirements

- ADMIN ACTIVE/verified theo predicate chốt; reason+version cho mutation, audit nguyên tử; không ADMIN cuối bị khóa/thu hồi do API thường.
- Company state graph PENDING→APPROVED/REJECTED, REJECTED→PENDING qua owner resubmit, APPROVED→SUSPENDED→APPROVED qua admin; không arbitrary PATCH.
- Khóa user/suspend company không bị ordinary schedule gate chặn; join mới deny ngay, provider revoke sau commit và UI báo pending.

## Architecture

AdminModule điều phối IdentityAdminPort/CompanyAdminPort/JobAdminPort/InterviewAdminPort trong cùng UoW; không raw Prisma bảng owner khác. Account lock/update sessions BE1; Interview lifecycle/generation/revoke intent BE3; event/Audit BE3 same Tx. Controller `/admin/audit/events` giữ ở BE3, BE1 nối guards và links schema chung.

## Related Code Files

- Điền AdminModule; tạo admin controllers companies/users/jobs/interviews, workflows moderation/security-revocation, admin policy/DTO/mappers.
- Bổ sung data commands ở Identity/Company/Job ports/services đã có; recover-owner service thuộc Company không duplicate Admin repository.
- Phối hợp BE3 scope discovery/revoke commands và metadata room access/read; không sửa InterviewRepository.
- Tạo `tests/{api,integration,concurrency,contract}/be1/{admin-moderation,security-revocation,last-admin}*.spec.ts`; OpenAPI/FE2 fixtures và guide security recovery.

## Implementation Steps

1. Viết policy table tests ADMIN vs global recruiter/owner/candidate/multi-role, locked admin actor và targets ngoài phạm vi; CV/evaluation API không tự chấp nhận ADMIN role.
2. Admin company list/detail/filter/paging, users/jobs list tối thiểu; không password_hash/session/token/material/CV/phiếu; scope/count đúng và DTO allowlist. Company history/reason phục vụ admin theo quyền, không public field leak.
3. Moderation decision transition allowlist/reason/version, approve kiểm thông tin/owner availability theo rule đã chốt; reject/suspend reason required. Call owning service + audit/outbox inTx, lỗi bất kỳ rollback không thành công giả.
4. Suspend collect affected scope qua BE3 ports trướcTx, canonical locks sorted/revalidate; setSUSPENDED và same Tx generation/revoke intent. Join/submit/publish/CV mới bị chặn; application/snapshot/history giữ; candidate vẫn đọc/rút. Không tự set mọi application terminal.
5. Lock user collect scope accounts/companies/sessions/interviews, lấy advisory Tx lock cố định cho **mọi lệnh khóa user** trước user locks, không dựa target.role từ discovery; lệnh thu hồi ADMIN nội bộ cũng lấy lock này. Kiểm lại actor vẫn admin active và count ADMIN available sau mutation≥1. Lock target+revoke sessions+video intent+audit/outbox atomic; security không vì future schedule/owner cuối mà bị chặn.
6. Hai ADMIN khóa nhau: serialize lock cố định, sau chờ kiểm lại actor/target/roles, một request không làm mất admin cuối. Role revoke nội bộ nếu có phải dùng cùng invariant/lock, không thêm public grant/revoke role endpoint ngoài spec.
7. Owner cuối bị security lock: operational company ports/query visibility thấy không owner available, chặn ngay; recovery chọn existing ACTIVE verified member qua minimal eligible-owner endpoint, promote trong Company command có reason/version/audit. Không auto unlock account hay auto approve company từ recovery.
8. Unsuspend APPROVED chỉ quyết định admin có reason/version; không reopen jobsCLOSED/khôi phục cancelled interview/access token cũ. Unlock user ACTIVE không resurrect old sessions, phải login lại.
9. Admin close job gọi JobAdminPort không xóa hồ sơ; security-cancel gọi BE3 InterviewAdminPort cho phép sau start có reason/outcome/version/revoke. Dedupe event/Audit: mỗi owner action chính xác một semantic success, không double emit từ controller/workflow/service.
10. Nối UI28 event/audit read/retry BE3 route, giữ FAILED eventId/reason/audit và retry budget D13 của BE3. Auth payload encrypted cũng không expose admin detail. Không viết provider adapter hay event retry engine thứ hai ở BE1.
11. Fault/race tests: suspend vs submit/publish/join, lock vs login/reset/verify, owner lock vs transfer, two-admin lock và role/state thay đổi giữa discovery/khóa; DB generation/revoke pending có trước worker. Provider timeout không undo security, pending>60s có cảnh báo BE3.
12. Test provider thật với BE3 new join deny/token cũ/kick≤60s; FE2 UI26–28 fixtures state/version/revoke metadata. Viết runbook emergency ADMIN ngoài ứng dụng có kiểm soát, không public backdoor.

## Success Criteria

- [ ] TC55–57 EC21–24 đúng policy và concurrency, company/admin state graph không lách được.
- [ ] Không owner cuối thường/ADMIN cuối bị mất; security owner lock vẫn thực hiện và có recovery.
- [ ] Security commit và revoke intent atomic; provider lỗi không rollback, acceptance thật chứng minh quyền phòng.
- [ ] Read/admin DTO/log sạch, owner history giữ; routes BE3 không duplicate và UI errors/fixtures đầy đủ.

## Risk Assessment

Async event đơn thuần không đáp ứng “join mới bị chặn ngay”: account/company current state + generation cần provider admission check của BE3. Không giữ DB locks chờ video call. Discovery scope nhiều company/users phải sorted và revalidate; nếu set đổi retry giới hạn, không lấy khóa user muộn gây deadlock.

## Đồng bộ kiểm chứng 23/10/2026 — Codex hỗ trợ BE1

Admin canonical PATCH, last ADMIN, sorted locks và rollback có test DB với port BE3 giả; còn actual revoke/provider/scope discovery. Pha giữ IN_PROGRESS theo tiêu chí đầy đủ; không coi fake ports là runtime acceptance. Báo cáo lịch sử giữ trong sổ chung. Bằng chứng cuối xem [tiến độ](../../progress/README.md), [bàn giao](../../Docs/be1-handoff.md) và artifact local `reports/be1/final-verification.md`. Chưa commit/chưa gộp main.
