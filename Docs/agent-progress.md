# Tiến độ triển khai dành cho agent

## Bối cảnh

Cập nhật gần nhất: 16/10/2026 16:51 (Asia/Saigon).

Nguồn: [báo cáo](Bao_Cao_SE113_Final.md), [đặc tả tổng hợp](project-specification.md). Quy trình bắt buộc: [AGENTS.md](../AGENTS.md).

Repo đã có khung npm workspaces API/worker/web, manifest/lockfile, cấu hình phát triển/test và hạ tầng local. Đã cài dependency và khởi chạy Vite tại http://127.0.0.1:5173/ ngày 16/10/2026; trang còn trống vì file React chưa có nội dung. File nguồn ứng dụng và seed còn trống; chưa có model/migration, test thực hoặc CI. Chưa bật container. Test chưa chạy, coverage chưa đo, chưa nghiệm thu FR/NFR. BE1/BE2/BE3 và FE1/FE2 là ký hiệu phân công trong báo cáo.

Trạng thái: `TODO` chưa làm; `IN_PROGRESS` đang làm hoặc còn thiếu kiểm chứng; `BLOCKED` có trở ngại cụ thể; `DONE` đủ tiêu chí hoàn thành và bằng chứng.

## Tiến độ chức năng

| Mã | Chức năng | Phụ trách theo báo cáo | Trạng thái | File / bằng chứng | Test |
|---|---|---|---|---|---|
| UC01 | Đăng tin tuyển dụng | BE1 | TODO | Chưa có | Chưa chạy |
| UC02 | Nộp CV ứng tuyển | BE2 | TODO | Chưa có | Chưa chạy |
| UC03 | Phỏng vấn trực tuyến | BE3 | TODO | Chưa có | Chưa chạy |
| UC04 | Đăng ký và xác thực | BE1 | TODO | Chưa có | Chưa chạy |
| UC05 | Tìm kiếm và xem tin | BE1 | TODO | Chưa có | Chưa chạy |
| UC06 | Quản lý CV và đề nghị thay CV | BE2 | TODO | Chưa có | Chưa chạy |
| UC07 | Xét duyệt và rút hồ sơ | BE2 | TODO | Chưa có | Chưa chạy |
| UC08 | Quản lý lịch phỏng vấn | BE3 | TODO | Chưa có | Chưa chạy |
| UC09 | Công bố kết quả | BE3 | TODO | Chưa có | Chưa chạy |
| UC10 | Quản trị và kiểm duyệt | BE1 | TODO | Chưa có | Chưa chạy |
| UC11 | Doanh nghiệp và thành viên | BE1 | TODO | Chưa có | Chưa chạy |
| UC12 | Hồ sơ cá nhân | BE2 | TODO | Chưa có | Chưa chạy |
| UC13 | Đánh giá và hoàn tất phỏng vấn | BE3 | TODO | Chưa có | Chưa chạy |
| UC14 | Lưu tin quan tâm | BE2 | TODO | Chưa có | Chưa chạy |
| UC15 | Thông báo | BE3 | TODO | Chưa có | Chưa chạy |
| UC16 | Thống kê tuyển dụng | BE3 | TODO | Chưa có | Chưa chạy |

## Hạ tầng và frontend

| Hạng mục | Trạng thái | Bằng chứng / phần còn thiếu |
|---|---|---|
| Đặc tả tổng hợp | DONE | project-specification.md |
| Quy tắc và sổ tiến độ | DONE | ../AGENTS.md và file này |
| Khung workspace và cấu hình phát triển | DONE | package.json/lockfile, apps/api, apps/worker, apps/web, cấu hình công cụ; Docs/development-setup.md |
| Backend NestJS/TypeScript | IN_PROGRESS | Có manifest và module/bootstrap trống; chưa cài dependency hoặc viết bootstrap |
| PostgreSQL/Prisma, 25 bảng, migration, seed | IN_PROGRESS | Có Compose và datasource/generator; chưa có model/constraint/migration thực |
| Storage CV và scanner | TODO | Chưa tích hợp |
| Outbox/email/idempotency/worker | TODO | Chưa triển khai |
| Jitsi và thu hồi quyền phòng | TODO | Chưa kiểm provider thật |
| FE1: UI01–UI12, UI24, UI29 | TODO | Có folder chức năng và cấu hình React/Vite; chưa có giao diện |
| FE2: UI13–UI23, UI25–UI28 | TODO | Có folder chức năng và cấu hình React/Vite; chưa có giao diện |
| OpenAPI và contract test | TODO | Chỉ có hợp đồng thiết kế |
| Unit/integration/API/concurrency | TODO | TC01–TC60 và EC01–EC40 chưa thực thi |
| Frontend/E2E/accessibility | TODO | Ma trận FE chưa thực thi |
| CI/coverage/evidence gate | TODO | Chưa có pipeline và report |
| Hiệu năng/backup/restore/vận hành | TODO | Chưa đo và diễn tập |

## Công việc đang làm và trở ngại

