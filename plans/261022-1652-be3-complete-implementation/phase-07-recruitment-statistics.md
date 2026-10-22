---
phase: 7
title: "Recruitment statistics"
status: pending
effort: ""
---

# Phase 7: Recruitment statistics

## Overview

Triển khai UC16 sau khi luồng bắt buộc ổn định. Phụ thuộc pha1 D07, schema/fixtures và ports BE1/BE2; chạy sau pha6 theo thứ tự mặc định. FR14, BR19, TC53/54 EC35; UI25/FE38.

## Requirements

- from/to ISO offset, from<to, period≤366 ngày, company/job scope chính xác.
- Count tin theo published_at, application cohort theo submitted_at `[from,to)`, milestone distinct từng application, rate NULL nếu denominator0.
- Có asOf/snapshot nhất quán; ADMIN chỉ aggregate không PII/drill-down.

## Architecture

StatisticsController → ReportingPolicy/CohortRules → RecruitmentStatisticsService → BE1 job facts + BE2 ApplicationPort.getReportingFacts. Truy vấn lịch sử ở owner BE2, không join evaluation/skills; reporting không ghi bảng nghiệp vụ. D07 cần read Tx/snapshot nhất quán (ví dụ read-only repeatable-read do UoW hỗ trợ) hoặc owner query gộp có cùng asOf; không mở nested Tx bên trong command.

## Related Code Files

- Điền `apps/api/src/modules/reporting/reporting.module.ts`; tạo `controllers/statistics.controller.ts`, `services/recruitment-statistics.service.ts`, `policies/reporting.policy.ts`, `rules/cohort.rules.ts`, DTO/mappers.
- Phối hợp job facts read port BE1, reporting facts read port BE2; chỉ tạo `statistics-read.repository.ts` nếu adapter thực cần theo contract, không thêm lớp pass-through vô nghĩa.
- Tạo `tests/{api,integration,contract}/be3/statistics*.spec.ts`, unit cohort/rate; fixtures 10 hồ sơ/4 shortlisted/0 hired, OpenAPI.

## Implementation Steps

1. Viết rules/tests period: cùng ngày/đảo ngày/no offset/366 ngày/+1ms, from inclusive/to exclusive, company/job khác scope.
2. ReportingPolicy xác định company từ actor; recruiter không đổi companyId để vượt scope; job phải thuộc company. ADMIN aggregate có DTO/scope riêng, không mở quyền xem application/evaluation cá nhân.
3. Chốt output counts/milestones/denominator/rates/asOf với FE2; rate 0–1 hoặc percent phải thống nhất schema, không tùy client đoán (đề xuất0–1 ở blueprint).
4. BE1 count published jobs; BE2 count cohort và distinct application từng đạt mốc đến asOf. Trường hợp vòng lùi SHORTLISTED/INTERVIEW_SCHEDULED không đếm lặp; cohort vẫn theo lần nộp ban đầu.
5. Dùng snapshot/asOf đã chốt; test có mutation giữa các query không làm numerator/denominator sai. Kiểm sample0 trả null, sample10/4→0.4, hire0→0.
6. Fixture thêm nhiều skill/evaluation/history, hồ sơ rút/từ chối và tin đóng; xác nhận JOIN không nhân count và không làm mất cohort.
7. Kiểm execution plan/index theo dữ liệu đủ lớn; bổ sung index ở owner bằng migration mới nếu có bằng chứng, không cache/materialized view trước khi đo.
8. API/contract tests + FE38 fixtures; ghi kết quả/coverage thực, cập nhật tài liệu nếu thêm read contract.

## Success Criteria

- [ ] TC53/54 EC35 đạt; period/scope/cohort/milestone/rate/asOf đối soát fixture được.
- [ ] Snapshot nhất quán và không count lặp; không raw repository BE2 hoặc PII.
- [ ] OpenAPI và FE2 sử dụng đúng đơn vị rate/null; index changes có evidence khi cần.

## Risk Assessment

asOf đơn thuần không tạo snapshot consistency: phải có chiến lược đọc thực và test concurrent. Không lấy số interview/evaluation làm tử số application. UC16 ưu tiên sau core nhưng vẫn phải hoàn thành để coi toàn bộ BE3 xong.
