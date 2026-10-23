---
phase: 6
title: 'Evaluation completion and results'
status: pending
effort: ''
---

# Phase 6: Evaluation completion and results

## Overview

Triển khai UC13 và UC09 trên lịch thật: attendance, phiếu riêng tư, complete/no-show, mark-interviewed và result atomic. Phụ thuộc pha1–4, worker pha3; pha5 cần cho demo toàn luồng. FR11/12, BR09/13/14/17, TC20/47–50, EC08/09/14/15/18/27.

## Requirements

- Attendance chỉ recruiter sau endAt, ABSENT có reason; không đổi người có phiếu thành ABSENT.
- Phiếu chỉ interviewer actor ATTENDED, role/membership/assignment còn hiệu lực; scores nguyên1–5/note1–5000, create không version, edit có version.
- Complete vòng khác mark-interviewed application; HIRED chỉ INTERVIEWED; REJECTED theo graph và lịch đã xử lý.

## Architecture

EvaluationModule dùng InterviewPort/EvaluationReadPort và ApplicationPort; BE3 tính evidence từ rows đã khóa, BE2 sở hữu state/history/result/idempotency. Candidate mapper không import Evaluation entity. ResultPort đã ghi outbox thì workflow BE3 không append trùng `application.result_published`.

## Related Code Files

- Điền EvaluationModule; tạo services/controllers/rules/policy/repository/ports như inventory blueprint.
- Tạo DTO attendance/evaluation/result/completion tách wire fields và domain commands; mapper candidate/public message riêng.
- Phối hợp ApplicationPort.markInterviewed/ResultPort BE2 và app composition root, không sửa application repository.
- Tạo `tests/{api,integration,concurrency,contract}/be3/{evaluation,completion,result}*.spec.ts`, rules unit; OpenAPI/events/FE2 fixtures.

## Implementation Steps

1. Viết unit bảng quyết định attendance/score/note/recommendation/version, boundaries endAt/end+30m, completion và result từng application stage.
2. Attendance endpoint kiểm participantVersion+interviewVersion dưới scope lock, actor/time/reason, audit. Không cho ghi trái trạng thái hoặc thay attendance làm invalid evaluation/COMPLETED; khóa với submit evaluation để tránh race.
3. GET/PUT own evaluation: phân công hợp lệ, ATTENDED, sau endAt/trước final và trước COMPLETED; unique cặp + FK role bảo vệ DB. Duplicate create cạnh tranh một row, request còn lại conflict/read contract rõ; version cũ409.
4. GET application evaluations: recruiter đúng company; candidate/outside scope bị chặn kể cả đoán IDs; DTO interviewer chỉ own record. Note/recommendation không xuất hiện trên candidate detail/history/calendar/notification/email/statistics.
5. Complete: candidate ATTENDED, ≥1 interviewer ATTENDED, không UNKNOWN, đủ phiếu mọi interviewer ATTENDED; state CONFIRMED/sau endAt. Ghi COMPLETED/completed_at, release slots và event/audit cùng Tx; khóa phiếu sau complete.
6. NO_SHOW: DB time≥end+30m, candidate ABSENT hoặc mọi interviewer ABSENT, reason+attendance hợp lệ; release slot và record outcome. Không tạo phiếu giả, không tự INTERVIEWED.
7. Mark-interviewed riêng: ít nhất1 COMPLETED, đủ phiếu, không PROPOSED/CONFIRMED; gọi ApplicationPort với evidence/expectedVersion/Tx. Complete cuối vẫn giữ INTERVIEW_SCHEDULED cho đến lệnh này.
8. Result UI preview dùng public `message` đã normalize; POST result wire fields theo D04. HIRED chỉ INTERVIEWED; REJECTED ở phase interview phải không CONFIRMED, cancel PROPOSED cùng Tx. Không âm thầm cancel confirmed để vượt điều kiện.
9. Publish workflow thu đủ IDs/canonical locks/recheck, IdempotencyStore cùng Tx, ResultPort ghi status/message/publishedAt/history/cancel CV request/outbox/key. Thiếu reason cho REJECTED400; immutable final không cho sửa lại. Lỗi History/Outbox/audit rollback cả proposal/result/key.
10. Test withdraw vs result cùng expectedVersion bằng hai connection/barrier: chỉ1 commit, không WITHDRAWN kèm published result/email giả. Retry key cùng payload đúng quyền trả cùng resource, khác payload409, mất quyền thì không replay.
11. Mailpit integration kiểm chỉ public result message, worker failure không rollback quyết định. Bàn giao UI11/14/20/22/23 cùng FE21/33/35/36 fixtures/errors và OpenAPI, cập nhật tiến độ.

## Success Criteria

- [ ] TC20/47–50, EC08/09/14/15/18/27 có bằng chứng unit/API/DB/concurrency.
- [ ] Complete/no-show/mark-interviewed tách đúng; phiếu đóng sau complete/final.
- [ ] Result/history/key/outbox atomic; result vs withdraw chỉ một commit; candidate không lộ dữ liệu nội bộ.
- [ ] Các GET phục vụ FE và DTO version/error examples đầy đủ, mail lỗi không mất kết quả.

## Risk Assessment

Race attendance/evaluation/complete cần cùng tập khóa và Tx; check DTO một lần không đủ. Dữ liệu nội bộ có thể rò qua log/event mapper dùng spread; dùng allowlist và contract test forbidden fields ở mọi output. Không mở lại final result trong phạm vi phiên bản đầu.
