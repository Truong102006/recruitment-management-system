# Kiến trúc và code blueprint BE1

## Nguồn và nguyên tắc

Theo `Docs/project-specification.md` mục2–5/7.1, báo cáo8.3, contract BE2 và ghi chú BE1/BE3. Đây là **thiết kế đề xuất để thực hiện**, chưa sửa nghiệp vụ/schema/API hiện hành. Các A01–A15 được chốt với owner và cập nhật đặc tả/contract/test trước khi phần phụ thuộc được code. Không tự sửa báo cáo gốc.

Giữ modular monolith NestJS 11/CommonJS, Prisma 6.19/PostgreSQL và worker riêng theo setup. Controller chỉ xử lý HTTP/DTO; service/workflow quản lý use case + policy/rules; repository nhận cùng Tx. Rules là hàm thuần khi không cần DI; không tạo generic framework/class lấp folder. `libs/platform` chỉ chứa hạ tầng; company/job/auth rules ở module sở hữu.

```text
FE1/FE2 — cùng origin HTTPS → API NestJS bootstrap BE1
  request/trace/Origin → SessionGuard/CSRF → ValidationPipe → Controller
                                                            ↓
                    Identity / Company / Job services + policy/rules
                                      hoặc AdminWorkflow
                                                            ↓
                  UnitOfWork/opaque Tx do BE2 điều phối
                         ↙                 ↓                 ↘
                  BE1 repositories   BE2 profile/conflict  BE3 lifecycle/audit/outbox
                         ↘                 ↓                 ↙
                                  một PostgreSQL Tx
                                          ↓ commit
                         BE3 worker → MailPort / VideoPort
```

Guard chạy trước Pipe: không cast body chưa validate thành trusted DTO trong guard. Guard kiểm identity/Origin/CSRF; service vẫn tái kiểm account/membership/company/version dưới khóa. Auth mail/video/S3 không gọi trong DB Tx. Composition root nối token interface, không import vòng Identity↔Candidate hoặc Admin↔Interview bằng `forwardRef` để né thiết kế.

## Ownership và inventory code dự kiến

Paths tương đối root repo; file giữ chỗ cần điền và file mới cần tạo, không khẳng định đã có implementation.

