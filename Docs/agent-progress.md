# Tiến độ triển khai dành cho agent

> **Lưu trữ từ 20/10/2026:** mọi báo cáo tiến độ mới của BE1/BE2/BE3/FE1/FE2 và AI hỗ trợ được ghi tại [progress/README.md](../progress/README.md). Nội dung bên dưới giữ nguyên làm lịch sử; trạng thái và bước tiếp theo trong sổ cũ có thể đã thay đổi. Dùng quy tắc và mẫu trong sổ chung, không cập nhật song song hai sổ.

## Bối cảnh

Cập nhật gần nhất: 20/10/2026 16:39 (Asia/Saigon).

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
| Đồng bộ GitHub | DONE | origin/main đã nhận ed9fe6d và 9cded06; không đưa môi trường local/node_modules lên Git |
| Đặc tả tổng hợp | DONE | project-specification.md |
| Quy tắc và sổ tiến độ | DONE | ../AGENTS.md và file này |
| Khung workspace và cấu hình phát triển | DONE | package.json/lockfile, apps/api, apps/worker, apps/web, cấu hình công cụ; Docs/development-setup.md |
| Hợp đồng tích hợp BE2 phiên bản 1 | DONE | Docs/be2-integration-contract.md; đã đối chiếu đặc tả và kiểm tra liên kết/diff, mới là tài liệu thiết kế |
| Hướng dẫn AI BE1/BE3 | DONE | Docs/BE1-BE3_note.md; đã kiểm tra phạm vi giao việc, liên kết tài liệu và diff; chưa phải code ứng dụng |
| Backend NestJS/TypeScript | IN_PROGRESS | Có manifest và module/bootstrap trống; chưa cài dependency hoặc viết bootstrap |
| PostgreSQL/Prisma, 25 bảng, migration, seed | IN_PROGRESS | Có Compose và datasource/generator; chưa có model/constraint/migration thực |
| Storage CV và scanner | TODO | Chưa tích hợp |
| Outbox/email/idempotency/worker | TODO | Chưa triển khai |
| Jitsi và thu hồi quyền phòng | TODO | Chưa kiểm provider thật |
| FE1: UI01–UI12, UI24, UI29 | TODO | Có folder chức năng và cấu hình React/Vite; chưa có giao diện |
| FE2: UI13–UI23, UI25–UI28 | TODO | Có folder chức năng và cấu hình React/Vite; chưa có giao diện |
| OpenAPI và contract test | IN_PROGRESS | Đã chốt tài liệu hợp đồng tích hợp BE2 với BE1/BE3; chưa có OpenAPI, event schema hoặc contract test thực thi |
| Unit/integration/API/concurrency | TODO | TC01–TC60 và EC01–EC40 chưa thực thi |
| Frontend/E2E/accessibility | TODO | Ma trận FE chưa thực thi |
| CI/coverage/evidence gate | TODO | Chưa có pipeline và report |
| Hiệu năng/backup/restore/vận hành | TODO | Chưa đo và diễn tập |

## Công việc đang làm và trở ngại

- Đã chốt hợp đồng thiết kế BE2 cho UC02/UC06/UC07/UC12/UC14 và điểm nối UC08/UC09 tại Docs/be2-integration-contract.md; BE1/BE3 cần dùng khi triển khai port tương ứng. Chưa triển khai API, schema hay test.
- Đã viết ghi chú giao việc riêng cho AI hỗ trợ BE1 và BE3 tại Docs/BE1-BE3_note.md; hai người cần đọc trước khi triển khai trên nhánh riêng.
- Đợt tạo khung đã hoàn tất trong phạm vi chỉ setup, không viết code ứng dụng.
- Không có blocker GitHub; đã push tài liệu và khung setup lên origin/main. API/worker vẫn chưa chạy vì bootstrap/logic để trống theo yêu cầu.
- Đã khóa và cài dependency; Vite đã chạy, chưa có bootstrap API/worker hay giao diện.

## Bước tiếp theo

1. BE2 bắt đầu bước 2: hiện thực `UnitOfWork`/`Tx` và các interface/stub BE2 đã chốt, khóa contract fixture/DTO/event schema v1 để BE1 và BE3 có thể nối port; chưa viết thẳng luồng nghiệp vụ khi dependency chưa rõ.
2. BE1/BE3 hiện thực port phía mình theo Docs/BE1-BE3_note.md; review chéo các contract fixture và gộp migration theo thứ tự phụ thuộc.
3. BE2 triển khai migration Candidate/CV/Application và test constraint trên PostgreSQL thật sau migration BE1; sau đó từng UC cùng test, OpenAPI và evidence gate.
4. Bổ sung môi trường backend và bật dịch vụ khi bắt đầu code; frontend đã có .env.local và dependency.

## Nhật ký (mới nhất trước)

### 20/10/2026 16:39 (Asia/Saigon) — Hướng dẫn AI BE1/BE3 trước khi triển khai

