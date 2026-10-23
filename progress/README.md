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

**2026-10-23 11:02 (Asia/Saigon) — SHIP-CLOUD-01: DONE (phạm vi Git)** — Truong102006 / Codex: [PR #3](https://github.com/Truong102006/recruitment-management-system/pull/3) đã merge main tại `80cd120`; ba commit giữ riêng. Đã pull main; bản ghi tích hợp này chờ PR tài liệu trên `docs/cloud-main-integration`.

**23/10/2026 10:07 — SHIP-BE1: DONE (phạm vi Git)** — Truong102006 / BE1, Codex: [PR #1](https://github.com/Truong102006/recruitment-management-system/pull/1) đã merge vào main tại `ae869e70479f741596c58268002372315698911d`, giữ 12 commit nhỏ gồm tích hợp main và hai sửa tương thích. Backend/quality-gate cho push và PR đều đạt. BE1 nghiệp vụ vẫn IN_PROGRESS do còn binding/provider và nghiệm thu toàn hệ thống. Bản ghi tích hợp này trên `docs/be1-main-integration`, chờ PR tài liệu.

**BE1 hiện có trên main:** Identity/Company/Job/Admin, migration BE1 và CI backend đã tích hợp qua PR #1; [kiểm chứng](../Docs/be1-verification.md). Kết quả hosted mới: 316 unit, 108 integration (gồm 23 contract); coverage tập source cấu hình 92,45% dòng / 76,93% nhánh. Còn runtime BE2/BE3/provider và nghiệm thu operations/dependency audit; không đánh DONE toàn BE1. Các nhật ký bên dưới giữ nguyên trạng thái lịch sử lúc thực hiện.

Cập nhật ngày **23/10/2026**: nền BE2, kế hoạch BE1/BE3, quy tắc thuần và các bước BE2 2–6 đã tích hợp trên `main` (`6de3918`, `57bcbbe`, `9ae1f4e`, `3123e75`, `c874fbb`); sửa đường xử lý sự kiện xóa CV tại `eeadd96`. BE2 đạt 91 unit + 13 contract test cho code hiện có. Có model và SQL BE2 chờ bảng nền BE1; chưa có migration PostgreSQL đã áp dụng, route API nghiệp vụ chạy được hoặc pipeline CI. Việc cài dependency và mở Vite ngày 16/10 là ghi nhận lịch sử ở môi trường trước, không xác nhận máy của mọi thành viên đã setup thành công.

Các công việc trên nhánh cá nhân chưa được báo cáo vào đây chưa được xác nhận. Mỗi thành viên cập nhật kết quả của mình kèm bằng chứng; không coi bảng TODO là kết luận người đó chưa làm gì ngoài main.

### Backend

| Mã   | Chức năng                      | Phụ trách | Trạng thái công việc (xem tích hợp) | Bằng chứng / phần còn thiếu                                                                                                                                                        |
| ---- | ------------------------------ | --------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UC01 | Đăng tin tuyển dụng            | BE1       | IN_PROGRESS                         | Source main PR #1: runtime DTO, account→company→job locks, recheck quyền, publish/close Outbox fail-closed; gate local đạt. Đã gộp main PR #1; còn BE2 lifecycle integration/FE.   |
| UC02 | Nộp CV ứng tuyển               | BE2       | IN_PROGRESS                         | Đã có workflow điều phối và lát cắt ghi trên `main` (`c874fbb`); chưa có BE1/BE3 binding, API/migration/integration test                                                           |
| UC03 | Phỏng vấn trực tuyến           | BE3       | TODO                                | Chưa có API/provider test                                                                                                                                                          |
| UC04 | Đăng ký và xác thực            | BE1       | IN_PROGRESS                         | Source main PR #1: durable verification, account/token locks, CSRF/session/Origin và rollback tests đạt. Đã gộp main PR #1; profile/mail runtime và HTTPS browser chưa nghiệm thu. |
| UC05 | Tìm kiếm và xem tin            | BE1       | IN_PROGRESS                         | Source main PR #1: public scope/verified owner/query DTO và validation tests đạt. Đã gộp main PR #1; còn load/FE nghiệm thu.                                                       |
| UC06 | Quản lý CV và thay CV đã nộp   | BE2       | IN_PROGRESS                         | Có workflow kho CV trên `main` (`3123e75`); còn provider storage/scanner, phần thay CV và API/integration test                                                                     |
| UC07 | Xét duyệt và rút hồ sơ         | BE2       | IN_PROGRESS                         | BE2 đang triển khai workflow/query trên `feat/be2-remaining-work`; phần hủy lịch nguyên tử chờ BE3                                                                                 |
| UC08 | Quản lý lịch phỏng vấn         | BE3       | TODO                                | Chưa có API/test concurrency                                                                                                                                                       |
| UC09 | Công bố kết quả                | BE3       | TODO                                | Có điểm nối BE2 trong contract; chưa có workflow/test                                                                                                                              |
| UC10 | Quản trị và kiểm duyệt         | BE1       | IN_PROGRESS                         | Admin PATCH/read/recovery/last ADMIN/atomic rollback có test PostgreSQL. Đã gộp main PR #1; actual BE3 revoke intent/provider/scope còn thiếu.                                     |
| UC11 | Doanh nghiệp và thành viên     | BE1       | IN_PROGRESS                         | Source main PR #1: sorted account locks, verified OWNER, không ADMIN bypass; tests đạt. Đã gộp main PR #1; conflict/schedule runtime BE2/BE3 còn thiếu.                            |
| UC12 | Hồ sơ cá nhân                  | BE2       | IN_PROGRESS                         | Có service/repository BE2, unit/contract test và OpenAPI GET/PATCH; chưa đăng ký route do thiếu guard/port BE1, migration PostgreSQL và API/integration test                       |
| UC13 | Đánh giá và hoàn tất phỏng vấn | BE3       | TODO                                | Chưa có API/test                                                                                                                                                                   |
| UC14 | Lưu tin quan tâm               | BE2       | IN_PROGRESS                         | BE2 đang triển khai repository/service trên `feat/be2-remaining-work`; chưa có API/test                                                                                             |
| UC15 | Thông báo                      | BE3       | TODO                                | Chưa có worker/API/test                                                                                                                                                            |
| UC16 | Thống kê tuyển dụng            | BE3       | TODO                                | Chưa có read model/API/test                                                                                                                                                        |

### Frontend

Mỗi người tách thêm dòng theo mã UI khi bắt đầu một màn hình; không đánh dấu cả nhóm UI hoàn thành nếu mới xong một màn.

| Mã  | Phạm vi                                                                                       | Phụ trách | Trạng thái trên main | Bằng chứng / phần còn thiếu                               |
| --- | --------------------------------------------------------------------------------------------- | --------- | -------------------- | --------------------------------------------------------- |
| FE1 | UI01–UI12, UI24, UI29: tìm việc, auth, ứng viên, CV, hồ sơ, tin lưu, thông báo, lỗi chung     | FE1       | TODO                 | Có cấu hình React/Vite; React entry, app/router còn trống |
| FE2 | UI13–UI23, UI25–UI28: lịch/video, doanh nghiệp, tin, hồ sơ, đánh giá/kết quả, thống kê, admin | FE2       | TODO                 | Chưa có màn hình hoặc E2E                                 |

### Tài liệu và hạ tầng chung

| Mã            | Hạng mục / người phụ trách                                                        | Trạng thái  | Bằng chứng và phạm vi hoàn thành                                                                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-01        | Đặc tả hệ thống / tác giả chưa được xác nhận trong sổ cũ                          | DONE        | [Đặc tả](../Docs/project-specification.md), commit `ed9fe6d`; không phải kết quả nghiệm thu                                                                                                                       |
| SETUP-01      | Khung workspace và cấu hình / theo sổ cũ                                          | DONE        | Commit `9cded06`: npm workspaces, API/worker/web, cấu hình công cụ và Compose; source nghiệp vụ trống                                                                                                             |
| LOCAL-01      | Clone dự án / BE2 + Codex                                                         | DONE        | Đã clone vào `D:\Github Project\He_Thong_Tuyen_Dung`, nhánh main; kiểm trạng thái và file nguồn ngày 19/10                                                                                                        |
| DOC-02        | Contract tích hợp BE2 / BE2 + Codex                                               | DONE        | [Contract v1](../Docs/be2-integration-contract.md), commit `f0dd6e7` trên main; mức thiết kế                                                                                                                      |
| DOC-03        | Ghi chú AI BE1/BE3 / BE2 + Codex                                                  | DONE        | [Ghi chú](../Docs/BE1-BE3_note.md), commit `f0dd6e7` trên main                                                                                                                                                    |
| DOC-04        | Sổ tiến độ chung / BE2 + Codex; cả nhóm cập nhật                                  | DONE        | File này và hướng dẫn liên quan trong commit chứa báo cáo; kiểm tra tài liệu, không phải test ứng dụng                                                                                                            |
| DOC-05        | Kế hoạch triển khai toàn bộ BE3 / Codex hỗ trợ BE3, chưa xác nhận người phụ trách | DONE        | [Kế hoạch 8 pha](../plans/261022-1652-be3-complete-implementation/plan.md), [rà soát](../plans/261022-1652-be3-complete-implementation/reports/plan-review.md); Đã tích hợp main; 6 UC chưa triển khai            |
| DOC-06        | Kế hoạch triển khai toàn bộ BE1 / Codex hỗ trợ BE1, chưa xác nhận người phụ trách | DONE        | [Kế hoạch 8 pha](../plans/261022-1711-be1-complete-implementation/plan.md), [rà soát](../plans/261022-1711-be1-complete-implementation/reports/plan-review.md); Đã tích hợp main; 5 UC chưa triển khai            |
| BE-FOUNDATION | Bootstrap NestJS / BE1                                                            | IN_PROGRESS | API bootstrap đã tích hợp main PR #1; clean CI build/API tests đạt. Runtime liên nhóm và HTTPS/FE acceptance chưa nghiệm thu.                                                                                     |
| DB-01         | Prisma/migration/seed / mỗi BE sở hữu phần mình                                   | IN_PROGRESS | 9 bảng BE1 + additive email_verified_at; PostgreSQL constraints/migration smoke đạt local. Chưa gộp main; thiếu owner schema/runtime permission/historical upgrade.                                               |
| CLOUD-DB-01   | Shared PostgreSQL cloud / Codex BE1                                               | DONE        | Runtime cloud/test local configuration and team instructions integrated through PR #3 at `80cd120`; guard 3/3 and hosted CI pass. Credentials remain ignored.                                                     |
| CONTRACT-01   | Port, DTO, OpenAPI, event schema và contract test / cả ba BE                      | IN_PROGRESS | Đã có phần BE2; BE1 đang triển khai Phase 1 contract, schema và test trên nhánh `feat/be1-implementation`                                                                                                         |
| BE2-STEP2     | Nền transaction và hợp đồng tích hợp / BE2 + Codex                                | DONE        | Đã gộp `main` tại `62215fc`; [bàn giao](../Docs/be2-step2-handoff.md), 23 unit + 11 contract test đạt. DONE chỉ cho phạm vi nền bước 2, không phải UC                                                             |
| STORAGE-01    | Storage CV và scanner / BE2                                                       | IN_PROGRESS | Có port và service/repository quarantine/quét/xóa, unit test; còn provider PDF/scanner, object store, worker/reconciliation, API và test PostgreSQL                                                               |
| BE2-CV-07     | Thay CV đã nộp / BE2 + Codex                                                      | DONE        | Workflow/repository cho thay trực tiếp, đề nghị, duyệt/từ chối, idempotency, history/outbox; 3 unit + 13 contract đạt trên `feat/be2-remaining-work`. UC06 tổng thể còn IN_PROGRESS. |
| BE2-APP-08    | Xem, xét duyệt và rút hồ sơ / BE2 + Codex                                        | DONE        | Workflow review/withdraw và query scope/history; 5 unit đạt trên `feat/be2-remaining-work`. Chỉ DONE cho code độc lập; UC07 vẫn IN_PROGRESS vì thiếu BE3/API/DB test. |
| WORKER-01     | Outbox/email/worker / BE3; idempotency/transaction do BE2 phối hợp                | TODO        | Chưa triển khai                                                                                                                                                                                                   |
| VIDEO-01      | Jitsi và thu hồi quyền phòng / BE3                                                | TODO        | Chưa tích hợp/kiểm provider thật                                                                                                                                                                                  |
| QA-01         | Unit/integration/API/concurrency/FE/E2E / từng owner                              | IN_PROGRESS | Main PR #1: hosted 35 suites/316 unit, 13 suites/108 integration (gồm23 contract), evidence8 đạt; coverage92,45% dòng/76,93% nhánh. FE-E2E/runtime/provider còn thiếu. [Bằng chứng](../Docs/be1-verification.md). |
| CI-01         | Pipeline và evidence gate / BE1 điều phối                                         | IN_PROGRESS | Main PR #1: CI push39893005258 và PR39893010843 đạt backend+quality-gate, gồm fixed inventory/XML/coverage/migration/evidence. Còn full negative-controls hosted, FE-E2E và required branch check.                |
| SHIP-CLOUD-01 | Publish cloud/test setup and remaining local formatting / Truong102006 + Codex    | DONE        | PR #3 merged main at `80cd120`; push run 39897893529 and PR run 39897927225 pass; main pulled.                                                                                                                    |
| SHIP-BE1      | Chia commit, push và merge PR / Truong102006 + Codex                              | DONE        | PR #1 đã merge main tại ae869e7; 12 commit được push từng đợt, bảo toàn source/model/lịch sử BE2. DONE chỉ cho Git publishing.                                                                                    |
| OPS-01        | Hiệu năng, backup/restore và vận hành / BE3 điều phối, cả nhóm kiểm chứng         | TODO        | Chưa đo/chưa diễn tập                                                                                                                                                                                             |

## Phối hợp và bước tiếp theo

- SHIP-CLOUD-01 DONE phạm vi xuất bản: PR #3 đã merge main; CI push/PR đều đạt. Không có blocker Git. Tiếp theo: merge bản ghi tích hợp rồi pull main lần cuối; các hạn chế nghiệp vụ BE1/BE2/BE3 giữ nguyên.

- 23/10/2026 10:48 — CLOUD-DB-01 DONE phạm vi cấu hình: DATABASE_URL runtime là Neon, test dùng local và chặn cloud. Neon ban đầu rỗng,2 migration đã deploy; không chuyển dữ liệu local/seed. Thành viên nhận URL riêng, làm theo Docs/cloud-database-setup.md. Code cấu hình test/docs chưa commit/push; BE2 SQL pending vẫn chưa deploy.

- 23/10/2026 — Codex/BE1: CLOUD-DB-01 IN_PROGRESS, cấu hình Neon dùng chung theo URL người dùng cung cấp; giữ local cho test, không seed/reset dữ liệu cloud. Đang kiểm tra kết nối/schema trước migrate; chưa commit/push.

- 23/10/2026 10:07 — Truong102006 / BE1 / Codex: SHIP-BE1 DONE, PR #1 đã merge `ae869e7`; BE2 source/model/nhật ký trên main được bảo toàn. CI push [39893005258](https://github.com/Truong102006/recruitment-management-system/actions/runs/39893005258) và PR [39893010843](https://github.com/Truong102006/recruitment-management-system/actions/runs/39893010843) đều đạt backend + quality-gate. Tiếp theo review/bind runtime BE2/BE3 và nghiệm thu provider/vận hành; bản ghi thực tế được xuất bản qua PR tài liệu riêng.

- Lịch sử 23/10/2026 10:00 — SHIP-BE1 lúc bắt đầu IN_PROGRESS: đã kiểm tra secret signature 178 file, `.env` được ignore; giữ các thay đổi định dạng/cấu hình cá nhân ngoài commit. Trạng thái mới nhất xem bản ghi 10:07 phía trên.

- 23/10/2026 00:29 — Codex/BE1: gate local đạt248 unit/106 integration/21 contract (contract đã tính trong integration), coverage91.88%/73.60%, evidence/migration/typecheck/lint/build đạt. Còn runtime BE2/BE3/Jitsi, hosted CI/operations và dependency audit; xem Docs/be1-verification.md. Chưa commit/chưa gộp main.

- 23/10/2026 00:23 — Codex/BE1: UC01/04/05/10/11, QA-01/CI-01 IN_PROGRESS trên `feat/be1-implementation`. Hoàn thiện Admin/security/CI và chạy gate cuối; còn runtime BE2/BE3/provider, CI/operations và dependency audit. Chưa commit/chưa gộp main.

- 22/10/2026: BE1 tạo nhánh `feat/be1-implementation` để thực hiện toàn bộ 8 pha theo kế hoạch `plans/261022-1711-be1-complete-implementation/plan.md`. Bắt đầu từ Phase 1 (Chốt contract, port, schema, OpenAPI, event v1, test contract), tiếp theo là Phase 2 (Bootstrap NestJS & 9 bảng DB migration/seed), rồi lần lượt Phase 3–8.
- 22/10/2026: DOC-06 đã hoàn thành kế hoạch BE1: 8 pha, inventory file/class/port/API, pseudocode auth/membership/admin, 15 gate A01–A15 và ma trận test. Đã bổ sung liên kết/milestone hai chiều BE3 và quy tắc dùng chung scripts CI/evidence. Đã tích hợp lên main.
- 22/10/2026: DOC-05 đã hoàn thành kế hoạch BE3: 8 pha, blueprint code/API/transaction, 13 quyết định contract cần chốt, ma trận test và review. Đã tích hợp lên main.
- Giới hạn tài liệu đã xác minh: đặc tả đang tham chiếu 5 ảnh `Docs/Bao_Cao_SE113_media/image16.png`–`image20.png` chưa có từ HEAD trước thay đổi. Không tạo ảnh thay thế; không coi mọi liên kết đặc tả đạt. Link tiến độ trong phần mở đầu đặc tả đã sửa về sổ chung, giữ sổ cũ làm lịch sử.
- BE2 đã bàn giao tài liệu contract và ghi chú cho hai AI ở `f0dd6e7`; BE1/BE3 đọc trước khi xây port phía mình.
- BE2 hoàn thành phạm vi nền bước 2 trên `feat/be2-contract-foundation` và đã đưa lên `main` tại `62215fc`: `UnitOfWork`/`Tx`, driver Prisma 6 dạng interface, thứ tự khóa, interface/stub, DTO/fixture, schema, OpenAPI UC02 một phần và contract test. Đã đối chiếu mục 4.3–4.5, 8.4 và 7.1 của báo cáo Word. Chưa có endpoint nghiệp vụ; migration application chờ nền BE1.
- BE2 đã hoàn thành và kiểm phần quy tắc nghiệp vụ thuần trên `feat/be2-domain-rules` theo UC06/UC07/UC09 và mục 3.2 báo cáo; đã gộp/push `main` tại `f7e8223`. Phạm vi bước 1 chỉ là hàm thuần, không phải UC/API đã chạy.
- BE2 đã tích hợp ba bước mới trên `main`: model/SQL pending (`6de3918`), repository/idempotency nội bộ (`57bcbbe`) và UC12 phần độc lập/OpenAPI (`9ae1f4e`). Chưa có migration chạy hoặc route HTTP; UC02 vẫn TODO, UC12 IN_PROGRESS.
- 23/10/2026: BE2 đã push bước 5 kho CV (`3123e75`) và bước 6 điều phối nộp hồ sơ (`c874fbb`) lên `main`. UC02/UC06 vẫn IN_PROGRESS; port BE1/BE3, provider PDF/scanner/S3, migration, route và integration test chưa có. Không dùng fake scanner của unit test ở môi trường vận hành.
- BE1 cần cung cấp nền Identity/Company/Job/Skill và migration được tham chiếu; BE3 cần cung cấp InterviewLifecycle/Outbox. Đây là phụ thuộc đã biết.
- Bước kế tiếp của BE2: nối S3/scanner thật, worker/reconciliation và route CV sau khi có guard BE1; nhận migration Identity/Company/Job/Skill và port BE1, viết migration/adapter BE2, kiểm UC02 bằng PostgreSQL/API/concurrency; ghép BE3 Outbox để kiểm rollback và phát event.
- Bước kế tiếp của BE1: nhận và bind runtime ports BE2/BE3; chạy actual cross-owner/provider/HTTPS acceptance, CI GitHub/negative controls/load/restore/runtime DB permissions và xử lý dependency audit theo owner. Source và gate local đã có bằng chứng; chưa gộp main.

## Nhật ký báo cáo

### 2026-10-23 12:00 (Asia/Saigon) — BE2 — Bước 8 xét duyệt và rút hồ sơ

- Mã báo cáo: 20261023-1200-BE2-xet-duyet-rut
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-APP-08, UC07, BR08–BR09, TC19/TC43, EC05/EC08–EC09/EC32–EC33 ở phạm vi unit.
- Trạng thái: DONE — workflow/query độc lập; UC07 tổng thể IN_PROGRESS vì BE3 chưa có và chưa có API/DB test.
- Nhánh / commit / PR / tích hợp main: `feat/be2-remaining-work` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo.
- Đã hoàn thành: Review theo cạnh trạng thái, hủy đề nghị CV khi rời SCREENING; withdraw gọi BE3 hủy lịch trong cùng transaction trước ghi WITHDRAWN; query danh sách/chi tiết/history theo candidate hoặc company scope, map DTO công khai.
- File / bằng chứng: `apps/api/src/modules/application/services/review-application-workflow.service.ts`, `services/application-read.service.ts`, `repositories/application-query.repository.ts` và test tương ứng.
- Kiểm tra đã chạy: Jest 5/5 unit ở hai suite mới; ESLint/Prettier file bước 8 đạt trên Windows/Node 24.
- Kiểm tra chưa chạy / coverage: PostgreSQL/API/concurrency và BE3 thật chưa chạy; coverage chưa đo; toàn suite chờ gate cuối.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi SQL/endpoint; xác định `InterviewLifecyclePort.cancelOpenForApplication` phải cùng transaction, recheck lock scope và rollback khi lỗi. FE dùng DTO candidate hiện có sau khi route được nối.
- Phần còn thiếu / blocker: BE3 lifecycle/outbox thật, module/controller/guard, migration BE2 và integration test.
- Bước tiếp theo: Commit bước 8; triển khai UC14 lưu tin quan tâm.

### 2026-10-23 11:57 (Asia/Saigon) — BE2 — Bước 7 thay CV đã nộp

- Mã báo cáo: 20261023-1157-BE2-thay-cv
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-CV-07, UC06, BR07–BR08, TC10–TC13, EC04–EC07 ở phạm vi unit/contract.
- Trạng thái: DONE — lát cắt workflow BE2; UC06 tổng thể IN_PROGRESS vì API/provider/DB integration còn thiếu.
- Nhánh / commit / PR / tích hợp main: `feat/be2-remaining-work` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo.
- Đã hoàn thành: Thay current CV ở SUBMITTED giữ original; tạo PENDING ở SCREENING; recruiter duyệt/từ chối với hai version; history và event trong transaction; Idempotency-Key cho lệnh ứng viên; rollback khi Outbox lỗi.
- File / bằng chứng: `apps/api/src/modules/application/repositories/application-workflow.repository.ts`, `services/cv-change-workflow.service.ts`, `services/cv-change-workflow.service.spec.ts`, `contracts/events/be2.v1.json`, `tests/contract/be2-contract.spec.ts`.
- Kiểm tra đã chạy: Jest 3/3 unit của workflow và 13/13 contract BE2; ESLint file liên quan đạt; Prettier source/event đạt trên Windows/Node 24; `git diff --check` đạt.
- Kiểm tra chưa chạy / coverage: Toàn suite, PostgreSQL/API/concurrency chưa chạy; coverage chưa đo. Dependency cũ trên máy chưa đồng bộ sau pull BE1, đang xử lý trước gate cuối.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi SQL/endpoint; thêm hai event v1 `application.cv_change_requested`/`application.cv_change_rejected` chỉ mang applicationId. BE3 cần cập nhật consumer/fixture trước khi nối Outbox.
- Phần còn thiếu / blocker: API/guard/binding, migration BE2/PostgreSQL và Outbox BE3 thật; UC06 chưa nghiệm thu.
- Bước tiếp theo: Commit riêng bước 7, tiếp tục bước 8 xét duyệt/rút hồ sơ.

### 2026-10-23 11:02 (Asia/Saigon) — BE1 — Tích hợp cấu hình cloud/test lên main

- Mã báo cáo: 20261023-1102-BE1-ship-cloud-main
- Người thực hiện / AI hỗ trợ: Truong102006 / Codex.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: SHIP-CLOUD-01, CLOUD-DB-01, QA-01; xuất bản các thay đổi local còn lại.
- Trạng thái: DONE (phạm vi xuất bản Git).
- Nhánh / commit / PR / tích hợp main: `chore/shared-cloud-db-setup`; `ca87791`, `fc20cf2`, `cc8572d`; [PR #3](https://github.com/Truong102006/recruitment-management-system/pull/3) đã merge main tại `80cd120b4a5847a0a5b50d02881f4a457f3917a8`. Bản ghi này trên `docs/cloud-main-integration`, chưa gộp tại thời điểm viết.
- Đã hoàn thành: chia ba commit và push từng đợt; tích hợp guard test database local, tài liệu Neon và formatting còn lại; pull main bằng `--ff-only`. Không đưa .env/.env.test lên Git.
- File / bằng chứng: 25 file trong PR #3; [CI push](https://github.com/Truong102006/recruitment-management-system/actions/runs/39897893529), [CI PR](https://github.com/Truong102006/recruitment-management-system/actions/runs/39897927225).
- Kiểm tra đã chạy: local guard 3/3, typecheck, lint, lint script, build, diff check và quét chữ ký secret trên toàn bộ file tracked đạt. Hosted CI: 316 unit, 108 integration (có 23 contract), 23 contract chạy riêng, 8 evidence, guard 3/3; migration smoke và evidence gate đạt. Rà liên kết tài liệu không có liên kết mới hỏng.
- Kiểm tra chưa chạy / coverage: coverage hosted 92,45% dòng / 76,93% nhánh trên tập source cấu hình; không chạy FE/E2E hoặc nghiệm thu toàn hệ thống vì ngoài phạm vi xuất bản.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: test Jest chặn database remote; runtime dùng URL riêng của từng máy. Không đổi schema/API; không chạy migration, seed hay reset cloud trong đợt xuất bản.
- Phần còn thiếu / blocker: không có blocker Git. Năm ảnh ERD image16–20 thiếu từ trước trên origin/main trong đặc tả; không phát sinh từ PR này. Các thiếu hụt runtime/provider ghi trước vẫn giữ nguyên.
- Bước tiếp theo: PR bản ghi tích hợp này, chờ CI, merge rồi pull main mới nhất; giữ dữ liệu và file môi trường riêng.

### 2026-10-23 10:58 (Asia/Saigon) - BE1 - Publish cloud/test configuration

- Report ID: 20261023-1058-BE1-ship-cloud-start
- Owner / AI: Truong102006 / Codex.
- Scope: SHIP-CLOUD-01, CLOUD-DB-01, QA-01; remaining tooling and BE3 document formatting.
- Status: IN_PROGRESS
- Branch / commit / PR / main: `chore/shared-cloud-db-setup`; not merged.
- Completed: created branch; verified active GitHub account and ignored .env/.env.test; added guard tests to CI.
- Files / evidence: Jest config, scripts/database/test-environment*, .github/workflows/ci.yml, cloud setup/spec/progress docs and remaining formatting diff.
- Checks executed: guard tests 3/3; typecheck and lint pass; git diff/check-ignore/fetch and gh auth status pass.
- Checks pending / coverage: build running; hosted CI pending; coverage not measured this session.
- DB / API / contract impact: test database restricted to local; runtime cloud credentials remain ignored; no schema/API changes or cloud migration.
- Remaining / blockers: no blocker; pending commits, push, hosted CI, merge and main pull.
- Next: split conventional commits and open PR.

### 2026-10-23 10:48 (Asia/Saigon) — BE1 — Kết nối Neon dùng chung, giữ test local

- Mã báo cáo: 20261023-1048-BE1-cloud-database-setup
- Người thực hiện / AI hỗ trợ: Codex hỗ trợ BE1 theo URL người dùng cung cấp; không ghi secret vào báo cáo.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: CLOUD-DB-01, DB-01, QA-01; cấu hình môi trường development/test.
- Trạng thái: DONE cho kết nối/config/migration hiện có; không phải DONE nghiệp vụ toàn hệ thống.
- Nhánh / commit / PR / tích hợp main: Working tree `main`, thay đổi phiên này chưa commit/push; không tự tạo PR hoặc xuất bản từ yêu cầu cấu hình database. Secret chỉ trong `.env` bị gitignore.
- Đã hoàn thành: Thêm URL cloud và đặt DATABASE_URL runtime tới Neon; giữ TEST_DATABASE_URL/MIGRATION_TEST_DATABASE_URL local và `.env.test`. Kết nối Neon PostgreSQL18.6 thực, xác nhận database ban đầu không có bảng rồi apply2 migrations BE1. Hiện10 bảng gồm9 bảng BE1 + bảng migration,0 user; sau DB test local cloud vẫn0 user. Jest setupFiles dùng local URL, chặn hostname cloud trước import Prisma/Nest; thêm guard regression và ESLint CommonJS config phù hợp. Không reset, seed hoặc chuyển dữ liệu local.
- File / bằng chứng: `.env`/`.env.test` riêng bị gitignore; `.env.example`, `jest.config.cjs`, `scripts/database/test-environment.cjs`, `scripts/database/test-environment.test.cjs`, `eslint.config.mjs`, [hướng dẫn cloud](../Docs/cloud-database-setup.md), `Docs/project-specification.md`; kết quả thực trong output phiên này.
- Kiểm tra đã chạy: Prisma SELECT kết nối cloud + danh sách bảng/users/migrations PASS; `node --env-file=.env node_modules/prisma/build/index.js migrate deploy` PASS2migration; `migrate status` schema up-to-date. Test host sau setup127.0.0.1; `npm run test:integration:ci -- --runTestsByPath tests/integration/be1/identity-schema.spec.ts` PASS1suite/6tests local. `node --test scripts/database/test-environment.test.cjs` PASS3tests; targeted ESLint/Prettier và git diff--check PASS. `git check-ignore .env .env.test` PASS.
- Kiểm tra chưa chạy / coverage: Chưa chạy toàn unit/integration/coverage vì chỉ đổi cấu hình môi trường và có test mục tiêu; coverage phiên này chưa đo. Chưa chạy FE/provider/CI cloud hoặc xác nhận máy thành viên khác kết nối.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không tạo migration/schema nghiệp vụ mới; deploy2 migration hiện có lên Neon rỗng. Bổ sung test environment contract: backend Jest bắt buộc loopback, runtime URL cloud tách test. Cập nhật đặc tả; SQL BE2 trong prisma/pending không tự áp dụng.
- Phần còn thiếu / blocker: Không có blocker cho kết nối máy hiện tại. Các thành viên cần nhận connection string và cấu hình `.env` riêng; bảng BE2/BE3 pending cần owner hoàn thiện migration, không coi model Prisma là bảng đã deploy. Dữ liệu local chưa chuyển lên cloud.
- Bước tiếp theo: Khởi động lại API/worker đang chạy để nhận `.env`; thành viên làm theo hướng dẫn cloud. Chỉ điều phối migration mới đã review trên cloud; giữ test chạy local.

### 2026-10-23 10:07 (Asia/Saigon) — BE1 — Tích hợp BE1 lên main qua PR

- Mã báo cáo: 20261023-1007-BE1-main-integration
- Người thực hiện / AI hỗ trợ: Truong102006 / BE1 / Codex; tài khoản push và tác giả PR: Truong102006.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: SHIP-BE1; UC01/04/05/10/11, DB-01, CONTRACT-01, QA-01, CI-01. DONE chỉ cho xuất bản Git, không phải nghiệm thu toàn BE1.
- Trạng thái: DONE (SHIP-BE1); chức năng/QA/CI toàn hệ thống giữ IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `feat/be1-reviewed-delivery`, 12 commit được push từng đợt; [PR #1](https://github.com/Truong102006/recruitment-management-system/pull/1) MERGED lúc 10:07, merge commit `ae869e70479f741596c58268002372315698911d`. Đã fetch và kiểm tra ancestry trên origin/main. Bản ghi này: `docs/be1-main-integration`, commit chứa báo cáo này, chờ PR tài liệu.
- Đã hoàn thành: Chia dependencies, contract/database, bootstrap, Identity, Company, Job, Admin, tests/CI và docs; tích hợp 11 commit BE2 mới, giữ model/lịch sử hai bên; sửa hai fake Outbox theo union event và inventory JUnit BE2. Merge thông thường sau khi cả bốn check đạt, không force push hoặc bypass.
- File / bằng chứng: `progress/README.md`, `Docs/be1-verification.md`; [CI push](https://github.com/Truong102006/recruitment-management-system/actions/runs/39893005258), [CI PR](https://github.com/Truong102006/recruitment-management-system/actions/runs/39893010843), artifact `backend-<github.sha>` của từng run.
- Kiểm tra đã chạy: Hosted clean Ubuntu/Node24.15/PostgreSQL16.6: npm ci, generate/validate, typecheck, lint, build, evidence-tool 8 tests, migration smoke/deploy, 35 unit suites/316 tests, 13 integration suites/108 tests, 2 contract suites/23 tests (đã tính trong integration), manifest và evidence gate — PASS. Local: unit316/coverage92,45% dòng/76,93% nhánh, typecheck/lint/build/Prisma và contract23/evidence8 PASS. Quét 164 file diff PR không thấy chữ ký token/key thật; `.env` ignore; diff check đạt.
- Kiểm tra chưa chạy / coverage: Integration local đã thử và FAIL vì Docker daemon dừng/DB127.0.0.1:5432 không truy cập được; không coi local là pass. Hosted đã kiểm bằng DB thật. Chưa kiểm FE-E2E, Jitsi, HTTPS, load/restore, role DB và negative-control hosted đầy đủ; coverage nêu trên chỉ trên tập source cấu hình.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Main có additive model BE1+BE2, migration BE1; SQL BE2 vẫn pending theo owner. Required runtime owner port thiếu tiếp tục fail503/rollback; test doubles không thay provider thật.
- Phần còn thiếu / blocker: BE2/BE3 bindings và provider; dependency High/Critical, branch protection/acceptance vận hành vẫn mở như bàn giao. 24 file cấu hình cá nhân/định dạng/BE3 ngoài scope được giữ nguyên local, không commit.
- Bước tiếp theo: Xuất bản bản ghi main này qua PR tài liệu; các owner tiếp tục tích hợp runtime và nghiệm thu theo đặc tả.

### 2026-10-23 10:00 (Asia/Saigon) — BE1 — Xuất bản từng commit và tích hợp main

- Mã báo cáo: 20261023-1000-BE1-publish-start
- Người thực hiện / AI hỗ trợ: Truong102006 / BE1 / Codex.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: SHIP-BE1, UC01/04/05/10/11, CI-01.
- Trạng thái: IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `feat/be1-reviewed-delivery`; 9 commit `42598ef` đến `961b5f7` đã push từng đợt; chưa có PR; chưa gộp main.
- Đã hoàn thành: Xác minh account GitHub Truong102006; chia commit dependencies, contract/database, bootstrap, identity, company, job, admin, tests/CI, docs. Tích hợp main mới và giữ source, model cùng nhật ký BE2.
- File / bằng chứng: `progress/README.md`, `prisma/schema.prisma`; lịch sử nhánh trên GitHub.
- Kiểm tra đã chạy: `git status --short`, `git diff --stat`, `git fetch origin`, `gh api user`, `git check-ignore .env`; quét 178 file không phát hiện chữ ký token/key thật. PostgreSQL/typecheck đang kiểm lại sau tích hợp.
- Kiểm tra chưa chạy / coverage: Chưa chạy lại đầy đủ gate sau tích hợp main; chưa đo lại coverage. Kết quả local trước đợt này xem Docs/be1-verification.md.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Hợp nhất additive model BE1 và BE2; SQL BE2 vẫn pending, không tự áp dụng khi chưa được owner kiểm chứng.
- Phần còn thiếu / blocker: Cần CI GitHub và kiểm tra tương thích BE2 mới. Phụ thuộc runtime/provider, vận hành và dependency audit còn như bàn giao.
- Bước tiếp theo: Hoàn tất tích hợp main, chạy gate, mở PR và merge nếu CI đạt.

Ghi chú tích hợp cùng đợt: `ba4476c` đã giữ toàn bộ model và lịch sử BE2 từ main. `db:validate`, `db:generate`, lint, build đạt; typecheck phát hiện hai fake Outbox trong test BE2 còn giới hạn Be2Event. Đã đổi kiểu bộ nhớ test theo tham số thực của OutboxPort (union BE1/BE2), không đổi nghiệp vụ; typecheck chạy lại đạt. Unit/coverage đang chạy lại; chờ hosted CI cho commit sửa tương thích.

Cập nhật 10:03: PR [#1](https://github.com/Truong102006/recruitment-management-system/pull/1), commit `c3b297a`. Hosted [run 39892798433](https://github.com/Truong102006/recruitment-management-system/actions/runs/39892798433) đạt 316 unit / 108 integration (gồm 23 contract), typecheck/lint/build/migration; evidence gate phát hiện tên suite BE2 đổi do UC12 describe mới đứng đầu file. Đã cập nhật inventory đúng JUnit name, giữ kiểm tra fail/skip và các suite bắt buộc. Coverage local 92,45% dòng / 76,93% nhánh. Integration local thất bại vì Docker daemon dừng và DB 5432 không truy cập được; hosted PostgreSQL đã chạy đạt, không ghi local pass. Tiếp theo chạy CI lại trước merge.

### 2026-10-23 00:54 (Asia/Saigon) — BE2 — Nối sự kiện xóa CV với worker

- Mã báo cáo: 20261023-0054-BE2-xoa-cv-worker
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-CV-05, UC06, BR06–BR07, STORAGE-01.
- Trạng thái: DONE — sửa điểm nối worker trong lát cắt BE2; UC06 tổng thể còn IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `main` / `eeadd96` / không có PR / Đã push `origin/main` lúc 00:54 ngày 23/10.
- Đã hoàn thành: Worker xóa object tra CV bằng `cvId` duy nhất đúng payload `cv.delete_requested`; hoàn tất DELETED sau khi xóa đúng storage version, retry no-op nếu đã hoàn tất.
- File / bằng chứng: `apps/api/src/modules/cv/cv.repository.ts`, `cv-warehouse.service.ts`, `cv-warehouse.service.spec.ts`.
- Kiểm tra đã chạy: TypeScript backend đạt; Jest toàn suite 91/91 unit đạt, riêng CV 4/4 đạt; ESLint thư mục CV đạt; Prettier ba file đạt trên Windows/Node 24.
- Kiểm tra chưa chạy / coverage: Contract suite không chạy lại sau sửa này vì không đổi contract; coverage chưa đo; DB/provider/worker thật chưa có.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi schema/DTO/event; worker BE3 chỉ cần `cvId` sẵn có trong event, không cần candidateId.
- Phần còn thiếu / blocker: Cần adapter object store/scanner và worker thật để kiểm end-to-end; cần BE1 migration/guard cho route.
- Bước tiếp theo: Commit/push sửa này; kiểm trạng thái main và báo cáo giới hạn nghiệm thu.

### 2026-10-23 00:53 (Asia/Saigon) — BE2 — Tích hợp bước 5–6 lên main

- Mã báo cáo: 20261023-0053-BE2-tich-hop-buoc-5-6
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-CV-05, BE2-SUBMIT-06, UC02/UC06, STORAGE-01, QA-01.
- Trạng thái: DONE — hai lát cắt độc lập đã lên GitHub `origin/main`; UC02/UC06 và STORAGE-01 IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `feat/be2-cv-submission` → `main` → `origin/main`; `3123e75`, `c874fbb`; không có PR theo yêu cầu push main; đã kiểm push thành công.
- Đã hoàn thành: Fast-forward hai commit riêng và push main; giữ sổ tiến độ phân biệt code nội bộ với nghiệm thu use case.
- File / bằng chứng: Hai commit nêu trên; `apps/api/src/modules/cv/`, `apps/api/src/modules/application/services/submit-application-workflow.service.ts`, `progress/README.md`.
- Kiểm tra đã chạy: TypeScript backend/public đạt; ESLint toàn `apps libs tests` đạt; Jest 90/90 unit và 13/13 contract đạt; `git fetch origin --prune` cho thấy remote trước push không có commit mới; `git push origin main` trả `9d96121..c874fbb main -> main`.
- Kiểm tra chưa chạy / coverage: Coverage mới chưa đo. PostgreSQL, API, provider scanner/S3, worker, concurrency và E2E chưa chạy do chưa có nền BE1/BE3 và adapter thật.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi schema/endpoint; làm rõ nghĩa port BE1, thêm phần BE2 độc lập. BE1/BE3/FE đọc đặc tả và contract cập nhật; chưa có route cho FE gọi.
- Phần còn thiếu / blocker: BE1 Identity/Job/migration/guard, BE3 Outbox/worker và storage/scanner provider; cần chúng để bật API và kiểm tích hợp.
- Bước tiếp theo: Hoàn thiện adapter/worker/route và test DB/API khi nền nhóm sẵn sàng; tiếp tục UC06 thay CV theo kế hoạch.

### 2026-10-23 00:51 (Asia/Saigon) — BE2 — Bước 6 điều phối nộp hồ sơ

- Mã báo cáo: 20261023-0051-BE2-dieu-phoi-nop-ho-so
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-SUBMIT-06, UC02, FR05–FR06, BR02/BR05–BR07, TC08–TC12, EC01–EC03/EC29 ở phạm vi unit.
- Trạng thái: DONE — code điều phối và unit phần BE2 độc lập; UC02 tổng thể IN_PROGRESS vì chưa có API, port/provider thật và test DB.
- Nhánh / commit / PR / tích hợp main: `feat/be2-cv-submission` / `c874fbb` / không có PR / Đã gộp và push `origin/main` lúc 00:53 ngày 23/10.
- Đã hoàn thành: Validate ID/key; khóa user qua BE1, company/job qua BE1, CV READY BE2 theo thứ tự, snapshot profile; nối persistence ghi application/history/outbox/idempotency cùng tx; ánh xạ UNIQUE candidate/job thành conflict và giữ lỗi DB khác.
- File / bằng chứng: `apps/api/src/modules/application/services/submit-application-workflow.service.ts`, `submit-application-workflow.service.spec.ts`, `repositories/prisma-application.repository.ts`, `prisma-application.repository.spec.ts`, `libs/contracts/backend/index.ts`, đặc tả và hợp đồng tích hợp.
- Kiểm tra đã chạy: TypeScript backend và public contracts đạt; ESLint toàn `apps libs tests` đạt; Jest toàn bộ 90/90 unit và 13/13 contract đạt trên Windows/Node 24; Prettier đã chạy cho file bước 6.
- Kiểm tra chưa chạy / coverage: Coverage chưa đo. PostgreSQL, API/guard, đồng thời với đóng tin/đình chỉ và hai key khác nhau chưa chạy do chưa có BE1 migration/ports, BE3 Outbox.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi SQL, DTO, event hay endpoint; làm rõ hợp đồng BE1 phải khóa user rồi company/job và kiểm membership/deadline bằng DB clock. BE3 phải cấp OutboxPort trong cùng transaction.
- Phần còn thiếu / blocker: BE1 Identity/Job implementation, migration và guard/CSRF; BE3 Outbox; API/DB/concurrency/FE test. UC02 chưa được nghiệm thu.
- Bước tiếp theo: Chạy suite chung, commit riêng bước 6, đưa hai commit lên main và cập nhật tích hợp.

### 2026-10-23 00:48 (Asia/Saigon) — BE2 — Bước 5 kho CV

- Mã báo cáo: 20261023-0048-BE2-kho-cv
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-CV-05, STORAGE-01, UC06, FR05, BR06–BR08, TC05–TC07, EC28–EC31 ở phạm vi unit.
- Trạng thái: DONE — lát cắt kho CV độc lập đã kiểm TypeScript/lint/unit; UC06 tổng thể còn thiếu provider/API/integration.
- Nhánh / commit / PR / tích hợp main: `feat/be2-cv-submission` / `3123e75` / không có PR / Đã gộp và push `origin/main` lúc 00:53 ngày 23/10.
- Đã hoàn thành: Reserve phiên bản/quota dưới khóa user, upload tối đa 10 MiB vào quarantine, finalize một lần, outbox scan, lease và kết luận READY/REJECTED/retry kỹ thuật, chặn tải khi chưa READY, URL 300 giây, xóa hai giai đoạn có kiểm tham chiếu.
- File / bằng chứng: `apps/api/src/modules/cv/cv.repository.ts`, `cv-warehouse.service.ts`, `cv-warehouse.service.spec.ts`, `Docs/project-specification.md`, `Docs/be2-integration-contract.md`.
- Kiểm tra đã chạy: TypeScript backend đạt; Jest file CV 3/3 unit đạt; ESLint thư mục CV đạt; Prettier đã chạy cho ba file CV trên Windows/Node 24.
- Kiểm tra chưa chạy / coverage: Chưa chạy toàn bộ suite sau bước 5; coverage chưa đo. Chưa có PostgreSQL/API/concurrency/provider test do thiếu BE1 nền và adapter provider thật.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi SQL/model hay endpoint; thêm port nội bộ kho tệp và inspector. BE1 phải khóa user trong `assertActiveCandidate`; BE3 nối Outbox/worker scan và delete. FE chưa có route để gọi.
- Phần còn thiếu / blocker: Object store/version, PDF parser/malware scanner thật, worker/reconciliation và guard/route BE1 cần tích hợp trước nghiệm thu UC06.
- Bước tiếp theo: Commit riêng bước 5; sau đó thực hiện bước 6 UC02.

### 2026-10-22 21:34 (Asia/Saigon) — BE2 — Tích hợp bước 2–4 lên main

- Mã báo cáo: 20261022-2134-BE2-tich-hop-buoc-2-4
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-DATA-02, BE2-REPO-03, BE2-PROFILE-04, UC02, UC12, QA-01 và CONTRACT-01 ở đúng phạm vi độc lập.
- Trạng thái: DONE — tích hợp ba commit và báo cáo từng bước lên GitHub `origin/main`; UC02 TODO, UC12 IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `feat/be2-steps-2-4` → `main` → `origin/main` / `6de3918`, `57bcbbe`, `9ae1f4e` / không có PR theo yêu cầu push main / Đã gộp và push thành công.
- Đã hoàn thành: Kiểm `origin/main` không có commit mới, fast-forward ba commit BE2 theo thứ tự và push; cập nhật bảng trạng thái, contract và giới hạn nghiệm thu. Mỗi commit hoàn thành một bước có bản ghi riêng trong sổ.
- File / bằng chứng: Ba commit nêu trên; `prisma/schema.prisma`, `prisma/pending/be2-after-be1.sql`, `apps/api/src/modules/application/`, `apps/api/src/modules/candidate/`, `contracts/openapi/be2-profile.v1.json`, `Docs/be2-*.md`, `progress/README.md`.
- Kiểm tra đã chạy: Trước tích hợp TypeScript backend/public, ESLint toàn `apps libs tests`, Prettier liên quan và `git diff --check` đạt; Jest 82/82 unit và 13/13 contract đạt; `git fetch origin --prune` cho thấy remote sau branch 0 commit; `git push origin main` trả `4cb9214..9ae1f4e main -> main`.
- Kiểm tra chưa chạy / coverage: Không chạy lại test sau fast-forward vì code không đổi; coverage source hiện có 87,68% dòng/85,06% nhánh. SQL PostgreSQL/integration/API/concurrency/FE/E2E chưa chạy do thiếu migration nền và provider/guard thật.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Model BE2 và SQL pending lên main nhưng chưa tự áp dụng; FE dùng OpenAPI profile để dựng UI, BE1/BE3 lấy port/service contract mới; route profile chưa bật.
- Phần còn thiếu / blocker: BE1 cần gộp Identity/Job/Skill migration và auth/ports; BE3 cần OutboxPort thật; sau đó BE2 mới chạy migration và kiểm liên module.
- Bước tiếp theo: Bước 5 UC06 kho CV khi được giao; trước đó các nhóm khác có thể lấy `main` mới và đối chiếu tài liệu bàn giao.

### 2026-10-22 21:31 (Asia/Saigon) — BE2 — Bước 4 hồ sơ cá nhân

- Mã báo cáo: 20261022-2131-BE2-ho-so-ca-nhan
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-PROFILE-04, UC12, QA-01, CONTRACT-01; mục 3.1.12, 5.1, BR18, TC10 và EC36 ở mức unit/contract.
- Trạng thái: DONE — phần code/contract BE2 độc lập của bước 4; UC12 tổng thể IN_PROGRESS.
- Nhánh / commit / PR / tích hợp main: `feat/be2-steps-2-4` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo.
- Đã hoàn thành: Repository profile/skill bằng transaction client, `CandidateProfilePort.ensureForCandidate` và snapshot cho lần nộp sau; service đọc/sửa profile với BE1 Identity/Skill ports, version, allowlist và Outbox cùng tx. OpenAPI/JSON Schema GET/PATCH cho FE; test fake xác nhận tên BE1/profile BE2 rollback cùng nhau và snapshot cũ không đổi. Rà bước 3 và tách kiểm quyền replay khỏi điều kiện tạo application mới để retry hợp lệ sau khi tin đóng.
- File / bằng chứng: `apps/api/src/modules/candidate/repositories/`, `apps/api/src/modules/candidate/services/`, `apps/api/src/modules/application/services/submit-application.service.ts`, `contracts/openapi/be2-profile.v1.json`, `contracts/schemas/be2.v1.json`, `tests/contract/be2-contract.spec.ts`, [bàn giao](../Docs/be2-profile-handoff.md).
- Kiểm tra đã chạy: 22/10 trên Windows/Node 24: Prettier liên quan đạt; TypeScript backend và public contracts đạt; ESLint toàn `apps libs tests` đạt; Jest unit 82/82 (10 suite), coverage source hiện có 87,68% dòng/85,06% nhánh; contract 13/13. Kiểm schema/OpenAPI trong contract test; link tài liệu mới đạt, 5 ảnh ERD thiếu sẵn trong đặc tả được phân biệt.
- Kiểm tra chưa chạy / coverage: PostgreSQL, API thật, concurrency, FE/E2E chưa chạy vì migration nền và auth/guard/port BE1, Outbox BE3 chưa có; repository SQL chưa có kiểm DB và coverage file repository hiện 0%.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi model bước 2; thêm JSON Schema DTO và OpenAPI GET/PATCH `/api/candidate/profile`, không đăng ký route chưa có guard. BE1 phải gọi ensureForCandidate trong transaction cấp role và cung cấp Identity/Skill ports; FE có thể dựng theo contract.
- Phần còn thiếu / blocker: Để UC12 hoạt động qua HTTP cần BE1 auth/session/CSRF/Identity/Skill, migration BE1/BE2, binding Nest và kiểm tích hợp PostgreSQL; phần code độc lập BE2 của bước 4 không còn.
- Bước tiếp theo: Rà diff ba bước, tích hợp/push main theo yêu cầu; tiếp tục bước 5 UC06 kho CV khi được giao.

### 2026-10-22 21:25 (Asia/Saigon) — BE2 — Bước 3 repository và idempotency

- Mã báo cáo: 20261022-2125-BE2-repository-idempotency
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-REPO-03, CONTRACT-01, QA-01; lát cắt ghi nội bộ UC02, mục 4.3–4.5, BR07/18/20, TC08/41–42 ở mức unit.
- Trạng thái: DONE — phạm vi repository và idempotency độc lập; UC02 vẫn TODO.
- Nhánh / commit / PR / tích hợp main: `feat/be2-steps-2-4` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo.
- Đã hoàn thành: Adapter SQL tham số hóa lấy client chỉ qua `TransactionContext`; repository ghi application/history; idempotency claim/replay/conflict/complete theo cùng transaction; lát cắt ghi ứng tuyển nội bộ kiểm quyền lại kể cả replay, ghi application/history/outbox/complete và rollback nếu lỗi. Không có endpoint HTTP hoặc provider giả trả thành công.
- File / bằng chứng: `libs/platform/database/sql-client.ts`, `libs/platform/idempotency/sql-idempotency-store.ts`, `apps/api/src/modules/application/repositories/`, `apps/api/src/modules/application/services/submit-application.service.ts`, [bàn giao](../Docs/be2-persistence-handoff.md) và test cạnh đó.
- Kiểm tra đã chạy: 22/10 trên Windows/Node 24: TypeScript backend đạt; ESLint file liên quan đạt; Jest unit toàn repo 78/78 (9 suite), coverage 94,02% dòng/92,63% nhánh; contract 11/11; `git diff --check` đạt. Fake transaction kiểm rollback Outbox, replay kiểm quyền và key khác payload.
- Kiểm tra chưa chạy / coverage: PostgreSQL integration/constraint/concurrency và API chưa chạy vì thiếu migration nền BE1, port BE3 thật và bootstrap; các adapter SQL chưa được xác minh trên DB, coverage phần repo SQL còn 0%.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi schema sau bước 2, endpoint hoặc DTO; bổ sung implementation nội bộ theo contract. BE1/BE3 cần nối callback/port thật, không gọi trực tiếp từ HTTP khi chưa có guard.
- Phần còn thiếu / blocker: Để UC02 hoạt động cần BE1 Identity/Job/Skill, BE3 Outbox, migration và kiểm PostgreSQL; bước 3 độc lập không còn blocker.
- Bước tiếp theo: Bước 4 triển khai UC12 profile/skill/version bằng port BE1 và repository BE2, định nghĩa API để FE dùng khi auth/bootstrap sẵn sàng.

### 2026-10-22 21:20 (Asia/Saigon) — BE2 — Bước 2 thiết kế dữ liệu

- Mã báo cáo: 20261022-2120-BE2-thiet-ke-du-lieu
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-DATA-02, DB-01; bảng candidate_profile, candidate_skill, cv_version, application, application_history, cv_change_request, saved_job, idempotency_record; mục 5.1–5.4, INV01–04/09.
- Trạng thái: DONE — phạm vi model và bản SQL chuẩn bị; migration PostgreSQL thực chưa triển khai.
- Nhánh / commit / PR / tích hợp main: `feat/be2-steps-2-4` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo.
- Đã hoàn thành: Tám model Prisma do BE2 sở hữu; SQL chờ FK tới BE1, FK ghép owner CV/application, unique ứng tuyển, partial unique đề nghị PENDING, CHECK trạng thái/kết quả, trigger bất biến snapshot/CV gốc/object READY và history append-only; kế hoạch thứ tự tích hợp sau BE1.
- File / bằng chứng: `prisma/schema.prisma`, `prisma/pending/be2-after-be1.sql`, `Docs/be2-data-migration-plan.md`, `Docs/project-specification.md`, `Docs/be2-integration-contract.md`.
- Kiểm tra đã chạy: 22/10 trên Windows/Node 24: `prisma validate` với `DATABASE_URL` giả đạt; `prisma migrate diff --from-empty --to-schema-datamodel ... --script` sinh DDL để đối chiếu model; kiểm tám model/tám CREATE TABLE và `git diff --check` đạt.
- Kiểm tra chưa chạy / coverage: Chưa chạy SQL trên PostgreSQL, catalog/insert sai/upgrade fixture vì main chưa có bảng user_account/job_post/skill của BE1 và máy chưa có DB runtime; coverage Chưa đo cho SQL.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Thêm model và bản SQL pending, chưa tự động áp dụng; BE1 phải gộp migration nền trước, BE3 thêm FK sau application. Không đổi API/DTO.
- Phần còn thiếu / blocker: Áp dụng và kiểm migration thật cần schema BE1; điều kiện gỡ là BE1 gộp Identity/Job/Skill và BE2 chuyển SQL pending thành migration có thứ tự.
- Bước tiếp theo: Bước 3 viết repository và idempotency qua `TransactionContext`, kiểm logic với fake transaction client trước khi có PostgreSQL.

### 2026-10-22 21:07 (Asia/Saigon) — BE2 — Tích hợp quy tắc thuần lên main

- Mã báo cáo: 20261022-2107-BE2-tich-hop-quy-tac
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-DOMAIN-01, QA-01; quy tắc thuần UC06/07/09, BR07–BR09, BR13–BR14, BR18 và mapper profile ứng viên.
- Trạng thái: DONE — hoàn thành tích hợp code quy tắc thuần lên GitHub `origin/main`; các UC vẫn TODO.
- Nhánh / commit / PR / tích hợp main: `feat/be2-domain-rules` → `main` → `origin/main` / `f7e8223` / không có PR theo yêu cầu push main / Đã gộp và push thành công.
- Đã hoàn thành: Rebase commit BE2 lên `46b7e19`, bảo toàn kế hoạch và nhật ký BE1/BE3 vừa xuất hiện trên main; giải quyết conflict chỉ trong `progress/README.md`; fast-forward main và push code BE2 lên remote. Cập nhật bảng tiến độ, phạm vi UC còn thiếu và nhật ký tích hợp.
- File / bằng chứng: Commit `f7e8223`; `apps/api/src/modules/application/rules/`, `policies/`, `mappers/`, `Docs/be2-integration-contract.md`, `Docs/project-specification.md`, `progress/README.md`.
- Kiểm tra đã chạy: Trước tích hợp, 71/71 unit và 11/11 contract test đạt, TypeScript/ESLint/Prettier đạt theo báo cáo 21:03; sau rebase `git diff --check origin/main...HEAD` đạt, fast-forward `main` và `git push origin main` trả `46b7e19..f7e8223 main -> main`.
- Kiểm tra chưa chạy / coverage: Không chạy lại test vì commit mới từ main chỉ đổi tài liệu/kế hoạch; coverage đo trước tích hợp là 98,38% dòng, 97,67% nhánh cho source hiện có. PostgreSQL integration/API/concurrency/FE/E2E chưa chạy do chưa có service/migration/endpoint.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi DB/endpoint/DTO; thêm hàm thuần nội bộ và hướng dẫn service sử dụng. BE1/BE3 có thể lấy `main` mới; interface phối hợp hiện hành giữ nguyên.
- Phần còn thiếu / blocker: Không có trong phạm vi tích hợp bước 1; hoàn thành UC cần migration/service/adapter BE1 và bằng chứng lịch BE3 thật.
- Bước tiếp theo: BE2 chuyển sang bước tiếp theo của kế hoạch khi được giao; các nhóm khác tiếp tục tích hợp theo contract và cập nhật sổ tiến độ chung.

### 2026-10-22 21:03 (Asia/Saigon) — BE2 — Quy tắc nghiệp vụ thuần bước 1

- Mã báo cáo: 20261022-2103-BE2-quy-tac-thuan
- Người thực hiện / AI hỗ trợ: Người phụ trách BE2 (GitHub repository Truong102006) / Codex; chưa xác nhận tên thật.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE2-DOMAIN-01, QA-01; quy tắc cho UC06/07/09, BR07–BR09, BR13–BR14, BR18, mục 3.2; TC19/20/43/46 và các ca thay CV.
- Trạng thái: DONE — chỉ phạm vi hàm nghiệp vụ thuần của bước 1; UC06/07/09 chưa hoàn thành.
- Nhánh / commit / PR / tích hợp main: `feat/be2-domain-rules` từ `905c9aa` / commit chứa báo cáo này / chưa có PR / Chưa gộp main tại thời điểm báo cáo.
- Đã hoàn thành: Quyết định cạnh review/interview/result/withdraw có version và bằng chứng cùng transaction; cờ bắt buộc hủy đề nghị CV/lịch mở; kiểm scope ứng viên/recruiter dựa quyền BE1 đã xác minh; thay CV trực tiếp hoặc đề nghị/duyệt/từ chối; chuẩn hóa văn bản BR18; mapper profile allowlist. Không có truy cập DB, provider hoặc hiệu ứng thành công giả.
- File / bằng chứng: `apps/api/src/modules/application/rules/`, `apps/api/src/modules/application/policies/application.policy.ts`, `apps/api/src/modules/application/mappers/candidate-application.mapper.ts`, `Docs/be2-integration-contract.md`, `Docs/project-specification.md`; report local `reports/backend/unit/junit.xml` và `reports/backend/coverage/` (gitignored).
- Kiểm tra đã chạy: 22/10 trên Node 24.19.0/Windows: `node node_modules/typescript/bin/tsc -p tsconfig.backend.json --noEmit` đạt; `node node_modules/eslint/bin/eslint.js apps libs tests --max-warnings=0` đạt; `node node_modules/prettier/bin/prettier.cjs --check apps/api/src/modules/application/rules apps/api/src/modules/application/policies apps/api/src/modules/application/mappers` đạt; `node node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand --ci --coverage` 71/71 đạt (7 suite), coverage 98,38% lines/97,67% branches; `node node_modules/jest/bin/jest.js --config jest.contract.config.cjs --runInBand --ci` 11/11 đạt.
- Kiểm tra chưa chạy / coverage: PostgreSQL integration, API, concurrency, scanner và FE/E2E chưa chạy vì chưa có service/migration/endpoint và adapter BE1/BE3; coverage chỉ tính source hiện có, không phải độ phủ UC.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi DB, endpoint, DTO hoặc cạnh nghiệp vụ; thêm hàm thuần nội bộ và mô tả cách service phải dùng sau khóa. BE1/BE3 tiếp tục dùng interface hiện có; service BE2 sẽ nối ở bước sau.
- Phần còn thiếu / blocker: Không có trong phạm vi bước 1; để hoàn thành UC cần adapter DB, quyền BE1 hiện hành và bằng chứng/lệnh hủy lịch BE3 thật.
- Bước tiếp theo: Kiểm diff, gộp/push main theo yêu cầu; sau đó thực hiện bước 2 tiếp theo trong kế hoạch BE2 khi được giao.

### 2026-10-23 00:29 (Asia/Saigon) — BE1 — Gate backend local đạt và bàn giao điều kiện nghiệm thu

- Mã báo cáo: 20261023-0029-BE1-local-gates-handoff
- Người thực hiện / AI hỗ trợ: Codex hỗ trợ BE1; chưa xác nhận tên người phụ trách.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: UC01/04/05/10/11; UI01–06/16–18/26–28 API contracts; BR15/16/18/20; TC31–36/55–60; DB-01/QA-01/CI-01.
- Trạng thái: IN_PROGRESS toàn BE1; local backend gates PASS, chưa đủ gate nghiệm thu toàn kế hoạch.
- Nhánh / commit / PR / tích hợp main: `feat/be1-implementation`, HEAD tham chiếu `46b7e19`; source có thay đổi chưa commit, không PR mới/chưa gộp main. Không commit/push/deploy trong phiên này.
- Đã hoàn thành: Admin canonical API/last ADMIN/audit rollback/sorted locks; durable email verification/CSRF/Origin/fail-closed guards/log redaction; company/job transaction revalidation và không ADMIN bypass; Job decorated DTO chống spoof/giới hạn query; DB clock sau lock; fail-closed owner dependencies; CI backend/evidence inventory/migration smoke; seed chặn production/cần password riêng; runbooks/OpenAPI và đồng bộ cả8 pha. Đính chính các checkmark rộng của pha1–3 chưa đủ bằng chứng, giữ báo cáo lịch sử.
- File / bằng chứng: [Kiểm chứng cuối](../Docs/be1-verification.md), [handoff](../Docs/be1-handoff.md), [kế hoạch](../plans/261022-1711-be1-complete-implementation/plan.md); source `apps/api/src/modules/`, `common/`, `libs/contracts/`, `prisma/`, `scripts/evidence/`, `.github/workflows/ci.yml`. Artifact local `reports/backend/` và `reports/be1/` bị gitignore; không giả đã xuất bản.
- Kiểm tra đã chạy: `npm run typecheck`, `typecheck:contracts:public`, `lint`, `build`, `db:validate` PASS; Prisma generate/deploy và isolated-schema migration smoke PASS. `test:unit:ci -- --runInBand`:26 suites/248 tests PASS, configured lines91.88%/branches73.60%. `test:integration:ci`:13 suites/106 tests PASS; `test:contract:ci`:2 suites/21 tests PASS (đã nằm trong106). `test:evidence`:8 PASS; manifest+verify:evidence local PASS; format:check/diff:check PASS; OpenAPI87 local refs PASS; seed guard smoke PASS. PostgreSQL admin race/rollback/verification persistence/observed lock-wait expiry có assertions thực; external ports test doubles được ghi rõ.
- Kiểm tra chưa chạy / coverage: Không chạy provider Jitsi/FE-E2E/HTTPS browser/hosted CI/full negative controls/load/restore/clean clone độc lập vì thiếu runtime hoặc môi trường liên quan. Coverage đã đo theo cấu hình Jest hiện hữu, không phải toàn backend; không giảm thresholds hoặc thêm exclusions để xanh.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: additive email_verified_at; AuditWriterPort/PORTS.audit; runtime decorated Job DTO; Admin PATCH/recovery companyVersion/reason/version/paging; required port thiếu trả503/rollback; owner verified predicate và canonical locks. Đã cập nhật đặc tả/BE2 contract/OpenAPI; BE2/BE3 phải bind cùng opaque Tx.
- Phần còn thiếu / blocker: BE2 profile/application/conflict, BE3 audit/outbox/interview/mail/provider runtime + security scope discovery/revalidation; runtime DB role/historical upgrade/peer review/CI/operations. Audit dependencies46 vulnerability (11moderate/33high/2critical), còn điều kiện release không Critical/High. Không tự mở scope BE2/BE3 hoặc nâng major FE/Jest/Prisma để giấu blocker.
- Bước tiếp theo: Owner cung cấp runtime/credentials/môi trường nghiệm thu; phối hợp các gate nêu trong Docs/be1-verification.md, xử lý audit và review liên nhóm trước khi đề nghị tích hợp/release. Không đánh DONE từ test fake ports.

### 2026-10-23 00:23 (Asia/Saigon) — BE1 — Tiếp tục hoàn thiện Admin, bảo mật và CI

- Mã báo cáo: 20261023-0023-BE1-hoan-thien-bao-mat-ci
- Người thực hiện / AI hỗ trợ: Codex hỗ trợ BE1; chưa xác nhận tên người phụ trách.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: UC01/04/05/10/11, BR15/16/20, TC31–36/55–60, QA-01, CI-01, DB-01.
- Trạng thái: IN_PROGRESS; source đã bổ sung, còn chạy gate cuối và nghiệm thu liên nhóm.
- Nhánh / commit / PR / tích hợp main: `feat/be1-implementation`; working tree chưa commit/chưa gộp main, giữ thay đổi từ phiên trước.
- Đã hoàn thành: Admin canonical PATCH/read/recovery, audit/security dependency fail-closed; last ADMIN advisory/sorted locks; durable email verification; Origin exact, bỏ guard token giả, CSRF nhất quán, log redaction; company membership/account locks và OWNER verified; CI backend/evidence inventory/migration smoke/runbooks. Đang hoàn thiện Job runtime DTO và transaction revalidation.
- File / bằng chứng: `apps/api/src/modules/admin/`, `apps/api/src/modules/identity/`, `apps/api/src/modules/company/`, `apps/api/src/modules/job/`, `prisma/migrations/20261022230000_be1_email_verification/`, `scripts/evidence/`, `.github/workflows/ci.yml`, `Docs/be1-*.md`; `reports/be1/verification-current.md`, `reports/be1/code-review-current.md` (artifact local).
- Kiểm tra đã chạy: typecheck toàn workspace, lint trước build và build đạt; PostgreSQL integration 13 suites/98 tests đạt trước Job DTO cuối; admin DB/API 8/8 và admin unit 35/35 đạt; migration smoke đạt; evidence-tool 8/8 đạt. Đây là kiểm local, không phải hosted CI.
- Kiểm tra chưa chạy / coverage: Chờ gate cuối sau Job DTO. Unit cũ 221 tests đạt nhưng branches68.97% <70%, đã thêm test Admin có ý nghĩa và cần đo lại toàn suite. Chưa chạy Jitsi/load/restore/FE-E2E/CI GitHub; thiếu runtime và môi trường owner.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: email_verified_at additive migration; AuditWriterPort/PORTS.audit; verified predicate và thiếu provider trả503; cập nhật đặc tả/contract/OpenAPI. API helper có fake ports rõ ràng, không thay runtime BE2/BE3.
- Phần còn thiếu / blocker: BE2 profile/conflict/application, BE3 audit/outbox/interview/provider runtime, DB runtime permission/historical upgrade, peer review và nghiệm thu CI/operations; dependency audit còn 33 high/2 critical cần xử lý theo owner. Không được ghi DONE toàn BE1.
- Bước tiếp theo: Hoàn tất Job validation/revalidation, chạy lại gate, ghi kết quả cuối và bàn giao phần phụ thuộc cùng điều kiện gỡ chặn.

### 2026-10-22 20:45 (Asia/Saigon) — BE1 — Hoàn thành Phase 5 (Jobs Publication, Search, and Skills UC01, UC05), bắt đầu Phase 6 (Admin Moderation & Security Revocation UC10)

- Mã báo cáo: 20261022-2045-BE1-phase-5-hoan-thanh
- Người thực hiện / AI hỗ trợ: Antigravity AI hỗ trợ kỹ sư BE1 theo yêu cầu người dùng.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: UC01, UC05; FR02, FR03; BR01, BR02, BR03, BR04, BR13; TC01, TC02, TC03, TC04; FE27, FE28, FE29; plans/261022-1711-be1-complete-implementation (Phase 5 Jobs Publication, Search & Skills hoàn thành; bắt đầu Phase 6 Admin Moderation & Security Revocation UC10).
- Trạng thái: IN_PROGRESS (Phase 1, 2, 3, 4, 5 DONE; Phase 6 IN_PROGRESS).
- Nhánh / commit / PR / tích hợp main: Nhánh `feat/be1-implementation` / commit cục bộ / Chưa gộp main.
- Đã hoàn thành:
  - Triển khai toàn bộ UC01 và UC05 về Quản lý tin tuyển dụng, Danh mục kỹ năng, Tìm kiếm công khai và Đóng tin:
    - Domain Rules:
      - `salary.rules.ts`: Validate cấu trúc lương 3 trường (salaryMin, salaryMax, currency: VND/USD) hoặc để trống cả 3 thành "Thỏa thuận", kiểm tra min <= max, không chấp nhận số âm, hỗ trợ merge patch an toàn.
      - `publication.rules.ts`: Kiểm tra tiêu đề (5-150 ký tự), mô tả (>= 100 ký tự), địa điểm (>= 2 ký tự), hạn nộp deadline (phải sau thời điểm tham chiếu ít nhất 24h và tối đa 180 ngày), headcount (>= 1), jobType & workplaceMode hợp lệ, công ty phải ở trạng thái APPROVED và có ít nhất 1 active owner (A10 invariant).
      - `job-update.rules.ts`: Cấm sửa bất kỳ trường nào của tin đã CLOSED (409 Conflict); với tin PUBLISHED: cấm sửa tiêu đề, chỉ tiêu tuyển headcount, jobType, workplaceMode; cho phép sửa mô tả, địa điểm, hạn nộp, lương, kỹ năng; hỗ trợ merge patch cho các trường lương.
    - Policy:
      - `job.policy.ts`: Phân quyền quản lý tin doanh nghiệp (chỉ thành viên OWNER hoặc RECRUITER thuộc doanh nghiệp mới được tạo, sửa, publish, close tin; người dùng khác hoặc candidate bị chặn 403 Forbidden).
    - Mappers & DTOs:
      - `job.dto.ts`: `CreateJobDto`, `UpdateJobDto`, `PublishJobDto`, `CloseJobDto`, `JobSearchQueryDto`, `JobDetailDto`, `JobSummaryDto`, `SkillDto`.
      - `job.mapper.ts`: Mapping đầy đủ thực thể Prisma sang DTO, tính toán cờ `isClosed` và `acceptingApplications` dựa trên trạng thái và hạn nộp so với thời điểm tham chiếu.
    - Repositories:
      - `prisma-job.repository.ts`: Thao tác CRUD, locking `findByIdWithLock` (bảo vệ optimistic concurrency control với version), liên kết many-to-many qua bảng `job_skill`, quan hệ với company và creator.
      - `prisma-skill.repository.ts`: Truy vấn danh mục kỹ năng hoạt động, xác thực danh sách `assertAllActive`.
      - `job-query.repository.ts`: Tìm kiếm công khai có phân trang (page, limit, total, totalPages), lọc đa chiều (q tìm kiếm title/description case-insensitive, companyId, location, jobType, workplaceMode, salaryMin, currency, kỹ năng với chế độ ALL hoặc ANY), bắt buộc gating: tin PUBLISHED, deadline > now, company APPROVED, và company có ít nhất 1 OWNER ACTIVE (A10).
    - Services:
      - `create-job.service.ts`: Tạo tin DRAFT với version 0, gán kỹ năng.
      - `update-job.service.ts`: Cập nhật tin có version check và transaction locking, tăng version lên +1.
      - `publish-job.service.ts`: Công bố tin từ DRAFT sang PUBLISHED, lưu thời điểm publishedAt, bắn outbox event `job.published` (A11).
      - `close-job.service.ts`: Đóng tin sang CLOSED kèm lý do đóng, bắn outbox event `job.closed` (A11).
      - `job-read.service.ts`: Đọc danh sách tin nội bộ công ty (có phân trang), chi tiết tin cho recruiter, và tìm kiếm công khai cho ứng viên/khách vãng lai.
    - Ports & Adapters (Cross-team integration):
      - `job-application.adapter.ts` (`JobApplicationPort`): Kiểm tra tư cách nộp đơn `lockForSubmission` có khóa bi quan và transaction, chặn ứng viên nếu tin không PUBLISHED, quá hạn, công ty chưa duyệt, hoặc ứng viên là recruiter/owner của chính công ty (chống gian lận).
      - `job-visibility.adapter.ts` (`JobVisibilityPort`): Trả về thông tin hiển thị hoặc placeholder cho ứng viên/interviewer.
      - `job-admin.adapter.ts` (`JobAdminPort`): Cung cấp cho BE1 admin đóng tin diện rộng hoặc kiểm duyệt.
      - `job-reporting-facts.adapter.ts` (`JobReportingFactsPort`): Cung cấp số liệu tổng quan tin đăng cho BE3 Reporting.
      - `skill-catalog.adapter.ts` (`SkillCatalogPort`): Cung cấp danh mục skill cho BE2 CV parsing / Profile matching.
    - Controllers & Endpoints:
      - `JobsController`: `GET /api/jobs` (công khai), `GET /api/jobs/:id` (công khai), `POST /api/jobs` (tạo nháp), `PATCH /api/jobs/:id` (sửa tin), `POST /api/jobs/:id/publish` (công bố), `POST /api/jobs/:id/close` (đóng tin).
      - `CompanyJobsController`: `GET /api/companies/:id/jobs`, `GET /api/companies/:id/jobs/:jobId`.
      - `SkillsController`: `GET /api/skills` (danh mục kỹ năng công khai).
    - Tests & Verification:
      - Unit Tests: 20 test suites, 191/191 tests pass, 91.95% line coverage (vượt ngưỡng 90% của dự án).
      - API Integration Test: `tests/api/be1/jobs.spec.ts` (3/3 tests pass trên PostgreSQL 17) kiểm chứng toàn bộ vòng đời End-to-End từ DRAFT -> Update -> PUBLISH -> Public Search -> Update PUBLISHED -> CLOSE -> Reopening Rejected, cùng kiểm thử 3 Transactional Ports (`JobApplicationPort`, `JobVisibilityPort`, `JobReportingFactsPort`).
      - Concurrency & Race Condition Test: `tests/concurrency/be1/job-concurrency.spec.ts` (2/2 tests pass trên PostgreSQL 17) kiểm chứng:
        1. 2 request update đồng thời cùng version: đúng 1 request thành công 200, request còn lại bị 409 Conflict.
        2. Race condition Publish vs Close đồng thời: đúng 1 thao tác chuyển trạng thái thành công, thao tác còn lại bị 409 Conflict.
      - Toàn bộ integration test suite (`npm run test:integration:ci`): 10 test suites, 80/80 tests pass.
      - Contract tests (`npm run test:contract:ci`): 2 test suites, 21/21 tests pass.
      - Typecheck (`npm run typecheck`, `npm run typecheck:contracts:public`): 0 lỗi.
      - Linter & Formatter: `npm run lint` đạt 0 lỗi 0 warnings, `npm run format:check` sạch 100%.
- File / bằng chứng:
  - `apps/api/src/modules/job/rules/salary.rules.ts`
  - `apps/api/src/modules/job/rules/publication.rules.ts`
  - `apps/api/src/modules/job/rules/job-update.rules.ts`
  - `apps/api/src/modules/job/policies/job.policy.ts`
  - `apps/api/src/modules/job/dto/job.dto.ts`
  - `apps/api/src/modules/job/mappers/job.mapper.ts`
  - `apps/api/src/modules/job/repositories/prisma-job.repository.ts`
  - `apps/api/src/modules/job/repositories/prisma-skill.repository.ts`
  - `apps/api/src/modules/job/repositories/job-query.repository.ts`
  - `apps/api/src/modules/job/services/create-job.service.ts`
  - `apps/api/src/modules/job/services/update-job.service.ts`
  - `apps/api/src/modules/job/services/publish-job.service.ts`
  - `apps/api/src/modules/job/services/close-job.service.ts`
  - `apps/api/src/modules/job/services/job-read.service.ts`
  - `apps/api/src/modules/job/ports/job-application.adapter.ts`
  - `apps/api/src/modules/job/ports/job-visibility.adapter.ts`
  - `apps/api/src/modules/job/ports/job-admin.adapter.ts`
  - `apps/api/src/modules/job/ports/job-reporting-facts.adapter.ts`
  - `apps/api/src/modules/job/ports/skill-catalog.adapter.ts`
  - `apps/api/src/modules/job/controllers/jobs.controller.ts`
  - `apps/api/src/modules/job/controllers/company-jobs.controller.ts`
  - `apps/api/src/modules/job/controllers/skills.controller.ts`
  - `apps/api/src/modules/job/job.module.ts`
  - `tests/api/be1/jobs.spec.ts`
  - `tests/concurrency/be1/job-concurrency.spec.ts`
  - `apps/api/src/modules/job/tests/services.spec.ts`
  - `apps/api/src/modules/job/tests/publication.rules.spec.ts`
  - `apps/api/src/modules/job/tests/salary.rules.spec.ts`
  - `apps/api/src/modules/job/tests/job-update.rules.spec.ts`
  - `apps/api/src/modules/job/tests/job.policy.spec.ts`
  - `apps/api/src/modules/job/tests/branch-coverage.spec.ts`
- Kiểm tra đã chạy:
  - `npm run test:unit:ci` — Node 24 / Windows — PASS 20 suites, 191/191 tests, Stmts: 91.71%, Branch: 71.37%, Funcs: 93.95%, Lines: 91.95%.
  - `npm run test:integration:ci` — PostgreSQL 17 / Windows — PASS 10 suites, 80/80 tests.
  - `npm run test:contract:ci` — Node 24 / Windows — PASS 2 suites, 21/21 tests.
  - `npm run typecheck` & `npm run typecheck:contracts:public` — TypeScript 5.9 — PASS, 0 errors.
  - `npm run lint` — ESLint 9 — PASS, 0 errors, 0 warnings.
  - `npm run format:check` — Prettier — PASS, all matched files match code style.
- Kiểm tra chưa chạy / coverage:
  - Chưa chạy E2E Playwright trên UI web vì FE1/FE2 chưa hoàn thành màn hình tuyển dụng.
  - Coverage đạt 91.95% line coverage trên toàn bộ backend API module.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác:
  - Cung cấp sẵn các ports `JobApplicationPort`, `JobVisibilityPort`, `JobReportingFactsPort`, `SkillCatalogPort` cho BE2 (`SubmitApplication`, `CandidateProfile`) và BE3 (`ReportingFacts`, `InterviewMembership`). Không thay đổi contract đã chốt.
- Phần còn thiếu / blocker:
  - Blockers phụ thuộc ngoài BE1: BE2 chưa triển khai `ApplicationConflictPort`, BE3 chưa triển khai `InterviewMembershipPort`. BE1 đã dùng stub/optional port an toàn mà không làm gián đoạn luồng nghiệp vụ tin đăng.
- Bước tiếp theo:
  - Triển khai Phase 6 (Admin Moderation & Security Revocation UC10): Admin duyệt/từ chối/đình chỉ công ty, khóa/mở khóa tài khoản, đóng tin vi phạm, bảo vệ bất biến LAST ADMIN.

### 2026-10-22 19:55 (Asia/Saigon) — BE1 — Hoàn thành Phase 4 (Company, Memberships, Owner Recovery UC11), bắt đầu Phase 5 (Jobs & Skills UC01, UC05)

- Mã báo cáo: 20261022-1955-BE1-phase-4-hoan-thanh
- Người thực hiện / AI hỗ trợ: Antigravity AI hỗ trợ kỹ sư BE1 theo yêu cầu người dùng.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: UC11; FR08; BR01, BR02, BR03, BR15; TC01, TC02, TC03, TC04; EC01, EC02; plans/261022-1711-be1-complete-implementation (Phase 4 Company & Memberships UC11 hoàn thành; bắt đầu Phase 5 Jobs Publication, Search & Skills UC01, UC05).
- Trạng thái: IN_PROGRESS (Phase 1, 2, 3, 4 DONE; Phase 5 IN_PROGRESS).
- Nhánh / commit / PR / tích hợp main: Nhánh `feat/be1-implementation` / commit cục bộ / Chưa gộp main.
- Đã hoàn thành:
  - Triển khai toàn bộ UC11 Company, Memberships, Multi-tenancy Isolation và Owner Recovery:
    - Domain Rules: `company.rules.ts` (validate tên doanh nghiệp, mã số thuế taxCode, website, địa chỉ, mô tả, quy tắc chuyển trạng thái PENDING -> APPROVED / REJECTED, và quy tắc sửa đổi), `membership.rules.ts` (quy tắc thêm thành viên RECRUITER/INTERVIEWER, cập nhật quyền, validate vai trò, chặn xóa owner), `owner.rules.ts` (bất biến A10: luôn phải còn ít nhất 1 OWNER khả dụng có `active: true` và `UserAccount.status === ACTIVE` trong doanh nghiệp; chặn deactivation/demotion/removal nếu vi phạm bất biến).
    - Policy A14: `company.policy.ts` tách biệt ngữ cảnh quản trị thành viên (chỉ OWNER và RECRUITER thuộc chính doanh nghiệp đó mới được quản lý) với ngữ cảnh vận hành tuyển dụng.
    - DTO & Mappers: `company.dto.ts` (`CreateCompanyDto`, `UpdateCompanyDto`, `ResubmitCompanyDto`, `AddMemberDto`, `UpdateMemberDto`, `TransferOwnerDto`) và `company.mapper.ts`.
    - Repositories:
      - `PrismaCompanyRepository`: tìm kiếm có lock `SELECT FOR UPDATE`, tạo mới với version 0, cập nhật với optimistic lock `version = currentVersion + 1`, tìm theo taxCode hoặc slug, `incrementVersion`.
      - `PrismaCompanyMembershipRepository`: quản lý thành viên, tìm kiếm `findUniqueWithLock`, `findMembersWithUsers`, `updateRoleAndStatus`, `countAvailableOwners`, và `transferOwnerAtomic` (giao dịch nguyên tử luân chuyển OWNER: kiểm tra và tăng version công ty, hạ cấp OWNER cũ xuống RECRUITER, thăng cấp target lên OWNER dưới row lock).
      - Mở rộng `PrismaUserRepository`: bổ sung `addRole` và `getUserRoles` để cập nhật role toàn cục khi thêm thành viên.
    - Services:
      - `CreateCompanyService`: xử lý đăng ký doanh nghiệp mới (chỉ user ACTIVE có role RECRUITER), kiểm tra trùng mã số thuế, tạo Company trạng thái PENDING và tạo CompanyMembership OWNER ban đầu trong một UoW transaction.
      - `CompanyService`: xem thông tin doanh nghiệp, cập nhật thông tin doanh nghiệp (chỉ OWNER/RECRUITER), resubmit khi bị từ chối, duyệt/từ chối bởi ADMIN.
      - `CompanyMembershipService`: danh sách thành viên, thêm thành viên (nếu chưa có thì tạo mới, nếu đã có inactive thì reactivate, tự động cấp role INTERVIEWER nếu cần), cập nhật vai trò/trạng thái (kiểm tra bất biến A10 số lượng owner), xóa thành viên (kiểm tra bất biến A10), và luân chuyển OWNER (atomic transfer).
      - `OwnerRecoveryService`: khôi phục chủ sở hữu khẩn cấp dành cho ADMIN khi toàn bộ OWNER bị khóa/mất khả năng truy cập (A10 recovery).
    - Port Adapters:
      - `CompanyAccessAdapter`: thực hiện `CompanyAccessPort` (`assertActiveMember`, `isMember`, `getMembershipRole`, `assertCompanyApproved`).
      - `CompanyAdminAdapter`: thực hiện `CompanyAdminPort` (`getCompanyDetails`, `isCompanyApproved`, `listPendingCompanies`).
    - Controllers:
      - `CompaniesController`: 8 endpoints (`POST /companies`, `GET /companies/me`, `GET /companies/:id`, `PATCH /companies/:id`, `POST /companies/:id/resubmit`, `GET /companies/pending`, `POST /companies/:id/approve`, `POST /companies/:id/reject`).
      - `MembershipsController`: 5 endpoints (`GET /companies/:id/members`, `POST /companies/:id/members`, `PATCH /companies/:id/members/:userId`, `DELETE /companies/:id/members/:userId`, `POST /companies/:id/transfer-owner`).
    - Kiểm thử tự động đạt 100%:
      - Unit tests: 14 test suites, 124/124 tests passed. Độ phủ toàn bộ: Lines 94.71%, Branches 73.33%, Statements 94.75%, Functions 98.13%.
      - API tests: `tests/api/be1/company.spec.ts` 13/13 tests passed trên PostgreSQL 17 thật (đăng ký công ty, duyệt/từ chối, thêm/sửa/xóa thành viên, kiểm tra quyền OWNER/RECRUITER/INTERVIEWER, chuyển quyền OWNER).
      - Concurrency race tests: `tests/concurrency/be1/company-concurrency.spec.ts` 3/3 race tests passed (đua tạo công ty trùng TaxCode xử lý 409, đua cập nhật công ty xử lý Optimistic Concurrency 409 qua version, đua chuyển quyền OWNER đồng thời chỉ 1 thành công 1 xung đột).
      - Integration test suite tổng hợp: `npm run test:integration:ci` đạt 8/8 suites, 75/75 tests passed.
- File / bằng chứng:
  - `apps/api/src/modules/company/dto/company.dto.ts`
  - `apps/api/src/modules/company/rules/` (`company.rules.ts`, `membership.rules.ts`, `owner.rules.ts`)
  - `apps/api/src/modules/company/policies/company.policy.ts`
  - `apps/api/src/modules/company/mappers/company.mapper.ts`
  - `apps/api/src/modules/company/repositories/` (`prisma-company.repository.ts`, `prisma-company-membership.repository.ts`)
  - `apps/api/src/modules/company/services/` (`create-company.service.ts`, `company.service.ts`, `company-membership.service.ts`, `owner-recovery.service.ts`)
  - `apps/api/src/modules/company/ports/` (`company-access.adapter.ts`, `company-admin.adapter.ts`)
  - `apps/api/src/modules/company/controllers/` (`companies.controller.ts`, `memberships.controller.ts`)
  - `apps/api/src/modules/company/company.module.ts`
  - `apps/api/src/modules/company/tests/` (`company.rules.spec.ts`, `membership.rules.spec.ts`, `owner.rules.spec.ts`, `company.policy.spec.ts`, `services.spec.ts`, `branch-coverage.spec.ts`)
  - `tests/api/be1/company.spec.ts`
  - `tests/concurrency/be1/company-concurrency.spec.ts`
- Kiểm tra đã chạy:
  - `npm run test:contract:ci` — Node.js v20.18.0 — 21/21 contract tests passed (100%).
  - `npm run test:unit:ci` — Jest 29.7.0 — 14/14 suites, 124/124 unit tests passed, Lines 94.71%, Branches 73.33%.
  - `npm run test:integration:ci` — PostgreSQL 17 docker container `rms-local-postgres-1` trên port 5432 — 8/8 suites, 75/75 tests passed (100%).
- Kiểm tra chưa chạy / coverage: E2E Frontend (UI14, UI15, UI26) chưa chạy do phạm vi FE2 chưa triển khai.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác:
  - Mở khóa hoàn toàn `CompanyAccessPort` và `CompanyAdminPort` cho BE2 và BE3.
  - Cung cấp sẵn cơ chế multi-tenancy và membership xác thực để bảo vệ dữ liệu công ty và phân quyền tuyển dụng.
- Phần còn thiếu / blocker: Không có blocker nội bộ BE1. Tiếp tục triển khai Phase 5 (Jobs Publication, Search & Skills UC01, UC05).
- Bước tiếp theo: Bắt đầu Phase 5 theo kế hoạch (Job rules, Salary rules, Skill catalog, Job repository, Job search & publication services, Job ports, Controllers, Unit/Integration/Concurrency tests).

### 2026-10-22 19:28 (Asia/Saigon) — BE1 — Hoàn thành Phase 3 (Auth UC04), bắt đầu Phase 4 (Company UC11)

- Mã báo cáo: 20261022-1928-BE1-phase-3-hoan-thanh
- Người thực hiện / AI hỗ trợ: Antigravity AI hỗ trợ kỹ sư BE1 theo yêu cầu người dùng.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: UC04; FR01; BR15, BR18, BR20; TC26, TC31, TC32, TC33, TC34; EC19, EC20, EC23; plans/261022-1711-be1-complete-implementation (Phase 3 Authentication, Sessions & Tokens hoàn thành; bắt đầu Phase 4 Company & Memberships UC11).
- Trạng thái: IN_PROGRESS (Phase 1, 2, 3 DONE; Phase 4 IN_PROGRESS).
- Nhánh / commit / PR / tích hợp main: Nhánh `feat/be1-implementation` / commit cục bộ / Chưa gộp main.
- Đã hoàn thành:
  - Triển khai toàn bộ UC04 Authentication, Sessions và Tokens:
    - Rules: `password.rules.ts` (>=10 ký tự, <=72 bytes UTF-8 giới hạn BCrypt, không normalize password), `email.rules.ts` (trim/lowercase, giữ nguyên dot/+tag), `token.rules.ts` (TTL 24h verify / 30m reset, SHA-256, timingSafeEqual), `session.rules.ts` (TTL 24h absolute / 2h idle, CSRF derivation).
    - Crypto A09: `libs/platform/crypto/token-encryption.ts` với AES-256-GCM, IV ngẫu nhiên 12 bytes, AAD context binding (tokenId, userId, purpose, eventId), chặn sửa ciphertext và swap context giữa events.
    - Rate limiter A06: `RateLimiterService` sliding window trong bộ nhớ với bounded entries và tự động prune.
    - Repositories: `PrismaUserRepository`, `PrismaSessionRepository`, `PrismaAuthTokenRepository` với SELECT FOR UPDATE row locking, CAS atomic consumption (`consumeAtomic`), session revocation theo user.
    - Services: `RegisterService` (BCrypt cost 10 ngoài Tx, role CANDIDATE/RECRUITER allowlist, atomic UoW, CandidateProfilePort hook, encrypted outbox event, bắt P2002 duplicate race trả 202), `SessionService` (constant-time login so sánh dummy hash khi email không tồn tại, deterministic CSRF derivation từ session ID và HMAC secret, session lookup và validate idle/expiry/account status), `AuthTokenService` (CAS verify email, resend verification với token invalidation, forgot password 202 silent, CAS reset password kèm đổi hash, bump version và revoke toàn bộ active sessions).
    - Port Adapters: `IdentityCandidateAdapter` (thực hiện `IdentityCandidatePort.assertActiveCandidate` và `updateCandidateName`), `AuthMailMaterialAdapter` (thực hiện `AuthMailMaterialPort.decryptMaterial` cho BE3 mail worker).
    - Controller: `AuthController` với đủ 8 endpoints theo OpenAPI contract (`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/session`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`). Hỗ trợ cookie session (`__Host-recruitment_session` / `recruitment_session`), CORS, CSRF header verification trên mutation.
    - Kiểm thử tự động đầy đủ:
      - Unit tests: 8 test suites, 61/61 tests passed. Đạt độ phủ coverage: Lines 95.39% (vượt ngưỡng 80%), Branches 76.10% (vượt ngưỡng 70%), Statements 95.54%, Functions 98.50%.
      - API tests: `tests/api/be1/auth.spec.ts` 16/16 tests passed trên PostgreSQL 17 thật.
      - Concurrency race tests: `tests/concurrency/be1/auth-concurrency.spec.ts` 3/3 race tests passed (đua đăng ký trùng email đồng thời xử lý duplicate 202, CAS verify email token chỉ 1 thành công 1 lỗi 409, CAS reset password token chỉ 1 thành công 1 lỗi 409).
      - Integration test suite tổng hợp: `npm run test:integration:ci` đạt 6/6 suites, 56/56 tests passed.
- File / bằng chứng:
  - `apps/api/src/modules/identity/rules/` (`password.rules.ts`, `email.rules.ts`, `token.rules.ts`, `session.rules.ts`)
  - `libs/platform/crypto/` (`token-encryption.ts`, `token-encryption.spec.ts`)
  - `apps/api/src/modules/identity/repositories/` (`prisma-user.repository.ts`, `prisma-session.repository.ts`, `prisma-auth-token.repository.ts`)
  - `apps/api/src/modules/identity/services/` (`register.service.ts`, `session.service.ts`, `auth-token.service.ts`)
  - `apps/api/src/modules/identity/ports/` (`identity-candidate.adapter.ts`, `auth-mail-material.adapter.ts`)
  - `apps/api/src/modules/identity/controllers/auth.controller.ts`
  - `apps/api/src/modules/identity/tests/` (`rules.spec.ts`, `services.spec.ts`, `branch-coverage.spec.ts`)
  - `tests/api/be1/auth.spec.ts`
  - `tests/concurrency/be1/auth-concurrency.spec.ts`
- Kiểm tra đã chạy:
  - `npm run test:unit:ci`: 8 suites, 61 passed, lines 95.39%, branches 76.10%.
  - `npm run test:integration:ci`: 6 suites, 56 passed.
  - `npm run test:contract:ci`: 2 suites, 21 passed.
- Kiểm tra chưa chạy / coverage: Chưa chạy integration với worker BE3 Mailpit thật (sẽ thực hiện khi BE3 hoàn thành mail consumer worker).
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Triển khai hoàn chỉnh toàn bộ endpoint Auth UC04 và cấp `IdentityCandidatePort` cho BE2 và `AuthMailMaterialPort` cho BE3.
- Phần còn thiếu / blocker: BE2 `CandidateProfilePort` và BE3 `OutboxPort` chưa có runtime production; đã cắm DI ports sẵn sàng gọi khi BE2/BE3 implement.
- Bước tiếp theo: Bắt đầu Phase 4 (UC11 Companies, Memberships, and Owner Recovery).

### 2026-10-22 19:00 (Asia/Saigon) — BE1 — Hoàn thành Phase 1 & Phase 2, bắt đầu Phase 3 (Auth UC04)

- Mã báo cáo: 20261022-1900-BE1-phase-1-2-hoan-thanh
- Người thực hiện / AI hỗ trợ: Antigravity AI hỗ trợ kỹ sư BE1 theo yêu cầu người dùng.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: BE-FOUNDATION, DB-01, CONTRACT-01, QA-01; plans/261022-1711-be1-complete-implementation (Phase 1 Contracts & Phase 2 Bootstrap/DB hoàn thành; bắt đầu Phase 3 UC04).
- Trạng thái: IN_PROGRESS (Phase 1 & Phase 2 DONE; Phase 3 IN_PROGRESS).
- Nhánh / commit / PR / tích hợp main: Nhánh `feat/be1-implementation` / commit cục bộ / Chưa gộp main.
- Đã hoàn thành:
  - Phase 1: Tạo OpenAPI `contracts/openapi/be1.yaml`, JSON Schema `contracts/schemas/be1.v1.json`, event envelope `contracts/events/be1.v1.json`, fixtures, export public types/DTOs, 8 ports backend BE1/BE2/BE3, bộ 10 contract tests BE1 (`tests/contract/be1-contract.spec.ts`). Chạy `npm run test:contract:ci` đạt 21/21 passed.
  - Phase 2: Schema Prisma 9 bảng BE1 (`prisma/schema.prisma`), migration `20261022185000_be1_foundation` với check constraints và `ON DELETE RESTRICT`, seed data `prisma/seeds/be1.seed.ts`. Bootstrap NestJS 11 với Config validation, ApiExceptionFilter (error envelope chuẩn, che giấu credential, traceId), ResponseInterceptor (`{ data }`), TraceInterceptor, SessionGuard, OriginGuard, CsrfGuard. Chạy kiểm thử tích hợp trên PostgreSQL 17 thật: `tests/integration/be1/identity-schema.spec.ts` và `tests/api/be1/bootstrap-contract.spec.ts` đạt 37/37 tests pass across 4 suites.
- File / bằng chứng: `contracts/openapi/be1.yaml`, `contracts/schemas/be1.v1.json`, `contracts/events/be1.v1.json`, `libs/contracts/public/index.ts`, `libs/contracts/backend/`, `tests/contract/be1-contract.spec.ts`, `prisma/schema.prisma`, `prisma/migrations/20261022185000_be1_foundation/`, `apps/api/src/`, `tests/integration/be1/identity-schema.spec.ts`, `tests/api/be1/bootstrap-contract.spec.ts`.
- Kiểm tra đã chạy:
  - `npm run typecheck:contracts:public` đạt (0 lỗi).
  - `npm run test:contract:ci` đạt 21/21 tests (10 BE1 + 11 BE2).
  - `npm run test:integration:ci` đạt 37/37 tests (4 suites: be1-contract, identity-schema, be2-contract, bootstrap-contract).
  - Seed DB: `npx tsx prisma/seed.ts` thành công.
- Kiểm tra chưa chạy / coverage: Chưa chạy full concurrency race tests và Mailpit auth integration (được triển khai ở Phase 3).
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Đã deploy 9 bảng BE1 lên PostgreSQL và cung cấp toàn bộ ports cho BE2/BE3; mở khóa cho BE2 migration Candidate/Application và BE3 Outbox/Interview.
- Phần còn thiếu / blocker: Backend BE2 `CandidateProfilePort` và BE3 `OutboxPort` chưa có runtime implementation thực; BE1 cung cấp ports và stubs/mocks trong tests, sẵn sàng kết nối khi BE2/BE3 hoàn thành.
- Bước tiếp theo: Triển khai chi tiết Phase 3 (UC04 Authentication, Sessions, Tokens, Reset, Login, Session Guard, CSRF, Encrypted Mail Material, Rate Limiting).

### 2026-10-22 18:35 (Asia/Saigon) — BE1 — Khởi động triển khai toàn bộ BE1 (Phase 1–8)

- Mã báo cáo: 20261022-1835-BE1-khoi-dong-trien-khai
- Người thực hiện / AI hỗ trợ: Antigravity AI hỗ trợ kỹ sư BE1 theo yêu cầu người dùng.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: UC01, UC04, UC05, UC10, UC11; BE-FOUNDATION, DB-01, CONTRACT-01, QA-01, CI-01; plans/261022-1711-be1-complete-implementation (Phases 1–8).
- Trạng thái: IN_PROGRESS
- Nhánh / commit / PR / tích hợp main: Nhánh `feat/be1-implementation` / commit chứa báo cáo này / Chưa gộp main.
- Đã hoàn thành: Đọc AGENTS.md, kế hoạch BE1, kế hoạch BE3, đặc tả hệ thống, hợp đồng tích hợp BE2, ghi chú BE1-BE3. Tạo nhánh riêng `feat/be1-implementation`. Chuyển trạng thái các hạng mục BE1 sang IN_PROGRESS. Bắt đầu Phase 1: Chốt các quyết định A01–A15, xây dựng hợp đồng OpenAPI `contracts/openapi/be1.yaml`, JSON Schema `contracts/schemas/be1.v1.json`, event schemas `contracts/events/be1.v1.json`, ports cho BE1/BE2/BE3, fixture và bộ contract test cho BE1.
- File / bằng chứng: `progress/README.md`.
- Kiểm tra đã chạy: `npm run typecheck` đạt 0 lỗi; `npm run test:unit:ci` đạt 23/23 tests (coverage 97.18% dòng, 100% nhánh); `npm run test:contract:ci` đạt 11/11 tests. Docker daemon và Postgres port 5432 sẵn sàng.
- Kiểm tra chưa chạy / coverage: Chưa chạy integration/concurrency trên PostgreSQL do đang chuẩn bị schema/migration ở Phase 1-2.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Chốt 15 quyết định contract A01–A15 tương thích với BE2 contract và BE3 plan, không sửa breaking contract BE2 đã bàn giao.
- Phần còn thiếu / blocker: Phụ thuộc runtime: Provider Jitsi và Mailpit thật cần kiểm ở các pha tương ứng; Outbox/Audit BE3 và CandidateProfile BE2 sẽ được kết nối theo port đã chốt; ghi rõ blocker nếu thiếu dependency khi chạy integration.
- Bước tiếp theo: Hoàn thiện Phase 1 (contracts/schemas/events/ports/tests), tiếp tục Phase 2 (Bootstrap & DB migration/seed) để mở khóa nền tảng cho BE2 và BE3.

### 2026-10-22 18:18 (Asia/Saigon) — Antigravity — Tích hợp main và đồng bộ kế hoạch BE1/BE3

- Mã báo cáo: 20261022-1818-Antigravity-dong-bo-main-plans
- Người thực hiện / AI hỗ trợ: Antigravity AI hỗ trợ người dùng theo yêu cầu.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: DOC-05, DOC-06, BE2-STEP2, CONTRACT-01, QA-01; tích hợp kế hoạch BE1/BE3 và đồng bộ toàn bộ nhánh `main` với GitHub remote.
- Trạng thái: DONE — hoàn thành tích hợp và đồng bộ lên GitHub `origin/main`.
- Nhánh / commit / PR / tích hợp main: `main` → `origin/main` / commit chứa báo cáo này / Đã gộp và đẩy origin/main thành công.
- Đã hoàn thành: Kéo 2 commit mới của BE2 từ remote (`62215fc`, `905c9aa`), fast-forward và rebase các kế hoạch DOC-05 (BE3) và DOC-06 (BE1); giải quyết conflict `progress/README.md` và `Docs/project-specification.md`, bảo toàn toàn bộ báo cáo lịch sử của BE1, BE2, BE3 theo AGENTS.md; cập nhật unignore exception cho `plans/**/reports/` trong `.gitignore`; chạy `npm install` cập nhật dependencies; xác minh toàn bộ test và linter.
- File / bằng chứng: `progress/README.md`, `Docs/project-specification.md`, `.gitignore`, `plans/261022-1652-be3-complete-implementation/` (12 file), `plans/261022-1711-be1-complete-implementation/` (12 file).
- Kiểm tra đã chạy: `npm run typecheck` đạt (0 lỗi cả backend và web), `npm run typecheck:contracts:public` đạt (0 lỗi), `npm run lint` đạt (0 lỗi, 0 warning), `npm run test:unit:ci` đạt 23/23 tests (4 suites, coverage 97.18% dòng, 100% nhánh), `npm run test:contract:ci` đạt 11/11 tests (1 suite), `git diff --check` đạt.
- Kiểm tra chưa chạy / coverage: Chưa chạy PostgreSQL integration/API/concurrency, FE/E2E hoặc CI pipeline do chưa có migration/DB runtime.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không thay đổi DB/API; hoàn thành tích hợp kế hoạch BE1/BE3 và code nền BE2 lên `main`.
- Phần còn thiếu / blocker: Toàn bộ code nghiệp vụ các UC; BE1 cần khởi tạo Identity migration làm tiền đề cho BE2 và BE3.
- Bước tiếp theo: BE1 tiến hành pha 1 theo kế hoạch triển khai.

### 2026-10-22 17:22 (Asia/Saigon) — BE1 — Kế hoạch triển khai đầy đủ

- Mã báo cáo: 20261022-1722-BE1-ke-hoach-trien-khai
- Người thực hiện / AI hỗ trợ: Codex hỗ trợ BE1 theo yêu cầu; chưa xác nhận tên thật/GitHub người phụ trách, không ký thay thành viên khác.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: DOC-06; kế hoạch UC01/04/05/10/11, FR01–04/15, BR01–05/15–20 và giao điểm BR12; UI01–06/16–18/26–28, options UI07/21; TC01–04/25–26/31–36/55–57, EC19–23/34/37–38 và phối hợp TC12/28–30/43/59–60, EC17/24/29/32–33/39–40; BE-FOUNDATION/DB-01/CONTRACT-01/QA-01/CI-01 và OPS phối hợp BE3 ở mức kế hoạch.
- Trạng thái: DONE — chỉ tài liệu kế hoạch; ClaudeKit xác nhận 8 pha triển khai pending; UC giữ TODO theo bằng chứng hiện có.
- Nhánh / commit / PR / tích hợp main: `main` working tree local / chưa commit / chưa PR / chưa gộp main các thay đổi này; giữ thay đổi BE3 và đặc tả từ lượt trước, không tự commit/push/deploy.
- Đã hoàn thành: Đọc yêu cầu/contract/hiện trạng, scaffold ClaudeKit CLI 8 pha và điền quy trình/từng bước/code inventory/API/port/pseudocode/test; 15 quyết định cần chốt trước code; ma trận milestones BE1↔BE2/BE3; review chéo và sửa 3 findings: advisory lock không dựa role discovery, auth envelope authenticated integrity/AAD, reset chỉ revoke session theo nguồn.
- File / bằng chứng: `plans/261022-1711-be1-complete-implementation/` (12 Markdown: plan, 8 phase, blueprint, verification matrix, reports/plan-review.md); `plans/261022-1652-be3-complete-implementation/plan.md`, `plans/261022-1652-be3-complete-implementation/phase-08-verification-operations-and-handoff.md` (chỉ điểm phối hợp); `progress/README.md`.
- Kiểm tra đã chạy: Git status/branch/log và source/config inventory; `npm exec --yes --package claudekit-cli@4.5.2 -- ck plan create ...` thành công; `ck plan status .../plan.md` qua npm exec: pending, 0/8 completed. Python kiểm cả BE1/BE3 + progress/spec: 26 Markdown, cấu trúc 8 pha BE1, fences/placeholder/whitespace/liên kết, 0 lỗi mới; 5 ảnh thiếu sẵn trong spec được phân biệt. `git diff --check` đạt. Review toàn kế hoạch và cross-plan consistency, không dùng nhận xét TC36 nhầm của agent sau khi đã đối chiếu đúng TC36 OWNER/TC52 saved-job.
- Kiểm tra chưa chạy / coverage: Chưa chạy ứng dụng/typecheck/build/unit/integration/API/CI/provider/load/restore vì lượt này chỉ soạn kế hoạch, chưa sửa source triển khai; coverage Chưa đo. Không dùng mock hoặc tài liệu làm bằng chứng nghiệm thu.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi DB/nghiệp vụ/API/DTO/contract hiện hành. A01–A15 là đề xuất/gate chốt cùng BE2/BE3/FE trước implementation; báo rõ title draft nullable, member identifiers, CSRF/key/rate policies, same-Tx revoke và baseline migrations. Hai plan có relatedPlans/milestone references, không tạo vòng blockedBy toàn phần; CI scripts/manifest dùng chung, BE1 điều phối.
- Phần còn thiếu / blocker: Không có trong phạm vi bàn giao kế hoạch. Triển khai còn toàn bộ code/test; cần UoW/profile/conflict BE2, Outbox/Audit/lifecycle/mail/provider BE3 và HTTPS topology trước nghiệm thu. 5 ảnh spec thiếu sẵn không cản kế hoạch.
- Bước tiếp theo: Khi triển khai, đọc plan chính và mọi tài liệu liên kết; tạo nhánh BE1, chốt A01–A15/ports/fixtures, bootstrap + Identity migration, auth/company/job/admin từng lát cắt có test/OpenAPI/progress, review BE2→BE1 và BE1→BE3.

### 2026-10-22 17:03 (Asia/Saigon) — BE3 — Kế hoạch triển khai đầy đủ

- Mã báo cáo: 20261022-1703-BE3-ke-hoach-trien-khai
- Người thực hiện / AI hỗ trợ: Codex hỗ trợ vai trò BE3 theo yêu cầu; chưa xác nhận tên/GitHub người phụ trách; không ký thay thành viên khác.
- Phạm vi / mã UC, UI, FR, BR, TC, EC hoặc hạ tầng: DOC-05; kế hoạch UC03/08/09/13/15/16, FR09–12/14 và giao điểm FR15, BR01/05/09–20; UI11/13–15/20–25/28; TC14–18/20/24/28–30/44–51/53–54/58–60; EC10–18/24–27/35, phối hợp EC08–09/22/32–33/40; CONTRACT-01/DB-01/WORKER-01/VIDEO-01/QA-01/CI-01/OPS-01 ở mức lập kế hoạch.
- Trạng thái: DONE — chỉ phạm vi tài liệu kế hoạch; các pha triển khai pending, UC giữ TODO theo bằng chứng hiện có.
- Nhánh / commit / PR / tích hợp main: `main` working tree local / chưa commit / chưa có PR / chưa gộp main các thay đổi này; không tự commit/push/deploy.
- Đã hoàn thành: Đọc 6 file Docs và sổ tiến độ, đối chiếu source/config; tạo 8 pha bằng ClaudeKit CLI và điền từng bước/file/class/port/API/transaction/test; blueprint, ma trận kiểm chứng, review chéo và 13 quyết định cần chốt trước phụ thuộc. Sửa link tiến độ cũ trong đặc tả về sổ chung.
- File / bằng chứng: `plans/261022-1652-be3-complete-implementation/` (12 Markdown: plan, 8 phase, blueprint, verification matrix, reports/plan-review.md); `Docs/project-specification.md` (chỉ liên kết sổ tiến độ), `progress/README.md`.
- Kiểm tra đã chạy: PowerShell/Node v24.21.0/npm11.19.0; `npm exec --yes --package claudekit-cli -- ck plan create ...` thành công; `ck plan status .../plan.md` qua npm exec trả pending, 0/8 completed. Python kiểm cuối 14 Markdown/43 liên kết local, cấu trúc 8 phase, code fences/placeholder/whitespace và 12 trường nhật ký: 0 lỗi mới; có 5 ảnh thiếu sẵn trong spec, đã xác nhận đường dẫn có trong `git show HEAD:Docs/project-specification.md`. `git diff --check` đạt; rà source/Git và consistency kế hoạch, xử lý 4 findings cuối theo report.
- Kiểm tra chưa chạy / coverage: Chưa chạy test ứng dụng/typecheck/build/CI/provider/load/restore vì chỉ lập kế hoạch, không sửa source triển khai; coverage Chưa đo. Một lần gọi role planner lỗi model không hỗ trợ; agent mặc định đã thực hiện review tài liệu. Lệnh npm exec gói `claudekit` ban đầu không có executable ck; gói `claudekit-cli` 4.5.2 đã scaffold thành công, không đổi manifest/lockfile dự án.
- Thay đổi DB / API / contract và ảnh hưởng đến người khác: Không đổi schema/nghiệp vụ/endpoint/DTO/contract hiện hành; D01–D13 là đề xuất và gate pha 1 cần BE1/BE2/BE3/FE phối hợp. Không sửa báo cáo gốc hay sổ lịch sử. Bổ sung kế hoạch migration Outbox/Audit sớm, port hủy cuối, evidence/version, auth mail, retry budget và revoke task có ghi rõ chưa chốt.
- Phần còn thiếu / blocker: Không có trong phạm vi bàn giao kế hoạch. Triển khai còn toàn bộ code/test; port/migration BE1/BE2 và provider Jitsi thật là dependency runtime; 5 ảnh thiếu trong đặc tả là tồn tại trước đợt này, không cản lập kế hoạch.
- Bước tiếp theo: Bắt đầu pha 1 theo kế hoạch khi triển khai: nhánh BE3, chốt D01–D13/fixtures/Tx/access/event schemas, spike video; rồi thực hiện từng lát cắt có test/OpenAPI/tiến độ và review BE1→BE3, BE3→BE2.

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
