# Sửa lỗi thiếu bảng và hồ sơ ứng viên trên cloud — 26/10/2026

## Kết quả

Đã hoàn tất phạm vi CLOUD-PROFILE-REPAIR-01: Neon cloud có đủ 6 migration, 8 profile cho 8 account CANDIDATE, không còn account CANDIDATE thiếu profile. GET/PATCH hồ sơ và thao tác lưu từ UI thật hoạt động. Mật khẩu và role demo giữ nguyên; API localhost 3000 hiện dùng `.env` cloud, FE 5173 đang chạy.

Source dựa trên `main` `4fba158` + các sửa local từ lượt trước; migration/test/tài liệu mới chưa commit/merge. Database cloud đã được nâng schema theo yêu cầu sửa lỗi của người dùng, không đồng nghĩa đã deploy source lên dịch vụ hosting.

## Nguyên nhân và thay đổi

- Cloud chỉ áp 2 migration BE1 cũ; thiếu toàn bộ BE2 profile/skills và BE3 Outbox mà PATCH profile cần. Hai checksum đã áp khớp file source, không có migration thất bại.
- Thêm migration `20261026010000_backfill_candidate_profiles`: INSERT profile rỗng cho account có role CANDIDATE, gồm account nhiều role, ON CONFLICT DO NOTHING giữ dữ liệu/version/updated_at cũ. Không tự cấp role, xác minh email hoặc mở khóa account.
- Sau test local, dùng Prisma migrate deploy áp BE2 candidate/application, BE3 foundation, BE1 normalize và backfill lên cloud. Không dùng db push/reset hoặc tạo bảng lẻ.
- Trước/sau migration vẫn có 13 account, 5 company, 3 job; fingerprint credentials/roles và business state không đổi. Không hàng text cũ nào cần normalization theo preflight. Backfill tạo 8 profile; thiếu 0.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả | Artifact local |
| --- | --- | --- |
| Prisma đọc migration history/checksum, đếm dữ liệu, fingerprint trước deploy | 2 migration khớp source; 8 CANDIDATE thiếu bảng/profile; normalize affected rows 0 | `reports/auth-roles/cloud-profile-preflight.json` |
| Jest `tests/integration/be2/profile-backfill-migration.spec.ts` trên PostgreSQL local/schema UUID | 1 test đạt: candidate-only/multi-role, không tạo cho ADMIN, giữ profile/version, lặp không đổi dữ liệu | `reports/auth-roles/profile-backfill-migration.log` |
| `npm run verify:migrations` với MIGRATION_TEST_DATABASE_URL localhost | Chuỗi 6 migration từ schema rỗng và deploy lặp đạt; constraint/index smoke đạt | `reports/auth-roles/profile-migration-smoke.log`, `reports/backend/migrations/result.json` |
| `node --env-file=.env node_modules/prisma/build/index.js migrate deploy` | 4 migration còn thiếu áp thành công | `reports/auth-roles/cloud-profile-migrate.log` |
| Prisma kiểm sau deploy, migrate status | 6 migration hoàn tất, schema up to date, 8 profile/8 candidates; credentials/role/business state không đổi | `reports/auth-roles/cloud-profile-postflight.json`, `cloud-profile-migration-status.log` |
| `node --env-file=.env scripts/qa/cloud-profile-smoke.mjs` | 33/33 đạt: login, profile đúng actor, save/persist, CSRF, chặn override userId, version conflict, Outbox transaction, restore/logout; ADMIN 403, LOCKED 401 | `reports/auth-roles/cloud-profile-api-verification.json` |
| Playwright smoke browser tại localhost dùng cloud | Đọc đúng email demo, UI save 200, đọc lại giá trị đã lưu, không page error; khôi phục headline fixture qua API 200 và logout 204 | `reports/auth-roles/cloud-profile-browser.json`, `cloud-profile-browser.png` |
| Typecheck, ESLint test mới, Node syntax và diff/liên kết cuối lượt | Typecheck/lint/syntax đạt; kiểm tài liệu cuối lượt | `reports/auth-roles/cloud-profile-typecheck.log` và working tree |

Smoke chỉ ghi thử location/headline của `candidate.demo@example.test`, sau đó khôi phục giá trị gốc; version và sự kiện profile_updated tăng theo nghiệp vụ, không xóa lịch sử để giả lập chưa từng ghi. Lần thử browser đầu timeout khi chờ bước phục hồi; đã xác nhận lần save đó được ghi, lượt browser cuối lưu/đọc lại và khôi phục bằng API thành công. Không chạy Jest hoặc full integration suite vào cloud.

## Phạm vi chưa nghiệm thu

Chưa chạy lại toàn bộ unit/FE/E2E suite hoặc đo coverage mới vì không thay code ứng dụng; đã chạy regression migration, smoke chuỗi migration, typecheck và kiểm API/browser liên quan trực tiếp. API CV/video/evaluation/reporting, worker gửi mail, provider thật, HTTPS/tải/restore không thuộc phạm vi sửa lỗi thiếu profile. UC tổng thể vẫn IN_PROGRESS.

## Bước tiếp theo

Người dùng đăng nhập lại và mở `/candidate/profile`. Nhóm review/đưa migration cùng test và tài liệu vào Git theo yêu cầu riêng, để các môi trường khác có cùng lịch sử schema; không sửa migration đã áp trên cloud.
