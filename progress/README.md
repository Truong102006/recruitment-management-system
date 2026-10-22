# Tiến độ chung hệ thống quản lý tuyển dụng

## Quy tắc báo cáo bắt buộc

1. **Đây là nơi ghi tiến độ chính thức của cả nhóm:** BE1, BE2, BE3, FE1, FE2, trưởng nhóm và AI hỗ trợ. Đọc file này và [AGENTS.md](../AGENTS.md) trước khi làm. [Sổ cũ](../Docs/agent-progress.md) chỉ giữ lịch sử trước khi chuyển sang file này.
2. Mỗi người ghi **tên thật hoặc GitHub username + vai trò**; nếu dùng AI, ghi thêm tên công cụ. Không ký tên thay người khác. Các ký hiệu BE1/BE2/BE3/FE1/FE2 trong bảng là vai trò theo báo cáo, chưa xác nhận tên từng người.
3. Trước khi bắt đầu, cập nhật đúng dòng công việc thành `IN_PROGRESS`, ghi nhánh và phạm vi. Sau mỗi đợt có thay đổi đáng kể hoặc trước khi kết thúc phiên làm việc, cập nhật bảng tổng quan, phần phối hợp và thêm báo cáo theo mẫu bên dưới vào **đầu nhật ký**, mới nhất trước.
4. Mỗi báo cáo có mã duy nhất `YYYYMMDD-HHmm-VAI_TRO-chu-de`, giờ Việt Nam `Asia/Saigon` (UTC+7). Giữ nguyên thứ tự các trường trong mẫu; không bỏ trường, ghi “Không phát sinh”, “Chưa có” hoặc “Chưa chạy — lý do” khi phù hợp. Riêng bản ghi lịch sử không lưu giờ dùng `khongro` thay HHmm và ghi rõ, không tự dựng giờ.
5. Trạng thái: `TODO` chưa làm; `IN_PROGRESS` đang làm hoặc mới xong một phần; `IN_REVIEW` đã kiểm tra và chờ review; `BLOCKED` có trở ngại cụ thể và điều kiện gỡ chặn; `DONE` đáp ứng tiêu chí của đúng phạm vi và có bằng chứng. Hoàn thành tài liệu không đồng nghĩa hoàn thành chức năng.
6. **Trạng thái công việc và tích hợp là hai thông tin riêng.** Ghi nhánh, commit/PR nếu đã có và “Chưa gộp main” hoặc “Đã gộp main”. Chỉ ghi đã gộp khi kiểm tra được commit trên main. Nếu commit của báo cáo chưa tồn tại, ghi “Commit chứa báo cáo này”, không bịa SHA. Trưởng nhóm/người merge cập nhật mục tích hợp sau khi merge.
7. Ghi rõ kiểm tra thực chạy: lệnh hoặc cách kiểm, môi trường, kết quả, đường dẫn report/log/CI nếu có; lỗi phải nêu đúng. Test chưa chạy ghi lý do; coverage chưa đo ghi “Chưa đo”. Không suy từ cấu hình test, SQL mẫu, HTTP 200 hoặc lời AI rằng hệ thống đã đạt.
8. Khi đổi DB/migration, API/DTO, quyền, trạng thái hoặc event, cập nhật [đặc tả](../Docs/project-specification.md) và [hợp đồng tích hợp](../Docs/be2-integration-contract.md) liên quan trong cùng PR, rồi ghi ảnh hưởng đến người khác và thứ tự triển khai. Theo tiêu chí nghiệm thu của đặc tả để đánh dấu chức năng `DONE`.
9. Không xóa báo cáo cũ hoặc ghi đè phần người khác. Nếu báo cáo sai, thêm bản đính chính có mã tham chiếu. Khi nhiều nhánh sửa file này, giữ đủ các báo cáo khi giải quyết conflict; bảng tổng quan phản ánh bằng chứng mới nhất. Không lấy toàn bộ phiên bản “ours/theirs” làm mất tiến độ bên kia.
10. Trước khi đưa lên GitHub, kiểm tra liên kết và diff; không đưa mật khẩu, token, dữ liệu ứng viên/CV thật vào báo cáo. Commit/push/merge theo quy trình nhóm và yêu cầu của người giao việc; file tiến độ không tự cấp quyền cho AI xuất bản.

