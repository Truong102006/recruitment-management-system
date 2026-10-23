# Kiến trúc và code blueprint BE3

## Cơ sở thiết kế

Ưu tiên `Docs/project-specification.md` và contract BE2 hiện hành; báo cáo gốc giữ nguyên. Tài liệu này đề xuất chi tiết cho triển khai; chưa thay thế contract đã chốt. Các đề xuất trong bảng quyết định phải cập nhật vào đặc tả/contract/test trong PR pha 1 trước khi bên tiêu thụ dùng.

Chọn modular monolith NestJS + worker dùng lại service/port; PostgreSQL Outbox là hàng đợi bền vững. Giữ controller → service/workflow → repository theo mục 4. Không thêm tầng generic repository hoặc event bus chỉ để đủ mẫu. Rules là hàm thuần khi có thể; class chỉ khi cần DI, adapter hoặc gom một trách nhiệm có test riêng.

```text
FE1/FE2 → API bootstrap BE1 → controller → policy + DTO mapper
                                           ↓
                               service/workflow BE3
                     ┌─────────────────────┼─────────────────────┐
                     ↓                     ↓                     ↓
             BE1 access ports     BE2 Application ports   repository BE3
                     └──────── UnitOfWork/Tx BE2 ─────────────────┘
                                           ↓
                    PostgreSQL: business + history + audit + outbox
                                           ↓ sau commit
                  worker → durable notification/email/revoke/scan task
                                           ↓ ngoài DB transaction
                      MailPort / VideoPort / BE2 scan-storage handler
```

Worker bootstrap tạo application context và chỉ import các module nghiệp vụ cần dùng; không mở HTTP server API hoặc chạy controller/guard trong worker. Shared domain service phải gọi với system principal có purpose/scope rõ, không giả mạo user ADMIN. Composition root nối token provider; tránh `forwardRef` để che vòng Application ↔ Interview.

## Sở hữu và inventory code

Các đường dẫn dưới đây là tương đối với root repository. Tên file mới là thiết kế dự kiến, không khẳng định đã tồn tại. Không xóa file sản phẩm ở đợt lập kế hoạch.

| Khu vực          | File giữ chỗ cần điền / file dự kiến tạo                                                                                                                                                                                                                            | Trách nhiệm                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Interview        | `apps/api/src/modules/interview/interview.module.ts`; `controllers/interviews.controller.ts`, `services/{propose-interview,respond-interview,reschedule-interview,cancel-interview,join-interview}.service.ts`                                                      | UC08/UC03, orchestration một transaction                              |
| Interview rules  | `policies/interview.policy.ts`, `rules/{schedule,join-access}.rules.ts`, `repositories/{interview,prisma-interview}.repository.ts`, `ports/interview-lifecycle.port.ts`                                                                                             | Scope, time window, reservation, cancellation/revocation              |
| Evaluation       | `apps/api/src/modules/evaluation/evaluation.module.ts`; `controllers/{evaluations,interview-completion,results}.controller.ts`; `services/{evaluate,record-attendance,complete-interview,mark-interviewed,publish-result}.service.ts`                               | UC13/UC09; application ghi qua BE2                                    |
| Evaluation rules | `rules/{evaluation,attendance,completion,result}.rules.ts`, `policies/evaluation.policy.ts`, `repositories/prisma-evaluation.repository.ts`, `ports/evaluation-read.port.ts`                                                                                        | Phiếu riêng tư; completion/result evidence                            |
| Notification     | `apps/api/src/modules/notification/notification.module.ts`; `controllers/{notifications,event-operations}.controller.ts`, `services/notification.service.ts`, `repositories/{prisma-outbox,prisma-notification,prisma-email}.repository.ts`, `ports/outbox.port.ts` | Outbox/delivery/notification và admin event operations                |
| Audit            | `apps/api/src/modules/audit/audit.module.ts`; `controllers/audit-query.controller.ts`, `services/{audit-writer,audit-query}.service.ts`, `policies/audit-read.policy.ts`, `repositories/prisma-audit.repository.ts`                                                 | Writer dùng chung và API audit đã làm sạch                            |
| Reporting        | `apps/api/src/modules/reporting/reporting.module.ts`; `controllers/statistics.controller.ts`, `services/recruitment-statistics.service.ts`, `rules/cohort.rules.ts`, `policies/reporting.policy.ts`                                                                 | Tổng hợp qua read ports BE1/BE2; không lấy repository nội bộ          |
| Integration      | `libs/platform/mail/{mail.port,smtp-mail.adapter}.ts`, `libs/platform/video/{video.port,jitsi-video.adapter}.ts`; domain DTO/mappers ở module tương ứng                                                                                                             | Adapter ngoài DB, timeout, redaction                                  |
| Worker           | `apps/worker/src/{main,worker.module}.ts`; `jobs/{outbox-dispatcher,email-delivery,expire-proposals,revoke-room}.job.ts`, `consumers/event-consumer.registry.ts`, `reconciliation/reservation-reconciliation.ts`                                                    | Scheduler/polling, graceful shutdown, lease/reconcile                 |
| Shared, phối hợp | `libs/platform/database/`, `libs/platform/clock/`, `apps/api/src/app.module.ts`, `prisma/schema.prisma`, `.env.example`, workspace build config                                                                                                                     | BE2 sở hữu UoW/Tx; BE1 bootstrap; BE3 chỉ nối DI/config đã thống nhất |
| Contracts/tests  | `contracts/openapi/be3.yaml`, `contracts/events/*.v1.schema.json`; module `*.spec.ts`, `tests/{integration,api,concurrency,contract}/be3/`                                                                                                                          | Request/response/event schemas; test thật                             |

