---
date: 2026-10-25
scope: QA-AUTH-ROLES-01
author: Codex
base-commit: 4fba158
status: verified-local
---

# Kiểm chứng đăng ký, đăng nhập và phân quyền theo role

## Phạm vi và môi trường

Kiểm tra source đã có của UC04/FR01, quyền API/FE, tenant membership và chuẩn bị tài khoản để thử các màn hình. Thực hiện trên working tree `main` dựa trên `4fba158`, có sửa local chưa commit/merge; kết quả này không đại diện cho GitHub CI hoặc bản main chưa nhận các sửa bên dưới.

Node 24.21.0, npm 11.19.0, PowerShell/Windows; PostgreSQL Docker local. Jest dùng `recruitment` theo `.env.test` và guard localhost. API/browser/fixture dùng DB riêng `recruitment_demo`, áp đủ 5 migration bằng Prisma migrate deploy. API `127.0.0.1:3000`, FE `127.0.0.1:5173`; Mailpit local đã bật nhưng chưa chạy nghiệm thu giao thư qua worker. Không seed/test/migrate vào cloud trong đợt này.

## Kết quả cuối

| Kiểm tra thực chạy | Kết quả | Bằng chứng local |
| --- | --- | --- |
| `npm run test:unit:ci -- --runInBand` | 50 suites, 406 tests đạt; coverage tập cấu hình 82,45% dòng / 71,23% nhánh | `reports/auth-unit-full.log`, `reports/backend/unit/junit.xml`, `reports/backend/coverage/coverage-summary.json` |
| `npm run test:integration:ci` | 17 suites, 134 tests đạt, gồm 8 ca AppModule thật không dùng port doubles | `reports/auth-integration-full.log`, `reports/backend/integration/junit.xml` |
| `npm exec --workspace @rms/web -- vitest run --coverage --maxWorkers=2` | 42 suites, 204 tests đạt; coverage 84,66% dòng / 74,74% nhánh | `reports/auth-frontend-full.log`, `reports/frontend/junit.xml`, `reports/frontend/coverage/coverage-summary.json` |
| `node --env-file=.env.local-demo scripts/qa/auth-role-matrix.mjs` | 119 kiểm tra đạt, 0 lỗi; 3 probe endpoint chưa triển khai trả 404 và được ghi riêng | `reports/auth-roles/api-matrix.json` |
| `node --env-file=.env.local-demo node_modules/@playwright/test/cli.js test tests/e2e/auth-roles.spec.ts --workers=1` | 27/27 đạt ở desktop 1366×768, tablet 768×1024, mobile 360×800; kiểm login/register, route allow/deny, logout và mở các menu theo role | `reports/auth-browser-all.log`, `reports/e2e/junit.xml`, `reports/e2e/artifacts/` |
| `npm run typecheck` | Đạt | `reports/auth-typecheck.log` |
| `npm run lint` | Đạt, 0 warning | `reports/auth-lint.log` |
| `npm run build` | API/FE/worker đạt; Vite còn cảnh báo chunk >500 kB | `reports/auth-build.log` |
| `git diff --check`, kiểm liên kết và file env bị Git bỏ qua | Kiểm tra tài liệu/diff cuối lượt; `.env.local-demo` được ignore | working tree và sổ tiến độ |

Coverage BE là tập source trong Jest config, có loại trừ controller/repository/module và một số thư mục; không suy ra toàn bộ API/provider đã được bao phủ. Contract tests đã nằm trong 134 integration, không cộng lại vào tổng test độc lập.

## Lỗi tìm thấy và đã sửa local

1. **Đăng ký thật trả 503:** các module BE1/BE2 không nhận Outbox/Audit/Interview ports chỉ được import ở root. Thêm `Be3PortsModule` để xuất ports xuyên module; Notification/Audit nhận Identity cho controller guard. Test AppModule thật chứng minh account/profile/Outbox được ghi, token xác minh dùng một lần, cookie/session/CSRF/logout hoạt động và non-admin bị từ chối.
2. **FE session thiếu role/CSRF và URL FE1/FE2 không thống nhất:** client chưa đọc envelope resource và một số endpoint thiếu `/api`. Chuẩn hóa prefix một lần, unwrap resource `{data}` nhưng giữ page `{data,meta}`.
3. **Route admin/recruiter/interview thiếu guard:** áp guard theo role, chặn khách và role không phù hợp, không tự cho ADMIN dùng recruiter. Evaluation cần INTERVIEWER; membership/assignment/resource vẫn phải kiểm ở BE.
4. **CompanyContext tự cấp ngữ cảnh OWNER demo:** thêm `GET /api/companies` trả membership ACTIVE, verified của chính actor; FE lấy dữ liệu theo session userId. Owner/recruiter/interviewer có membership đúng; candidate/admin không có membership sẽ nhận mảng rỗng.
5. **INTERVIEWER đọc được tin nội bộ, kể cả nháp:** giới hạn company job list/detail cho OWNER/RECRUITER; tin public vẫn qua `/api/jobs`. Đây là đưa implementation về giới hạn vai trò trong đặc tả. RECRUITER được tạo tin là hành vi hợp lệ, không thay thành chỉ OWNER.
6. **Bảng ADMIN crash do hợp đồng phân trang khác nhau:** adapter đọc `{items,total,page,limit}`, chuyển id/roles thật thành model giao diện; không tự dựng timestamp hay role OWNER.
7. **Mock che lỗi quyền/API:** mock FE2 cần opt-in tường minh; CV không mặc định biến 401/403/404 thành dữ liệu/success localStorage. Thông báo đọc page DTO thật và báo lỗi khi tải/đánh dấu đọc thất bại; mark-all dùng các endpoint mark-read có thật.