| Nhóm                | File/module chính                                                                                                                                                                                                                             | Trách nhiệm                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Bootstrap           | `apps/api/src/{main,app.module}.ts`, `config/environment.config.ts`                                                                                                                                                                           | API prefix `/api`, ConfigModule, DI wiring, shutdown, HTTP/HTTPS deployment config                     |
| Common security     | `apps/api/src/common/guards/{session,origin,csrf}.guard.ts`, `decorators/{actor,public-route}.decorator.ts`, `filters/api-exception.filter.ts`, `interceptors/{response,trace}.interceptor.ts`                                                | Security pipeline/envelope/log redaction; không chứa nghiệp vụ company/job                             |
| Identity            | `apps/api/src/modules/identity/identity.module.ts`; `controllers/auth.controller.ts`, `services/{register,session,auth-token,reset-password}.service.ts`                                                                                      | UC04, xác minh/reset, login/logout, port auth                                                          |
| Identity supporting | `repositories/prisma-{user,session,auth-token}.repository.ts`, `rules/{password,token,session}.rules.ts`, `policies/identity.policy.ts`, DTO/mappers; `ports/{identity-candidate,identity-admin,identity-profile,auth-mail-material}.port.ts` | Full_name mapping, profile update, active actor, security lock/token validity                          |
| Identity platform   | `libs/platform/crypto/{password-hasher,token-crypto}.ts`, `libs/platform/rate-limit/rate-limit.port.ts`                                                                                                                                       | BCrypt/hash/randomness/encrypted auth material, timeout/rate budget; domain purpose TTL thuộc Identity |
| Company             | `apps/api/src/modules/company/company.module.ts`; `controllers/{companies,memberships}.controller.ts`; `services/{create-company,membership,review-company,recover-owner}.service.ts`                                                         | UC11 và data commands cho UC10                                                                         |
| Company supporting  | `repositories/prisma-{company,membership}.repository.ts`, `policies/company.policy.ts`, `rules/{company,owner,membership}.rules.ts`, ports access/admin/participant                                                                           | Member context vs operational context; last OWNER invariant                                            |
| Job                 | `apps/api/src/modules/job/job.module.ts`; `controllers/{jobs,public-jobs,skills}.controller.ts`; `services/{create-job,update-job,publish-job,close-job,search-jobs}.service.ts`                                                              | UC01/05, public/private read và skill catalog                                                          |
| Job supporting      | `repositories/{prisma-job,job-query}.repository.ts`, `policies/job.policy.ts`, `rules/{publication,salary,job-update}.rules.ts`; ports application/visibility/admin/reporting/skills                                                          | Current eligibility và báo cáo số tin cho BE3                                                          |
| Admin               | `apps/api/src/modules/admin/admin.module.ts`; `controllers/{admin-companies,admin-users,admin-jobs,admin-interviews}.controller.ts`; `services/{moderation,security-revocation}.workflow.ts`, `policies/admin.policy.ts`                      | UC10 điều phối owner ports; không ghi bảng lịch/application                                            |
| Database            | `prisma/schema.prisma`, `prisma/migrations/<timestamp>_be1_<slice>/migration.sql`, `prisma/seeds/be1.seed.ts`, phối hợp `prisma/seed.ts`                                                                                                      | 9 bảng BE1 + runtime/migration roles, seed tổng hợp                                                    |
| Contracts/tests     | `contracts/openapi/be1.yaml`, `contracts/events/*.v1.schema.json`, colocated `*.spec.ts`, `tests/{integration,api,concurrency,contract}/be1/`                                                                                                 | Input/output/event semantics; PostgreSQL real tests                                                    |
| CI/ops              | `.github/workflows/`, `scripts/{evidence,database}/`, `.env.example`, `Docs/be1-{setup,security-runbook,handoff}.md`                                                                                                                          | CI skeleton/evidence/clean setup; tạo khi thực hiện phase tương ứng                                    |

BE1 ghi 9 bảng: user_account/user_role/auth_session/auth_token/company/company_membership/job_post/skill/job_skill. BE2 ghi candidate_profile/CV/application/history/idempotency; BE3 ghi interview/evaluation/notification/outbox/email/audit. `/admin/audit`, `/admin/events` do controller BE3 sở hữu, dùng admin guards BE1; không tạo route trùng. BE1 security-cancel controller gọi InterviewAdminPort BE3 cùng Tx.

## Ma trận milestone hai chiều với BE3/BE2

| Mốc cung cấp                                                 | Mốc dùng                                   | Điều kiện và cách tránh chờ vòng                                           |
| ------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------- |
| BE2 UoW/Tx/interface fixtures                                | BE1 pha 2–6, BE3 toàn bộ command           | Chốt interface sớm, test double cho unit; production một adapter duy nhất  |
| BE1 pha 2 Identity migration/bootstrap                       | BE3 pha 2 Outbox/Audit baseline            | Không chờ register hoàn chỉnh hoặc Company/Interview trước baseline        |
| BE3 pha 1–2 OutboxPort/AuditWriter baseline                  | BE1 pha 3–6 producers                      | Migration tham chiếu user đã có; BE3 chưa cần Application để tạo baseline  |
| BE2 CandidateProfile facade/migration                        | BE1 pha 3 register                         | Register CANDIDATE+profile một Tx, fake không chứng minh production        |
| BE1 pha 4/5 company/job schema/ports                         | BE2 Application migration/submit; BE3 lịch | Xuất từng contract thực có test, không chờ xong Admin                      |
| BE2 ApplicationConflictPort + BE3 schedule read/revoke ports | BE1 pha 4 membership/pha 6 admin           | Unit độc lập trước, cross-team acceptance sau; không direct SQL owner khác |
| BE1 pha 6 locks/suspend + BE3 pha 5 provider                 | Cả hai kế hoạch nghiệm thu revoke          | Cùng Tx ghi quyền/generation/revoke event, provider thực sau commit        |
| BE1 job facts + BE2 app facts/read snapshot                  | BE3 pha 7 statistics                       | Định nghĩa scope/asOf/read Tx, không expose PII                            |

