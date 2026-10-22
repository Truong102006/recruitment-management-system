# Đặc tả database, chức năng, test và API

## Phạm vi và trạng thái

Nguồn: [Bao_Cao_SE113_Final.md](Bao_Cao_SE113_Final.md), bản bổ sung ngày 16/10/2026. Tài liệu tập hợp đầy đủ các phần liên quan từ báo cáo để agent tra cứu khi triển khai: 15 FR, 20 BR, 16 UC, 25 bảng, TC01–TC60, EC01–EC40, ma trận test giao diện, tiêu chí CI và hợp đồng API.

**Đây là đặc tả cần triển khai, chưa phải chức năng đã hoạt động.** Repo đã có khung API/worker/web, manifest/lockfile và cấu hình phát triển theo [development-setup.md](development-setup.md). Nền code transaction/port, DTO/schema và test unit/contract BE2 đã lên `main` tại `62215fc`; chưa có model/migration nghiệp vụ, endpoint chạy hoặc CI thực thi. SQL là thiết kế tham khảo; endpoint chưa được kiểm chứng trên server. Coverage nền có ghi trong [sổ tiến độ](../progress/README.md), không thay cho nghiệm thu UC. OpenAPI và schema request/response hiện mới bao phủ một phần hợp đồng.

Các mục bên dưới giữ nguyên số thứ tự trong báo cáo để đối chiếu. Thứ tự tra cứu: tổng quan (chương 1), chức năng/quyền/quy tắc và UC (chương 2–3), kiến trúc và database (chương 4–5), test (chương 6 và mục 7.2.5–7.5), API (mục 7.1 ở cuối file). Các hình/đường dẫn ngoài nếu thiếu cần bổ sung khi sử dụng.

Tiến độ thực tế: [progress/README.md](../progress/README.md); [agent-progress.md](agent-progress.md) chỉ giữ lịch sử. Quy trình agent: [AGENTS.md](../AGENTS.md). Khi thay đổi thiết kế trong lúc code, cập nhật tài liệu này và ghi rõ khác biệt với báo cáo trong tiến độ; không sửa báo cáo gốc một cách âm thầm.

# CHƯƠNG 1 TỔNG QUAN VÀ PHẠM VI

## 1.1 Bài toán và mục tiêu

Tuyển dụng liên quan nhiều tác nhân, thông tin nhạy cảm và quyết định thay đổi theo thời gian. Nếu chỉ kiểm tra form mà không kiểm tra trạng thái và quan hệ dữ liệu, hệ thống vẫn có thể nhận trùng hồ sơ, lộ CV, ghi đè kết quả xét duyệt hoặc xác nhận lịch trùng. Báo cáo chuyển các yêu cầu đó thành điều kiện nghiệp vụ, ràng buộc database và kết quả kiểm thử có thể quan sát.

Mục tiêu là triển khai luồng từ công bố tin đến công bố kết quả; phân biệt CV nộp lần đầu và CV đang được xét; kiểm soát chuyển trạng thái và quyền theo doanh nghiệp; xử lý đồng thời, retry và lỗi tích hợp; cung cấp hợp đồng đủ rõ để ba BE phát triển song song theo use case.

## 1.2 Phạm vi hệ thống

Hệ thống phục vụ nhiều doanh nghiệp. Một tài khoản có thể có nhiều vai trò toàn cục; membership quy định quyền trong từng doanh nghiệp. Phiên bản đầu gồm một NestJS API, một worker sử dụng chung mã nghiệp vụ, một frontend React, PostgreSQL, kho đối tượng tương thích S3, scanner và Jitsi riêng tư. Redis và message broker không bắt buộc.

Trong phạm vi gồm đăng ký và xác minh email, phiên đăng nhập, quản lý doanh nghiệp, kiểm duyệt, tin tuyển dụng, tìm việc, hồ sơ cá nhân, CV, ứng tuyển, xét duyệt, thay CV, lịch, video, đánh giá, kết quả, thông báo và audit. Lưu tin và thống kê là chức năng ưu tiên sau luồng bắt buộc nhưng vẫn có chủ sở hữu và test.

Ngoài phạm vi gồm tính phí, trả lương, ký hợp đồng lao động, AI chấm CV, ứng dụng di động riêng, tự phát triển WebRTC, ghi hình và mời thành viên chưa có tài khoản. HIRED thể hiện quyết định tuyển trên hệ thống, chưa thể hiện hợp đồng đã ký hoặc ứng viên đã nhận việc.

## 1.3 Công nghệ và cách kiểm chứng

NestJS cung cấp module và DI; controller–service–repository là quy ước của nhóm. TypeScript strict kiểm tra tĩnh, DTO vẫn phải validation lúc chạy. Prisma và SQL migration quản lý truy vấn, transaction và constraint. Khóa phiên bản tương thích bằng lockfile và image digest. \[TL02–TL05\]

Jest/Supertest kiểm BE; integration dùng PostgreSQL thật để kiểm constraint và transaction. FE dùng Vitest/Playwright; k6 đo tải. Adapter cho phép fake storage/mail/scanner/video trong test; nghiệm thu quyền video cần provider thật. Mỗi use case có ca thành công, dữ liệu sai, vượt quyền, sai trạng thái và retry; kiểm cả DB, rollback và tác dụng phụ thay vì chỉ coverage.

## 1.4 Sản phẩm bàn giao

| **Sản phẩm**        | **Nội dung và điều kiện**                                                          |
|---------------------|------------------------------------------------------------------------------------|
| Backend             | Mã NestJS API/worker, Prisma schema và migration SQL, seed tổng hợp, OpenAPI, test |
| Frontend            | Mã React, route và quyền, component test, E2E, cấu hình responsive                 |
| Dữ liệu và tích hợp | Hướng dẫn PostgreSQL/S3/scanner/Mailpit/Jitsi; mẫu biến môi trường không có secret |
| Kiểm chứng          | Ma trận truy vết, test report, coverage, trace, k6 và biên bản video/restore       |
| Vận hành            | Docker Compose, CI, hướng dẫn chạy, backup/restore, sổ lỗi và kịch bản demo        |


# CHƯƠNG 2 YÊU CẦU VÀ QUY TẮC NGHIỆP VỤ

## 2.1 Tác nhân và phạm vi quyền

| **Tác nhân**    | **Quyền chính**                                         | **Giới hạn**                                                            |
|-----------------|---------------------------------------------------------|-------------------------------------------------------------------------|
| Khách           | Tìm và xem tin công khai; đăng ký                       | Không tải CV hoặc nộp hồ sơ                                             |
| Ứng viên        | Profile, CV, ứng tuyển, rút, lịch, kết quả              | Chỉ dữ liệu của mình; không xem đánh giá nội bộ                         |
| Nhà tuyển dụng  | Tin và hồ sơ đúng doanh nghiệp; lịch và kết quả         | Membership hoạt động; không đọc dữ liệu doanh nghiệp khác               |
| Người phỏng vấn | Lịch, CV được phân công và evaluation                   | Chỉ lịch có participant tương ứng và membership còn hiệu lực            |
| Quản trị viên   | Duyệt doanh nghiệp, khóa tài khoản, kiểm duyệt và audit | Không mặc định được tải CV; không thay quyền nghiệp vụ bằng quyền ADMIN |

OWNER có quyền quản lý doanh nghiệp và thực hiện nghiệp vụ recruiter. INTERVIEWER chỉ làm việc với lịch được phân công. Mỗi membership có một permission OWNER, RECRUITER hoặc INTERVIEWER; không mặc định recruiter được ghi phiếu phỏng vấn. Nếu OWNER hoặc RECRUITER cần tham gia phỏng vấn, tài khoản phải có role toàn cục INTERVIEWER và được phân công rõ trên lịch của đúng doanh nghiệp. Quyền ADMIN không tự cấp quyền xem CV hoặc điểm nội bộ.

Đăng ký công khai chỉ cấp CANDIDATE và có thể cấp RECRUITER khi người dùng chọn nhu cầu tuyển dụng; không nhận role tùy ý. OWNER có thể cấp role INTERVIEWER khi thêm một tài khoản đã xác minh vào doanh nghiệp, trong cùng transaction với membership và audit; không cấp ADMIN. Role toàn cục không thay thế membership còn hiệu lực.

Tài nguyên riêng tư không thuộc phạm vi đọc của actor trả 404, kể cả actor đoán được ID. 403 áp dụng khi actor đã được phép biết đối tượng nhưng thiếu quyền thực hiện hành động; ví dụ thành viên xem được công ty nhưng không phải OWNER để sửa thành viên. Danh sách luôn lọc phạm vi ở query; số tổng cũng không được tính từ dữ liệu ngoài phạm vi.

## 2.2 Yêu cầu chức năng và use case

| **Mã** | **Yêu cầu**                                                    | **Use case** | **Ưu tiên** |
|--------|----------------------------------------------------------------|--------------|-------------|
| FR01   | Đăng ký, xác minh email, đăng nhập/đăng xuất, đặt lại mật khẩu | UC04         | Bắt buộc    |
| FR02   | Doanh nghiệp, kiểm duyệt và quản lý thành viên                 | UC10, UC11   | Bắt buộc    |
| FR03   | Tạo nháp, sửa, công bố và đóng tin                             | UC01         | Bắt buộc    |
| FR04   | Tìm tin theo từ khóa, địa điểm, kỹ năng, loại và hình thức     | UC05         | Bắt buộc    |
| FR05   | Profile, upload CV và quản lý phiên bản                        | UC06, UC12   | Bắt buộc    |
| FR06   | Một hồ sơ mỗi ứng viên và tin                                  | UC02         | Bắt buộc    |
| FR07   | Thay hoặc đề nghị thay CV đã nộp                               | UC06         | Bắt buộc    |
| FR08   | Xét duyệt, chuyển trạng thái, rút và theo dõi hồ sơ            | UC07         | Bắt buộc    |
| FR09   | Đề xuất, phản hồi, xác nhận, đổi và hủy lịch                   | UC08         | Bắt buộc    |
| FR10   | Vào phòng phỏng vấn có kiểm tra quyền                          | UC03         | Bắt buộc    |
| FR11   | Đánh giá nội bộ và công bố kết quả                             | UC09, UC13   | Bắt buộc    |
| FR12   | Thông báo trong ứng dụng và email theo sự kiện                 | UC09, UC15   | Bắt buộc    |
| FR13   | Lưu tin và lịch sử ứng tuyển                                   | UC07, UC14   | Nên có      |
| FR14   | Thống kê số tin, hồ sơ và tỷ lệ chuyển bước                    | UC16         | Nên có      |
| FR15   | Quản trị tài khoản, kiểm duyệt tin và audit                    | UC10         | Bắt buộc    |

| **Mã** | **Use case**                            | **Yêu cầu và quy tắc**    |
|--------|-----------------------------------------|---------------------------|
| UC01   | Đăng tin tuyển dụng                     | FR02 FR03; BR01–BR04      |
| UC02   | Nộp CV ứng tuyển                        | FR05 FR06; BR02 BR05–BR07 |
| UC03   | Tham gia phỏng vấn trực tuyến           | FR10; BR12 BR16           |
| UC04   | Đăng ký và xác thực tài khoản           | FR01; BR15 BR18           |
| UC05   | Tìm kiếm và xem tin tuyển dụng          | FR04; BR01 BR02           |
| UC06   | Quản lý CV và đề nghị thay CV đã nộp    | FR05 FR07; BR06–BR08      |
| UC07   | Xét duyệt và rút hồ sơ                  | FR08; BR08 BR09           |
| UC08   | Đặt và quản lý lịch phỏng vấn           | FR09; BR10–BR12           |
| UC09   | Công bố kết quả tuyển dụng              | FR11 FR12; BR09 BR13 BR17 |
| UC10   | Quản trị và kiểm duyệt hệ thống         | FR15; BR15 BR16 BR20      |
| UC11   | Quản lý doanh nghiệp và thành viên      | FR02; BR01 BR05 BR15      |
| UC12   | Cập nhật hồ sơ cá nhân                  | FR05; BR07 BR18           |
| UC13   | Đánh giá và xác nhận hoàn tất phỏng vấn | FR11; BR13 BR14           |
| UC14   | Lưu tin quan tâm                        | FR13; BR01 BR04           |
| UC15   | Đọc và theo dõi thông báo               | FR12; BR17 BR20           |
| UC16   | Xem thống kê tuyển dụng                 | FR14; BR19                |

Các mã UC01 đến UC16 được giữ ổn định để truy vết. UC06 chứa cả kho CV và luồng đề nghị thay CV; UC07 chứa xét duyệt và rút hồ sơ; UC10 chứa điều phối quản trị nhưng từng thay đổi dữ liệu vẫn gọi service sở hữu nghiệp vụ tương ứng.

## 2.3 Các quy tắc bắt buộc

BR01 Quyền theo ngữ cảnh. Mọi mutation xác thực actor, quyền đối tượng, membership hiện tại và trạng thái doanh nghiệp trong transaction khi điều kiện đó có thể bị thay đổi đồng thời. company_id trên URL hoặc body chỉ là dữ liệu chọn ngữ cảnh; không phải bằng chứng quyền. Không nhận candidate_id, created_by, role hoặc trạng thái đặc quyền từ DTO ngoài allowlist.

BR02 Công bố và nhận hồ sơ. Chỉ doanh nghiệp APPROVED có OWNER khả dụng mới được công bố hoặc nhận hồ sơ. Tin phải PUBLISHED và thời điểm kiểm tra tại DB sau khi có khóa phải nhỏ hơn deadline. Đúng deadline bị từ chối. Hạn nhận CV không hạn chế việc xử lý hồ sơ đã nộp hoặc lịch sau đó.

**BR03 Dữ liệu tin. Khi công bố:** tiêu đề 10–150 ký tự; mô tả 100–10000; địa điểm bắt buộc kể cả REMOTE để ghi phạm vi làm việc; headcount là số nguyên 1–100; loại việc và hình thức thuộc danh mục cho phép. Lương hoặc cùng để NULL cả min, max, currency hoặc khai báo đủ cả ba; 0 ≤ min ≤ max, currency VND hoặc USD. headcount là chỉ tiêu kế hoạch, không tự giới hạn số hồ sơ hoặc số HIRED trong phiên bản này.

BR04 Vòng đời tin. DRAFT được thiếu trường nhưng trường đã nhập phải đúng kiểu và giới hạn. Khi PUBLISHED chỉ cho sửa mô tả, địa điểm, kỹ năng, lương và deadline bằng version; deadline mới phải còn ở tương lai. CLOSED không mở lại; DRAFT có thể đóng để bỏ nháp. Đóng hoặc hết hạn không xóa hồ sơ, không tự hủy lịch. Việc xử lý hồ sơ cũ được tiếp tục nếu doanh nghiệp còn được phép hoạt động.

BR05 Một hồ sơ cho một cặp ứng viên và tin. UNIQUE(candidate_id, job_id) áp dụng vĩnh viễn cả với REJECTED và WITHDRAWN. Không cho nộp lại cùng tin. Ứng viên không được ứng tuyển tin của doanh nghiệp mà mình đang có membership hoạt động; không được tự phỏng vấn hoặc tự đánh giá. Kiểm tra xung đột này cả khi thêm membership hoặc phân công lịch sau khi hồ sơ đã tồn tại.

BR06 Tệp CV. Chỉ PDF, byte thực lớn hơn 0 và không quá 10485760; tối đa 20 phiên bản chưa DELETED, gồm upload/quét/rejected. Không chấp nhận PDF mã hóa hoặc có mật khẩu, hỏng, mã độc hoặc chưa xác định được an toàn. Kiểm tra đuôi tệp, MIME, chữ ký và cấu trúc; chỉ READY được sử dụng. Lỗi scanner kỹ thuật không được kết luận tệp sạch hoặc kết luận có mã độc.

BR07 Phiên bản CV. Mỗi lần upload sinh ID, version_no và object mới; không ghi đè. Application giữ original_cv_version_id bất biến, current_cv_version_id đang xét và lịch sử từng lần thay. Khi mới nộp hai ID bằng nhau. Chỉ current_cv_version_id được thay qua UC06; profile mới không thay bất kỳ CV nào. Không xóa CV đang được hồ sơ, lịch sử hoặc đề nghị còn giữ tham chiếu.

BR08 Thay CV. SUBMITTED được thay trực tiếp; SCREENING chỉ tạo một đề nghị PENDING và recruiter duyệt; các trạng thái còn lại cấm. CV mới phải READY, của chính ứng viên và khác CV hiện tại. Đề nghị ghi base_cv_version_id; duyệt chỉ khi current_cv_version_id còn bằng base. Mọi thay đổi dùng version của hồ sơ và đề nghị; rời SCREENING tự hủy đề nghị cùng transaction.

BR09 Chuyển trạng thái. Mọi thay đổi có cạnh hợp lệ, actor, lý do khi cần và version. HIRED và REJECTED chỉ được tạo qua UC09 cùng nội dung và thời điểm công bố. WITHDRAWN do ứng viên; được rút cả khi đang INTERVIEW_SCHEDULED, đồng thời hủy toàn bộ lịch PROPOSED/CONFIRMED, giải phóng reservation và thu hồi quyền phòng. Các trạng thái cuối không mở lại trong phiên bản đầu.

BR10 Lịch phỏng vấn. Mỗi lịch gắn một hồ sơ, đúng một participant CANDIDATE là chủ hồ sơ và ít nhất một INTERVIEWER khác ứng viên. Thời lượng 15–120 phút; start_at tương lai tại thời điểm tạo và xác nhận. Không có interviewer trùng. Mọi participant cần ACCEPTED trước khi CONFIRMED; PROPOSED không giữ chỗ. Khoảng chiếm lịch là \[start_at, end_at), cho phép hai lịch nối tiếp.

BR11 Thay thế và kết thúc lịch. Đổi lịch tạo đề xuất thay thế; lịch cũ tiếp tục giữ chỗ đến lúc lịch mới được CONFIRMED. Một lịch chỉ có một đề xuất thay thế PROPOSED. Xác nhận mới, hủy cũ, đổi reservation, cập nhật hồ sơ và ghi sự kiện nằm trong một transaction. Lời mời chưa xác nhận hết hạn khi DB time ≥ start_at. Lịch đã bắt đầu không đổi giờ; sau end_at phải hoàn tất hoặc ghi nhận NO_SHOW.

BR12 Quyền vào phòng. Chỉ participant hợp lệ của CONFIRMED được xin quyền từ start_at−10 phút đến trước end_at+30 phút, biên đầu bao gồm và biên cuối không bao gồm. Token tối đa 5 phút và không vượt cuối cửa sổ. Adapter phải gắn với phiên bản quyền phòng; provider phải kiểm trạng thái mới khi join. Hủy, rút, khóa người dùng, đình chỉ hoặc đổi thành viên đều có luồng thu hồi quyền tương ứng.

BR13 Đánh giá. Chỉ interviewer được phân công, membership còn hợp lệ, attendance ATTENDED được ghi phiếu sau end_at và trước lúc hồ sơ có kết quả cuối. Ba điểm nguyên 1–5, recommendation HIRE/HOLD/REJECT và note 1–5000 ký tự. Một phiếu mỗi lịch và interviewer. Ứng viên không thấy điểm, note, khuyến nghị hoặc lý do nội bộ qua API, lịch sử, email hay thống kê.

BR14 Hoàn tất phỏng vấn. Sau end_at, recruiter ghi attendance có lý do đối với ABSENT. COMPLETED cần ứng viên ATTENDED, ít nhất một interviewer ATTENDED, không còn UNKNOWN và đủ phiếu của mọi interviewer ATTENDED. NO_SHOW chỉ được ghi từ end_at+30 phút nếu ứng viên ABSENT hoặc tất cả interviewer ABSENT. INTERVIEWED cần ít nhất một lịch COMPLETED, đủ phiếu và không còn PROPOSED hoặc CONFIRMED chưa xử lý.

BR15 Tài khoản và owner. Email chuẩn hóa trim và chữ thường, duy nhất; không tự bỏ dấu chấm hoặc phần +tag. Token verify/reset dùng một lần đúng purpose và còn hạn. Reset mật khẩu/khóa tài khoản thu hồi mọi session; logout thu hồi session hiện tại. Thao tác OWNER bình thường không được làm mất OWNER hoạt động cuối. Khóa an ninh của ADMIN vẫn có hiệu lực dù là OWNER cuối; doanh nghiệp khi đó bị chặn mutation cho đến khi phục hồi OWNER qua thao tác có audit.

BR16 Đình chỉ doanh nghiệp. SUSPENDED bị loại khỏi tìm kiếm, dừng nhận hồ sơ, công bố tin, xem CV, join và mutation tuyển dụng; dữ liệu cũ được giữ. Ứng viên vẫn được đọc hồ sơ của mình và rút. ADMIN có lệnh hủy lịch/thu hồi quyền để xử lý an toàn; mở lại doanh nghiệp chỉ qua quyết định quản trị có lý do. Không tự công bố lại tin đã CLOSED hoặc khôi phục lịch đã hủy.

BR17 Thông báo và sự kiện. Mỗi mutation thành công ghi Outbox cùng transaction; provider được gọi sau commit. Notification chống trùng theo user và event; email theo event, user và template. SMTP có thể gửi lặp khi timeout hoặc worker chết sau khi gửi; không cam kết exactly once nếu provider không hỗ trợ. Event không mang CV, điểm nội bộ hoặc bí mật dạng rõ.

BR18 Dữ liệu đầu vào. Trim và chuẩn hóa Unicode NFC đối với văn bản thông thường; độ dài tính theo Unicode code point sau chuẩn hóa, không theo byte; giới hạn byte áp dụng riêng cho password và tệp. Không tự trim hoặc chuẩn hóa password. Chuỗi bắt buộc không được chỉ có khoảng trắng. Giới hạn mảng kỹ năng/interviewer, pageSize và độ dài tìm kiếm trước truy vấn.

BR19 Thời gian và số liệu. API nhận ISO8601 có Z hoặc offset; DB dùng timestamptz; UI hiển thị Asia/Ho_Chi_Minh. Không dùng giờ máy client để quyết định deadline hay quyền join. Thống kê cohort theo submitted_at trong \[from, to), tối đa 366 ngày; mỗi hồ sơ chỉ đếm một lần cho một mốc dù quay lại trạng thái. Mẫu số bằng 0 trả rate = NULL.

BR20 Dữ liệu lỗi và lịch sử. Lỗi request không tạo lịch sử thành công, kết quả hoặc Outbox nghiệp vụ. Có thể ghi log an ninh riêng cho truy cập bị chặn, đã làm sạch. ApplicationHistory và Audit chỉ thêm; log không chứa password, cookie, token, CV, URL ký đầy đủ hoặc nội dung phiếu. API lỗi có code, message, fieldErrors và traceId, không có stack trace.

## 2.4 Mục tiêu phi chức năng

| **Mã** | **Mục tiêu**                                                                                                                            | **Cách xác minh**                                                                                     |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| NFR01  | 100000 metadata CV; mỗi tệp tối đa 10 MiB; không lưu binary trong PostgreSQL                                                            | Seed 100000 metadata; kiểm tra schema và kho tệp; nghiệm thu dung lượng tách demo                     |
| NFR02  | 100 người dùng đồng thời; p95 API tìm tin/xem hồ sơ/cập nhật metadata \<= 2 giây; lỗi ngoài 4xx hợp lệ \< 1%                            | k6: warm-up 2 phút, đo 15 phút; 10000 tin, 100000 metadata; máy mục tiêu 4 vCPU/8 GiB/SSD             |
| NFR03  | Upload 10 MiB \<= 15 giây khi băng thông \>= 20 Mbps và RTT \<= 100 ms; quét \<= 60 giây ở tải chuẩn                                    | 30 upload và 30 lần quét; ghi p95 và thời điểm từng bước; không gộp vào NFR02                         |
| NFR04  | HTTPS, quyền đối tượng, URL CV và token phòng tối đa 5 phút; session cookie an toàn; không lộ dữ liệu nhạy cảm trong log                | Test quyền, CSRF, hết hạn; provider chặn join mới khi thu hồi; mục tiêu đóng kết nối đang có ≤60 giây |
| NFR05  | Không trùng hồ sơ, không cập nhật mất dữ liệu hoặc tự đổi snapshot CV                                                                   | Integration test đồng thời có barrier; truy vấn DB sau commit/rollback                                |
| NFR06  | Backup DB hàng ngày và kho tệp có versioning; RPO \<= 24 giờ, RTO \<= 4 giờ                                                             | Diễn tập restore DB và object, đối chiếu checksum/tệp tham chiếu                                      |
| NFR07  | Hoạt động ở 360, 768, 1366 px; dùng bàn phím; form có label và lỗi liên kết trường                                                      | Playwright đa viewport; kiểm tra bàn phím, focus và axe; kiểm tra thủ công                            |
| NFR08  | Lỗi email/video/kho tệp không làm mất hồ sơ đã commit; retry có giới hạn và chống trùng                                                 | Fault injection, fake adapter, lease worker và xử lý event FAILED                                     |
| NFR09  | Ít nhất 95% lần join hợp lệ \<= 10 giây, chưa tính thời gian cấp quyền thiết bị                                                         | 30 phiên với Jitsi thật và mạng ghi nhận; CI mock không chứng minh chỉ tiêu này                       |
| NFR10  | Backend lines \>= 80%, branches \>= 70%; frontend lines \>= 80%, branches \>= 70%; test bắt buộc không skip; không còn lỗi nghiêm trọng | Jest/Vitest coverage, JUnit XML, Playwright report và sổ lỗi; gate kiểm tra bộ test có thực thi       |

NFR là mục tiêu nghiệm thu trên môi trường được ghi cấu hình. Dung lượng tối đa của 100000 CV cỡ 10 MiB xấp xỉ 976,56 GiB, cộng 20% dự phòng khoảng 1,15 TiB cho bản chính; backup, versioning và log tính riêng. Seed 100000 metadata không chứng minh đã nghiệm thu dung lượng vật lý của kho tệp.

# CHƯƠNG 3 ĐẶC TẢ USE CASE VÀ NGOẠI LỆ

## 3.1 Hợp đồng chung cho các use case

Mỗi use case sau nêu tác nhân, tiền điều kiện, luồng chính, thay thế, ngoại lệ và hậu điều kiện. Các ràng buộc BR01–BR20 áp dụng đồng thời. Version bắt buộc cho mutation đối tượng đã có; tạo mới không giả lập version. Request lặp sử dụng cùng Idempotency-Key và cùng payload; timeout chưa xác định kết quả phải tra lại resource trước khi tạo thao tác mới.

