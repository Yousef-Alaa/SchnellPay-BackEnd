# SchnellPay Backend — Architecture Analysis

## 1. Overall Architecture

**Stack:** Node.js + Express 5.x, Microsoft SQL Server (no ORM — raw parameterized SQL via `mssql`), deployed on Vercel.

**Pattern:** Layered MVC — Routes → Middleware → Controllers → Models → DB

```
HTTP Request
    ↓
api/index.js        ← bootstrap: registers middleware + mounts all routers
    ↓
routes/             ← express.Router per domain; applies per-route middleware chain
    ↓
middleware/         ← verifyToken, allowTo, verifyPin, kycUpload, resendLimit, logger
    ↓
controllers/        ← business logic; reads req, calls models, sends res
    ↓
models/             ← all SQL: parameterized queries via mssql poolPromise
    ↓
config/db.js        ← single ConnectionPool (max 10), exported as { sql, poolPromise }
```

`utils/` provides shared helpers used across controllers: JWT generation, token issuance, email sending, error factory, activity logging, notification creation.

**Key dependencies:**
- `express` v5, `mssql` v12, `jsonwebtoken`, `bcryptjs` + `bcrypt` (both installed — inconsistency), `speakeasy` + `qrcode` (TOTP), `multer` (file upload), `nodemailer`, `express-rate-limit`, `cookie-parser`, `dotenv`

---

## 2. Detected API Modules

| # | Module | Base Path | Description |
|---|---|---|---|
| 1 | **Auth** | `/api/v1/auth` | Register, login, OTP verification, password management, token lifecycle |
| 2 | **2FA / MFA** | `/api/v1/auth/2fa` | Sub-router; email OTP and TOTP app setup, login validation, backup codes |
| 3 | **Users** | `/api/v1/users` | Self-service profile (getMe, updateMe, deleteMe, search) + admin CRUD |
| 4 | **KYC** | `/api/v1/kyc` | Document upload (multipart) + admin review/approve/reject |
| 5 | **Transactions** | `/api/v1/transactions` | P2P money transfer (with DB transaction + PIN) + history |
| 6 | **Bills** | `/api/v1/bills` | Bill payment, provider & service management (admin CRUD) |
| 7 | **ATM** | `/api/v1/atm` | No-JWT ATM flow: PIN generation via email, deposit, withdrawal |
| 8 | **Payment Methods** | `/api/v1/payment-methods` | Add/remove/default card and mobile wallet methods |
| 9 | **Wallet Deposit** | `/api/v1/wallet/deposit` | Deposit funds via a saved payment method |
| 10 | **Activity Log** | `/api/v1/activity-log` | Security event history (own + admin lookup by user ID) |
| 11 | **Notifications** | `/api/v1/notifications` | In-app notifications: read, mark-read, delete |

---

## 3. All Discovered Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Auth Guard | Rate Limit |
|---|---|---|---|
| POST | `/login` | Public | 5 req / 15 min |
| POST | `/register` | Public | 3 req / 1 min |
| POST | `/verify-email` | Public | 5 req / 10 min |
| POST | `/resend-otp` | Public | 1 req / 1 min |
| POST | `/forget-password` | Public | 3 req / 15 min |
| POST | `/verify-reset-otp` | Public | 5 req / 10 min |
| POST | `/reset-password` | Public | 3 req / 10 min |
| POST | `/change-password` | verifyToken | 5 req / 10 min |
| POST | `/refresh-token` | Public (reads httpOnly cookie) | — |
| POST | `/logout` | verifyToken | — |

### 2FA — `/api/v1/auth/2fa`

| Method | Path | Auth Guard |
|---|---|---|
| POST | `/send-otp` | Public |
| POST | `/validate` | Public (mfa_token in body) |
| POST | `/setup` | verifyToken |
| POST | `/verify-setup` | verifyToken |
| POST | `/regenerate-backup-codes` | verifyToken |
| POST | `/disable` | verifyToken |

### Users — `/api/v1/users`

| Method | Path | Auth Guard |
|---|---|---|
| GET | `/search` | verifyToken |
| GET | `/getMe` | verifyToken |
| PATCH | `/updateMe` | verifyToken |
| DELETE | `/deleteMe` | verifyToken |
| GET | `/` | verifyToken + admin |
| GET | `/:id` | verifyToken + admin |
| PATCH | `/:id` | verifyToken + admin |
| DELETE | `/:id` | verifyToken + admin |

### KYC — `/api/v1/kyc`

| Method | Path | Auth Guard |
|---|---|---|
| POST | `/submit` | verifyToken + kycUpload middleware |
| GET | `/status` | verifyToken |
| GET | `/` | verifyToken + admin |
| GET | `/:kyc_id` | verifyToken + admin |
| PATCH | `/:kyc_id` | verifyToken + admin |

### Transactions — `/api/v1/transactions`