Không tạo top-level blockedBy/blocks lẫn nhau cho toàn kế hoạch vì dependency thật theo các mốc trên. Hai `plan.md` có link và `relatedPlans` hai chiều; không giả CLI hiểu metadata này như scheduler.

## Quyết định contract phải chốt ở pha 1

| ID  | Vấn đề                                                                | Đề xuất và gate cần có                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | `full_name` dictionary khác `user_account.name` trong contract BE2    | Giữ DB full_name, wire/port name qua mapper; IdentityProfilePort command updateDisplayName nhận expected account version + cùng Tx; BE2 UC12 không ghi account trực tiếp. Chốt accountVersion riêng profileVersion, sửa mô tả contract                                                                                                                                                                          |
| A02 | Thêm member theo email ở UC11, bảng HTTP nói userId                   | Đề xuất POST nhận email chuẩn hóa + permission, resolve server chỉ tài khoản đã xác minh; PATCH nhận userId của composite membership. Không thêm public user search/email directory. Nếu giữ userId POST, phải giải quyết UI lookup có scope rõ trước code                                                                                                                                                      |
| A03 | Membership PK(company,user) nhưng recovery dùng memberId              | Đề xuất wire memberId là userId trong company, eligible-owner DTO trả cùng identifier; PATCH/transfer cần companyVersion+membershipVersion (tập target versions nếu nhiều member). Không bịa membership UUID; khóa contract FE2 và 409 behavior                                                                                                                                                                 |
| A04 | GET session cần trả CSRF nhưng DB chỉ có csrf_hash                    | Chọn cơ chế tái cấp CSRF không lưu plaintext; đề xuất derive bằng HMAC secret riêng + sessionId, persist hash và trả raw chỉ cho session hợp lệ. Chốt key rotation, multi-tab và no-store; session cookie vẫn random≥32byte, không dùng JWT thay session                                                                                                                                                        |
| A05 | Cookie Secure/__Host yêu cầu HTTPS cùng origin, setup web5173/API3000 | Chốt proxy cùng origin cho `/api` và HTTPS local/test/release; kiểm browser cookie thật. Không bỏ Secure hoặc đổi cookie silently để chạy demo; CORS allowlist credential rõ, trust-proxy hữu hạn                                                                                                                                                                                                               |
| A06 | Rate limits chưa có ngưỡng/backend; BCrypt chưa có dependency         | Chốt threshold/window theo login/register/forgot/resend/token endpoints, key IP+email normalized, bounded storage/429/Retry-After. Mặc định thiết kế1 API process, memory limiter chỉ khi deployment phù hợp; nhiều replicas cần shared atomic backend. Chọn BCrypt package/version/cost sau kiểm docs chính thức/runtime benchmark, không cắt >72byte                                                          |
| A07 | Candidate facade/Tx và bootstrap dependency                           | BE2 xuất profile create facade + UoW/opaque Tx sớm; BE1 migration Identity trước Candidate, production register dùng cả hai trong một Tx. Không duplicate PrismaClient/Tx adapter hoặc tự tạo bảng BE2                                                                                                                                                                                                          |
| A08 | Producer BE1 cần Outbox/Audit trước Interview                         | Khớp BE3 D03: baseline BE3 Outbox/Audit sau user_account; BE1 dùng ports không fallback noop. Auth integration gate cần baseline thật                                                                                                                                                                                                                                                                           |
| A09 | Auth mail yêu cầu encrypted material + xóa sau dùng/hết hạn           | Khớp BE3 D08: authenticated encryption với nonce riêng mỗi envelope, AAD bind tokenId/userId/purpose/eventId; key ngoài DB. BE1 AuthMailMaterialPort kiểm purpose/token còn dùng rồi giải mã chỉ trong memory, reject tamper/swap. Chốt schema/keyId/redaction và quyền cleanup ngoại lệ cho material kỹ thuật, không sửa lịch sử nghiệp vụ/audit                                                               |
| A10 | Thu hồi thường/security chưa có port đầy đủ                           | BE3 bổ sung schedule-conflict read và revokeForUser/revokeForCompany/securityCancel commands nhận Tx/generation/scope. Phân biệt membership ordinary chặn khi PROPOSED/CONFIRMED chưa xử lý, security khóa/suspend không bị chặn. Persist quyền bị vô hiệu + revoke intent cùng Tx, không chờ worker mới chặn join                                                                                              |
| A11 | Job DRAFT được thiếu trường nhưng title NOT NULL                      | Đề xuất title nullable ở DRAFT, CHECK PUBLISHED đủ title10–150; CLOSED nháp có thể titleNULL. Nếu chọn title bắt buộc ở nháp phải ghi thay đổi BR04. Chốt spec/migration/DTO/UI trước code, không tự chèn title giả                                                                                                                                                                                             |
| A12 | Skill search chưa nói ANY/ALL, normalized name/currency precision     | Đề xuất skillIds ALL qua EXISTS/group distinct, normalized name NFC/trim/case policy rõ, salary decimal2 không dùng JS float so tiền; DTO/sort/filter allowlist thống nhất FE1/FE2. Không thêm API skill admin ngoài phạm vi; seed và active read đủ                                                                                                                                                            |
| A13 | ADMIN cuối, OWNER khả dụng, lock set và cross-team deadlock           | Predicate owner: membership OWNER active + account ACTIVE verified (role requirement chốt riêng); ADMIN khả dụng ACTIVE verified có global ADMIN. Đề xuất lấy advisory Tx lock cố định cho mọi lệnh khóa user và lệnh thu hồi ADMIN trước mọi user lock, không dựa role từ discovery; user/company/job/app/interview theo chuẩn chung. Discovery/revalidation tránh khóa user muộn, kiểm actor lại sau chờ khóa |
| A14 | Read/query scope và điều kiện thao tác công ty chưa duyệt             | Tách member context để owner sửa PENDING/REJECTED/resubmit với operational context APPROVED+owner khả dụng; SUSPENDED chỉ đường admin/recovery được phép. Chốt field/permission matrix mọi trạng thái, không dùng một assertRecruiter APPROVED cho toàn UC11                                                                                                                                                    |
| A15 | BE3 job facts/read snapshot và idempotency coverage                   | BE1 xuất JobReportingFactsPort cùng readTx/asOf, counts theo publishedAt; dùng cùng strategy BE3 D07. Chốt lệnh tạo company/job có Idempotency-Key hay chỉ version/UNIQUE; không tự yêu cầu key cho mọi API. Contract fixtures phải phân biệt retry resource, duplicate business và version stale                                                                                                               |