Mỗi mutation bao gồm kiểm tra quyền hiện tại, validation và transaction theo mục 4.4. Có thể kiểm tra sớm để phản hồi nhanh nhưng phải kiểm lại điều kiện có thể thay đổi dưới khóa. API chỉ trả thành công sau commit; không chờ email. Khi thất bại phải giữ nguyên aggregate, các quan hệ, lịch sử và sự kiện thành công của use case.

### 3.1.1 UC01 Đăng tin tuyển dụng

**Mục tiêu và kích hoạt:** Công bố vị trí hợp lệ cho đúng doanh nghiệp. Recruiter tạo nháp, sửa, công bố hoặc đóng tin.

**Dữ liệu vào và đầu ra:** Job DTO, company context, version và reason khi đóng. Đầu ra: jobId, status, version; một tin công khai khi đủ điều kiện.

**Liên kết thiết kế:** UI17 UI18 UI02; Hình 3.2 và 3.4.

**Tác nhân:** Nhà tuyển dụng có membership OWNER hoặc RECRUITER.

**Tiền điều kiện:** Đã xác minh email; doanh nghiệp APPROVED, có OWNER khả dụng; thao tác trên đúng công ty.

**Luồng chính**

1\. Tạo DRAFT bằng DTO allowlist; server gán company và created_by sau kiểm quyền.

2\. Lưu nháp với các trường đã nhập đúng kiểu; nháp không xuất hiện trong API công khai.

3\. Khi công bố, gửi version; khóa actor, company và job rồi kiểm lại BR02–BR04 và deadline bằng DB time.

4\. Cập nhật PUBLISHED, published_at, version; ghi audit và Outbox trong cùng transaction.

5\. Sửa tin đang công bố bằng version và field allowlist; đóng tin có lý do, không xóa hồ sơ hoặc lịch cũ.

**Luồng thay thế và ngoại lệ:** Dữ liệu sai trả 400 theo field; membership không có quyền trả 403/404 theo phạm vi; company chưa duyệt/đình chỉ hoặc deadline không hợp lệ trả 409; version cũ trả 409. Đóng đồng thời nộp phải dùng chung khóa job. Không đổi company của tin hoặc mở lại CLOSED.

**Hậu điều kiện:** Tin công bố hợp lệ có DTO công khai, không chứa dữ liệu ứng viên; mọi lỗi rollback cả thay đổi và event.

**Dữ liệu và kiểm chứng:** JobModule; job_post, job_skill, audit, outbox; TC01–TC04, EC37–EC38; BE1.

### 3.1.2 UC02 Nộp CV ứng tuyển

**Mục tiêu và kích hoạt:** Tạo một hồ sơ có CV xác định và không trùng. Ứng viên xác nhận nộp trên UI09.

**Dữ liệu vào và đầu ra:** jobId, cvId READY, coverLetter, Idempotency-Key. Đầu ra: applicationId, trạng thái SUBMITTED, original/current CV và version.

**Liên kết thiết kế:** UI02 UI08 UI09 UI11; Hình 3.1, 3.4, 3.6 và 3.11.

**Tác nhân:** Ứng viên đã xác minh email.

**Tiền điều kiện:** Có CV READY thuộc mình; không là thành viên hoạt động của doanh nghiệp đăng tin.

**Luồng chính**

1\. Đọc tin và chọn CV, hiển thị rõ phiên bản; nhập cover_letter không quá 3000 ký tự.

2\. Gửi cvId và Idempotency-Key; không nhận candidate_id từ body.

3\. Khóa user ứng viên, company, job và CV; kiểm READY, ownership, tin PUBLISHED, company được vận hành và DB time \< deadline.

4\. Tạo Application SUBMITTED với original_cv_version_id = current_cv_version_id = cvId; ghi snapshot tên/liên hệ cần thiết từ profile vào application.

5\. Cùng transaction ghi History SUBMIT, Outbox và IdempotencyRecord COMPLETED; trả 201 sau commit.

**Luồng thay thế và ngoại lệ:** CV của người khác trả 404; CV chưa READY, tin đóng/hết hạn, đã từng nộp hoặc tự ứng tuyển trả 409. Cùng key/payload trả lại resource; khác payload trả 409. UNIQUE ngăn hai request khác key tạo trùng. Lỗi History hoặc Outbox rollback Application. Email lỗi sau commit không đổi kết quả nộp.

**Hậu điều kiện:** Một hồ sơ duy nhất; CV gốc bất biến; timeout tra lại resource hoặc retry cùng key.

**Dữ liệu và kiểm chứng:** ApplicationModule; application, history, CV, idempotency, outbox; TC08–TC12, TC41–TC42, EC01–EC03, EC29; BE2.

### 3.1.3 UC03 Tham gia phỏng vấn trực tuyến

**Mục tiêu và kích hoạt:** Chỉ participant hợp lệ được vào đúng phòng đúng thời gian. Người dùng chọn Vào phòng từ chi tiết lịch.

**Dữ liệu vào và đầu ra:** interviewId và session/CSRF; không nhận userId tự khai. Đầu ra: Thông tin join ngắn hạn hoặc lỗi quyền/thời gian/provider.

**Liên kết thiết kế:** UI14 UI15; Hình 3.2 và 3.14.

**Tác nhân:** Ứng viên và interviewer được phân công.

**Tiền điều kiện:** Lịch CONFIRMED, trong cửa sổ join; user ACTIVE, company APPROVED, membership/phân công còn hiệu lực.

**Luồng chính**

1\. Mở chi tiết lịch, xem giờ có múi giờ và kiểm tra thiết bị ở frontend.

2\. POST join với session/CSRF; service kiểm quyền hiện tại, trạng thái hồ sơ và access_generation.

3\. Tạo quyền phòng giới hạn đúng interview, user, generation; TTL tối đa 5 phút và không vượt end_at+30 phút.

4\. Provider kiểm quyền khi join; frontend mở Jitsi IFrame bằng cấu hình nhận được.

5\. Khi ngắt kết nối chỉ retry join nếu lịch và quyền còn hiệu lực; rời phòng không tự hoàn tất phỏng vấn.

**Luồng thay thế và ngoại lệ:** Ngoài phạm vi đọc trả 404; người biết lịch nhưng không đủ quyền join trả 403. Lịch hủy/ngoài cửa sổ trả 409, provider lỗi 503. Camera bị từ chối xử lý trên UI, không ghi đã tham dự từ việc cấp token. Token cũ phải bị provider chặn sau cancel/revoke; kiểm tra kết nối đang có theo mục 4.6.

**Hậu điều kiện:** Không công khai tên phòng cố định hoặc token trong log; cấp token không là bằng chứng attendance.

**Dữ liệu và kiểm chứng:** InterviewModule; VideoPort, interview/participant; TC16–TC18, TC28, EC16, EC24; BE3.

### 3.1.4 UC04 Đăng ký và xác thực tài khoản

**Mục tiêu và kích hoạt:** Tạo danh tính xác minh được và phiên có thể thu hồi. Đăng ký, verify, login, logout, forgot hoặc reset.

**Dữ liệu vào và đầu ra:** DTO auth hoặc token đúng purpose, session/Origin theo thao tác. Đầu ra: Account/verified state, session mới hoặc trạng thái token đã dùng.

**Liên kết thiết kế:** UI03–UI06; Hình 3.1 và 3.10.

**Tác nhân:** Khách và người dùng.

**Tiền điều kiện:** Email hợp lệ; password thỏa ký tự và byte; chấp nhận các vai trò công khai được phép.

**Luồng chính**

1\. Chuẩn hóa email, giữ password nguyên bản; tạo account và role allowlist, candidate_profile nếu có CANDIDATE.

2\. Tạo token VERIFY_EMAIL có purpose, hash và hạn; cùng transaction tạo event gửi token mã hóa.

3\. Verify dùng update consumed_at có điều kiện token đúng purpose, chưa dùng, còn hạn; sau đó gán verified.

4\. Login kiểm BCrypt ngoài transaction; khi tạo session dưới khóa user phải kiểm lại status và password_hash vẫn đúng hash vừa xác thực, tránh race reset mật khẩu. Sinh session/CSRF mới, không dùng token client cung cấp.

5\. Forgot/resend trả 202 chung; reset tiêu thụ token, đổi password và thu hồi toàn bộ session trong một transaction.

6\. Logout thu hồi session hiện tại; user đã khóa bị chặn ở request tiếp theo dù cookie còn hạn.

**Luồng thay thế và ngoại lệ:** Đăng nhập sai trả 401 chung; token hết hạn/đã dùng trả 409 TOKEN_INVALID; token sai purpose không có tác dụng. Đăng ký email đã tồn tại trả 202 chung, không sửa user hoặc gửi thông tin lạ. Gửi lại vô hiệu token cũ cùng purpose. Hai reset đồng thời chỉ một commit; vượt ngưỡng 429. Mật khẩu trên 72 byte không được cắt.

**Hậu điều kiện:** DB không lưu token gốc dạng rõ; Outbox auth mã hóa bằng khóa riêng ngoài DB, worker xóa vật liệu gửi sau dùng/hết hạn.

**Dữ liệu và kiểm chứng:** IdentityModule; account, role, session, token, profile, outbox; TC26, TC31–TC34, EC19–EC20, EC23; BE1.

### 3.1.5 UC05 Tìm kiếm và xem tin tuyển dụng

**Mục tiêu và kích hoạt:** Tìm và đọc tin công khai còn phù hợp. Mở danh sách, đổi bộ lọc hoặc xem tin.

**Dữ liệu vào và đầu ra:** Query allowlist, page/pageSize/sort hoặc jobId. Đầu ra: Danh sách và total cùng scope, hoặc DTO chi tiết công khai.

**Liên kết thiết kế:** UI01 UI02; Hình 3.1 và 3.4.

**Tác nhân:** Khách và ứng viên.

**Tiền điều kiện:** Không bắt buộc đăng nhập.

**Luồng chính**

1\. Nhận keyword tối đa 200 ký tự, location, skillIds, employment_type, work_mode, page và sort allowlist.

2\. Truy vấn chỉ tin PUBLISHED còn deadline thuộc company APPROVED có OWNER khả dụng; dùng tham số SQL.

3\. Phân trang pageSize 1–50 với thứ tự ổn định published_at,id; total dùng cùng scope và filter.

4\. Trả DTO công khai; chi tiết tin đã từng công bố nhưng hết hạn/đóng có nhãn ngừng nhận nếu công ty không bị đình chỉ.

**Luồng thay thế và ngoại lệ:** Filter/UUID/giá trị số sai trả 400; kết quả rỗng là 200 với data rỗng. DRAFT và tin của công ty SUSPENDED trả 404 cho khách. Không trả contact cá nhân, membership hoặc số liệu ứng viên. Tin vừa hết hạn có thể còn trên UI cũ nhưng UC02 phải từ chối dưới khóa.

**Hậu điều kiện:** Không lộ nháp hoặc dữ liệu riêng tư; URL tái lập bộ lọc.

**Dữ liệu và kiểm chứng:** JobModule; JobQueryRepository; TC25, EC34, EC38; BE1.

### 3.1.6 UC06 Quản lý CV và đề nghị thay CV đã nộp

**Mục tiêu và kích hoạt:** Quản lý CV bất biến và thay bản đang xét đúng trạng thái. Upload, yêu cầu xóa, thay trực tiếp hoặc gửi/duyệt đề nghị.

**Dữ liệu vào và đầu ra:** Upload attempt hoặc newCvId, applicationVersion, requestVersion. Đầu ra: CV state hoặc currentCv mới/PENDING; original không đổi.

**Liên kết thiết kế:** UI08 UI11 UI20; Hình 3.5, 3.7 và 3.12.

**Tác nhân:** Ứng viên; recruiter đúng doanh nghiệp khi duyệt.

**Tiền điều kiện:** Ứng viên đã xác minh, còn slot CV; CV thay thế phải READY thuộc mình.

**Luồng chính**

1\. Upload-init khóa user, đếm toàn bộ bản chưa DELETED và giữ chỗ; cấp upload attempt gắn object key riêng.

2\. Backend stream có giới hạn byte vào quarantine; finalize một lần cho attempt thắng, lưu storage version.

3\. Worker có lease kiểm MIME/chữ ký/cấu trúc/mật khẩu/checksum/scanner của đúng object version; chỉ sạch mới READY.

4\. Thay ở SUBMITTED cập nhật current_cv_version_id, tăng application version và ghi History; original không đổi.

5\. Ở SCREENING tạo một PENDING có base/current và new CV ID; recruiter duyệt bằng applicationVersion và requestVersion dưới khóa.

6\. Duyệt chỉ khi base còn đúng, CV còn READY và hồ sơ vẫn SCREENING; cập nhật current CV, đề nghị, History, version và Outbox cùng transaction.

7\. Chủ CV xóa bản không tham chiếu bằng DELETE_PENDING; worker xóa object rồi DELETED, có retry và reconciliation.

**Luồng thay thế và ngoại lệ:** Byte vượt ngưỡng 413; loại không hỗ trợ 415; PDF hỏng/mã hóa/mã độc không READY. Quá 20 CV hoặc file đang tham chiếu 409. CV hiện tại giống CV mới là thao tác không hợp lệ 409; đề nghị trùng 409. Rời SCREENING hủy PENDING; approve versus chuyển bước chỉ một tác dụng hợp lệ. Lỗi kỹ thuật scanner hiển thị TECHNICAL_FAILURE, không ghi là mã độc.

**Hậu điều kiện:** Tệp và CV gốc bất biến; current chỉ thay hợp lệ; lịch sử giữ cả old/new đúng candidate.

**Dữ liệu và kiểm chứng:** CvModule và ApplicationModule; CV/change/history; TC05–TC07, TC10–TC13, TC21–TC23, TC37–TC40; EC01–EC07, EC28–EC31; BE2.

### 3.1.7 UC07 Xét duyệt và rút hồ sơ

**Mục tiêu và kích hoạt:** Đưa hồ sơ qua cạnh xét duyệt hợp lệ hoặc rút có xử lý lịch. Recruiter review hoặc candidate xác nhận rút.

**Dữ liệu vào và đầu ra:** applicationId, expectedVersion, command và reason nếu cần. Đầu ra: Status/version/history; withdraw hủy lịch mở và quyền phòng.

**Liên kết thiết kế:** UI10 UI11 UI19 UI20; Hình 3.1, 3.2 và 3.4.

**Tác nhân:** Recruiter đúng doanh nghiệp; ứng viên sở hữu.

**Tiền điều kiện:** User và quyền còn hiệu lực; hồ sơ chưa kết thúc; expectedVersion hiện tại.

**Luồng chính**

1\. Danh sách và chi tiết lọc phạm vi ở repository; mapper tách candidate/recruiter DTO.

2\. Recruiter chỉ chuyển SUBMITTED sang SCREENING hoặc SCREENING sang SHORTLISTED qua lệnh review; service kiểm cạnh mục 3.2.

3\. Ghi trạng thái, version, History và Outbox; rời SCREENING hủy PENDING CV request.

4\. Ứng viên rút ở bất kỳ trạng thái chưa kết thúc kể cả INTERVIEW_SCHEDULED hoặc INTERVIEWED.

5\. Workflow khóa toàn bộ phạm vi liên quan, chuyển WITHDRAWN, hủy PROPOSED/CONFIRMED, giải phóng reservation, vô hiệu quyền phòng và đề nghị CV cùng transaction.

**Luồng thay thế và ngoại lệ:** Sai cạnh/version trả 409; đối tượng ngoài scope trả 404. Endpoint review không nhận HIRED/REJECTED/INTERVIEWED tùy ý. Withdraw versus result/confirm chỉ một transaction có version hợp lệ thắng; kết quả cuối không bị sửa. Lịch COMPLETED/NO_SHOW giữ làm lịch sử sau rút; phòng đang có kết nối dùng cơ chế thu hồi. WITHDRAWN không nộp lại.

**Hậu điều kiện:** Mọi thay đổi có lịch sử; không có lịch mở của hồ sơ WITHDRAWN; DTO ứng viên không có note nội bộ.

**Dữ liệu và kiểm chứng:** ApplicationModule và ApplicationExitCoordinator; TC19, TC43, EC05, EC08–EC09, EC32–EC33; BE2.

### 3.1.8 UC08 Đặt và quản lý lịch phỏng vấn

**Mục tiêu và kích hoạt:** Tạo lịch được mọi người đồng ý và không trùng slot. Recruiter đề xuất/đổi/hủy hoặc participant phản hồi.

**Dữ liệu vào và đầu ra:** Thời gian có offset, interviewerIds, version và key. Đầu ra: PROPOSED/CONFIRMED hoặc kết thúc; reservation nguyên tử.

**Liên kết thiết kế:** UI13 UI14 UI21; Hình 3.8 và 3.13.

**Tác nhân:** Recruiter tổ chức; ứng viên và interviewer phản hồi.

**Tiền điều kiện:** Hồ sơ SHORTLISTED hoặc INTERVIEW_SCHEDULED; company được vận hành; đúng candidate và ít nhất một interviewer hợp lệ.

**Luồng chính**

1\. Tạo PROPOSED với start_at tương lai, thời lượng hợp lệ và danh sách participant không lặp; expires_at = start_at, hoặc min(start_at mới, start_at cũ) khi thay thế.

2\. Participant ACCEPTED/DECLINED bằng version; DECLINED làm lịch kết thúc và thông báo người tổ chức. PROPOSED không giữ slot.

3\. Phản hồi chấp nhận cuối khóa users tăng dần, company, application và lịch; kiểm lại toàn bộ quyền, start_at, responses và conflict.

4\. Insert reservation cho mọi participant rồi chuyển CONFIRMED, cập nhật application INTERVIEW_SCHEDULED, History và Outbox cùng transaction.

5\. Đổi lịch tạo PROPOSED mới trỏ replaces_interview_id, giữ lịch cũ CONFIRMED. Khi xác nhận mới, release reservation cũ và tạo mới trong cùng transaction; nếu lỗi rollback lịch cũ nguyên vẹn.

6\. Trước start_at có thể hủy với lý do; worker hoặc request phát hiện proposal hết hạn chuyển EXPIRED, không xác nhận muộn.

7\. Khi lịch kết thúc, chuyển qua UC13 ghi attendance và COMPLETED/NO_SHOW; sau khi hủy cuối chỉ lùi SHORTLISTED nếu chưa có vòng COMPLETED/NO_SHOW.

**Luồng thay thế và ngoại lệ:** Conflict lần chấp nhận cuối trả 409 và rollback cả response cuối, lịch giữ PROPOSED với người đó còn PENDING. Có thể tạo proposal giờ mới hoặc hủy; không để tất cả ACCEPTED mà chưa xác nhận. Đề xuất thay thế từ chối/hết hạn không đụng lịch cũ; xác nhận thay thế chỉ khi lịch cũ vẫn CONFIRMED và chưa bắt đầu. Hủy lịch cũ phải hủy mọi proposal thay thế của nó. Không sửa giờ/participant tại chỗ trên CONFIRMED. Thu hồi membership thường chỉ hoàn tất sau xử lý lịch; khóa an ninh không bị chặn.

**Hậu điều kiện:** Lịch CONFIRMED có reservation đầy đủ, không overlap; task provider sau commit; mọi lịch mới có room key và access generation riêng.

**Dữ liệu và kiểm chứng:** InterviewModule; interview/participant/reservation; TC14–TC15, TC18, TC44–TC46; EC10–EC17; BE3.

### 3.1.9 UC09 Công bố kết quả tuyển dụng

**Mục tiêu và kích hoạt:** Công bố quyết định cuối mà không lộ đánh giá nội bộ. Recruiter xác nhận preview kết quả trên UI23.

**Dữ liệu vào và đầu ra:** result, publicMessage, internalReason, version, key. Đầu ra: Status cuối, publishedAt, History và Outbox cùng commit.

**Liên kết thiết kế:** UI11 UI20 UI23; Hình 3.9 và 3.15.

**Tác nhân:** Recruiter đúng doanh nghiệp; ứng viên nhận kết quả.

**Tiền điều kiện:** Hồ sơ chưa kết thúc; HIRED chỉ từ INTERVIEWED; REJECTED theo mục 3.2; có version và nội dung công khai.

**Luồng chính**

1\. Xem phiếu nội bộ và mức hoàn thành; nhập result HIRED/REJECTED, message công khai 1–3000 ký tự và lý do nội bộ nếu từ chối.

2\. Xem trước đúng nội dung ứng viên sẽ nhận; endpoint không lưu trạng thái cuối chưa công bố.

3\. Khóa scope, application và lịch liên quan; kiểm cạnh, version và điều kiện. REJECTED từ giai đoạn phỏng vấn yêu cầu không còn CONFIRMED; PROPOSED được hủy cùng transaction.

4\. ApplicationResultPort ghi trạng thái, result_message, result_published_at, history, hủy đề nghị/lịch proposal, Outbox và idempotency cùng transaction.

5\. Trả kết quả đã công bố; worker gửi nội dung công khai, không đính phiếu hoặc note.

**Luồng thay thế và ngoại lệ:** Thiếu message/lý do trả 400; HIRED sớm hoặc còn lịch chưa xử lý trả 409. Retry cùng key/payload trả resource không tạo event mới. Withdraw hay result đồng thời kiểm version dưới cùng khóa. Email lỗi không rollback kết quả. Sau công bố không sửa kết quả hoặc phiếu trong phiên bản này; cần thay đổi nghiệp vụ phải mở yêu cầu tính năng riêng.

**Hậu điều kiện:** HIRED/REJECTED luôn có published_at và message; không tồn tại kết quả cuối ẩn mà candidate vẫn thấy trạng thái cũ.

**Dữ liệu và kiểm chứng:** Interview workflow + ApplicationResultPort; TC20, TC50, EC08–EC09, EC27; BE3.

### 3.1.10 UC10 Quản trị và kiểm duyệt hệ thống

**Mục tiêu và kích hoạt:** Quản trị an ninh và kiểm duyệt có audit, không vượt quyền CV. ADMIN duyệt, đình chỉ, khóa, đóng tin, recovery hoặc retry.

**Dữ liệu vào và đầu ra:** Đối tượng, quyết định, reason và version hiện hành. Đầu ra: Trạng thái quản trị, audit và task thu hồi/thông báo nếu có.

**Liên kết thiết kế:** UI26–UI28; Hình 3.3 và 3.4.

**Tác nhân:** ADMIN được cấp qua quy trình nội bộ.

**Tiền điều kiện:** Actor ADMIN ACTIVE; hành động có reason và expectedVersion.

**Luồng chính**

1\. Liệt kê company chờ duyệt, user, tin vi phạm, audit và task FAILED theo phạm vi quản trị.

2\. Duyệt/từ chối/đình chỉ company qua CompanyAdminPort; cập nhật trạng thái, audit và Outbox cùng transaction.

3\. Khóa user qua IdentityAdminPort, thu hồi mọi session và phát sự kiện thu hồi quyền video; quyền join mới bị chặn ngay ở policy/provider.

4\. Nếu user là OWNER khả dụng cuối, company bị chặn mutation theo CompanyRules; ADMIN phục hồi bằng gán OWNER cho thành viên ACTIVE đã xác minh qua lệnh có audit.

5\. Đóng tin qua JobAdminPort; hủy lịch do sự cố an ninh qua InterviewAdminPort; retry FAILED bằng event cũ có lý do.

**Luồng thay thế và ngoại lệ:** Không phải ADMIN trả 403; role ADMIN không tải CV/đọc evaluation nếu thiếu quyền nghiệp vụ. Đình chỉ versus submit/publish dùng khóa company; mở lại không khôi phục lịch hủy. Khóa an ninh không bị chặn bởi lịch tương lai; hiển thị lịch cần xử lý và quyền phòng đang thu hồi. Không khóa/thu hồi ADMIN khả dụng cuối qua API thường; serialize lệnh liên quan ADMIN để hai người không cùng làm mất người quản trị cuối. Phục hồi khẩn cấp dùng runbook được kiểm soát ngoài ứng dụng.

**Hậu điều kiện:** Quản trị có actor/reason/version; dữ liệu cũ giữ lại và có đường phục hồi rõ; lỗi không tạo audit thành công.

**Dữ liệu và kiểm chứng:** AdminModule điều phối Identity/Company/Job/Interview; TC55–TC57, EC21–EC24; BE1.

### 3.1.11 UC11 Quản lý doanh nghiệp và thành viên

**Mục tiêu và kích hoạt:** Thiết lập doanh nghiệp và duy trì quyền membership/OWNER. Tạo company hoặc OWNER chỉnh thành viên.

**Dữ liệu vào và đầu ra:** Company DTO, user/permission/active, version. Đầu ra: Company PENDING và OWNER, hoặc membership hợp lệ có audit.

**Liên kết thiết kế:** UI16; Hình 3.2 và 5.2.

**Tác nhân:** RECRUITER tạo công ty; OWNER quản lý thành viên.

**Tiền điều kiện:** Tài khoản đã xác minh; công ty mục tiêu và role trong phạm vi cho phép.

**Luồng chính**

1\. Tạo company PENDING và OWNER của người tạo trong cùng transaction; registration_code chuẩn hóa trim/uppercase và duy nhất.

2\. OWNER thêm user đã đăng ký và xác minh theo email chuẩn hóa; đặt permission trong allowlist; cấp role INTERVIEWER nếu cần trong cùng transaction có audit.

3\. Cập nhật hoặc chuyển OWNER bằng version membership/company; khóa target users rồi company để bảo đảm hai thao tác không cùng bỏ OWNER cuối.

4\. Thu hồi membership thông thường yêu cầu xử lý toàn bộ lịch PROPOSED/CONFIRMED chưa kết thúc của người đó trước; không kiểm mỗi lịch tương lai đã xác nhận.

5\. Không thêm ứng viên vào membership hoạt động của doanh nghiệp nếu họ còn hồ sơ chưa kết thúc tại đó; phải kết thúc hồ sơ trước để tránh tự xét/tự phỏng vấn.

**Luồng thay thế và ngoại lệ:** Registration code trùng 409; chưa xác minh hoặc role không cho phép 400/409; không phải OWNER 403. Hai OWNER cùng rời chỉ một thành công. Không cấp ADMIN qua membership. Khóa an ninh của ADMIN đi qua UC10 và được ưu tiên. Công ty REJECTED có thể chỉnh rồi gửi lại PENDING; SUSPENDED không tự gửi lại để bỏ quyết định đình chỉ.

**Hậu điều kiện:** Company có OWNER membership; các thay đổi quyền có audit/version và không tạo lịch tham gia sai công ty.

