# 한글 소스 to NotebookLM

네이버 블로그·카페·포스트, 브런치, 티스토리, velog 글을 한 번의 클릭으로 NotebookLM 노트북 소스로 추가하는 크롬 확장 프로그램입니다.

NotebookLM은 네이버 블로그·카페처럼 iframe 안에 본문이 있는 한국 사이트를 URL로 가져오지 못하는 경우가 많습니다. 이 확장은 페이지에서 본문을 직접 추출해 "복사한 텍스트" 소스로 넣어 줍니다.

## 지원 사이트

- 네이버 블로그 (`blog.naver.com`, `m.blog.naver.com`)
- 네이버 카페 (`cafe.naver.com`, `m.cafe.naver.com`)
- 네이버 포스트 (`post.naver.com`)
- 브런치 (`brunch.co.kr`)
- 티스토리 (`*.tistory.com`)
- velog (`velog.io`)

## 설치 (개발자 모드)

1. 이 저장소를 내려받거나 clone 합니다.
2. 크롬에서 `chrome://extensions` 를 엽니다.
3. 오른쪽 위 **개발자 모드**를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다** 를 누르고 이 폴더를 선택합니다.
5. [NotebookLM](https://notebooklm.google.com)에 로그인해 둡니다.

## 사용법

1. 지원 사이트의 글 페이지를 엽니다.
2. 툴바의 확장 아이콘을 누르면 제목·작성자·글자 수가 표시됩니다.
3. 노트북을 고르거나 새 노트북을 만든 뒤 **소스로 추가**를 누릅니다.
4. 한 번 노트북을 고른 뒤에는 페이지에서 우클릭 → **이 글을 NotebookLM에 추가**로 바로 넣을 수 있습니다.

## 동작 방식

- `content/extract.js` 가 활성 탭의 모든 프레임에서 사이트별 선택자로 본문·제목·작성자·날짜를 추출합니다.
- `lib/nlm-api.js` 가 로그인된 크롬 세션의 쿠키로 NotebookLM 내부 RPC를 호출해 노트북 목록 조회·생성·소스 추가를 합니다. 별도 서버나 API 키는 없습니다.
- 소스 텍스트 맨 위에 제목·작성자·작성일·출처 URL을 붙여 NotebookLM 안에서 출처를 확인할 수 있게 합니다.

## 개인정보

이 확장은 어떤 데이터도 외부 서버로 보내지 않습니다. 추출한 본문은 사용자의 NotebookLM 계정으로만 전송됩니다. 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 보세요.

## 한계

- NotebookLM 공개 API가 없어 내부 RPC를 사용합니다. Google 측 변경으로 동작이 멈출 수 있습니다.
- 이미지·표는 텍스트로만 들어갑니다.
- 비공개·유료 콘텐츠는 사용자가 볼 수 있는 경우에만 추출됩니다. 저작권이 있는 글은 개인 학습 용도로만 사용하세요.

## 참고

NotebookLM RPC 호출 방식은 MIT 라이선스의 [AndyShaman/add_to_NotebookLM](https://github.com/AndyShaman/add_to_NotebookLM) 을 참고했습니다.

## 라이선스

MIT