| Method | Path | Auth Guard |
|---|---|---|
| GET | `/user` | verifyToken |
| GET | `/` | verifyToken + admin |
| POST | `/send` | verifyToken + verifyPin |

### Bills — `/api/v1/bills`

| Method | Path | Auth Guard |
|---|---|---|
| GET | `/history` | verifyToken |
| GET | `/providers` | verifyToken |
| GET | `/services` | verifyToken |
| GET | `/providers/:providerId/services` | verifyToken |
| POST | `/pay` | verifyToken + verifyPin |
| GET | `/admin/history` | verifyToken + admin |
| GET | `/admin/history/:userId` | verifyToken + admin |
| GET | `/admin/providers` | verifyToken + admin |
| POST | `/admin/providers` | verifyToken + admin |
| PUT | `/admin/providers/:id` | verifyToken + admin |
| DELETE | `/admin/providers/:id` | verifyToken + admin |
| GET | `/admin/services` | verifyToken + admin |
| POST | `/admin/services` | verifyToken + admin |
| PUT | `/admin/services/:id` | verifyToken + admin |
| DELETE | `/admin/services/:id` | verifyToken + admin |

### ATM — `/api/v1/atm`

| Method | Path | Auth Guard |
|---|---|---|
| POST | `/generate-pin` | Public (phone in body) |
| POST | `/verify` | Public (phone + atm_code re-verified each call) |
| POST | `/deposit` | Public (phone + atm_code re-verified each call) |
| POST | `/withdraw` | Public (phone + atm_code re-verified each call) |

### Payment Methods — `/api/v1/payment-methods`

| Method | Path | Auth Guard |
|---|---|---|
| GET | `/` | verifyToken |
| POST | `/card` | verifyToken |
| POST | `/mobile` | verifyToken |
| DELETE | `/:id` | verifyToken |
| PATCH | `/:id/default` | verifyToken |

### Wallet Deposit — `/api/v1/wallet/deposit`

| Method | Path | Auth Guard |
|---|---|---|
| POST | `/` | verifyToken + verifyPin |

### Activity Log — `/api/v1/activity-log`

| Method | Path | Auth Guard |
|---|---|---|
| GET | `/` | verifyToken (own log) |
| GET | `/:id` | verifyToken + admin |

### Notifications — `/api/v1/notifications`

| Method | Path | Auth Guard |
|---|---|---|
| GET | `/` | verifyToken |
| PATCH | `/read-all` | verifyToken |
| DELETE | `/delete-all` | verifyToken |
| PATCH | `/:id/read` | verifyToken |
| DELETE | `/:id` | verifyToken |

---

## 4. Authentication & Authorization Flow

### Standard Login (No MFA)

```
POST /auth/login  →  validate email+password (bcrypt)
                  →  check is_verified flag
                  →  check MFA status (getMfaStatus)
                  →  if no MFA: issueTokens()
                        ├─ generate JWT (15min dev / 1h prod — actually reversed, see note)
                        ├─ generate refresh token: "<userId>:<randomHex64>"
                        ├─ bcrypt-hash the random part → store in REFRESH_TOKENS table
                        └─ set refresh token as httpOnly, sameSite=strict cookie (24h)
                  →  return { token: accessToken }
```

### MFA Login (2-step)

```
POST /auth/login  →  password valid, MFA enabled
                  →  issue short-lived mfa_token (JWT, 10min, signed with MFA_TOKEN_SECRET)
                  →  return { requires2FA: true, mfa_token, username, method }

(if method='email')
POST /auth/2fa/send-otp  →  generate OTP → bcrypt hash → save to DB → send via email

POST /auth/2fa/validate  →  verify mfa_token signature
                         →  verify OTP (email) OR TOTP (app) OR backup code
                         →  on success: issueTokens() → return full access token
```

### Token Refresh

```
POST /auth/refresh-token  →  read refresh_token cookie
                          →  extract userId prefix → scope DB lookup
                          →  bcrypt.compare random part against all valid token hashes
                          →  slide expiry +24h (rolling window)
                          →  issue new JWT access token
```

### Logout

```
POST /auth/logout  →  if all_devices=true: revokeAllUserTokens(userId)
                   →  else: find matching refresh token hash → revoke that row
                   →  clearCookie("refresh_token")
```

### Authorization Layers

1. **`verifyToken`** — extracts Bearer token from `Authorization` header, `jwt.verify()` with `SECRET_KEY`, attaches `req.user = { id, email, name, role }`
2. **`allowTo("admin")`** — checks `req.user.role === "admin"`, returns 403 otherwise
3. **`verifyTransactionPin`** — reads `transaction_pin` from body, fetches hashed PIN from DB by `req.user.id`, `bcrypt.compare` — applied to all money-moving endpoints

### ATM Authentication (No JWT)
The ATM module uses **stateless per-request credential re-verification**: `phone` + `atm_code` are sent on every request. The ATM code is a 6-digit OTP (bcrypt-hashed in DB, 10-min expiry) sent to the user's email via `POST /atm/generate-pin`.