Các file triển khai/test chính: `apps/api/src/modules/be3-ports.module.ts`, company controller/service/repository, `job.policy.ts`, FE router/HTTP client/CompanyContext/admin adapter/CV/notification API, `tests/api/be1/runtime-auth-roles.spec.ts`, `tests/e2e/auth-roles.spec.ts`, `scripts/qa/auth-role-matrix.mjs`. Đặc tả, contract tích hợp, public DTO, OpenAPI và inventory evidence đã cập nhật cùng lượt.

## Phạm vi quyền đã kiểm

- Khách nhận 401 ở API riêng và chuyển login tại route riêng.
- Đăng ký công khai chỉ CANDIDATE hoặc CANDIDATE+RECRUITER; ADMIN/INTERVIEWER và trường role lạ bị từ chối. Duplicate email được xử lý 202; sai password và LOCKED bị 401.
- ADMIN đọc các API quản trị; các role còn lại bị 403. ADMIN không có membership không đọc/sửa tài nguyên riêng công ty bằng route thông thường.
- OWNER/RECRUITER/INTERVIEWER có company scope chính xác; account khác công ty nhận 404. Chỉ OWNER sửa công ty; OWNER/RECRUITER thao tác tin theo nghiệp vụ; INTERVIEWER bị chặn tin nội bộ.
- Thiếu CSRF hoặc Origin không hợp lệ bị 403; logout thu hồi phiên. ADMIN mở khóa/khóa fixture qua ports thật, ghi audit và thu hồi session của account bị khóa.
- Browser kiểm 5 vai trò, route bị cấm, session và logout; đọc menu admin/company/jobs/application/notifications và các màn hình còn thiếu backend để bảo đảm không crash. Mở màn hình không đồng nghĩa các thao tác nghiệp vụ chưa có API đã được nghiệm thu.

## Các lần lỗi trong quá trình kiểm tra

- Lần đầu FE chạy mặc định nhiều worker: 178/180 đạt, 2 ca timeout 5 giây. Lượt cuối giữ timeout và giới hạn 2 worker: 204/204 đạt. Đây là bằng chứng chạy lại trên môi trường giới hạn tài nguyên, chưa có số liệu đủ để kết luận mọi nguyên nhân timeout.
- Lệnh unit lọc auth/policy đạt 277 assertion nhưng exit 1 vì so coverage của subset với ngưỡng toàn repo. Lượt full suite sau đó đạt cả test và coverage.
- Test integration cũ giả định provider BE3 vắng mặt, sau nối runtime nhận 200 thay vì 503. Fixture hiện chủ động gỡ provider ở đúng test outage; kiểm rollback 503 vẫn giữ, ca runtime thật được kiểm riêng.
- Browser đầu tiên có lỗi selector confirm password của test và lỗi dữ liệu bảng admin của ứng dụng. Đã sửa selector theo label và adapter theo response thật; lượt E2E cuối mở rộng menu đạt 27/27, không page error.

## Tài khoản và giới hạn còn lại

Đã tạo 7 tài khoản fixture: ADMIN, OWNER, RECRUITER, INTERVIEWER, CANDIDATE, OWNER khác công ty, account LOCKED. Fixture ACTIVE xác minh sẵn và có CandidateProfile khi mang CANDIDATE. OWNER là membership, không phải role toàn cục. Mật khẩu riêng chỉ nằm trong `.env.local-demo` bị Git ignore và phản hồi bàn giao, không ghi ở báo cáo.

Hướng dẫn email/route/chạy lại: [local-role-testing.md](../../Docs/local-role-testing.md).

Chưa nghiệm thu toàn hệ thống: interview/evaluation/join-token HTTP, CV API/storage/scanner, reporting HTTP còn thiếu; 3 probe hiện trả 404. Chưa kiểm mail worker end-to-end, Jitsi thật, HTTPS, production, tải/backup hoặc full tuyển dụng với CV/phỏng vấn/kết quả. Từng UC vẫn IN_PROGRESS; DONE chỉ cho kiểm tra và bộ tài khoản local trong phạm vi này. Chưa commit/push/deploy.
