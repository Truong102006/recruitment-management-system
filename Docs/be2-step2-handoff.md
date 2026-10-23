# Bàn giao nền BE2 — bước 2

Phần này được phát triển từ nhánh `feat/be2-contract-foundation`, xuất phát từ `f4fe282`. Trạng thái tích hợp Git xem [tiến độ chung](../progress/README.md). Đây là nền code và hợp đồng để các thành viên triển khai tiếp; chưa có endpoint nghiệp vụ chạy được.

## 1. Đối chiếu báo cáo Word

Nguồn: `Bao_Cao_SE113_Final (2).docx` người dùng gửi; bản tra cứu trong repo là [báo cáo gốc](Bao_Cao_SE113_Final.md) và [đặc tả](project-specification.md).

| Mục trong báo cáo      | Áp dụng trong bước 2                                                                                         | Phần còn phải kiểm chứng                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 8.4; UC02/06/07/12/14  | BE2 sở hữu Candidate/CV/Application và nền transaction/idempotency; chỉ khai báo interface phụ thuộc BE1/BE3 | Service, migration, storage/scanner và API nghiệp vụ                                                                 |
| 4.3–4.4                | `UnitOfWork`, context mờ, port nhận cùng context; chặn transaction lồng; driver READ COMMITTED               | Prisma client sau generate, commit/rollback và cạnh tranh trên PostgreSQL thật                                       |
| 4.4                    | `planLocks` sắp UUID theo user_account → company → job_post → application → interview → cv_version           | Repository phải thực thi khóa SQL parameterized, kiểm lại scope/version và DB deadline; hàm sắp xếp không tự khóa DB |
| 4.5                    | Interface `IdempotencyStore`; hash gồm operation, target và payload đã chuẩn hóa; schema event chỉ có ID     | UNIQUE, claim/completion cùng transaction, giữ ≥24 giờ, quyền khi replay và worker thực                              |
| BR07/BR13; 7.1         | DTO ứng viên và mapper allowlist; không đưa reason/score/note/token vào response hoặc event                  | Guard, query scope, phân trang, quyền tải CV và API test                                                             |
| 3.2; UC08/09/13        | Port chuyên biệt cho xác nhận/hủy lịch, INTERVIEWED và kết quả; evidence chỉ dùng nội bộ                     | Service kiểm cạnh, attendance/phiếu và race với withdraw; chưa có state machine runtime                              |
| 5.2 user_account; UC12 | Cột DB đúng là `full_name`; public `name` ánh xạ sang cột này qua BE1                                        | Không đổi schema thành cột `name`; profile và account ghi cùng transaction                                           |

Không thay đổi BR hoặc phạm vi UC của báo cáo. Các bổ sung kỹ thuật là đường dẫn import, token DI, chữ ký TypeScript, JSON Schema/event v1 và tên header `X-CSRF-Token`. Tài liệu contract cũ viết nhầm `user_account.name` được đính chính thành `full_name`. Wire request giữ `version`; service chuyển thành `expectedVersion` khi gọi port.

## 2. File dùng chung và cách nhận phần bàn giao

| Người dùng  | Nguồn cần đọc/import                                                     | Cách dùng                                                                                                    |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| BE1/BE2/BE3 | `libs/contracts/backend/index.ts`                                        | Chữ ký TypeScript và `PORTS`; implementation thuộc người sở hữu, không tự tạo bản sao interface              |
| BE1/BE2/BE3 | `libs/platform/database/unit-of-work.ts`, `prisma-transaction-driver.ts` | Một instance `ManagedUnitOfWork` cho API; repository lấy transaction client từ `clientFor(tx)`               |
| BE2         | `libs/platform/idempotency/`                                             | Chuẩn hóa DTO theo BR18 trước khi hash; adapter DB sẽ triển khai cùng migration                              |
| FE1/FE2     | `libs/contracts/public/index.ts`                                         | Import type theo đường dẫn tương đối từ file sử dụng; không import backend/platform hoặc ORM                 |
| Cả nhóm     | `contracts/schemas/be2.v1.json`, `contracts/fixtures/`                   | Schema request và DTO ứng viên, fixture giả; JSON Schema kiểm hình dạng, không thay cho kiểm quyền/nghiệp vụ |
| BE3         | `contracts/events/be2.v1.json`, `libs/contracts/backend/events.ts`       | Schema producer BE2 v1; consumer vẫn kiểm quyền/trạng thái và đọc dữ liệu hiện hành trước gửi                |
| FE/BE       | `contracts/openapi/be2-foundation.v1.json`                               | Mới mô tả POST `/api/jobs/{id}/applications`; không phải toàn bộ API BE2 hoặc server đã hoạt động            |

Các path trên tính từ gốc repo. Chưa cấu hình package alias; không tự thêm alias khác nhau ở từng app. FE có thể dựng UI với fixture; không dùng fixture thay cho API khi nghiệm thu.