**Dữ liệu và kiểm chứng:** CompanyModule; company/membership/role; TC35–TC36, EC17, EC21–EC22; BE1.

### 3.1.12 UC12 Cập nhật hồ sơ cá nhân

**Tình trạng triển khai BE2:** [bàn giao UC12](be2-profile-handoff.md) ghi service, repository, OpenAPI/JSON Schema và kiểm thử với fake transaction. Cập nhật account name qua port BE1, profile/kỹ năng BE2 và event cùng transaction; snapshot application cũ không đổi. Route HTTP, guard/session và migration PostgreSQL thật chưa có nên UC12 chưa nghiệm thu. Quy tắc dưới đây giữ nguyên.

**Mục tiêu và kích hoạt:** Cập nhật profile cho lần nộp tiếp theo. Ứng viên lưu biểu mẫu profile.

**Dữ liệu vào và đầu ra:** Profile DTO, skillIds và version. Đầu ra: Profile mới, không sửa CV/snapshot đã nộp.

**Liên kết thiết kế:** UI07; Hình 3.1 và 5.1.

**Tác nhân:** Ứng viên sở hữu.

**Tiền điều kiện:** Role CANDIDATE, session hợp lệ, profile version hiện tại.

**Luồng chính**

1\. Đọc DTO profile và kỹ năng đang dùng; không trả hash hoặc thông tin membership nhạy cảm.

2\. Sửa tên, phone, headline, summary, location, skillIds với allowlist và giới hạn; phone là dữ liệu tùy chọn, không dùng làm khóa định danh.

3\. Khóa user, kiểm version và skill đang hoạt động; cập nhật account name, profile và candidate_skill trong cùng transaction.

4\. Trả DTO mới và version; ứng dụng dùng dữ liệu profile mới cho lần nộp hồ sơ sau.

**Luồng thay thế và ngoại lệ:** Version cũ 409; kỹ năng lặp chuẩn hóa thành tập, không tồn tại/ngừng dùng 400; field đặc quyền bị từ chối. Sửa profile không đổi CV, CV gốc/current hoặc candidate_snapshot của hồ sơ đã nộp. Profile được tạo đồng thời khi cấp CANDIDATE, không để tài khoản có role nhưng thiếu profile.

**Hậu điều kiện:** Thông tin cá nhân mới có hiệu lực trong profile; bản nộp cũ giữ snapshot phục vụ xét duyệt.

**Dữ liệu và kiểm chứng:** CandidateModule; profile/skill và account name; TC10, EC36; BE2.

### 3.1.13 UC13 Đánh giá và xác nhận hoàn tất phỏng vấn

**Mục tiêu và kích hoạt:** Ghi nhận tham dự và đánh giá đủ điều kiện để kết thúc phỏng vấn. Ghi attendance, lưu phiếu, complete/no-show hoặc mark-interviewed.

**Dữ liệu vào và đầu ra:** Điểm, note, attendance, lý do và version theo đối tượng. Đầu ra: Phiếu nội bộ; COMPLETED/NO_SHOW hoặc INTERVIEWED hợp lệ.

**Liên kết thiết kế:** UI14 UI20 UI22; Hình 3.9 và 5.4.

**Tác nhân:** Interviewer được phân công; recruiter ghi attendance và xác nhận.

**Tiền điều kiện:** Lịch đã end_at, chưa bị hủy và hồ sơ chưa kết thúc; membership hiện tại hợp lệ.

**Luồng chính**

1\. Recruiter ghi attendance UNKNOWN/ATTENDED/ABSENT; ABSENT có lý do, lưu actor/time; không suy từ việc cấp room token.

2\. Interviewer ATTENDED ghi phiếu ba điểm nguyên 1–5, recommendation và note; tạo lần đầu không cần version, sửa bắt buộc version.

3\. Một phiếu mỗi lịch/interviewer, chỉ người viết sửa phiếu mình trước công bố và trước khi lịch COMPLETED; sửa attendance không được biến người đã có phiếu thành ABSENT.

4\. Recruiter chuyển lịch COMPLETED khi candidate ATTENDED, ít nhất một interviewer ATTENDED, không UNKNOWN và đủ phiếu bắt buộc.

5\. Từ end_at+30 phút có thể xác nhận NO_SHOW với attendance thỏa BR14, lý do và audit; release reservation, không tạo phiếu giả.

6\. Mark INTERVIEWED chỉ khi có vòng COMPLETED, đủ phiếu và không còn PROPOSED/CONFIRMED; hồ sơ NO_SHOW đơn thuần chỉ được đặt lại/rút/từ chối.

**Luồng thay thế và ngoại lệ:** Sai điểm/note 400; không được phân công hoặc candidate cố truy cập trả 403/404; thiếu attendance/phiếu hoặc chưa tới giờ trả 409. Hai phiếu tạo đồng thời chỉ một row, request còn lại đọc version hoặc conflict. Lịch COMPLETED đóng phiếu; thay đổi sau đó ngoài phạm vi. NO_SHOW không cần phiếu của người vắng.

**Hậu điều kiện:** Phiếu riêng tư, trạng thái/attendance nhất quán, không ép tạo phiếu giả để đi tiếp.

**Dữ liệu và kiểm chứng:** EvaluationModule + InterviewPort/ApplicationPort; TC47–TC49; EC14–EC15, EC18, EC27; BE3.

### 3.1.14 UC14 Lưu tin quan tâm

**Mục tiêu và kích hoạt:** Ghi nhận tin quan tâm mà không tạo bản ghi trùng. Lưu, bỏ lưu hoặc mở danh sách tin đã lưu.

**Dữ liệu vào và đầu ra:** jobId và session ứng viên. Đầu ra: Một savedJob hoặc đã bỏ lưu; không lộ tin bị hạn chế.

**Liên kết thiết kế:** UI01 UI02 UI12; Hình 3.1 và 5.3.

**Tác nhân:** Ứng viên.

**Tiền điều kiện:** Role CANDIDATE và session hợp lệ.

**Luồng chính**

1\. PUT saved-jobs/:jobId kiểm tin công khai được xem; upsert cặp candidate/job, không nhận userId từ body.

2\. GET danh sách riêng có phân trang; tin đóng/hết hạn giữ nhãn ngừng nhận.

3\. DELETE cùng cặp là idempotent và trả 204 kể cả đã bỏ lưu.

**Luồng thay thế và ngoại lệ:** Tin nháp hoặc công ty đình chỉ không lộ mô tả trong danh sách đã lưu, chỉ hiển thị placeholder không còn khả dụng hoặc ẩn. Không tạo trùng khi nhấn hai lần. Danh sách không chứa tin đã lưu của user khác.

**Hậu điều kiện:** Một saved_job cho mỗi cặp; đóng tin không tự xóa ý định lưu.

**Dữ liệu và kiểm chứng:** Candidate/Job saved workflow; saved_job; TC52, EC34; BE2.

### 3.1.15 UC15 Đọc và theo dõi thông báo

**Mục tiêu và kích hoạt:** Đọc thông báo đúng chủ và mở target theo quyền hiện tại. Mở chuông, đọc thông báo hoặc mở target.

**Dữ liệu vào và đầu ra:** Phân trang hoặc notificationId; scope từ session. Đầu ra: Danh sách/readAt; target chỉ mở nếu còn quyền.

**Liên kết thiết kế:** UI24; Hình 3.1–3.3 và 5.5.

**Tác nhân:** Người dùng đã đăng nhập.

**Tiền điều kiện:** Session hợp lệ; chỉ notification của chính user.

**Luồng chính**

1\. Liệt kê phân trang theo created_at,id và tính unread_count cùng user scope.

2\. Đánh dấu đọc bằng cập nhật id/user_id; read_at chỉ gán lần đầu, retry không đổi thời điểm đã đọc.

3\. Mở target qua endpoint tương ứng; endpoint đích kiểm quyền hiện tại, không tin quyền tại lúc gửi event.

4\. Worker consumer tạo notification/email task với unique key; claim/retry theo lease_token và event schema.

**Luồng thay thế và ngoại lệ:** Notification ngoài scope trả 404. Target mất quyền/đóng không làm notification thành đường truy cập trái phép. Event cũ không được gửi lời mời lịch đã hủy; email lỗi hiển thị trạng thái giao riêng cho vận hành. Không dùng nội dung nội bộ trong template candidate.

**Hậu điều kiện:** Chống trùng notification; nghiệp vụ đã commit không phụ thuộc email; trạng thái đọc đúng owner.

**Dữ liệu và kiểm chứng:** NotificationModule; outbox/notification/email; TC24, TC51, TC58; EC25–EC27; BE3.

### 3.1.16 UC16 Xem thống kê tuyển dụng

**Mục tiêu và kích hoạt:** Đối soát số liệu tuyển dụng theo cohort thống nhất. Recruiter/ADMIN áp dụng khoảng thống kê.

**Dữ liệu vào và đầu ra:** Company/job scope, from/to có offset, tối đa 366 ngày. Đầu ra: Counts, denominator, rates nullable và asOf.

**Liên kết thiết kế:** UI25; Hình 3.2 và 3.4.

**Tác nhân:** Recruiter đúng doanh nghiệp; ADMIN chỉ số liệu tổng hợp.

**Tiền điều kiện:** Có quyền đọc thống kê; from \< to và khoảng không quá 366 ngày.

**Luồng chính**

1\. Nhận from/to có offset và jobId tùy chọn; xác định company scope bằng policy.

2\. Đếm tin theo published_at và hồ sơ cohort theo submitted_at trong \[from,to).

3\. Đếm distinct application từng đạt mỗi mốc từ history đến thời điểm truy vấn; ghi asOf cùng kết quả.

4\. Tính tỷ lệ mỗi mốc trên số hồ sơ cohort, không cộng số lần quay lại trạng thái; trả rate NULL khi denominator = 0.

**Luồng thay thế và ngoại lệ:** Ngày đảo/quá phạm vi/sai offset 400; company ngoài quyền 404/403 theo quy ước; job không thuộc scope không được lấy số liệu. JOIN kỹ năng/phiếu không làm nhân bản count. ADMIN không drill down vào CV/evaluation bằng dashboard. Mẫu nhỏ không công khai theo cá nhân.

**Hậu điều kiện:** Số liệu có cohort, mẫu số, asOf và scope rõ, đối soát được với fixture.

**Dữ liệu và kiểm chứng:** ReportingModule; read repository cho job/application/history; TC53–TC54, EC35; BE3.

## 3.2 Trạng thái hồ sơ và tác dụng phụ

| **Trạng thái hiện tại**  | **Cạnh hợp lệ**                            | **Điều kiện và tác dụng phụ**                                                                                            |
|--------------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| SUBMITTED                | SCREENING REJECTED WITHDRAWN               | Recruiter bắt đầu xét; từ chối chỉ qua UC09; ứng viên tự rút                                                             |
| SCREENING                | SHORTLISTED REJECTED WITHDRAWN             | Rời trạng thái phải hủy đề nghị CV PENDING                                                                               |
| SHORTLISTED              | INTERVIEW_SCHEDULED REJECTED WITHDRAWN     | Chỉ xác nhận lịch mới chuyển sang giai đoạn phỏng vấn                                                                    |
| INTERVIEW_SCHEDULED      | SHORTLISTED INTERVIEWED REJECTED WITHDRAWN | Lùi chỉ khi không còn CONFIRMED và chưa có COMPLETED/NO_SHOW; INTERVIEWED theo BR14; REJECTED qua UC09 sau xử lý lịch mở |
| INTERVIEWED              | HIRED REJECTED WITHDRAWN                   | HIRED/REJECTED công bố nguyên tử; ứng viên còn được rút trước quyết định cuối                                            |
| HIRED REJECTED WITHDRAWN | Không có                                   | Không sửa phiếu, thay CV, lập lịch hoặc mở lại hồ sơ                                                                     |

INTERVIEW_SCHEDULED là giai đoạn đã xác nhận phỏng vấn, không đồng nghĩa luôn còn lịch tương lai CONFIRMED. Hoàn tất lịch cuối vẫn giữ giai đoạn này trong lúc chờ xác nhận INTERVIEWED. Nếu có NO_SHOW nhưng chưa có vòng COMPLETED thì phải đặt lịch lại, rút hoặc từ chối với lý do; không tự gán INTERVIEWED. Không có endpoint status tùy ý cho client ghi trạng thái đặc biệt.

| **Đối tượng**  | **Chuyển trạng thái**                                                                                        | **Quy định bổ sung**                                                                                             |
|----------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Job            | DRAFT sang PUBLISHED hoặc CLOSED; PUBLISHED sang CLOSED                                                      | Không mở lại; hết deadline là điều kiện ngừng nhận, không phụ thuộc worker đổi trạng thái                        |
| CV             | PENDING_UPLOAD sang QUARANTINED sang SCANNING sang READY hoặc REJECTED                                       | Lỗi kỹ thuật retry giữ cách ly; chỉ CV không tham chiếu được chuyển DELETED                                      |
| Interview      | PROPOSED sang CONFIRMED DECLINED EXPIRED CANCELLED                                                           | Không tự sửa lịch đã CONFIRMED; thay thế bằng revision mới                                                       |
| Interview      | CONFIRMED sang COMPLETED NO_SHOW CANCELLED                                                                   | CANCELLED chỉ trước start_at, trừ lệnh an ninh của ADMIN hoặc ứng viên rút; sau start cần ghi rõ lý do gián đoạn |
| Change request | PENDING sang APPROVED REJECTED CANCELLED                                                                     | Quyết định chỉ một lần; không mở lại                                                                             |
| Company        | PENDING sang APPROVED hoặc REJECTED; REJECTED sang PENDING; APPROVED sang SUSPENDED; SUSPENDED sang APPROVED | Gửi lại duyệt cần cập nhật hồ sơ; khôi phục không tự mở lại tin/lịch                                             |

## 3.3 Ma trận lỗi và cách phục hồi

| **Tình huống**                                     | **HTTP và code tiêu biểu**                            | **Kết quả và cách xử lý**                                                 |
|----------------------------------------------------|-------------------------------------------------------|---------------------------------------------------------------------------|
| DTO sai kiểu hoặc thiếu version                    | 400 VALIDATION_FAILED                                 | fieldErrors theo trường; không gọi provider                               |
| Phiên thiếu hết hạn hoặc bị thu hồi                | 401 SESSION_INVALID                                   | Xác thực lại; giữ dữ liệu form an toàn ở client                           |
| Actor biết đối tượng nhưng thiếu quyền hành động   | 403 ACTION_FORBIDDEN                                  | Không thay DB; không cấp URL hoặc token                                   |
| ID không tồn tại hoặc ngoài phạm vi đọc            | 404 RESOURCE_NOT_FOUND                                | Không tiết lộ doanh nghiệp hoặc CV của người khác                         |
| Cạnh trạng thái version hoặc deadline không hợp lệ | 409 STATE_CONFLICT VERSION_CONFLICT JOB_NOT_ACCEPTING | Tải lại trạng thái; không tự retry bằng version mới                       |
| Idempotency khác payload hoặc đang xử lý           | 409 IDEMPOTENCY_CONFLICT hoặc REQUEST_IN_PROGRESS     | Cùng key khác payload bị từ chối; in progress có Retry-After              |
| Xung đột lịch hoặc constraint                      | 409 INTERVIEW_TIME_CONFLICT                           | Rollback cả xác nhận và đổi reservation; không lộ lịch riêng của bên khác |
| Tệp quá lớn hoặc sai loại                          | 413 FILE_TOO_LARGE hoặc 415 UNSUPPORTED_MEDIA_TYPE    | Dừng stream; dọn object tạm; PDF hỏng được REJECTED sau xử lý             |
| Quá tần suất                                       | 429 RATE_LIMITED                                      | Retry-After; không tạo token hoặc upload mới vượt giới hạn                |
| DB provider tạm lỗi                                | 503 DEPENDENCY_UNAVAILABLE                            | Không báo thành công trước commit; tác vụ sau commit retry độc lập        |
| Lỗi không dự kiến                                  | 500 INTERNAL_ERROR                                    | Thông báo chung và traceId; rollback; log stack đã lọc bí mật             |

Deadlock hoặc serialization failure chỉ retry tối đa ba lần cho transaction chưa commit, có backoff và jitter. Không retry validation, quyền, conflict version hoặc provider không có idempotency một cách mù quáng. Constraint lỗi đã biết được map bằng tên constraint; lỗi FK không rõ nguyên nhân không được biến thành phản hồi thành công.


# CHƯƠNG 4 KIẾN TRÚC BACKEND THEO NGHIỆP VỤ

## 4.1 Nguyên tắc chia module và các lớp bên trong

Mỗi module tương ứng một nhóm nghiệp vụ, không chia toàn hệ thống thành ba thư mục controllers, services và repositories chung. Controller chỉ nhận request, lấy actor, nhận DTO đã kiểm tra và gọi application service. Service điều phối use case, mở transaction, gọi policy/rules, repository và ghi sự kiện. Repository đóng gói truy vấn, persistence, locking và ánh xạ DB; không quyết định actor nào được tuyển ai hoặc hồ sơ nào được chuyển bước.

Policy trả lời ai được thực hiện hành động trên đối tượng trong ngữ cảnh hiện tại. Rules kiểm tra trạng thái, thời gian, hạn mức và điều kiện miền. Tách riêng khi quy tắc được dùng ở nhiều use case, có nhiều nhánh hoặc cần kiểm thử độc lập; điều kiện đơn giản cục bộ có thể để trong service. Policy/rules không đọc HTTP, không ném lỗi Prisma và không tự gửi mail. Quyết định quyền không được lưu cache dài hơn hiệu lực membership.

DTO đầu vào tách DTO đầu ra theo tác nhân. Mapper tạo CandidateApplicationDto và RecruiterApplicationDto riêng để tránh lộ field nội bộ; không trả trực tiếp Prisma record. Module chỉ export facade hoặc port cần thiết, giữ repository nội bộ. Shared chỉ chứa hạ tầng chung, không chứa ApplicationRules hoặc InterviewPolicy. \[TL02 TL03\]

## 4.2 Danh mục module và trách nhiệm

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 34%" />
<col style="width: 37%" />
<col style="width: 8%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Module và UC</strong></th>
<th><strong>Nghiệp vụ và lớp xử lý</strong></th>
<th><strong>Persistence và quy tắc</strong></th>
<th><strong>Chủ sở hữu</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>IdentityModule<br />
UC04 UC10</td>
<td>Controller: AuthController AdminIdentityController<br />
Service: RegisterService SessionService TokenService</td>
<td>Repository: UserRepository SessionRepository TokenRepository<br />
Policy/rules: IdentityPolicy PasswordRules TokenRules<br />
Dữ liệu: account role session token</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>CandidateModule<br />
UC12 UC14</td>
<td>Controller: CandidateProfileController SavedJobsController<br />
Service: UpdateProfileService SavedJobService</td>
<td>Repository: ProfileRepository SavedJobRepository<br />
Policy/rules: CandidatePolicy ProfileRules<br />
Dữ liệu: profile candidate_skill saved_job</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>CompanyModule<br />
UC11 UC10</td>
<td>Controller: CompaniesController MembershipsController<br />
Service: CreateCompanyService MembershipService ReviewCompanyService</td>
<td>Repository: CompanyRepository MembershipRepository<br />
Policy/rules: CompanyPolicy OwnerRules MembershipRules<br />
Dữ liệu: company membership</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>JobModule<br />
UC01 UC05</td>
<td>Controller: JobsController PublicJobsController<br />
Service: PublishJobService CloseJobService SearchJobsService</td>
<td>Repository: JobRepository JobQueryRepository<br />
Policy/rules: JobPolicy PublicationRules SalaryRules<br />
Dữ liệu: job_post skill job_skill</td>
<td>BE1</td>
</tr>
<tr class="odd">
<td>CvModule<br />
UC06</td>
<td>Controller: CvUploadsController CvController<br />
Service: UploadCvService ScanCvService DeleteCvService</td>
<td>Repository: CvRepository UploadAttemptStore<br />
Policy/rules: CvAccessPolicy CvFileRules CvQuotaRules<br />
Dữ liệu: cv_version và storage</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>ApplicationModule<br />
UC02 UC06 UC07</td>
<td>Controller: ApplicationsController CvChangesController<br />
Service: SubmitApplicationService ReviewApplicationService ChangeCvService</td>
<td>Repository: ApplicationRepository HistoryRepository CvChangeRepository<br />
Policy/rules: ApplicationPolicy TransitionRules CvReplacementRules<br />
Dữ liệu: application history cv_change_request</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>InterviewModule<br />
UC03 UC08</td>
<td>Controller: InterviewsController JoinController<br />
Service: ScheduleService ConfirmScheduleService RescheduleService JoinService</td>
<td>Repository: InterviewRepository ParticipantRepository ReservationRepository<br />
Policy/rules: InterviewPolicy ScheduleRules RoomAccessRules<br />
Dữ liệu: interview participant reservation</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EvaluationModule<br />
UC13 UC09</td>
<td>Controller: EvaluationsController InterviewCompletionController ResultsController<br />
Service: EvaluateService CompleteInterviewService PublishResultWorkflow</td>
<td>Repository: EvaluationRepository; ApplicationResultPort khi ghi kết quả<br />
Policy/rules: EvaluationPolicy AttendanceRules CompletionRules ResultRules<br />
Dữ liệu: evaluation; ghi application qua port BE2</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>NotificationModule<br />
UC15 và event mọi UC</td>
<td>Controller: NotificationsController EventOperationsController<br />
Service: NotificationService OutboxDispatcher EmailDeliveryWorker</td>
<td>Repository: OutboxRepository NotificationRepository EmailRepository<br />
Policy/rules: NotificationPolicy DeliveryRetryRules<br />
Dữ liệu: outbox notification email_delivery</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>ReportingModule<br />
UC16</td>
<td>Controller: StatisticsController<br />
Service: RecruitmentStatisticsService</td>
<td>Repository: StatisticsReadRepository<br />
Policy/rules: ReportingPolicy CohortRules<br />
Dữ liệu: read model không ghi bảng nghiệp vụ</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>AdminModule<br />
UC10</td>
<td>Controller: AdminCompaniesController AdminUsersController AdminJobsController<br />
Service: ModerationWorkflow SecurityRevocationWorkflow</td>
<td>Repository: Không ghi trực tiếp bảng module khác; dùng admin ports<br />
Policy/rules: AdminPolicy ModerationRules<br />
Dữ liệu: audit và module sở hữu đối tượng</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>AuditModule<br />
UC10 và mọi mutation cần audit</td>
<td>Controller: AuditQueryController<br />
Service: AuditWriter AuditQueryService</td>
<td>Repository: AuditRepository<br />
Policy/rules: AuditReadPolicy AuditRedactionRules<br />
Dữ liệu: audit_log</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>Workflow và Platform<br />
Liên module</td>
<td>Controller: Không có controller nghiệp vụ chung<br />
Service: UnitOfWork ApplicationExitCoordinator Clock adapters</td>
<td>Repository: TransactionContext IdempotencyStore<br />
Policy/rules: Exception mapping và không chứa rules miền<br />
Dữ liệu: idempotency hạ tầng và config</td>
<td>BE2 điều phối tx; cả ba tích hợp</td>
</tr>
</tbody>
</table>

AdminModule là lớp điều phối use case UC10. Ví dụ khóa user gọi IdentityAdminPort; đình chỉ company gọi CompanyAdminPort; đóng tin gọi JobAdminPort. AdminController không cập nhật trực tiếp bảng application/interview bằng Prisma. ReportingModule được phép truy vấn read model nhiều bảng theo contract chỉ đọc, có scope doanh nghiệp bắt buộc và không được ghi dữ liệu tuyển dụng.

## 4.3 Cấu trúc thư mục và hợp đồng giữa module

apps/api/src/modules/

identity/ candidate/ company/ job/ cv/

application/ interview/ evaluation/

notification/ reporting/ admin/ audit/

application/

application.module.ts

controllers/applications.controller.ts

services/submit-application.service.ts

services/change-application-cv.service.ts

services/review-application.service.ts

repositories/application.repository.ts

repositories/prisma-application.repository.ts

policies/application.policy.ts

rules/application-transition.rules.ts

dto/ mappers/ ports/ tests/

apps/worker/src/main.ts

libs/platform/{database,clock,storage,mail,video,errors}

prisma/schema.prisma

prisma/migrations/\<timestamp\>\_\<use_case\>/migration.sql

tests/{integration,api,concurrency,contract}/

Không phải module nào cũng cần đủ tất cả thư mục; cấu trúc phải tương xứng nghiệp vụ. Các repository nhận TransactionContext do UnitOfWork cấp; không tự mở transaction lồng độc lập. Một use case liên module vẫn dùng đúng một transaction. Port của module khác nhận cùng tx, actor và dữ liệu cần thiết; không lấy PrismaClient toàn cục bên trong một transaction đang hoạt động.

**Hướng phụ thuộc chính:** Job dùng CompanyPort; Application dùng JobPort và CvPort; Interview dùng ApplicationPort và CompanyPort; Evaluation dùng InterviewPort và ApplicationPort. Application không import InterviewModule để xử lý rút hồ sơ: nó phát lệnh qua ApplicationExitCoordinator ở lớp workflow, lớp này gọi cả ApplicationPort và InterviewPort trong một UnitOfWork. Admin workflow dùng cùng cơ chế. Cách này tránh import vòng và tránh dùng forwardRef để che vòng phụ thuộc.

| **Contract**                   | **Dữ liệu vào và ra tối thiểu**                               | **Yêu cầu**                                             |
|--------------------------------|---------------------------------------------------------------|---------------------------------------------------------|
| CompanyAccessPort              | actor companyId tx trả membership và company state            | Kiểm tra dưới khóa với mutation; không chỉ trả role     |
| CvSelectionPort                | candidateId cvId tx trả bản READY với object version          | Kiểm ownership và trạng thái; không cấp URL             |
| ApplicationPort                | applicationId expectedVersion tx trả context hoặc chuyển cạnh | Kiểm trạng thái và ghi history qua service sở hữu       |
| InterviewLifecyclePort         | applicationId reason tx trả danh sách lịch bị kết thúc        | Hủy proposal reservation và quyền phòng nguyên tử ở DB  |
| EvaluationReadPort             | interviewId tx trả phiếu và mức hoàn tất                      | Chỉ dùng nội bộ; DTO ứng viên không import model phiếu  |
| OutboxPort                     | eventId aggregateId type schemaVersion payload tx             | Chỉ ghi; worker gửi sau commit; payload tối thiểu       |
| VideoPort StoragePort MailPort | DTO tích hợp không lộ model ORM                               | Timeout rõ; retry và idempotency theo khả năng provider |