## Mẫu báo cáo để sao chép

```markdown
### YYYY-MM-DD HH:mm (Asia/Saigon) — Vai trò — Tên công việc

- Mã báo cáo: YYYYMMDD-HHmm-VAI_TRO-chu-de
- Người thực hiện / AI hỗ trợ:
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng:
- Trạng thái: TODO | IN_PROGRESS | IN_REVIEW | BLOCKED | DONE
- Nhánh / commit / PR / tích hợp main:
- Đã hoàn thành: Nêu kết quả cụ thể và phần người dùng hoặc module khác có thể sử dụng.
- File / bằng chứng: Đường dẫn trong repo; liên kết commit, PR, CI hoặc report nếu đã có.
- Kiểm tra đã chạy: Lệnh/cách kiểm — môi trường — kết quả — report nếu có.
- Kiểm tra chưa chạy / coverage: Lý do; ghi Chưa đo nếu chưa đo coverage.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác:
- Phần còn thiếu / blocker: Nguyên nhân, ai cần phối hợp và điều kiện gỡ chặn; hoặc Không có trong phạm vi báo cáo.
- Bước tiếp theo:
```

## Tổng quan hiện tại

Cập nhật ngày **22/10/2026**: nền BE2 bước 2 đã được kiểm trên `feat/be2-contract-foundation` và push lên `main` tại `62215fc`. Repository có khung, tài liệu, transaction/port và contract BE2, cùng unit/contract test; chưa có chức năng nghiệp vụ chạy được, model/migration thực hoặc pipeline CI. Việc cài dependency và mở Vite ngày 16/10 là ghi nhận lịch sử ở môi trường trước, không xác nhận máy của mọi thành viên đã setup thành công.

Các công việc trên nhánh cá nhân chưa được báo cáo vào đây chưa được xác nhận. Mỗi thành viên cập nhật kết quả của mình kèm bằng chứng; không coi bảng TODO là kết luận người đó chưa làm gì ngoài main.

### Backend

| Mã | Chức năng | Phụ trách | Trạng thái triển khai trên main | Bằng chứng / phần còn thiếu |
|---|---|---|---|---|
| UC01 | Đăng tin tuyển dụng | BE1 | TODO | Chưa có API/test |
| UC02 | Nộp CV ứng tuyển | BE2 | TODO | Có DTO/schema/OpenAPI một phần và contract test nền; chưa có API/migration/integration test |
| UC03 | Phỏng vấn trực tuyến | BE3 | TODO | Chưa có API/provider test |
| UC04 | Đăng ký và xác thực | BE1 | TODO | Chưa có bootstrap/auth/test |
| UC05 | Tìm kiếm và xem tin | BE1 | TODO | Chưa có API/test |
| UC06 | Quản lý CV và thay CV đã nộp | BE2 | TODO | Có DTO/schema và port chọn CV; chưa có storage/scanner/API/integration test |
| UC07 | Xét duyệt và rút hồ sơ | BE2 | TODO | Có DTO/schema và port giao tiếp BE3; chưa có workflow/API/integration test |
| UC08 | Quản lý lịch phỏng vấn | BE3 | TODO | Chưa có API/test concurrency |
| UC09 | Công bố kết quả | BE3 | TODO | Có điểm nối BE2 trong contract; chưa có workflow/test |
| UC10 | Quản trị và kiểm duyệt | BE1 | TODO | Chưa có API/test |
| UC11 | Doanh nghiệp và thành viên | BE1 | TODO | Chưa có API/test |
| UC12 | Hồ sơ cá nhân | BE2 | TODO | Có DTO/schema và CandidateProfilePort; chưa có API/migration/integration test |
| UC13 | Đánh giá và hoàn tất phỏng vấn | BE3 | TODO | Chưa có API/test |
| UC14 | Lưu tin quan tâm | BE2 | TODO | Có contract thiết kế; chưa có API/test |
| UC15 | Thông báo | BE3 | TODO | Chưa có worker/API/test |
| UC16 | Thống kê tuyển dụng | BE3 | TODO | Chưa có read model/API/test |