BE3 sở hữu 8 bảng: Interview, Participant, Reservation, Evaluation, OutboxEvent, Notification, EmailDelivery, AuditLog. BE1 sở hữu Identity/Company/Job/Skill và admin mutations. BE2 sở hữu Application/History/CV/Idempotency; BE3 tuyệt đối không `update` trực tiếp các bảng đó. AuditQueryController/EventOperationsController do BE3 cung cấp dưới `/admin`, cùng guard/policy BE1; không tạo route trùng ở AdminModule.

## Các quyết định pha 1 phải chốt

| ID  | Khoảng trống/khác biệt                                                  | Đề xuất triển khai và người phối hợp                                                                                                                                                                                      | Gate                                                                                          |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| D01 | Hủy lịch cuối cần lùi application nhưng contract chưa có command        | BE2 bổ sung command chuyên biệt `onOpenInterviewsCancelled` (tên đề xuất), nhận expectedVersion/evidence/Tx; chỉ lùi khi không CONFIRMED và không COMPLETED/NO_SHOW                                                       | TC46 và contract rollback; không dùng generic status setter                                   |
| D02 | ResultPort chưa biểu diễn evidence lịch trong chữ ký                    | BE2/BE3 khóa kiểu evidence + cơ chế kiểm dưới cùng Tx; BE3 tính từ lịch đã khóa, BE2 kiểm cạnh/version và điều kiện kết quả                                                                                               | EC08/09; không nhận evidence từ HTTP body                                                     |
| D03 | Mục 8.6 đặt Interview/Outbox cuối, producer cần Outbox trước            | Tách migration baseline Outbox/Audit sau Identity; Interview/Evaluation/Notification/Email sau Application; BE2 điều phối thứ tự và cập nhật tài liệu                                                                     | Deploy DB rỗng và upgrade; không đổi migration đã chạy                                        |
| D04 | UC09 dùng publicMessage/internalReason, bảng API dùng message/reason    | Đề xuất wire DTO `{result,message,reason?,version}`, map sang port `publicMessage/internalReason`; REJECTED bắt buộc reason. BE2/FE2 khóa schema trước code                                                               | Contract normalization/hash và không leak reason                                              |
| D05 | `audit_log` không có actor_type, mô tả cancelled_by lại nhắc actor_type | Đề xuất dùng actor_id NULL = SYSTEM theo bảng hiện có; actor_type tính ở DTO, sửa mô tả cho thống nhất. Nếu nhóm cần lưu cột phải migration có ghi khác biệt                                                              | EC32, system cancellation audit không mất nguồn gốc                                           |
| D06 | candidate/saved_job event không có aggregate_type riêng                 | Đề xuất `candidate.profile_updated → USER/userId`; `saved_job.* → JOB/jobId` với userId ở payload. BE2 xác nhận semantics aggregateVersion theo aggregate; nếu không khả thi mở enum có migration thay vì gán version sai | JSON schema + consumer registry, không dựa global ordering                                    |
| D07 | Read port thống kê chưa có milestone/asOf/snapshot                      | BE1 bổ sung job facts port; BE2 mở rộng reporting facts để nhận cùng read Tx/asOf, trả cohort/distinct milestones, không PII                                                                                              | TC53/54 EC35; không raw JOIN repository BE2                                                   |
| D08 | Auth mail cần token nhưng event nghiệp vụ chỉ IDs                       | BE1 sở hữu token validity và read port giải mã vật liệu bảo mật; BE3 chỉ vận chuyển sau commit. Auth material mã hóa không trả admin API/log; event nghiệp vụ khác chỉ IDs/version/time                                   | Token bị resend/reset không được gửi lại như còn hiệu lực                                     |
| D09 | Thiếu schema read/calendar/admin/unread/evaluation absent               | Chốt pagination/filter allowlist; `data:null` cho phiếu chưa tạo của actor được phép (đề xuất); unreadCount theo owner; limits và error codes cố định                                                                     | API/FE1/FE2 contract fixtures                                                                 |
| D10 | Chưa có giao thức provider kiểm generation/kick                         | Prototype Jitsi private: online authorization ở join + revoke/kick hook. Nếu provider chỉ JWT TTL thì chưa đạt; dừng phần nghiệm thu UC03, ghi blocker và phương án tích hợp                                              | Token cũ bị chặn, active connection revoke đo thật                                            |
| D11 | API respond chỉ nêu interviewVersion, workflow thay application         | Đề xuất trả applicationVersion trong context; các lệnh chạm application dùng version đã đọc và kiểm lại dưới khóa; chốt khi nào client phải gửi applicationVersion riêng                                                  | Confirm vs withdraw/result không lost update                                                  |
| D12 | Tự hết hạn proposal cùng rollback request có thể mất mutation EXPIRED   | Tác vụ expire riêng bằng Tx có audit/outbox; request confirm vẫn kiểm DB time để từ chối ngay. Không dựa worker đúng giờ để cho phép xác nhận                                                                             | Đúng expires_at luôn từ chối, worker eventual EXPIRED                                         |
| D13 | ADMIN retry FAILED chưa có ngân sách retry mới rõ ràng                  | Đề xuất reset attempt_count cho một chu kỳ mới trên cùng eventId, audit lưu số attempt cũ/lý do/actor/time để đối soát tổng các chu kỳ. Delivery retry chốt tương tự; cập nhật contract trước code                        | FAILED lần6 không bị claim lần7 tự động; retry ADMIN có audit và không mất lịch sử số lần thử |

