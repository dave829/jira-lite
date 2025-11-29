# Jira Lite - AI 기반 이슈 트래킹 시스템

AI 기능이 통합된 경량 이슈 트래킹 웹 애플리케이션입니다.

## 🚀 주요 기능

### 인증
- 이메일/비밀번호 회원가입 및 로그인
- Google OAuth 로그인
- 비밀번호 재설정 (이메일 발송)
- 프로필 관리

### 팀 관리
- 팀 생성/수정/삭제
- 멤버 초대 (이메일)
- 역할 관리 (OWNER/ADMIN/MEMBER)
- 팀 활동 로그

### 프로젝트 관리
- 프로젝트 CRUD
- 즐겨찾기
- 아카이브
- 커스텀 상태/라벨

### 이슈 관리
- 이슈 CRUD
- 칸반 보드 (Drag & Drop)
- 상태/우선순위/라벨
- 서브태스크
- 댓글
- 변경 이력

### AI 기능
- 이슈 설명 요약
- 해결 전략 제안
- 자동 라벨 추천
- 중복 이슈 탐지
- 댓글 요약
- Rate Limiting (분당 10회)

### 대시보드
- 개인 대시보드
- 프로젝트 대시보드 (차트)
- 팀 통계

### 알림
- 인앱 알림
- 읽음 처리

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI API (gpt-4o-mini)
- **Drag & Drop**: @hello-pangea/dnd
- **Charts**: Recharts
- **Deploy**: Vercel

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/schema.sql` 파일의 SQL을 SQL Editor에서 실행
3. Authentication > Providers에서 Google OAuth 설정
4. URL Configuration에서 Site URL과 Redirect URLs 설정

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   ├── api/               # API Routes
│   └── auth/              # Auth 콜백
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   ├── teams/             # 팀 관련 컴포넌트
│   ├── projects/          # 프로젝트 관련 컴포넌트
│   ├── issues/            # 이슈 관련 컴포넌트
│   └── notifications/     # 알림 컴포넌트
├── lib/
│   ├── supabase/          # Supabase 클라이언트
│   ├── ai/                # AI 유틸리티
│   ├── constants.ts       # 상수
│   ├── validations.ts     # Zod 스키마
│   └── utils.ts           # 유틸리티
├── types/                 # TypeScript 타입
└── hooks/                 # Custom hooks
```

## 🔐 테스트 계정

배포된 서비스에서 테스트하려면:

1. 회원가입으로 새 계정 생성
2. 또는 Google 계정으로 로그인

## 📝 데이터 제한

| 항목 | 제한 |
|------|------|
| 팀당 프로젝트 | 최대 15개 |
| 프로젝트당 이슈 | 최대 200개 |
| 이슈당 서브태스크 | 최대 20개 |
| 프로젝트당 라벨 | 최대 20개 |
| 이슈당 라벨 | 최대 5개 |
| 커스텀 상태 | 최대 5개 |
| AI 요청 | 분당 10회 |

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 import
3. 환경 변수 설정
4. 배포

## 📄 라이선스

MIT License