- Hạng mục: phối hợp BE1/BE3 với BE2 trên FR05–FR08, FR13; UC01/UC02/UC03/UC04/UC05/UC06/UC07/UC08/UC09/UC10/UC11/UC12/UC13/UC14/UC15/UC16; BR01–BR20. Không đổi nghiệp vụ, schema, API hoặc test contract so với tài liệu chốt trước đó.
- Đã làm: mở rộng Docs/BE1-BE3_note.md thành hai phần giao việc riêng, thứ tự đọc AGENTS/đặc tả/contract/tiến độ, ranh giới port, migration, test, PR và review chéo; xác định bước 2 BE2 trong mục bước tiếp theo. File chưa có mã ứng dụng.
- File sửa: Docs/BE1-BE3_note.md, Docs/agent-progress.md; các thay đổi tài liệu từ lượt trước tại Docs/be2-integration-contract.md và Docs/project-specification.md sẽ được xuất bản cùng đợt theo yêu cầu người dùng.
- Kiểm tra thực chạy: `git fetch origin main` thành công; `git rev-list --left-right --count main...origin/main` trả `0 0`; kiểm file note có hai phần BE1/BE3, liên kết tương đối hợp lệ, không có khoảng trắng cuối dòng; `git diff --check` không báo lỗi.
- Test ứng dụng chưa chạy vì chỉ sửa tài liệu và source nghiệp vụ còn trống; coverage chưa đo. Chưa có kết quả CI/API để công bố.
- Trạng thái: hướng dẫn AI BE1/BE3 DONE ở mức tài liệu; mọi UC còn TODO; OpenAPI/contract test vẫn IN_PROGRESS. Bước tiếp theo: BE2 hiện thực `UnitOfWork`/port stub và contract fixture, sau đó migration/test phụ thuộc BE1.

### 20/10/2026 16:27 (Asia/Saigon) — Chốt hợp đồng tích hợp BE2 phiên bản 1

- Hạng mục: FR05–FR08, FR13; BR01–BR09, BR16–BR20; UC02/UC06/UC07/UC12/UC14 và giao điểm UC08/UC09; TC05–TC13, TC19, TC21–TC23, TC37–TC43, TC52; EC01–EC09, EC28–EC34, EC36, EC39–EC40.
- Đã làm: xác định ownership BE1/BE2/BE3, FK và thứ tự migration, contract port/transaction/khóa, DTO/HTTP, idempotency/Outbox/event v1, lỗi và test tích hợp. Không đổi quy tắc nghiệp vụ gốc hoặc endpoint đã liệt kê; bổ sung chi tiết hợp đồng và tên event v1 để triển khai.
- File sửa: Docs/be2-integration-contract.md (mới), Docs/project-specification.md (liên kết và ghi khác biệt với báo cáo), Docs/agent-progress.md. Không đổi database, API chạy được hoặc code ứng dụng.
- Kiểm tra thực chạy: đối chiếu các mục 3.1/3.2/4.3–4.5/5/7.1 của đặc tả; kiểm 13 mục bắt buộc trong tài liệu đều có, 1 liên kết tương đối hợp lệ; `git diff --check` không báo lỗi; xem `git status --short` và diff tài liệu.
- Test ứng dụng chưa chạy vì đây chỉ là thay đổi tài liệu và source nghiệp vụ còn trống; coverage chưa đo. Không có bằng chứng API/CI đạt.
- Trạng thái: hợp đồng thiết kế BE2 DONE, OpenAPI/contract test IN_PROGRESS, các UC vẫn TODO. Bước tiếp theo: hiện thực port/stub, event schema/OpenAPI và migration/test theo thứ tự phụ thuộc.

### 16/10/2026 16:56 (Asia/Saigon) — Đưa tài liệu và khung setup lên GitHub

- Hạng mục: hạ tầng Git; không đổi FR/BR/UC/UI/TC/EC hoặc hợp đồng API/database.
- Đã làm: commit tài liệu ed9fe6d và khung setup 9cded06; push origin main thành công, remote nhận 71c8334..9cded06.
- File sửa trong đợt này: sổ tiến độ và bỏ dòng trắng cuối thừa trong project-specification.md; không viết code ứng dụng.
- Kiểm tra thực chạy: git fetch origin; git check-ignore .env apps/web/.env.local node_modules; kiểm staged diff và git diff --cached --check; quét mẫu secret, kiểm môi trường mẫu chỉ có giá trị local giả; git push origin main thành công.
- Không đưa .env, apps/web/.env.local hoặc node_modules lên GitHub. Test ứng dụng chưa chạy vì chỉ xuất bản tài liệu/setup; coverage chưa đo, không kết luận CI đạt.
- Trạng thái: xuất bản GitHub DONE; không có blocker; mọi UC giữ TODO. Bước tiếp theo: triển khai bootstrap/model/contract theo đặc tả khi được yêu cầu.

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
