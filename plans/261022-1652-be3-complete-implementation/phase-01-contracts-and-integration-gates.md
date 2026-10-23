---
phase: 1
title: 'Contracts and integration gates'
status: pending
effort: ''
---

# Phase 1: Contracts and integration gates

## Overview

Chốt interface và fixture để BE3 triển khai độc lập mà vẫn nối được BE1/BE2. Phạm vi CONTRACT-01/VIDEO-01; FR09–12/14/15, BR01/05/09–20. Đọc [blueprint](architecture-and-contracts.md) và [ma trận test](verification-matrix.md). Đây là pha triển khai tương lai, chưa bắt đầu.

## Requirements

- BE1 Actor/session/CSRF và quyền hiện hành, BE2 UoW/Tx/Application/Idempotency, BE3 Lifecycle/Outbox/Audit phải có owner rõ.
- Chốt D01–D13 trước khi code phần phụ thuộc; stub không được dùng trong production.
- Prototype video sớm để phát hiện thiếu cơ chế kiểm generation/kick; không cần chờ luồng lịch hoàn chỉnh.

## Architecture

DI theo token/interface; composition root nối adapters. Access policy BE1 được tái kiểm dưới khóa; workflow liên module nằm ngoài repository và không import vòng. Wire DTO tách domain command/port; event JSON Schema có version.

## Related Code Files

- Tạo BE3: `interview/ports/interview-lifecycle.port.ts`, `notification/ports/outbox.port.ts`, `evaluation/ports/evaluation-read.port.ts` dưới `apps/api/src/modules/`.
- Tạo: `libs/platform/{mail,video}/*.port.ts`, `contracts/openapi/be3.yaml`, `contracts/events/*.v1.schema.json`, `tests/contract/be3/{ports,events,dto}.spec.ts`, `tests/fixtures/be3/`.
- Phối hợp BE2: các port Application/UoW/Idempotency trong module sở hữu; BE1 access/job reporting ports. Không tự tạo một bản Tx hoặc Actor thứ hai.
- Sửa khi chốt contract: `Docs/project-specification.md`, `Docs/be2-integration-contract.md`, `Docs/BE1-BE3_note.md` nếu cần và `progress/README.md`.
- Không xóa source. Paths module chi tiết xem inventory blueprint.

## Implementation Steps

1. Tạo nhánh BE3, xác minh Git/dependency/Docker local; ghi hạng mục đang làm và phạm vi chưa tích hợp vào sổ chung.
2. Khóa Actor/Tx/error envelope/version/key semantics; BE2 cấp test adapter UoW và contract fixture, BE1 cấp active/suspended/locked/multi-role actors.
3. Chốt D01/D02/D11: command hủy cuối, evidence result/completion và application version. Lập test giả lập chuyển trạng thái/rollback qua port trước implementation.
4. Chốt D03/D05/D06/D08/D13: migration order, audit system principal, aggregate mapping/version, đường auth-mail bí mật và ngân sách retry ADMIN. Lập registry cho event BE1/BE2/BE3, chỉ định handler và schema từng loại; revoke work item lưu bằng Outbox, không ack trước provider.
5. Chốt D04/D07/D09/D12: wire field names, reporting snapshot/read ports, list/detail/unread DTO, absent evaluation, expire request handling. Mỗi route có ví dụ thành công/400/404/409 và fixture FE.
6. Prototype D10 trên Jitsi riêng tư: issue grant → join → đổi generation → token cũ join lại → kick session đang có. Ghi cấu hình, thời gian, khả năng provider; nếu chưa có môi trường ghi blocker UC03, tiếp tục unit/fake adapter.
7. Viết contract tests cho Tx được truyền xuyên port, không gọi adapter trước commit, candidate không có fields nội bộ; JSON schema từ chối payload có CV/token rõ/score/note.
8. Cập nhật đặc tả và contract với các quyết định đã thống nhất; ghi rõ khác biệt so báo cáo. BE1/BE2 review hợp đồng, FE1/FE2 nhận OpenAPI/fixture và error codes.

## Tests trước và sau code

Trước: test interface expectations và DTO/event fixtures. Sau: fake UoW rollback khi append lỗi; registry không bỏ sót event; output không lộ dữ liệu. Chạy typecheck và suites contract thực đã tạo. Video spike phải có evidence thật; chưa có không được đổi thành pass nhờ mock.

## Success Criteria

- [ ] D01–D13 có quyết định/owner/blocker rõ; không còn chữ ký mâu thuẫn trong đặc tả/contract/OpenAPI.
- [ ] Contract fixtures chạy được; Actor/Tx chỉ có một nguồn; Application không bị BE3 ghi trực tiếp.
- [ ] Có báo cáo spike video hoặc blocker cụ thể và điều kiện gỡ; chưa dùng mock chứng minh revoke thật.
- [ ] Registry/DTO/migration dependency đủ để mở pha 2–4; tài liệu và tiến độ được cập nhật.

## Risk Assessment

Thiếu runtime BE1/BE2: có thể làm unit/schema/fixture, nhưng integration phải chờ owner triển khai. Thiếu Jitsi hook: gate provider còn mở, không âm thầm giảm BR12. Không thêm thư viện mới trong kế hoạch; trước khi chọn SDK/phiên bản, tra tài liệu chính thức và khóa bằng lockfile.