Các quyết định trên **chưa là thay đổi contract** trong lượt lập kế hoạch. Khi chưa chốt, dùng fake port cho unit; không phát hành endpoint/migration phụ thuộc giả định đó. Không cần đổi báo cáo gốc.

## Port và transaction blueprint

Giữ `Actor`, opaque `Tx`, UnitOfWork và IdempotencyStore do BE2 điều phối; một request liên module dùng đúng một Tx. BE3 xuất `InterviewLifecyclePort.cancelOpenForApplication(applicationId, reason, tx)` và `OutboxPort.append(...)` theo contract. Bổ sung access adapter của BE1 cho participant hiện tại/assignment/membership, không chỉ `assertRecruiter` vì INTERVIEWER và CANDIDATE có quyền khác.

```ts
// Pseudocode hợp đồng mới cần pha 1 chốt; không copy opaque Tx thành any.
interface VideoPort {
  issueJoinGrant(input: {
    operationId: string;
    interviewId: string;
    userId: string;
    accessGeneration: number;
    expiresAt: string;
  }): Promise<JoinGrant>;
  revoke(input: {
    operationId: string;
    interviewId: string;
    accessGeneration: number;
  }): Promise<void>;
}
type MailContent =
  | { kind: 'public'; templateCode: string; variables: PublicTemplateVariables }
  | { kind: 'auth'; purpose: 'VERIFY' | 'RESET'; tokenMaterial: EphemeralAuthMaterial };
interface MailPort {
  send(input: {
    deliveryId: string;
    recipient: string;
    content: MailContent;
  }): Promise<{ providerMessageId?: string }>;
}
```

Auth material chỉ được BE1 cấp sau kiểm purpose/validity, giải mã trong bộ nhớ ngay trước gửi; không persist dạng rõ vào EmailDelivery/event/log/admin DTO. Đây là đường truyền riêng, không mở quyền đưa bí mật vào public template variables.

Khóa: toàn bộ user UUID tăng dần → company → job → application → interview → CV nếu cần; cùng nhóm cũng tăng dần. Thu thập ID trước, khóa xong kiểm lại quan hệ/actor/version/participant set. Khi scope đổi rollback/retry có giới hạn, không khóa bổ sung user sau interview. `READ COMMITTED`, SQL parameterized, DB `clock_timestamp()` sau khóa quyết định thời gian. Không gọi SMTP/Jitsi/S3 trong transaction. Không dùng PrismaClient toàn cục hoặc nested transaction qua port.

