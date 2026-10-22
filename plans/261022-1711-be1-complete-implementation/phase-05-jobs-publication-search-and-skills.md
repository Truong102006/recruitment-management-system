---
phase: 5
title: "Jobs publication search and skills"
status: pending
effort: ""
---

# Phase 5: Jobs publication search and skills

## Overview

Triển khai UC01/UC05 trọn vẹn và3 bảng Job/Skill/JobSkill; xuất eligibility/visibility/catalog/report ports cho BE2/BE3. Phụ thuộc pha 1–4 và Outbox/Audit thực. FR02/03/04, BR01–04/18/19; TC01–04/25, EC34/37/38.

## Requirements

- Draft thiếu trường theo A11 nhưng field nhập phải đúng; publish đủ dữ liệu và future deadline tại DB sau khóa.
- PUBLISHED edit allowlist, version; CLOSED không reopen, không xóa application/lịch; headcount không hard cap hired.
- Public/private scope khác nhau; search total stable và không lộ DRAFT/suspended qua detail/saved-job.

## Architecture

Job mutation services qua UoW/CompanyAccessPort/JobRepository; public query dùng JobQueryRepository trả DTO riêng. Skill catalog BE1 chỉ seed/read active theo scope, không tự phát triển CRUD skill admin chưa có UC. JobApplicationPort tham gia canonical locks của BE2 submit; query eligibility lại dưới khóa, không dùng search cache làm bằng chứng nhận hồ sơ.

## Related Code Files

- Điền JobModule; controllers jobs/public-jobs/skills, services create/update/publish/close/search, rules publication/salary/job-update, policy/repositories/ports/DTO/mappers như blueprint.
- Thêm models job_post/skill/job_skill, SQL migration indexes/CHECK, seed published/draft/closed/expired/skill inactive.
- Tạo `tests/{api,integration,concurrency,contract}/be1/{jobs,public-job-query,job-ports}*.spec.ts`, unit rules, tests phối hợp submit-vs-close/publish-vs-suspend; OpenAPI/events/fixtures FE1/FE2.

## Implementation Steps

1. Viết boundary table: title9/10/150/151, description99/100/10000/10001, headcount0/1/100/101, salary missing partial/negative/0/min>max/invalid currency, locationREMOTE missing, offset/time/deadline exact và stale versions.
2. Schema title nullable decision A11, types/modes enum,CHECK từng field nullable, PUBLISHED completeness+publishedAt,CLOSED closedAt cho cả nháp chưa publish, salary all-null hoặc đủ3 CHECK không đểUNKNOWN lọt. FK company/creator và job_skill compositePK, normalized skill name UNIQUE/active; kiểm SQL insert sai.
3. Create DRAFT allowlist company context/creator từ actor; operational company đủ quyền/owner available, không body status/createdBy injection. Update DRAFT validate input từng field, không đòi đủ publish; PATCH omitted giữ cũ/null chỉ nullable theo contract.
4. Publish transaction locks actor/company/job theo shared order; recheck state/version/membership/company/OWNER, đọc DB clock sau khóa và deadline>clock, validate completeness, updatePUBLISHED/publishedAt/version + audit/outbox atomic.
5. Published update chỉ description/location/skills/salary/deadline tương lai; reject title/headcount/company/status edits, không tự reset publication time. Hai tab cùng version một thành công/409, skills changes cùng Tx.
6. Close DRAFT hoặc PUBLISHED với version/reason và closedAt; CLOSED không mở lại. Không remove application, tự withdraw hoặc cancel interviews; expired là read/submit predicate không cần worker chuyển status mới dừng nhận.
7. Search normalized query/filter/sort/page limit trước query; skill ANY/ALL theo A12, queries parameterized, EXISTS hoặc distinct tránh duplicate job. Public list chỉ eligible published/approved/owner available/deadline; total cùng scope/filter/order id tie-break.
8. Detail public DRAFT hoặc CLOSED chưa từng publish404; đã từng publish closed/expired trả label ngừng nhận nếu company còn hiển thị. Suspended404. Private list/detail `/companies/:id/jobs` đúng recruiter scope xác minh job.company_id, DTO draft khác public, count không leak company khác.
9. Implement JobApplicationPort.lockForSubmission(candidate,job,tx): discovery đầy đủ user/company/job trước khóa nếu caller cần, reread same company/membership/owner/state/deadline at DB after locks; response minimal. BE2 vẫn CV READY/UNIQUE trong cùng Tx. JobVisibilityPort placeholder không lộ draft/suspended; SkillCatalogPort.active validation; JobReportingFactsPort theo publishedAt/snapshot A15.
10. PostgreSQL barrier tests publish vs suspend, submit vs close/suspend, lock wait qua deadline; error case rollback job/version/skills/audit/outbox. Ngoài scope404 và no event when invalid.
11. UI fixtures FE1 UI01/02 và FE2 UI17/18 + skill options UI07/21 nơi dùng, OpenAPI filter semantics/errors/money serialization. Query plan test trên fixture đủ lớn trước tối ưu index; không thêm search engine/cache khi chưa đo.

## Success Criteria

- [ ] TC01–04/25 EC34/37/38 đạt; migrations DB rỗng/upgrade + invalid SQL có evidence.
- [ ] Search/detail/private scope và list total đúng; closed draft không public; saved-job visibility port không leak.
- [ ] Eligibility/skills/report ports có tests thực và deadline dưới lock đúng; close/suspend không nhận hồ sơ mới trái thứ tự khóa.
- [ ] No unintended hard cap headcount/reopen/edit fields; event/history integrity và FE contracts đủ.

## Risk Assessment

Public query kiểm OWNER available có thể expensive: index/query plan sau fixture, không bỏ predicate để tối ưu. Deadline DB/timezone khác client: ISO offset bắt buộc, timestamptz, UI tự format giờ Việt Nam. Decimal monetary values serialization phải khóa schema, không rounding bằng float tùy ý.
