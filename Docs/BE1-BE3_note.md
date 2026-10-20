# Lưu ý cho AI hỗ trợ BE1 và BE3

Tài liệu này dành cho hai thành viên Backend và AI hỗ trợ của họ **trước khi bắt đầu code**. Đây là lời giao việc của nhóm, không phải bằng chứng phần mềm đã triển khai. Mỗi người làm trên nhánh riêng, mở PR để review và tích hợp; không ghi đè mã nguồn hoặc tiến độ của người khác.

## Đọc theo thứ tự

1. [`../AGENTS.md`](../AGENTS.md): quy tắc bắt buộc khi sửa repository và cập nhật tiến độ.
2. [`project-specification.md`](project-specification.md): quy tắc BR, trạng thái, dữ liệu, API, test và tiêu chí nghiệm thu.
3. [`be2-integration-contract.md`](be2-integration-contract.md): ranh giới BE1/BE2/BE3, port, transaction, migration, DTO và event v1 do BE2 chốt để cả nhóm làm theo.
4. [`agent-progress.md`](agent-progress.md): trạng thái thực tế trước khi nhận việc. Đọc [`Bao_Cao_SE113_Final.md`](Bao_Cao_SE113_Final.md) khi cần bối cảnh từ báo cáo gốc.
5. Kiểm tra mã nguồn và Git hiện tại; file, tên module, SQL mẫu, bảng test trên giấy hoặc trạng thái `DONE` của tài liệu không chứng minh API đã chạy.

Nếu phát hiện contract mâu thuẫn với BR/đặc tả chính, dừng phần phụ thuộc, ghi rõ xung đột và đề xuất sửa tài liệu trong PR trước khi đổi hành vi. Không tự tạo contract khác hoặc truy cập repository nội bộ của module người khác để né port.

## Giao việc cho AI của BE1

Bạn là AI hỗ trợ **BE1**, chủ sở hữu UC01, UC04, UC05, UC10, UC11. Triển khai Identity, Company, Job và Admin; tự làm schema/migration/seed, API/DTO/OpenAPI, policy/rules và test của phần này. Bắt đầu bằng bootstrap NestJS, actor/session/CSRF, trạng thái account/company, quyền membership, job read/submit eligibility và danh mục skill. Xem mục 8.3 của báo cáo, nhưng ưu tiên quy tắc hiện hành trong đặc tả.

Các giao điểm bắt buộc với BE2:

- Cung cấp `IdentityCandidatePort`, `CompanyAccessPort`, `JobApplicationPort`, `JobVisibilityPort` và `SkillCatalogPort` đúng đầu vào/đầu ra trong hợp đồng BE2. UC12 gọi port BE1 để cập nhật `user_account.name` trong cùng transaction. Cấp role `CANDIDATE` phải tạo `candidate_profile` qua facade BE2 trong cùng transaction.
- Migration BE1 tạo các bảng/khóa được BE2 tham chiếu trước; giữ `user_account.id`, `company.id`, `job_post.id`, `skill.id` ổn định và cùng kiểu UUID. BE2 sở hữu các bảng ứng viên/CV/application. Không sửa migration đã áp dụng ở môi trường chung.
- Khi thêm membership, kiểm xung đột ứng viên có hồ sơ mở qua `ApplicationConflictPort` của BE2. Đóng tin/đình chỉ công ty dùng khóa và kiểm trạng thái nhất quán với lệnh nộp hồ sơ; không tự xóa hoặc rút hồ sơ cũ. Phối hợp BE3 để thu hồi quyền phòng khi khóa user/đình chỉ công ty.
- Kiểm test nộp hồ sơ đồng thời đóng tin/đình chỉ, quyền recruiter khác công ty, deadline tại DB và membership cạnh tranh. Không đánh dấu UC hoàn tất chỉ vì endpoint trả 200.

**Đầu ra cần bàn giao:** PR trên nhánh BE1, danh sách port/DTO đã xuất, migration và thứ tự chạy, OpenAPI, test thực chạy với kết quả, phần còn thiếu và thay đổi trong `agent-progress.md`.

## Giao việc cho AI của BE3

Bạn là AI hỗ trợ **BE3**, chủ sở hữu UC03, UC08, UC09, UC13, UC15, UC16. Triển khai Interview, Evaluation, Notification, Reporting và worker; tự làm schema/migration/seed, API/DTO/OpenAPI, policy/rules, adapter/video/mail và test của phần này. Xem mục 8.5 của báo cáo, ưu tiên quy tắc hiện hành trong đặc tả.

Các giao điểm bắt buộc với BE2:

- Cung cấp `InterviewLifecyclePort.cancelOpenForApplication` và `OutboxPort` theo hợp đồng BE2. Hủy lịch mở, reservation và quyền phòng khi ứng viên rút phải nằm trong **cùng transaction DB** với `WITHDRAWN`; chỉ gọi video provider sau commit.
- Dùng `ApplicationPort`/`ApplicationResultPort` của BE2 để lấy context, chuyển sang `INTERVIEW_SCHEDULED`, đánh dấu `INTERVIEWED` và công bố `HIRED/REJECTED`. Không cập nhật trực tiếp `application`, `application_history`, `cv_change_request` hoặc dùng PrismaClient toàn cục bên trong transaction chung.
- BE3 sở hữu điều kiện lịch/phiếu/attendance, event schema và worker. Công bố kết quả phải cạnh tranh đúng với rút hồ sơ bằng application version; chỉ một lệnh commit. Candidate DTO, event và email không chứa điểm, note, recommendation hoặc lý do nội bộ.
- Migration BE3 tham chiếu `application.id` sau migration BE2. Test hủy lịch/rút hồ sơ, confirm cạnh tranh, rollback khi event/history lỗi, thu hồi quyền phòng, email retry và dữ liệu nội bộ không bị lộ.

**Đầu ra cần bàn giao:** PR trên nhánh BE3, danh sách port/DTO và event schema v1, migration và thứ tự chạy, OpenAPI, test thực chạy với kết quả, phần còn thiếu và thay đổi trong `agent-progress.md`.

## Quy tắc phối hợp chung

- Chốt interface/fixture nhỏ trước khi viết phụ thuộc lớn. Dùng `UnitOfWork`/`Tx` chung, thứ tự khóa ở mục 4.4 của đặc tả; không tạo transaction lồng hoặc import vòng giữa Application và Interview.
- Khi đổi schema, quyền, trạng thái, DTO, endpoint hoặc event, cập nhật `project-specification.md`, hợp đồng BE2 nếu liên quan, OpenAPI/event schema và test trong cùng PR. Ghi rõ khác biệt với báo cáo gốc.
- Trước khi code, ghi hạng mục `IN_PROGRESS` vào `agent-progress.md`; sau mỗi đợt cập nhật bảng, việc đang làm, blocker, bước tiếp theo và nhật ký. Ghi “chưa chạy” hoặc “chưa đo” đúng thực tế; không ghi kết quả test/CI giả.
- Mỗi PR có phạm vi một lát cắt nghiệp vụ, chỉ sửa file mình sở hữu trừ thay đổi chung đã được phối hợp. BE1 review BE3, BE3 review BE2, BE2 review BE1. Sau khi merge, mọi người cập nhật nhánh từ `main` mới nhất rồi tiếp tục.