BE1 hiện thực Identity/Company/JobVisibility/JobApplication/SkillCatalog và bootstrap; BE3 hiện thực InterviewLifecycle/Outbox. BE2 tiếp tục hiện thực Application/Profile/CV và idempotency. `getReportingFacts`, recruiter read DTO, các API còn lại và `ApplicationExitCoordinator` vẫn là thiết kế, chưa có implementation hoặc interface đầy đủ ở bước này.

## 3. Nối transaction và các port

Sau khi BE1 có schema và generate Prisma 6 client, wiring dự kiến ở composition root:

```ts
const unitOfWork = new ManagedUnitOfWork<Prisma.TransactionClient>(
  new PrismaTransactionDriver<Prisma.TransactionClient>(prisma),
);
// Bind UNIT_OF_WORK với useValue: unitOfWork.
// Bind PORTS.application bằng useExisting: ApplicationService (do BE2 triển khai).
// Mọi persistence adapter nhận chính unitOfWork này để gọi clientFor(tx).
```

Đây là hướng dẫn wiring, chưa được kiểm với generated client/DB thật. Repository không dùng PrismaClient toàn cục khi có tx. Service con nhận tx; chỉ workflow ngoài cùng gọi `run`. Phải `await` tất cả công việc trong callback, không để tác vụ DB chạy nền sau callback. Context hết hiệu lực khi callback kết thúc; chỉ trả HTTP thành công sau `run` resolve. Driver không tự retry nghiệp vụ; workflow phải thiết kế retry hữu hạn sau rollback và đọc lại scope theo báo cáo.

`createUnimplementedBe2Ports()` chỉ hỗ trợ wiring thử: mọi lời gọi đều lỗi `DEPENDENCY_UNAVAILABLE`, không cấp quyền hoặc trả thành công giả. Chưa đăng ký vào app; composition root phải thay bằng provider thật trước nghiệm thu.

Các điểm phối hợp cần giữ:

- Identity trả `userId`, `name` ánh xạ từ `full_name`, `email` sau khi khóa/kiểm account. Gọi `CandidateProfilePort.getSubmissionSnapshot(candidateId, { name, email }, tx)` để BE2 bổ sung phone/headline; snapshot khi nộp bất biến.
- Cấp CANDIDATE gọi `ensureForCandidate(userId, tx)` cùng transaction; UC12 gọi `updateCandidateName` qua BE1 cùng transaction với profile.
- `getLockScope` chỉ là đọc sơ bộ. Workflow thu thập đủ ID; kiểm lại scope sau khóa trước khi ghi. Không dùng dữ liệu đọc trước để bỏ kiểm quyền/version hiện tại.
- `InterviewEvidence` do BE3 tính từ dữ liệu đã khóa cùng tx, có applicationId và transactionId. BE2 phải kiểm khớp context và điều kiện chuyển trạng thái; không nhận evidence/count từ HTTP hoặc dùng lại evidence của transaction trước.
- `onInterviewsCancelled` chỉ lùi SHORTLISTED khi không còn CONFIRMED và chưa có COMPLETED/NO_SHOW theo mục 3.2. Có NO_SHOW không tự chuyển INTERVIEWED.
- `cancelOpenForApplication` với WITHDRAWN hủy PROPOSED/CONFIRMED và giải phóng reservation/thu hồi phòng trong DB; giữ lịch đã kết thúc. Với RESULT_REJECTED, nếu còn CONFIRMED phải từ chối; chỉ hủy PROPOSED trong transaction công bố. Provider được gọi sau commit.
- Event `saved_job.*` dùng aggregateId = candidateId, aggregateVersion = 0 vì bảng saved_job không có version theo báo cáo; payload có candidateId/jobId. Consumer deduplicate theo eventId, đọc trạng thái hiện hành, không suy thứ tự hoặc bỏ event chỉ dựa vào version 0. Không thêm cột version chỉ để phục vụ envelope.
- Header mutation là `X-CSRF-Token` kèm kiểm Origin/session theo mục 4.6. BE1/FE dùng cùng tên; giá trị phải là token của session, không đưa vào fixture/log.

## 4. Kiểm chứng và phần tiếp theo

Lệnh chuẩn sau `npm ci`:

```text
npm run typecheck
npm run typecheck:contracts:public
npm run lint
npm run test:unit:ci -- --runInBand
npm run test:contract:ci
```

Kết quả thực chạy, môi trường và coverage xem [sổ tiến độ](../progress/README.md). Test rollback hiện dùng driver bộ nhớ mô phỏng; test Prisma driver chỉ kiểm lời gọi/options. Không dùng các test này để tuyên bố TC/EC PostgreSQL, API hay concurrency đã đạt.

Đợt tiếp theo: nhận schema/ports nền BE1, bổ sung migration BE2 và adapter DB; làm lát cắt UC02 từ request đến application/history/outbox/idempotency, kiểm PostgreSQL thật (constraint, rollback, submit vs close/suspend/membership), rồi mở rộng UC06/07/12/14. Khi ghép BE3, thêm withdraw vs confirm/result và kiểm thu hồi quyền phòng. Thay đổi contract phải cập nhật schema, type, fixture/test, đặc tả và tiến độ trong cùng PR.
