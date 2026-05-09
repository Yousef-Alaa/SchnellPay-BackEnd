# Schnell Pay API Endpoints

Base URL for API: `/api/v1`

**Authentication & Account Access (`/api/v1/auth`)**
*   `POST /auth/login` - Login to the application
*   `POST /auth/register` - Register a new user
*   `POST /auth/verify-email` - Verify email address
*   `POST /auth/forget-password` - Request password reset
*   `POST /auth/reset-password` - Reset password
*   `POST /auth/change-password` *(Protected)* - Change password while logged in
*   `POST /auth/resend-otp` - Resend One Time Password
*   `POST /auth/verify-reset-otp` - Verify password reset OTP
*   `POST /auth/refresh-token` - Refresh JWT token
*   `POST /auth/logout` *(Protected)* - Logout user

**Two-Factor Authentication (`/api/v1/auth/2fa`)**
*   `POST /auth/2fa/send-otp` - Send 2FA login OTP
*   `POST /auth/2fa/validate` - Validate 2FA login OTP
*   `POST /auth/2fa/setup` *(Protected)* - Setup 2FA method
*   `POST /auth/2fa/verify-setup` *(Protected)* - Verify 2FA setup completion
*   `POST /auth/2fa/regenerate-backup-codes` *(Protected)* - Generate new backup codes
*   `POST /auth/2fa/disable` *(Protected)* - Disable 2FA

**Users (`/api/v1/users`)**
*   `GET /users/search` *(Protected)* - Search for users
*   `GET /users/getMe` *(Protected)* - Get my profile
*   `PATCH /users/updateMe` *(Protected)* - Update my profile
*   `DELETE /users/deleteMe` *(Protected)* - Delete my account
*   `GET /users/` *(Admin)* - Get all users
*   `GET /users/:id` *(Admin)* - Get user by ID
*   `PATCH /users/:id` *(Admin)* - Update user by ID
*   `DELETE /users/:id` *(Admin)* - Delete user by ID

**KYC (`/api/v1/kyc`)**
*   `POST /kyc/submit` *(Protected)* - Submit KYC documents
*   `GET /kyc/status` *(Protected)* - Get own KYC status
*   `GET /kyc/` *(Admin)* - Get all KYC submissions
*   `GET /kyc/:kyc_id` *(Admin)* - Get specific KYC submission
*   `PATCH /kyc/:kyc_id` *(Admin)* - Review/update KYC submission

**Activity Log (`/api/v1/activity-log`)**
*   `GET /activity-log/` *(Protected)* - Get my own activity log
*   `GET /activity-log/:id` *(Admin)* - Get activity log of a specific user

**Notifications (`/api/v1/notifications`)**
*   `GET /notifications/` *(Protected)* - Get my notifications
*   `PATCH /notifications/read-all` *(Protected)* - Mark all notifications as read
*   `DELETE /notifications/delete-all` *(Protected)* - Delete all notifications
*   `PATCH /notifications/:id/read` *(Protected)* - Mark specific notification as read
*   `DELETE /notifications/:id` *(Protected)* - Delete specific notification

**ATM Transactions (`/api/v1/atm`)**
*   `POST /atm/generate-pin` - Generate an ATM code
*   `POST /atm/verify` - Verify an ATM code
*   `POST /atm/deposit` - Process an ATM deposit
*   `POST /atm/withdraw` - Process an ATM withdrawal

**Bills & Services (`/api/v1/bills`)**
*   `GET /bills/history` *(Protected)* - Get own bill payment history
*   `GET /bills/providers` *(Protected)* - Get all active providers
*   `GET /bills/services` *(Protected)* - Get all active services
*   `GET /bills/providers/:providerId/services` *(Protected)* - Get active services for a specific provider
*   `POST /bills/pay` *(Protected + PIN)* - Pay a bill
*   `GET /bills/admin/history` *(Admin)* - Get all bills history platform-wide
*   `GET /bills/admin/history/:userId` *(Admin)* - Get bills history for a specific user
*   `GET /bills/admin/providers` *(Admin)* - Get all providers (including inactive)
*   `POST /bills/admin/providers` *(Admin)* - Create a new provider
*   `PUT /bills/admin/providers/:id` *(Admin)* - Update a provider
*   `DELETE /bills/admin/providers/:id` *(Admin)* - Delete a provider
*   `GET /bills/admin/services` *(Admin)* - Get all services (including inactive)
*   `POST /bills/admin/services` *(Admin)* - Create a new service
*   `PUT /bills/admin/services/:id` *(Admin)* - Update a service
*   `DELETE /bills/admin/services/:id` *(Admin)* - Delete a service

**Transactions (`/api/v1/transactions`)**
*   `GET /transactions/user` *(Protected)* - Get my transactions
*   `GET /transactions/` *(Admin)* - Get all transactions platform-wide

**Payment Methods (`/api/v1/payment-methods`)**
*   `GET /payment-methods/` *(Protected)* - Get my payment methods
*   `POST /payment-methods/card` *(Protected)* - Add a card method
*   `POST /payment-methods/mobile` *(Protected)* - Add a mobile wallet method
*   `DELETE /payment-methods/:id` *(Protected)* - Remove a payment method
*   `PATCH /payment-methods/:id/default` *(Protected)* - Set a method as default

**Wallet Deposit (`/api/v1/wallet/deposit`)**
*   `POST /wallet/deposit/` *(Protected + PIN)* - Deposit funds into the wallet

**Static Files**
*   `/uploads` - Static path to uploaded resources