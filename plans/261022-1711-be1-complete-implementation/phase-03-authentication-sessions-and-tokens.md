---
phase: 3
title: "Authentication sessions and tokens"
status: pending
effort: ""
---

# Phase 3: Authentication sessions and tokens

## Overview

Triển khai UC04 đầy đủ register/verify/login/session/logout/forgot/resend/reset. Phụ thuộc pha 1–2, profile facade/migration BE2 và Outbox/Audit/auth-mail consumer BE3 cho integration. FR01; BR15/18/20; TC26/31–34, EC19/20/23.

## Requirements

- Email trim/lower không bỏ dot/+tag; password giữ nguyên, ≥10 ký tự và≤72byte UTF8; BCrypt cost đo thực.
- Session server-side random≥32byte/hash, cookie chính xác, absolute24h/idle2h; CSRF/Origin/rate limits theo pha 1.
- Token purpose/expiry/consume CAS, encrypted mail material, reset+revoke atomic; race login/reset/lock không sinh session sai.

## Architecture

RegisterService/SessionService/AuthTokenService/ResetPasswordService cùng repositories Identity; token/time/password rules unit testable. Password hashing ngoài Tx, kiểm lại user/hash dưới lock. BE2 CandidateProfileFacade và BE3 OutboxPort nhận đúng Tx; MailPort không gọi từ controller. Pseudocode ở blueprint là thứ tự chuẩn.

## Related Code Files

- Tạo `identity/controllers/auth.controller.ts`, services/repositories/rules/ports/DTO/mappers theo blueprint; điền module providers.
- Điền guards session/origin/csrf và Actor decorator, test bootstrap metadata dùng production pipeline.
- Tạo `libs/platform/crypto/` và limiter adapter theo A06; cập nhật package API/lockfile nếu thêm BCrypt/limiter package đã kiểm chính thức, không pin phiên bản tùy đoán.
- Tạo `tests/{api,integration,concurrency,contract}/be1/{auth,auth-token,session,auth-races}*.spec.ts`, events/OpenAPI/auth fixtures và unit rules.
- Phối hợp BE3 consumer/material cleanup, BE2 facade/profile schema, `.env.example` key names không chứa secret thật.

## Implementation Steps

1. Viết boundary tests password9/10 ký tự, UTF8 71/72/73byte, Unicode không normalize password; email case/space/dot/+tag; role injection/body forbidden.
2. Register normalize DTO, rate-limit trước BCrypt, hash ngoài Tx, INSERT account+allowlist role+CANDIDATE profile+verify token+encrypted event một Tx. Unique email race chỉ1 account/profile/token event thành công; request trùng202 không sửa user cũ.
3. Token material random/hash và purpose VERIFY_EMAIL24h/RESET_PASSWORD30m, keyId/authenticated encrypted envelope theo A09 với nonce riêng và AAD bind token/user/purpose/event IDs; test sửa ciphertext/đổi envelope giữa events phải bị từ chối. Không plaintext DB/log/API. Worker material read kiểm current validity qua IdentityAuthMailMaterialPort; cleanup làm theo tech-material exception đã chốt, không xóa audit/event lịch sử nghiệp vụ.
4. Verify lock user/cas consume đúng purpose/unexpired/uninvalidated, set verified một Tx. Resend invalidates previous same-purpose và creates new + event; worker thấy token cũ phải bỏ gửi hợp lệ. Test đúng expiry và ±1ms bằng DB clock.
5. Login normalize email, compare BCrypt hoặc dummy hash ngoài Tx; lock user kiểm lại password_hash/status/verified policy trước tạo session. Không dùng session ID từ client, chỉ Set-Cookie sau commit. Sai password/account locked không lộ trường nhạy cảm.
6. GET session/SessionGuard kiểm expires/revoked/idle/account status mỗi protected request, conditional last_seen không revive expired session; global roles phục vụ actor nhưng mutation tái kiểm role/membership. CSRF trả qua A04/no-store, session cookie đúng __Host attrs.
7. Origin guard auth guest kể cả login; session mutation thêm CSRF header đúng hash/session. Hai browser tabs GET CSRF rồi mutation cùng tồn tại đúng contract; hostile Origin/CSRF missing403 không business side effect. Không đọc auth token từ URL query để log vô ý.
8. Forgot/resend trả202 chung, throttle429/Retry-After theo cấu hình đã chốt, bounded buckets và IP trust. Mô tả giới hạn rate-limit1 process nếu chọn memory; deployment nhiều instance chưa được claim distributed protection.
9. Reset hash password ngoài Tx rồi lock user, consume đúng reset token, update hash/version và revoke tất cả sessions trong Tx; khóa/reset race không tạo active session sau lock/reset. Logout revoke current session only/clear cookie204; không revoke các phiên khác ngoài reset/lock.
10. Multi-connection tests: register trùng normalized email, two verify/reset same token, resend vs send, login hash cũ vs reset, login/verify/reset vs lock. Dùng barrier thật và assert user/token/session/event/audit/profile state sau rollback.
11. Mailpit test đăng ký/verify/reset cuối luồng qua BE3 thật, SMTP lỗi không rollback account/reset. Browser HTTPS cookie+multi-tab auth flows FE1 UI03–06 và errors field association. Xuất OpenAPI/events/fixture, ghi tiến độ.

## Success Criteria

- [ ] TC26/31–34 EC19/20/23 đạt phần auth; session/cookie/CSRF/rate/token/password semantics có evidence.
- [ ] Register profile atomic; tokens một lần, reset/lock revoke sessions, BCrypt hash race được kiểm.
- [ ] Email provider lỗi không mất business commit; auth material không plaintext persist/log/admin API.
- [ ] Browser cùng origin HTTPS và FE1 fixtures hoạt động; thiếu provider/runtime còn ghi rõ chưa nghiệm thu.

## Risk Assessment

Không thể chứng minh không enumeration tuyệt đối với201/202 theo nguồn; ghi đúng giới hạn. Session guard kiểm account status nhưng command vẫn cần lock/recheck để tránh TOCTOU. Không trả csrf_hash/session token hash qua session DTO; không lưu raw token trong idempotency response.