Các lựa chọn ghi “đề xuất” chưa thay contract hiện hành. Nếu chưa chốt, unit có thể dùng typed fake, phần migration/endpoint liên quan chưa được phát hành như đã thống nhất. Gate A01–A15 có người phối hợp BE1/BE2/BE3/FE, lưu quyết định ngay trong tài liệu owner và test, không hỏi lại người dùng các lựa chọn đã có yêu cầu rõ.

## Auth/session code blueprint

```text
register(dto):
  normalize email=trim/lower, fullName=NFC/trim; giữ nguyên password
  validate min10 code points AND UTF8 bytes≤72
  compute BCrypt hash ngoài Tx, rate-limit trước chi phí CPU lớn
  UoW:
    INSERT account(unique normalized email), role allowlist
    CandidateProfileFacade.createForCandidate(..., tx)  // BE2
    INSERT token(purpose VERIFY_EMAIL, hash, expiry24h)
    OutboxPort.append(auth event + encrypted token envelope, tx)
    AuditWriter nếu action cần audit
  nếu UNIQUE email race: rollback rồi response202 chung, không sửa account cũ
  success201 theo contract nguồn, không cấp ADMIN/INTERVIEWER tùy request
```

Public register luôn CANDIDATE và tùy lựa chọn tuyển dụng cấp RECRUITER theo allowlist; không nhận roles array tùy ý. 201 mới/202 trùng vẫn phân biệt HTTP theo spec; không quảng cáo “không thể dò tồn tại” tuyệt đối. Forgot/resend luôn202 chung và template không tiết lộ tài khoản cho người gọi.