**Hợp đồng tích hợp BE2 phiên bản 1:** [be2-integration-contract.md](be2-integration-contract.md) chốt dữ liệu/port giữa BE1–BE2–BE3, ownership và thứ tự migration, chữ ký logic `ApplicationPort`/`ApplicationResultPort`/`InterviewLifecyclePort`, DTO/HTTP BE2 và tên event v1. [Bàn giao nền bước 2](be2-step2-handoff.md), [dữ liệu](be2-data-migration-plan.md), [persistence](be2-persistence-handoff.md) và [UC12](be2-profile-handoff.md) chỉ vị trí code/schema và phạm vi kiểm chứng từng đợt. Đã có `UnitOfWork`/driver, interface/stub port, DTO ứng viên, schema event/request, repository và service nội bộ BE2 cùng test unit/contract; chưa có route API chạy, migration áp dụng hoặc kiểm DB thật. Đây là chi tiết triển khai bổ sung cho mục 4.3, không thay đổi BR01–BR20 hoặc cạnh trạng thái ở mục 3.2. `name` công khai ánh xạ từ cột `user_account.full_name`; header `X-CSRF-Token` là tên kỹ thuật để triển khai yêu cầu CSRF/Origin ở mục 4.6. Khi triển khai hoặc đổi hợp đồng này, phải cập nhật đặc tả, OpenAPI/event schema và test liên quan trong cùng PR.

**BE2: quy tắc nghiệp vụ thuần:** Code tại `apps/api/src/modules/application/rules/` và `policies/` thực hiện các quyết định theo BR07–BR09, BR13–BR14, BR18, mục 3.2 và UC06/07/09 mà không truy cập DB. Kết quả quyết định nêu trạng thái/version kế tiếp và các việc bắt buộc như hủy đề nghị CV hoặc gọi BE3 hủy lịch mở; nó không xác nhận các việc đó đã ghi thành công. Service sau này phải xác thực actor qua BE1, kiểm bằng chứng lịch BE3 trong transaction hiện tại, khóa/đọc lại dữ liệu và ghi application/history/outbox nguyên tử. Mapper ứng viên/profile chỉ chọn field công khai sau khi query đã lọc scope. Đây là cách hiện thực một phần quy tắc báo cáo, không thêm cạnh trạng thái, endpoint hoặc thay đổi DB; UC và test tích hợp vẫn chưa được nghiệm thu.

**BE2: kho CV bước 5 (23/10/2026):** `CvWarehouseService` và `PrismaCvRepository` hiện thực phần BE2 độc lập của upload-init, quota 20 dưới khóa user BE1, attempt riêng, nhận byte có giới hạn, quarantine, Outbox yêu cầu quét, lease quét, READY/REJECTED hoặc retry khi lỗi kỹ thuật, URL tải tối đa 300 giây và xóa hai giai đoạn. `CvSafetyInspector` phải kiểm cấu trúc/mật khẩu/mã độc bằng provider thật trước khi gắn vào worker; `QuarantineStore` phải giữ version bất biến. Chưa có adapter provider, route/guard BE1, worker BE3, migration chạy hoặc test PostgreSQL/API; vì vậy UC06 và STORAGE-01 vẫn đang triển khai. Các interface này không đổi BR06–BR08, đường dẫn mục 7.1 hoặc trạng thái ở mục 3.2.

**BE2: nộp hồ sơ bước 6 (23/10/2026):** `SubmitApplicationWorkflowService` nối khóa user và điều kiện ứng viên của BE1, khóa company/job và điều kiện tin/membership của BE1, kiểm CV READY BE2 rồi lấy snapshot profile BE2 trong transaction của lát cắt persistence bước 3. Idempotency replay chỉ kiểm quyền hiện tại; claim mới mới kiểm điều kiện nộp. Repository ánh xạ đúng ràng buộc `uq_application_candidate_job` thành xung đột, không đổi lỗi DB khác. Port BE1 phải khóa user trước, company/job sau và dùng DB clock sau khóa; không được lấy thêm khóa user sau company/job. Chưa có implementation port BE1/Outbox BE3, route/guard, migration và test DB/concurrency, nên UC02 chưa nghiệm thu. Đây là hiện thực dần mục 3.1.2/4.4, không đổi quy tắc báo cáo.

## 4.4 Transaction khóa và thao tác đồng thời

Thứ tự khóa chung là user_account theo UUID tăng dần, company, job_post, application, interview và cv_version. Trong mỗi nhóm cũng sắp UUID tăng dần. Trước transaction phải thu thập toàn bộ ID liên quan; sau khóa kiểm lại danh sách và version. Nếu participant hoặc phạm vi đã đổi, rollback và đọc lại, không lấy thêm khóa user sau khi đã khóa interview. Membership mutation phải khóa user mục tiêu rồi company; xác nhận lịch phải khóa cùng company để không lọt qua việc thu hồi membership.

READ COMMITTED kết hợp khóa hàng và ràng buộc DB là mức mặc định. Mọi writer phải đi qua service sở hữu; tài khoản runtime không được tự sửa lịch sử, xóa dữ liệu tuyển dụng hoặc chạy migration. Phép khóa dùng SQL parameterized và transaction client. Xung đột lịch được bảo vệ thêm bằng exclusion constraint trên reservation, không dùng version để thay cho kiểm tra overlap. Lệnh có thể làm mất quyền ADMIN dùng một advisory transaction lock cố định trước mọi khóa user; sau đó kiểm lại actor và số ADMIN khả dụng, bảo đảm không khóa hoặc thu hồi người cuối khi hai lệnh chạy đồng thời.

| **Use case**                      | **Dữ liệu cần khóa và kiểm lại**                                         | **Ghi nguyên tử**                                            |
|-----------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------|
| Nộp hồ sơ                         | user ứng viên company job CV; company APPROVED và DB time trước deadline | Application hai CV ID History Outbox Idempotency             |
| Thay CV hoặc duyệt đề nghị        | user ứng viên company application CV cũ mới                              | current CV version đề nghị History Outbox                    |
| Xét duyệt rút từ chối             | users của lịch liên quan company job application interviews              | Trạng thái lịch mở reservation đề nghị CV History Outbox     |
| Xác nhận đổi lịch                 | toàn bộ participants cũ mới company application interviews               | Responses reservation lịch cũ mới application History Outbox |
| Khóa user hoặc thu hồi membership | target user và các company liên quan theo thứ tự                         | Session quyền membership audit và sự kiện thu hồi            |
| Công bố kết quả                   | users company job application và lịch liên quan                          | Status message published_at History Outbox Idempotency       |

Điểm chấp nhận deadline là lúc service giữ đủ khóa và kiểm tra điều kiện ngay trước ghi hồ sơ. Dùng clock_timestamp() tại DB thay vì now() của đầu transaction đã phải chờ khóa; không giữ transaction chờ upload, scanner hoặc provider. Test có barrier cần chứng minh hai request thực sự chồng nhau, sau đó kiểm số bản ghi và trạng thái cuối.

## 4.5 Outbox idempotency và phục hồi worker

**BE2 bước 3:** [bàn giao repository/idempotency](be2-persistence-handoff.md) mô tả adapter SQL và lát cắt ghi application/history/outbox/claim trong cùng `TransactionContext`. Đây mới là code nội bộ kiểm bằng fake transaction; chưa có port BE1/BE3 thật, API hay migration DB chạy được. Quy tắc kiểm quyền hiện tại khi replay và rollback khi ghi lỗi giữ nguyên như các đoạn dưới.

Worker claim batch bằng FOR UPDATE SKIP LOCKED trong transaction ngắn, đặt PROCESSING, locked_until và lease_token duy nhất rồi commit. Lease 120 giây, heartbeat 30 giây. Mọi heartbeat/ack/fail phải WHERE id AND status AND lease_token; worker hết lease không được ghi đè kết quả của worker mới. Scan worker và email worker áp dụng cùng nguyên tắc. Provider vẫn có thể nhận tác dụng phụ từ worker cũ; phải dùng provider idempotency nếu có hoặc chấp nhận at least once đối với email.

Retry lỗi tạm tối đa năm lần sau lần đầu, theo 10 giây, 30 giây, 2 phút, 5 phút và 15 phút, thêm jitter. attempt_count đếm mọi lần claim; lần lỗi thứ sáu chuyển FAILED. Lỗi vĩnh viễn như địa chỉ email không hợp lệ không retry như lỗi mạng. ADMIN chỉ retry event FAILED sau khi kiểm quyền, ghi lý do và audit, dùng nguyên event_id. Scanner hết lượt chuyển REJECTED với scan_reason TECHNICAL_FAILURE, không kết luận MALWARE và cho người dùng upload lại.

Outbox DONE khi đã tạo bền vững các consumer task cần thiết. Notification và EmailDelivery có trạng thái riêng; mail FAILED không xóa thông báo trong ứng dụng. Event có schema_version và aggregate_version; email nhắc lịch kiểm tra lại lịch hiện hành trước gửi, tránh gửi lời mời đã hủy. Thứ tự hiển thị dựa thời điểm và version nghiệp vụ; không giả định mọi worker xử lý đúng thứ tự commit.

Idempotency có UNIQUE(user_id, operation, key) và request_hash của payload chuẩn hóa. Tạo business record và hoàn tất idempotency trong cùng transaction; retry đọc lại sau khi kiểm quyền hiện tại. Key cùng payload trả cùng resource; khác payload trả 409. Giữ ít nhất 24 giờ; sau đó các UNIQUE nghiệp vụ vẫn áp dụng. Không lưu room token hoặc signed URL để phát lại. Với upload và join có tác dụng phụ ngoài DB, dùng operation ID và state riêng thay vì giữ transaction mở.

Với mutation chỉ trong DB, PROCESSING và COMPLETED nằm trong cùng transaction; rollback không để lại PROCESSING đã commit. Request trùng key có thể chờ transaction trước hoàn tất rồi đọc resource; nếu vượt thời gian chờ khóa có giới hạn, trả REQUEST_IN_PROGRESS với Retry-After. Không tạo bản ghi PROCESSING ngoài transaction chỉ để giữ key rồi bỏ quên sau crash.

## 4.6 Bảo mật phiên CV và video

Cookie session ngẫu nhiên ít nhất 32 byte; DB lưu SHA256, cookie \_\_Host-recruitment_session có Secure, HttpOnly, Path=/, SameSite=Lax và không Domain. FE và API phục vụ cùng origin; CSRF synchronizer token gắn session, kiểm Origin cho mutation kể cả login. Phiên hết hạn tuyệt đối 24 giờ hoặc idle 2 giờ; kiểm status tài khoản mỗi request bảo vệ. Thay đổi last_seen chỉ khi phiên chưa hết idle, không được làm sống lại phiên hết hạn.

Mật khẩu 10 ký tự trở lên và không quá 72 byte UTF8 khi dùng BCrypt; không âm thầm cắt. BCrypt cost đo trên máy triển khai. Verify token hết hạn sau 24 giờ, reset token sau 30 phút; token hash gắn user và purpose, consumed bằng update có điều kiện trong cùng transaction với tác dụng chính. Gửi lại vô hiệu token cùng purpose trước đó; mỗi job mail kiểm token còn dùng được trước gửi. Quên mật khẩu và đăng ký email đã tồn tại dùng phản hồi chung để hạn chế dò tài khoản.

CV upload qua backend stream vào quarantine; upload-init giữ slot dưới khóa user. Mỗi phiên upload có attempt ID và object_key riêng; chỉ một attempt được quyền finalize. Không ghi đè object READY. Metadata lưu storage_version_id và checksum của đúng object đã quét; đọc/copy/download phải chọn đúng version này. Tên tệp được làm sạch, không dùng làm đường dẫn. Worker parse PDF/scanner chạy riêng với giới hạn thời gian, CPU và bộ nhớ.

Metadata và storage không có transaction chung. Nếu upload/copy xong nhưng commit DB lỗi, reconciliation đối soát attempt, object key và version; chỉ tệp có checksum và kết quả quét khớp mới READY. Upload chưa hoàn tất hết hạn sau 24 giờ chuyển DELETED và dọn object. Xóa CV dùng trạng thái DELETE_PENDING trước, chặn gắn tham chiếu mới dưới khóa; xóa object có retry rồi chuyển DELETED. Hạn mức vẫn tính DELETE_PENDING. FK RESTRICT bảo vệ metadata nhưng không tự ngăn xóa logic; service phải kiểm đủ tham chiếu.

URL tải CV chỉ được cấp sau kiểm quyền và dùng tối đa 5 phút; URL đã phát có thể còn hiệu lực đến TTL sau thu hồi membership. Nếu yêu cầu thu hồi tức thì phải tải qua proxy có kiểm quyền mỗi lần. Link đã hết hạn cần xin lại, không coi tệp bị mất. Thiết kế này chấp nhận cửa sổ tối đa 5 phút đối với URL đã cấp và phải kiểm thử giới hạn đó. \[TL08\]

Join không chỉ dựa tên phòng bí mật hoặc cấu hình IFrame. VideoPort phải cung cấp cơ chế xác thực theo interview_id và access_generation; join mới bị từ chối ngay khi lịch không còn hợp lệ. Tăng access_generation và ghi REVOKE_PENDING khi hủy/đổi/rút/khóa; worker đóng phòng hoặc loại người dùng qua provider rồi chuyển REVOKED. Trong khoảng provider chưa xác nhận, giao diện hiển thị thu hồi đang xử lý; cảnh báo vận hành nếu quá 60 giây. Mục tiêu thu hồi kết nối đang có ≤60 giây phải được nghiệm thu với Jitsi triển khai thực; không suy ra từ token TTL. \[TL09\]

# CHƯƠNG 5 THIẾT KẾ DỮ LIỆU VÀ TOÀN VẸN

## 5.1 Quy ước và danh mục bảng

PostgreSQL dùng UUID, timestamptz và numeric(15,2) cho tiền. Tiền ở JSON là chuỗi thập phân để tránh làm tròn số; lương không dùng float. Bảng trạng thái dùng varchar kèm CHECK hoặc enum được migration quản lý nhất quán. Tất cả version là integer không âm, tăng đúng một lần mỗi mutation thành công; created_at và submitted_at không bị sửa qua API.

FK mặc định RESTRICT; không cascade xóa lịch sử tuyển dụng. Trường NULL có nghĩa chưa có dữ liệu, không thay bằng chuỗi rỗng hoặc số 0. Các tham chiếu đa hình Outbox/Audit/Idempotency không phải FK; reconciliation phải phát hiện đích mất. Database không tự bảo đảm điều kiện phụ thuộc thời gian hiện tại bằng CHECK có now(); deadline tương lai được service kiểm dưới khóa.

Hệ thống có 25 bảng, gồm 24 bảng nghiệp vụ và hạ tầng đã xác định, bổ sung interview_reservation để bảo vệ lịch tại DB. Từ điển dưới đây là bản thống nhất để viết migration, DTO và test. Các field được mô tả bắt buộc ở đây phải có constraint tương ứng hoặc được ghi rõ là điều kiện liên bảng do service kiểm.

| **STT** | **Bảng**              | **Chức năng và người sở hữu**                                                   |
|---------|-----------------------|---------------------------------------------------------------------------------|
| 1       | user_account          | Tài khoản dùng chung cho mọi vai trò; BE1                                       |
| 2       | user_role             | Một tài khoản có thể có nhiều vai trò; BE1                                      |
| 3       | auth_session          | Phiên đăng nhập phía server và trạng thái thu hồi; BE1                          |
| 4       | auth_token            | Token dùng một lần để xác minh email và đặt lại mật khẩu; BE1                   |
| 5       | candidate_profile     | Thông tin riêng của ứng viên; BE2                                               |
| 6       | company               | Doanh nghiệp và trạng thái kiểm duyệt; BE1                                      |
| 7       | company_membership    | Quan hệ tài khoản và doanh nghiệp, tách vai trò toàn cục khỏi quyền nội bộ; BE1 |
| 8       | job_post              | Tin tuyển dụng và mốc nhận hồ sơ; BE1                                           |
| 9       | skill                 | Danh mục kỹ năng chuẩn hóa; BE1                                                 |
| 10      | job_skill             | Liên kết nhiều nhiều giữa tin và kỹ năng; BE1                                   |
| 11      | candidate_skill       | Liên kết nhiều nhiều giữa ứng viên và kỹ năng; BE2                              |
| 12      | cv_version            | Metadata cho một tệp CV bất biến; BE2                                           |
| 13      | application           | Hồ sơ ứng tuyển và tham chiếu cố định đến CV đã nộp; BE2                        |
| 14      | application_history   | Lịch sử chỉ thêm của hồ sơ; BE2                                                 |
| 15      | cv_change_request     | Đề nghị thay CV khi hồ sơ đang được xét; BE2                                    |
| 16      | interview             | Lịch phỏng vấn gắn với một hồ sơ; BE3                                           |
| 17      | interview_participant | Danh sách tham gia và xác nhận lời mời; BE3                                     |
| 18      | evaluation            | Phiếu đánh giá nội bộ của từng người phỏng vấn; BE3                             |
| 19      | outbox_event          | Sự kiện được ghi trong cùng transaction nghiệp vụ; BE3                          |
| 20      | notification          | Thông báo trong ứng dụng cho một người nhận; BE3                                |
| 21      | email_delivery        | Theo dõi giao email cho từng sự kiện và người nhận; BE3                         |
| 22      | audit_log             | Nhật ký quản trị và thao tác nhạy cảm; BE3                                      |
| 23      | saved_job             | Tin quan tâm của ứng viên; BE2                                                  |
| 24      | idempotency_record    | Chống tạo lặp khi client retry thao tác nghiệp vụ; BE2                          |
| 25      | interview_reservation | Giữ chỗ theo participant và chống trùng ở DB; BE3                               |

### Bảng 1 user_account

| **Thuộc tính**    | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                      |
|-------------------|---------------------|-----------------------------------------------------------------------------------------------|
| id                | uuid                | PK; sinh UUID                                                                                 |
| email             | varchar(254)        | NOT NULL UNIQUE; trim/lowercase theo chuẩn hóa sản phẩm; DB CHECK email = lower(btrim(email)) |
| password_hash     | varchar(255)        | NOT NULL; BCrypt; không trả qua API                                                           |
| full_name         | varchar(120)        | NOT NULL; NFC; 1–120 ký tự sau trim                                                           |
| status            | varchar(16)         | NOT NULL; ACTIVE hoặc LOCKED; mặc định ACTIVE                                                 |
| email_verified_at | timestamptz         | NULL khi chưa xác minh                                                                        |
| created_at        | timestamptz         | NOT NULL; mặc định now()                                                                      |
| updated_at        | timestamptz         | NOT NULL; cập nhật qua service                                                                |
| version           | integer             | NOT NULL; mặc định 0; CHECK \>= 0                                                             |
| locked_reason     | varchar(1000)       | NULL nếu ACTIVE; có lý do khi LOCKED                                                          |

### Bảng 2 user_role

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                 |
|----------------|---------------------|--------------------------------------------------------------------------|
| user_id        | uuid                | PK ghép; FK user_account.id; ON DELETE RESTRICT                          |
| role           | varchar(20)         | PK ghép; CANDIDATE, RECRUITER, INTERVIEWER hoặc ADMIN                    |
| granted_at     | timestamptz         | NOT NULL; thời điểm cấp quyền                                            |
| granted_by     | uuid                | NULL khi seed/đăng ký hệ thống; FK account; audit khi cấp role đặc quyền |

### Bảng 3 auth_session

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                    |
|----------------|---------------------|-------------------------------------------------------------|
| id             | uuid                | PK                                                          |
| user_id        | uuid                | NOT NULL; FK user_account.id                                |
| token_hash     | char(64)            | NOT NULL; UNIQUE; SHA-256 của token ngẫu nhiên trong cookie |
| csrf_hash      | char(64)            | NOT NULL; hash token CSRF gắn với phiên                     |
| created_at     | timestamptz         | NOT NULL                                                    |
| last_seen_at   | timestamptz         | NOT NULL; cập nhật có giới hạn tần suất                     |
| expires_at     | timestamptz         | NOT NULL; lớn hơn created_at                                |
| revoked_at     | timestamptz         | NULL nếu còn hiệu lực                                       |

### Bảng 4 auth_token

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                              |
|----------------|---------------------|---------------------------------------------------------------------------------------|
| id             | uuid                | PK                                                                                    |
| user_id        | uuid                | NOT NULL; FK user_account.id                                                          |
| purpose        | varchar(24)         | NOT NULL CHECK VERIFY_EMAIL hoặc RESET_PASSWORD; TTL 24 giờ hoặc 30 phút theo purpose |
| token_hash     | char(64)            | NOT NULL; UNIQUE; không lưu token gốc                                                 |
| created_at     | timestamptz         | NOT NULL                                                                              |
| expires_at     | timestamptz         | NOT NULL; lớn hơn created_at                                                          |
| consumed_at    | timestamptz         | NULL trước khi dùng; cập nhật nguyên tử khi sử dụng                                   |
| invalidated_at | timestamptz         | NULL trừ khi resend/reset khác đã vô hiệu; token chỉ dùng nếu NULL                    |

### Bảng 5 candidate_profile

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                       |
|----------------|---------------------|------------------------------------------------|
| user_id        | uuid                | PK; FK user_account.id; quan hệ 1 đến 0 hoặc 1 |
| phone          | varchar(20)         | NULL; chuẩn hóa số điện thoại                  |
| headline       | varchar(160)        | NULL; vị trí mong muốn                         |
| summary        | text                | NULL; CHECK char_length ≤3000 nếu có           |
| location       | varchar(160)        | NULL                                           |
| updated_at     | timestamptz         | NOT NULL                                       |
| version        | integer             | NOT NULL; mặc định 0                           |

### Bảng 6 company

| **Thuộc tính**    | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                          |
|-------------------|---------------------|---------------------------------------------------|
| id                | uuid                | PK                                                |
| name              | varchar(200)        | NOT NULL                                          |
| registration_code | varchar(40)         | NOT NULL UNIQUE; trim/uppercase; không rỗng       |
| description       | text                | NOT NULL; giới hạn 10000 ký tự tại API            |
| website           | varchar(500)        | NULL; chỉ URL http hoặc https hợp lệ              |
| address           | varchar(300)        | NOT NULL                                          |
| approval_status   | varchar(20)         | NOT NULL; PENDING, APPROVED, REJECTED, SUSPENDED  |
| approval_reason   | text                | NULL; bắt buộc khi từ chối hoặc đình chỉ          |
| reviewed_by       | uuid                | NULL; FK user_account.id; quản trị viên thực hiện |
| reviewed_at       | timestamptz         | NULL khi chưa duyệt                               |
| created_at        | timestamptz         | NOT NULL                                          |
| version           | integer             | NOT NULL; mặc định 0                              |

### Bảng 7 company_membership

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                   |
|----------------|---------------------|------------------------------------------------------------|
| company_id     | uuid                | PK ghép; FK company.id                                     |
| user_id        | uuid                | PK ghép; FK user_account.id                                |
| permission     | varchar(20)         | NOT NULL; OWNER, RECRUITER hoặc INTERVIEWER                |
| active         | boolean             | NOT NULL; mặc định true                                    |
| joined_at      | timestamptz         | NOT NULL                                                   |
| version        | integer             | NOT NULL DEFAULT 0 CHECK ≥0; cập nhật có điều kiện version |

### Bảng 8 job_post

| **Thuộc tính**  | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                           |
|-----------------|---------------------|--------------------------------------------------------------------|
| id              | uuid                | PK                                                                 |
| company_id      | uuid                | NOT NULL; FK company.id                                            |
| created_by      | uuid                | NOT NULL; FK user_account.id; kiểm tra membership tại service      |
| title           | varchar(150)        | NOT NULL; 10 đến 150 ký tự khi công bố                             |
| description     | text                | NULL ở DRAFT; 100 đến 10000 ký tự khi công bố                      |
| location        | varchar(160)        | NULL ở DRAFT; bắt buộc khi công bố                                 |
| employment_type | varchar(20)         | NULL ở DRAFT; FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP           |
| work_mode       | varchar(12)         | NULL ở DRAFT; ONSITE, REMOTE, HYBRID                               |
| headcount       | smallint            | NULL ở DRAFT; 1–100 khi có; là kế hoạch, không hard cap HIRED      |
| salary_min      | numeric(15,2)       | NULL cùng salary_max và currency; nếu khai báo phải đủ ba và min≥0 |
| salary_max      | numeric(15,2)       | NULL cùng salary_min và currency; nếu có CHECK max≥min             |
| currency        | char(3)             | NULL khi không khai báo lương; khi có CHECK VND hoặc USD           |
| deadline        | timestamptz         | NULL ở DRAFT; bắt buộc và còn hạn khi công bố                      |
| status          | varchar(16)         | NOT NULL; DRAFT, PUBLISHED, CLOSED                                 |
| published_at    | timestamptz         | NULL trước công bố                                                 |
| closed_at       | timestamptz         | NULL trước đóng                                                    |
| created_at      | timestamptz         | NOT NULL                                                           |
| updated_at      | timestamptz         | NOT NULL                                                           |
| version         | integer             | NOT NULL; mặc định 0                                               |

### Bảng 9 skill

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**       |
|----------------|---------------------|--------------------------------|
| id             | uuid                | PK                             |
| name           | varchar(80)         | NOT NULL; UNIQUE sau chuẩn hóa |
| active         | boolean             | NOT NULL; mặc định true        |

### Bảng 10 job_skill

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa** |
|----------------|---------------------|--------------------------|
| job_id         | uuid                | PK ghép; FK job_post.id  |
| skill_id       | uuid                | PK ghép; FK skill.id     |

### Bảng 11 candidate_skill

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**              |
|----------------|---------------------|---------------------------------------|
| candidate_id   | uuid                | PK ghép; FK candidate_profile.user_id |
| skill_id       | uuid                | PK ghép; FK skill.id                  |

### Bảng 12 cv_version

