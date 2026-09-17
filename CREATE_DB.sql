-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE [USERS] (
    user_id             INT             NOT NULL IDENTITY(1,1),
    f_name              VARCHAR(50)     NOT NULL,
    l_name              VARCHAR(50)     NOT NULL,
    email               VARCHAR(100)    NOT NULL,
    user_name           VARCHAR(50)     NOT NULL,
    phone               VARCHAR(20)     NOT NULL,
    password            VARCHAR(255)    NOT NULL,
    role                VARCHAR(20)     DEFAULT 'user',
    transaction_PIN     VARCHAR(60),
    account_status      VARCHAR(20)     DEFAULT 'active',
    creation_date       DATETIME        DEFAULT GETDATE(),
    country             VARCHAR(50),

    -- ATM
    atm_code            VARCHAR(100),
    atmcode_expired     VARCHAR(50),

    -- Email verification
    is_verified         BIT             DEFAULT 0,
    email_otp           NVARCHAR(255),
    email_otp_expires   BIGINT,

    -- Password reset
    reset_otp           VARCHAR(255)    NULL,
    reset_otp_expires   DATETIME        NULL,
    reset_otp_verified  BIT             DEFAULT 0,

    -- MFA
    otp_code            VARCHAR(100),
    otp_expires_at      DATETIME        DEFAULT NULL,
    mfa_enabled         BIT             DEFAULT 0,
    mfa_method          VARCHAR(10)     DEFAULT NULL,   -- 'email' | 'app'
    totp_secret         VARCHAR(100)    DEFAULT NULL,

    CONSTRAINT PK_USER              PRIMARY KEY (user_id),
    CONSTRAINT UQ_USER_EMAIL        UNIQUE (email),
    CONSTRAINT UQ_USER_USERNAME     UNIQUE (user_name),
    CONSTRAINT UQ_USERS_PHONE       UNIQUE (phone),
    CONSTRAINT CHK_MFA_METHOD_TYPE  CHECK (mfa_method IN ('email', 'app'))
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. WALLET
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE WALLET (
    user_id         INT             NOT NULL,
    balance         DECIMAL(15, 2)  DEFAULT 0.00,
    currency        VARCHAR(10)     DEFAULT 'EGP',
    wallet_status   VARCHAR(20)     DEFAULT 'active',

    CONSTRAINT PK_WALLET        PRIMARY KEY (user_id),
    CONSTRAINT FK_WALLET_USER   FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PAYMENT_METHODS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE PAYMENT_METHODS (
    method_id       INT             NOT NULL IDENTITY(1,1),
    user_id         INT             NOT NULL,
    provider_name   VARCHAR(100),
    method_type     VARCHAR(50)     NOT NULL,
    is_default      BIT             DEFAULT 0,

    CONSTRAINT PK_PAYMENT_METHOD        PRIMARY KEY (method_id, user_id),
    CONSTRAINT FK_PAYMENT_METHOD_USER   FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CARD_DETAILS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE CARD_DETAILS (
    method_id           INT             NOT NULL,
    user_id             INT             NOT NULL,
    card_number         VARCHAR(20)     NOT NULL,
    gateway_token       VARCHAR(255),
    expiry_date         DATE,
    card_holder_name    VARCHAR(100),

    CONSTRAINT PK_CARD_DETAILS          PRIMARY KEY (method_id, user_id),
    CONSTRAINT FK_CARD_DETAILS_METHOD   FOREIGN KEY (method_id, user_id)
        REFERENCES PAYMENT_METHODS(method_id, user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MOBILE_WALLET_DETAILS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE MOBILE_WALLET_DETAILS (
    method_id       INT             NOT NULL,
    user_id         INT             NOT NULL,
    phone_number    VARCHAR(20),

    CONSTRAINT PK_MOBILE_WALLET_DETAILS         PRIMARY KEY (method_id, user_id),
    CONSTRAINT FK_MOBILE_WALLET_DETAILS_METHOD  FOREIGN KEY (method_id, user_id)
        REFERENCES PAYMENT_METHODS(method_id, user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. KYC_DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE KYC_DOCUMENTS (
    KYC_ID              INT             NOT NULL IDENTITY(1,1),
    user_id             INT             NOT NULL,
    document_type       VARCHAR(50),
    front_image         VARCHAR(255),
    back_image          VARCHAR(255),
    selfie_image        VARCHAR(255),
    KYC_status          VARCHAR(20)     DEFAULT 'pending',
    verified_at         DATETIME,
    rejection_reason    VARCHAR(255)    DEFAULT NULL,
    reviewed_by         INT             DEFAULT NULL,

    CONSTRAINT PK_KYC           PRIMARY KEY (KYC_ID),
    CONSTRAINT FK_KYC_USER      FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_KYC_REVIEWER  FOREIGN KEY (reviewed_by)
        REFERENCES [USERS](user_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TRANSACTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE [TRANSACTIONS] (
    transaction_id      INT             NOT NULL IDENTITY(1,1),
    transaction_type    VARCHAR(50)     NOT NULL,
    sender_id           INT,
    receiver_id         INT,
    amount              DECIMAL(15, 2)  NOT NULL,
    status              VARCHAR(20)     DEFAULT 'pending',
    created_at          DATETIME        DEFAULT GETDATE(),
    description         VARCHAR(255),
    reference_number    VARCHAR(100)    NOT NULL,

    CONSTRAINT PK_TRANSACTION               PRIMARY KEY (transaction_id),
    CONSTRAINT UQ_TRANSACTION_REF           UNIQUE (reference_number),
    CONSTRAINT CHK_TRANSACTION_TYPE         CHECK (transaction_type IN ('transfer', 'deposit', 'withdraw', 'bill', 'refund')),
    CONSTRAINT CHK_TRANSACTION_STATUS       CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT FK_TRANSACTION_SENDER        FOREIGN KEY (sender_id)
        REFERENCES [USERS](user_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT FK_TRANSACTION_RECEIVER      FOREIGN KEY (receiver_id)
        REFERENCES [USERS](user_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. BILLS_PROVIDERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE BILLS_PROVIDERS (
    provider_id     INT             NOT NULL IDENTITY(1,1),
    provider_name   VARCHAR(100)    NOT NULL,
    provider_code   VARCHAR(20)     NOT NULL,
    contact_mail    VARCHAR(100),
    is_active       BIT             DEFAULT 1  NOT NULL,

    CONSTRAINT PK_PROVIDER      PRIMARY KEY (provider_id),
    CONSTRAINT UQ_PROVIDER_CODE UNIQUE (provider_code)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. BILLS_SERVICES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE BILLS_SERVICES (
    service_id          INT             NOT NULL IDENTITY(1,1),
    provider_id         INT             NOT NULL,
    service_name        VARCHAR(100)    NOT NULL,
    service_category    VARCHAR(50),
    fee                 DECIMAL(10, 2)  DEFAULT 0.00,
    is_active           BIT             DEFAULT 1 NOT NULL,

    CONSTRAINT PK_SERVICE           PRIMARY KEY (service_id),
    CONSTRAINT FK_SERVICE_PROVIDER  FOREIGN KEY (provider_id)
        REFERENCES BILLS_PROVIDERS(provider_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. BILLS_DETAILS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE BILLS_DETAILS (
    transaction_id      INT             NOT NULL,
    service_id          INT             NOT NULL,
    provider_reference  VARCHAR(100),
    consumer_number     VARCHAR(50),

    CONSTRAINT PK_BILL_DETAILS      PRIMARY KEY (transaction_id),
    CONSTRAINT FK_BILL_TRANSACTION  FOREIGN KEY (transaction_id)
        REFERENCES [TRANSACTIONS](transaction_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_BILL_SERVICE      FOREIGN KEY (service_id)
        REFERENCES BILLS_SERVICES(service_id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. TWO_FA_BACKUP_CODES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE TWO_FA_BACKUP_CODES (
    code_id     INT             NOT NULL IDENTITY(1,1),
    user_id     INT             NOT NULL,
    code_hash   VARCHAR(255)    NOT NULL,
    used        BIT             DEFAULT 0  NOT NULL,
    used_at     DATETIME        DEFAULT NULL,

    CONSTRAINT PK_BACKUP_CODE   PRIMARY KEY (code_id),
    CONSTRAINT FK_BACKUP_USER   FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. REFRESH_TOKENS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE REFRESH_TOKENS (
    token_id    INT             NOT NULL IDENTITY(1,1),
    user_id     INT             NOT NULL,
    token_hash  VARCHAR(255)    NOT NULL,
    expires_at  DATETIME        NOT NULL,
    revoked     BIT             DEFAULT 0  NOT NULL,
    created_at  DATETIME        DEFAULT GETDATE(),

    CONSTRAINT PK_REFRESH_TOKEN PRIMARY KEY (token_id),
    CONSTRAINT FK_REFRESH_USER  FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 13. ACTIVITY_LOG
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE ACTIVITY_LOG (
    log_id      INT             NOT NULL IDENTITY(1,1),
    user_id     INT             NOT NULL,
    action      VARCHAR(100)    NOT NULL,
    description VARCHAR(255),
    ip_address  VARCHAR(45),
    device      VARCHAR(150),
    created_at  DATETIME        DEFAULT GETDATE(),

    CONSTRAINT PK_ACTIVITY_LOG  PRIMARY KEY (log_id),
    CONSTRAINT FK_LOG_USER      FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT CHK_ACTIVITY_ACTION CHECK (action IN (
        'login_success',
        'login_failed',
        'password_changed',
        'profile_updated',
        '2fa_enabled',
        '2fa_disabled',
        'backup_codes_regenerated'
    ))
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 14. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE NOTIFICATIONS (
    notification_id INT             NOT NULL IDENTITY(1,1),
    user_id         INT             NOT NULL,
    title           NVARCHAR(100)   NOT NULL,
    body            NVARCHAR(255)   NOT NULL,
    type            NVARCHAR(50)    NOT NULL,
    is_read         BIT             DEFAULT 0  NOT NULL,
    created_at      DATETIME        DEFAULT GETDATE(),

    CONSTRAINT PK_NOTIFICATION      PRIMARY KEY (notification_id),
    CONSTRAINT FK_NOTIF_USER        FOREIGN KEY (user_id)
        REFERENCES [USERS](user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT CHK_NOTIFICATION_TYPE CHECK (type IN (
        'transaction',
        'kyc',
        'security',
        'bill',
        'atm'
    ))
);