# Process Cleanup Convention

CLI로 빌드/서버/개발 프로세스를 실행한 후 반드시 종료하는 규칙.

---

## 규칙

1. **빌드 완료 후 확인**: `npm run build` 등 빌드 명령은 자체 종료되지만, 완료 후 프로세스가 남아 있지 않은지 확인
2. **dev 서버 사용 후 종료**: `npm run dev`, `npm run start:dev` 등 상주 프로세스를 띄웠으면 작업 완료 후 반드시 종료
3. **background 실행 금지**: dev 서버를 백그라운드(`&`)로 띄우지 않음 — 종료를 잊기 쉬움
4. **종료 확인**: 프로세스 종료 후 `ps aux | grep` 으로 잔여 프로세스 없는지 확인

## 종료 방법

| 상황 | 방법 |
|------|------|
| Bash tool로 실행한 프로세스 | `kill <PID>` 또는 `pkill -f <pattern>` |
| 포그라운드 프로세스 | Ctrl+C (사용자에게 안내) |
| 좀비 프로세스 정리 | `ps aux \| grep "todo/" \| grep -v grep \| awk '{print $2}' \| xargs kill` |

## 금지 사항

- dev 서버/빌드 프로세스를 띄운 채 방치 금지
- 종료 없이 다른 작업으로 넘어가기 금지
- 동일 포트에 여러 프로세스 중복 실행 금지
