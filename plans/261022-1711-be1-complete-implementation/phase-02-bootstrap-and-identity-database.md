---
phase: 2
title: 'Bootstrap and identity database'
status: in-progress
effort: 'completed'
---

# Phase 2: Bootstrap and identity database

## Overview

Tạo nền API thật và 4 bảng Identity để unblock các owner; không đánh UC04 hoàn thành chỉ vì server start. Phụ thuộc hợp đồng pha 1 và UoW BE2 cho mutation; BE-FOUNDATION/DB-01, NFR04/10.

## Requirements

- Nest bootstrap/config validation/strict DTO/error envelope/traceId/redaction, security headers và shutdown.
- user_account/user_role/auth_session/auth_token có migration SQL/constraint/index thật, runtime role khác migration role.
- Bộ test API dùng cùng cấu hình global guards/pipes/filter production, không instance giả khác runtime.

## Architecture

Tách hàm cấu hình API dùng lại ở main và test harness. Guard Session/Origin/CSRF có dependency SessionService, triển khai cùng pha 3 nhưng pipeline metadata/contract được khóa ở đây; không phát hành protected route với guard rỗng. Prisma database adapter/UoW lấy implementation BE2, không tự tạo tx độc lập.

## Related Code Files

- Điền `apps/api/src/{main,app.module}.ts`, IdentityModule; tạo `apps/api/src/config/environment.config.ts`, `common/bootstrap/configure-api.ts` (đề xuất) và guards/filters/interceptors/decorators ở blueprint.
- Sửa `prisma/schema.prisma` models BE1 Identity; tạo `prisma/migrations/<timestamp>_be1_identity/migration.sql`, `prisma/seeds/be1.seed.ts`, phối hợp `prisma/seed.ts`.
- Sửa `.env.example`, `apps/api/package.json`/lockfile chỉ khi thêm dependency đã kiểm; `tsconfig`/workspace build nếu imports libs chưa build đúng.
- Tạo `tests/helpers/create-test-api.ts`, `tests/integration/be1/{identity-schema,migration-upgrade}.spec.ts`, `tests/api/be1/bootstrap-contract.spec.ts`, redaction/normalization unit tests.

## Implementation Steps

1. Viết test DTO/envelope và invalid SQL trước; xác minh dependency/cấu hình build hiện có, không lấy typecheck source trống làm baseline nghiệp vụ.
2. Config bắt DATABASE_URL/Origin/cookie/CSRF/auth-encryption keys và timeouts từ env đã validate; fail startup khi key production là placeholder. Không in giá trị key hoặc DATABASE_URL vào logs.
3. API prefix `/api`, ValidationPipe whitelist+forbidNonWhitelisted/explicit transforms, UUID/enum/int/page bounds; NFC/trim/code points cho text thông thường, không áp dụng password/token. Filter map domain/DB known conflict thành code/status rõ, lỗi khác traceId+generic message.
4. Response interceptor tránh double-wrap và không wrap cookie/no-content sai; traceId server format validated, log redaction trước sink. Helmet/CORS exact allowlist/trust proxy theo A05; không coi CORS là access authorization.
5. Schema user_account email normalized UNIQUE/CHECK, full_name1–120, ACTIVE/LOCKED+locked_reason, version≥0; user_role PK(user,role) allowlist/FK restrict; không public ADMIN seeding tự động.
6. Schema session random token hash UNIQUE/CSRF hash, timestamps/expiry/revoke/index(user,revoked,expires); auth_token purpose enum/hash UNIQUE/TTL/timestamps/consumed/invalidated và indexes lookup. CHECK xử lý NULL tường minh; không kiểm future time bằng CHECK phụ thuộc clock.
7. Setup runtime/migration DB roles (script/guide phối hợp BE2), privilege tối thiểu, không cho runtime migrate hoặc sửa audit/history. Grant chỉ bảng owner cần dùng trong UoW runtime chung, không hứa isolation vật lý từng module khi cùng DB account.
8. Seed tổng hợp actor cho tests:2 công ty khi pha 4 model sẵn, ACTIVE/unverified/LOCKED/multi-role; phase này tạo identities trước. Mật khẩu test từ env/fixture riêng, không secret thật; seed ADMIN production qua runbook được kiểm soát.
9. Deploy migration trên DB test rỗng và upgrade fixture, query pg_constraint/pg_indexes, thử email case/whitespace trùng và invalid role/timestamps. Xác minh Prisma client/build imports libs CommonJS thực, sửa cấu hình build có test nếu cần.
10. Bàn giao user IDs/keys cho BE2 candidate migration và BE3 baseline Outbox/Audit; ghi evidence. CI skeleton có thể chuẩn bị từ đây nhưng gate chỉ xanh khi suite thực có và dependency đủ.

## Success Criteria

- [ ] API bootstrap chạy và tests error/security envelope/normalization thật; không protected endpoint guard noop.
- [ ] 4 bảng Identity migrate rỗng/upgrade được; invalid SQL và uniqueness race bị chặn.
- [ ] Roles/env/log/trace config và libs build được xác minh; baseline handoff BE2/BE3 rõ.
- [ ] Coverage/test results ghi thực; bootstrap thành công không đánh UC04 DONE.

## Risk Assessment

Secure cookie không hoạt động như dự kiến trên topology HTTP khác origin: giải quyết A05 trước auth browser test. Raw stack/Prisma error có thể leak secrets: fixture chủ động chứa chuỗi sentinel trong log tests. Chưa có Docker/DB phải báo fail/blocker, không skip.

## Đồng bộ kiểm chứng 23/10/2026 — Codex hỗ trợ BE1

Bootstrap, additive email_verified_at và migration PostgreSQL có test; còn DB runtime permissions và historical release upgrade. Pha giữ IN_PROGRESS theo tiêu chí đầy đủ; không coi fake ports là runtime acceptance. Báo cáo lịch sử giữ trong sổ chung. Bằng chứng cuối xem [tiến độ](../../progress/README.md), [bàn giao](../../Docs/be1-handoff.md) và artifact local `reports/be1/final-verification.md`. Chưa commit/chưa gộp main.
