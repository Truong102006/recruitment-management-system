# Recruitment Management System

Khung dự án quản lý tuyển dụng theo báo cáo SE113. Chỉ có cấu trúc, cấu hình và file nguồn trống; chưa có bootstrap, giao diện, API hoặc logic nghiệp vụ.

Đọc [hướng dẫn setup](Docs/development-setup.md), [đặc tả](Docs/project-specification.md) và [tiến độ](Docs/agent-progress.md). Agent tuân thủ [AGENTS.md](AGENTS.md).

## Chuẩn bị local

Yêu cầu Node.js theo `.nvmrc`, npm 11 và Docker Compose. Chạy PowerShell tại gốc; chỉ copy khi file môi trường đích chưa có:

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
npm ci
docker compose up -d --wait
```

Các bước này cài công cụ và bật PostgreSQL, MinIO, Mailpit. Lệnh dev/build/migration/test cần phần triển khai tương ứng; hiện chưa có ứng dụng chạy được.

## Cấu trúc

```text
apps/api/src/       NestJS API; module theo nghiệp vụ
apps/worker/src/    Worker dùng chung nghiệp vụ và platform
apps/web/src/       React/Vite: app, features, components, lib
libs/platform/     Database, clock, storage, mail, video, scanner, errors
prisma/            Schema cấu hình; migrations, fixtures, seed trống
tests/             Integration, API, concurrency, contract, E2E, performance
contracts/         Chỗ lưu OpenAPI và event schema
infra/             Chỗ bổ sung cấu hình scanner, Jitsi, backup
scripts/           Chỗ bổ sung công cụ database và evidence
Docs/              Báo cáo, đặc tả, setup và tiến độ
```
