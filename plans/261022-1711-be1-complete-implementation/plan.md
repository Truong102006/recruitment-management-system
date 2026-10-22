---
title: "Triển khai toàn bộ backend BE1"
description: "Kế hoạch BE1 từ nền API, danh tính, doanh nghiệp, tin tuyển dụng đến quản trị, tích hợp và CI có bằng chứng."
status: pending
priority: P1
branch: "main"
tags: [backend, database, api, auth, infra]
relatedPlans: [261022-1652-be3-complete-implementation]
blockedBy: []
blocks: []
created: "2026-10-22T10:12:42.041Z"
createdBy: "ck:plan"
source: skill
---

# Triển khai toàn bộ backend BE1

## Overview

Hoàn thành toàn bộ UC01, UC04, UC05, UC10, UC11 và hạ tầng BE1 theo báo cáo8.3. Người lập: Codex hỗ trợ BE1, chưa xác nhận tên người phụ trách; ngày22/10/2026 Asia/Saigon. **Đây là tài liệu kế hoạch, 8 pha vẫn pending; chưa code/test/coverage mới.** Source API/worker/modules/seed hiện trống, Prisma chỉ generator/datasource; không suy chức năng đã có từ file giữ chỗ hoặc kế hoạch BE3.

Phạm vi gồm 9 bảng BE1, bootstrap/security API, port cho BE2/BE3, Identity/Company/Job/Admin, DTO/OpenAPI/events, seed/test/CI và bàn giao. Không triển khai thay phần CV/Application/Interview/worker của owner khác; không thêm broker, social login, thanh toán hay lời mời user chưa có tài khoản. Không ước lượng ngày khi chưa biết năng lực/thời gian thành viên.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Contracts and cross-team integration](./phase-01-contracts-and-cross-team-integration.md) | Pending |
| 2 | [Bootstrap and identity database](./phase-02-bootstrap-and-identity-database.md) | Pending |
| 3 | [Authentication sessions and tokens](./phase-03-authentication-sessions-and-tokens.md) | Pending |
| 4 | [Companies memberships and owner recovery](./phase-04-companies-memberships-and-owner-recovery.md) | Pending |
| 5 | [Jobs publication search and skills](./phase-05-jobs-publication-search-and-skills.md) | Pending |
| 6 | [Admin moderation and security revocation](./phase-06-admin-moderation-and-security-revocation.md) | Pending |
| 7 | [Integration concurrency and API security](./phase-07-integration-concurrency-and-api-security.md) | Pending |
| 8 | [CI operations verification and handoff](./phase-08-ci-operations-verification-and-handoff.md) | Pending |

## Dependencies

| Đầu vào/đầu ra | Owner và gate |
|---|---|
| UnitOfWork/opaque Tx/IdempotencyStore; candidate-profile facade; conflict read port | BE2; chốt pha 1, cần thật cho register/membership và kiểm tích hợp |
| OutboxPort/AuditWriter + migration baseline | BE3 pha 1–2, cần sau migration Identity để producer BE1 ghi sự kiện nguyên tử |
| Membership schedule check, revoke scope/security-cancel, auth-mail worker | BE3; BE1 pha 4/6 nối BE3 pha 4/5; test provider thật để nghiệm thu revoke |
| Actor/session/CSRF/access/job ports + Identity/Company/Job migration | BE1 cung cấp sớm cho cả hai BE; không chờ hoàn thành UC10 mới xuất ports |
| OpenAPI/common error/security bootstrap và CI skeleton | BE1 điều phối; mỗi owner thêm test/contract/job của mình |

Đã quét kế hoạch BE3 đang pending và cập nhật [điểm nối hai chiều](../261022-1652-be3-complete-implementation/plan.md). Phụ thuộc qua lại ở **milestone từng pha**, không dùng `blockedBy` cấp toàn kế hoạch gây vòng chờ giả. `relatedPlans` chỉ metadata liên quan, không là gate CLI; gate chi tiết ở [blueprint](architecture-and-contracts.md). Chưa có plan BE2 để tham chiếu ID.

## Hướng dẫn cho AI agent triển khai

1. Đọc [AGENTS](../../AGENTS.md), [đặc tả](../../Docs/project-specification.md), [sổ chung](../../progress/README.md), [contract BE2](../../Docs/be2-integration-contract.md), [ghi chú](../../Docs/BE1-BE3_note.md), [setup](../../Docs/development-setup.md); báo cáo8.3 là nguồn phân công.
2. Đọc [kiến trúc/port/API/pseudocode và quyết định cần chốt](architecture-and-contracts.md), [ma trận kiểm chứng](verification-matrix.md) và từng phase liên kết ở trên. `plan.md` là mục lục vào việc, không thay thế tài liệu chi tiết.
3. Tạo nhánh BE1 trước code; ghi `IN_PROGRESS` vào progress → viết test nghiệp vụ → code lát cắt → kiểm DB/API/rollback → cập nhật đặc tả/contract/OpenAPI → ghi evidence → review. Mỗi pha có test, không dồn hết về pha 7/8.
4. Khi dependency chưa có, tiếp tục rules/unit/fixture phần độc lập; không giả migration/port production hoặc dùng Prisma repository người khác để né chặn. Phần thiếu vẫn IN_PROGRESS/BLOCKED đúng bằng chứng.
5. Thứ tự mặc định1→2→3→4→5→6→7→8. Nhận review BE2, review BE3; không tự commit/push/deploy từ yêu cầu lập kế hoạch.

## Tiêu chí hoàn thành toàn bộ BE1

- [ ] 5 UC có API đọc/ghi, schema/migration/seed, policy/rules và OpenAPI/test thực.
- [ ] Auth token/session/CSRF, reset/login/lock và OWNER/ADMIN đồng thời đúng; log/DTO không lộ bí mật.
- [ ] Company/job scope và lifecycle đúng; submit/close/suspend/membership races có PostgreSQL barrier test.
- [ ] Ports/Tx/events nối BE2/BE3 thật; security revocation không chờ event mới chặn join, provider evidence đầy đủ.
- [ ] CI/gate/coverage/migration/negative controls thực; không Critical/High mở; load/restore phối hợp có evidence.
- [ ] Người khác clean setup/demo được, review BE2 và cập nhật trạng thái tích hợp trong sổ chung.

## Kiểm tra và giới hạn

[Báo cáo rà soát kế hoạch](reports/plan-review.md). Dùng `ck:plan` và tổ chức output theo `ck:project-organization`; scaffold bằng `npm exec --yes --package claudekit-cli@4.5.2 -- ck plan create ...`. Không thay dependencies/lockfile ứng dụng. Không có Claude Task tools hoặc script set-active-plan; dùng checklist phase. Kế hoạch ở working tree `main`, chưa commit/chưa gộp main. Các snippet là blueprint, chưa phải source chạy được; A01–A15 cần chốt ở pha 1 trước triển khai phần phụ thuộc.