| **Thuộc tính**      | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                    |
|---------------------|---------------------|---------------------------------------------------------------------------------------------|
| id                  | uuid                | PK; thêm UNIQUE(id, candidate_id) để dùng FK ghép                                           |
| candidate_id        | uuid                | NOT NULL; FK candidate_profile.user_id                                                      |
| version_no          | integer             | NOT NULL \>0; UNIQUE(candidate_id,version_no); cấp dưới khóa user, không tái dùng số đã xóa |
| original_name       | varchar(255)        | NOT NULL; tên hiển thị đã loại ký tự điều khiển                                             |
| object_key          | varchar(500)        | NOT NULL UNIQUE; key attempt thắng; bất biến khi READY; không chứa tên/path client          |
| size_bytes          | bigint              | NULL trước upload; CHECK \> 0 và \<= 10485760 nếu có                                        |
| mime_type           | varchar(80)         | NULL trước kiểm tra; application/pdf khi READY                                              |
| checksum_sha256     | char(64)            | NULL trước kiểm tra; bắt buộc khi READY                                                     |
| status              | varchar(24)         | NOT NULL CHECK PENDING_UPLOAD QUARANTINED SCANNING READY REJECTED DELETE_PENDING DELETED    |
| scan_attempt_count  | integer             | NOT NULL; mặc định 0; số lần thử quét                                                       |
| scan_locked_until   | timestamptz         | NULL; lease của worker quét                                                                 |
| scan_next_retry_at  | timestamptz         | NULL; mốc retry lỗi kỹ thuật                                                                |
| scan_reason         | varchar(500)        | NULL; lỗi kỹ thuật hoặc lý do từ chối đã làm sạch                                           |
| upload_expires_at   | timestamptz         | NOT NULL; hạn hoàn tất upload                                                               |
| created_at          | timestamptz         | NOT NULL                                                                                    |
| ready_at            | timestamptz         | NULL trước READY                                                                            |
| deleted_at          | timestamptz         | NULL trước xóa logic                                                                        |
| storage_version_id  | varchar(255)        | NULL trước finalize; bắt buộc READY; định danh object version thực đã quét                  |
| upload_attempt_id   | uuid                | NULL trước nhận content; attempt đang có quyền ghi/finalize; CAS chống finalize muộn        |
| lease_token         | uuid                | NULL khi không có worker claim; gắn scan/delete task hiện tại                               |
| delete_requested_at | timestamptz         | NULL trước DELETE_PENDING; delete worker retry, chỉ DELETED mới giải phóng quota            |
| version             | integer             | NOT NULL DEFAULT 0 CHECK ≥0; CAS trạng thái worker và request                               |

### Bảng 13 application

| **Thuộc tính**         | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                                  |
|------------------------|---------------------|-----------------------------------------------------------------------------------------------------------|
| id                     | uuid                | PK; thêm UNIQUE(id, candidate_id)                                                                         |
| job_id                 | uuid                | NOT NULL; FK job_post.id                                                                                  |
| candidate_id           | uuid                | NOT NULL; FK candidate_profile.user_id                                                                    |
| original_cv_version_id | uuid                | NOT NULL; FK ghép candidate_id đến CV; bất biến sau INSERT                                                |
| status                 | varchar(24)         | NOT NULL; SUBMITTED, SCREENING, SHORTLISTED, INTERVIEW_SCHEDULED, INTERVIEWED, HIRED, REJECTED, WITHDRAWN |
| cover_letter           | text                | NULL; tối đa 3000 ký tự                                                                                   |
| result_message         | text                | NULL nếu chưa có kết quả cuối; 1–3000 ký tự và NOT NULL khi HIRED/REJECTED                                |
| result_published_at    | timestamptz         | NULL nếu chưa kết thúc bằng kết quả; NOT NULL khi HIRED/REJECTED                                          |
| submitted_at           | timestamptz         | NOT NULL                                                                                                  |
| updated_at             | timestamptz         | NOT NULL                                                                                                  |
| version                | integer             | NOT NULL DEFAULT 0 CHECK ≥0; UNIQUE(candidate_id,job_id) ở cấp bảng                                       |
| current_cv_version_id  | uuid                | NOT NULL; FK ghép candidate_id đến CV; chỉ đổi qua UC06                                                   |
| candidate_snapshot     | jsonb               | NOT NULL; tên/email/phone/headline tại lúc nộp, allowlist; bất biến sau INSERT                            |

### Bảng 14 application_history

| **Thuộc tính**    | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                                          |
|-------------------|---------------------|-------------------------------------------------------------------------------------------------------------------|
| id                | uuid                | PK                                                                                                                |
| application_id    | uuid                | NOT NULL; FK application.id                                                                                       |
| actor_id          | uuid                | NULL cho event hệ thống; FK account nếu có; actor_type SYSTEM hoặc USER phải tương ứng                            |
| event_type        | varchar(40)         | NOT NULL CHECK SUBMIT STATUS_CHANGE CV_REPLACED RESULT_PUBLISHED INTERVIEW_CONFIRMED INTERVIEW_CANCELLED WITHDRAW |
| from_status       | varchar(24)         | NULL khi nộp mới                                                                                                  |
| to_status         | varchar(24)         | NOT NULL                                                                                                          |
| old_cv_id         | uuid                | NULL khi không có; FK ghép (old_cv_id,candidate_id) đến CV                                                        |
| new_cv_id         | uuid                | NULL khi không có; FK ghép (new_cv_id,candidate_id) đến CV                                                        |
| reason            | text                | NULL khi không cần; lý do nội bộ, không trả cho candidate; bắt buộc với từ chối                                   |
| created_at        | timestamptz         | NOT NULL; không sửa hoặc xóa qua API                                                                              |
| candidate_id      | uuid                | NOT NULL; FK (application_id,candidate_id) đến application                                                        |
| public_message    | varchar(3000)       | NULL; thông điệp allowlist được phép candidate đọc, không suy từ reason                                           |
| actor_type        | varchar(10)         | NOT NULL CHECK USER hoặc SYSTEM; CHECK actor_id tương ứng                                                         |
| aggregate_version | integer             | NOT NULL CHECK ≥0; phiên bản application sau mutation                                                             |

### Bảng 15 cv_change_request

| **Thuộc tính**                 | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                            |
|--------------------------------|---------------------|-------------------------------------------------------------------------------------|
| id                             | uuid                | PK                                                                                  |
| application_id                 | uuid                | NOT NULL; FK ghép (application_id,candidate_id) đến application(id,candidate_id)    |
| candidate_id                   | uuid                | NOT NULL; FK candidate_profile.user_id                                              |
| new_cv_id                      | uuid                | NOT NULL; FK ghép (new_cv_id,candidate_id) đến cv_version(id,candidate_id)          |
| status                         | varchar(16)         | NOT NULL; PENDING, APPROVED, REJECTED, CANCELLED                                    |
| requested_at                   | timestamptz         | NOT NULL                                                                            |
| reviewed_by                    | uuid                | NULL; FK user_account.id                                                            |
| reviewed_at                    | timestamptz         | NULL trước quyết định                                                               |
| reason                         | text                | NULL; lý do từ chối hoặc hủy                                                        |
| version                        | integer             | NOT NULL; mặc định 0; tối đa một PENDING mỗi application                            |
| base_cv_version_id             | uuid                | NOT NULL; FK ghép candidate_id đến CV; phải bằng current lúc duyệt                  |
| application_version_at_request | integer             | NOT NULL CHECK ≥0; snapshot version để truy vết, duyệt vẫn nhận expectedVersion mới |
| cancelled_at                   | timestamptz         | NULL trước CANCELLED; bắt buộc khi CANCELLED; reason và actor trong audit           |

### Bảng 16 interview

| **Thuộc tính**        | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                |
|-----------------------|---------------------|-----------------------------------------------------------------------------------------|
| id                    | uuid                | PK                                                                                      |
| application_id        | uuid                | NOT NULL; FK application.id                                                             |
| created_by            | uuid                | NOT NULL; FK user_account.id                                                            |
| start_at              | timestamptz         | NOT NULL                                                                                |
| end_at                | timestamptz         | NOT NULL; thời lượng từ 15 đến 120 phút                                                 |
| status                | varchar(16)         | NOT NULL CHECK PROPOSED CONFIRMED DECLINED EXPIRED CANCELLED COMPLETED NO_SHOW          |
| room_key              | varchar(150)        | NOT NULL; UNIQUE; sinh ngẫu nhiên                                                       |
| provider_room_id      | varchar(255)        | NULL; định danh dịch vụ video nếu có                                                    |
| cancel_reason         | text                | NULL; bắt buộc khi hủy                                                                  |
| created_at            | timestamptz         | NOT NULL                                                                                |
| updated_at            | timestamptz         | NOT NULL                                                                                |
| version               | integer             | NOT NULL; mặc định 0                                                                    |
| replaces_interview_id | uuid                | NULL hoặc FK interview.id; không tự trỏ; chỉ một replacement PROPOSED                   |
| expires_at            | timestamptz         | NOT NULL; start_at với proposal thường; min(start_at, lịch cũ.start_at) khi thay thế    |
| access_generation     | integer             | NOT NULL DEFAULT 0 CHECK ≥0; tăng mỗi lần vô hiệu quyền phòng                           |
| room_access_state     | varchar(20)         | NOT NULL CHECK ACTIVE REVOKE_PENDING REVOKED; join chỉ khi lịch CONFIRMED               |
| outcome_reason        | varchar(1000)       | NULL; bắt buộc NO_SHOW hoặc gián đoạn do an ninh                                        |
| completed_at          | timestamptz         | NULL trước COMPLETED/NO_SHOW; actor hoàn tất trong audit                                |
| cancelled_at          | timestamptz         | NULL trước CANCELLED; bắt buộc khi CANCELLED; không thay bằng updated_at                |
| cancelled_by          | uuid                | NULL khi chưa hủy hoặc tác vụ hệ thống; FK account nếu user hủy; actor_type trong audit |

### Bảng 17 interview_participant

| **Thuộc tính**         | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                        |
|------------------------|---------------------|-------------------------------------------------------------------------------------------------|
| interview_id           | uuid                | PK ghép; FK interview.id                                                                        |
| user_id                | uuid                | PK ghép; FK user_account.id                                                                     |
| participant_role       | varchar(16)         | NOT NULL; CANDIDATE hoặc INTERVIEWER                                                            |
| response               | varchar(12)         | NOT NULL; PENDING, ACCEPTED, DECLINED                                                           |
| responded_at           | timestamptz         | NULL trước phản hồi                                                                             |
| attendance             | varchar(12)         | NOT NULL DEFAULT UNKNOWN; CHECK UNKNOWN ATTENDED ABSENT                                         |
| attendance_reason      | varchar(1000)       | NULL; bắt buộc khi ABSENT                                                                       |
| attendance_recorded_by | uuid                | NULL trước ghi attendance; FK account                                                           |
| attendance_recorded_at | timestamptz         | NULL trước ghi attendance                                                                       |
| version                | integer             | NOT NULL DEFAULT 0 CHECK ≥0; UNIQUE(interview_id,user_id,participant_role) hỗ trợ FK evaluation |

### Bảng 18 evaluation

| **Thuộc tính**      | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                                            |
|---------------------|---------------------|---------------------------------------------------------------------------------------------------------------------|
| id                  | uuid                | PK                                                                                                                  |
| interview_id        | uuid                | NOT NULL; FK interview.id                                                                                           |
| interviewer_id      | uuid                | NOT NULL; FK ghép có participant_role INTERVIEWER; UNIQUE(interview_id,interviewer_id)                              |
| technical_score     | smallint            | NOT NULL; CHECK từ 1 đến 5                                                                                          |
| communication_score | smallint            | NOT NULL; CHECK từ 1 đến 5                                                                                          |
| fit_score           | smallint            | NOT NULL; CHECK từ 1 đến 5                                                                                          |
| recommendation      | varchar(16)         | NOT NULL; HIRE, HOLD hoặc REJECT                                                                                    |
| internal_note       | text                | NOT NULL; CHECK độ dài sau trim 1–5000; không trả candidate                                                         |
| submitted_at        | timestamptz         | NOT NULL                                                                                                            |
| updated_at          | timestamptz         | NOT NULL                                                                                                            |
| version             | integer             | NOT NULL; mặc định 0; UNIQUE(interview_id,interviewer_id)                                                           |
| participant_role    | varchar(16)         | NOT NULL DEFAULT INTERVIEWER CHECK = INTERVIEWER; FK (interview_id,interviewer_id,participant_role) đến participant |

### Bảng 19 outbox_event

| **Thuộc tính**    | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                                                                |
|-------------------|---------------------|-------------------------------------------------------------------------------------------------------------------------|
| id                | uuid                | PK; event id dùng chống xử lý lặp                                                                                       |
| aggregate_type    | varchar(40)         | NOT NULL CHECK APPLICATION INTERVIEW COMPANY AUTH JOB CV USER                                                           |
| aggregate_id      | uuid                | NOT NULL; định danh đối tượng; không là FK đa hình                                                                      |
| event_type        | varchar(60)         | NOT NULL                                                                                                                |
| payload           | jsonb               | NOT NULL; chỉ ID và dữ liệu tối thiểu, không chứa CV, mật khẩu hoặc token dạng rõ; vật liệu gửi token chỉ ở dạng mã hóa |
| status            | varchar(16)         | NOT NULL; PENDING, PROCESSING, DONE, FAILED                                                                             |
| attempt_count     | integer             | NOT NULL DEFAULT 0 CHECK ≥0; mọi lần claim; lỗi lần 6 FAILED                                                            |
| next_retry_at     | timestamptz         | NOT NULL                                                                                                                |
| locked_until      | timestamptz         | NULL; hạn lease của worker                                                                                              |
| last_error_code   | varchar(80)         | NULL; không chứa bí mật                                                                                                 |
| created_at        | timestamptz         | NOT NULL                                                                                                                |
| processed_at      | timestamptz         | NULL trước hoàn tất                                                                                                     |
| lease_token       | uuid                | NULL ngoài PROCESSING; NOT NULL khi PROCESSING; CAS heartbeat/ack/fail                                                  |
| schema_version    | integer             | NOT NULL DEFAULT 1 CHECK \>0; version hợp đồng event                                                                    |
| aggregate_version | integer             | NOT NULL CHECK ≥0; so thứ tự nghiệp vụ, không giả định thứ tự worker                                                    |

### Bảng 20 notification

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                             |
|----------------|---------------------|--------------------------------------------------------------------------------------|
| id             | uuid                | PK                                                                                   |
| user_id        | uuid                | NOT NULL; FK user_account.id                                                         |
| event_id       | uuid                | NOT NULL; FK outbox_event.id; UNIQUE(user_id,event_id)                               |
| title          | varchar(160)        | NOT NULL                                                                             |
| content        | varchar(1000)       | NOT NULL; nội dung công khai theo người nhận                                         |
| target_type    | varchar(24)         | NOT NULL CHECK APPLICATION INTERVIEW COMPANY JOB; chỉ notification có đích nghiệp vụ |
| target_id      | uuid                | NOT NULL; kiểm tra quyền lại khi mở đích                                             |
| created_at     | timestamptz         | NOT NULL                                                                             |
| read_at        | timestamptz         | NULL khi chưa đọc                                                                    |

### Bảng 21 email_delivery

| **Thuộc tính**      | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                    |
|---------------------|---------------------|-----------------------------------------------------------------------------|
| id                  | uuid                | PK                                                                          |
| event_id            | uuid                | NOT NULL; FK outbox_event.id                                                |
| user_id             | uuid                | NOT NULL; FK user_account.id                                                |
| template_code       | varchar(60)         | NOT NULL; UNIQUE(event_id,user_id,template_code)                            |
| status              | varchar(16)         | NOT NULL; PENDING, SENDING, SENT, FAILED                                    |
| provider_message_id | varchar(255)        | NULL                                                                        |
| attempt_count       | integer             | NOT NULL; mặc định 0                                                        |
| sent_at             | timestamptz         | NULL trước gửi                                                              |
| last_error_code     | varchar(80)         | NULL                                                                        |
| locked_until        | timestamptz         | NULL ngoài SENDING; hạn claim gửi email                                     |
| lease_token         | uuid                | NULL ngoài SENDING; CAS chỉ worker hiện tại được ack                        |
| next_retry_at       | timestamptz         | NOT NULL; index worker polling                                              |
| created_at          | timestamptz         | NOT NULL                                                                    |
| recipient_email     | varchar(254)        | NOT NULL; snapshot người nhận của delivery, không lấy email tùy ý từ client |

### Bảng 22 audit_log

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                     |
|----------------|---------------------|----------------------------------------------|
| id             | uuid                | PK                                           |
| actor_id       | uuid                | NULL cho tác vụ hệ thống; FK user_account.id |
| action         | varchar(60)         | NOT NULL                                     |
| entity_type    | varchar(40)         | NOT NULL                                     |
| entity_id      | uuid                | NOT NULL; không là FK đa hình                |
| reason         | varchar(1000)       | NULL; không lưu nội dung CV hoặc token       |
| trace_id       | uuid                | NOT NULL; đối chiếu request                  |
| created_at     | timestamptz         | NOT NULL; chỉ thêm                           |

### Bảng 23 saved_job

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**              |
|----------------|---------------------|---------------------------------------|
| candidate_id   | uuid                | PK ghép; FK candidate_profile.user_id |
| job_id         | uuid                | PK ghép; FK job_post.id               |
| created_at     | timestamptz         | NOT NULL                              |

### Bảng 24 idempotency_record

| **Thuộc tính** | **Kiểu PostgreSQL** | **Ràng buộc và ý nghĩa**                                                    |
|----------------|---------------------|-----------------------------------------------------------------------------|
| id             | uuid                | PK                                                                          |
| user_id        | uuid                | NOT NULL; FK user_account.id                                                |
| operation      | varchar(80)         | NOT NULL; tên nghiệp vụ chuẩn hóa                                           |
| key            | varchar(100)        | NOT NULL; UNIQUE(user_id,operation,key)                                     |
| request_hash   | char(64)            | NOT NULL; hash payload chuẩn hóa                                            |
| resource_id    | uuid                | NULL trước hoàn tất; không là FK đa hình                                    |
| status         | varchar(16)         | NOT NULL; PROCESSING hoặc COMPLETED                                         |
| response_code  | smallint            | NULL trước hoàn tất; không lưu URL ký hoặc token                            |
| created_at     | timestamptz         | NOT NULL                                                                    |
| expires_at     | timestamptz         | NOT NULL; mặc định giữ 24 giờ                                               |
| completed_at   | timestamptz         | NULL trước COMPLETED; business và record commit cùng tx; không cache bí mật |

### Bảng 25 interview_reservation

| **Thuộc tính** | **Kiểu PostgreSQL**  | **Ràng buộc và ý nghĩa**                                                    |
|----------------|----------------------|-----------------------------------------------------------------------------|
| interview_id   | uuid                 | PK ghép; FK interview.id; một reservation mỗi participant của một lịch      |
| user_id        | uuid                 | PK ghép; FK (interview_id,user_id) đến participant                          |
| start_at       | timestamptz          | NOT NULL; phải bằng interview.start_at qua service                          |
| end_at         | timestamptz          | NOT NULL CHECK end_at\>start_at; phải bằng interview.end_at                 |
| created_at     | timestamptz          | NOT NULL                                                                    |
| released_at    | timestamptz          | NULL khi active; release khi hủy/thay thế/hoàn tất; không xóa lịch sử       |
| release_reason | varchar(100)         | NULL khi active; bắt buộc khi released; service kiểm trạng thái và audit    |
| ex_user_time   | exclusion constraint | user_id bằng nhau và khoảng \[start,end) giao nhau bị cấm nếu cả hai active |

## 5.2 Ràng buộc liên bảng và tính nhất quán

**Triển khai BE2 đang chờ migration nền:** [kế hoạch model và migration BE2](be2-data-migration-plan.md) liệt kê tám model do BE2 sở hữu và SQL FK/CHECK/trigger/chỉ mục ở `prisma/pending/`. Bản SQL chưa được áp dụng vì `user_account`, `skill`, `job_post` của BE1 chưa có migration trên main; nó phải được chuyển thành migration sau BE1 rồi kiểm PostgreSQL thật trước khi coi DB BE2 hoàn thành. Quy tắc và bất biến trong các bảng dưới đây không thay đổi.

| **Mã** | **Bất biến**                                                         | **Nơi bảo vệ và ca kiểm thử**                                                        |
|--------|----------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| INV01  | Một application cho candidate và job kể cả đã kết thúc               | UNIQUE candidate_id job_id; TC08 TC43                                                |
| INV02  | CV gốc hiện tại và CV trong đề nghị thuộc cùng candidate             | FK ghép id candidate_id; EC01 EC02                                                   |
| INV03  | Không sửa CV gốc sau khi nộp và không ghi đè object                  | Repository allowlist trigger bất biến và storage version; EC01 EC03                  |
| INV04  | Một PENDING CV change mỗi application                                | Partial UNIQUE; TC40 EC04                                                            |
| INV05  | Đúng một ứng viên của hồ sơ và ít nhất một interviewer khác người đó | Partial unique cho ứng viên; service kiểm số lượng và danh tính dưới khóa; TC45 EC17 |
| INV06  | Evaluation chỉ gắn participant INTERVIEWER                           | FK ghép interview_id interviewer_id participant_role và CHECK role; EC18             |
| INV07  | Không có hai reservation active giao nhau của cùng user              | GiST exclusion và khóa user; TC15 EC12                                               |
| INV08  | Mỗi lịch CONFIRMED có reservation cho tất cả participant             | Service cùng transaction và reconciliation; EC13                                     |
| INV09  | Trạng thái kết quả cuối luôn có message và published_at              | CHECK cột và UC09 transaction; EC08                                                  |
| INV10  | Lịch sử và audit chỉ thêm                                            | DB privileges trigger chống UPDATE DELETE ở runtime; EC32                            |
| INV11  | Doanh nghiệp được vận hành có OWNER khả dụng                         | CompanyRules kiểm under lock; chuyển quyền thường không mất OWNER; EC21              |
| INV12  | Worker cũ không ack task đã được claim lại                           | lease_token cùng điều kiện update; EC25                                              |

application_history có candidate_id và FK (application_id,candidate_id), old_cv_id/new_cv_id dùng FK ghép cùng candidate; không chỉ tham chiếu ID CV độc lập. evaluation có participant_role cố định INTERVIEWER và FK đến khóa UNIQUE(interview_id,user_id,participant_role) của participant. Cách này bảo đảm FK không cho ứng viên tạo phiếu ngay cả khi API khác bị viết sai.

Các điều kiện như membership hiện hành, số OWNER khả dụng, attendance và trạng thái liên bảng vẫn phải kiểm trong service; FK không thay thế policy. Nếu cần bảo vệ mọi writer ở mức DB, dùng deferred constraint trigger cho reservation/participant consistency; trong phạm vi này mọi writer runtime bắt buộc qua service và có reconciliation phát hiện sai lệch. Exclusion bảo vệ trùng giờ nhưng không tự sinh reservation còn thiếu.

## 5.3 Migration SQL trọng yếu

Các đoạn SQL sau là phần bổ sung cho bảng đã tạo theo từ điển, không phải migration độc lập chạy trên database rỗng. Không tạo constraint trùng nếu đã được Prisma sinh. Extension btree_gist phải được cấp trước; môi trường thiếu extension làm migration fail, không bỏ qua ràng buộc. \[TL04 TL06 TL07\]

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE UNIQUE INDEX uq_cv_change_pending

ON cv_change_request(application_id) WHERE status = 'PENDING';

CREATE UNIQUE INDEX uq_replacement_pending

ON interview(replaces_interview_id)

WHERE status = 'PROPOSED' AND replaces_interview_id IS NOT NULL;

CREATE UNIQUE INDEX uq_interview_candidate

ON interview_participant(interview_id)

WHERE participant_role = 'CANDIDATE';

ALTER TABLE interview_reservation ADD CONSTRAINT ex_user_time

EXCLUDE USING gist

(user_id WITH =,

tstzrange(start_at, end_at, '\[)') WITH &&)

WHERE (released_at IS NULL);

ALTER TABLE interview_reservation ADD CONSTRAINT ck_reservation_time

CHECK (end_at \> start_at);

ALTER TABLE interview ADD CONSTRAINT ck_interview_duration

CHECK (end_at - start_at BETWEEN

interval '15 minutes' AND interval '120 minutes');

ALTER TABLE application ADD CONSTRAINT ck_final_result

CHECK ((status IN ('HIRED', 'REJECTED')

AND result_published_at IS NOT NULL

AND result_message IS NOT NULL

AND char_length(btrim(result_message)) BETWEEN 1 AND 3000)

OR (status NOT IN ('HIRED', 'REJECTED')

AND result_published_at IS NULL AND result_message IS NULL));

Migration đầy đủ phải có UNIQUE(id,candidate_id) cho cv_version và application; FK ghép của original/current/history/change request; CHECK enum, score, salary, byte và timestamps; FK participant role cho evaluation; CHECK lease/state; index query theo company qua job; index worker theo status và next_retry_at. Integration kiểm pg_constraint/pg_indexes và thử insert sai, không chỉ kiểm Prisma schema.

**CHECK cột quy định:** PUBLISHED phải đủ trường và published_at; CLOSED có closed_at nhưng có thể chưa từng công bố nếu bỏ nháp; READY có byte, MIME, checksum, storage_version_id và ready_at; DELETED có deleted_at; PENDING chưa có quyết định; APPROVED/REJECTED có reviewed_by và reviewed_at; CANCELLED có thời điểm và lý do hủy, actor có thể là hệ thống. Mỗi CHECK nullable phải xử lý NULL tường minh vì biểu thức UNKNOWN không bị PostgreSQL coi là vi phạm. Deadline và quyền hiện tại vẫn kiểm trong service.

## 5.4 Chỉ mục truy vấn và quản lý thay đổi dữ liệu

| **Đối tượng**         | **Chỉ mục đề xuất**                                               | **Mục đích**                                |
|-----------------------|-------------------------------------------------------------------|---------------------------------------------|
| job_post              | (status, deadline, published_at DESC, id)                         | Lọc tin còn hạn; đo query plan trước tối ưu |
| application           | UNIQUE(candidate_id,job_id); (job_id,status,submitted_at)         | Chống trùng và lọc hồ sơ                    |
| cv_version            | (candidate_id,created_at DESC); UNIQUE(candidate_id,version_no)   | Kho CV và đánh số phiên bản                 |
| cv_change_request     | UNIQUE(application_id) WHERE status=PENDING                       | Một đề nghị đang chờ                        |
| interview             | (application_id,status); (start_at,end_at) WHERE status=CONFIRMED | Lịch theo hồ sơ và truy vấn giao nhau       |
| interview_participant | (user_id,interview_id)                                            | Tìm lịch của một người                      |
| outbox_event          | (status,next_retry_at,locked_until)                               | Worker claim sự kiện                        |
| auth_session          | UNIQUE(token_hash); (user_id,revoked_at,expires_at)               | Xác thực và thu hồi                         |
| notification          | (user_id,created_at DESC); UNIQUE(user_id,event_id)               | Thông báo và chống trùng                    |

