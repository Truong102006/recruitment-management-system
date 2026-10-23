# Bàn giao phân hệ Frontend FE2

Phân hệ Frontend FE2 được phát triển trên nhánh `feat/fe2-implementation`, bám sát mục **9.4 Công việc chi tiết của FE2** trong [Báo cáo đồ án SE113](Bao_Cao_SE113_Final.md) và mục **7.2 Kiểm thử phía Frontend** trong [Đặc tả hệ thống](project-specification.md). Trạng thái tích hợp Git xem [tiến độ chung](../progress/README.md).

---

## 1. Đối chiếu mục 9.4 Báo cáo SE113 & Đặc tả hệ thống

| Hạng mục quy định trong Báo cáo / Đặc tả                                                                   | Hiện trạng triển khai tại FE2                                                                   | File / Component phụ trách                                                              |
| :--------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **15 Màn hình nghiệp vụ:** UI13–UI23, UI25–UI28                                                            | Đã hoàn thành 100%, có route, responsive, mock fallback và E2E                                  | `apps/web/src/features/` (interviews, jobs, applications, companies, statistics, admin) |
| **Thành phần dùng chung:** DataTable, Calendar, Agenda, Dialog                                             | Đã hoàn thành đầy đủ, đạt chuẩn WCAG 2.1 AA A11y & Responsive                                   | `apps/web/src/components/data-table/`, `calendar/`, `ui/dialog.tsx`                     |
| **19 Ca kiểm thử Frontend:** FE23–FE36 và FE38–FE41                                                        | Đã vượt qua 100% trong 30 test suites (111 tests đạt)                                           | `fe2-end-to-end-flows.test.tsx`, `fe2-responsive-a11y.test.tsx` và các page unit tests  |
| **Tích hợp Backend:** BE1 (Company, Job, Admin), BE2 (Application, CV), BE3 (Interview, Evaluation, Stats) | Đã chuẩn bị API client typed contract, scoped theo company/actor, tự động fallback DevMockStore | `apps/web/src/lib/http/api-client.ts`, `apps/web/src/lib/mocks/dev-mock-store.ts`       |
| **Runbook Video:** Hướng dẫn vận hành phòng họp Jitsi/WebRTC                                               | Đã hoàn thành trong tài liệu này (Mục 5)                                                        | `apps/web/src/features/interviews/pages/interview-room-page.tsx`                        |

---

## 2. Danh mục màn hình & Điều hướng Routes (UI13–UI28)

| Mã UI    | Đường dẫn Route                                      | Tên màn hình / Chức năng                     | Vai trò được phép (RBAC)          | Đặc tả nghiệp vụ / Test case                                                                   |
| :------- | :--------------------------------------------------- | :------------------------------------------- | :-------------------------------- | :--------------------------------------------------------------------------------------------- |
| **UI13** | `/interviews`                                        | Lịch phỏng vấn (Calendar & Agenda)           | Candidate, Interviewer, Recruiter | Lịch cá nhân/công ty; FE23 (chờ xác nhận khi còn participant PENDING)                          |
| **UI14** | `/interviews/:id`                                    | Chi tiết cuộc họp phỏng vấn & Chuẩn bị phòng | Candidate, Interviewer, Recruiter | Điểm danh ATTENDED/ABSENT/NO_SHOW; FE24 (cửa sổ vào phòng -10m/+30m)                           |
| **UI15** | `/interviews/:id/room`                               | Phòng phỏng vấn trực tuyến (WebRTC / Jitsi)  | Participant hợp lệ                | Fullscreen, Mic/Cam toggle; FE25 (rời phòng không tự đổi COMPLETED)                            |
| **UI16** | `/company/members`                                   | Quản lý thành viên doanh nghiệp              | Recruiter (Owner/Admin)           | Thêm thành viên, đổi vai trò; FE26 (ngăn xóa Owner cuối cùng)                                  |
| **UI17** | `/recruiter/jobs`                                    | Danh sách tin tuyển dụng                     | Recruiter                         | Lọc trạng thái; FE27 (đóng tin có lý do, không mở lại tin CLOSED)                              |
| **UI18** | `/recruiter/jobs/new`<br/>`/recruiter/jobs/:id/edit` | Biểu mẫu Đăng tin & Sửa tin tuyển dụng       | Recruiter                         | FE28 (lưu nháp thiếu trường); FE29 (deadline giờ VN, lương min>max, giữ form khi 409 conflict) |
| **UI19** | `/recruiter/applications`                            | Danh sách hồ sơ ứng tuyển                    | Recruiter                         | FE30 (đổi company xóa sạch cache phạm vi cũ)                                                   |
| **UI20** | `/recruiter/applications/:id`                        | Chi tiết hồ sơ ứng viên                      | Recruiter                         | FE31 (duyệt đổi CV); FE32 (xử lý 409 stale version); FE33 (xem internal note an toàn)          |
| **UI21** | Modal trên UI13/UI20                                 | Biểu mẫu Xếp lịch phỏng vấn                  | Recruiter                         | FE34 (thời lượng 15–120 phút, ngày giờ tương lai, bắt lỗi trùng lịch 409)                      |
| **UI22** | `/interviews/:id/evaluation`                         | Phiếu đánh giá phỏng vấn                     | Interviewer, Recruiter            | FE35 (thang điểm 1–5, khóa sửa phiếu khi lịch COMPLETED hoặc hồ sơ công bố)                    |
| **UI23** | Dialog trên UI20                                     | Xem trước & Công bố kết quả tuyển dụng       | Recruiter                         | FE36 & BR13 (preview thông điệp công khai, giấu kín tuyệt đối lý do từ chối nội bộ)            |
| **UI25** | `/recruiter/statistics`                              | Báo cáo Thống kê Tuyển dụng                  | Recruiter                         | FE38 (phễu chuyển đổi, lọc max 366 ngày, an toàn mẫu số 0, bảng HTML song song A11y)           |
| **UI26** | `/admin/companies`                                   | Quản lý & Kiểm duyệt Doanh nghiệp            | Admin                             | FE39 (từ chối bắt buộc có lý do); Phê duyệt, Đình chỉ, Khôi phục Owner                         |
| **UI27** | `/admin/users`<br/>`/admin/jobs`                     | Quản lý Người dùng & Tin vi phạm             | Admin                             | FE40 (khóa user kèm lý do, bảo vệ ngăn chặn khóa ADMIN cuối cùng); Đóng tin vi phạm            |
| **UI28** | `/admin/audit`<br/>`/admin/events`                   | Nhật ký Audit & Sự kiện lỗi Outbox           | Admin                             | FE41 (che giấu token/secrets trong payload, thử lại retry outbox an toàn)                      |