### Frontend

Mỗi người tách thêm dòng theo mã UI khi bắt đầu một màn hình; không đánh dấu cả nhóm UI hoàn thành nếu mới xong một màn.

| Mã | Phạm vi | Phụ trách | Trạng thái trên main | Bằng chứng / phần còn thiếu |
|---|---|---|---|---|
| FE1 | UI01–UI12, UI24, UI29: tìm việc, auth, ứng viên, CV, hồ sơ, tin lưu, thông báo, lỗi chung | FE1 | TODO | Có cấu hình React/Vite; React entry, app/router còn trống |
| FE2 | UI13–UI23, UI25–UI28: lịch/video, doanh nghiệp, tin, hồ sơ, đánh giá/kết quả, thống kê, admin | FE2 | TODO | Chưa có màn hình hoặc E2E |

### Tài liệu và hạ tầng chung

| Mã | Hạng mục / người phụ trách | Trạng thái | Bằng chứng và phạm vi hoàn thành |
|---|---|---|---|
| DOC-01 | Đặc tả hệ thống / tác giả chưa được xác nhận trong sổ cũ | DONE | [Đặc tả](../Docs/project-specification.md), commit `ed9fe6d`; không phải kết quả nghiệm thu |
| SETUP-01 | Khung workspace và cấu hình / theo sổ cũ | DONE | Commit `9cded06`: npm workspaces, API/worker/web, cấu hình công cụ và Compose; source nghiệp vụ trống |
| LOCAL-01 | Clone dự án / BE2 + Codex | DONE | Đã clone vào `D:\Github Project\He_Thong_Tuyen_Dung`, nhánh main; kiểm trạng thái và file nguồn ngày 19/10 |
| DOC-02 | Contract tích hợp BE2 / BE2 + Codex | DONE | [Contract v1](../Docs/be2-integration-contract.md), commit `f0dd6e7` trên main; mức thiết kế |
| DOC-03 | Ghi chú AI BE1/BE3 / BE2 + Codex | DONE | [Ghi chú](../Docs/BE1-BE3_note.md), commit `f0dd6e7` trên main |
| DOC-04 | Sổ tiến độ chung / BE2 + Codex; cả nhóm cập nhật | DONE | File này và hướng dẫn liên quan trong commit chứa báo cáo; kiểm tra tài liệu, không phải test ứng dụng |
| BE-FOUNDATION | Bootstrap NestJS / BE1 | IN_PROGRESS | Có cấu hình và file bootstrap trống; chưa có server chạy |
| DB-01 | Prisma, 25 bảng, migration/seed / mỗi BE sở hữu phần mình, BE2 điều phối | IN_PROGRESS | Mới có datasource/generator và Compose; chưa có model/migration |
| CONTRACT-01 | Port, DTO, OpenAPI, event schema và contract test / cả ba BE | IN_PROGRESS | Đã có phần BE2 và contract test; còn BE1/BE3, OpenAPI đầy đủ, adapter và nghiệm thu liên module |
| BE2-STEP2 | Nền transaction và hợp đồng tích hợp / BE2 + Codex | DONE | Đã gộp `main` tại `62215fc`; [bàn giao](../Docs/be2-step2-handoff.md), 23 unit + 11 contract test đạt. DONE chỉ cho phạm vi nền bước 2, không phải UC |
| STORAGE-01 | Storage CV và scanner / BE2 | TODO | Chưa có adapter/worker scan/test |
| WORKER-01 | Outbox/email/worker / BE3; idempotency/transaction do BE2 phối hợp | TODO | Chưa triển khai |
| VIDEO-01 | Jitsi và thu hồi quyền phòng / BE3 | TODO | Chưa tích hợp/kiểm provider thật |
| QA-01 | Unit/integration/API/concurrency/FE/E2E / từng người theo phần mình | IN_PROGRESS | BE2: 23 unit + 11 contract test đạt, coverage nền 97,18% dòng và 100% nhánh; integration/API/concurrency/FE/E2E chưa chạy |
| CI-01 | Pipeline và evidence gate / BE1 điều phối, cả nhóm bổ sung | TODO | Chưa có workflow thực thi |
| OPS-01 | Hiệu năng, backup/restore và vận hành / BE3 điều phối, cả nhóm kiểm chứng | TODO | Chưa đo/chưa diễn tập |

