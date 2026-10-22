# BE2 — repository và idempotency (bước 3)

Đây là phần BE2 có thể triển khai trước khi BE1/BE3 có provider thật. Nguồn quy tắc: [đặc tả](project-specification.md) mục 4.3–4.5, 5.1–5.4 và [hợp đồng BE2](be2-integration-contract.md). Chưa có endpoint UC02 chạy được.

## Cách nối

- `TransactionSql` chỉ dùng transaction client lấy từ `ManagedUnitOfWork.clientFor(tx)`. Lệnh SQL cố định, dữ liệu qua bind parameter; không mở PrismaClient mới. `PrismaApplicationRepository` ghi application và history trên cùng `tx`.
- `SqlIdempotencyStore` claim theo `UNIQUE(user_id,operation,key)` và request hash; complete cùng transaction với business rows. Khác payload báo conflict, replay trả resource ID/status đã lưu; không cache HTTP body, token hoặc signed URL. Cleanup chỉ được xóa record sau thời gian giữ tối thiểu 24 giờ.
- `SubmitApplicationPersistenceService` là lát cắt **nội bộ**: callback `verify(tx)` bắt buộc kiểm actor BE1, job/company/deadline và CV READY bằng cùng transaction trước claim, kể cả replay. Khi claim mới, service ghi application, SUBMIT history, outbox event rồi complete idempotency trong `UnitOfWork.run`. Nếu History, Outbox hay complete lỗi, transaction rollback. Callback này chưa được BE1/BE2 binding và không được gọi trực tiếp từ HTTP.
- Sau khi BE1/BE3 có port thật, use case UC02 phải thu thập phạm vi khóa, gọi port của họ, kiểm DB clock sau khóa, xác minh lại quyền/trạng thái rồi mới dùng lát cắt này. BE2 cần mapping lỗi constraint và kiểm PostgreSQL thật; các bài test fake không thay cho việc đó.

## Đã kiểm và chưa kiểm

Unit test dùng driver/fake repository để kiểm ghi nguyên tử, rollback khi Outbox lỗi, replay phải kiểm quyền lại và key khác payload bị từ chối. Adapter idempotency được kiểm tham số query và điều kiện complete. TypeScript và lint đã chạy. **Chưa chạy SQL trên PostgreSQL** vì migration BE2 còn chờ bảng nền BE1 và OutboxPort BE3 chưa có implementation.