Bổ sung index interview(replaces_interview_id,status), interview_participant(user_id,interview_id), reservation(user_id,start_at,end_at) theo execution plan, và application_history(application_id,created_at,id). Phân trang luôn có id làm khóa phụ; thống kê không JOIN nhân bản hồ sơ theo số phiếu hay kỹ năng.

Mỗi người viết migration cho use case của mình và chỉ sửa model sở hữu. Migration có phụ thuộc FK được merge theo thứ tự Identity và Company, rồi Job/CV, Application, Interview/Evaluation và Notifications. Người điều phối migration kiểm thứ tự và conflict nhưng không làm thay database của cả nhóm. Không sửa migration đã áp dụng môi trường chung; tạo migration mới và kiểm upgrade từ fixture có dữ liệu.

## 5.5 Sơ đồ database theo phân hệ

Năm ERD cùng mô tả 25 bảng trong từ điển tại mục 5.1. PK là khóa chính, FK là khóa ngoại, UQ là ràng buộc duy nhất; 0..N và 0..1 là bội số có thể có theo quan hệ dữ liệu. Đầu nhánh nhiều dùng ký hiệu chân quạ; quan hệ 0..1 ghi trực tiếp bội số. Những số lượng tối thiểu phụ thuộc trạng thái như một OWNER khả dụng, đúng một candidate và đủ reservation được service bảo vệ như mục 5.2.

Hình lược bớt field không ảnh hưởng quan hệ và một số liên kết actor quay về user_account để tránh dây chằng chéo. Tên field gốc/current/base/new CV trên hình được rút gọn khi cần; tên vật lý đầy đủ và mọi FK ghép có trong từ điển và ma trận mục 5.6. Không có một bảng user hoặc candidate thứ hai khi cùng tên xuất hiện ở nhiều phần giải thích.

Hình 5.1 ERD tài khoản phiên và hồ sơ cá nhân

![Hình 5.1 ERD tài khoản phiên và hồ sơ cá nhân](Bao_Cao_SE113_media/image16.png)

CandidateProfile không bắt buộc với mọi account nhưng được tạo cùng transaction khi cấp role CANDIDATE. Role toàn cục không thay thế membership doanh nghiệp. FK granted_by quay về user_account; các hash/token không được đưa vào DTO giao diện.

Hình 5.2 ERD doanh nghiệp tin tuyển dụng và kỹ năng

![Hình 5.2 ERD doanh nghiệp tin tuyển dụng và kỹ năng](Bao_Cao_SE113_media/image17.png)

CompanyMembership là thực thể liên kết company–user, mỗi quan hệ có permission riêng. JobSkill và CandidateSkill biểu diễn hai quan hệ nhiều–nhiều. Tối thiểu một OWNER khả dụng và deadline tương lai là rules được kiểm trong transaction, không được suy từ FK.

Hình 5.3 ERD CV hồ sơ lịch sử và đề nghị thay CV

![Hình 5.3 ERD CV hồ sơ lịch sử và đề nghị thay CV](Bao_Cao_SE113_media/image18.png)

Các FK từ application và history/change request tới CV đều mang candidate_id để ngăn tham chiếu CV khác chủ. Hình rút gọn tên field cho dễ đọc; tên đầy đủ trong từ điển dữ liệu. SavedJob tham chiếu JobPost ở ERD 5.2, độc lập vòng đời Application.

Hình 5.4 ERD lịch participant reservation và đánh giá

![Hình 5.4 ERD lịch participant reservation và đánh giá](Bao_Cao_SE113_media/image19.png)

Reservation có FK ghép tới participant và exclusion theo user với khoảng \[start,end). Evaluation dùng FK ghép cả participant_role = INTERVIEWER; FK thông thường chỉ tới user chưa đủ bảo vệ. Lịch thay thế trỏ lịch cũ và được xác nhận trong transaction đổi reservation.

Hình 5.5 ERD sự kiện thông báo nhật ký và idempotency

![Hình 5.5 ERD sự kiện thông báo nhật ký và idempotency](Bao_Cao_SE113_media/image20.png)

Ba nhóm dữ liệu audit, idempotency và event phối hợp qua transaction/service, không tự có FK giữa mọi bảng. User FK tham chiếu ERD 5.1. Mỗi consumer có unique key và lease riêng; SMTP không có exactly-once nếu provider không hỗ trợ.

## 5.6 Ma trận quan hệ và đối chiếu ERD với ràng buộc

Các FK mặc định RESTRICT theo mục 5.1, không cascade xóa hồ sơ hoặc lịch sử. Cặp nhiều cột là một FK ghép, không phải các FK rời cho phép trộn chủ sở hữu. Một field có thể có thêm FK độc lập tới cùng bảng cha nếu migration cần, nhưng không được thiếu FK ghép bảo vệ ownership/role đã đặc tả.

| **FK ở bảng con**                                                                     | **Khóa được tham chiếu**                                      | **Bội số và điều kiện**                                        | **ERD** |
|---------------------------------------------------------------------------------------|---------------------------------------------------------------|----------------------------------------------------------------|---------|
| user_role.user_id                                                                     | user_account.id                                               | 1 tài khoản có 0..N role                                       | 5.1     |
| auth_session.user_id; auth_token.user_id                                              | user_account.id                                               | 1 tài khoản có 0..N session/token                              | 5.1     |
| candidate_profile.user_id                                                             | user_account.id                                               | 1 tài khoản có 0..1 profile                                    | 5.1     |
| company_membership.company_id; user_id                                                | company.id; user_account.id                                   | Mỗi membership đúng 1 company và 1 user; PK ghép               | 5.2     |
| company.reviewed_by                                                                   | user_account.id                                               | 0..1 người duyệt cho mỗi company                               | 5.2     |
| job_post.company_id; created_by                                                       | company.id; user_account.id                                   | 1 company có 0..N job; actor tạo đúng scope                    | 5.2     |
| job_skill.job_id; skill_id                                                            | job_post.id; skill.id                                         | Nhiều–nhiều qua PK ghép                                        | 5.2     |
| candidate_skill.candidate_id; skill_id                                                | candidate_profile.user_id; skill.id                           | Nhiều–nhiều qua PK ghép                                        | 5.2     |
| cv_version.candidate_id                                                               | candidate_profile.user_id                                     | 1 candidate có 0..N version                                    | 5.3     |
| application.job_id; candidate_id                                                      | job_post.id; candidate_profile.user_id                        | Mỗi application đúng 1 job/1 candidate; UNIQUE cặp             | 5.3     |
| application.original_cv_version_id, candidate_id                                      | cv_version.id, candidate_id                                   | FK ghép; original bất biến                                     | 5.3     |
| application.current_cv_version_id, candidate_id                                       | cv_version.id, candidate_id                                   | FK ghép; current chỉ đổi qua UC06                              | 5.3     |
| application_history.application_id, candidate_id                                      | application.id, candidate_id                                  | 1 application có 1..N event theo service                       | 5.3     |
| application_history.old_cv_id/new_cv_id, candidate_id                                 | cv_version.id, candidate_id                                   | FK ghép nullable; CV lịch sử không khác owner                  | 5.3     |
| application_history.actor_id                                                          | user_account.id                                               | Nullable khi actor_type SYSTEM                                 | 5.3     |
| cv_change_request.application_id, candidate_id                                        | application.id, candidate_id                                  | 1 application có 0..N request; tối đa 1 PENDING                | 5.3     |
| cv_change_request.base_cv_version_id/new_cv_id, candidate_id                          | cv_version.id, candidate_id                                   | FK ghép, đúng owner và base lúc duyệt                          | 5.3     |
| cv_change_request.reviewed_by                                                         | user_account.id                                               | Nullable trước quyết định hoặc hủy hệ thống                    | 5.3     |
| saved_job.candidate_id; job_id                                                        | candidate_profile.user_id; job_post.id                        | PK ghép; không xóa lịch sử ứng tuyển theo savedJob             | 5.3     |
| interview.application_id; created_by/cancelled_by                                     | application.id; user_account.id                               | 1 application có 0..N vòng; actor tùy thao tác                 | 5.4     |
| interview.replaces_interview_id                                                       | interview.id                                                  | 0..1 lịch gốc; tối đa một thay thế PROPOSED                    | 5.4     |
| interview_participant.interview_id; user_id                                           | interview.id; user_account.id                                 | PK ghép; 1 candidate và ít nhất 1 interviewer bằng service     | 5.4     |
| interview_participant.attendance_recorded_by                                          | user_account.id                                               | Nullable trước ghi nhận, đúng recruiter khi ghi                | 5.4     |
| interview_reservation.interview_id, user_id                                           | interview_participant.interview_id, user_id                   | 0..1 reservation mỗi participant; CONFIRMED phải có đủ         | 5.4     |
| evaluation.interview_id, interviewer_id, participant_role                             | interview_participant.interview_id, user_id, participant_role | FK ghép, CHECK INTERVIEWER; UNIQUE lịch và interviewer         | 5.4     |
| notification.event_id; user_id                                                        | outbox_event.id; user_account.id                              | UNIQUE user/event; thông báo của một người nhận                | 5.5     |
| email_delivery.event_id; user_id                                                      | outbox_event.id; user_account.id                              | UNIQUE event/user/template; recipient snapshot                 | 5.5     |
| audit_log.actor_id; user_role.granted_by                                              | user_account.id                                               | Nullable cho hệ thống; không giả lập FK target đa hình         | 5.5     |
| idempotency_record.user_id                                                            | user_account.id                                               | UNIQUE user/operation/key                                      | 5.5     |
| outbox aggregate_id; audit entity_id; notification target_id; idempotency resource_id | Tham chiếu theo type và ID                                    | Không phải FK đa hình; service kiểm và reconciliation đối soát | 5.5     |

Sau migration, kiểm thử đọc pg_constraint/pg_indexes và chèn dữ liệu sai để đối chiếu từng quan hệ. Các ID đa hình không được vẽ như FK vật lý; chúng được kiểm bằng service, event schema và reconciliation. Điều kiện theo thời gian không được suy ra từ một đường nối ERD.


# CHƯƠNG 6 KIỂM CHỨNG VÀ KẾ HOẠCH KIỂM THỬ

## 6.1 Mức kiểm thử và fixture

Unit test kiểm policy, rules, mapper, service và cách xử lý lỗi; fake Clock giúp kiểm deadline chính xác. Integration dùng PostgreSQL thật cùng schema SQL để kiểm transaction, constraint, locking, lease và outbox; không thay bằng SQLite. API test khởi tạo global guards/pipes/filter như production. Contract test khóa DTO và event schema giữa module. E2E chạy toàn luồng với storage/mail test; provider video thật được nghiệm thu riêng. \[TL10\]

Fixture tối thiểu gồm hai doanh nghiệp được duyệt và một bị đình chỉ; OWNER, recruiter, interviewer, ứng viên của từng doanh nghiệp; tài khoản đa vai trò, khóa và chưa xác minh; tin DRAFT/PUBLISHED/CLOSED/hết hạn; CV READY/SCANNING/REJECTED/DELETE_PENDING; hồ sơ ở mọi trạng thái; lịch nối tiếp, giao nhau, thay thế và vắng mặt. Không dùng CV hay dữ liệu cá nhân thật trong repo/CI.

Mỗi test mutation phải kiểm response cùng state DB, số History/Outbox/reservation và quyền dữ liệu trả ra. Test lỗi giữa transaction phải chứng minh rollback. Test concurrent chạy nhiều connection với barrier; không gọi tuần tự rồi gọi đó là đồng thời. Không dùng sleep dài để chờ deadline, ưu tiên Clock hoặc cơ chế điều khiển test có phạm vi môi trường test.

## 6.2 Biên dữ liệu và bảng quyết định

| **Đầu vào**     | **Phân vùng hoặc giá trị**         | **Kết quả kiểm tra**                                                    |
|-----------------|------------------------------------|-------------------------------------------------------------------------|
| Tiêu đề         | 9,10,150,151 ký tự                 | 10–150 hợp lệ khi công bố                                               |
| Mô tả           | 99,100,10000,10001 ký tự           | 100–10000 hợp lệ; DRAFT cho thiếu                                       |
| Số lượng        | 0,1,100,101                        | 1–100 hợp lệ                                                            |
| CV byte         | 0,1,10485759,10485760,10485761     | Hàm size: \>0 và \<=10485760; upload còn cần PDF hợp lệ                 |
| Hạn nộp         | deadline−1ms,deadline,deadline+1ms | Chỉ trước deadline nhận                                                 |
| Thời lượng lịch | 14,15,120,121 phút                 | 15–120 được phép                                                        |
| Join            | start−10 phút±1ms; end+30 phút±1ms | Biên đầu bao gồm, biên cuối không bao gồm; token không vượt cuối cửa sổ |
| Version         | Hiện tại; cũ; thiếu; không nguyên  | Hiện tại mới cập nhật; cũ409; sai định dạng400                          |
| Điểm            | 0,1,5,6                            | Chỉ1–5                                                                  |
| Phân trang      | page 0/1; size 0/1/50/51           | Giới hạn hợp lệ; sort theo allowlist                                    |

| **Sở hữu** | **READY** | **Trạng thái**     | **Kết quả**                                  |
|------------|-----------|--------------------|----------------------------------------------|
| Không      | Bất kỳ    | Bất kỳ             | 404 nếu ngoài phạm vi đọc; không đổi dữ liệu |
| Có         | Không     | Bất kỳ             | 409; không tạo đề nghị                       |
| Có         | Có        | SUBMITTED          | Thay trực tiếp, History và Outbox            |
| Có         | Có        | SCREENING          | Một PENDING; duyệt mới thay CV               |
| Có         | Có        | SHORTLISTED trở đi | 409; giữ CV                                  |
| Có         | Có        | Version cũ         | 409; không History thành công                |

Bổ sung biên password theo UTF8 71/72/73 byte; lời mời đúng start_at; NO_SHOW tại end_at+30 phút; thời lượng chính xác 15/120 phút và lệch 1 ms; số CV ở 19/20; lương NULL một phần, 0, âm và min \> max; Unicode có ký tự tổ hợp trước/sau NFC; ngày không có offset; danh sách interviewer rỗng, lặp và chứa ứng viên.

## 6.3 Bộ ca kiểm thử nghiệp vụ nền

60 ca TC01 đến TC60 dưới đây được điều chỉnh theo các quyết định trong báo cáo này. TC19 phải duyệt toàn bộ cạnh của mục 3.2; TC43 mở rộng rút hồ sơ ở INTERVIEW_SCHEDULED và INTERVIEWED; TC46 kiểm không lùi trạng thái sau một vòng COMPLETED/NO_SHOW. Không dùng mô tả test làm bằng chứng đã chạy.

### Ca TC01 đến TC10

<table>
<colgroup>
<col style="width: 9%" />
<col style="width: 12%" />
<col style="width: 35%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và liên kết</strong></th>
<th><strong>Mức</strong></th>
<th><strong>Điều kiện và bước thực hiện</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>TC01<br />
FR03</td>
<td>API</td>
<td>Recruiter A công bố tin đủ trường, version mới</td>
<td>201/200; PUBLISHED; audit đúng actor; tìm công khai thấy tin</td>
</tr>
<tr class="even">
<td>TC02<br />
FR03</td>
<td>API</td>
<td>Công bố nháp thiếu mô tả hoặc minSalary &gt; maxSalary</td>
<td>400 fieldErrors; vẫn DRAFT; không audit thành công</td>
</tr>
<tr class="odd">
<td>TC03<br />
FR02, FR03</td>
<td>API quyền</td>
<td>Recruiter B sửa tin A bằng id trực tiếp</td>
<td>404; tin, version và audit của A không đổi</td>
</tr>
<tr class="even">
<td>TC04<br />
FR03, NFR05</td>
<td>Tích hợp</td>
<td>Hai request sửa tin dùng cùng version với barrier</td>
<td>Một thành công, một 409; version tăng một; dữ liệu không bị ghi đè</td>
</tr>
<tr class="odd">
<td>TC05<br />
FR05</td>
<td>Tích hợp</td>
<td>PDF cấu trúc hợp lệ đúng 10485760 byte; scanner sạch</td>
<td>READY; size/checksum đúng; tải về khớp checksum</td>
</tr>
<tr class="even">
<td>TC06<br />
FR05</td>
<td>API</td>
<td>Upload 0 byte và 10485761 byte</td>
<td>400/413 tương ứng; không READY; object bỏ dở được dọn</td>
</tr>
<tr class="odd">
<td>TC07<br />
FR05</td>
<td>Tích hợp</td>
<td>Tệp thực thi đổi đuôi .pdf và MIME giả</td>
<td>REJECTED; không cho ứng tuyển hoặc tải từ vùng READY</td>
</tr>
<tr class="even">
<td>TC08<br />
FR06</td>
<td>Đơn vị và API</td>
<td>Clock ở deadline−1 ms, CV READY sở hữu</td>
<td>201; Application trỏ đúng CV; History SUBMIT và Outbox tồn tại</td>
</tr>
<tr class="odd">
<td>TC09<br />
FR06, NFR05</td>
<td>Tích hợp</td>
<td>Hai request nộp cùng cặp ứng viên–tin đồng thời</td>
<td>Một Application; key khác trả 409 cho request thua; cùng key trả cùng id</td>
</tr>
<tr class="even">
<td>TC10<br />
FR05, FR07</td>
<td>Tích hợp</td>
<td>Nộp V1 rồi tải V2 và sửa profile</td>
<td>original/current vẫn V1 khi chưa làm UC06; checksum V1 và candidate_snapshot không đổi</td>
</tr>
</tbody>
</table>

### Ca TC11 đến TC20

<table>
<colgroup>
<col style="width: 9%" />
<col style="width: 12%" />
<col style="width: 35%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và liên kết</strong></th>
<th><strong>Mức</strong></th>
<th><strong>Điều kiện và bước thực hiện</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>TC11<br />
FR05, NFR04</td>
<td>API quyền</td>
<td>Ứng viên B dùng CV hoặc tải CV của A</td>
<td>404 cho CV ngoài scope; không URL; không truy cập nội dung qua storage</td>
</tr>
<tr class="even">
<td>TC12<br />
FR06, NFR05</td>
<td>Tích hợp</td>
<td>Đóng tin và nộp đồng thời; thêm trường hợp đúng deadline</td>
<td>Thứ tự khóa quyết định; đóng trước thì không nhận; đúng deadline luôn từ chối</td>
</tr>
<tr class="odd">
<td>TC13<br />
FR07</td>
<td>API</td>
<td>Thay CV khi SUBMITTED, SCREENING, SHORTLISTED</td>
<td>Lần lượt thay trực tiếp, tạo PENDING, 409; History chỉ khi thay thực</td>
</tr>
<tr class="even">
<td>TC14<br />
FR09</td>
<td>Đơn vị và API</td>
<td>Lịch 14,15,120,121 phút; lịch nối tiếp end=start</td>
<td>14/121 từ chối; 15/120 chấp nhận; nối tiếp không coi là trùng</td>
</tr>
<tr class="odd">
<td>TC15<br />
FR09, NFR05</td>
<td>Tích hợp</td>
<td>Hai lịch chồng nhau cùng interviewer, xác nhận đồng thời</td>
<td>Tối đa một CONFIRMED; request còn lại 409; không trạng thái hồ sơ giả</td>
</tr>
<tr class="even">
<td>TC16<br />
FR10</td>
<td>API</td>
<td>Kiểm start−10 phút và end+30 phút cùng các giá trị lệch 1 ms</td>
<td>Đầu cửa sổ được phép; đúng/cuối end+30 phút bị từ chối; TTL không vượt cuối cửa sổ</td>
</tr>
<tr class="odd">
<td>TC17<br />
FR10, NFR04</td>
<td>API quyền</td>
<td>Người ngoài gọi join bằng id lịch biết trước</td>
<td>404 cho người ngoài phạm vi đọc; adapter video không được gọi; không có token trong log</td>
</tr>
<tr class="even">
<td>TC18<br />
FR09, FR10</td>
<td>Tích hợp và nghiệm thu</td>
<td>Hủy lịch CONFIRMED rồi dùng URL/token phòng đã nhận</td>
<td>API join 409; provider chặn join mới/đóng phòng theo cấu hình thật</td>
</tr>
<tr class="odd">
<td>TC19<br />
FR08</td>
<td>Đơn vị và API</td>
<td>Thử toàn bộ cạnh hợp lệ và bị cấm tại mục 3.2, gồm rút lúc có lịch</td>
<td>Đúng actor/cạnh/điều kiện; cạnh cấm 409; trạng thái cuối không mở lại</td>
</tr>
<tr class="even">
<td>TC20<br />
FR11, NFR04</td>
<td>API quyền</td>
<td>Ứng viên đọc hồ sơ sau công bố kết quả có evaluation nội bộ</td>
<td>DTO chỉ có kết quả công khai; không điểm hoặc internal_note</td>
</tr>
</tbody>
</table>

### Ca TC21 đến TC30

<table>
<colgroup>
<col style="width: 9%" />
<col style="width: 12%" />
<col style="width: 35%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và liên kết</strong></th>
<th><strong>Mức</strong></th>
<th><strong>Điều kiện và bước thực hiện</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>TC21<br />
FR07, NFR05</td>
<td>Tích hợp</td>
<td>Duyệt thay CV đồng thời với chuyển SCREENING→SHORTLISTED</td>
<td>Theo khóa/version; không thay CV sau SHORTLISTED; PENDING được hủy khi rời SCREENING</td>
</tr>
<tr class="even">
<td>TC22<br />
FR05</td>
<td>Tích hợp lỗi</td>
<td>Upload xong nhưng DB lỗi hoặc S3 timeout sau tạo metadata</td>
<td>Không READY giả; retry tiếp tục cùng cv id; tác vụ dọn không xóa tệp đang tham chiếu</td>
</tr>
<tr class="odd">
<td>TC23<br />
FR05</td>
<td>Tích hợp lỗi</td>
<td>Scanner timeout rồi worker khởi động lại</td>
<td>Quarantine giữ nguyên; lease hết hạn retry; không cho ứng tuyển trước sạch</td>
</tr>
<tr class="even">
<td>TC24<br />
FR12, NFR08</td>
<td>Tích hợp lỗi</td>
<td>Email provider lỗi; xử lý lại cùng event nhiều lần</td>
<td>Application giữ; một notification/user/event; email_delivery không nhân bản; FAILED sau giới hạn</td>
</tr>
<tr class="odd">
<td>TC25<br />
FR04</td>
<td>API</td>
<td>Tìm theo kỹ năng, địa điểm và pageSize trên fixture cố định</td>
<td>Chỉ tin PUBLISHED còn hạn của APPROVED; tổng và thứ tự ổn định theo published_at,id</td>
</tr>
<tr class="even">
<td>TC26<br />
FR01, NFR04</td>
<td>API</td>
<td>Dùng lại token verify/reset; khóa user có session còn hạn</td>
<td>Token lần hai bị từ chối; session đã khóa không dùng tiếp được</td>
</tr>
<tr class="odd">
<td>TC27<br />
NFR07</td>
<td>Web E2E</td>
<td>Chạy luồng chính ở 360,768,1366 px bằng bàn phím</td>
<td>Không mất nút; focus hợp lý, label/lỗi đọc được; dialog không thoát focus</td>
</tr>
<tr class="even">
<td>TC28<br />
FR10, NFR09</td>
<td>Nghiệm thu</td>
<td>Jitsi thật với ứng viên, interviewer và người ngoài</td>
<td>Người hợp lệ vào; người ngoài bị chặn; ghi số lần và thời gian join</td>
</tr>
<tr class="odd">
<td>TC29<br />
NFR02</td>
<td>Hiệu năng</td>
<td>100 VU; warm-up 2 phút và steady 15 phút</td>
<td>p95 &lt;= 2 giây; lỗi ngoài 4xx hợp lệ &lt;1%; có log và cấu hình máy</td>
</tr>
<tr class="even">
<td>TC30<br />
NFR06</td>
<td>Khôi phục</td>
<td>Restore backup DB và object sang môi trường sạch</td>
<td>RPO/RTO đạt mục tiêu; mọi CV tham chiếu tồn tại, checksum đúng</td>
</tr>
</tbody>
</table>

### Ca TC31 đến TC40

<table>
<colgroup>
<col style="width: 9%" />
<col style="width: 12%" />
<col style="width: 35%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và liên kết</strong></th>
<th><strong>Mức</strong></th>
<th><strong>Điều kiện và bước thực hiện</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>TC31<br />
FR01</td>
<td>API</td>
<td>Email khác hoa/thường và khoảng trắng đăng ký đồng thời</td>
<td>Một tài khoản; UNIQUE email chuẩn hóa; không cấp ADMIN từ body</td>
</tr>
<tr class="even">
<td>TC32<br />
FR01</td>
<td>API bảo mật</td>
<td>POST bằng session nhưng thiếu/sai CSRF hoặc Origin lạ</td>
<td>403; không thay dữ liệu; CORS không cho origin lạ</td>
</tr>
<tr class="odd">
<td>TC33<br />
FR01</td>
<td>API</td>
<td>Đăng nhập sai liên tục theo giới hạn cấu hình</td>
<td>429 sau ngưỡng; thông báo chung; không log password</td>
</tr>
<tr class="even">
<td>TC34<br />
FR01</td>
<td>Tích hợp</td>
<td>Reset mật khẩu thành công rồi dùng cookie phiên cũ</td>
<td>Phiên cũ hết hiệu lực; mật khẩu mới đúng; token reset consumed</td>
</tr>
<tr class="odd">
<td>TC35<br />
FR02</td>
<td>Tích hợp</td>
<td>Tạo company lỗi giữa insert company và owner</td>
<td>Rollback cả hai; không có company không owner</td>
</tr>
<tr class="even">
<td>TC36<br />
FR02</td>
<td>API quyền</td>
<td>OWNER thường thử bỏ OWNER cuối; recruiter thường sửa company B</td>
<td>OWNER cuối bị chặn 409; thiếu quyền hành động 403; company ngoài scope 404; không audit thành công</td>
</tr>
<tr class="odd">
<td>TC37<br />
FR05</td>
<td>Tích hợp</td>
<td>19 CV đang giữ, hai upload-init đồng thời</td>
<td>Chỉ một được tạo thành phiên bản thứ 20; request kia 409</td>
</tr>
<tr class="even">
<td>TC38<br />
FR05</td>
<td>Tích hợp</td>
<td>Xóa CV có tham chiếu Application/History/ChangeRequest</td>
<td>409 và FK bảo vệ; object/checksum giữ nguyên</td>
</tr>
<tr class="odd">
<td>TC39<br />
FR05</td>
<td>API</td>
<td>PDF mật khẩu và PDF chữ ký đúng nhưng cấu trúc lỗi</td>
<td>REJECTED với mã lý do an toàn; không READY</td>
</tr>
<tr class="even">
<td>TC40<br />
FR07</td>
<td>Tích hợp</td>
<td>Hai đề nghị CV PENDING cùng application đồng thời</td>
<td>Chỉ một PENDING nhờ partial unique index</td>
</tr>
</tbody>
</table>

