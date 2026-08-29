# 🤝 TubeFetch 프로젝트 작업 인수인계 문서 (HANDOFF.md)

## 📌 1. 프로젝트 개요
- **프로젝트명**: TubeFetch (유튜브 & 소셜 미디어 고화질 비디오/MP3 원클릭 다운로더)
- **GitHub 저장소**: `https://github.com/desperado-kr/tubefetch.git`
- **배포 환경**:
  - **Frontend**: Vercel (`https://tubefetch-rho.vercel.app/`)
  - **Backend**: Render Web Service (`https://tubefetch-0u2r.onrender.com`)
- **주요 기술 스택**:
  - **Frontend**: Vanilla JS (ES Modules), Modern CSS3 (Glassmorphism, Dark/Light Theme), i18n (5개 국어 지원)
  - **Backend**: Node.js, Express, `yt-dlp` 최신 독립 바이너리, FFmpeg 스트림 합성, Server-Sent Events (SSE) 실시간 진행률

---

## 💰 2. 최근 구현된 광고 수익화 시스템 (`public/ads-config.js`)

### A. 1080p / 4K / 320kbps MP3 보상형 광고 게이트 (Ad Gate)
- 사용자가 **1080p Full HD / 4K Ultra HD MP4** 또는 **320kbps MP3** 다운로드 클릭 시 **5초 카운트다운 전면 광고 모달** 노출
- 5초 카운트다운 완료 또는 '바로 다운로드 시작' 클릭 시 자동으로 고화질 합성 및 다운로드 시작
- **720p HD 및 M4A 원본**은 대기 시간 없이 1초 직다운로드(0초)를 유지하여 일반 사용자 이탈 방지 및 서버 트래픽 0원 유지

### B. 3단 반응형 배너 슬롯 및 Adsterra 연동
1. **상단 리더보드 배너 (`#topAdBannerSlot`)**:
   - 사용자 Adsterra 728x90 실제 광고 코드 (`key: a32ecf32dad36eb94fff29440474d54b`) 적용 완료
2. **결과창 인피드 배너 (`#resultAdBannerSlot`)**:
   - 영상 링크 분석 후 다운로드 카드 바로 아래 고주목도 영역에 광고 노출
3. **하단 고정 플로팅 배너 (`#floatingBottomAdSlot`)**:
   - 화면 하단 고정 바 + 닫기(X) 버튼 지원 (Adsterra Social Bar 연동 대기)

### C. 하이브리드 광고 모드 (`activeProvider: 'hybrid'`)
- `bannersProvider: 'adsterra'`: 배너 영역은 Adsterra 광고 송출
- `adGateProvider: 'monetag'`: 1080p 다운로드 게이트는 Monetag 또는 고수익 제휴 스폰서(NordVPN, AI 도구 등) 자동 로테이션
- 코드가 비어있는 슬롯은 자동으로 안전한 고수익 제휴(Affiliate CPA $20~$50) 배너로 Fallback

---

## 💻 3. 다른 컴퓨터에서 프로젝트 실행하는 방법

### 1) 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/desperado-kr/tubefetch.git
cd tubefetch
npm install
```

### 2) 로컬 서버 실행
- **방법 1 (간편 실행)**: 루트 폴더의 `start.bat` 더블클릭 (서버 실행 및 브라우저 자동 오픈)
- **방법 2 (터미널 수동 실행)**:
  ```bash
  npm start
  ```
  브라우저에서 `http://localhost:3000` 접속

### 3) 검증 테스트 실행
```bash
node test_ads.js
node test_i18n_theme.js
```

---

## 📂 4. 주요 파일 구조 및 역할

```
├── public/
│   ├── ads-config.js      # ⭐️ 광고 수익화 통합 설정 (Adsterra, Monetag, AdSense, 제휴)
│   ├── ads.txt            # 도메인 광고 크롤러 인증 파일
│   ├── app.js             # 클라이언트 핵심 로직 (다운로드 트리거, 광고 게이트 제어, SSE)
│   ├── i18n.js            # 5개 국어(한국어, 영어, 일본어, 중국어, 스페인어) 번역 사전
│   ├── index.html         # 웹 메인 UI 구조 및 광고 슬롯 컨테이너
│   ├── style.css          # 글래스모피즘, 다크/라이트 테마, 광고 반응형 스타일
│   └── favicon.svg        # 파비콘
├── server.js              # Node.js 백엔드 서버 (yt-dlp 스트림 파싱 및 실시간 SSE 다운로드)
├── vercel.json            # Vercel 프론트엔드 배포 및 백엔드 리버스 프록시 설정
├── test_ads.js            # 광고 시스템 무결성 자동 검증 테스트
├── test_i18n_theme.js     # 다국어 및 테마 검증 테스트
├── start.bat              # 윈도우 원클릭 실행 스크립트
└── HANDOFF.md             # 본 인수인계 문서
```

---

## 🎯 5. 다음 작업 추천 사항 (Next Steps)

1. **Adsterra Social Bar 추가 발급**:
   - Adsterra 대시보드에서 `Social Bar` 광고 단위를 생성한 후 [`public/ads-config.js`](file:///c:/Users/great/.gemini/antigravity/scratch/youtube-downloader/public/ads-config.js)의 `adsterra.floatingBannerHtml`에 코드 붙여넣기.
2. **Monetag 전면/스마트링크 연동**:
   - Monetag에서 `Interstitial` 또는 `Direct Link` 발급 후 `monetag.modalAdHtml` 또는 `monetag.directLinkUrl`에 입력.
3. **Vercel / Render 배포 동기화**:
   - GitHub `main` 브랜치에 push되면 Vercel과 Render가 자동으로 최신 코드로 재배포됩니다.
