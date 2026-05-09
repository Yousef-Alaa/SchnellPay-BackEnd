const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SchnellPay API",
      version: "1.0.0",
      description:
        "Complete REST API documentation for the SchnellPay digital wallet platform. Covers authentication, MFA, user management, KYC, P2P transfers, bill payments, ATM operations, payment methods, activity logs, and notifications.",
      contact: { name: "SchnellPay Team" },
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      { url: "https://your-vercel-url.vercel.app", description: "Production" },
    ],
    tags: [
      { name: "Auth", description: "Registration, login, OTP, password management" },
      { name: "2FA", description: "Two-factor authentication setup and validation" },
      { name: "Users", description: "User profile management (self-service + admin)" },
      { name: "KYC", description: "Know-Your-Customer document submission and review" },
      { name: "Transactions", description: "P2P money transfers and history" },
      { name: "Bills", description: "Bill payments, providers, and services" },
      { name: "ATM", description: "ATM-style cash deposit and withdrawal (no JWT)" },
      { name: "Payment Methods", description: "Cards and mobile wallets management" },
      { name: "Wallet", description: "Wallet deposit via payment method" },
      { name: "Activity Log", description: "Security event history" },
      { name: "Notifications", description: "In-app notification management" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token. Obtain from /auth/login or /auth/2fa/validate. Expires in 15 min (prod) or 1h (dev).",
        },
      },
      schemas: {
        // ─── Generic wrappers ───────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error description" },
            data: { type: "object", nullable: true, example: null },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            total: { type: "integer", example: 100 },
            page: { type: "integer", example: 1 },
            totalPages: { type: "integer", example: 10 },
          },
        },

        // ─── Auth ───────────────────────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["fname","lname","email","password","phone","country","user_name","transaction_pin"],
          properties: {
            fname: { type: "string", example: "Ahmed" },
            lname: { type: "string", example: "Hassan" },
            email: { type: "string", format: "email", example: "ahmed@example.com" },
            password: { type: "string", format: "password", example: "StrongPass123!" },
            phone: { type: "string", example: "01012345678" },
            country: { type: "string", example: "Egypt" },
            user_name: { type: "string", example: "ahmed99" },
            transaction_pin: {
              type: "string",
              pattern: "^\\d{6}$",
              description: "Exactly 6 digits",
              example: "123456",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "ahmed@example.com" },
            password: { type: "string", format: "password", example: "StrongPass123!" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "User logged in successfully." },
            token: { type: "string", description: "JWT access token (present when MFA is disabled)" },
            requires2FA: { type: "boolean", description: "Present and true when MFA is enabled" },
            data: {
              type: "object",
              description: "Present only when MFA is required",
              properties: {
                username: { type: "string" },
                method: { type: "string", enum: ["email", "app"] },
                mfa_token: { type: "string", description: "Short-lived token (10 min) to pass to /2fa/validate" },
              },
            },
          },
        },
        VerifyEmailRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", format: "email", example: "ahmed@example.com" },
            otp: { type: "string", pattern: "^\\d{6}$", example: "482910" },
          },
        },
        ResendOtpRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "ahmed@example.com" },
          },
        },
        ForgetPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "ahmed@example.com" },
          },
        },
        VerifyResetOtpRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", format: "email", example: "ahmed@example.com" },
            otp: { type: "string", pattern: "^\\d{6}$", example: "391847" },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["email", "newPassword"],
          properties: {
            email: { type: "string", format: "email", example: "ahmed@example.com" },
            newPassword: { type: "string", format: "password", example: "NewPass456!" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string", format: "password", example: "OldPass123!" },
            newPassword: { type: "string", format: "password", example: "NewPass456!" },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Access token refreshed." },
            token: { type: "string", description: "New JWT access token" },
          },
        },
        LogoutRequest: {
          type: "object",
          properties: {
            all_devices: {
              type: "boolean",
              description: "If true, revokes all sessions across all devices",
              example: false,
            },
          },
        },

        // ─── 2FA ────────────────────────────────────────────────────────────
        MfaSetupRequest: {
          type: "object",
          required: ["method"],
          properties: {
            method: { type: "string", enum: ["email", "app"], example: "email" },
          },
        },
        MfaVerifySetupRequest: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string", description: "6-digit email OTP or TOTP code from auth app", example: "482910" },
          },
        },
        MfaSendOtpRequest: {
          type: "object",
          required: ["username"],
          properties: {
            username: { type: "string", example: "ahmed99" },
          },
        },
        MfaValidateRequest: {
          type: "object",
          required: ["mfa_token", "code"],
          properties: {
            mfa_token: { type: "string", description: "Token received from /auth/login when MFA is required" },
            code: { type: "string", description: "Email OTP, TOTP code, or 10-character backup code", example: "482910" },
          },
        },
        MfaCodeRequest: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string", description: "Valid MFA code or backup code to confirm action", example: "482910" },
          },
        },

        // ─── Users ──────────────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            user_id: { type: "integer", example: 1 },
            f_name: { type: "string", example: "Ahmed" },
            l_name: { type: "string", example: "Hassan" },
            email: { type: "string", example: "ahmed@example.com" },
            user_name: { type: "string", example: "ahmed99" },
            phone: { type: "string", example: "01012345678" },
            country: { type: "string", example: "Egypt" },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            account_status: { type: "string", enum: ["active", "suspended"], example: "active" },
            creation_date: { type: "string", format: "date-time" },
          },
        },
        UpdateUserRequest: {
          type: "object",
          description: "All fields optional. Only f_name, l_name, phone, country, account_status (admin only), role (admin only) are accepted.",
          properties: {
            f_name: { type: "string", example: "Ahmed" },
            l_name: { type: "string", example: "Hassan" },
            phone: { type: "string", example: "01012345678" },
            country: { type: "string", example: "Egypt" },
            account_status: { type: "string", enum: ["active", "suspended"], description: "Admin only" },
            role: { type: "string", enum: ["user", "admin"], description: "Admin only" },
          },
        },
        SearchUserResult: {
          type: "object",
          properties: {
            user_name: { type: "string", example: "ahmed99" },
            full_name: { type: "string", example: "Ahmed Hassan" },
          },
        },

        // ─── KYC ────────────────────────────────────────────────────────────
        KycStatus: {
          type: "object",
          properties: {
            kyc_status: { type: "string", enum: ["not_submitted","pending","approved","rejected"], example: "pending" },
            document_type: { type: "string", enum: ["national_id","passport","driving_license"], nullable: true },
            verified_at: { type: "string", format: "date-time", nullable: true },
            rejection_reason: { type: "string", nullable: true },
          },
        },
        KycRecord: {
          type: "object",
          properties: {
            KYC_ID: { type: "integer", example: 5 },
            KYC_status: { type: "string", enum: ["pending","approved","rejected"] },
            document_type: { type: "string", example: "national_id" },
            verified_at: { type: "string", format: "date-time", nullable: true },
            rejection_reason: { type: "string", nullable: true },
            user_id: { type: "integer" },
            f_name: { type: "string" },
            l_name: { type: "string" },
            email: { type: "string" },
          },
        },
        KycDetail: {
          type: "object",
          properties: {
            kyc_id: { type: "integer" },
            kyc_status: { type: "string" },
            document_type: { type: "string" },
            verified_at: { type: "string", format: "date-time", nullable: true },
            rejection_reason: { type: "string", nullable: true },
            reviewed_by: { type: "integer", nullable: true },
            images: {
              type: "object",
              properties: {
                front: { type: "string", format: "uri" },
                back: { type: "string", format: "uri" },
                selfie: { type: "string", format: "uri" },
              },
            },
            user: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
              },
            },
          },
        },
        KycReviewRequest: {
          type: "object",
          required: ["action"],
          properties: {
            action: { type: "string", enum: ["approve", "reject"], example: "approve" },
            rejection_reason: {
              type: "string",
              description: "Required when action is 'reject'",
              example: "Document is blurry or unreadable",
            },
          },
        },

        // ─── Transactions ────────────────────────────────────────────────────
        SendMoneyRequest: {
          type: "object",
          required: ["receiver_username", "amount", "transaction_pin"],
          properties: {
            receiver_username: { type: "string", example: "sara22" },
            amount: { type: "number", format: "float", minimum: 0.01, example: 250.00 },
            description: { type: "string", example: "Rent share", nullable: true },
            transaction_pin: { type: "string", pattern: "^\\d{6}$", example: "123456" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            transaction_id: { type: "integer" },
            transaction_type: { type: "string", enum: ["transfer","bill","deposit","withdraw"] },
            sender_id: { type: "integer", nullable: true },
            receiver_id: { type: "integer", nullable: true },
            sender_name: { type: "string", nullable: true },
            receiver_name: { type: "string", nullable: true },
            amount: { type: "number", format: "float" },
            status: { type: "string", enum: ["completed","pending","failed"] },
            description: { type: "string", nullable: true },
            reference_number: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },

        // ─── Bills ──────────────────────────────────────────────────────────
        PayBillRequest: {
          type: "object",
          required: ["service_id", "amount", "consumer_number", "transaction_pin"],
          properties: {
            service_id: { type: "integer", example: 3 },
            amount: { type: "number", format: "float", minimum: 0.01, example: 150.00 },
            consumer_number: { type: "string", example: "EG-12345678" },
            transaction_pin: { type: "string", pattern: "^\\d{6}$", example: "123456" },
          },
        },
        Provider: {
          type: "object",
          properties: {
            provider_id: { type: "integer", example: 1 },
            provider_name: { type: "string", example: "Egyptian Electric Co." },
            provider_code: { type: "string", example: "EEC" },
            contact_mail: { type: "string", format: "email", nullable: true },
            is_active: { type: "boolean", example: true },
          },
        },
        ProviderRequest: {
          type: "object",
          required: ["name", "code"],
          properties: {
            name: { type: "string", example: "Egyptian Electric Co." },
            code: { type: "string", example: "EEC" },
            contact_email: { type: "string", format: "email", nullable: true },
            is_active: { type: "boolean", default: true },
          },
        },
        Service: {
          type: "object",
          properties: {
            service_id: { type: "integer", example: 1 },
            provider_id: { type: "integer", example: 1 },
            provider_name: { type: "string", example: "Egyptian Electric Co." },
            service_name: { type: "string", example: "Electricity Bill" },
            service_category: { type: "string", example: "Utilities" },
            fee: { type: "number", format: "float", example: 2.50 },
            is_active: { type: "boolean", example: true },
          },
        },
        ServiceRequest: {
          type: "object",
          required: ["provider_id", "service_name"],
          properties: {
            provider_id: { type: "integer", example: 1 },
            service_name: { type: "string", example: "Electricity Bill" },
            category: { type: "string", example: "Utilities" },
            fee: { type: "number", format: "float", default: 0, example: 2.50 },
            is_active: { type: "boolean", default: true },
          },
        },

        // ─── ATM ────────────────────────────────────────────────────────────
        AtmGeneratePinRequest: {
          type: "object",
          required: ["phone"],
          properties: {
            phone: { type: "string", example: "01012345678" },
          },
        },
        AtmVerifyRequest: {
          type: "object",
          required: ["phone", "atm_code"],
          properties: {
            phone: { type: "string", example: "01012345678" },
            atm_code: { type: "string", pattern: "^\\d{6}$", example: "849201" },
          },
        },
        AtmTransactionRequest: {
          type: "object",
          required: ["phone", "atm_code", "amount"],
          properties: {
            phone: { type: "string", example: "01012345678" },
            atm_code: { type: "string", pattern: "^\\d{6}$", example: "849201" },
            amount: { type: "number", format: "float", minimum: 0.01, example: 500.00 },
          },
        },

        // ─── Payment Methods ─────────────────────────────────────────────────
        PaymentMethod: {
          type: "object",
          properties: {
            method_id: { type: "integer", example: 7 },
            provider_name: { type: "string", example: "Visa" },
            method_type: { type: "string", enum: ["card","mobile wallet"], example: "card" },
            is_default: { type: "boolean", example: false },
            card_number: { type: "string", nullable: true, example: "4111111111111111" },
            phone_number: { type: "string", nullable: true, example: "01012345678" },
          },
        },
        AddCardRequest: {
          type: "object",
          required: ["providerName","cardNumber","expiryDate","cardHolderName"],
          properties: {
            providerName: { type: "string", example: "Visa" },
            cardNumber: { type: "string", example: "4111111111111111" },
            expiryDate: { type: "string", format: "date", example: "2027-12-01" },
            cardHolderName: { type: "string", example: "Ahmed Hassan" },
            gatewayToken: { type: "string", description: "Payment gateway token (optional)", nullable: true },
          },
        },
        AddMobileWalletRequest: {
          type: "object",
          required: ["providerName","phoneNumber"],
          properties: {
            providerName: { type: "string", example: "Vodafone Cash" },
            phoneNumber: { type: "string", example: "01012345678" },
          },
        },
        WalletDepositRequest: {
          type: "object",
          required: ["amount","transaction_pin"],
          properties: {
            amount: { type: "number", format: "float", minimum: 0.01, example: 1000.00 },
            method_id: { type: "integer", nullable: true, description: "Optional. Uses default method if omitted." },
            transaction_pin: { type: "string", pattern: "^\\d{6}$", example: "123456" },
          },
        },

        // ─── Activity Log ────────────────────────────────────────────────────
        ActivityLog: {
          type: "object",
          properties: {
            log_id: { type: "integer" },
            user_id: { type: "integer" },
            action: {
              type: "string",
              enum: ["login_success","login_failed","password_changed","profile_updated","2fa_enabled","2fa_disabled","backup_codes_regenerated"],
            },
            description: { type: "string" },
            ip_address: { type: "string", nullable: true },
            device: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
          },
        },

        // ─── Notifications ───────────────────────────────────────────────────
        Notification: {
          type: "object",
          properties: {
            notification_id: { type: "integer" },
            user_id: { type: "integer" },
            title: { type: "string", example: "Money Received" },
            message: { type: "string", example: "You received 250 EGP from ahmed99." },
            type: { type: "string", enum: ["TRANSACTION","BILL","ATM","KYC","DEPOSIT"], example: "TRANSACTION" },
            is_read: { type: "boolean", example: false },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./routes/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