### Ca TC41 đến TC50

<table>
<colgroup>
<col style="width: 9%" />
<col style="width: 12%" />
<col style="width: 35%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và liên kết</strong></th>
<th><strong>Mức</strong></th>
<th><strong>Điều kiện và bước thực hiện</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>TC41<br />
FR06</td>
<td>API</td>
<td>Cùng Idempotency-Key nhưng payload/CV khác</td>
<td>409 IDEMPOTENCY_CONFLICT; hồ sơ gốc không đổi</td>
</tr>
<tr class="even">
<td>TC42<br />
FR06</td>
<td>Tích hợp</td>
<td>Application insert thành công rồi cố ý lỗi History/Outbox</td>
<td>Rollback cả transaction; không Application mồ côi</td>
</tr>
<tr class="odd">
<td>TC43<br />
FR08</td>
<td>API</td>
<td>Rút ở mọi trạng thái chưa kết thúc, gồm INTERVIEW_SCHEDULED/INTERVIEWED; sau đó nộp lại</td>
<td>WITHDRAWN đúng History; lịch mở bị hủy/slot release; không nộp lại cùng tin</td>
</tr>
<tr class="even">
<td>TC44<br />
FR09</td>
<td>API</td>
<td>Participant thứ nhất ACCEPTED nhưng người khác PENDING</td>
<td>Lịch vẫn PROPOSED; chưa INTERVIEW_SCHEDULED</td>
</tr>
<tr class="odd">
<td>TC45<br />
FR09</td>
<td>API quyền</td>
<td>Đặt lịch với interviewer company B, candidate trùng interviewer hoặc thiếu candidate</td>
<td>Từ chối 400/409; không lộ thông tin company B và không tạo participant sai</td>
</tr>
<tr class="even">
<td>TC46<br />
FR09</td>
<td>Tích hợp</td>
<td>Hủy một lịch khi còn CONFIRMED khác; hủy cuối trước/sau đã có COMPLETED/NO_SHOW</td>
<td>Còn CONFIRMED giữ giai đoạn; chỉ về SHORTLISTED nếu chưa có COMPLETED/NO_SHOW</td>
</tr>
<tr class="odd">
<td>TC47<br />
FR11</td>
<td>API quyền</td>
<td>Ứng viên ghi phiếu; interviewer không phân công ghi phiếu</td>
<td>403/404 theo phạm vi; FK participant_role chặn tạo phiếu candidate qua SQL</td>
</tr>
<tr class="even">
<td>TC48<br />
FR11</td>
<td>API</td>
<td>Điểm 0,1,5,6; gửi hai phiếu cùng cặp; version cũ</td>
<td>1/5 hợp lệ; 0/6 trả 400; một phiếu; version cũ 409</td>
</tr>
<tr class="odd">
<td>TC49<br />
FR11</td>
<td>API</td>
<td>Hoàn tất khi thiếu attendance/phiếu, còn PROPOSED/CONFIRMED hoặc chỉ có NO_SHOW</td>
<td>409; đủ điều kiện BR14 mới COMPLETED/INTERVIEWED; không tạo phiếu giả</td>
</tr>
<tr class="even">
<td>TC50<br />
FR11</td>
<td>Tích hợp</td>
<td>Công bố kết quả và retry cùng thao tác</td>
<td>Một lần công bố có History/Outbox; không lộ note trong thông báo/email</td>
</tr>
</tbody>
</table>

### Ca TC51 đến TC60

<table>
<colgroup>
<col style="width: 9%" />
<col style="width: 12%" />
<col style="width: 35%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và liên kết</strong></th>
<th><strong>Mức</strong></th>
<th><strong>Điều kiện và bước thực hiện</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>TC51<br />
FR12</td>
<td>API quyền</td>
<td>User B đánh dấu đọc notification của A</td>
<td>404; read_at của A không đổi</td>
</tr>
<tr class="even">
<td>TC52<br />
FR13</td>
<td>API</td>
<td>Lưu cùng tin hai lần và bỏ lưu hai lần</td>
<td>Một saved_job; DELETE lặp 204; dữ liệu user khác không đổi</td>
</tr>
<tr class="odd">
<td>TC53<br />
FR14</td>
<td>API</td>
<td>Fixture có cohort 10 hồ sơ, 4 từng SHORTLISTED, 0 HIRED</td>
<td>Tỷ lệ shortlist 40%, hire 0%; mẫu số0 hiển thị không có dữ liệu</td>
</tr>
<tr class="even">
<td>TC54<br />
FR14</td>
<td>API quyền</td>
<td>Recruiter A đổi company_id sang B; khoảng ngày đảo</td>
<td>404 cho company ngoài scope; 400 cho khoảng ngày sai</td>
</tr>
<tr class="odd">
<td>TC55<br />
FR15</td>
<td>API quyền</td>
<td>ADMIN gọi download CV khi không có quyền nghiệp vụ</td>
<td>404 cho CV ngoài phạm vi nghiệp vụ; không URL; admin vẫn xem audit đã làm sạch</td>
</tr>
<tr class="even">
<td>TC56<br />
FR15</td>
<td>Tích hợp</td>
<td>Đình chỉ company có tin đang PUBLISHED</td>
<td>Dừng nhận hồ sơ/tải CV/join/mutation; dữ liệu giữ; event thu hồi và audit đúng</td>
</tr>
<tr class="odd">
<td>TC57<br />
NFR04</td>
<td>Bảo mật</td>
<td>Chuỗi XSS trong tên/tin/ghi chú và SQL injection trong tìm kiếm</td>
<td>UI escape/sanitize; SQL parameterized; không thực thi script hoặc đổi dữ liệu</td>
</tr>
<tr class="even">
<td>TC58<br />
NFR08</td>
<td>Tích hợp worker</td>
<td>Worker chết sau claim hoặc gửi email trước đánh dấu SENT</td>
<td>Lease hết hạn cho retry; notification chống trùng; ghi nhận giới hạn exactly-once email</td>
</tr>
<tr class="odd">
<td>TC59<br />
NFR04</td>
<td>API</td>
<td>URL CV hết hạn và user bị thu hồi quyền rồi xin URL mới</td>
<td>URL hết hạn bị storage từ chối; xin URL mới ngoài scope trả 404; URL cũ có thể tồn tại đến TTL</td>
</tr>
<tr class="even">
<td>TC60<br />
NFR10</td>
<td>CI kiểm chứng</td>
<td>Bỏ integration tests, đặt test.only, hạ coverage, gây assertion fail</td>
<td>Mỗi tình huống làm quality-gate đỏ; artifact cho biết nguyên nhân</td>
</tr>
</tbody>
</table>

## 6.4 Ca kiểm thử bổ sung cho ngoại lệ và cạnh tranh

### Ca EC01 đến EC10

<table>
<colgroup>
<col style="width: 12%" />
<col style="width: 33%" />
<col style="width: 45%" />
<col style="width: 8%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và UC</strong></th>
<th><strong>Tình huống</strong></th>
<th><strong>Kết quả và bất biến</strong></th>
<th><strong>Chủ trì</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>EC01<br />
UC02 UC06</td>
<td>Nộp V1 rồi thay V2 và sửa profile</td>
<td>original giữ V1; current là V2; snapshot liên hệ giữ lúc nộp; history old/new đúng<br />
INV02 INV03</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>EC02<br />
UC06</td>
<td>INSERT current/new/old CV của candidate khác qua SQL</td>
<td>FK ghép từ application/history/change_request đều chặn; không chỉ API<br />
INV02</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>EC03<br />
UC06</td>
<td>Upload hai attempt cùng CV và worker cũ finalize muộn</td>
<td>Một attempt thắng; READY và checksum trỏ đúng object version; object cũ được reconcile<br />
BR06 BR07</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>EC04<br />
UC06</td>
<td>Approve PENDING với base CV cũ hoặc requestVersion cũ</td>
<td>409; không đổi current và không event thành công<br />
BR08</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>EC05<br />
UC06 UC07</td>
<td>Approve đồng thời với SHORTLISTED hoặc withdraw</td>
<td>Một kết quả hợp lệ theo khóa/version; không có thay CV sau đóng quyền; pending được xử lý<br />
BR08 BR09</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>EC06<br />
UC06</td>
<td>20 CV gồm rejected/scanning/delete_pending rồi upload-init</td>
<td>409 quota; chỉ DELETED mới giải phóng slot<br />
BR06</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>EC07<br />
UC06</td>
<td>Xóa logic CV đồng thời với submit/thay CV</td>
<td>Không có hồ sơ trỏ DELETE_PENDING/DELETED; object cần thiết còn tồn tại<br />
INV02 BR07</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>EC08<br />
UC07 UC09</td>
<td>Gọi status để REJECTED không message hoặc insert trạng thái cuối thiếu published_at</td>
<td>Service và DB chặn; chỉ result command ghi đủ điều kiện<br />
INV09</td>
<td>BE2 BE3</td>
</tr>
<tr class="odd">
<td>EC09<br />
UC07 UC09</td>
<td>Withdraw đồng thời publish result, cùng expectedVersion</td>
<td>Một commit; không có WITHDRAWN kèm kết quả cuối hoặc email quyết định giả<br />
BR09</td>
<td>BE2 BE3</td>
</tr>
<tr class="even">
<td>EC10<br />
UC08</td>
<td>Phản hồi ACCEPT cuối gặp lịch trùng</td>
<td>Rollback response cuối về PENDING; lịch còn PROPOSED; không reservation thừa<br />
BR10</td>
<td>BE3</td>
</tr>
</tbody>
</table>

### Ca EC11 đến EC20

<table>
<colgroup>
<col style="width: 12%" />
<col style="width: 33%" />
<col style="width: 45%" />
<col style="width: 8%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và UC</strong></th>
<th><strong>Tình huống</strong></th>
<th><strong>Kết quả và bất biến</strong></th>
<th><strong>Chủ trì</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>EC11<br />
UC08</td>
<td>Lịch thay thế bị DECLINED EXPIRED hoặc confirm lỗi giữa transaction</td>
<td>Lịch cũ CONFIRMED và slot cũ còn nguyên; proposal kết thúc không hủy cũ<br />
BR11</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EC12<br />
UC08</td>
<td>Hai request khác company cùng user xác nhận thời gian giao nhau</td>
<td>Chỉ một có reservation active; exclusion chặn bên kia; không lộ lịch riêng<br />
INV07</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>EC13<br />
UC08</td>
<td>Fault injection sau release slot cũ trước insert slot mới khi reschedule</td>
<td>Rollback cả lịch cũ mới/response/slot/history/outbox; slot cũ vẫn giữ<br />
INV08 BR11</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EC14<br />
UC13</td>
<td>Hoàn tất lịch cuối rồi đọc application trước mark-interviewed</td>
<td>Giữ INTERVIEW_SCHEDULED; đủ điều kiện mới sang INTERVIEWED; không lùi SHORTLISTED<br />
BR14</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>EC15<br />
UC13</td>
<td>Ứng viên vắng; thử NO_SHOW ngay trước và đúng end+30 phút</td>
<td>Trước mốc 409; đúng mốc hợp lệ có reason; không cần phiếu giả; không tự INTERVIEWED<br />
BR14</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EC16<br />
UC03 UC08</td>
<td>Token cấp sát cuối cửa sổ; dùng token cũ sau cancel</td>
<td>Expiry không vượt end+30; join mới bị provider chặn; đóng kết nối theo mục tiêu 60 giây<br />
BR12</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>EC17<br />
UC08 UC11</td>
<td>Candidate trùng interviewer; thêm membership cho candidate có hồ sơ mở; phân công người sai company</td>
<td>Từ chối xung đột; không có participant hoặc quyền sai; owner/recruiter có role INTERVIEWER được phân công hợp lệ<br />
BR05 BR10</td>
<td>BE1 BE3</td>
</tr>
<tr class="even">
<td>EC18<br />
UC13</td>
<td>INSERT evaluation trỏ participant CANDIDATE; điểm lẻ hoặc 0/6</td>
<td>FK role và CHECK chặn SQL sai; API chặn điểm không nguyên<br />
INV06</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>EC19<br />
UC04</td>
<td>Hai request reset cùng token; token VERIFY gửi vào reset</td>
<td>Chỉ một reset commit; sai purpose không đổi mật khẩu; sessions cũ bị thu hồi<br />
BR15</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>EC20<br />
UC04</td>
<td>Resend rồi worker gửi token cũ; password UTF8 72/73 byte</td>
<td>Token cũ bị bỏ gửi hoặc không còn dùng; 72 byte hợp lệ nếu đủ độ dài, 73 bị chặn<br />
BR15</td>
<td>BE1</td>
</tr>
</tbody>
</table>

### Ca EC21 đến EC30

<table>
<colgroup>
<col style="width: 12%" />
<col style="width: 33%" />
<col style="width: 45%" />
<col style="width: 8%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và UC</strong></th>
<th><strong>Tình huống</strong></th>
<th><strong>Kết quả và bất biến</strong></th>
<th><strong>Chủ trì</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>EC21<br />
UC10 UC11</td>
<td>Hai OWNER cùng rời; ADMIN khóa OWNER cuối</td>
<td>Rời thường còn một OWNER; khóa an ninh có hiệu lực, chặn vận hành và có recovery có audit<br />
INV11</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>EC22<br />
UC11 UC08</td>
<td>Thu hồi membership đồng thời confirm proposal chứa user đó</td>
<td>Không có lịch mới CONFIRMED với membership vô hiệu; revoke thường buộc xử lý proposal/lịch<br />
BR01 BR15</td>
<td>BE1 BE3</td>
</tr>
<tr class="odd">
<td>EC23<br />
UC04 UC10</td>
<td>Khóa user đồng thời login/verify/reset; reset đồng thời login bằng hash cũ; hai ADMIN khóa nhau</td>
<td>Không có phiên mới dùng hash cũ sau reset hoặc cho LOCKED; vẫn còn ít nhất một ADMIN khả dụng<br />
BR15</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>EC24<br />
UC03 UC10</td>
<td>Đình chỉ công ty có phòng đang hoạt động</td>
<td>Join mới bị chặn; event thu hồi; quá 60 giây cảnh báo; dữ liệu cũ giữ<br />
BR12 BR16</td>
<td>BE1 BE3</td>
</tr>
<tr class="odd">
<td>EC25<br />
UC15</td>
<td>Worker A hết lease; B claim; A ack bằng lease_token cũ</td>
<td>A update 0 dòng; B giữ quyền task; không notification/email record trùng<br />
INV12</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EC26<br />
UC15</td>
<td>SMTP nhận mail rồi worker chết trước ghi SENT</td>
<td>Có thể gửi lại nếu SMTP không hỗ trợ idempotency; một delivery row; giới hạn được ghi đúng<br />
BR17</td>
<td>BE3</td>
</tr>
<tr class="odd">
<td>EC27<br />
UC09 UC13 UC15</td>
<td>Cố đưa điểm/note vào candidate history hoặc notification template</td>
<td>DTO và event/template kiểm không có internal_note/score/recommendation; recruiter vẫn có quyền đúng<br />
BR13 BR17</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EC28<br />
UC06</td>
<td>Scanner timeout sáu lượt hoặc trả kết quả không xác định</td>
<td>Không READY; hết retry là TECHNICAL_FAILURE; không ghi nhầm MALWARE<br />
BR06</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>EC29<br />
UC02 UC10</td>
<td>Submit đồng thời suspend company hoặc job close</td>
<td>Bên giữ khóa và kiểm điều kiện trước quyết định kết quả; sau suspend/close không có nhận hồ sơ mới<br />
BR02 BR16</td>
<td>BE1 BE2</td>
</tr>
<tr class="even">
<td>EC30<br />
UC06</td>
<td>Giữ URL CV trước revoke membership rồi truy cập trong/sau TTL</td>
<td>Hành vi đúng giới hạn TTL đã công bố; cấp URL mới bị chặn; không tuyên bố thu hồi tức thì<br />
BR01 mục 4.6</td>
<td>BE2</td>
</tr>
</tbody>
</table>

### Ca EC31 đến EC40

<table>
<colgroup>
<col style="width: 12%" />
<col style="width: 33%" />
<col style="width: 45%" />
<col style="width: 8%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và UC</strong></th>
<th><strong>Tình huống</strong></th>
<th><strong>Kết quả và bất biến</strong></th>
<th><strong>Chủ trì</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>EC31<br />
UC06</td>
<td>Object copy thành công nhưng DB commit thất bại; object READY bị thiếu khi restore</td>
<td>Không READY giả; reconciliation báo lỗi/khôi phục đúng version; không mất CV có tham chiếu<br />
BR07 NFR06</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>EC32<br />
UC07 UC10</td>
<td>UPDATE DELETE trực tiếp history/audit bằng DB runtime role</td>
<td>Bị chặn bởi privilege/trigger; mutation nghiệp vụ đúng vẫn thêm được lịch sử<br />
INV10</td>
<td>BE2 BE3</td>
</tr>
<tr class="odd">
<td>EC33<br />
UC07 UC08</td>
<td>Rút khi có nhiều proposal và confirmed; provider timeout</td>
<td>WITHDRAWN không lịch mở/reservation; DB revoke pending; retry provider không mở lại hồ sơ<br />
BR09 BR12</td>
<td>BE2 BE3</td>
</tr>
<tr class="even">
<td>EC34<br />
UC05 UC14</td>
<td>Tin saved thuộc company bị suspend; đoán ID draft/private</td>
<td>Không lộ nội dung qua saved list/detail/total; 404 đúng quy ước<br />
BR01 BR16</td>
<td>BE1 BE2</td>
</tr>
<tr class="odd">
<td>EC35<br />
UC16</td>
<td>Cohort 0; application quay lại trạng thái; nhiều skill và evaluations</td>
<td>rate NULL khi 0; mỗi application đếm một lần/mốc; [from,to) và asOf đúng<br />
BR19</td>
<td>BE3</td>
</tr>
<tr class="even">
<td>EC36<br />
UC12</td>
<td>Hai tab profile version cũ và chuỗi tổ hợp Unicode</td>
<td>Một mutation đúng version; NFC và độ dài nhất quán; snapshot hồ sơ cũ không đổi<br />
BR18</td>
<td>BE2</td>
</tr>
<tr class="odd">
<td>EC37<br />
UC01</td>
<td>salary NULL một phần, currency rỗng, min âm hoặc min&gt;max; headcount đã đủ người HIRED</td>
<td>Invalid salary bị API/DB chặn; headcount không vô tình thành hard cap<br />
BR03</td>
<td>BE1</td>
</tr>
<tr class="even">
<td>EC38<br />
UC01 UC05</td>
<td>Request chờ khóa đến đúng deadline; datetime thiếu offset; keyword cực dài</td>
<td>DB clock sau khóa từ chối đúng hạn; ngày/search sai 400, không truy vấn nặng<br />
BR02 BR18</td>
<td>BE1 BE2</td>
</tr>
<tr class="odd">
<td>EC39<br />
UC02 UC06</td>
<td>Cùng key khác payload; retry sau revoke quyền hoặc hết retention</td>
<td>Khác payload 409; mất quyền không phát lại dữ liệu; UNIQUE nghiệp vụ còn bảo vệ sau 24 giờ<br />
BR17 mục 4.5</td>
<td>BE2</td>
</tr>
<tr class="even">
<td>EC40<br />
UC02 UC08 UC09</td>
<td>Lỗi event/history hoặc serialization trong transaction liên module</td>
<td>Rollback toàn bộ bằng cùng tx; retry có giới hạn không lặp tác dụng phụ ngoài DB<br />
NFR05 NFR08</td>
<td>BE2 BE3</td>
</tr>
</tbody>
</table>

Các ca EC bổ sung vừa kiểm logic vừa kiểm dữ liệu lưu thực tế. Ví dụ EC12 chỉ đạt khi hai transaction chồng nhau và DB còn đúng một lịch chiếm slot; EC25 chỉ đạt khi worker cũ không thể ack bằng lease_token cũ. Mỗi PR liên quan phải dẫn mã TC/EC và đính artifact đúng commit.

## 6.5 Truy vết yêu cầu và trách nhiệm kiểm thử

| **Yêu cầu** | **Use case** | **Ca kiểm thử**                                    |
|-------------|--------------|----------------------------------------------------|
| FR01        | UC04         | TC26,TC31–TC34; FE08–FE12                          |
| FR02        | UC10, UC11   | TC03,TC35,TC36,TC56; FE26,FE39                     |
| FR03        | UC01         | TC01–TC04; FE27–FE29                               |
| FR04        | UC05         | TC25; FE01–FE06                                    |
| FR05        | UC06, UC12   | TC05–TC07,TC10,TC11,TC22,TC23,TC37–TC39; FE13–FE16 |
| FR06        | UC02         | TC08,TC09,TC12,TC41,TC42; FE17                     |
| FR07        | UC06         | TC13,TC21,TC40; FE19,FE31                          |
| FR08        | UC07         | TC19,TC43; FE18,FE20,FE32                          |
| FR09        | UC08         | TC14,TC15,TC18,TC44–TC46; FE23,FE34                |
| FR10        | UC03         | TC16–TC18,TC28; FE24,FE25                          |
| FR11        | UC09, UC13   | TC20,TC47–TC50; FE21,FE33,FE35,FE36                |
| FR12        | UC09, UC15   | TC24,TC51,TC58; FE37                               |
| FR13        | UC07, UC14   | TC43,TC52; FE07,FE22                               |
| FR14        | UC16         | TC53,TC54; FE38                                    |
| FR15        | UC10         | TC55,TC56; FE39–FE41                               |

| **NFR** | **Bằng chứng liên kết**                                 |
|---------|---------------------------------------------------------|
| NFR01   | TC05,TC29; seed100000 metadata; biên bản dung lượng kho |
| NFR02   | TC29; k6 summary và raw metrics theo commit             |
| NFR03   | TC05–TC07,TC22,TC23; 30 phép đo upload/quét             |
| NFR04   | TC03,TC11,TC16–TC18,TC20,TC26,TC32,TC55,TC57,TC59       |
| NFR05   | TC04,TC09,TC12,TC15,TC21,TC37,TC40,TC42                 |
| NFR06   | TC30; backup timestamp và thời điểm restore             |
| NFR07   | TC27 và toàn bộ FE; screenshot, axe, bàn phím           |
| NFR08   | TC22–TC24,TC58; log retry/lease và invariant DB         |
| NFR09   | TC28; 30 phiên Jitsi thật và thời gian join             |
| NFR10   | TC60; JUnit XML, coverage, gate và sổ lỗi               |

Ma trận EC tại mục 6.4 bổ sung cột UC, ràng buộc và người chịu trách nhiệm; kết hợp với hai bảng trên để truy vết đến người làm. Mọi FR bắt buộc phải có test thành công, lỗi dữ liệu, quyền và sai trạng thái. Không còn lỗi Critical/High mở khi nghiệm thu; lỗi khác ghi ảnh hưởng và quyết định xử lý trong biên bản.

## 6.6 Hiệu năng phục hồi và bằng chứng nghiệm thu

**Đo k6 theo NFR02:** warmup 2 phút, 100 VU trong 15 phút, fixture 10000 tin/100000 metadata, máy 4 vCPU/8 GiB/SSD; p95≤2 giây và lỗi ngoài 4xx hợp lệ \<1%. Lưu raw metrics, endpoint mix, DB pool, CPU/RAM, query plan và outbox lag; không loại 5xx khỏi mẫu.

Upload/quét đo riêng 30 lần theo NFR03. Video thật cần ít nhất 29/30 phiên join trong 10 giây, nêu giới hạn cỡ mẫu; kiểm người ngoài, token cũ, hủy lịch, thu hồi membership và đóng kết nối đang có.

Backup DB hằng ngày và object versioning; restore sang môi trường sạch, kiểm CV đúng storage_version_id/checksum và luồng tải; RPO≤24 giờ, RTO≤4 giờ. Reconciliation báo object thiếu, reservation sai và lease kẹt; không xóa CV tham chiếu để che lỗi.


### 7.2.5 Ma trận kiểm thử giao diện

Các ca FE01–FE42 là kế hoạch kiểm thử phải được gắn vào PR và bằng chứng đúng commit. Chủ sở hữu màn hình tự viết test mức component/integration và phối hợp E2E; số ca hay wireframe chưa phải bằng chứng đã thực thi.

