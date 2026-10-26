# Kiểm tra tài khoản và màn hình theo vai trò ở localhost

Đợt QA này dùng database PostgreSQL **`recruitment_demo` ở 127.0.0.1**, tách khỏi database test `recruitment` và DB cloud. Source sửa auth/quyền đang ở working tree dựa trên main `4fba158`, chưa commit/merge. Mở [đăng nhập](http://127.0.0.1:5173/login); API chạy ở `http://127.0.0.1:3000/api`.

**Runtime hiện tại sau sửa cloud 26/10:** API cổng 3000 đang chạy với `.env` trỏ Neon cloud, FE 5173 dùng API đó. Bộ `recruitment_demo` vẫn tách riêng; các lệnh local ở dưới dùng khi muốn quay lại môi trường QA cô lập. Email/mật khẩu của 7 account giống nhau giữa hai DB.

## Tài khoản

Các tài khoản dùng chung mật khẩu demo riêng lưu tại biến `SEED_DEMO_PASSWORD` trong `.env.local-demo` (file bị Git bỏ qua). Mật khẩu được cung cấp trực tiếp trong phản hồi bàn giao, không ghi vào tài liệu hoặc báo cáo trong repo. Các fixture hợp lệ đã được xác minh email sẵn; đây không phải bằng chứng đã gửi mail xác minh.

| Email | Role toàn cục / membership | Màn hình và thao tác phù hợp |
| --- | --- | --- |
| `admin.demo@example.test` | ADMIN; không có membership | `/admin/users`, `/admin/companies`, `/admin/jobs`, `/admin/audit`, `/admin/events`; quản trị tài khoản, kiểm duyệt theo trạng thái/version. Không mặc định có quyền recruiter/OWNER. |
| `owner.demo@example.test` | CANDIDATE, RECRUITER; OWNER của Local Demo Recruitment | `/recruiter/jobs`, `/recruiter/company`, `/recruiter/members`, `/recruiter/applications`; sửa công ty/quản lý thành viên và nghiệp vụ tuyển dụng trong công ty mình. Có thể dùng màn hình ứng viên. |
| `recruiter.demo@example.test` | CANDIDATE, RECRUITER; RECRUITER của cùng công ty | Danh sách/tạo/sửa/công bố/đóng tin theo trạng thái; đọc công ty/thành viên, hồ sơ trong phạm vi được cấp. Sửa công ty/thành viên cần OWNER và sẽ bị BE từ chối nếu thử bằng tài khoản này. |
| `interviewer.demo@example.test` | CANDIDATE, INTERVIEWER; INTERVIEWER | `/interviews`, `/interviews/:id/evaluation`, `/interviews/:id/room`; có guard role nhưng API phỏng vấn/đánh giá/phòng thật còn thiếu. Được dùng màn hình ứng viên, không vào recruiter/admin hoặc đọc tin nội bộ. |
| `candidate.demo@example.test` | CANDIDATE; không có membership | `/jobs`, `/candidate/profile`, `/candidate/applications`, `/candidate/saved-jobs`, `/notifications`; CV thật còn thiếu API/provider. Không vào recruiter/admin. |
| `outsider.demo@example.test` | CANDIDATE, RECRUITER; OWNER của Local Other Company | Kiểm tra tách công ty; truy cập tài nguyên riêng Local Demo Recruitment phải bị từ chối. |
| `locked.demo@example.test` | CANDIDATE, trạng thái LOCKED | Ca kiểm tra từ chối đăng nhập. ADMIN có thể mở khóa rồi khóa lại để thử thu hồi phiên. |

OWNER là quyền membership trong một công ty, không phải role toàn cục. Khách chưa đăng nhập chỉ dùng các route public; route riêng chuyển về login, sai role chuyển về `/403`. Nút có thể hiện trên một số trang dùng chung nhưng quyền cuối cùng do API kiểm theo actor/membership/version.

## Khởi động lại trên máy này

### Bản sao tài khoản trên cloud — 26/10/2026

Theo yêu cầu riêng của người dùng, cả 7 email demo trên đã được lưu vào DB Neon cấu hình trong `.env`, cùng mật khẩu với local. Cloud có hai company fixture riêng: **Cloud Demo Recruitment** (OWNER/RECRUITER/INTERVIEWER) và **Cloud Other Company** (outsider OWNER). ADMIN/CANDIDATE không được gán membership.

Đã kiểm qua API nối cloud: 6 account ACTIVE đăng nhập/session/membership/logout thành công, account LOCKED bị từ chối 401. API cổng tạm 3001 đã dừng sau kiểm tra. Sau [đợt sửa profile](../plans/reports/261026-0100-cloud-profile-repair.md), cloud đã có đủ 6 migration và 8 hồ sơ/8 account CANDIDATE; GET/PATCH profile và thao tác lưu trên UI đã kiểm thành công, không còn lỗi thiếu bảng/profile. Bộ seed `seed-role-demo.mjs` vẫn chỉ cho DB local, không dùng nó để tự nạp cloud. [Báo cáo tạo account ban đầu](../plans/reports/261026-0051-cloud-role-accounts.md) giữ trạng thái lúc chưa migrate để làm lịch sử.

### Runtime demo local

Giữ `.env.local-demo` đã tạo; không copy thông tin demo vào `.env` cloud. Từ thư mục gốc chạy PostgreSQL, build rồi chạy API và FE ở hai terminal:

```powershell
docker compose up -d --wait postgres mailpit
npm run build
node --env-file=.env.local-demo dist/api/apps/api/src/main.js
```

```powershell
npm run dev:web
```

Nếu cần nạp lại fixture vào đúng DB demo local:

```powershell
node --env-file=.env.local-demo node_modules/prisma/build/index.js migrate deploy
node --env-file=.env.local-demo scripts/database/seed-role-demo.mjs
```

Seed từ chối production/host ngoài loopback/database khác `recruitment_demo`. Nó tạo account/profile, membership và hai tin công khai; không reset toàn database. File env demo có secret riêng; không commit file đó.

## Kiểm thử lặp lại

```powershell
npm run test:unit:ci -- --runInBand
npm run test:integration:ci
npm exec --workspace @rms/web -- vitest run --coverage --maxWorkers=2
node --env-file=.env.local-demo scripts/qa/auth-role-matrix.mjs
node --env-file=.env.local-demo node_modules/@playwright/test/cli.js test tests/e2e/auth-roles.spec.ts --workers=1
```

Jest dùng DB test local theo guard của repo. Ma trận API và browser E2E chỉ dùng DB demo. Có rate limit thật; chạy nhiều lần liên tiếp có thể trả 429, chờ hết cửa sổ 60 giây thay vì vô hiệu hóa giới hạn. Bằng chứng nằm ở `reports/auth-roles/`, `reports/backend/`, `reports/frontend/`, `reports/e2e/` (artifact local bị Git bỏ qua).

## Giới hạn chức năng

- Chưa có endpoint HTTP interview/evaluation/join-token, API CV/storage/scanner và API thống kê. Các trang tương ứng có thể mở theo role nhưng hiện lỗi/thiếu dữ liệu, chưa phải luồng nghiệp vụ hoạt động hoàn chỉnh.
- Mặc định mock dev bị tắt; chỉ bật bằng `VITE_ENABLE_DEMO_MOCKS=true` khi chủ động xem demo UI. Kiểm quyền phải để mock tắt.
- Đăng ký và token được kiểm qua API/Outbox thật; fixture demo xác minh sẵn. Chưa nghiệm thu worker giao mail thực tế, Jitsi, HTTPS hoặc production deployment.
- Tài khoản ADMIN demo duy nhất được bảo vệ bởi quy tắc ADMIN khả dụng cuối cùng. Tài khoản khác công ty và tài khoản khóa là fixture kiểm quyền, không cấp quyền rộng hơn để vượt các kiểm tra này.

Kết quả từng lần chạy và tiến độ xem [sổ chung](../progress/README.md).