## Phối hợp và bước tiếp theo

- BE2 đã bàn giao tài liệu contract và ghi chú cho hai AI ở `f0dd6e7`; BE1/BE3 đọc trước khi xây port phía mình.
- BE2 hoàn thành phạm vi nền bước 2 trên `feat/be2-contract-foundation` và đã đưa lên `main` tại `62215fc`: `UnitOfWork`/`Tx`, driver Prisma 6 dạng interface, thứ tự khóa, interface/stub, DTO/fixture, schema, OpenAPI UC02 một phần và contract test. Đã đối chiếu mục 4.3–4.5, 8.4 và 7.1 của báo cáo Word. Chưa có endpoint nghiệp vụ; migration application chờ nền BE1.
- BE1 cần cung cấp nền Identity/Company/Job/Skill và migration được tham chiếu; BE3 cần cung cấp InterviewLifecycle/Outbox. Đây là phụ thuộc đã biết, chưa có báo cáo tiến độ triển khai từ hai người trong sổ chung.
- Bước kế tiếp của BE2: nhận migration Identity/Company/Job/Skill và port BE1, viết migration/adapter BE2, triển khai lát cắt UC02 kèm PostgreSQL integration và concurrency test; sau đó ghép BE3 để kiểm withdraw/result. Các máy cần xác minh Node/npm/Docker và dependency khi bắt đầu chạy ứng dụng; không dùng kết quả setup của máy khác thay cho kiểm tra local.

## Nhật ký báo cáo

### 2026-10-22 16:15 (Asia/Saigon) — BE2 — Tích hợp nền bước 2 lên main