<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 37%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và màn hình</strong></th>
<th><strong>UC</strong></th>
<th><strong>Thao tác</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>FE01<br />
UI01</td>
<td>UC05</td>
<td>Đổi từ khóa và địa điểm rồi tìm</td>
<td>URL chứa filter; danh sách khớp fixture, không còn kết quả query trước</td>
</tr>
<tr class="even">
<td>FE02<br />
UI01</td>
<td>UC05</td>
<td>Đổi bộ lọc khi đang trang 3</td>
<td>Trang về 1; back/forward khôi phục filter và trang đúng</td>
</tr>
<tr class="odd">
<td>FE03<br />
UI01</td>
<td>UC05</td>
<td>API trả rỗng rồi lỗi500</td>
<td>Rỗng có Xóa lọc; lỗi có Thử lại; không giả danh sách rỗng</td>
</tr>
<tr class="even">
<td>FE04<br />
UI01</td>
<td>UC05</td>
<td>Tab qua bộ lọc ở360 px</td>
<td>Có label, thứ tự focus đúng; không che nút Tìm</td>
</tr>
<tr class="odd">
<td>FE05<br />
UI02</td>
<td>UC02</td>
<td>Khách chọn Ứng tuyển rồi đăng nhập</td>
<td>Quay lại đúng URL nội bộ; không open redirect</td>
</tr>
<tr class="even">
<td>FE06<br />
UI02</td>
<td>UC02</td>
<td>Tin hết hạn trong lúc đang mở trang</td>
<td>POST 409 có giải thích; không hiện ứng tuyển thành công</td>
</tr>
<tr class="odd">
<td>FE07<br />
UI02</td>
<td>UC14</td>
<td>Lưu và bỏ lưu tin nhiều lần</td>
<td>Biểu tượng phản ánh server; chỉ một bản ghi</td>
</tr>
<tr class="even">
<td>FE08<br />
UI03</td>
<td>UC04</td>
<td>Email sai, password không khớp và body role ADMIN</td>
<td>Lỗi cạnh trường; backend không cấp ADMIN</td>
</tr>
<tr class="odd">
<td>FE09<br />
UI04</td>
<td>UC04</td>
<td>Sai login rồi đúng login</td>
<td>Thông báo chung; phiên tạo thành công; không lưu token localStorage</td>
</tr>
<tr class="even">
<td>FE10<br />
UI04</td>
<td>UC04</td>
<td>Double click login và session hết hạn khi mở trang bảo vệ</td>
<td>Nút có loading; về login với returnTo hợp lệ</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 37%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và màn hình</strong></th>
<th><strong>UC</strong></th>
<th><strong>Thao tác</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>FE11<br />
UI05</td>
<td>UC04</td>
<td>Token hết hạn/đã dùng và gửi lại</td>
<td>Hướng dẫn rõ; nút gửi lại có cooldown</td>
</tr>
<tr class="even">
<td>FE12<br />
UI06</td>
<td>UC04</td>
<td>Yêu cầu reset cho email có/không tồn tại</td>
<td>Cùng thông báo; reset thành công yêu cầu đăng nhập lại</td>
</tr>
<tr class="odd">
<td>FE13<br />
UI07</td>
<td>UC12</td>
<td>Sửa profile, API 409, sau đó quay lại</td>
<td>Nội dung nhập giữ; không tự ghi đè; cảnh báo rời trang</td>
</tr>
<tr class="even">
<td>FE14<br />
UI08</td>
<td>UC06</td>
<td>Upload PDF hợp lệ rồi quét chậm</td>
<td>Có tiến trình upload riêng; hiển thị SCANNING, chưa cho chọn ứng tuyển</td>
</tr>
<tr class="odd">
<td>FE15<br />
UI08</td>
<td>UC06</td>
<td>Chọn tệp quá cỡ, sai loại, PDF mật khẩu</td>
<td>Lỗi cụ thể; server vẫn kiểm tra dù bỏ qua frontend</td>
</tr>
<tr class="even">
<td>FE16<br />
UI08</td>
<td>UC06</td>
<td>Xóa CV đang tham chiếu và CV không tham chiếu</td>
<td>CV bị giữ có lý do; CV xóa được biến mất khỏi danh sách đang giữ</td>
</tr>
<tr class="odd">
<td>FE17<br />
UI09</td>
<td>UC02</td>
<td>Mở dialog, chọn V2, double click gửi, mất mạng rồi retry</td>
<td>Focus trap; cùng key cho retry; chỉ một hồ sơ trỏ V2</td>
</tr>
<tr class="even">
<td>FE18<br />
UI10</td>
<td>UC07</td>
<td>Lọc trạng thái và mở hồ sơ</td>
<td>Chỉ hồ sơ chính mình; quay lại giữ filter</td>
</tr>
<tr class="odd">
<td>FE19<br />
UI11</td>
<td>UC06</td>
<td>Thay CV lần lượt ở SUBMITTED, SCREENING, SHORTLISTED</td>
<td>UI hiển thị Thay, Đề nghị, Không cho thay phù hợp; API kiểm tra lại</td>
</tr>
<tr class="even">
<td>FE20<br />
UI11</td>
<td>UC07</td>
<td>Hủy rồi xác nhận Rút hồ sơ</td>
<td>Hủy không gọi mutation; xác nhận WITHDRAWN và không cho nộp lại</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 37%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và màn hình</strong></th>
<th><strong>UC</strong></th>
<th><strong>Thao tác</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>FE21<br />
UI11</td>
<td>UC09</td>
<td>Xem kết quả trước/sau công bố</td>
<td>Chỉ hiện kết quả sau công bố; DOM/network không có internal_note</td>
</tr>
<tr class="even">
<td>FE22<br />
UI12</td>
<td>UC14</td>
<td>Tin đã lưu chuyển CLOSED</td>
<td>Nhãn đóng; không có thao tác ứng tuyển hợp lệ</td>
</tr>
<tr class="odd">
<td>FE23<br />
UI13</td>
<td>UC08</td>
<td>Một participant ACCEPTED, người còn lại PENDING</td>
<td>UI ghi chờ xác nhận toàn lịch; không hiển thị CONFIRMED</td>
</tr>
<tr class="even">
<td>FE24<br />
UI14</td>
<td>UC03</td>
<td>Dùng giờ server giả lập ở hai biên join</td>
<td>Nút và thông báo đúng; API vẫn là quyết định cuối</td>
</tr>
<tr class="odd">
<td>FE25<br />
UI15</td>
<td>UC03</td>
<td>Mock Jitsi lỗi, bị từ chối thiết bị và rời phòng</td>
<td>Có retry/hướng dẫn; rời không tự đổi INTERVIEWED</td>
</tr>
<tr class="even">
<td>FE26<br />
UI16</td>
<td>UC11</td>
<td>Company PENDING; thử bỏ owner cuối</td>
<td>Khóa công bố; thông báo không bỏ owner cuối</td>
</tr>
<tr class="odd">
<td>FE27<br />
UI17</td>
<td>UC01</td>
<td>Đóng tin và quay về danh sách</td>
<td>Trạng thái và nút đúng; không có mở lại CLOSED</td>
</tr>
<tr class="even">
<td>FE28<br />
UI18</td>
<td>UC01</td>
<td>Lưu nháp thiếu trường rồi công bố</td>
<td>Nháp lưu được; công bố báo đủ trường còn thiếu</td>
</tr>
<tr class="odd">
<td>FE29<br />
UI18</td>
<td>UC01</td>
<td>Deadline theo giờ Việt Nam, lương min&gt;max, response 409</td>
<td>UTC gửi đúng; lỗi theo trường; giữ nội dung khi conflict</td>
</tr>
<tr class="even">
<td>FE30<br />
UI19</td>
<td>UC07</td>
<td>Đổi company và lọc hồ sơ</td>
<td>Xóa cache sai phạm vi; không flash dữ liệu company trước</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 37%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và màn hình</strong></th>
<th><strong>UC</strong></th>
<th><strong>Thao tác</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>FE31<br />
UI20</td>
<td>UC06</td>
<td>Duyệt đề nghị CV rồi tải lại</td>
<td>Phiên bản mới và History đúng; không tải CV mới nhất tùy ý</td>
</tr>
<tr class="even">
<td>FE32<br />
UI20</td>
<td>UC07</td>
<td>Chuyển trạng thái với version cũ</td>
<td>Hiển thị409 và yêu cầu tải lại; không đổi UI thành công giả</td>
</tr>
<tr class="odd">
<td>FE33<br />
UI20</td>
<td>UC09</td>
<td>Xem ghi chú nội bộ bằng recruiter và candidate</td>
<td>Recruiter có quyền thấy; candidate không nhận trong payload</td>
</tr>
<tr class="even">
<td>FE34<br />
UI21</td>
<td>UC08</td>
<td>Nhập lịch14/121 phút và trùng giờ</td>
<td>Lỗi thời lượng; server 409 overlap; form giữ giờ để sửa</td>
</tr>
<tr class="odd">
<td>FE35<br />
UI22</td>
<td>UC13</td>
<td>Nhập điểm ngoài1–5 và mở sau công bố</td>
<td>Chỉ điểm nguyên 1–5; lịch COMPLETED hoặc hồ sơ đã công bố không sửa phiếu</td>
</tr>
<tr class="even">
<td>FE36<br />
UI23</td>
<td>UC09</td>
<td>Xem trước kết quả có internal_note dài</td>
<td>Preview chỉ thông điệp công khai; xác nhận không gửi note nội bộ</td>
</tr>
<tr class="odd">
<td>FE37<br />
UI24</td>
<td>UC15</td>
<td>Mở thông báo sau khi bị thu hồi quyền</td>
<td>Đánh dấu đọc đúng user; đích ngoài phạm vi trả 404 có giải thích chung</td>
</tr>
<tr class="even">
<td>FE38<br />
UI25</td>
<td>UC16</td>
<td>Khoảng ngày sai và mẫu số0</td>
<td>Lỗi ngày; không NaN/Infinity; có bảng số liệu tương đương biểu đồ</td>
</tr>
<tr class="odd">
<td>FE39<br />
UI26</td>
<td>UC10</td>
<td>Từ chối doanh nghiệp thiếu lý do</td>
<td>Không gửi được; server 400 nếu bypass; audit chỉ khi thành công</td>
</tr>
<tr class="even">
<td>FE40<br />
UI27</td>
<td>UC10</td>
<td>Khóa user đang mở trình duyệt khác</td>
<td>Phiên kia bị401 ở request kế; mutation bị chặn</td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 37%" />
<col style="width: 42%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã và màn hình</strong></th>
<th><strong>UC</strong></th>
<th><strong>Thao tác</strong></th>
<th><strong>Kết quả mong đợi</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>FE41<br />
UI28</td>
<td>UC10</td>
<td>Mở Outbox FAILED và retry</td>
<td>Không lộ token; retry có audit, trạng thái phản ánh server</td>
</tr>
<tr class="even">
<td>FE42<br />
UI29</td>
<td>Tất cả</td>
<td>API 500, 403,404 và session 401</td>
<td>Thông báo đúng, focus ở tiêu đề lỗi, không stack trace</td>
</tr>
</tbody>
</table>

## 7.3 CI và cổng chất lượng

**Pipeline PR và nhánh chính:** cài bằng npm ci; generate Prisma; typecheck/lint/build; unit + coverage; deploy migration lên DB rỗng; integration/API/concurrency; contract; frontend; E2E. Mỗi job có timeout và luôn lưu report/log đã lọc bí mật. Test không có Docker/DB phải fail thay vì skip; không bật passWithNoTests hoặc continue-on-error cho kiểm tra bắt buộc.

| **Script**          | **Nội dung bắt buộc**                                         | **Điều kiện fail**                                               |
|---------------------|---------------------------------------------------------------|------------------------------------------------------------------|
| typecheck           | tsc --noEmit theo tsconfig strict                             | Lỗi kiểu hoặc DTO contract                                       |
| lint                | ESLint nguồn và test; rule cấm focused/skipped test bắt buộc  | Lint error; it.only/test.only hoặc skip trái quy định            |
| build               | Prisma generate và Nest build                                 | Schema/client hoặc build lỗi                                     |
| test:unit:ci        | Jest unit --ci --coverage và JUnit reporter                   | Assertion lỗi,0 test hoặc coverage thấp                          |
| test:integration:ci | Jest integration --runInBand --ci; PostgreSQL/S3 test thật    | Thiếu Docker/DB, migration lỗi,0 test hoặc test skipped          |
| verify:evidence     | Đọc XML và coverage-summary, đối chiếu manifest bộ test       | Thiếu report, test count0, failures/errors/skipped\>0            |
| verify:migrations   | Deploy lên DB rỗng, test constraints/index và upgrade fixture | Schema lệch, thiếu partial index/FK hoặc migration không tái lập |

Gate chạy always và chỉ xanh khi mọi job bắt buộc success; canceled/skipped hoặc thiếu report đều fail. Parse JUnit kiểm tests\>0, failures/errors/skipped=0 và đủ manifest; backend/FE lines≥80%, branches≥70%. Không loại service/policy/rules về quyền, trạng thái hoặc transaction khỏi coverage.

**Kiểm chứng CI bằng nhánh thử:** làm assertion sai, xóa bộ integration, thêm .only/.skip, hạ coverage, làm migration sai và ngắt DB. Mỗi lần phải khiến gate đỏ đúng lý do. Branch protection yêu cầu gate; action và image pin phiên bản/commit đã duyệt. Không khẳng định CI đạt từ một file YAML chưa chạy.

## 7.4 Vận hành quan sát và dữ liệu nhạy cảm

Theo dõi DB pool, query/transaction chậm, deadlock/constraint, event loop, Outbox lag/FAILED, scan backlog, object orphan, reservation lệch và REVOKE_PENDING\>60 giây. TraceId nối API–DB–event; log chỉ có ID/error code đã lọc bí mật. Retry/reconcile/admin cần quyền, reason/audit và xem trước khi tác động hàng loạt.

**Mặc định demo:** upload dở 24 giờ; token/session hết hạn dọn định kỳ; idempotency≥24 giờ; log 30 ngày; hồ sơ/history/audit 12 tháng sau kết thúc. Job retention không phá FK hoặc xóa CV đang tham chiếu. Xóa thực tế theo chính sách sản phẩm được duyệt; các mốc này không xác lập nghĩa vụ pháp lý.

## 7.5 Mẫu ghi kết quả kiểm chứng

| **Hạng mục**     | **Thông tin phải ghi**                                        | **Trạng thái ban đầu** |
|------------------|---------------------------------------------------------------|------------------------|
| Định danh        | Commit SHA, branch, URL CI, người và thời điểm chạy           | Chưa có run            |
| Môi trường       | Node/Nest/Prisma/PostgreSQL/npm, image digest, OS và cấu hình | Ghi sau triển khai     |
| Test theo mức    | Tổng/pass/fail/error/skipped; danh sách suite bắt buộc        | Chưa chạy              |
| Coverage         | Lines/branches, counters và phạm vi loại trừ                  | Chưa đo                |
| Web              | Browser/version/viewport; trace, screenshot và axe/manual     | Chưa chạy              |
| Hiệu năng        | Fixture, VU, p95, error rate, CPU/RAM/DB và raw metrics       | Chưa đo                |
| Video và restore | 30 phiên; timestamp backup; RPO/RTO; đối soát CV              | Chưa xác minh          |
| Kết luận         | Đạt/chưa đạt theo từng FR/NFR; lỗi còn mở và bằng chứng       | Chưa nghiệm thu        |


## 7.1 Quy ước API

Base path /api, JSON UTF8, UUID, ISO8601 có offset. Response thành công gồm data và meta nếu phân trang. page≥1, pageSize 1–50, sort allowlist có id làm tie break; search tối đa 200 ký tự, mảng skill tối đa 50, interviewer tối đa 10. PATCH chỉ nhận field cho phép; thiếu field là không sửa, NULL chỉ chấp nhận ở field nullable; forbidNonWhitelisted được bật. Không dùng implicit boolean conversion khiến chuỗi false thành true.

Mutation có session kiểm CSRF và Origin, kiểm DTO rồi policy trong service. Guard chạy trước Pipe nên không tin body đã được validation ở Guard. HTTP 409 không tự retry bằng key/version mới. Các API riêng tư thống nhất 404 cho ngoài phạm vi; 403 cho thiếu quyền hành động trên tài nguyên được phép biết. Error shape gồm code, message, fieldErrors và traceId.

<table>
<colgroup>
<col style="width: 10%" />
<col style="width: 28%" />
<col style="width: 13%" />
<col style="width: 31%" />
<col style="width: 16%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>HTTP</strong></th>
<th><strong>Đường dẫn</strong></th>
<th><strong>Quyền</strong></th>
<th><strong>Dữ liệu chính</strong></th>
<th><strong>Kết quả</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>POST</td>
<td>/auth/register;<br />
/auth/login</td>
<td>Khách</td>
<td>DTO allowlist; Origin; đăng ký mới 201, trùng email 202 chung</td>
<td>201/202; login 200; 400/401/429</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/auth/verify-email;<br />
/auth/reset-password</td>
<td>Token một lần</td>
<td>token; password mới nếu reset</td>
<td>200; 400, 409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/auth/forgot-password;<br />
/auth/resend-verification</td>
<td>Khách</td>
<td>email; rate limit</td>
<td>202 chung; 429</td>
</tr>
<tr class="even">
<td>GET/<br />
POST</td>
<td>/auth/session;<br />
/auth/logout</td>
<td>Phiên</td>
<td>GET actor+CSRF; POST thu hồi</td>
<td>200/204; 401, 403</td>
</tr>
<tr class="odd">
<td>GET/<br />
PATCH</td>
<td>/candidate/profile</td>
<td>Ứng viên</td>
<td>profile DTO + version</td>
<td>200; 400, 409</td>
</tr>
<tr class="even">
<td>POST/<br />
GET</td>
<td>/companies;<br />
/companies/:id</td>
<td>Recruiter/member</td>
<td>company DTO; quyền công ty</td>
<td>201/200; 400, 403, 409</td>
</tr>
<tr class="odd">
<td>POST/<br />
PATCH</td>
<td>/companies/:id/members</td>
<td>OWNER</td>
<td>userId,permission,active</td>
<td>201/200; 403, 409</td>
</tr>
<tr class="even">
<td>GET</td>
<td>/jobs;<br />
/jobs/:id</td>
<td>Công khai</td>
<td>filter phân trang</td>
<td>200; 400, 404</td>
</tr>
<tr class="odd">
<td>POST/<br />
PATCH</td>
<td>/jobs;<br />
/jobs/:id</td>
<td>Recruiter</td>
<td>Create/UpdateJobDto + version</td>
<td>201/200; 400, 403, 409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/jobs/:id/publish;<br />
/jobs/:id/close</td>
<td>Recruiter</td>
<td>version; reason khi đóng</td>
<td>200; 400, 403, 409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/cv/uploads</td>
<td>Ứng viên</td>
<td>name,size khai báo; giữ chỗ</td>
<td>201 metadata; 400, 409</td>
</tr>
<tr class="even">
<td>PUT</td>
<td>/cv/:id/content</td>
<td>Chủ CV</td>
<td>stream application/pdf</td>
<td>202; 403, 413</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/cv/:id/complete</td>
<td>Chủ CV</td>
<td>hoàn tất idempotent</td>
<td>202; 403, 409</td>
</tr>
<tr class="even">
<td>GET/<br />
DELETE</td>
<td>/cv;<br />
/cv/:id</td>
<td>Chủ CV</td>
<td>danh sách hoặc xóa logic</td>
<td>200/204; 403, 409</td>
</tr>
<tr class="odd">
<td>GET</td>
<td>/cv/:id/download</td>
<td>Người có quyền</td>
<td>kiểm quyền mới trước ký</td>
<td>200 URL ≤5 phút; 403/404/409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/jobs/:id/applications</td>
<td>Ứng viên</td>
<td>cvId,coverLetter; key</td>
<td>201; 400, 403, 409</td>
</tr>
<tr class="odd">
<td>GET</td>
<td>/applications;<br />
/applications/:id</td>
<td>Theo policy</td>
<td>filter; DTO theo vai trò</td>
<td>200; 403, 404</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/applications/:id/cv-change</td>
<td>Ứng viên</td>
<td>newCvId,version; key</td>
<td>200/202; 403, 409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/cv-change/:id/approve;<br />
/reject</td>
<td>Recruiter</td>
<td>applicationVersion, requestVersion, reason nếu từ chối</td>
<td>200; 400, 403, 409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/applications/:id/review;<br />
/applications/:id/withdraw</td>
<td>Recruiter/chủ hồ sơ</td>
<td>review: SCREENING hoặc SHORTLISTED; version; withdraw workflow</td>
<td>200; 400/403/404/409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/applications/:id/interviews</td>
<td>Recruiter</td>
<td>startAt,endAt,interviewerIds; key</td>
<td>201; 400, 403, 409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/interviews/:id/respond</td>
<td>Participant</td>
<td>ACCEPTED/DECLINED + interviewVersion; phản hồi cuối atomic với confirm</td>
<td>200; 400, 403, 409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/interviews/:id/cancel;<br />
/reschedule</td>
<td>Recruiter</td>
<td>reason version; đổi tạo proposal thay thế, giữ lịch cũ đến confirm</td>
<td>200/201; 403, 409</td>
</tr>
<tr class="even">
<td>GET/<br />
POST</td>
<td>/interviews;<br />
/interviews/:id/join</td>
<td>Participant</td>
<td>filter lịch / CSRF join</td>
<td>200; 403, 409, 503</td>
</tr>
<tr class="odd">
<td>PUT</td>
<td>/interviews/:id/evaluation</td>
<td>Interviewer</td>
<td>Điểm nguyên 1–5 note recommendation; tạo mới không version, sửa có version</td>
<td>200; 400, 403, 409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/interviews/:id/complete</td>
<td>Recruiter</td>
<td>version attendance đủ và đủ phiếu; sau end_at</td>
<td>200; 403, 409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/applications/:id/mark-interviewed</td>
<td>Recruiter</td>
<td>version; đủ phiếu,không lịch CONFIRMED</td>
<td>200; 403, 409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/applications/:id/result</td>
<td>Recruiter</td>
<td>result,message,reason,version; key</td>
<td>200; 400, 403, 409</td>
</tr>
<tr class="odd">
<td>GET/<br />
PATCH</td>
<td>/notifications;<br />
/notifications/:id/read</td>
<td>Chủ thông báo</td>
<td>phân trang; read</td>
<td>200; 403</td>
</tr>
<tr class="even">
<td>PUT/<br />
DELETE</td>
<td>/saved-jobs/:jobId</td>
<td>Ứng viên</td>
<td>idempotent lưu/bỏ lưu</td>
<td>204; 403, 404</td>
</tr>
<tr class="odd">
<td>GET</td>
<td>/statistics</td>
<td>Recruiter/ADMIN</td>
<td>companyId,from,to,jobId</td>
<td>200; 400, 403</td>
</tr>
<tr class="even">
<td>PATCH</td>
<td>/admin/companies/:id;<br />
/admin/users/:id</td>
<td>ADMIN</td>
<td>decision/status,reason,version</td>
<td>200; 400, 403, 409</td>
</tr>
<tr class="odd">
<td>POST/<br />
GET</td>
<td>/admin/jobs/:id/close;<br />
/admin/audit</td>
<td>ADMIN</td>
<td>reason/version hoặc filter</td>
<td>200; 403, 409</td>
</tr>
<tr class="even">
<td>GET/<br />
POST</td>
<td>/admin/events;<br />
/admin/events/:id/retry</td>
<td>ADMIN</td>
<td>filter hoặc lý do retry</td>
<td>200/202; 403, 409</td>
</tr>
<tr class="odd">
<td>PUT</td>
<td>/interviews/:id/participants/:userId/attendance</td>
<td>Recruiter</td>
<td>attendance reason participantVersion interviewVersion</td>
<td>200; 400/403/404/409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/interviews/:id/no-show</td>
<td>Recruiter</td>
<td>version reason; sau end+30 phút; đúng attendance</td>
<td>200; 400/403/404/409</td>
</tr>
<tr class="odd">
<td>POST</td>
<td>/admin/companies/:id/recover-owner</td>
<td>ADMIN</td>
<td>memberId reason version; member ACTIVE verified</td>
<td>200; 400/403/404/409</td>
</tr>
<tr class="even">
<td>POST</td>
<td>/admin/interviews/:id/security-cancel</td>
<td>ADMIN</td>
<td>version reason; thu hồi khẩn cấp, audit và outbox</td>
<td>200/202; 403/404/409</td>
</tr>
</tbody>
</table>

Mọi API tài nguyên riêng tư bổ sung 404 cho ngoài phạm vi đọc theo mục 2.1 dù bảng chỉ liệt kê một số mã thường gặp. Các mutation đặc biệt không được gộp thành PATCH tùy ý trạng thái. Join, download và nội dung auth token không được cache vào idempotency response.

Các read endpoint dưới đây bổ sung hợp đồng phục vụ thiết kế UI; chúng vẫn chịu kiểm quyền, DTO theo actor và phân trang như các endpoint đã có. Đây là yêu cầu triển khai bổ sung, không phải khẳng định các endpoint đã có mã nguồn chạy được.

| **HTTP** | **Đường dẫn**                          | **Quyền**                                   | **DTO và scope**                                                                     | **UI**         |
|----------|----------------------------------------|---------------------------------------------|--------------------------------------------------------------------------------------|----------------|
| GET      | /skills                                | Công khai hoặc đã đăng nhập theo danh mục   | active/search; chỉ trường kỹ năng công khai                                          | UI01 UI07 UI18 |
| GET      | /saved-jobs                            | CANDIDATE                                   | Phân trang theo actor; placeholder tin không còn khả dụng                            | UI12           |
| GET      | /companies/:id/members                 | Member theo policy                          | Danh sách thành viên tối thiểu; option phỏng vấn chỉ role/membership hợp lệ          | UI16 UI21      |
| PATCH    | /companies/:id                         | OWNER                                       | Sửa thông tin được phép với version; không nhận approvalStatus từ form               | UI16           |
| POST     | /companies/:id/resubmit                | OWNER                                       | Chỉ REJECTED sang PENDING, đủ dữ liệu và version; không bỏ qua SUSPENDED             | UI16           |
| GET      | /companies/:id/jobs                    | OWNER/RECRUITER                             | Private list DRAFT/PUBLISHED/CLOSED; cùng company scope                              | UI17 UI18      |
| GET      | /companies/:id/jobs/:jobId             | OWNER/RECRUITER                             | Private detail để sửa nháp; xác minh job thuộc company                               | UI18           |
| GET      | /applications/:id/history              | Chủ hồ sơ hoặc recruiter đúng scope         | DTO candidate loại reason/internal note; recruiter theo policy                       | UI11 UI20      |
| GET      | /applications/:id/interviews           | Chủ hồ sơ/recruiter/participant theo policy | Chỉ vòng của hồ sơ; DTO không có token/đánh giá nội bộ                               | UI11 UI20      |
| GET      | /applications/:id/evaluations          | Recruiter đúng scope                        | Phiếu nội bộ; candidate luôn bị chặn                                                 | UI20 UI23      |
| GET      | /interviews/:id                        | Participant hoặc recruiter đúng scope       | Detail response/attendance/version; không signed token                               | UI14 UI15      |
| GET      | /interviews/:id/evaluation             | Interviewer được phân công                  | Phiếu của actor, hoặc dữ liệu chưa có phiếu; không nhận interviewerId khác           | UI22           |
| GET      | /admin/companies; /admin/companies/:id | ADMIN                                       | List/detail phục vụ kiểm duyệt; không có CV                                          | UI26           |
| GET      | /admin/companies/:id/eligible-owners   | ADMIN                                       | Thành viên ACTIVE đã xác minh có thể phục hồi OWNER; chỉ ID tên permission, không CV | UI26           |
| GET      | /admin/users; /admin/jobs              | ADMIN                                       | Danh sách tối thiểu, filter/paging; không hash/password/token                        | UI27           |
| GET      | /admin/events/:id                      | ADMIN                                       | Metadata task đã làm sạch; không trả payload auth/token                              | UI28           |
