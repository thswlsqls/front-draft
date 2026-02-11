-- ============================================================
-- OAuth Providers 초기 데이터 세팅
-- 대상 스키마: auth
-- 대상 테이블: auth.providers
-- ============================================================

-- Google OAuth Provider
INSERT INTO auth.providers (id, name, display_name, client_id, client_secret, is_enabled, is_deleted, created_by)
VALUES (
    809332819488782831,
    'google',
    'Google',
    '${GOOGLE_CLIENT_ID}',
    '${GOOGLE_CLIENT_SECRET}',
    1,
    0,
    NULL
);

-- Kakao OAuth Provider (비활성 — 추후 확장 예정)
INSERT INTO auth.providers (id, name, display_name, client_id, client_secret, is_enabled, is_deleted, created_by)
VALUES (
    809332938040786115,
    'kakao',
    'Kakao',
    NULL,
    NULL,
    0,
    0,
    NULL
);

-- Naver OAuth Provider (비활성 — 추후 확장 예정)
INSERT INTO auth.providers (id, name, display_name, client_id, client_secret, is_enabled, is_deleted, created_by)
VALUES (
    809332959163298523,
    'naver',
    'Naver',
    NULL,
    NULL,
    0,
    0,
    NULL
);