```text
login(dto):
  rate-limit; normalize email, lấy hash snapshot hoặc dummy BCrypt hash
  BCrypt compare ngoài Tx; wrong =>401 chung
  UoW: lock user, reread status/hash (và verified policy đã chốt)
       nếu LOCKED/hash đổi sau reset: từ chối; không tạo session từ hash cũ
       INSERT random session token hash + csrf_hash + TTL24h + lastSeen
  sau commit mới Set-Cookie __Host-recruitment_session

resetPassword(token,newPassword):
  validate password, compute hash ngoài Tx
  discover token owner (không log token), UoW lock user trước token mutation
  recheck active/purpose RESET_PASSWORD/unconsumed/uninvalidated/DB time<expiresAt
  conditional consume + update password_hash/version + revoke mọi session cùng Tx
  invalidate reset siblings theo contract; audit/outbox trong Tx nếu cần
  commit; token lần2 =>409 TOKEN_INVALID; không auto login
```

Verify dùng cùng consume atomically đúng purpose VERIFY_EMAIL; locked user không được bypass qua verify/reset theo policy chốt. Resend vô hiệu token cùng purpose trước khi tạo mới, worker check validity trước gửi. Khoá reset/verify/login/resend cùng user serialize; key auth vật liệu tách session/CSRF key, không đưa env secret vào frontend.

Cookie Secure/HttpOnly/Path=/SameSite=Lax/no Domain; absolute24h/idle2h, DB clock và conditional last_seen chỉ khi phiên còn hợp lệ. Mọi protected request kiểm session chưa revoke và account ACTIVE; global role không thay membership, actor từ session không từ body. Guest auth mutations kiểm Origin; mutation có session kiểm thêm CSRF. GET session no-store, CSRF hash compare constant-time; không rotate raw token mỗi GET làm hỏng tab khác nếu chọn A04 deterministic scheme. Logout204 revoke đúng session, clear cookie sau commit với cùng attributes.

## Transaction và authorization blueprint

Chỉ một UoW/Tx BE2, default READ COMMITTED; repo/port tham gia không dùng client global hoặc nested transaction. Thu thập đầy đủ IDs trước Tx, khóa user UUID tăng dần → company → job → application → interview → CV (trong nhóm tăng dần), đọc lại scope/versions sau khóa. Lệnh ảnh hưởng ADMIN lấy advisory lock trước mọi user lock. DB time `clock_timestamp()` sau khóa, không now() đầu Tx khi cần quyết định deadline.

```text
changeMembership(actor, company, target, command):
  discover target/actor/owner accounts + affected company scope
  UoW: canonical locks → recheck actor active OWNER and all versions
       if activating member: ApplicationConflictPort.assertNoOpenApplication(..., tx)
       if removing/demoting quyền ảnh hưởng interview:
          InterviewMembershipPort.assertNoUnresolvedProposedOrConfirmed(..., tx)
       OwnerRules.assertAvailableOwnerRemains(...)
       update membership/version, grant allowed INTERVIEWER role if needed
       AuditWriter + OutboxPort cùng Tx
  không ghi application/interview hoặc call provider
```

Chuyển OWNER phải atomic: promote target/demote old theo command/versions đã chốt, không để hai request bỏ cả2 OWNER. Thao tác membership thường bảo vệ owner cuối; admin lock vẫn hiệu lực dù target là owner cuối (trừ ADMIN cuối), company không vận hành đến recovery. Khi không lấy thêm owner users locks trong Tx sau company: discovery trước và revalidation set, retry có giới hạn nếu set thay đổi.