```text
respondAccepted(command, actor):
  ids = discoverScope(command.interviewId)  // chỉ để xác định tập khóa
  UoW.run(tx):
    lockAllInCanonicalOrder(ids, tx)
    context = reReadAndAuthorize(actor, tx)
    assertScopeAndVersionsUnchanged(context)
    t = databaseClockAfterLocks(tx)
    assert(PROPOSED && t < expires_at && t < start_at)
    updateActorResponse(ACCEPTED, tx)
    if everyoneAccepted(tx):
      assertCurrentMembershipsAndOldReplacementStillValid(tx)
      if replacement: releaseOldReservationsAndCancelOld(tx)
      insertAllParticipantReservations(tx)  // exclusion có thể fail
      markConfirmed(tx)
      ApplicationPort.onInterviewConfirmed(..., tx)
    appendAuditAndOutbox(tx)
  // overlap/history/outbox fail => rollback kể cả response cuối
```

```text
publishResult(command, actor):
  discover IDs → UoW → canonical locks → reread quyền/version
  claim/read IdempotencyStore cùng Tx (normalize/hash payload)
  nếu key COMPLETED cùng hash: trả resource đã công bố sau kiểm quyền hiện tại
  nếu cùng key khác hash: 409; chỉ operation mới mới kiểm cạnh/version tiếp
  ResultRules kiểm HIRED/REJECTED và evidence lịch đã khóa
  cancel proposals cùng Tx; không tự hủy CONFIRMED để né điều kiện
  ApplicationResultPort.publish(..., tx)  // BE2 ghi result/history/outbox/key
  audit BE3 nếu action cần audit; tránh duplicate result event
  commit → worker chỉ gửi message công khai
```

Rút hồ sơ thuộc BE2: ExitCoordinator gọi LifecyclePort cùng Tx để hủy mọi PROPOSED/CONFIRMED, release reservations, tăng generation, ghi REVOKE_PENDING và Outbox; giữ lịch COMPLETED/NO_SHOW. Rút được phép khi company SUSPENDED. Provider lỗi không làm hồ sơ sống lại.

## API bàn giao FE, base `/api`

Các route lấy từ đặc tả mục 7.1; wire DTO chi tiết còn cần khóa ở pha 1. Không thêm endpoint confirm hoặc PATCH status tự do.

| HTTP và route                                                            | Dữ liệu/chính sách chính                                                                       | UC/UI              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------ |
| POST `/applications/:id/interviews`                                      | startAt/endAt có offset, interviewerIds 1–10, key; candidate từ context; version theo D11      | UC08 UI20/21       |
| POST `/interviews/:id/respond`                                           | response ACCEPTED/DECLINED, interviewVersion; participant actor                                | UC08 UI13/14       |
| POST `/interviews/:id/cancel`, `/interviews/:id/reschedule`              | reason/version; reschedule tạo proposal mới, không sửa tại chỗ                                 | UC08 UI14/21       |
| GET `/interviews`, `/interviews/:id`, `/applications/:id/interviews`     | participant/recruiter scoped list/detail/total; response/attendance/version; không token/phiếu | UC08 UI11/13/14/20 |
| POST `/interviews/:id/join`                                              | actor session+CSRF; `[start−10m,end+30m)`, token ≤min(5m, remaining)                           | UC03 UI14/15       |
| PUT `/interviews/:id/participants/:userId/attendance`                    | attendance/reason/participantVersion/interviewVersion; recruiter sau endAt                     | UC13 UI14/20       |
| GET/PUT `/interviews/:id/evaluation`                                     | chỉ phiếu của interviewer actor; scores 1–5, recommendation, note; sửa có version              | UC13 UI22          |
| GET `/applications/:id/evaluations`                                      | recruiter đúng scope; luôn chặn candidate/internal privilege escalation                        | UC13 UI20/23       |
| POST `/interviews/:id/complete`, `/interviews/:id/no-show`               | version; attendance/evaluations; no-show reason và DB time ≥end+30m                            | UC13 UI14/20       |
| POST `/applications/:id/mark-interviewed`                                | version; có COMPLETED/đủ phiếu/không PROPOSED hoặc CONFIRMED                                   | UC13 UI20          |
| POST `/applications/:id/result`                                          | result HIRED/REJECTED, message, reason?, version/key theo D04                                  | UC09 UI11/20/23    |
| GET `/notifications`, PATCH `/notifications/:id/read`                    | owner scope + unreadCount; readAt lần đầu giữ nguyên khi retry                                 | UC15 UI24          |
| GET `/statistics`                                                        | companyId/from/to/jobId; scope, period≤366d, counts/denominator/rates/asOf                     | UC16 UI25          |
| GET `/admin/events`, `/admin/events/:id`; POST `/admin/events/:id/retry` | admin, metadata sạch; chỉ retry FAILED, reason, eventId giữ nguyên                             | UC10/15 UI28       |
| GET `/admin/audit`                                                       | admin + filter/paging allowlist; không CV/evaluation/token                                     | UC10 UI28          |
| POST `/admin/interviews/:id/security-cancel`                             | workflow BE1 gọi port BE3; reason/version, có thể sau startAt                                  | UC10/03/08 UI28    |

