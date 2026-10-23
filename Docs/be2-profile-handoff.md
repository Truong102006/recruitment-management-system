# BE2 — UC12 hồ sơ cá nhân (bước 4)

Nguồn quy tắc: [đặc tả](project-specification.md) UC12, mục 5.1, BR18 và [hợp đồng BE2](be2-integration-contract.md). Phần code độc lập BE2 đã có; **UC12 chưa chạy từ HTTP**.

## FE và BE1 sử dụng

- [OpenAPI UC12](../contracts/openapi/be2-profile.v1.json) mô tả `GET/PATCH /api/candidate/profile`, cookie session, `X-CSRF-Token` khi PATCH, request `version` và response `{ data: CandidateProfileDto }`. [JSON Schema](../contracts/schemas/be2.v1.json) kiểm DTO; [public type](../libs/contracts/public/index.ts) dùng cho FE. Đây là contract, chưa phải server đã bật route.
- `CandidateProfileService.get/patch(actor,...)` nhận actor từ BE1, gọi `IdentityCandidatePort.assertActiveCandidate` trong transaction. PATCH khóa user qua port BE1, khóa profile, so version, xác nhận skill active qua `SkillCatalogPort`; `updateCandidateName`, profile, candidate_skill và Outbox cùng `tx`.
- `PrismaCandidateProfileRepository` hiện thực `CandidateProfilePort.ensureForCandidate` cho BE1 gọi **cùng transaction cấp role CANDIDATE**. `getSubmissionSnapshot` dùng tên/email BE1 và phone/headline BE2 cho lần nộp sau. Không sửa `application.candidate_snapshot` cũ.
- Skill trùng được chuẩn thành tập; field lạ bị từ chối; text trim/NFC, trường tùy chọn rỗng thành NULL; version cũ trả `VERSION_CONFLICT`. DTO ra dùng mapper allowlist. Tên cột BE1 là `user_account.full_name`, không tạo bản sao ở candidate_profile.

## Để bật route

BE1 cần gộp auth/session guard, CSRF/Origin check, IdentityCandidatePort và SkillCatalogPort thật; migration BE1/BE2 phải chạy. Sau đó bind service/repository trong Nest CandidateModule, đăng ký controller GET/PATCH dùng actor do guard cấp, map lỗi chuẩn và chạy API/integration test với PostgreSQL. Không đăng ký controller chưa có guard vì có thể tạo endpoint profile thiếu xác thực.

Đã có unit test với fake transaction kiểm version, skill, allowlist, rollback BE1 name/BE2 profile khi Outbox lỗi, và snapshot cũ giữ nguyên; contract test kiểm JSON/OpenAPI. Chưa có PostgreSQL/API test nên trạng thái UC12 trong sổ chung vẫn `IN_PROGRESS`.
