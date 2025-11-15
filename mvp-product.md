ToDo 리스트 개발
- 섹션별로 할 일 나열
- MVP (Workspace, section -> tasks)
- 섹션별 필터링 가능 항목: completed, tag, assignee, 
- 정렬: 이름 순 (기본), 완료 순

## 데이터 스키마 (Supabase PostgreSQL)

### 백엔드 스키마
- workspace { id: uuid, title: text, description: text, created_at: timestamptz, is_deleted: boolean }
- section { id: uuid, workspace_id: uuid (FK), title: text, description: text, created_at: timestamptz, is_deleted: boolean }
- task { id: uuid, section_id: uuid (FK), title: text, description: text, tags: text[], assignee: uuid (FK to user), status: enum('open', 'progress', 'completed'), priority: enum('low', 'medium', 'high', 'urgent'), completed_at: timestamptz, start_at: timestamptz, expired_at: timestamptz, created_at: timestamptz, updated_at: timestamptz, is_deleted: boolean }
- user { id: uuid, email: text, nickname: text, created_at: timestamptz, deleted_at: timestamptz }
- event { id: uuid, event_type: text, user_id: uuid (FK), workspace_id: uuid (FK), task_id: uuid (FK), created_at: timestamptz }
- workspace_members { id: uuid, workspace_id: uuid (FK), user_id: uuid (FK), role: enum('owner', 'member'), created_at: timestamptz }

### 프론트엔드 타입
- workspace { id, title, description, createdAt, isDeleted, sections?: Section[] }
- section { id, workspaceId, title, description, createdAt, isDeleted, tasks?: Task[] }
- task { id, sectionId, title, description, tags, assignee, status, priority, completedAt, startAt, expiredAt, createdAt, updatedAt, isDeleted }
- user { id, email, nickname, createdAt, deletedAt }
- event { id, eventType, userId, workspaceId, taskId, createdAt }

## UI 구조

### 좌측 Navigation Bar (사이드바)
- **검색바** (상단): 클릭 시 화면 중앙에 검색 모달 오픈
- **유저 정보**
- **네비게이션 메뉴**:
  - Today Task (today task가 있으면 우측 끝에 초록색 불빛 표시)
  - 워크스페이스 > 섹션 (계층 구조)
  - Completed
  - Activities
- **설정창**
- **크기 조정**: PC ↔ 테블릿 전환 시 사이드바 크기 조정 가능

### 우측 Main 화면
- **상단**: 새로고침 버튼 (우측 상단)
- **필터 바**: 워크스페이스/섹션 선택 시 status, tag, assignee 별 분류 바 표시 (Completed 페이지는 status 제외)
- **콘텐츠 영역**: 
  - Today Task: startAt ≤ today ≤ expiredAt + status ≠ completed
  - 워크스페이스: 하위 섹션과 tasks 표시
  - 섹션: 해당 섹션의 모든 tasks
  - Completed: status=completed인 tasks만
  - Activities: 이벤트 목록 (필터링 가능)
- **Infinite Scroll**: task 목록이 많을 때 적용

### Task 상세
- **Task 카드 인라인 수정**: assignee, status → 드롭다운으로 즉시 수정 가능
- **Task 모달**: Task 카드 클릭 시 전체 상세 수정 모달 오픈
- **드래그앤드롭**: 섹션 간 task 이동만 지원

### Workspace/Section 수정
- **Workspace 수정**: 메인 화면 상단 워크스페이스 제목 옆 Edit 버튼 → 수정 모달
- **Section 수정**: 섹션 제목 옆 Edit 버튼 → 수정 모달
- **수정 권한**: workspace owner/member 권한에 따른 제한

### 검색 기능 (Spotlight 스타일)
- **트리거**: 좌측 네비게이션 상단 검색바 클릭 또는 URL 쿼리 파라미터
- **모달 오버레이**: 현재 화면 위에 전체 화면 모달로 검색창 표시, 자동 포커스
- **검색 대상**: workspace.title, section.title, task.title, task.description
- **결과**: 엔터/검색버튼 시 검색창 하단에 결과 표시 (스크롤 가능)
- **네비게이션**: 선택 시 해당 경로로 이동 + 검색 모달 닫기 (workspace → section → task 모달)
- **모달 닫기**: ESC 키 또는 배경 클릭 시 검색 모달 닫기

## 테마
- **디자인**: macOS 스타일 (둥글둥글하고 깔끔)
- **모드**: Day/Night 모드
- **컬러**: 너무 밝은 하얀색 자제

## 기능 및 동작

### 인증
- **Google OAuth**: 구글 계정을 통한 로그인/회원가입만 지원
- **워크스페이스 멤버십**: workspace_members 테이블로 협업 관리
- **Assignee 선택**: 같은 워크스페이스 멤버만 드롭다운에서 선택 가능

### 데이터 관리
- **캐싱**: useQuery 또는 useSWR 등으로 서버 데이터 캐싱
- **실시간 업데이트**: 본인 변경사항만 즉시 반영, 타인 변경사항은 새로고침 버튼으로 수동 갱신
- **Supabase 클라우드**: PostgreSQL 데이터베이스
- **Infinite Scroll**: 대량 task 데이터 페이징 처리

### Task 관리
- **Status 정의**: 
  - `open`: 시작 전 상태 (기본값)
  - `progress`: 진행 중 상태
  - `completed`: 완료 상태
- **Reopen 기능**: Completed에서 되돌리면 status=open, completedAt은 유지 → UI에서 "reopen" 표시
- **기본값**: 새 task 생성 시 status=open, startAt/expiredAt = null
- **Today Task 조건**: startAt ≤ today ≤ expiredAt AND status ≠ completed
- **우선순위**: priority 필드 (low, medium, high, urgent)
- **이벤트 로깅**: 모든 사용자 동작을 event 테이블에 기록
- **소프트 삭제**: is_deleted 플래그로 관리

### URL 라우팅
- `/` - Today Task
- `/workspace/:workspaceId` - 워크스페이스 보기
- `/workspace/:workspaceId/section/:sectionId` - 섹션 보기  
- `/workspace/:workspaceId/section/:sectionId/task/:taskId` - Task 모달
- `/completed` - 완료된 작업들
- `/activities` - 활동 내역

### 검색 URL 처리
- **쿼리 파라미터**: `?search=검색어` 형태로 URL에 검색어 포함 시 검색 모달 자동 오픈
- **모달 상태**: 검색 모달은 URL 경로 변경 없이 오버레이로 동작
- **예시**: `/workspace/123?search=회의` → 워크스페이스 123 화면 + 검색 모달('회의' 검색)