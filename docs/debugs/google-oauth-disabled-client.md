# Google OAuth 로그인 실패 - disabled_client

## 상태: Open

## 발견일: 2026-02-11

## 증상

로그인 화면에서 Google 로그인 버튼 클릭 시 로그인 실패

### 에러 메시지

> 액세스 차단됨: 승인 오류
> The OAuth client was disabled.

- **에러 코드**: 401 `disabled_client`
- **요청 세부정보**: `flowName=GeneralOAuthLite`

## 재현 경로

1. 로그인 페이지 진입
2. Google 로그인 버튼 클릭
3. 401 에러 발생 — `disabled_client`

## 원인 (추정)

Google Cloud Console에서 OAuth 클라이언트가 비활성화(disabled)된 상태

## 해결 방안 (추정)

- Google Cloud Console > API 및 서비스 > 사용자 인증 정보에서 해당 OAuth 클라이언트 활성화
- 또는 새 OAuth 클라이언트 생성 후 클라이언트 ID/Secret 교체
