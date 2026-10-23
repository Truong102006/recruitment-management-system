---
phase: 2
title: 'Database audit and outbox foundation'
status: pending
effort: ''
---

# Phase 2: Database audit and outbox foundation

## Overview

Hiện thực 8 bảng BE3, audit append-only và OutboxPort đủ để producer BE1/BE2 dùng trong Tx. Phụ thuộc pha 1 và migration nền của owner tương ứng. Truy vết INV05–08/10/12, BR10–14/17/20, DB-01/WORKER-01.

## Requirements

- UUID/timestamptz/version và field dictionary theo đặc tả mục 5; FK mặc định RESTRICT.
- Không copy SQL đã escape Markdown trực tiếp (`\[)`/`\>` phải thành SQL đúng).
- Ràng buộc nâng cao phải có migration SQL thực; thiếu `btree_gist` là lỗi setup, không bỏ exclusion.

## Architecture

Migration A (đề xuất D03): Outbox + Audit sau user_account; Migration B: Interview/Participant/Reservation/Evaluation sau Application; Migration C: Notification/Email sau User+Outbox. Timestamp cụ thể do BE2 điều phối khi tạo; không bịa migration đã chạy. Deploy test có thể chạy cả chuỗi nhưng merge baseline sớm để producer không đợi Interview.

## Related Code Files

- Sửa `prisma/schema.prisma` chỉ model/enum sở hữu BE3; tạo `prisma/migrations/<timestamp>_be3_<slice>/migration.sql`.
- Tạo `prisma/seeds/be3.seed.ts`, phối hợp nối `prisma/seed.ts` (đang trống) với seed của BE1/BE2.
- Điền AuditModule; tạo `audit/services/audit-writer.service.ts`, `audit/repositories/prisma-audit.repository.ts`, `notification/repositories/prisma-outbox.repository.ts`.
- Tạo `tests/integration/be3/{schema-constraints,audit-outbox-transaction,migration-upgrade}.spec.ts`, `tests/fixtures/be3/`.

## Implementation Steps

1. Viết integration assertions trước: `pg_constraint/pg_indexes`, invalid INSERT/UPDATE/DELETE, DB rỗng và upgrade fixture.
2. Tạo model Outbox/Audit, indexes polling; implement `AuditWriter.append` và `OutboxPort.append` chỉ nhận Tx. Fault injection sau business write chứng minh append lỗi rollback caller.
3. Tạo Interview: status enum, duration15–120m, unique room_key, replacement FK không tự trỏ, partial unique replacement PROPOSED, generation≥0, nullable CHECK xử lý NULL tường minh.
4. Participant: PK(interview,user), unique(interview,user,role), partial unique đúng một CANDIDATE; service sau này kiểm đúng chủ hồ sơ và ít nhất một INTERVIEWER khác candidate. Attendance metadata/reason/version hợp lệ.
5. Reservation: FK ghép participant, `[start,end)` GiST exclusion theo **user toàn hệ thống**, chỉ active `released_at IS NULL`; release reason bắt buộc khi released. CHECK end>start, giữ history thay vì DELETE.
6. Evaluation: unique(interview,interviewer), FK ghép role INTERVIEWER; scores integer1–5, note1–5000 code point, recommendation allowlist, version≥0.
7. Notification unique(user,event), EmailDelivery unique(event,user,template), recipient snapshot; CHECK status/lease_token/locked_until/attempts phù hợp. Tạo indexes history calendar/polling/query owner với id tie-break.
8. Append-only Audit: quyền runtime không UPDATE/DELETE, trigger bảo vệ theo đặc tả; migration role khác runtime role. Kiểm runtime role thực bị chặn, không chỉ kiểm owner DB.
9. Seed tổng hợp hai công ty approved+một suspended, các actor/role và lịch nhiều trạng thái dựa dữ liệu owner seed; không tạo migration fake bảng BE1/BE2 để né dependency.
10. Chạy validate/generate/deploy DB test rỗng, upgrade fixture có dữ liệu; kiểm constraints bằng insert sai và rollback; cập nhật đặc tả/OpenAPI nếu shape liên quan, lưu bằng chứng.

## Ma trận test

| Test         | Assertion chính                                                 |
| ------------ | --------------------------------------------------------------- |
| EC18         | Candidate không insert được evaluation, kể cả SQL trực tiếp     |
| TC14/15 EC12 | 15/120m hợp lệ, overlap bị DB chặn, lịch nối tiếp hợp lệ        |
| EC11/17      | Chỉ một replacement PENDING dạng PROPOSED, một candidate/lịch   |
| EC25/32      | CHECK lease/state; audit runtime append-only                    |
| Rollback     | Lỗi Outbox/Audit rollback business mutation; không event mồ côi |

## Success Criteria

- [ ] 8 bảng/FK/index/CHECK đầy đủ, invalid SQL bị chặn đúng constraint.
- [ ] DB rỗng và upgrade fixture đều đạt; migration không sửa lịch sử đã áp dụng.
- [ ] Port nhận cùng Tx; Audit/Outbox có test rollback; runtime role append-only được xác minh.
- [ ] Seed tái lập và chạy phối hợp với owner; sổ tiến độ ghi kết quả thực.

## Risk Assessment

Schema chung dễ conflict: sửa model theo owner, giữ mọi tiến độ khi merge, không format/rewrite toàn schema. FK và service bảo vệ khác nhau: DB không tự chứng minh reservation đủ hoặc membership hiện hành; kiểm service/reconciliation ở pha 4. Không chạy migration vào DB có dữ liệu thật trong kiểm thử.
