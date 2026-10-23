# Hướng dẫn agent trong repository

## Nguồn yêu cầu

Áp dụng cho toàn bộ repository. Trước khi sửa code, đọc [đặc tả](Docs/project-specification.md) và [tiến độ chung](progress/README.md); tra [báo cáo gốc](Docs/Bao_Cao_SE113_Final.md) khi cần ngữ cảnh. Không coi SQL mẫu, endpoint thiết kế hoặc test case trên giấy là phần mềm đã triển khai và kiểm chứng.

## Bắt buộc cập nhật tiến độ

1. Trước khi code, xác định UC/UI hoặc hạng mục hạ tầng liên quan và cập nhật thành `IN_PROGRESS` trong `progress/README.md`. Đây là sổ chung cho BE1/BE2/BE3/FE1/FE2 và mọi AI hỗ trợ; dùng đúng quy tắc và mẫu ở đầu file. `Docs/agent-progress.md` chỉ giữ lịch sử, không thêm báo cáo mới vào đó.
2. Sau mỗi đợt code có ý nghĩa (chức năng, sửa lỗi, refactor, migration), cập nhật tiến độ ngay trong lượt đó. Không cần ghi từng lần lưu file. Trước khi kết thúc lượt có sửa file, kể cả tài liệu, cấu hình hoặc test, phải ghi tiến độ tương ứng.
3. Cập nhật cả bảng trạng thái, công việc đang làm, blocker, bước tiếp theo và thêm nhật ký mới ở đầu phần nhật ký. Ghi người thực hiện/vai trò/AI, thời gian Asia/Saigon, mã FR/BR/UC/UI/TC/EC liên quan, hành vi thay đổi, file đã sửa, lệnh kiểm tra thực chạy, kết quả và đường dẫn bằng chứng nếu có. Phân biệt kết quả trên nhánh cá nhân với phần đã tích hợp main; giữ báo cáo của mọi người khi giải quyết conflict.
4. Chỉ ghi `DONE` khi đáp ứng tiêu chí hoàn thành áp dụng và có bằng chứng. Chưa chạy test phải ghi “chưa chạy” cùng lý do; chưa đo coverage phải ghi “chưa đo”. Mới hoàn thành một phần giữ `IN_PROGRESS` và ghi phần còn thiếu. `BLOCKED` phải có nguyên nhân cụ thể và điều kiện gỡ chặn.
5. Khi đổi schema, constraint, nghiệp vụ, endpoint, DTO, quyền hoặc test contract, cập nhật phần liên quan trong `Docs/project-specification.md`, ghi khác biệt với báo cáo và bổ sung test phù hợp. Không âm thầm thay quy tắc báo cáo gốc.
6. Giữ lịch sử, không xóa tiến độ của người/agent khác. Không tạo SHA, URL CI, kết quả pass hoặc số liệu giả. Phản hồi cuối phải nhất quán với sổ tiến độ.

## Xác minh

Chạy kiểm tra liên quan tới thay đổi khi có công cụ và source. Với thay đổi chỉ tài liệu, kiểm tra nội dung, liên kết và diff; không yêu cầu test ứng dụng chưa tồn tại. Không tự commit, push hoặc deploy chỉ để cập nhật tiến độ.