- Đợt tạo khung đã hoàn tất trong phạm vi chỉ setup, không viết code ứng dụng.
- Chưa có blocker kỹ thuật; file bootstrap/logic để trống theo yêu cầu nên ứng dụng chưa chạy.
- Đã khóa và cài dependency; Vite đã chạy, chưa có bootstrap API/worker hay giao diện.

## Bước tiếp theo

1. Bổ sung môi trường backend và bật dịch vụ khi bắt đầu code; frontend đã có .env.local và dependency.
2. Viết bootstrap API/worker/React, model/migration/constraints/fixture và nền auth/company/job; thống nhất OpenAPI.
3. Triển khai từng UC cùng test, sau đó evidence gate/CI; cập nhật trạng thái bằng file và report thực tế.

## Nhật ký (mới nhất trước)

### 16/10/2026 16:51 (Asia/Saigon) — Chạy localhost frontend

- Yêu cầu: chạy localhost, giữ nguyên file nghiệp vụ trống.
- Đã làm: `npm ci --no-audit --no-fund` thành công (706 package); tạo `apps/web/.env.local` từ mẫu, đã được Git bỏ qua; chạy `npm run dev:web`.
- Xác minh: Vite v7.3.7 báo ready tại http://127.0.0.1:5173/; HTTP GET trang gốc và `/src/main.tsx` trả 200.
- File thay đổi: file môi trường local và sổ tiến độ; không sửa source nghiệp vụ.
- Giới hạn: trang trống vì React entry chưa triển khai; API/worker/container chưa chạy; chưa chạy test và chưa đo coverage. npm thông báo một số install scripts chưa được cho phép; chưa xác minh Prisma engine runtime.
- Trạng thái: chạy dev server DONE; mọi UC vẫn TODO. Tiếp theo: triển khai bootstrap/giao diện khi được yêu cầu.

### 16/10/2026 — Tạo khung dự án, chỉ cấu hình và file trống

- Yêu cầu: chuẩn bị folder/file và setup để vào code; không viết code ứng dụng.
- Đã làm: npm workspaces/lockfile; API/worker và 12 module; React/Vite và folder feature; platform, Prisma datasource, test/contracts/infra/scripts; cấu hình TypeScript/ESLint/Prettier/Jest/Vitest/Playwright; Compose PostgreSQL/MinIO/Mailpit và môi trường mẫu.
- File: package*.json, apps/, libs/, prisma/, tests/, contracts/, infra/, scripts/, .github/, cấu hình gốc, README.md, Docs/development-setup.md, Docs/project-specification.md và file này.
- Quyết định setup: npm workspaces, Vite cho React, NestJS 11/CommonJS, Prisma 6.19.0; không đổi quy tắc nghiệp vụ/schema/API.
- Xác minh: resolve lockfile thành công bằng `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`; `docker compose --env-file .env.example config --quiet`; `node --check` cấu hình JS; kiểm JSON, regex transform Jest và file nguồn ứng dụng rỗng; `git diff --check`.
- Chưa chạy: npm ci, typecheck/lint/build/test và browser/container runtime; chỉ tạo file theo yêu cầu. Chưa có bootstrap/model/test; coverage chưa đo, CI chưa có.
- Trạng thái: khung setup DONE; mọi UC vẫn TODO. Backend/database IN_PROGRESS vì mới có nền cấu hình; chưa có migration hay OpenAPI thực thi.
- Tiếp theo: cài dependency và bắt đầu bootstrap/model/contract khi có yêu cầu triển khai.

### 16/10/2026 — Khởi tạo tài liệu và quy tắc tiến độ

- Yêu cầu: tổng hợp database, chức năng, test, API từ báo cáo và thiết lập cập nhật tiến độ cho agent.
- Đã làm: tạo tài liệu tổng hợp, bảng tiến độ UC/hạ tầng và hướng dẫn bắt buộc ở gốc repo.
- File: `Docs/project-specification.md`, `Docs/agent-progress.md`, `AGENTS.md`.
- Xác minh: đối chiếu nội dung trích với báo cáo; kiểm đủ 25 bảng, 16 UC, TC01–TC60, EC01–EC40, mục API và liên kết tới các file tài liệu.
- Test ứng dụng: chưa chạy vì chưa có source, test và package manifest. Không kết luận nghiệp vụ, CI hoặc coverage đạt.
- Còn lại: toàn bộ triển khai và kiểm chứng ứng dụng; xem các bảng và bước tiếp theo.

## Mẫu nhật ký sau mỗi đợt code

Thêm mục mới theo mẫu và đồng thời cập nhật bảng trạng thái, công việc đang làm và bước tiếp theo.

```markdown
### YYYY-MM-DD HH:mm (Asia/Saigon) — Tên công việc

- Yêu cầu / mã FR, BR, UC, UI, TC, EC:
- Đã làm và hành vi thay đổi:
- File đã sửa:
- Database / migration / API thay đổi (hoặc không phát sinh):
- Kiểm tra thực chạy: lệnh, môi trường, kết quả, đường dẫn report.
- Kiểm tra chưa chạy và lý do:
- Trạng thái sau đợt code và bằng chứng:
- Lỗi còn mở / blocker / khác biệt với đặc tả:
- Bước tiếp theo:
```