---

## 5. Middleware Summary

| Middleware | Purpose |
|---|---|
| `logger.js` | Colorized method + URL console logging (global) |
| `verifyToken.js` | JWT verification; attaches `req.user` |
| `allowTo.js` | Role-based access control (currently only `"admin"`) |
| `verifyPin.js` | Transaction PIN verification via bcrypt + DB lookup |
| `resendLimit.js` | 12 distinct `express-rate-limit` instances for every sensitive endpoint |
| `kycUpload.js` | Multer disk storage — saves to `uploads/kyc/:user_id/`; accepts JPEG/PNG/WEBP, max 5MB per file; fields: `front_image`, `back_image`, `selfie_image` |
| `asyncWrapper.js` | Wraps async controller functions, forwards errors to `next()` |

---

## 6. Database Layer

- **Driver:** `mssql` v12 with a single `ConnectionPool` (max 10 connections, 30s idle timeout)
- **Pattern:** All queries are raw parameterized SQL — no ORM. Models export async functions that acquire the pool and return `result.recordset`.
- **Transactions:** `sql.Transaction` used explicitly in money-moving operations (`sendMoney`, ATM deposit/withdraw, `setDefaultPaymentMethod`) with manual `begin/commit/rollback`.
- **Tables inferred from queries:** `USERS`, `REFRESH_TOKENS`, `TRANSACTIONS`, `BILLS_PROVIDERS`, `BILLS_SERVICES`, `BILL_DETAILS`, `KYC_DOCUMENTS`, `WALLETS`, `PAYMENT_METHODS`, `CARD_DETAILS`, `MOBILE_WALLET_DETAILS`, `ACTIVITY_LOG`, `NOTIFICATIONS`, `TWO_FA` (or similar for MFA state)

---

## 7. Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `development` or `production` — affects JWT expiry and cookie `secure` flag |
| `DB_SERVER` | SQL Server hostname |
| `DB_PORT` | SQL Server port |
| `DB_NAME` | Database name |
| `DB_USER` | DB username |
| `DB_PASSWORD` | DB password |
| `SECRET_KEY` | JWT signing secret (access tokens) |
| `MFA_TOKEN_SECRET` | Separate secret for short-lived MFA tokens |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_SECURE` | TLS flag (`true`/`false`) |
| `MAIL_SERVICE` | Email service (e.g. `gmail`) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |

---

## 8. Missing or Unclear Parts

### 🔴 Bugs / Logic Issues

- **ATM `resolveUser` expiry check is inverted:** `new Date(user.atmcode_expired) >= new Date()` means a code is accepted only **after** it expires — the condition should be `<` (less than).
- **`generatJwt.js` expiry logic is backwards:** `development ? "1h" : "15m"` — in production tokens last only 15 minutes which is correct, but a comment says "15min dev / 1h prod" — the code does the opposite of the comment.
- **`logout.js` references `req.user.user_id`** but `verifyToken` attaches `req.user.id` (from JWT payload `id` field). This means single-device logout would use `undefined` for the user ID lookup.
- **`CORS` is listed in `package.json`** but never configured or mounted in `api/index.js` — cross-origin requests will be blocked in production.

### 🟡 Gaps & Unclear Areas

- **No input validation library** (no Joi, Zod, express-validator) — validation is done ad-hoc inside each controller with manual `if (!field)` checks. No schema-level enforcement.
- **`transactionLimiter`** is defined in `resendLimit.js` but **never applied** to any route — `POST /transactions/send` and `POST /bills/pay` have no rate limiting.
- **No wallet creation flow visible** — wallet records appear to be created at registration time (perhaps via a DB trigger or stored procedure), but there is no controller or model function for `createWallet`.
- **`services` route** (`GET /api/v1/bills`) is not mounted — there is no route for a `notificationModel` or `notificationController` with a `services` module pattern visible.
- **No pagination response envelope standardization** — some endpoints return `{ data, total, page }`, others just `{ data }` — inconsistent.
- **No global `CORS` setup** — the `cors` package is installed but unused in `api/index.js`.
- **Static file serving** for `/uploads` is active (`express.static`) but there is no access control — KYC document images are publicly accessible if the path is known.
- **`services` directory** does not exist — no dedicated service layer between controllers and models (business logic lives directly in controllers).
- **`TWO_FA` model** (`twoFaModel.js`) functions like `getMfaStatus`, `saveOtp`, `saveTotpSecret`, etc. were called but the model file was not listed in this analysis pass — its exact table name is unconfirmed.
- **`billDatailsModel.js`** (note typo in filename) exists but was not reviewed — unclear which controller uses it.
- **No refresh token cleanup job** — expired/revoked tokens accumulate in the `REFRESH_TOKENS` table indefinitely.