```text
securityLockUser/suspendCompany(actor, command):
  discover toàn bộ affected users/companies/jobs/apps/interviews qua owner ports
  UoW:
    advisory lock cho mọi lệnh khóa user/thu hồi ADMIN; canonical row locks
    recheck ADMIN actor/current target/version/last ADMIN predicate
    IdentityAdminPort.lock + revoke sessions / CompanyAdminPort.suspend
    InterviewSecurityPort.persistRevokeForScope(..., tx)  // generation + intent
    audit(reason,actor,traceId) + outbox cùng Tx
  commit → BE3 revoke worker → provider ack; provider lỗi không rollback security
```

Security lock/suspend không đồng nghĩa tự withdraw application hoặc xóa lịch sử. Explicit security-cancel do ADMIN theo endpoint riêng; status lịch khi suspend và revoke scope phải chốt A10, không tự biến mọi lịch thành CANCELLED ngoài workflow. Quyền join mới bị chặn ngay từ trạng thái account/company và provider kiểm current generation. Đang nối được kick theo mục tiêu≤60s với BE3; UI có pending metadata và cảnh báo.

## Job/query blueprint

Draft validate mọi field đã nhập; publish validate completeness,title10–150/description100–10000/location kể cả REMOTE/headcount integer1–100/types/modes/deadline tương lai. Salary cùngNULL cả3 hoặc đủ min/max/currency VND/USD, 0≤min≤max. CHECK nullable phải tránh UNKNOWN lọt invalid. PUBLISHED chỉ sửa description/location/skills/salary/deadline (deadline mới tương lai), không title/headcount/company/status tùy ý; CLOSED không mở lại. DRAFT có thể close chưa từng publish, không delete application hoặc cancel lịch.

JobApplicationPort.lockForSubmission giữ cùng user/company/job locks như BE2; check APPROVED+OWNER khả dụng, PUBLISHED và DB time<deadline, candidate không có active membership; BE2 vẫn kiểm CV/UNIQUE application. Close/publish/suspend/version cùng lock scope → race có kết quả theo thứ tự commit hợp lệ. JobVisibilityPort public detail hoặc placeholder đã chốt; không leak DRAFT/suspended qua saved-job.

Public list predicate `PUBLISHED && deadline>DB time && company APPROVED && ownerAvailable`; total/filter scope giống data, skill dùng EXISTS/COUNT distinct tránh nhân bản jobs. Detail có thể trả CLOSED/expired đã từng published + label ngừng nhận nếu company hợp lệ; CLOSED nháp chưa publish404. Skill names active/sort stable; dates offset/timestamptz. Keyword≤200, skills≤50,pageSize1–50, sort allowlist/id tie-break; SQL parameterized không raw interpolation.

## API bàn giao FE — base `/api`

Đây là danh mục route trong đặc tả, fields chi tiết/đề xuất cần A01–A15 chốt. Envelope `{data,meta?}`, lỗi `{code,message,fieldErrors?,traceId}`, không stack. Private ngoài read scope404; biết resource nhưng thiếu action403; stale version/business state409; input400; auth401/rate429.

