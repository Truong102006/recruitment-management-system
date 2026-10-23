---
phase: 1
title: 'Contracts and cross-team integration'
status: in-progress
effort: ''
---

# Phase 1: Contracts and cross-team integration

## Overview

Chốt phạm vi, port, request/response/event và các milestone tích hợp trước khi code phần phụ thuộc. UC01/04/05/10/11; CONTRACT-01/DB-01/BE-FOUNDATION. Đọc [blueprint](architecture-and-contracts.md), [verification](verification-matrix.md) và kế hoạch BE3 liên kết từ plan chính. Pha đã hoàn thành.

## Requirements

- Chốt A01–A15 với owner, ghi rõ quyết định khác báo cáo và cập nhật đặc tả/contract khi áp dụng.
- Actor, opaque Tx/UoW duy nhất; cùng errors/DTO normalization/version semantics; contract fixtures cho BE2/BE3/FE.
- Bootstrap không tự implement worker/storage/Application; fixture chỉ dùng môi trường test.

## Architecture

Ports do owner xuất; composition root nối adapters bằng token DI. Identity cần CandidateProfileFacade BE2, admin workflows cần BE3 InterviewSecurityPort; tránh import vòng qua repository. Lát cắt baseline Identity→Outbox/Audit giải quyết phụ thuộc bootstrap/producer, không chờ Interview migration.

## Related Code Files

- Tạo `contracts/openapi/be1.yaml`, schemas event BE1 dưới `contracts/events/` và `tests/contract/be1/{ports,dto,events}.spec.ts`.
- Tạo interface `identity/ports/`, `company/ports/`, `job/ports/` dưới `apps/api/src/modules/`; path chi tiết ở blueprint.
- Phối hợp BE2 `libs/platform/database/`/profile facade/conflict port và BE3 Outbox/Audit/security ports; không tạo bản sao implementation.
- Tạo `tests/fixtures/be1/`; khi chốt, sửa `Docs/project-specification.md`, `Docs/be2-integration-contract.md`, ghi chú nếu cần và `progress/README.md`.

## Implementation Steps

1. Tạo nhánh BE1 (tên đề xuất `feat/be1-<slice>`), đọc source/Git/sổ chung; không xóa sửa hiện có. Ghi công việc IN_PROGRESS trước code.
2. Xác định file sở hữu chung: app bootstrap/common guards BE1, UoW/Tx BE2, Outbox/Audit BE3, schema theo model owner; thống nhất seed/migration thứ tự và review BE2→BE1, BE1→BE3.
3. Chốt A01/A07: full_name/name mapper, UC12 accountVersion/profileVersion và CandidateProfileFacade.create cùng Tx. Viết contract test rollback register khi facade lỗi.
4. Chốt A04–A06/A09: session cookie/CSRF GET/multi-tab, Origin khách, HTTPS same origin, BCrypt/runtime/rate-limit backend+threshold, encrypted auth material/key lifecycle. Không đưa auth secret vào event/log dạng rõ.
5. Chốt A02/03/10/13/14: membership target/versions, OWNER/ADMIN available predicates, company state permission matrix, canonical locks/advisory lock, schedule-conflict/revoke command scope và provider gate.
6. Chốt A08/A11/A12/A15: Outbox baseline, DRAFT title decision, skills ANY/ALL/normalization/decimal money, public vs private/query snapshot/report facts, idempotency theo endpoint.
7. Xuất ví dụ DTO success/error/fieldErrors cho từng UI: FE1 UI01–06; FE2 UI16–18/26–28 và company member options UI21. API outside read scope404, known thiếu action403, stale409, wrong input400.
8. Tạo fixture actors: candidate/recruiter/owner/interviewer/admin nhiều công ty, LOCKED/unverified/suspended, user có đa vai trò; candidate không được phỏng vấn chính mình, ADMIN không tự xem CV.
9. Contract tests kiểu dữ liệu/event schema/version/shared Tx, no-side-effect-before-commit, consumer registry BE3 nhận event BE1; không dùng success noop port trong runtime.
10. Bàn giao milestones đầu tiên để BE2/BE3 triển khai; tài liệu chốt ở PR riêng có decision log. Chỉ tiếp tục phần phụ thuộc khi contract rõ; phần độc lập rules/test có thể làm trước.

## Success Criteria

- [ ] A01–A15 có quyết định/owner/gate rõ; không để code tự chọn khác nhau giữa API/port/FE.
- [x] Fixture/type/interface và contract tests thực chạy được; Tx/Actor một nguồn.
- [ ] Migration baseline/roles/admin security/owner predicates/same-origin đã có đường triển khai và kiểm chứng.
- [ ] Sổ chung, spec/contract/OpenAPI nhất quán; chưa gán fixture là integration/provider đạt.

## Risk Assessment

Thiếu port BE2/BE3 không cản viết pure rules nhưng cản tích hợp register/admin. Title nullable/CSRF derive/skill ALL là đề xuất; không âm thầm áp dụng vào source trước khi chốt và cập nhật spec/test. Không cần ước lượng deadline ngày theo cảm tính; chia theo gate và bằng chứng.

## Đồng bộ kiểm chứng 23/10/2026 — Codex hỗ trợ BE1

Contract/type/fixture có source và test; còn registry BE3, scope discovery và review liên nhóm. Pha giữ IN_PROGRESS theo tiêu chí đầy đủ; không coi fake ports là runtime acceptance. Báo cáo lịch sử giữ trong sổ chung. Bằng chứng cuối xem [tiến độ](../../progress/README.md), [bàn giao](../../Docs/be1-handoff.md) và artifact local `reports/be1/final-verification.md`. Chưa commit/chưa gộp main.
