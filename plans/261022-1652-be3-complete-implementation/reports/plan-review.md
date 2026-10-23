# Rà soát kế hoạch BE3 — 22/10/2026

## Phạm vi và nguồn

Codex đọc 6 tài liệu `Docs`, sổ tiến độ, source/config hiện có; agent hỗ trợ rà báo cáo/đặc tả và tìm thiếu sót theo workflow `ck:plan`. Một lần gọi role planner không chạy được vì runtime không hỗ trợ model của role; đã dùng agent mặc định để phân tích tài liệu. Không có kết quả từ lần gọi lỗi được dùng làm bằng chứng.

Kế hoạch tạo bằng ClaudeKit CLI 4.5.2 qua npm exec, project-local. Source ứng dụng/worker/seed trống, schema chưa có models; không có plan cũ cần cập nhật dependency. Không có `Docs/development-rules.md` hay script set-active-plan trong repo; áp dụng AGENTS/spec/setup thực có. Task tools Claude không khả dụng, checklist phase là nguồn theo dõi.

## Findings đã đưa vào kế hoạch

| Rủi ro/thiếu sót | Cách xử lý trong kế hoạch |
|---|---|
| Thiếu command application lùi khi cancel cuối | D01, pha1/4: BE2 command chuyên biệt có evidence/version/Tx |
| Result evidence/version và DTO tên khác nhau | D02/D04/D11, pha1/6: khóa contract trước phụ thuộc |
| Outbox migration quá muộn | D03, pha2: đề xuất baseline Outbox/Audit sau Identity |
| Audit actor_type và aggregate allowlist chưa thống nhất | D05/D06: phương án và owner; chưa âm thầm đổi schema |
| Reporting asOf không tự tạo snapshot | D07, pha7: read strategy/Tx nhất quán và test concurrent |
| Auth mail cần vật liệu bí mật khác event nghiệp vụ | D08, pha3: owner BE1, mã hóa/validity/sanitized admin APIs |
| Calendar/evaluation/unread/admin read endpoints dễ thiếu | D09, API matrix và pha3/4/6/7 |
| Jitsi token TTL không chứng minh revoke | D10, prototype pha1 và gate provider thật pha5 |
| Expire update rollback cùng lỗi request | D12, pha4: request checks DB time và expiry job riêng |
| Worker stale generation/attempt6 crash | Blueprint/pha3/5: CAS và giới hạn recovery, không ack revoke mới |
| Test/FE dồn cuối | Mỗi pha có fixtures/OpenAPI/test gate; pha8 chỉ nghiệm thu tổng |
| Thiếu vận hành/audit operations | Pha3 admin events/audit; pha8 metrics/load/restore/review/handoff |
| Review vòng cuối: retry hết budget không chạy lại được | Thêm D13: chu kỳ ADMIN mới, audit attempts cũ, giữ eventId |
| Review vòng cuối: revoke chưa có nơi lưu work item | Dùng revoke Outbox event tới provider ack, test crash sau event cha DONE |
| Review vòng cuối: MailPort chỉ có public variables | Thêm discriminated auth/public input; auth material chỉ trong bộ nhớ |
| Review vòng cuối: replay key gặp final-state rule | Pseudocode trả completed key sau kiểm quyền trước kiểm cạnh/version mới |

## Kiểm tra tài liệu

- `ck plan status .../plan.md`: pending, 0/8 completed; không pha nào được báo triển khai xong.
- Kiểm cấu trúc 8 phase: Overview/Requirements/Architecture/Related Code Files/Implementation Steps/Success Criteria/Risk Assessment; không còn stub placeholder.
- Kiểm relative links và code fences cho plan/progress/spec. Lần đầu phát hiện link report này chưa tạo và 5 ảnh thiếu trong đặc tả; report được tạo trước kiểm cuối.
- 5 asset được tham chiếu nhưng chưa có: `Docs/Bao_Cao_SE113_media/image16.png` đến `image20.png`; thuộc tài liệu có trước, không có ảnh để khôi phục trong phạm vi lập kế hoạch. Không coi toàn bộ liên kết spec đạt.
- `git diff --check` dùng kiểm whitespace; có bước kiểm riêng file plan mới vì untracked chưa xuất hiện trong diff mặc định.

## Điều kiện còn mở khi thực thi

D01–D13 là quyết định phải chốt giữa BE1/BE2/BE3/FE, không phải hành vi mới đã được phê duyệt. Review toàn kế hoạch tìm được 4 chỗ cần làm rõ ở vòng cuối; cả 4 đã được sửa như bảng trên. Ports/migrations/runtime BE1/BE2, provider Jitsi thật, test môi trường và evidence vẫn chưa có. Không có blocker để bàn giao tài liệu kế hoạch; chưa thể đánh bất kỳ UC nào DONE.

Test ứng dụng chưa chạy vì lượt này chỉ tạo tài liệu; coverage chưa đo; chưa CI/provider/load/restore. Không triển khai production code, không commit/push/deploy. Bước thực hiện đầu tiên là pha1 và prototype provider với scope/fixture đã nêu.
