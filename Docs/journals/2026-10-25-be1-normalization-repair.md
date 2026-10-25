---
date: '2026-10-25'
timezone: Asia/Saigon
author: Codex hỗ trợ BE1
branch: fix/be1-acceptance-20261025
status: in-progress
---

# Sửa OWNER và chuẩn hóa văn bản BE1

## Bối cảnh

Tiếp tục UC01/04/05/10/11 theo kế hoạch BE1 và audit 25/10. Baseline AppModule thật trên PostgreSQL local disposable tái hiện 8 assertion lỗi: thiếu provider BE3/register 503; company nhận tên/địa chỉ trắng; Job ghi văn bản chưa chuẩn hóa; độ dài emoji sai; thứ tự search theo ngày tạo; company mất OWNER khả dụng vẫn tạo nháp. Đợt sửa chưa commit/chưa gộp main.

## Thay đổi và quyết định

- Mọi mutation Job thường kiểm OWNER khả dụng dưới khóa company sau scope policy; security lock/recovery ADMIN vẫn giữ workflow riêng.
- Company create/update/resubmit, Job và fullName đăng ký trim/NFC trước validation/persistence; chuỗi bắt buộc không nhận trắng/null, field PATCH bỏ qua giữ cũ. Password và token giữ nguyên.
- `.length` JavaScript đếm UTF-16 code unit; validator.js còn bỏ variation selector khi đếm Length. BR18 cần đếm từng Unicode code point sau NFC, nên dùng helper/validator chung và bảo vệ cả service caller nội bộ. Regression có emoji, dấu tổ hợp và variation selector.
- Search mặc định publishedAt DESC/id DESC; vẫn giữ createdAt tường minh và sortOrder. Review phát hiện normalize writer mới chưa sửa dữ liệu NFD cũ, làm search hoặc publish draft legacy sai.
- Thêm migration `20261025073000_be1_normalize_text`: một DO nguyên tử, trim đúng ECMAScript whitespace rồi NFC trên ordinary text BE1, NULL giữ nguyên. Chỉ hàng đổi tăng version/updated_at; giữ trạng thái/deadline/publication/close timestamp, credentials và BE2 snapshots. Overflow/constraint rollback toàn DO, không truncate. Rollout dừng API/worker cũ và mọi writer liên quan, migrate rồi mới khởi động phiên bản mới để không tái ghi NFD; client có version cũ phải tải lại sau 409. Lượt này chỉ deploy DB test local, không áp DB chung. Publish cũng normalize draft legacy trong transaction trước completeness.
- Hook setup integration chuyển 30 giây để đủ cold-start; không tăng timeout assertion nghiệp vụ hoặc bỏ test.

## Bằng chứng và giới hạn

Snapshot trước migration/legacy publish cuối: 43 suites/366 unit, coverage cấu hình 91,60% lines/77,01% branches; integration 15 suites/123 tests đạt sau chỉnh setup (lần đầu 5 failure do setup). Lint workspace/build/typecheck/public contracts, evidence-tool 8 tests, DB guard 3 và migration smoke đạt. Đây là kết quả trung gian trước các thay đổi legacy cuối. Cập nhật sau legacy publish: **43 suites/368 unit đạt**; probe AppModule thật **6/8 đạt**, chỉ còn F01 thiếu runtime ports và đăng ký 503. Integration/migration regression cuối vẫn đang chạy; fixture snapshot thiếu headline bị constraint `ck_application_snapshot` từ chối cần sửa fixture, chưa phải bằng chứng migration lỗi. Kết quả cuối, coverage mới và lệnh/log cụ thể nằm trong [sổ tiến độ](../../progress/README.md).

Chưa đủ điều kiện DONE toàn BE1: thiếu 5 provider BE3 Outbox/Audit/InterviewMembership/InterviewSecurity/InterviewAdmin, email/video/revoke thật, HTTPS/browser, load/restore, DB roles/historical upgrade và review liên nhóm. Audit vẫn 16 vulnerability, gồm 7 High/2 Critical. Không coi test double, review AI hoặc gate local là nghiệm thu provider/human review/hosted CI.

## Bước tiếp theo

Kết quả cuối: 43 suites/368 unit, coverage BE cấu hình91,61% lines/77,56% branches;16 suites/126 integration (gồm25 contract và3 migration regression),30 files/124 web tests đạt. Lint/typecheck/build/migration/evidence/format đạt; probe6/8 chỉ còn F01. Fixture snapshot đã bổ sung headline:null đúng contract và migration/HTTP legacy search/atomic rollback đạt. Scoped AI review không còn finding Critical/High/Medium mới. Xem [báo cáo cuối](../../plans/261022-1711-be1-complete-implementation/reports/261025-be1-fixes-verification.md); các kết quả trung gian ở trên giữ làm lịch sử.

Phối hợp owner BE3/BE2/FE hoàn tất runtime, provider và các gate vận hành trước khi đổi trạng thái các pha; chưa commit/push hoặc áp migration DB chung.