Envelope `{data,meta?}` và lỗi `{code,message,fieldErrors?,traceId}`. DTO NFC/trim/code point, forbid unknown fields, UUID/ISO offset; page≥1, size1–50. 400 dữ liệu; 401 phiên; 404 ngoài phạm vi; 403 đã được biết nhưng thiếu action; 409 version/state/overlap/key; 503 provider tạm lỗi. Error/DTO không trả lịch riêng của người bị overlap. ADMIN không tự có quyền CV/phiếu.

Mapper candidate dùng allowlist độc lập: không scores/internal_note/recommendation/internalReason; không spread Prisma record. Preview kết quả là UI23 với message công khai, chưa thêm API preview hay trạng thái final ẩn. Join response có `Cache-Control: no-store`; không cache/replay token trong idempotency/log.

## Worker và dữ liệu sự kiện

Outbox schema v1 tối thiểu gồm event ID/type, aggregate type/ID/version, schemaVersion, occurredAt và payload IDs. BE2 event names giữ nguyên contract; BE1 auth/company/job events chốt với owner. Tên BE3 đề xuất (chưa chốt): `interview.proposed/responded/confirmed/cancelled/expired/completed/no_show`, `interview.room_revoke_requested`, `evaluation.submitted`. Mỗi event có schema và owner handler, không dùng tên mới như contract đã triển khai.

Registry ánh xạ event → consumer task cần thiết. Chốt thiết kế revoke dùng chính `outbox_event` loại `interview.room_revoke_requested` làm work item bền vững: handler giữ PENDING/PROCESSING cho đến provider ack và CAS generation, rồi mới DONE; không ack sớm và không thêm bảng revoke. Domain event cha có thể DONE sau khi đã persist work item này. Đối với scan/delete, worker runtime BE3 gọi handler BE2 sở hữu storage/scanner, không tự kết luận PDF sạch. Với auth mail, BE1 xác nhận purpose/validity ngay trước gửi. Không bắt mọi event đều tạo notification/email; profile/saved job không tự spam mail.

Claim bằng `FOR UPDATE SKIP LOCKED`, lease120s/heartbeat30s, count mọi lần claim; fail lần6→FAILED; retry10s/30s/2m/5m/15m+jitter. CAS id+status+lease_token và kiểm lease khi heartbeat/ack/fail. Đảm bảo attempt=6 crash không bị reaper claim lần7 vô hạn; chốt recovery trong test. Domain Outbox DONE sau tạo đủ task bền vững; riêng revoke work item chỉ DONE sau provider ack như trên. EmailDelivery có lease/retry/status riêng, không đợi SMTP để ack event cha. Unique notification `(user_id,event_id)`, email `(event_id,user_id,template_code)`; SMTP chỉ at-least-once. ADMIN retry cấp chu kỳ retry mới theo D13, lưu attempt trước reset vào audit; không reset tự động khi hết lease.

Sự kiện cũ/đảo thứ tự: tải state hiện tại trước invitation/reminder/revoke; không gửi lời mời đã hủy. Mỗi revoke mang generation và operationId, ack chỉ chuyển REVOKED nếu generation vẫn đúng; worker cũ không vô hiệu phòng mới hoặc ghi đè lần revoke mới. Retry admin không tạo event ID mới hoặc reset business state; audit chỉ thêm.

## Reporting blueprint

Scope từ BE1; job facts từ BE1 và application/history facts từ BE2, cùng snapshot read Tx/asOf đã chốt D07. Cohort theo submittedAt `[from,to)`; tin theo publishedAt; mỗi mốc count distinct application từng đạt đến asOf, kể cả quay lại trạng thái. Không JOIN phiếu/kỹ năng để đếm. `rate = denominator === 0 ? null : count / denominator`; quy ước rate 0–1 là đề xuất phải khóa cùng FE2. Trả numerator/denominator/asOf để đối soát; ADMIN chỉ aggregate, không drill down PII. Không cần materialized view trong phiên bản đầu.