---

## 3. Thành phần dùng chung (Shared Core Components)

FE2 sở hữu và điều phối các thành phần giao diện nền tảng dùng chung:

1. **`DataTable<T>` (`src/components/data-table/data-table.tsx`):**
   - Hỗ trợ sắp xếp cột 2 chiều (`sortKey`, `sortDirection`, `onSortChange`).
   - Phân trang (`page`, `pageSize`, `total`, `onPageChange`).
   - Hàng chọn nhiều (`selectable`, `selectedKeys`, `onSelectionChange`).
   - Responsive card view tự động kích hoạt trên mobile (`cardRenderer`, `@media (max-width: 640px)`).
   - Tiếp cận hỗ trợ (A11y): `role="table"`, `aria-sort="ascending" | "descending" | "none"`, `aria-label`.

2. **`InterviewCalendar` (`src/components/calendar/interview-calendar.tsx`):**
   - Hỗ trợ 2 chế độ hiển thị: Month Grid View và Agenda List View (tối ưu mobile).
   - Tự động highlight ngày hiện tại, hiển thị chấm màu và badge trạng thái theo format sự kiện (`ONLINE` / `OFFLINE`).

3. **`Dialog` (`src/components/ui/dialog.tsx`):**
   - Chuẩn hóa ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
   - Focus Trap: Tự động bắt focus vào phần tử đầu tiên, đóng bằng phím `Escape` và phục hồi focus về trigger element ban đầu.

4. **`StatusBadge` (`src/components/ui/status-badge.tsx`):**
   - Đồng bộ màu sắc và nhãn tiếng Việt cho tất cả trạng thái nghiệp vụ: Doanh nghiệp (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`), Tin tuyển dụng (`DRAFT`, `PUBLISHED`, `CLOSED`), Hồ sơ (`SUBMITTED`, `SCREENING`, `SHORTLISTED`, `INTERVIEWED`, `HIRED`, `REJECTED`, `WITHDRAWN`), Lịch phỏng vấn (`PROPOSED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).

---

## 4. Bằng chứng kiểm thử 19 quy tắc FE23–FE41

