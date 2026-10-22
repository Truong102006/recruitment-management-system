---
phase: 5
title: "Video join and revocation"
status: pending
effort: ""
---

# Phase 5: Video join and revocation

## Overview

Triển khai UC03 dựa spike pha1 và lifecycle pha4, tích hợp thu hồi BE1/BE2. FR10, BR12/15/16, NFR04/09; TC16–18/28, EC16/24. Pha này chỉ DONE khi provider thật đáp ứng, không chỉ unit mock.

## Requirements

- User ACTIVE, lịch CONFIRMED, actor participant, company APPROVED, membership interviewer và assignment hiện hành.
- DB time trong `[start−10m,end+30m)`, TTL≤5m và không vượt cửa sổ; grant gắn interview/user/generation.
- New join bị chặn ngay sau revoke; existing connection mục tiêu thu hồi≤60s, có metadata và cảnh báo.

## Architecture

JoinService lấy quyền/state/generation dưới transaction ngắn rồi gọi VideoPort ngoài Tx với operationId; provider online authorization phải tái kiểm quyền khi join để đóng race cancel sau cấp grant. Retry join không replay token qua IdempotencyStore. Revoke-room job nhận generation, gọi provider sau commit và CAS ack theo generation hiện hành.

## Related Code Files

- Tạo `interview/services/join-interview.service.ts`, `rules/join-access.rules.ts`, DTO grant/room access mapper.
- Tạo `libs/platform/video/{video.port,jitsi-video.adapter}.ts`, `apps/worker/src/jobs/revoke-room.job.ts`, integration config trong `infra/video/`.
- Phối hợp `AdminModule/SecurityRevocationWorkflow` BE1 và `ApplicationExitCoordinator` BE2 qua ports; không sửa repository hai owner.
- Tạo `tests/{api,contract,integration}/be3/video-*.spec.ts`; provider acceptance script/guide ở `scripts/evidence/` và `Docs/be3-video-runbook.md` khi triển khai.
- Cập nhật `.env.example`, OpenAPI và FE2 room fixtures; tuyệt đối không đưa Jitsi secret vào `VITE_*`.

## Implementation Steps

1. Viết rules unit cho chính xác đầu/cuối window và ±1ms; TTL=minimum300s/remaining, reject hết cửa sổ. API test stranger404, recruiter biết lịch nhưng không participant403, cancelled409, provider503.
2. Configure Jitsi private/auth callback hoặc hook đã chứng minh D10; kiểm actor/interview/generation/current state tại provider admission. Phải chống truy cập trực tiếp provider bỏ qua API, replay khác user/phòng/generation.
3. Implement POST join session+Origin/CSRF; đọc quyền hiện tại/DB time, issue operation grant ngoài Tx; no-store, không log room token hoặc URL đầy đủ, không suy attendance.
4. Kết nối revoke từ cancel/reschedule/withdraw với user lock/company suspend/membership/security-cancel BE1. Security cancel có thể sau start, có outcome_reason/audit và không bị quy trình membership thường chặn.
5. Trạng thái DB ACTIVE→REVOKE_PENDING generation+1 ngay trong business Tx; provider lỗi giữ pending/retry. New joins bị policy/provider chặn ngay; reapprove công ty không tự khôi phục lịch đã hủy.
6. Revoke job dùng Outbox event `interview.room_revoke_requested` làm durable work item, chỉ DONE sau provider ack/CAS generation; event cha chỉ DONE sau persist work item. Job idempotent theo interview/generation/operationId, không revoke room mới vì event cũ; CAS ack REVOKED chỉ khi generation đúng. Test crash sau event cha DONE vẫn phục hồi revoke. Nếu quá60s cảnh báo metrics/runbook, không báo UI đã xong trước provider ack; task FAILED vẫn có cảnh báo và ADMIN retry có audit theo D13.
7. API detail/UI14/15 trả roomAccessState và quyền hiển thị phù hợp, không token; FE2 retry reconnect chỉ khi còn quyền. UI26–28 nhận thông tin thu hồi đang xử lý qua contract có quyền.
8. Test cancel vs join, security-cancel/withdraw sau start, revoke khi company suspended, stale worker/event và provider timeout; assert hồ sơ/lịch đã commit giữ nguyên khi provider lỗi.
9. Nghiệm thu Jitsi thật 30 phiên, ít nhất29/30 join≤10s (loại thời gian xin quyền thiết bị theo NFR09), ghi giới hạn mẫu/mạng/cấu hình; đo deny token cũ/new join và active kick≤60s. Lưu sanitized logs và timestamps.

## Success Criteria

- [ ] API/contract tests và test revoke xuyên BE1/BE2 đạt, không bypass provider.
- [ ] Có evidence Jitsi thật cho token cũ, cancellation và active connection; còn thiếu giữ IN_PROGRESS/BLOCKED đúng lý do.
- [ ] UI metadata, provider timeout/retry/metrics/runbook và secrets config đúng.
- [ ] Không dùng token TTL/IFrame config thay bằng chứng revoke; không lấy join làm attendance.

## Risk Assessment

Jitsi deployment có thể thiếu online auth/kick API; phải dùng kết quả spike, đọc tài liệu chính thức ở thời điểm triển khai, chưa cam kết hook cụ thể đã có. Nếu không đáp ứng BR12/NFR04 thì ghi rõ blocker và phối hợp nâng adapter/provider, không giảm tiêu chí. Provider rate limits/timeout không được giữ khóa DB lâu.
