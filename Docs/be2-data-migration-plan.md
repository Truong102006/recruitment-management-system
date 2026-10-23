# BE2 — model và migration chờ nền BE1

Phạm vi bước 2 của kế hoạch BE2: model và bản SQL cho tám bảng do BE2 sở hữu. Nguồn yêu cầu là [đặc tả hệ thống](project-specification.md) mục 5.1–5.4 và [hợp đồng BE2](be2-integration-contract.md). Đây là bản chuẩn bị để tích hợp, **chưa phải migration đã áp dụng**.

## Artefact

- [Prisma schema](../prisma/schema.prisma): tám model BE2, kiểu cột, khóa chính, unique và index Prisma hỗ trợ. Chưa khai báo relation tới model BE1 để không tạo model thay chủ sở hữu.
- [SQL chờ tích hợp](../prisma/pending/be2-after-be1.sql): FK tới BE1, FK ghép chứng minh CV/application cùng candidate, CHECK, partial unique một đề nghị PENDING, trigger bất biến và chỉ mục. File này ở `prisma/pending`, không được `prisma migrate deploy` tự chạy.
- Schema Prisma **không đại diện đầy đủ** cho raw SQL CHECK, trigger, partial index và FK chéo nhóm. Không dùng `prisma db push` để thay migration này.

## Thứ tự hợp nhất

1. BE1 gộp migration tạo `user_account(id)`, `skill(id)`, `job_post(id)`, theo đúng kiểu UUID và tên bảng của hợp đồng. Kiểm tên schema thực; nếu khác thì sửa bản SQL BE2 trong commit mới, không sửa migration BE1 đã áp dụng.
2. Đặt bản SQL BE2 vào **một migration mới sau migration BE1** và chạy trên PostgreSQL trống, sau đó trên fixture dữ liệu BE1. Prisma schema phải được giữ tương ứng. Sau đó BE3 mới thêm `interview.application_id` và các FK của mình.
3. Kiểm catalog `pg_constraint`, `pg_indexes`, trigger; thử dữ liệu sai owner CV, duplicate application, hai PENDING change request, kết quả cuối thiếu message, sửa snapshot/CV gốc, sửa history. Chạy upgrade từ DB đã có dữ liệu fixture; rollback nếu bất kỳ bước nào lỗi.
4. Nếu BE1/BE3 đổi contract, cập nhật đặc tả, SQL, Prisma schema, fixture và tiến độ trong cùng đợt. Không chạy bản pending thủ công vào DB dùng chung.

## Giới hạn đã biết

Thiếu bảng nền và generated Prisma client tích hợp của BE1, nên chưa chạy migration/constraint trên PostgreSQL thật. Repo hiện cũng chưa có bootstrap API thật. Chỉ `prisma validate` xác nhận model khi cung cấp `DATABASE_URL` giả để parse schema; nó không chứng minh SQL chạy thành công hoặc schema DB nhất quán.
