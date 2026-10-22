---
phase: 8
title: "CI operations verification and handoff"
status: pending
effort: ""
---

# Phase 8: CI operations verification and handoff

## Overview

Hoàn thiện hạ tầng CI BE1 điều phối và bằng chứng nghiệm thu/clean setup/bàn giao. Phụ thuộc pha 1–7, suites mỗi owner và môi trường load/restore/provider. CI-01/QA-01; NFR02/04–06/08–10; TC29/30/60 phối hợp BE3 điều phối OPS.

## Requirements

- npm ci/generate/typecheck/lint/build/unit+coverage/migration/integration/API/concurrency/contract/FE/E2E/evidence gate thực chạy.
- Backend lines≥80%, branches≥70%, required suites tests>0/skipped0; no .only/.skip/continue-on-error bắt buộc.
- Clean setup người khác, secrets/HTTPS/ADMIN recovery runbook, OpenAPI/seed/ports/test evidence và review BE2→BE1/BE1→BE3.

## Architecture

BE1 làm CI skeleton/aggregator/evidence manifest dùng chung, từng BE bổ sung required suite/jobs; BE3 kế hoạch pha 8 cũng nhắc scripts evidence/migration nên phải cùng owner design, không tạo2 CLI/tool trùng. Gate always kiểm mọi job success và parse XML/coverage/manifests, không coi canceled/skipped là success.

## Related Code Files

- Tạo `.github/workflows/{ci,quality-gate}.yml` (tên đề xuất), `scripts/evidence/verify-evidence.ts`, `scripts/database/verify-migrations.ts`, manifest suites chung; phối hợp BE2/BE3 ownership.
- Bổ sung package.json scripts `verify:evidence`/`verify:migrations` chỉ sau có implementation; cập nhật lockfile nếu cần dependency đã chọn đúng.
- Tạo `Docs/{be1-setup,be1-security-runbook,be1-handoff}.md`, cấu hình proxy/HTTPS ở `infra/` nếu A05 chốt, `.env.example` và CI secret references không giá trị thật.
- Tạo load fixture/query scripts cho job API dưới `tests/performance/be1/`; artifacts dưới `reports/backend/` và `reports/be1/`, CI upload đã redaction.

## Implementation Steps

1. Từ pha 2 có thể chuẩn bị workflow, ở pha 8 hoàn tất manifest/job gate của mọi owner; pin actions/images bằng version/digest đã kiểm chứng, không đoán SHA. CI sử dụng DB test+storage mail fixtures cần thiết, startup fail báo lỗi thay skip.
2. Job migrate deploy DB rỗng và upgrade fixture có dữ liệu, query constraints/index/role permissions; Prisma generate/build/typecheck strict thực, không exclude source policy/service/rules.
3. Unit JUnit+coverage, integration/API/concurrency/contract JUnit, FE/Vitest, E2E reports; XML parse tests>0/failures0/errors0/skipped0 và đủ suite manifest, thresholds BE/FE lines80/branches70. Không passWithNoTests.
4. Gate tổng always require mọi mandatory job success, artifacts đầy đủ đúng commit; fail khi canceled/skipped/missing report. Nhánh thử negative controls TC60: assertion sai, delete integration suite, focused/skipped test, hạ coverage, migration sai, DB down → gate đỏ đúng lý do. Lưu từng run thực.
5. Health/startup/DBpool/query latency/deadlock/constraint/event-loop/rate-limit metrics, traceId và redaction cùng platform; BE3 outbox/revoke metrics riêng được nối, không expose debug secrets ở health API.
6. Phối hợp BE3 load TC29:100VU warm-up2m/steady15m,10k jobs/100kCVmetadata, máy mục tiêu4vCPU/8GiB/SSD, p95≤2s/lỗi ngoài4xx hợp lệ<1%; BE1 chịu search/job/access bottleneck và query plan/index. Không loại5xx hay tuyên bố NFR đạt từ microbenchmark.
7. Phối hợp BE3 restore TC30/RPO≤24h/RTO≤4h: backupDB hằng ngày/object versioning; restore sạch riêng, BE1 đối soát identity/company/members/jobs/skill invariants và auth session validity policy sau restore; BE2 kiểm CV/checksum. Không restore đè môi trường đang dùng.
8. Phối hợp provider BE3/NFR04/09:29/30 join≤10s và revoke existing mục tiêu≤60s, new join deny; user lock/company suspend và explicit security-cancel là trigger BE1, không coi mock test là provider pass. Reset mật khẩu chỉ thu hồi session theo UC04, chưa tự thêm revoke video ngoài đặc tả.
9. Runbook: env/key separation/rotation+session invalidation policy, same-origin HTTPS/cookie/CSRF, test admin creation/emergency recovery kiểm soát, migration/runtime roles, rate limit topology, locked lastOWNER recovery, lỗi409/429/FAILED, backup/restore effects. Không tự bật destructive retention purge.
10. Bàn giao OpenAPI/error/event schemas/ports/migration order/seed fixture/test commands/reports; không hardcode credential test làm mặc định production. Demo8.8 theo lát cắt từ company approve/publish tới apply/interview/result cùng BE2/3/FE.
11. Người khác clean clone/npmci/migrate/seed/run/test được theo docs; ghi môi trường thực và blocker. BE2 review DB/API BE1; BE1 review BE3 auth/access/contract; sửa finding có bằng chứng.
12. Update progress branch/PR/commit/main thật; DOC plan DONE không làm UC DONE. Không tự commit/push/deploy vì lượt này chỉ lập kế hoạch.

## Success Criteria

- [ ] CI thực chạy và negative controls fail đúng; coverage/evidence/migration gates đủ, required suite không rỗng/skip.
- [ ] Load/restore/provider phối hợp có evidence hoặc ghi thiếu rõ; không tuyên bố toàn hệ thống đạt từ test riêng.
- [ ] Clean setup/HTTPS/security runbooks/OpenAPI/seeds/ports/review/handoff đầy đủ, không Critical/High mở.
- [ ] 5 UC đáp ứng DoD và evidence thực; sổ tiến độ phân biệt local/nhánh/main.

## Risk Assessment

Workflow YAML chưa chạy không chứng minh CI. Gate/infrastructure overlap BE3 phải phối hợp một script manifest duy nhất; giữ reports của các owner khi conflict. Quyền cài branch protection/GitHub secrets là bước cấu hình xuất bản cần người có quyền thực hiện theo authorization, không tự làm từ yêu cầu plan.
