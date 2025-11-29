# Jira Lite - AI 기반 이슈 트래킹 시스템

Litmers Vibe Coding Contest 2025 출품작

AI 기능이 통합된 경량 이슈 트래킹 웹 애플리케이션입니다.

## 🚀 주요 기능

### 인증 (FR-001~007) ✅
- 이메일/비밀번호 회원가입 및 로그인
- Google OAuth 로그인
- 비밀번호 재설정
- 프로필 관리 (이름, 프로필 이미지)
- 비밀번호 변경 (OAuth 사용자 제외)
- 계정 삭제 (Soft Delete)

### 팀 관리 (FR-010~019) ✅
- 팀 생성/수정/삭제
- 멤버 초대 (이메일 기반)
- 역할 관리 (OWNER/ADMIN/MEMBER)
- 역할 변경 및 소유권 이전
- 멤버 강제 퇴장/탈퇴
- 팀 활동 로그 (페이지네이션)

### 프로젝트 관리 (FR-020~027) ✅
- 프로젝트 CRUD
- 즐겨찾기 (사용자별)
- 아카이브/복원
- 팀당 최대 15개 제한

### 이슈 관리 (FR-030~039) ✅
- 이슈 CRUD
- 칸반 보드 (Drag & Drop)
- 상태/우선순위/라벨 관리
- 담당자 지정 (팀 멤버 중)
- 서브태스크 (체크리스트)
- 변경 히스토리
- 프로젝트당 최대 200개 제한

### AI 기능 (FR-040~045) ✅
- 이슈 설명 요약 (Gemini AI)
- 해결 전략 제안
- 자동 라벨 추천
- 중복 이슈 탐지
- 댓글 요약 (5개 이상)
- Rate Limiting (분당 10회)
- AI 결과 캐싱 및 무효화

### 칸반 보드 (FR-050~054) ✅
- 상태별 컬럼 표시
- Drag & Drop 이동
- 컬럼 내 순서 변경
- WIP Limit 표시 및 경고
- 기본 상태: Backlog / In Progress / Done

### 댓글 (FR-060~063) ✅
- 댓글 작성/수정/삭제
- 작성일순 정렬
- 권한 기반 삭제

### 대시보드 (FR-080~082) ✅
- 개인 대시보드 (담당 이슈, 마감 임박)
- 프로젝트 대시보드 (차트, 통계)
- 상태별/우선순위별 이슈 현황

### 알림 (FR-090~091) ✅
- 인앱 알림
- 읽음/미읽음 처리
- 전체 읽음 처리

### 권한/보안 (FR-070~071) ✅
- Supabase RLS 기반 접근 제어
- 팀 멤버십 검증
- Soft Delete 전체 적용

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Drag & Drop**: @hello-pangea/dnd
- **Charts**: Recharts
- **Form**: React Hook Form + Zod
- **Deploy**: Vercel

## 📦 로컬 설치 및 실행

### 1. 의존성 설치

```bash
cd jira-lite
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Authentication > Providers > Google OAuth 설정
4. URL Configuration 설정

### 4. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. OAuth consent screen 설정
3. Credentials > OAuth client ID 생성
4. Authorized redirect URI에 Supabase callback URL 추가
5. Client ID/Secret을 Supabase에 입력

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/            # 인증 페이지 (로그인, 회원가입)
│   ├── (dashboard)/       # 대시보드 페이지
│   ├── api/ai/            # AI API Routes
│   └── auth/              # Auth 콜백
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── layout/            # Header, Sidebar
│   ├── teams/             # 팀 관련 컴포넌트
│   ├── projects/          # 프로젝트/칸반 컴포넌트
│   ├── issues/            # 이슈 상세 컴포넌트
│   └── notifications/     # 알림 컴포넌트
├── lib/
│   ├── supabase/          # Supabase 클라이언트
│   ├── ai/                # Gemini AI 유틸리티
│   ├── constants.ts       # 상수 (제한값)
│   └── validations.ts     # Zod 스키마
└── types/                 # TypeScript 타입
```

## 🔐 테스트 방법

1. 회원가입으로 새 계정 생성
2. 또는 Google 계정으로 로그인
3. 팀 생성 → 프로젝트 생성 → 이슈 생성
4. 칸반 보드에서 Drag & Drop 테스트
5. AI 기능 테스트 (이슈 설명 10자 이상 필요)

## 📝 데이터 제한

| 항목 | 제한 |
|------|------|
| 팀당 프로젝트 | 최대 15개 |
| 프로젝트당 이슈 | 최대 200개 |
| 이슈당 서브태스크 | 최대 20개 |
| 프로젝트당 라벨 | 최대 20개 |
| 이슈당 라벨 | 최대 5개 |
| AI 요청 | 분당 10회 |

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 import
3. 환경 변수 설정
4. 배포

## 📄 라이선스

MIT License
