# Recruitment Management System

Khung dự án quản lý tuyển dụng theo báo cáo SE113. Đã có nền transaction/port và contract BE2; chưa có bootstrap API, giao diện, model/migration nghiệp vụ hoặc luồng người dùng chạy hoàn chỉnh.

Đọc [hướng dẫn setup](Docs/development-setup.md), [đặc tả](Docs/project-specification.md), [bàn giao BE2 bước 2](Docs/be2-step2-handoff.md) và [tiến độ chung](progress/README.md). Mọi thành viên và AI cập nhật tiến độ theo quy tắc/mẫu ở đầu sổ chung. Agent tuân thủ [AGENTS.md](AGENTS.md).

## Chuẩn bị local

Yêu cầu Node.js theo `.nvmrc`, npm 11 và Docker Compose. Chạy PowerShell tại gốc; chỉ copy khi file môi trường đích chưa có:

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
npm ci
docker compose up -d --wait
```

Các bước này cài công cụ và bật PostgreSQL, MinIO, Mailpit. Unit/contract test của nền BE2 có thể chạy sau `npm ci`; lệnh dev/migration và nghiệm thu nghiệp vụ cần phần triển khai tương ứng.

## Cấu trúc

```text
apps/api/src/       NestJS API; module theo nghiệp vụ
apps/worker/src/    Worker dùng chung nghiệp vụ và platform
apps/web/src/       React/Vite: app, features, components, lib
libs/platform/     Database, clock, storage, mail, video, scanner, errors
prisma/            Schema cấu hình; migrations, fixtures, seed trống
tests/             Integration, API, concurrency, contract, E2E, performance
contracts/         OpenAPI một phần, JSON Schema, event schema và fixture BE2
libs/contracts/    TypeScript port backend và DTO công khai cho frontend
infra/             Chỗ bổ sung cấu hình scanner, Jitsi, backup
scripts/           Chỗ bổ sung công cụ database và evidence
Docs/              Báo cáo, đặc tả, setup và lịch sử tiến độ cũ
progress/          Sổ tiến độ chung cho cả nhóm và AI hỗ trợ
```
