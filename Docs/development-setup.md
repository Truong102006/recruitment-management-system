# Setup và cấu trúc dự án

## Phạm vi

Setup ngày 16/10/2026 theo đặc tả, đặc biệt mục 1.3, 4.3 và 7.3. Dùng npm workspaces gồm API NestJS, worker NestJS và web React. Vite là lựa chọn công cụ build React trong lần setup này; báo cáo chưa chốt công cụ build frontend. Prisma 6.19.0 dùng cấu hình datasource truyền thống; chưa có model nghiệp vụ.

Chỉ tạo file, folder và cấu hình. Mọi file nguồn ứng dụng, controller/service/repository/policy/rules mẫu, bootstrap và seed đều trống. Không có endpoint demo, UI demo, model 25 bảng, migration giả hoặc test luôn pass. Tên module không đồng nghĩa đã implement.

## Công cụ

- Node.js theo `.nvmrc`, npm theo `packageManager` trong `package.json`.
- NestJS 11, TypeScript strict; API/worker dùng CommonJS.
- React 19, Vite 7; web dùng ES modules.
- Prisma CLI/client cùng phiên bản 6.19.0.
- Jest/ts-jest/Supertest cho BE, Vitest/Testing Library cho FE, Playwright cho E2E.
- ESLint, Prettier, EditorConfig và cấu hình Git/VS Code.
- `package-lock.json` khóa dependency; chỉ resolve bằng `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, chưa cài node_modules.

Nguồn chính thức đã tham khảo: [NestJS](https://docs.nestjs.com/first-steps), [Vite](https://vite.dev/guide/), [Prisma](https://www.prisma.io/docs/orm/reference/system-requirements). Đây là quyết định setup, không thay đổi nghiệp vụ báo cáo.

## Chuẩn bị local

Chạy PowerShell tại gốc, chỉ copy file môi trường nếu chưa có:

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
npm ci
docker compose config --quiet
docker compose up -d --wait
```

`.env`/`.env.local` bị Git bỏ qua. Thay credentials local theo nhu cầu; sửa đồng bộ `DATABASE_URL` và biến S3 khi đổi user/password/port. Biến `VITE_*` là công khai, không chứa bí mật.

| Dịch vụ | Địa chỉ local | Ghi chú |
|---|---|---|
| PostgreSQL | 127.0.0.1:5432 | DB recruitment, cấu hình trong `.env` |
| MinIO S3 | http://127.0.0.1:9000 | Chưa tự tạo bucket |
| MinIO console | http://127.0.0.1:9001 | Tạo bucket private `rms-cv` bằng credentials local |
| Mailpit SMTP | 127.0.0.1:1025 | Email test |
| Mailpit UI | http://127.0.0.1:8025 | Xem thư khi có producer thực |
| API dự kiến | http://127.0.0.1:3000 | Chưa có bootstrap |
| Web dự kiến | http://127.0.0.1:5173 | Chưa có React mount |

Compose chỉ có PostgreSQL, MinIO, Mailpit, bind loopback và lưu named volumes. Không bật container trong lần tạo khung. Image dùng tag phiên bản; chưa xác minh runtime/digest. Cần khóa digest đã kiểm chứng trước CI/nghiệm thu theo báo cáo.

Scanner/Jitsi mới có biến môi trường mẫu và folder `infra/`, chưa có service, chứng chỉ, adapter, provider hoặc kiểm chứng quyền phòng. Redis/broker không bắt buộc nên chưa đưa vào. Worker chưa có scheduler/consumer. `npm run infra:down` tắt dịch vụ và giữ volume.

## Quy ước thư mục

