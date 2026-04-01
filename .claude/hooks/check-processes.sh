#!/bin/bash
# PostToolUse hook: Bash 실행 후 todo 프로젝트 관련 잔여 프로세스 감지

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# build/dev/start 관련 명령이 아니면 스킵
if ! echo "$COMMAND" | grep -qE "(npm run|npx |nest |next )"; then
  exit 0
fi

# todo 프로젝트 관련 node 프로세스 체크
LEFTOVER=$(ps aux | grep -E "todo/(server|web)" | grep -v grep | grep -v "check-processes" 2>/dev/null)

if [ -n "$LEFTOVER" ]; then
  COUNT=$(echo "$LEFTOVER" | wc -l | tr -d ' ')
  echo "잔여 프로세스 ${COUNT}개 감지. 정리 필요:" >&2
  echo "$LEFTOVER" | awk '{print "  PID " $2 ": " $11 " " $12 " " $13}' >&2
  echo "" >&2
  echo "정리 명령: ps aux | grep -E 'todo/(server|web)' | grep -v grep | awk '{print \$2}' | xargs kill" >&2
  exit 2
fi

exit 0
