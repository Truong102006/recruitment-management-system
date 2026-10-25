# BẢNG ÁNH XẠ UI/UX MAPPING — TALENTO REDESIGN

Dưới đây là bảng đối chiếu toàn bộ các route, vai trò người dùng và chức năng hiện tại sang các mẫu thiết kế (Design Patterns) của Talento:

| Existing Route | User Role | Existing Function | Talento UI Pattern | Required Components & Tokens |
|---|---|---|---|---|
| `/` | Khách / Tất cả | Trang chủ giới thiệu hệ thống | Hero landing với 3 động từ tương tác (`vb-hire`, `vb-review`, `vb-track`), floating pinned note, calendar reminder, live demo frame (`.appwin`), bento features grid (`.fgrid`) | HeroSection, InteractiveVerbs, DemoPlayer, BentoGrid, NavHeader, SiteFooter |
| `/jobs` | Ứng viên / Public | Tìm kiếm và xem danh sách việc làm | Talento search bar, filter chips, job cards grid (`.jgrid` / `.jc`) với status pills và salary meta | SearchInput, FilterChips, JobCard, Pagination |
| `/jobs/:id` | Ứng viên / Public | Xem chi tiết tin tuyển dụng & Nộp CV | Talento typography hierarchy, section cards, application form dialog | Card, StatusBadge, Button, Dialog, FormField |
| `/login` | Chưa đăng nhập | Đăng nhập tài khoản | Talento auth card (`.auth-card`) với logo tile 4 chấm, floating notes, input focus glow, demo account filler | AuthCard, TextInput, PasswordInput, Button |
| `/register` | Chưa đăng nhập | Đăng ký tài khoản | Talento auth card, password strength meter 4 mức (`.meter`), validation feedback | AuthCard, PasswordMeter, TextInput, Button |
| `/forgot-password` | Chưa đăng nhập | Quên mật khẩu & gửi mã | Talento auth card step 1, email field, spring feedback | AuthCard, TextInput, Button |
| `/reset-password` | Chưa đăng nhập | Nhập mã OTP và đổi mật khẩu | Talento simulated inbox note (`.mail`), 6-digit code format, password meter | AuthCard, OtpInput, PasswordMeter, Button |
| `/verify-email` | Chưa đăng nhập | Xác thực email | Talento status card với verification badge | AuthCard, StatusIcon, Button |
| `/candidate/applications` | CANDIDATE | Danh sách hồ sơ đã nộp của ứng viên | Talento list cards (`.ir` pattern) với status badges, progress indicator | Card, StatusBadge, ProgressBar, Button |
| `/candidate/applications/:id` | CANDIDATE | Chi tiết hồ sơ, lịch sử xét duyệt & thay CV | Section cards, timeline, CV version chip, change CV dialog | Card, Timeline, Dialog, FileUpload, StatusBadge |
| `/candidate/profile` | CANDIDATE | Xem và chỉnh sửa hồ sơ cá nhân | Profile header card với circular avatar (`.av`), section cards (kinh nghiệm, học vấn, kỹ năng) | Card, Avatar, FormField, TagChips, Button |
| `/candidate/cvs` | CANDIDATE | Quản lý kho CV cá nhân | File cards grid với format chip, action buttons, upload dropzone | Card, FileChip, Dropzone, Button |
| `/candidate/saved-jobs` | CANDIDATE | Danh sách tin tuyển dụng đã lưu | Talento job cards grid (`.jgrid`) với save toggle | JobCard, StatusBadge, Button |
| `/notifications` | CANDIDATE / Tất cả | Trung tâm thông báo hệ thống | Notification list items với timestamp, icon, mark-as-read | Card, ListItem, IconBadge, Button |
| `/recruiter` | RECRUITER | Dashboard tổng quan nhà tuyển dụng | Signature Talento Dashboard: Việc cần làm (`.todo`), Phỏng vấn kế tiếp countdown clock (`.timer`), Tiến độ 3 vòng tròn SVG (`.act`), Ứng viên cần xử lý (`.tasks`) | RecruiterDashboard, TodoWidget, TimerClock, ProgressRings, CandidateTabs |
| `/recruiter/jobs` | RECRUITER | Quản lý danh sách tin tuyển dụng của công ty | Talento jobs grid card (`.jgrid` / `.jc`) kết hợp DataTable view toggle, status pills, filter tabs | JobGridCard, DataTable, StatusBadge, Dialog, Button |
| `/recruiter/jobs/new` & `/:id/edit` | RECRUITER | Tạo mới & chỉnh sửa tin tuyển dụng | Form section cards, salary range inputs, rich validation | Card, FormField, SelectInput, Button |
| `/recruiter/applications` | RECRUITER | Quản lý hồ sơ ứng viên theo công ty | Talento Kanban Pipeline board (`.board` / `.col` / `.kc`) với drag-and-drop và confetti, kết hợp DataTable view toggle | KanbanBoard, KanbanCard, DataTable, StatusBadge, FilterSelect |
| `/recruiter/applications/:id` | RECRUITER | Chi tiết hồ sơ ứng viên, đổi trạng thái & xếp lịch | Candidate detail header card, review history timeline, action buttons, interview booking modal | Card, Avatar, Timeline, StatusBadge, Dialog, Button |
| `/interviews` | RECRUITER | Lịch phỏng vấn & điều phối lịch | Talento date-grouped list (`.dayg` / `.ir`) với date badge (`.dt`), time chip (`.tm`), kết hợp Agenda view | DateBadge, TimeChip, CalendarAgenda, Dialog, Button |
| `/interviews/:id` | RECRUITER | Chi tiết buổi phỏng vấn & chuẩn bị phòng | Section cards, candidate summary, interviewer chips, direct link to video room | Card, Avatar, TimeChip, StatusBadge, Button |
| `/interviews/:id/evaluate` | RECRUITER | Đánh giá & chấm điểm ứng viên sau phỏng vấn | Star rating component (`.rate`), criteria scorecards, notes textarea | StarRating, ScoreCard, FormField, Button |
| `/interviews/room/:roomId` | RECRUITER / CANDIDATE | Phòng phỏng vấn video trực tuyến | Fullscreen WebRTC room với control toolbar, participant badges | VideoRoom, ControlToolbar, ParticipantBadge |
| `/recruiter/company` & `/members` | RECRUITER | Thông tin công ty & danh sách thành viên | Bento team cards, member avatars (`.av p0..p4`), role badges, invite modal | Card, Avatar, RoleBadge, Dialog, Button |
| `/recruiter/statistics` | RECRUITER | Báo cáo & thống kê tuyển dụng | Metric stat cards với colored border accents, donut charts, pipeline breakdown | StatCard, DonutChart, ProgressBar, DataTable |
| `/admin/companies` | ADMIN | Kiểm duyệt và phê duyệt doanh nghiệp | Talento admin table với status badges, action buttons, approval dialog | AdminShell, DataTable, StatusBadge, Dialog |
| `/admin/users` | ADMIN | Quản trị tài khoản người dùng | User table với role chips, lock/unlock toggle dialog | AdminShell, DataTable, RoleBadge, Dialog |
| `/admin/jobs` | ADMIN | Kiểm duyệt tin tuyển dụng toàn hệ thống | Job moderation table với detail drawer & status actions | AdminShell, DataTable, StatusBadge, Dialog |
| `/admin/audit` | ADMIN | Nhật ký kiểm toán hệ thống | Audit log table với JSON metadata modal viewer | AdminShell, DataTable, CodeViewer, Dialog |
| `/admin/events` | ADMIN | Giám sát sự kiện Outbox lỗi | Outbox events table với status filter & retry dialog | AdminShell, DataTable, StatusBadge, Dialog |
| `/403` | Tất cả | Màn hình từ chối truy cập (Forbidden) | Talento error card với visual illustration & back button | ErrorCard, Button |
| `/*` | Tất cả | Màn hình 404 Không tìm thấy trang | Talento 404 card với home navigation | ErrorCard, Button |