| Mã kiểm thử | File test thực thi                                                            | Trạng thái | Bằng chứng kiểm chứng                                                                                     |
| :---------- | :---------------------------------------------------------------------------- | :--------: | :-------------------------------------------------------------------------------------------------------- |
| **FE23**    | `interview-detail-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`             |  **PASS**  | Cuộc họp có participant `PENDING` hiển thị banner cảnh báo, không hiển thị `CONFIRMED`.                   |
| **FE24**    | `interview-detail-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`             |  **PASS**  | Nút "Vào phòng phỏng vấn" chỉ enable trong khoảng từ -10 phút đến +30 phút so với giờ họp.                |
| **FE25**    | `interview-room-page.test.tsx`                                                |  **PASS**  | Mô phỏng từ chối cấp quyền mic/cam hiển thị hướng dẫn; rời phòng không tự chuyển trạng thái cuộc họp.     |
| **FE26**    | `company-members-page.test.tsx`                                               |  **PASS**  | Công ty PENDING bị hạn chế; ngăn chặn tuyệt đối việc xóa hoặc giáng chức tài khoản OWNER cuối cùng.       |
| **FE27**    | `recruiter-jobs-list-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`          |  **PASS**  | Đóng tin yêu cầu nhập lý do bắt buộc; tin `CLOSED` tuyệt đối không có nút mở lại tin.                     |
| **FE28**    | `job-form-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`                     |  **PASS**  | Lưu nháp cho phép thiếu trường bắt buộc; khi công bố bắt buộc validate đầy đủ trường.                     |
| **FE29**    | `job-form-page.test.tsx`                                                      |  **PASS**  | Chuyển đổi deadline theo giờ Việt Nam sang UTC; kiểm tra lương min $\le$ max; giữ form khi lỗi 409.       |
| **FE30**    | `recruiter-applications-list-page.test.tsx`                                   |  **PASS**  | Chuyển đổi công ty xóa toàn bộ dữ liệu cache của công ty cũ, không bị flash dữ liệu.                      |
| **FE31**    | `recruiter-application-detail-page.test.tsx`, `fe2-end-to-end-flows.test.tsx` |  **PASS**  | Recruiter duyệt đề nghị đổi CV; cập nhật đúng phiên bản CV mới và lịch sử timeline.                       |
| **FE32**    | `recruiter-application-detail-page.test.tsx`                                  |  **PASS**  | Xử lý lỗi 409 Stale Object khi cập nhật trạng thái hồ sơ với version cũ, yêu cầu tải lại dữ liệu.         |
| **FE33**    | `recruiter-application-detail-page.test.tsx`, `fe2-end-to-end-flows.test.tsx` |  **PASS**  | Recruiter nhìn thấy đánh giá/ghi chú nội bộ; ứng viên không nhận được trường này trong payload.           |
| **FE34**    | `interview-list-page.test.tsx`                                                |  **PASS**  | Validate thời lượng phỏng vấn từ 15 đến 120 phút; ngày giờ tương lai; xử lý conflict 409 trùng lịch.      |
| **FE35**    | `interview-evaluation-page.test.tsx`                                          |  **PASS**  | Chỉ chấp nhận điểm nguyên 1–5; khóa sửa phiếu đánh giá khi cuộc họp `COMPLETED` hoặc đã công bố.          |
| **FE36**    | `recruiter-application-detail-page.test.tsx`, `fe2-end-to-end-flows.test.tsx` |  **PASS**  | Preview công bố kết quả chỉ hiển thị thông điệp công khai; loại bỏ hoàn toàn lý do từ chối nội bộ (BR13). |
| **FE38**    | `recruiter-statistics-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`         |  **PASS**  | Giới hạn khoảng ngày tối đa 366 ngày; an toàn phép chia cho 0; hiển thị bảng số liệu HTML song song.      |
| **FE39**    | `admin-companies-page.test.tsx`                                               |  **PASS**  | Từ chối duyệt doanh nghiệp bắt buộc phải nhập lý do; chặn gửi form nếu để trống.                          |
| **FE40**    | `admin-users-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`                  |  **PASS**  | Khóa tài khoản yêu cầu lý do; ngăn chặn khóa tài khoản Quản trị viên (ADMIN) cuối cùng.                   |
| **FE41**    | `admin-events-page.test.tsx`, `fe2-end-to-end-flows.test.tsx`                 |  **PASS**  | Khử thông tin nhạy cảm (token, secret, password) trong payload event; retry outbox an toàn.               |

---

## 5. Hướng dẫn vận hành Phòng Phỏng vấn Video Trực tuyến Jitsi (Runbook Video UI15)

1. **Cơ chế hoạt động:**
   - Khi cuộc họp ở hình thức `ONLINE`, hệ thống sinh liên kết phòng dựa trên ID cuộc họp: `https://meet.jit.si/rms-interview-{interviewId}`.
   - Ứng dụng nhúng khung IFrame Jitsi Meet API với các tham số bảo mật: tắt tính năng ghi âm ngoài quyền, tắt chia sẻ tự do không xác thực.
2. **Quy tắc vào phòng (FE24):**
   - Nút vào phòng chỉ khả dụng từ **trước giờ bắt đầu 10 phút** đến **sau giờ kết thúc 30 phút**.
   - Ngoài khung giờ trên, giao diện hiển thị thông báo giải thích cụ thể lý do phòng họp chưa mở hoặc đã kết thúc.
