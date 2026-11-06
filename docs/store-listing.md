# Chrome 웹스토어 등록 정보 (초안)

## 이름 (최대 75자)
한글 소스 클리퍼 for NotebookLM

> "NotebookLM"을 이름 앞에 두지 않고 "for NotebookLM"으로 뒤에 붙임 (구글 상표 정책).

## 요약 (최대 132자)
네이버 블로그·카페·포스트, 브런치, 티스토리, velog 글을 클릭 한 번으로 NotebookLM 노트북 소스에 추가합니다.

## 상세 설명
NotebookLM에 URL을 붙여 넣어도 네이버 블로그·카페처럼 본문이 iframe 안에 있는 한국 사이트는 "콘텐츠를 가져올 수 없음"이 뜨는 경우가 많습니다. 이 확장은 보고 있는 글의 본문을 그대로 추출해 NotebookLM에 텍스트 소스로 넣어 줍니다.

주요 기능
- 지원 사이트: 네이버 블로그·카페·포스트, 브런치, 티스토리, velog
- 제목·작성자·작성일·출처 URL을 소스 맨 위에 자동 기록
- 노트북 선택 또는 새 노트북 만들기
- 페이지 우클릭 → "이 글을 NotebookLM에 추가"로 마지막 노트북에 바로 추가
- 다크 모드 지원

개인정보
- 서버 없음. 추출한 글은 사용자의 NotebookLM 계정으로만 전송됩니다.
- 저장하는 정보는 마지막 노트북 ID와 추가 횟수뿐입니다.

유의사항
- NotebookLM 공개 API가 없어 NotebookLM 웹의 내부 요청 방식을 사용합니다. 구글 측 변경으로 일시적으로 동작하지 않을 수 있습니다.
- 글의 저작권은 작성자에게 있습니다. 개인 학습·연구 용도로 사용해 주세요.
- 이 확장은 Google 및 NotebookLM과 관련이 없습니다.

## 카테고리
생산성 (Productivity)

## 언어
한국어 (기본), English

## 개인정보처리방침 URL
https://github.com/AIDev-summer/naver-to-notebooklm/blob/main/PRIVACY.md
(GitHub Pages로 바꾸면 더 보기 좋음)

## 개발자 콘솔 "개인정보 보호" 탭 답변

단일 목적 설명
: 한국 블로그·커뮤니티 글의 본문을 추출해 사용자의 NotebookLM 노트북에 소스로 추가합니다.

권한 사용 이유
- activeTab, scripting: 사용자가 버튼을 눌렀을 때만 현재 탭에서 본문을 추출합니다.
- storage: 마지막으로 선택한 노트북과 추가 횟수를 저장합니다.
- contextMenus: 우클릭 메뉴 "이 글을 NotebookLM에 추가"를 제공합니다.
- host_permissions (notebooklm.google.com, accounts.google.com): 노트북 목록 조회와 소스 추가 요청을 보냅니다.
- host_permissions (지원 사이트): 우클릭 메뉴 표시와 iframe 안의 본문 추출에 필요합니다.

원격 코드 사용: 아니요
데이터 사용: 웹사이트 콘텐츠(글 본문)를 사용자의 NotebookLM으로 전송. 개발자에게 전송되는 데이터 없음. 판매·광고 목적 사용 없음.

## 스크린샷 (1280×800)
docs/screenshots/ 에 생성. 최소 1장, 권장 3~5장.
1. 네이버 블로그에서 팝업 열고 추가 완료 화면
2. 노트북 선택·새 노트북 만들기
3. 우클릭 메뉴

## 프로모션 타일 (선택)
작은 타일 440×280, 마키 1400×560. docs/screenshots/ 참고.

## 등록 절차
1. https://chrome.google.com/webstore/devconsole 에서 개발자 계정 등록 ($5, 1회).
2. 저장소 폴더를 ZIP으로 압축 (`.git`, `docs/` 제외).
3. "새 항목" → ZIP 업로드 → 스토어 등록정보·개인정보 탭 작성 → 심사 제출.
4. 심사는 보통 1~3일, 호스트 권한이 많으면 길어질 수 있음.
