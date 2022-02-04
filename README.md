# 42Event Backend

## 개요
42서울에서 진행되는 행사 정보를 보다 편하게 확인하고 행사 시작 전 알림을 받아보기 위한 `42Event` 서비스의 API입니다.

서비스는 [42Event](https://event.42cadet.kr/)에서 제공됩니다.

프론트엔드 서비스는 [여기](https://bitbucket.org/42meetup/meetup_front/)에서 확인하실 수 있습니다.

## 설치 및 실행 방법
1. 이 저장소를 클론하고 종속성 패키지를 설치합니다.
	```shell
	$ git clone git@bitbucket.org:42meetup/meetup_back.git
	$ cd meetup_back
	$ npm install
	```
2. [아래 내용](#외부-API-서비스-키-발급-받기)을 참고해서 외부 API 서비스 키를 발급 받습니다. 개발용 로컬의 `.env`에 사용되는 서비스 키는 슬랙을 통해 공유합니다.
3. `.env.example` 파일을 `.env`로 복사하여 내용을 수정합니다.
3. `./src/.env.example` 파일을 `./src/.env`로 복사하여 내용을 수정합니다.
4. `./run.sh`를 실행합니다.

서버를 실행하기 위해서는 [Docker](https://www.docker.com/get-started)가 설치되어 있어야 합니다.

최초 실행 시 도커 이미지 다운로드와 이미지 생성에 시간이 다소 소요됩니다.

## 외부 API 서비스 키 발급 받기

### 42 API

1. 42 인트라넷에 로그인 한 다음 [여기](https://profile.intra.42.fr/oauth/applications/new)에서 새로운 앱을 생성합니다.
2. 폼을 작성합니다. `Redirect URI`를 `http://localhost:4242/login/42/return`로 작성합니다.
3. `./src/.env.example` 파일에 각 내용을 복사합니다.
	- `FORTYTWO_CLIENT_ID`: 생성한 앱의 UID
	- `FORTYTWO_CLIENT_SECRET`: 생성한 앱의 SECRET

### Slack API

슬랙 앱을 설치하기 위한 워크스페이스가 필요합니다.

1. [여기](https://api.slack.com/apps)에서 새로운 앱을 생성합니다.
2. `Setting` - `Basic Information` 메뉴에서 `App-Level Tokens`을 생성합니다.
	- Scopes to be accessed by this token: 
`connections:write`, `authorizations:read`
2. `Features` - `OAuth & Permissions` 메뉴에서 `Scopes`를 설정합니다.
	- Bot Token Scopes: `channels:read`, `chat:write`, `groups:read`, `users:read`
3. `Settings` - `Install App` 메뉴로 이동해서 앱을 설치합니다.
4. 설치 후 `./src/.env.example` 파일에 각 내용을 복사합니다.
	- `SLACK_BOT_TOKEN`: `Settings` - `Install App`메뉴의 OAuth Tokens for Your Workspace에 있는 Bot User OAuth Token
	- `SLACK_SIGNING_SECRET`:  `Setting` - `Basic Information` 메뉴의 App Credentials에 있는 Signing Secret

---

## `.env` 파일 설정

- `.env.example`을 참고하여 `.env` 파일을 작성합니다.
- `./src/.env.example`을 참고하여 `./src/.env` 파일을 작성합니다.
	- URL과 관련한 환경 변수는 프로토콜을 유의하여 작성하세요.

## Directory Structure
```
.
├── proxy
├── src
│   ├── config
│   ├── loaders
│   ├── models
│   ├── routes
│   ├── controllers
│   ├── services
│   ├── utils
│   └── logs
└── postman
```

### Directories
- `proxy`: 웹 서버를 위한 프록시 설정을 위한 파일
- `src`: 서버를 위한 소스 코드
	- `config`: 환경 변수 등의 설정 파일
	- `loaders`: express 로더
	- `models`: ORM 모델 클래스 및 재사용 함수
	- `routes`: express 라우터
	- `controllers`: 라우더에서 사용되는 컨트롤러
	- `services`: 컨트롤러에서 사용되는 비즈니스 로직
	- `utils`: 재사용 되는 유틸리티 함수
	- `logs`: 로그 파일
- `postman`: Postman API 문서 관련 파일

### Scripts and Config files for Docker 
- `./run.sh`: docker-compose를 실행하는 쉘 스크립트. 기본적으로 백그라운드로 실행되며, `show` 옵션을 추가해서 로그를 확인하기 위해 포그라운드로 실행할 수 있습니다.
- `./docker-compose.yaml`: `./run.sh`에서 사용하는 docker-compose 설정 파일
- `./src/Dockerfile`: `ft-app` 도커 컨테이너를 위한 Dockerfile
- `./src/docker-entrypoint.sh`: `./src/Dockerfile`에서 사용하는 실행 파일. DB를 먼저 실행하고, node 서버를 실행합니다.

## 데이터베이스 구조
(작성중)

## 사용 스택
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Passport.js](http://www.passportjs.org/packages/passport-42/)

## Git Branches
- `main`: 메인 브랜치
- `dev`: 개발용 브랜치

---

## 문서
- [API 문서 - Postman](https://documenter.getpostman.com/view/16439426/UVJhEb4N)
- [개발 문서 - Confluence](https://42born2code.atlassian.net/wiki/spaces/MTUP/pages/19726340): 해당 문서의 하위 문서를 참고하세요.