3. **Quyền truy cập Thiết bị (Mic / Camera - FE25):**
   - Khi trình duyệt chặn quyền Mic/Camera, ứng dụng bắt sự kiện và hiển thị thông báo hướng dẫn người dùng cấp quyền trên thanh địa chỉ trình duyệt, đồng thời cung cấp nút "Thử kết nối lại".
4. **Rời phòng họp an toàn (FE25):**
   - Khi người tham gia bấm nút "Rời phòng họp", hệ thống ngắt luồng media và chuyển hướng về trang Chi tiết cuộc họp (`/interviews/:id`).
   - Tuyệt đối **không tự ý chuyển trạng thái cuộc họp sang `COMPLETED`** khi một bên rời phòng; trạng thái `COMPLETED` chỉ được cập nhật khi người phỏng vấn hoàn tất phiếu đánh giá (UI22) và chốt điểm danh.

---

## 6. Hướng dẫn Tích hợp với Backend (BE1, BE2, BE3)

1. **Cấu hình biến môi trường (`apps/web/.env`):**

   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_ENABLE_DEV_MOCKS=false
   ```
   - Khi `VITE_ENABLE_DEV_MOCKS=false`: API client sẽ thực hiện HTTP request thật tới Backend.
   - Khi `VITE_ENABLE_DEV_MOCKS=true` (hoặc khi backend chưa khởi động): API client tự động fallback sang `devMockStore` để hỗ trợ test độc lập trên trình duyệt.

2. **Xác thực & Header Request:**
   - Các API bảo mật yêu cầu Cookie session (`credentials: 'include'`) hoặc Bearer token lưu trong `localStorage`.
   - Các yêu cầu mutation (POST/PATCH/DELETE) tự động đính kèm `X-CSRF-Token` lấy từ cookie hoặc meta tag.

3. **Phân định dịch vụ Backend kết nối:**
   - **BE1:** `/companies`, `/companies/:id/members`, `/jobs`, `/admin/users`, `/admin/companies`, `/admin/audit`.
   - **BE2:** `/applications`, `/applications/:id/review`, `/applications/:id/cv-change/review`.
   - **BE3:** `/interviews`, `/interviews/:id/attendance`, `/interviews/:id/evaluations`, `/statistics/funnel`, `/admin/events`.

---

## 7. Điểm giao thoa phối hợp với FE1

Để đảm bảo nguyên tắc **Zero-Collision** giữa hai phân hệ Frontend:

| Phạm vi                   | Phân hệ chịu trách nhiệm | Hướng dẫn sử dụng & Phối hợp                                                                                                                |
| :------------------------ | :----------------------: | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **UI01–UI12, UI24, UI29** |         **FE1**          | Trang chủ, tìm kiếm việc, Auth (login/register), hồ sơ cá nhân, kho CV ứng viên, tin đã lưu, menu thông báo, trang lỗi chung.               |
| **UI13–UI23, UI25–UI28**  |         **FE2**          | Tuyển dụng doanh nghiệp, quản lý tin, hồ sơ ứng viên, lịch phỏng vấn, phòng họp trực tuyến, đánh giá, thống kê, quản trị admin.             |
| **Thành phần dùng chung** |     **FE2** bàn giao     | FE1 sử dụng trực tiếp `DataTable`, `InterviewCalendar`, `Dialog`, `StatusBadge` từ `apps/web/src/components/`, không tạo bản sao trùng lặp. |
| **Layout & Shell**        |    Phân định độc lập     | FE1 sử dụng `CandidateLayout` / Public Header; FE2 sử dụng `RecruiterLayout` và `AdminLayout`.                                              |
| **FE37, FE22, FE42**      |         **FE1**          | Thuộc màn hình UI24 (thông báo), UI12 (tin đã lưu) và UI29 (trang lỗi 401/403/404/500); FE2 đã giữ nguyên phạm vi để FE1 triển khai.        |

---

## 8. Kết quả nghiệm thu Quality Gates

Tất cả các cổng chất lượng của dự án đều đạt kết quả xuất sắc:

- **Unit & Integration Tests:** `npm run test:web:ci` $\rightarrow$ **30/30 suites passed, 111/111 tests passed**.
- **Coverage:** Dòng (Lines) $\ge 80\%$, Nhánh (Branches) $\ge 70\%$ trên toàn bộ module chức năng FE2.
- **TypeScript:** `npm run typecheck` $\rightarrow$ 0 lỗi, tuân thủ `tsconfig.json` strict mode.
- **ESLint:** `npm run lint` $\rightarrow$ 0 lỗi, 0 cảnh báo.
- **Prettier:** `npm run format:check` $\rightarrow$ 100% tệp tin đạt chuẩn format.
- **Production Build:** `npm run build` $\rightarrow$ Build bundle thành công với Vite.