- Mã báo cáo: 20261022-1615-BE2-tich-hop-main
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-STEP2, CONTRACT-01, QA-01; nền cho UC02/06/07/12/14; mục 4.3–4.5, 7.1 và 8.4 báo cáo Word.
- Trạng thái: DONE — tích hợp phạm vi nền bước 2; các UC vẫn TODO.
- Nhánh / commit / PR / tích hợp main: `feat/be2-contract-foundation` → `main` / [62215fc](https://github.com/Truong102006/recruitment-management-system/commit/62215fc) / không có PR theo yêu cầu push main / Đã gộp main và push origin/main thành công.
- Đã hoàn thành: Fast forward từ `f4fe282` đến `62215fc`, push lên origin/main và cập nhật sổ/đặc tả trạng thái tích hợp; BE1/BE3/FE có thể đọc các contract chung trên main.
- File / bằng chứng: Commit `62215fc`; `progress/README.md`, `Docs/be2-integration-contract.md`, `Docs/project-specification.md` trong commit chứa báo cáo cập nhật này.
- Kiểm tra đã chạy: `git fetch origin --prune` trước gộp cho main local/remote 0/0; `git diff --cached --check` đạt; `git merge --ff-only feat/be2-contract-foundation` thành công; `git push origin main` trả `f4fe282..62215fc main -> main`. Unit/contract/typecheck/lint xem báo cáo 20261022-1612-BE2-nen-buoc-2.
- Kiểm tra chưa chạy / coverage: Không chạy lại test cho đính chính tài liệu sau push; coverage nền đã đo 97,18% dòng, 100% nhánh ở báo cáo trước. Integration/API/concurrency PostgreSQL và CI chưa chạy vì thiếu implementation/DB.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không thêm thay đổi kỹ thuật sau `62215fc`; chỉ cập nhật trạng thái tài liệu. Các nhóm lấy main mới để dùng interface/schema v1, tự triển khai adapter thuộc phạm vi mình.
- Phần còn thiếu / blocker: Phạm vi tích hợp bước 2 không còn; UC nghiệp vụ cần migration/port BE1 và BE3 thật, PostgreSQL và kiểm tích hợp. Trong đặc tả cũ có 5 liên kết hình ERD thiếu file media từ trước đợt này; không ảnh hưởng contract bước 2.
- Bước tiếp theo: BE2 triển khai migration/adapter và UC02; BE1/BE3 đối chiếu handoff trước khi nối service; kiểm lại origin/main sau commit tài liệu này.

### 2026-10-22 16:12 (Asia/Saigon) — BE2 — Hoàn thành nền bước 2 và chuẩn bị tích hợp main

- Mã báo cáo: 20261022-1612-BE2-nen-buoc-2
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-STEP2, CONTRACT-01, QA-01; nền cho UC02/06/07/12/14, BR01/07/09/13/18/20, mục 4.3–4.5, 7.1 và 8.4 báo cáo Word.
- Trạng thái: DONE — phạm vi nền bước 2; các UC vẫn TODO và CONTRACT-01 toàn nhóm còn IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `feat/be2-contract-foundation` từ `f4fe282` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo; người tích hợp cập nhật sau khi push.
- Đã hoàn thành: Nền transaction context/driver, thứ tự khóa, hash và interface idempotency; TypeScript port BE1/BE2/BE3, stub lỗi an toàn, DTO công khai và mapper allowlist; JSON Schema request/DTO, schema event, fixture và OpenAPI UC02 một phần; tài liệu bàn giao. Đính chính cột `user_account.full_name` theo báo cáo, giữ wire `name`/`version` theo API.
- File / bằng chứng: `libs/platform/database/`, `libs/platform/idempotency/`, `libs/contracts/`, `apps/api/src/modules/application/mappers/`, `contracts/schemas/be2.v1.json`, `contracts/events/be2.v1.json`, `contracts/openapi/be2-foundation.v1.json`, `contracts/fixtures/`, `tests/contract/`, `Docs/be2-step2-handoff.md`, `Docs/be2-integration-contract.md`, `Docs/project-specification.md`, `Docs/BE1-BE3_note.md`; report local trong `reports/backend/` (gitignored).
- Kiểm tra đã chạy: 22/10 trên Node 24.19.0/Windows: `node node_modules/typescript/bin/tsc -p tsconfig.backend.json --noEmit`, tương tự `apps/web/tsconfig.json` và `tsconfig.contract-public.json` đều đạt; `node node_modules/eslint/bin/eslint.js apps libs tests --max-warnings=0` đạt; Jest unit `--runInBand --ci --coverage` 23/23 đạt (4 suite), coverage nền 97,18% lines, 100% branches; Jest contract `--runInBand --ci` 11/11 đạt (1 suite).
- Kiểm tra chưa chạy / coverage: Chưa chạy PostgreSQL integration/API/concurrency, FE/E2E hoặc CI vì chưa có migration/endpoint/FE và DB runtime; coverage nêu trên chỉ cho code nền được Jest thu thập, không phản ánh độ phủ UC hoặc toàn website.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi DB/schema nghiệp vụ; bổ sung port/DTO/schema/event v1 và đặc tả một endpoint UC02. BE1/BE3/FE dùng file chung theo `Docs/be2-step2-handoff.md`; BE1 ánh xạ `name` từ `full_name` và thống nhất `X-CSRF-Token`; BE3 phải tính bằng chứng lịch cùng transaction và chỉ tiêu thụ event đã kiểm schema.
- Phần còn thiếu / blocker: Trong phạm vi bước 2 không còn; để triển khai UC cần migration/port thật của BE1, InterviewLifecycle/Outbox thật của BE3 và PostgreSQL. Driver Prisma chưa được kiểm với generated business client/DB thật.
- Bước tiếp theo: Tích hợp code bước 2 lên main theo yêu cầu, rồi triển khai migration/adapter và lát cắt UC02 khi nền BE1 sẵn sàng.

### 2026-10-20 17:01 (Asia/Saigon) — BE2 — Thiết lập sổ tiến độ chung

- Mã báo cáo: 20261020-1701-BE2-so-tien-do-chung
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: DOC-04, quy trình báo cáo toàn hệ thống BE1/BE2/BE3/FE1/FE2.
- Trạng thái: DONE — phạm vi tài liệu và quy tắc ghi tiến độ.
- Nhánh / commit / PR / tích hợp main: main / commit chứa báo cáo này / không tạo PR theo yêu cầu push trực tiếp; trạng thái xuất bản xác minh qua Git sau push.
- Đã hoàn thành: Tạo folder progress và sổ chung; quy tắc/mẫu đồng nhất, bảng BE/FE/hạ tầng, nhật ký kết quả đã biết; chuyển hướng dẫn cập nhật tiến độ sang sổ mới.
- File / bằng chứng: progress/README.md, AGENTS.md, README.md, Docs/agent-progress.md, Docs/BE1-BE3_note.md, Docs/development-setup.md.
- Kiểm tra đã chạy: Đọc source/nhật ký và đối chiếu commit f0dd6e7; fetch origin main trả local/remote 0 0 trước thay đổi. Kiểm liên kết của 6 file: không có liên kết local hỏng; 16 dòng UC, 4 báo cáo đủ 12 trường theo mẫu; đối chiếu phạm vi UI01–UI29; git diff --check đạt. Staged diff được kiểm lại trước commit.
- Kiểm tra chưa chạy / coverage: Test ứng dụng chưa chạy vì chỉ thay đổi tài liệu; coverage Chưa đo.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi nghiệp vụ; mọi thành viên/AI ghi tiến độ mới vào progress/README.md; Docs/agent-progress.md giữ làm lịch sử.
- Phần còn thiếu / blocker: Không có trong phạm vi tài liệu; thông tin triển khai trên nhánh riêng của thành viên khác chưa được cung cấp.
- Bước tiếp theo: Mọi người lấy main mới và báo cáo theo mẫu; BE2 chờ giao bước 2.

### 2026-10-20 16:40 (Asia/Saigon) — BE2 — Bàn giao contract và hướng dẫn AI lên main

- Mã báo cáo: 20261020-1640-BE2-contract-va-ban-giao
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 / Codex.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: DOC-02, DOC-03; thiết kế UC02/UC06/UC07/UC12/UC14 và điểm nối BE1/BE3.
- Trạng thái: DONE — tài liệu thiết kế; các UC chưa triển khai.
- Nhánh / commit / PR / tích hợp main: main / [f0dd6e7](https://github.com/Truong102006/recruitment-management-system/commit/f0dd6e7) / không có PR / Đã gộp main (push trực tiếp theo yêu cầu).
- Đã hoàn thành: Chốt ownership, port, transaction, thứ tự khóa/migration, API/DTO, idempotency/Outbox; ghi hướng dẫn riêng cho hai AI BE1/BE3, cập nhật đặc tả và sổ cũ.
- File / bằng chứng: Docs/be2-integration-contract.md, Docs/BE1-BE3_note.md, Docs/project-specification.md, Docs/agent-progress.md; commit trên.
- Kiểm tra đã chạy: Đối chiếu API/BR trong đặc tả; kiểm liên kết và git diff --cached --check đạt; push origin main thành công; git status sạch và main...origin/main trả 0 0.
- Kiểm tra chưa chạy / coverage: Chưa chạy test ứng dụng vì source nghiệp vụ còn trống; coverage Chưa đo.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Bổ sung chi tiết hợp đồng thiết kế và tên event v1; BE1/BE3 dùng để triển khai. Chưa có API/DB runtime.
- Phần còn thiếu / blocker: Chưa có port thực, OpenAPI/event schema hoặc contract test; chưa bắt đầu bước 2 BE2.
- Bước tiếp theo: Hiện thực contract khi được giao; phối hợp migration nền BE1.

### 2026-10-19 (chưa lưu giờ, Asia/Saigon) — BE2 — Clone và kiểm tra hiện trạng

- Mã báo cáo: 20261019-khongro-BE2-clone-kiem-tra
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 / Codex; không lưu giờ chính xác khi thực hiện.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: LOCAL-01, kiểm tra hiện trạng repository.
- Trạng thái: DONE — clone và khảo sát.
- Nhánh / commit / PR / tích hợp main: main / 1c9e43f lúc clone / không có PR / không sửa mã nguồn.
- Đã hoàn thành: Clone vào D:\Github Project\He_Thong_Tuyen_Dung; đọc cấu trúc, tài liệu và source; xác nhận React/API/worker entry trống, chưa có migration/test/CI.
- File / bằng chứng: Repository local; README.md, apps/web/src/main.tsx, apps/api/src/main.ts, prisma/schema.prisma; kết quả kiểm tra trong chat BE2.
- Kiểm tra đã chạy: git clone/status/log; thống kê 235 file tracked, 199 file rỗng (bao gồm file giữ chỗ), 0 test file, 0 migration thực, 0 workflow; kiểm Node v24.19.0.
- Kiểm tra chưa chạy / coverage: Chưa chạy ứng dụng vì môi trường thực thi không nhận npm và docker tại thời điểm kiểm tra; coverage Chưa đo.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không phát sinh.
- Phần còn thiếu / blocker: Cần xác minh lại công cụ local khi bắt đầu triển khai; không có blocker với việc clone.
- Bước tiếp theo: Đã thực hiện thiết kế contract ở báo cáo ngày 20/10.

### 2026-10-16 16:56 (Asia/Saigon) — Chung — Nhập lại mốc chuẩn bị dự án

- Mã báo cáo: 20261016-1656-CHUNG-khung-du-an
- Người thực hiện / AI hỗ trợ: Chưa xác nhận; tổng hợp từ sổ lịch sử, không gán công cho BE1/BE2/BE3.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: DOC-01, SETUP-01, tài liệu và cấu hình ban đầu.
- Trạng thái: DONE — phạm vi tài liệu/khung; mọi UC còn TODO.
- Nhánh / commit / PR / tích hợp main: main / ed9fe6d, 9cded06, 1c9e43f / PR chưa ghi nhận / các commit có trên main.
- Đã hoàn thành: Đặc tả 25 bảng, 16 UC và kế hoạch kiểm chứng; cấu hình npm workspaces API/worker/web, công cụ test và Compose; xuất bản repository.
- File / bằng chứng: [Sổ lịch sử](../Docs/agent-progress.md), Docs/project-specification.md, package.json, compose.yaml và các commit trên.
- Kiểm tra đã chạy: Theo sổ cũ: resolve lockfile, compose config, kiểm cấu hình; npm ci và mở Vite trả HTTP 200 ngày 16/10, trang trống; push GitHub thành công. Chưa chạy lại trong đợt tạo sổ này.
- Kiểm tra chưa chạy / coverage: Source nghiệp vụ, API/worker/container và test thực chưa có/ chưa chạy theo sổ cũ; coverage Chưa đo.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Chỉ thiết kế và khung; chưa có model/migration nghiệp vụ chạy được.
- Phần còn thiếu / blocker: Toàn bộ triển khai và nghiệm thu theo các bảng trên.
- Bước tiếp theo: Mỗi người cập nhật kết quả mới vào sổ chung này, giữ nguyên sổ cũ làm bằng chứng lịch sử.
