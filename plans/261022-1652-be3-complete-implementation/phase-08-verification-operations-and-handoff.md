---
phase: 8
title: "Verification operations and handoff"
status: pending
effort: ""
---

# Phase 8: Verification operations and handoff

## Overview

Nghiệm thu xuyên module và trách nhiệm hạ tầng BE3 sau khi mỗi pha đã có test riêng. Phụ thuộc pha1–7 và ứng dụng BE1/BE2/FE để E2E. QA-01/CI-01/OPS-01, NFR02/04–06/08–10, TC28–30/58–60 và test phối hợp.

## Requirements

- Test thực PostgreSQL/provider; CI không skip/0 test/only/continue-on-error cho suite bắt buộc.
- Report đúng commit/môi trường; coverage backend lines≥80%, branches≥70%; không loại policy/rules/transaction.
- Load, video, backup/restore và clean setup có evidence; BE3 điều phối, owner xác nhận dữ liệu của mình.

## Architecture

Gate liên kết JUnit/coverage/evidence manifest và trạng thái job. Unit/integration/API/contract được viết ở các pha trước; pha8 nối demo submit→interview→result→notification/report và kiểm NFR trên môi trường được ghi lại. Metrics chia platform/owner, traceId xuyên API–DB–event.

Điểm phối hợp bổ sung từ [kế hoạch BE1 pha8](../261022-1711-be1-complete-implementation/phase-08-ci-operations-verification-and-handoff.md): BE1 điều phối CI skeleton/quality gate, BE3 cùng BE2 bổ sung phần kiểm của mình và dùng **một bộ script evidence/migration + manifest chung**; không tạo bản sao cùng chức năng ở hai kế hoạch. Việc thêm script dưới đây là đầu ra phối hợp, không giao độc quyền BE3.

## Related Code Files

- Tạo `tests/performance/be3/`, E2E phối hợp dưới `tests/e2e/`; không tự sửa UI người khác chỉ để xanh test.
- Tạo `scripts/evidence/{verify-evidence,manifest}.ts` và `scripts/database/verify-migrations.ts` (tên đề xuất); nối scripts `verify:evidence`/`verify:migrations` vào package.json khi đã có implementation.
- Phối hợp `.github/workflows/` với BE1 điều phối CI; rules cấm focused/skipped test.
- Tạo khi triển khai `Docs/{be3-worker-runbook,be3-video-runbook,be3-operations,be3-handoff}.md`, scripts backup/restore theo dữ liệu owner.
- Reports runtime tại `reports/backend/`, `reports/be3/{provider,performance,restore}/`; bằng chứng lưu artifact nếu Gitignore, không commit CV thật/log secret.

## Implementation Steps

1. Chạy clean setup trên DB test rỗng rồi upgrade fixture; integration/API sử dụng global guard/pipe/filter production. Kiểm thiếu DB/Docker làm fail chứ không skip; schema test dùng runtime role thật.
2. Nối demo đầy đủ báo cáo8.8: approved company/job → READY CV V1 submit → thay V2 original giữ nguyên → review → ACCEPT conflict → replacement rollback → join → attendance/evaluation → mark-interviewed → result → notification → report. Phần CV do BE2 cung cấp.
3. Rà forbidden fields mọi output/candidate/email/history/log/admin event, CSRF/Origin, multi-role/multi-company và object scope. Kiểm TC55/56/57/59 cùng owner; ADMIN không mặc định xem CV/phiếu.
4. Worker fault injection: claim crash/task persistence crash/SMTP timeout/stale lease/token unknown schema, provider down; quan sát outbox lag/FAILED/lease/reservation/revoke. Ghi hướng dẫn admin retry reason/audit, không chạy bulk reconcile mù.
5. CI phối hợp BE1: npm ci/generate/typecheck/lint/build/unit+coverage/migration/integration/contract/FE/E2E/evidence gate. Thêm script evidence sau khi có report thật, không test minh họa luôn pass.
6. Negative controls TC60 trên nhánh thử: assertion fail, xóa suite integration, .only/.skip, hạ coverage, migration sai, DB down; từng lần gate phải đỏ đúng lý do. Artifact luôn lưu, không coi YAML là bằng chứng.
7. Load TC29/NFR02: BE3 điều phối 100VU, warm-up2m/steady15m, 10k jobs/100k CV metadata, mục tiêu4vCPU/8GiB/SSD, p95≤2s/lỗi ngoài4xx hợp lệ<1%. Ghi endpoint mix/pool/CPU/RAM/DB/outbox lag; không loại5xx. BE1/BE2 xử lý bottleneck phần mình.
8. Video TC28: dùng evidence pha5 hoặc chạy lại nếu đổi provider/config; ít nhất29/30 join≤10s và revoke≤60s/deny new join. Upload/scan30 lần theo NFR03 do BE2 dẫn dắt, BE3 hỗ trợ worker/metrics; mock không chứng minh NFR.
9. Restore TC30/NFR06: backup DB hằng ngày + object versioning; restore sang môi trường sạch riêng, BE2 đối soát đúng storage_version_id/checksum/CV download, BE3 kiểm lịch/phiếu/outbox/notification; RPO≤24h/RTO≤4h. Không restore đè DB đang dùng.
10. Runbook: startup/shutdown, lease/retry/FAILED, deadlock/exclusion, orphan reservation, revoke quá60s, secret rotation/config, backup/restore. Retention demo log30d và application/history/audit12 tháng là thiết kế; không bật purge phá FK khi chưa có chính sách duyệt.
11. FE1 UI24 và FE2 UI13–15/20–23/25/28 nhận OpenAPI/error fixtures và commit demo; kiểm FE21/23–25/33–38/41, phối hợp FE20/32/39/40.
12. BE1 review BE3; BE3 review BE2 phần port/migration/contract. Người khác chạy lại clean setup và demo; ghi thiếu sót thực. Cập nhật progress theo branch/PR/main thực tế, không tự commit/push/deploy.

## Success Criteria

- [ ] [Ma trận kiểm chứng](verification-matrix.md) đủ kết quả/bằng chứng, không Critical/High mở.
- [ ] Coverage/JUnit/CI negative controls đạt; tests bắt buộc không rỗng/skip.
- [ ] Load/provider/restore có môi trường và số đo thực; thiếu chỉ tiêu nào giữ IN_PROGRESS tương ứng.
- [ ] Clean setup/runbooks/OpenAPI/seeds/demo/review đủ; 6 UC chỉ DONE theo điều kiện nghiệm thu.

## Risk Assessment

Không suy global NFR từ test riêng BE3. Coverage source trống không có ý nghĩa. Provider/hạ tầng thiếu là blocker có điều kiện gỡ cụ thể; tài liệu đã xong không chuyển UC DONE. Benchmark và restore cần môi trường riêng, cấu hình/commit rõ và dữ liệu tổng hợp.
