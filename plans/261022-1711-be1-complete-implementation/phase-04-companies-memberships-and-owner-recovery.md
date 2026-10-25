---
phase: 4
title: 'Companies memberships and owner recovery'
status: in-progress
effort: ''
---

# Phase 4: Companies memberships and owner recovery

## Overview

Triển khai UC11, schema Company/Membership, company access ports và data command recovery để UC10 gọi. Phụ thuộc pha 1–3, BE2 conflict và BE3 schedule ports; FR02, BR01/05/15, TC35/36, EC17/21/22; UI16/21/26.

## Requirements

- Tạo PENDING+OWNER atomic; registration_code trim/uppercase UNIQUE; OWNER quản lý member scope, không cấp ADMIN.
- Thao tác thường không mất OWNER khả dụng cuối, không active membership cho candidate còn application mở cùng company.
- Ordinary revoke phải xử lý toàn bộ PROPOSED/CONFIRMED chưa kết thúc; security path khác ở pha 6, không bị gate thường chặn.

## Architecture

CompanyPolicy tách member management context và operational APPROVED context A14. CompanyRules/OwnerRules/MembershipRules kiểm under locks; ApplicationConflictPort BE2 và InterviewMembershipPort BE3 cùng Tx. Recovery service ở CompanyModule, ADMIN controller/policy ở pha 6, không public owner tự bỏ trạng thái suspended.

## Related Code Files

- Điền CompanyModule; tạo controllers companies/memberships; services create-company/membership/review-company/recover-owner và repositories/policy/rules/ports/DTO/mappers như blueprint.
- Thêm2 models Company/Membership vào `prisma/schema.prisma`, tạo migration SQL company, mở rộng `prisma/seeds/be1.seed.ts` và integration fixtures.
- Tạo `tests/{api,integration,concurrency,contract}/be1/{company,membership,owner-recovery}*.spec.ts`, unit policy/rules; OpenAPI và event schemas BE3.
- Phối hợp BE2/BE3 typed ports và production composition root, không trực tiếp đọc bảng application/interview.

## Implementation Steps

1. Viết rules/permission matrix test: creator recruiter verified, OWNER vs RECRUITER vs INTERVIEWER vs candidate vs ADMIN-only, PENDING/APPROVED/REJECTED/SUSPENDED, known403 vs outsider404.
2. Migration Company fields/check registration normalized/code UNIQUE, enum status/review metadata/version; Membership composite PK/company+user, permission enum/active/version and FKs. Runtime no cascade delete, indexes memberships theo user/company; invalid SQL tests.
3. CreateCompanyService transaction user active verified RECRUITER→insertPENDING→owner membership→audit/outbox. Inject lỗi giữa company/owner/event phải rollback cả; concurrent normalized code chỉ1 company. Không tin createdBy/approvalStatus/ownerId từ body.
4. GET detail/member list chỉ scope hiện tại, totals cùng predicate; owner sửa dữ liệu allowlist theo status A14; REJECTED resubmit đủ trường/version→PENDING; SUSPENDED không qua resubmit. Membership list option phỏng vấn chỉ user ACTIVE verified role INTERVIEWER/member còn hiệu lực.
5. Add member theo A02, resolve normalized email hạn chế response và không lộ directory; target đã đăng ký/verified, permissions allowlist. Grant global INTERVIEWER khi cần cùng role+membership+audit Tx; không tự cấp ADMIN hay role tùy ý.
6. Activating membership gọi ApplicationConflictPort kiểm mọi application chưa terminal tại company dưới cùng user/company locks, cạnh tranh submit phải chỉ cho kết quả hợp lệ. Không tự reject/withdraw application để thêm member.
7. Update/demote/remove/transfer đọc target+owners+company scope trước lock; canonical locks/revalidate full set, company/member versions theo A03; OwnerRules đếm owner available sau mutation và giữ≥1 ở đường thường. Promote+demote trong1 Tx, không2 request tạo khoảng trống OWNER.
8. Thu hồi hoặc thay quyền ảnh hưởng assignment gọi BE3 check toàn bộ unresolved PROPOSED/CONFIRMED trước update, chặn409 nếu chưa xử lý, metadata trả theo scope không leak lịch riêng; user lock+company lock dùng chung confirm BE3. Không chỉ filter startAt>now hoặc confirmed.
9. Implement CompanyAccessPort.assertRecruiter operational (active OWNER/RECRUITER+APPROVED+owner available) và separate member context cho sửa company/participant access; actor global role không thay permission. Owner/recruiter tham gia interview phải global INTERVIEWER và assignment riêng.
10. RecoverOwner command: ADMIN ACTIVE đã kiểm tại workflow, chọn ACTIVE verified existing member thuộc company, company/member version/reason, promoteOWNER+audit/outbox; không tự reapprove company hoặc reopen jobs/rooms. List eligible owners chỉ minimal IDs/name/permission theo A03.
11. PostgreSQL tests với barrier: hai OWNER cùng rời, transfer vs lock owner, normalized code duplicate, candidate activation vs submit và revoke vs confirm (phối hợp owner). Runtime không có owner available phải chặn operational ports dù approval APPROVED.
12. Xuất API/fixtures FE2 UI16/21/26, migrations rỗng/upgrade với dữ liệu, events v1; cập nhật tiến độ và quyết định contract khác nguồn nếu có.

