---
alwaysApply: true
---

## Vibe Coding Quality Protocol

비사소한 구현 시 반드시 따라야 하는 품질 프로토콜.

### Active Modules Gate (프레임워크/기술 선택 전 필수)
프로젝트 생성, 프레임워크 선택, 새 기술 도입 시 **코딩 전** 반드시 수행:
1. CLAUDE.md `Active Modules` 섹션을 읽고 `[x]`/`[ ]` 상태 확인
2. 사용하려는 프레임워크/기술이 `[ ]` (비활성)이면 **절대 사용 금지**
3. 계획(plan)이 Active Modules와 충돌하면 → 사용자에게 충돌 사실을 명시하고 확인 요청
4. 사용자가 활성화를 승인한 경우 → CLAUDE.md에서 `[ ]`를 `[x]`로 변경 **후** 진행
- 계획 승인 ≠ Active Modules 자동 오버라이드 — 별도 확인 필수
- 이 게이트는 Structured Workflow보다 **먼저** 실행

### Structured Workflow (코딩 전 필수 프로세스)
비사소한 구현 시 코드 착수 전 반드시 순서대로 수행:
1. **범위 판단**: 수정 범위가 크면(3+ 파일) → 스텝 분해 후 임시 계획 파일 작성
2. **분석**: 외부 유사 앱 또는 과학적 근거 기반 접근 방식 분석 (근거 없는 판단 금지)
3. **디자인**: UI 변경 시 앱 전체 디자인 + UI 컨벤션 일관성 확인 (필요 시만)
4. **코드 영향도**: 수정 대상 파일, 영향 범위, 수정 방향 제시
5. **사용자 승인** 후 착수 — 승인 전 코딩 절대 금지
6. **타입 선행 정의**: 입출력 타입을 컨벤션에 맞게 먼저 정의 후 구현
- 임시 계획 파일 사용 시: 각 스텝 완료마다 체크, 전체 완료 시 삭제
- 사소한 변경(오타 수정, 1줄 변경)은 예외
- 상세 프로세스: implementation-guard 스킬 참조

### Document-Based Tracking (대규모 작업 필수)
대규모 작업(5+ 파일 수정/생성) 시 문서 기반 추적을 반드시 수행:
1. **로드맵 생성**: `docs/` 아래 로드맵 문서 생성 필수 (예: `docs/ROADMAP.md`)
2. **Phase/Step 체크박스**: 각 Phase/Step에 진행 상태 체크 (`[x]`/`[ ]`) 포함
3. **착수 시 업데이트**: Phase/Step 착수 시 `[ ]` → `[x]`로 문서 업데이트
4. **완료 시 업데이트**: Phase 완료마다 결과/변경사항 반영
5. **문서 보관**: 전체 완료 후에도 문서를 삭제하지 않고 보관 (이력 추적용)
- 로드맵 문서에는 Phase별 파일 목록, 의존 관계, 검증 기준 포함
- 세션이 중단되어도 문서를 통해 진행 상태 복원 가능

### Post-Implementation Verification
- 구현 후 반드시: 컨벤션/일관성/상태처리/i18n/성능/다크모드 자체 검증 (verify 스킬)

### Completeness Guarantee
- "전체 적용" 요청 시 Grep/Glob으로 대상을 빠짐없이 스캔한 후 작업
- 작업 전후에 대상 파일 수를 비교 검증

### UI/UX Best Practice
- 기존 선례 없이 UI 패턴(모달/시트/페이지) 임의 선택 절대 금지
- 업계 표준 UX를 기본 제공 (로딩/에러/빈 상태, 삭제 확인, 일관된 네비게이션)
- 어색하거나 불편한 인터랙션이 예상되면 더 나은 대안을 제안

### Barrel Export 금지
- `index.ts`로 re-export하는 barrel 파일 생성 절대 금지
- 항상 소스 파일에서 직접 import: `import { Button } from './Button'` (O) / `import { Button } from '.'` (X)
- 기존 barrel export 파일이 있더라도 새로 만들지 않고, 직접 import로 작성

### Zero Tolerance
- NEVER: Active Modules `[ ]` 비활성 프레임워크/기술을 사용하여 프로젝트 생성 또는 구현
- NEVER: 계획(plan)과 Active Modules 충돌 시 사용자 확인 없이 진행
- NEVER: 외부 근거(유사 앱/과학적 근거) 없이 구현 방향 결정
- NEVER: 사용자 승인 전 코딩 착수
- NEVER: 대규모 변경을 스텝 분해 없이 한꺼번에 진행
- NEVER: 입출력 타입 정의 없이 코딩 시작
- NEVER: 기존 선례를 확인하지 않고 UI 패턴 임의 선택
- NEVER: loading/error/empty 상태 처리 생략
- NEVER: 핵심 기능에 TODO 주석 남기기
- NEVER: i18n 키 대신 하드코딩된 문자열 사용
- NEVER: 구현 후 자체 검증 생략
- NEVER: "전체 적용" 요청에서 파일 누락
- NEVER: barrel export (index.ts re-export) 파일 생성
- NEVER: 5+ 파일 대규모 작업을 docs/ 로드맵 문서 없이 진행

### Playwright 사용 금지
- Playwright MCP 도구를 절대 사용하지 마세요 (browser_navigate, browser_click, browser_snapshot 등 모두 포함)
- 브라우저 자동화가 필요한 경우 사용자에게 직접 확인하도록 안내하세요