| HTTP / route                                                                             | Policy và DTO chính                                                                                       | UC/UI                           |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------- |
| POST `/auth/register`, `/auth/login`                                                     | Origin, DTO allowlist, register mới201/trùng202, login200+cookie; không role tự khai                      | UC04 UI03/04                    |
| POST `/auth/verify-email`, `/auth/reset-password`                                        | Token purpose/expiry/single-use; reset password byte rules; 200/400/409                                   | UC04 UI05/06                    |
| POST `/auth/forgot-password`, `/auth/resend-verification`                                | normalized email;202 chung/rate429                                                                        | UC04 UI05/06                    |
| GET `/auth/session`, POST `/auth/logout`                                                 | Actor+CSRF/no-store; logout current session204, CSRF/Origin                                               | UC04 UI03–06 và protected shell |
| POST `/companies`, GET/PATCH `/companies/:id`                                            | Verified recruiter tạo PENDING+OWNER, member read/OWNER patch/version; approvalStatus không nhận từ owner | UC11 UI16                       |
| GET/POST/PATCH `/companies/:id/members`                                                  | List theo quyền; owner add/update, target/version semantics A02/03; option interviewer scope/role hợp lệ  | UC11 UI16/21                    |
| POST `/companies/:id/resubmit`                                                           | OWNER, REJECTED→PENDING đủ thông tin/version, không SUSPENDED                                             | UC11 UI16                       |
| POST `/jobs`, PATCH `/jobs/:id`                                                          | Recruiter đúng company, draft/published allowlists/version, fields money/skills/time                      | UC01 UI17/18                    |
| POST `/jobs/:id/publish`, `/jobs/:id/close`                                              | Operational company+version, close reason; không tự hủy lịch/cũ                                           | UC01 UI17/18                    |
| GET `/jobs`, `/jobs/:id`, `/skills`                                                      | Public filters/detail/status label; active skills catalog, không contact cá nhân/PII                      | UC05 UI01/02/07/18              |
| GET `/companies/:id/jobs`, `/companies/:id/jobs/:jobId`                                  | Private DRAFT/PUBLISHED/CLOSED đúng scope; total cùng predicate                                           | UC01 UI17/18                    |
| GET `/admin/companies`, `/admin/companies/:id`                                           | ADMIN list/detail/filter/paging metadata tối thiểu                                                        | UC10 UI26                       |
| PATCH `/admin/companies/:id`                                                             | ADMIN decision/status/reason/version, legal state graph                                                   | UC10 UI26                       |
| GET `/admin/companies/:id/eligible-owners`; POST `/admin/companies/:id/recover-owner`    | ACTIVE verified member target, memberId/reason/company/member versions theo A03                           | UC10 UI26                       |
| GET `/admin/users`, `/admin/jobs`                                                        | ADMIN list/filter, không password/hash/token/CV                                                           | UC10 UI27                       |
| PATCH `/admin/users/:id`; POST `/admin/jobs/:id/close`                                   | ADMIN status/reason/version; last ADMIN invariant và owner rules                                          | UC10 UI27                       |
| POST `/admin/interviews/:id/security-cancel`                                             | BE1 controller → BE3 port, reason/version, audit/revoke intent cùng Tx                                    | UC10 UI28                       |
| GET `/admin/audit`, `/admin/events`, `/admin/events/:id`; POST `/admin/events/:id/retry` | Controller/implementation BE3, guards BE1; retry FAILED giữ eventId/reason/audit, budget theo BE3 D13     | UC10 UI28                       |

Không thêm endpoint refresh-token/JWT, public user directory, general role-grant hay general status PATCH. UI chưa có list công ty của actor cần chốt cách lấy company context qua auth/session/member context trong A14, không tự mở directory tất cả công ty. GET public jobs/detail không reuse mapper private; admin DTO không mặc định chứa nội bộ CV/evaluations.

## Events, log và security data

Event names BE1 mới là đề xuất, chốt JSON schema với BE3 trước producer: `auth.verification_requested`, `auth.password_reset_requested`, `user.locked`, `company.created/reviewed/suspended`, `company.membership_changed`, `job.published/closed`. ID/version/time tối thiểu; riêng auth envelope mã hóa theo A09. UserRoles grant có audit; không tin role ở cookie stale hoặc body. Outbox/Audit lỗi rollback mutation; failed request không success event/audit giả, security deny log riêng đã redaction.

Trace nối request/user/entity/event IDs; blacklist password/cookie/token/csrf hash/encrypted envelope/signature/raw URL và CV/phiếu. Exception không dump Prisma record/query params. Runtime DB role không migrate/sửa audit/history; app seed ADMIN chỉ môi trường test hoặc runbook nội bộ có kiểm soát, không public route và không hardcode password mặc định production.
