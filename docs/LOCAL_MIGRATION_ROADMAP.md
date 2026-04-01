# Local DB Migration + Export/Import + Undo/Redo Roadmap

## Phase 1: SQLite Migration (Prisma Schema)
- [x] 1.1 Prisma datasource 변경 (postgresql → sqlite)
- [x] 1.2 UUID 생성 방식 변경 (gen_random_uuid → uuid())
- [x] 1.3 Array 필드 → Json (5개 필드)
- [x] 1.4 Timestamp 어노테이션 제거
- [x] 1.5 기타 타입 정리 (@db.Decimal, @db.VarChar, @db.Text)
- [x] 1.6 change_history 모델 추가
- [x] 1.7 data 디렉토리 생성 + .gitignore
- [x] 1.8 서비스 코드 Array→Json 타입 캐스팅
- [x] 1.9 SQLite 비호환 쿼리 수정 (mode: 'insensitive')
- [x] 1.10 마이그레이션 실행 + 빌드 검증

## Phase 2: Auth Simplification
- [x] 2.1 Server — JWT Strategy 교체
- [x] 2.2 Server — Auth Controller 추가
- [x] 2.3 Server — Auth Module 수정
- [x] 2.4 Server — Google OAuth 시크릿 변경
- [x] 2.5 Server — 환경 변수 정리
- [x] 2.6 Web — API Client 교체
- [x] 2.7 Web — Auth Provider 교체
- [x] 2.8 Web — Middleware 교체
- [x] 2.9 Web — Supabase 파일 삭제
- [x] 2.10 Web — 패키지 정리
- [x] 2.11 Server — 패키지 정리
- [x] 2.12 빌드 검증

## Phase 3: Local Storage + Realtime Polling
- [x] 3.1 Local Storage Service
- [x] 3.2 Assets Controller — 파일 서빙 엔드포인트
- [x] 3.3 Assets Module 업데이트
- [x] 3.4 Assets Service — thumbnailUrl 매핑 수정
- [x] 3.5 Realtime → Polling 교체
- [x] 3.6 빌드 검증

## Phase 4: Export/Import
- [x] 4.1 Backup Module 생성
- [x] 4.2 Backup Controller
- [x] 4.3 Backup Service — Export
- [x] 4.4 Backup Service — Import
- [x] 4.5 Web — Backup Service + Hook
- [x] 4.6 Settings UI — Data 섹션
- [x] 4.7 패키지 추가
- [x] 4.8 빌드 검증

## Phase 5: Undo/Redo
- [x] 5.1 Undo Module 생성
- [x] 5.2 Undo Service
- [x] 5.3 Undo Controller
- [x] 5.4 기존 서비스에 recordChange 통합
- [x] 5.5 Web — Undo Hook + 키보드 단축키
- [x] 5.6 빌드 검증
