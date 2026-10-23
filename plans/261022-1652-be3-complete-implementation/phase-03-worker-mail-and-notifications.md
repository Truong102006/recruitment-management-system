---
phase: 3
title: 'Worker mail and notifications'
status: pending
effort: ''
---

# Phase 3: Worker mail and notifications

## Overview

Lát cắt UC15/Outbox/mail/audit operations chạy được với event fixture trước khi có lịch thật. Phụ thuộc pha 1–2; FR12/15, BR17/20, NFR08; TC24/51/58, EC25–27. Gửi auth/CV event qua handler BE1/BE2, BE3 sở hữu runtime.

## Requirements

- Lease120s, heartbeat30s, max6 claims, CAS id+status+token; retry schedule đúng đặc tả.
- Outbox DONE khi task consumer bền vững; SMTP status tách biệt, at-least-once.
- Notification list/read/unread owner scope; admin event/audit được làm sạch.

## Architecture

`OutboxDispatcher → registry → transaction tạo Notification/EmailDelivery hoặc handler task owner → ack`. Consumer task phải có đường phục hồi độc lập; không ack trước persist task. `EmailDeliveryJob → claim → current state/recipient validation → MailPort.send ngoài Tx → CAS ack`. Không reuse payload event để chứa note/evaluation/token rõ.

## Related Code Files

- Điền `apps/worker/src/main.ts`, `worker.module.ts`; tạo `jobs/{outbox-dispatcher,email-delivery}.job.ts`, `consumers/event-consumer.registry.ts`, `config/worker.config.ts`.
- Tạo dưới Notification: controllers notifications/event-operations; service notification; repositories outbox/notification/email; rules delivery-retry; DTO/mappers/policy riêng.
- Tạo AuditQueryController/Service/Policy và sanitized mapper dưới AuditModule.
- Tạo `libs/platform/mail/{mail.port,smtp-mail.adapter}.ts`, templates public allowlist; `.env.example` bổ sung config thực cần dùng không secret thật.
- Tạo module unit tests và `tests/{integration,api,concurrency,contract}/be3/` worker/notification/admin suites; `contracts/events/` và OpenAPI.

## Implementation Steps

1. Viết unit retry/jitter/temporary/permanent error và integration claim nhiều worker, stale worker CAS, crash tại các ranh giới.
2. Bootstrap worker dùng config validation/graceful shutdown: ngừng claim mới khi shutdown, kết thúc task trong timeout hoặc để lease phục hồi; không chặn event loop bằng polling liên tục.
3. Implement repository claim SKIP LOCKED transaction ngắn; mỗi claim tăng attempt; heartbeat/ack/fail kiểm token/status/lease; expired claim ở attempt6 phải FAILED theo policy, không loop vô hạn.
4. Dispatcher validate schemaVersion/type; registry không biết event chuyển lỗi quan sát được, không đánh DONE rồi bỏ. Retry lỗi tạm 10s/30s/2m/5m/15m+jitter; permanent error dừng có code sạch.
5. Tạo task/notification/delivery idempotent unique keys; kiểm crash sau persist task trước ack không nhân bản row. Sự kiện history/read model đảo thứ tự không tạo lời mời sai.
6. MailPort SMTP với timeout; Mailpit integration kiểm recipient/template/public content. Trước gửi kiểm lịch/auth token còn hợp lệ qua owner port; không log thư có token. Nếu timeout sau gửi có thể gửi lặp, ghi giới hạn đúng thực tế.
7. API GET notifications có total/unreadCount cùng user query scope; PATCH read update theo id+user, readAt chỉ gán lần đầu. Target được mở qua endpoint owner tái kiểm quyền.
8. API admin events list/detail chỉ metadata sạch; retry chỉ FAILED, reason+audit, giữ eventId. Theo D13, ADMIN mở chu kỳ mới/reset attempt_count có audit số attempt trước reset và actor/time/reason để đối soát tổng; không tự reset ở reaper. Retry không nhân bản business mutation. API audit append-only/read filter phân trang, không dump payload auth.
9. Metrics backlog/oldest age/attempts/failures/lease recovery + traceId; dùng logger/metrics adapter chung BE1, không phát triển một monitoring stack mới.
10. Bàn giao fixture FE1 UI24/FE2 UI28, OpenAPI/event schemas; chạy test và ghi report. Tác vụ scan/delete do BE2 cung cấp có contract test gọi đúng, không tự viết xử lý PDF ở BE3.

## Ma trận test

| Tình huống              | Cần thấy                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| Worker chết sau claim   | Lease hết hạn phục hồi, count đúng; worker cũ ack không đổi state |
| SMTP gửi xong crash     | Có thể thư lặp, nhưng 1 delivery/notification row                 |
| Task persist xong crash | Event retry không sinh task trùng; Outbox DONE độc lập mail SENT  |
| Event lịch/auth cũ      | Không gửi invite hủy/token đã vô hiệu; không log bí mật           |
| User B đọc/read của A   | 404; total/unread/readAt không thay đổi ngoài scope               |
| Admin retry trái state  | 409; không task duplicate; request hợp lệ có audit                |

## Success Criteria

- [ ] Worker/mail/notification/audit endpoints chạy với guards/pipes thật và Mailpit.
- [ ] TC24/51/58, EC25–27 đạt; retry không mất task hoặc vượt attempt cap.
- [ ] Candidate templates và admin APIs không lộ note/score/reason/token.
- [ ] Graceful shutdown, config, metrics, fixtures/OpenAPI và progress có bằng chứng.

## Risk Assessment

SMTP không exactly-once; không viết test đòi nhà cung cấp chỉ nhận đúng một thư khi timeout. Scan/Auth handler thiếu thì ghi dependency và giữ test fake ở mức contract, không bật fake production. Việc nhà cung cấp gửi ngoài transaction có thể đến muộn: tái kiểm state và provider idempotency khi có hỗ trợ.
