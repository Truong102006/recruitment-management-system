---
phase: 4
title: 'Interview scheduling lifecycle'
status: pending
effort: ''
---

# Phase 4: Interview scheduling lifecycle

## Overview

Triển khai UC08 đầy đủ proposal/respond/confirm/reschedule/cancel/expire, API đọc và port cho BE2 withdraw. Phụ thuộc pha 1–3 và Application/access ports thật cho integration. FR09, BR05/09–11, TC14/15/44–46, EC10–13/17.

## Requirements

- SHORTLISTED hoặc INTERVIEW_SCHEDULED; company APPROVED; candidate đúng application, interviewer1–10 không lặp/candidate, role INTERVIEWER và membership hợp lệ.
- PROPOSED không giữ slot; response ACCEPT cuối xác nhận nguyên tử, không endpoint confirm riêng.
- Replacement giữ lịch cũ cho đến commit lịch mới; nhiều vòng và cancel cuối theo state machine.

## Architecture

Dùng các service Interview trong blueprint, ScheduleRules/Policy, repository chỉ ghi bảng BE3; ApplicationPort ghi application/history. LifecyclePort được ExitCoordinator BE2 gọi với cùng Tx. Khóa user toàn hệ thống + exclusion bảo vệ overlap kể cả khác company. Xem pseudocode respond trong blueprint.

## Related Code Files

- Điền InterviewModule; tạo controller/service propose/respond/reschedule/cancel, `rules/schedule.rules.ts`, policy/repository/DTO/mappers/lifecycle port như inventory.
- Tạo `apps/worker/src/jobs/expire-proposals.job.ts`, `reconciliation/reservation-reconciliation.ts`.
- Phối hợp BE2 command D01 và ExitCoordinator; BE1 membership scheduling-access adapter; nối DI ở app/worker root.
- Tạo `tests/{api,integration,concurrency,contract}/be3/interview-*.spec.ts`, ScheduleRules/Policy unit, OpenAPI/event schemas và fixtures FE2.

## Implementation Steps

1. Viết table tests duration14/15/120/121m và lệch1ms, start tương lai, interviewer rỗng/lặp/11/người sai company/self, version cũ, input không offset.
2. Propose: normalize DTO, thu scope/khóa/kiểm quyền và applicationVersion; create interview+candidate/interviewers+audit/outbox/key. Không tự ACCEPT thay participant. `expires_at=start_at`.
3. GET calendar/detail/application rounds query scope từ actor; recruiter có thể đọc đúng company, INTERVIEWER chỉ được phân công. Query count cùng scope; không room grant/score/note; UTC trả API, UI hiển thị giờ Việt Nam.
4. Respond: chỉ actor participant, PROPOSED chưa hết hạn; ghi version/response. DECLINED kết thúc proposal, thông báo organizer và không tác động old replacement.
5. ACCEPT cuối: khóa full scope cũ/mới theo chuẩn, kiểm lại active membership/time/versions, insert đủ reservation và confirm + ApplicationPort + History/Outbox một Tx. Exclusion conflict trả409 và rollback response cuối về PENDING.
6. Reschedule: old CONFIRMED/chưa start, tạo proposal mới `replaces_interview_id`, expiry=min(old.start,new.start), unique one PROPOSED replacement. Old chưa release slot. Confirm replacement release old/create new/cancel old/tăng generation/outbox cùng Tx; fault giữa chừng rollback cả old/new.
7. Cancel thường chỉ trước start, reason/version; cancel old kéo theo proposals thay thế, release active reservations và REVOKE_PENDING. Dùng command BE2 D01 nếu không còn CONFIRMED và chưa có COMPLETED/NO_SHOW; không lùi sau complete/no-show.
8. LifecyclePort cancelOpenForApplication cho WITHDRAWN cho phép sau start theo đặc tả; system/security path phải có purpose/reason, giữ COMPLETED/NO_SHOW và đảm bảo audit. Không tự gọi provider trong Tx.
9. Expire job khóa/recheck DB time, chuyển PROPOSED→EXPIRED, audit/outbox. Request confirm kiểm expiry ngay cả worker chưa chạy; nếu cần persist expired, dùng tác vụ riêng theo D12, không mất update do throw rollback.
10. Reconciliation phát hiện CONFIRMED thiếu slot/slot ngoài trạng thái/interval không khớp; tạo cảnh báo + runbook, không tự xóa reservation để che lỗi. Chạy đồng thời với mutation an toàn qua snapshot/locks.
11. Test nhiều connection có barrier: 2 ACCEPT cuối overlap, khác company cùng user, confirm vs withdraw, membership vs confirm, reschedule fault sau release; assert response+DB+history/outbox+reservations. Chốt contract FE34 giữ input khi409.
12. Xuất OpenAPI/examples/event v1, demo fixture UI13/14/20/21 và cập nhật tiến độ/đặc tả khi đổi chi tiết contract.

## Success Criteria

- [ ] Không CONFIRMED thiếu ACCEPT/slot; PROPOSED không slot; adjacent intervals được phép.
- [ ] Replacement lỗi giữ nguyên old; expire/decline/cancel cascade đúng; cancel cuối qua port BE2.
- [ ] TC14/15/44–46, EC10–13/17 và confirm-vs-withdraw có test thực PostgreSQL.
- [ ] API list/detail/total không lộ scope, scheduler/reconciliation/fixtures đủ; audit/outbox atomic.

## Risk Assessment

Nhầm application stage với số lịch mở gây lùi sai: kiểm toàn bộ rounds dưới khóa. Test đồng thời phải thực sự chồng request bằng barrier, không `Promise.all` với mock một connection. Overlap response không tiết lộ tên công ty/người/lịch riêng.
