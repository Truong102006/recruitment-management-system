# Lưu tài khoản demo theo role vào cloud — 26/10/2026

**Cập nhật sau báo cáo:** lỗi thiếu candidate_profile được xử lý ở [đợt sửa schema/profile](261026-0100-cloud-profile-repair.md). Nội dung bên dưới giữ bằng chứng tại thời điểm tạo tài khoản trước migration.

## Kết quả

Theo yêu cầu người dùng, đã thêm 7 email `admin/owner/recruiter/interviewer/candidate/outsider/locked.demo@example.test` vào Neon cloud cấu hình trong `.env`. Email chưa tồn tại trước khi ghi; không ghi đè account khác. Dùng hash mật khẩu từ bộ local sau khi đối chiếu BCrypt, giữ role và trạng thái verified/LOCKED; không ghi mật khẩu/hash/token vào báo cáo.

Tạo thêm **Cloud Demo Recruitment** với owner/recruiter/interviewer và **Cloud Other Company** với outsider OWNER: tổng 2 company, 4 membership. ADMIN và CANDIDATE không mặc định có membership. Toàn bộ account/role/company/membership được tạo trong một transaction thành công; không thay schema/migration hoặc cấu hình kết nối.

## Kiểm tra thực tế

API build chạy tạm trên `127.0.0.1:3001` dùng `.env` cloud. 6 tài khoản ACTIVE trả login 200, session 200, membership 200, logout 204; tài khoản LOCKED trả login 401. Role/membership trả về đúng fixture; 7/7 kiểm account đạt. API tạm đã dừng sau kiểm tra.

Artifact local: `reports/auth-roles/cloud-accounts-verification.json` và `reports/auth-roles/cloud-login-api.log` (Git ignored). Kiểm tra schema trước ghi: có user_account/user_role/company/company_membership, không có candidate_profile. Không chạy Jest/unit/integration vào cloud và không đo coverage mới.

## Giới hạn và bước tiếp theo

Cloud **chưa có bảng `candidate_profile`**, nên chưa thêm profile và chưa nghiệm thu tính năng ứng viên/BE2/BE3. Không tự áp migration khi chỉ được yêu cầu lưu tài khoản. Account auth đã dùng được khi ứng dụng trỏ cloud; việc nâng schema là công việc triển khai riêng.

Source base `main` `4fba158` với các sửa local từ lượt QA trước; báo cáo này chưa commit/push/merge, không deploy source. Danh sách email/role/route nằm ở [hướng dẫn tài khoản](../../Docs/local-role-testing.md).