| Đường dẫn | Mục đích |
|---|---|
| `apps/api/src/modules/` | identity, candidate, company, job, cv, application, interview, evaluation, notification, reporting, admin, audit |
| Trong mỗi module | File module trống; controllers, services, repositories, dto, policies, rules, mappers, ports, tests |
| `modules/application/` | File trống theo ví dụ mục 4.3: submit/change/review service, controller, repository, policy, transition rules |
| `apps/api/src/common/` | Guard/pipe/filter/interceptor/decorator dùng chung |
| `apps/worker/src/` | Bootstrap/module trống; jobs, consumers, reconciliation, config |
| `libs/platform/` | Hạ tầng chung; không đặt nghiệp vụ application/interview ở đây |
| `apps/web/src/app/` | App/router/providers trống và layouts |
| `apps/web/src/features/` | Auth, profile, CV, jobs, applications, interviews, companies, evaluations, results, saved-jobs, notifications, statistics, admin |
| `apps/web/src/components/` | UI/layout dùng chung |
| `apps/web/src/lib/` | HTTP/query/auth; chưa có logic session/CSRF/cache |
| `prisma/schema.prisma` | Chỉ generator/datasource; chưa có bảng |
| `prisma/migrations/` | Chờ migration thực |
| `contracts/openapi/`, `contracts/events/` | Chờ contract thực |
| `tests/` | Integration/API/concurrency/contract/E2E/fixtures/helpers/performance |
| `.github/workflows/` | Chờ pipeline sau khi có source và test |
| `scripts/evidence/`, `scripts/database/` | Chờ công cụ evidence/migration thực |

`.gitkeep` giữ folder trống trong Git; có thể bỏ khi thêm file thực. Chỉ triển khai policy/rules/port cần thiết, không cần tạo class để lấp đầy folder.

## Lệnh đã chuẩn bị

| Lệnh tại gốc | Mục đích và điều kiện |
|---|---|
| `npm ci` | Cài đúng lockfile |
| `npm run typecheck` | Kiểm TypeScript BE và FE; file trống không chứng minh nghiệp vụ đúng |
| `npm run lint` | ESLint; cấm focused/skipped Jest test |
| `npm run format:check` / `format` | Kiểm/format; bỏ qua báo cáo và đặc tả dài |
| `npm run dev:api` / `dev:worker` | Watch sau khi có `.env` và bootstrap; file trống hiện không mở server/worker |
| `npm run dev:web` | Bật Vite sau cài dependency; trang trống do chưa mount React |
| `npm run build` | Compile workspace; chưa phải ứng dụng chạy được |
| `npm run db:validate` / `db:generate` | Kiểm schema/sinh client sau khi thêm model và `.env` |
| `npm run db:migrate:dev` / `db:migrate:deploy` | Tạo/áp dụng migration thực; hiện chưa có |
| `npm run db:studio` | Xem dữ liệu sau khi có schema/DB |
| `npm run test:unit:ci` | Jest/JUnit; coverage lines 80%, branches 70% |
| `npm run test:integration:ci` | Integration/API/concurrency/contract tuần tự |
| `npm run test:web:ci` | Vitest/JUnit; coverage lines 80%, branches 70% |
| `npm run test:e2e` | Playwright 360/768/1366 px; cần cài browser và bật ứng dụng thực |
| `npm run infra:config` / `infra:up` / `infra:down` | Kiểm/bật/tắt hạ tầng local sau khi tạo `.env` |

Test runner không bật `passWithNoTests`; chưa có test nên lệnh test sẽ fail do không có ca kiểm thử. Không thêm test rỗng để làm xanh. Fixture, kiểm tra DB/Docker bắt buộc, evidence manifest, chống skip và gate tổng cần triển khai cùng suite thực. Chưa thêm `verify:evidence`/`verify:migrations` vì chưa có implementation.

## Bắt đầu code

1. Viết bootstrap API/worker, React mount, config/validation/error envelope/session facade.
2. Viết model/migration 25 bảng, SQL constraints thực và integration fixtures/test.
3. Thống nhất DTO/OpenAPI/event contract; triển khai từng UC theo báo cáo.
4. Tích hợp storage/scanner/mail/video, suite thực và evidence gate trước khi bật CI bắt buộc.
5. Cập nhật [agent-progress.md](agent-progress.md) theo [AGENTS.md](../AGENTS.md).

## Tham chiếu

- [Đặc tả](project-specification.md)
- [Báo cáo gốc](Bao_Cao_SE113_Final.md)
- [Tiến độ](agent-progress.md)
