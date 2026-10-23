# Rà soát kế hoạch BE1 — 22/10/2026

## Phạm vi

Codex đối chiếu AGENTS, đặc tả, báo cáo8.3, contract BE2, ghi chú BE1/BE3, setup, sổ tiến độ và kế hoạch BE3; agent hỗ trợ đọc yêu cầu và rà soát plan theo workflow `ck:plan`. Đây là review tài liệu, không là test runtime hay nghiệm thu bảo mật.

Kế hoạch scaffold bằng ClaudeKit CLI 4.5.2, 8 pha pending; không có Claude Task tools/set-active-plan hook trong repo nên dùng phase checklists. Source hiện còn giữ chỗ, không có model nghiệp vụ trong Prisma. Node/npm và Git được kiểm khi lập kế hoạch, không chạy app/test/CI.

## Các thiếu sót nguồn đã đưa thành gate

| Điểm cần xử lý | Gate trong blueprint |
|---|---|
| Tên full_name/name và version cập nhật profile | A01, IdentityProfilePort và mapper, BE2 UC12 cùng Tx |
| Member email/userId/memberId/versions | A02/A03, không tạo public email directory hay UUID giả |
| GET CSRF từ hash, topology Secure cookie, rate/backend/BCrypt | A04–A06, browser tests và runtime dependency verification |
| Register cần facade BE2 và Outbox/Audit BE3 sớm | A07/A08, baseline milestone hai chiều không chờ vòng |
| Encrypted auth envelope/key/cleanup, worker validity | A09, matched BE3 D08; không plaintext/log/admin leak |
| Ordinary membership revoke khác security lock/suspend | A10, same Tx generation/revoke intent, không chờ event mới deny join |
| DRAFT thiếu field nhưng title NOT NULL | A11, đề xuất nullable có CHECK; chưa thay schema |
| Search skills/normalized name/money precision | A12, schema/FE contract chốt trước code |
| Last OWNER/ADMIN và canonical lock order | A13, advisory lock trước user locks và revalidation |
| Company PENDING/REJECTED management khác recruiting APPROVED | A14, không dùng assertRecruiter operational cho mọi UC11 |
| BE3 reporting read snapshot/idempotency coverage | A15, typed facts/read Tx/asOf, không direct repository |

Review yêu cầu đã kiểm lại một nhận xét nhầm mapping TC36 của agent và rút bỏ: **TC36 đúng là OWNER cuối/company scope; TC52 mới là saved-job BE2**. Ma trận kế hoạch dùng mapping đã xác minh trực tiếp từ các cell test nguồn.

## Phối hợp với kế hoạch BE3

- Bổ sung relatedPlans/link hai chiều và ma trận milestone Identity→Outbox/Audit→producer/company/job→Interview/Admin revoke.
- Không dùng top-level blockedBy đối ứng cho hai kế hoạch vì sẽ chặn cả baseline có thể làm ngay; dependency thực được đặt gate theo pha, không quảng cáo CLI tự hiểu relatedPlans.
- BE1 điều phối CI skeleton/gate, BE2/BE3 bổ sung suite; một bộ evidence/migration scripts và manifest chung. Kế hoạch BE3 pha 8 đã có ghi chú phối hợp này.
- Quyết định mới chỉ nằm trong plan; không tự thay contract gốc/BR/API/schema.

## Kiểm tra và giới hạn

Review chéo toàn kế hoạch tìm thấy3 điểm và đã sửa: advisory lock lấy cho mọi lệnh khóa user/thu hồi ADMIN thay vì dựa role discovery; auth envelope có authenticated encryption/nonce riêng/AAD gắn IDs và test tamper/swap; bỏ reset khỏi video-revoke triggers vì UC04 chỉ yêu cầu thu hồi session. Đã rà lại blueprint và phase liên quan để giữ cùng hành vi. Các quyết định mở A01–A15 vẫn là gate contract, không biến thành runtime đã đạt.

ClaudeKit status xác nhận pending0/8 completed. Kiểm relative links, phase sections, code fences, placeholders và whitespace toàn bộ tài liệu liên quan; kết quả cuối ghi trong `progress/README.md`. Spec có5 ảnh image16–20 thiếu sẵn từ đợt trước, không tạo file giả. `git diff --check` kiểm các file tracked, file plan mới được kiểm whitespace riêng.

Chưa test ứng dụng/typecheck/build/provider/load/restore/CI, coverage chưa đo; không code production hoặc commit/push/deploy. Không có blocker để bàn giao tài liệu; khi thực thi còn gate A01–A15, runtime/migrations/ports BE2/BE3 và provider Jitsi/HTTPS cần evidence thật.
