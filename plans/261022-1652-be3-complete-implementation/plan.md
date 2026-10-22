---
title: "Triển khai toàn bộ backend BE3"
description: "Kế hoạch BE3 từ contract, migration, worker đến lịch, video, đánh giá, kết quả, thống kê và nghiệm thu."
status: pending
priority: P1
branch: "main"
tags: [backend, database, api, infra]
relatedPlans: [261022-1711-be1-complete-implementation]
blockedBy: []
blocks: []
created: "2026-10-22T09:54:15.670Z"
createdBy: "ck:plan"
source: skill
---

# Triển khai toàn bộ backend BE3

## Overview

Hoàn thành UC03, UC08, UC09, UC13, UC15, UC16 và hạ tầng BE3 theo báo cáo mục 8.5. Đây là kế hoạch triển khai; **mọi pha vẫn pending**, chưa có API/test/provider đã nghiệm thu. Ngày lập: 22/10/2026, Asia/Saigon; người lập: Codex hỗ trợ BE3, chưa xác nhận danh tính người phụ trách.

Đã đối chiếu 6 file trong `Docs`, sổ tiến độ, manifest, cấu hình test và source hiện tại. API/worker/module/seed còn trống; Prisma chỉ có generator/datasource. Không có kế hoạch cũ trong `plans` trước lượt này. Không dùng kết quả setup lịch sử để xác nhận runtime hiện tại.

Phạm vi giữ đúng yêu cầu: cả 6 UC, 8 bảng BE3, MailPort/VideoPort, audit/events, worker, kiểm thử và điều phối load/restore. UC16 làm sau luồng bắt buộc. Không thêm broker, Redis, microservice hay hệ thống video tự xây. Không ước lượng ngày khi chưa biết năng lực và quỹ thời gian thành viên.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Contracts and integration gates](./phase-01-contracts-and-integration-gates.md) | Pending |
| 2 | [Database audit and outbox foundation](./phase-02-database-audit-and-outbox-foundation.md) | Pending |
| 3 | [Worker mail and notifications](./phase-03-worker-mail-and-notifications.md) | Pending |
| 4 | [Interview scheduling lifecycle](./phase-04-interview-scheduling-lifecycle.md) | Pending |
| 5 | [Video join and revocation](./phase-05-video-join-and-revocation.md) | Pending |
| 6 | [Evaluation completion and results](./phase-06-evaluation-completion-and-results.md) | Pending |
| 7 | [Recruitment statistics](./phase-07-recruitment-statistics.md) | Pending |
| 8 | [Verification operations and handoff](./phase-08-verification-operations-and-handoff.md) | Pending |

## Dependencies

1. BE1: bootstrap/Actor/session/CSRF/error envelope; account/company/membership/job access và migration nền.
2. BE2: UnitOfWork/Tx/IdempotencyStore; ApplicationPort/ApplicationResultPort; migration Application và workflow withdraw.
3. BE3 xuất OutboxPort/InterviewLifecyclePort/AuditWriter; BE1 review BE3, BE3 review BE2. Fixture cho phép phát triển độc lập, chưa thay thế integration thật.
4. Jitsi riêng tư có kiểm quyền khi join và khả năng kick/close; SMTP/Mailpit; PostgreSQL có `btree_gist`. Provider thật là gate riêng, prototype ở pha 1.
5. Đợt lập kế hoạch BE1 bổ sung [kế hoạch BE1](../261022-1711-be1-complete-implementation/plan.md) và [ma trận milestone hai chiều](../261022-1711-be1-complete-implementation/architecture-and-contracts.md). BE3 pha1–2 cung cấp Outbox/Audit cho producer BE1; BE1 pha2–5 cung cấp bootstrap/identity/company/job; BE1 pha4/6 tích hợp BE3 pha4/5 cho membership/revoke. Hai kế hoạch không đặt `blockedBy` toàn phần gây vòng chờ; gate nằm ở milestone từng pha, metadata `relatedPlans` chỉ để tra cứu. Những quyết định mới trong kế hoạch BE1 cũng chưa thay contract hiện hành.

## Cách sử dụng và thứ tự làm

Đọc [kiến trúc và code blueprint](architecture-and-contracts.md), rồi thực hiện từng pha. Pha 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 là đường thực hiện mặc định cho một BE3. Chuẩn bị provider có thể tiếp tục từ pha 1; migration Interview phải chờ BE2, còn baseline Outbox/Audit được đề xuất tách sớm sau Identity. Mỗi pha gồm lát cắt migration/API/test/OpenAPI, không dồn test về cuối.

Mỗi đầu việc: đánh `IN_PROGRESS` ở sổ chung → test nghiệp vụ trước → code → kiểm DB/API/rollback → cập nhật contract/OpenAPI → lưu bằng chứng → review. Tạo nhánh BE3 trước code (tên đề xuất `feat/be3-<slice>`); không sửa file BE1/BE2 ngoài thay đổi chung được phối hợp. Bản kế hoạch đang ở working tree `main`, chưa commit/chưa tích hợp main.

## Tài liệu chi tiết

- [Kiến trúc, quyền sở hữu, API/DTO, pseudocode và các quyết định phải chốt](architecture-and-contracts.md).
- [Ma trận kiểm thử, lệnh chạy và điều kiện nghiệm thu](verification-matrix.md).
- [Rà soát rủi ro kế hoạch](reports/plan-review.md).
- Nguồn: [đặc tả](../../Docs/project-specification.md), [báo cáo](../../Docs/Bao_Cao_SE113_Final.md), [contract BE2](../../Docs/be2-integration-contract.md), [ghi chú BE1/BE3](../../Docs/BE1-BE3_note.md), [setup](../../Docs/development-setup.md), [lịch sử](../../Docs/agent-progress.md), [sổ chung](../../progress/README.md).

## Điều kiện hoàn thành toàn bộ BE3

- [ ] 6 UC có API đọc/ghi, policy, migration/seed, OpenAPI và test thực; không ghi application trực tiếp từ BE3.
- [ ] Lịch/đổi lịch/rút/kết quả atomic; constraint PostgreSQL và test nhiều connection có barrier đạt.
- [ ] Worker retry/lease/CAS/dedupe, email lỗi không rollback nghiệp vụ; audit append-only; DTO/log không lộ nội bộ.
- [ ] Jitsi thật chặn token cũ/join mới và thu hồi kết nối theo mục tiêu; Mailpit có kiểm chứng.
- [ ] Coverage/gate, tải, restore và demo có bằng chứng theo ma trận; không còn lỗi Critical/High.
- [ ] BE1 review, hướng dẫn clean setup và runbook hoàn chỉnh; cập nhật tiến độ đúng trạng thái tích hợp.

## Trạng thái công cụ khi lập kế hoạch

Node `v24.21.0`, npm `11.19.0`; chưa chạy ứng dụng/test, coverage chưa đo. Áp dụng `ck:plan` và `ck:project-organization`. `ck` chưa có trong PATH; gói `claudekit` không cung cấp executable `ck`, nên dùng `npm exec --yes --package claudekit-cli -- ck ...` (metadata registry trả 4.5.2) để scaffold thành công. Không đổi dependency/lockfile dự án. Không có script `.claude/scripts/set-active-plan.cjs`, không tạo hook giả; không có Claude Task tools, dùng checklist trong các pha. Mọi code block là blueprint cần triển khai và kiểm thử, chưa phải source chạy được.