## Success Criteria

- [ ] TC35/36 EC17/21/22 đạt phần UC11; atomic owner creation/transfer/recovery có DB assertion.
- [ ] Thêm member không xung đột ứng viên; ordinary revoke không để confirmed membership invalid.
- [ ] Member management đọc/sửa PENDING/REJECTED được đúng policy, operational ports vẫn chặn trạng thái cấm.
- [ ] Company/Membership migrations, ports/DTO/FE fixtures/events thực, không tự cấp quyền ngoài allowlist.

## Risk Assessment

Chỉ khóa company rồi thêm khóa owner user sẽ đảo lock order: discover/revalidate set và rollback/retry có giới hạn. Khóa security target owner cuối là ngoại lệ hợp lệ, không tự từ chối ở OwnerRules đường admin. Thay membership không được dựa global roles cached từ phiên cũ.

## Đồng bộ kiểm chứng 23/10/2026 — Codex hỗ trợ BE1

Company/membership/recovery có source, verified predicate và account locks trước company; còn application conflict/interview runtime và barrier liên nhóm. Pha giữ IN_PROGRESS theo tiêu chí đầy đủ; không coi fake ports là runtime acceptance. Báo cáo lịch sử giữ trong sổ chung. Bằng chứng cuối xem [tiến độ](../../progress/README.md), [bàn giao](../../Docs/be1-handoff.md) và artifact local `reports/be1/final-verification.md`. Chưa commit/chưa gộp main.


## Đồng bộ sửa lỗi 25/10/2026 — Codex hỗ trợ BE1

Sửa F03 tại company create/update/resubmit: trim/NFC trước validation/persistence; name 2–255, address 5–500 Unicode code point; field bắt buộc khi có mặt từ chối trắng/null, PATCH bỏ qua field vẫn giữ giá trị cũ; website/description vẫn hỗ trợ null. Regression trước sửa tái hiện 21 ca thất bại trong 23 ca mới. Interview membership provider, audit/Outbox nguyên tử và barrier xuyên BE2/BE3 vẫn chưa nghiệm thu.

Trạng thái pha: **IN_PROGRESS**. Đợt sửa trên `fix/be1-acceptance-20261025`, chưa commit/chưa gộp main. Kết quả kiểm chứng cuối xem [sổ tiến độ](../../progress/README.md); các ghi nhận 23/10 phía trên là lịch sử, không thay kết quả mới.


Cập nhật dữ liệu legacy cùng đợt: [`20261025073000_be1_normalize_text`](../../prisma/migrations/20261025073000_be1_normalize_text/migration.sql) chạy sau ba migration hiện có, trước API mới. Một DO nguyên tử trim đúng ECMAScript whitespace rồi NFC cho full_name/company/Job ordinary text; NULL giữ nguyên, chỉ hàng đổi tăng version/updated_at; giữ trạng thái/deadline/publication/close timestamp/password/BE2 snapshots. Overflow/constraint rollback toàn DO, không truncate; xử lý dữ liệu lỗi có kiểm soát. Publish draft legacy cũng normalize trước completeness. Chỉ migrate deploy local disposable đã chạy, không áp DB chung; regression legacy/migration và kết quả sau sửa cuối xem sổ tiến độ, pha vẫn IN_PROGRESS.
