# 🎬 TubeFetch - YouTube Video & Audio Downloader

유튜브 영상 주소만 입력하면 고화질 비디오(1080p, 4K MP4)와 고음질 오디오(320kbps MP3)를 손쉽게 다운로드할 수 있는 모던 웹 애플리케이션입니다.

---

## ✨ 주요 기능

1. **초간편 URL 분석**: 유튜브 주소(`watch?v=...`, `youtu.be/...`, `shorts/...`) 입력 후 원클릭 분석
2. **고화질 비디오 (MP4)**: 4K, 2K, 1080p Full HD, 720p HD 등 FFmpeg 자동 영상/음성 무손실 결합
3. **고음질 음원 추출 (MP3 / M4A)**: 320kbps, 192kbps, 128kbps, 원본 M4A 추출 지원
4. **실시간 다운로드 진행률 (SSE)**: 다운로드 퍼센트, 전송 속도, 남은 시간 실시간 표시
5. **최근 다운로드 기록**: 브라우저 로컬 스토리지 기반 최근 내역 보관
6. **1-클릭 실행**: `start.bat` 더블클릭만으로 서버 구동 및 웹 브라우저 자동 오픈

---

## 🚀 빠른 시작 및 다른 컴퓨터에서 이어서 작업하는 방법

다른 컴퓨터에서 작업을 이어가거나 처음 세팅할 때 아래 순서대로 진행하시면 됩니다.

### 1. 저장소 클론 (새 컴퓨터에서 처음 받을 때)
```bash
git clone https://github.com/desperado-kr/tubefetch.git
cd tubefetch
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 서버 실행
- **방법 A (윈도우 간편 실행 / 권장)**: 루트 폴더의 `start.bat` 더블클릭 (서버 실행 및 브라우저 자동 오픈)
- **방법 B (터미널 수동 실행)**:
  ```bash
  npm start
  ```
  브라우저에서 `http://localhost:3000` 접속

### 4. 기존 작업 컴퓨터에서 최신 코드 동기화할 때 (Git Pull)
작업 전 항상 최신 코드를 내려받습니다:
```bash
git pull origin main
```

### 5. 작업 후 GitHub에 저장 및 자동 배포 (Git Push)
작업 완료 후 GitHub에 올리면 Vercel과 Render가 자동으로 최신 버전으로 재배포됩니다:
```bash
git add .
git commit -m "작업 내용 요약"
git push origin main
```

---

## 📂 기술 스택 & 내부 엔진
- **Backend**: Node.js, Express, Server-Sent Events (SSE)
- **Engine**: `yt-dlp` 최신 독립 실행 바이너리 (`bin/yt-dlp.exe`)
- **Encoder**: `FFmpeg 8.1` (시스템 연동)
- **Frontend**: Vanilla HTML5, Modern CSS3 (Glassmorphism & Dark Mode), ES6+ JavaScript

---

## 💰 광고 수익화 모델 및 연동 안내 (`public/ads-config.js`)

TubeFetch는 다운로더 사이트에 최적화된 **3단 배너 + 1080p/4K 보상형 전면 광고 게이트** 시스템이 기본 탑재되어 있습니다.

### 1. 1080p/4K 초고화질 보상형 광고 게이트 (Ad Gate)
- **1080p / 4K MP4** 및 **320kbps MP3** 다운로드 클릭 시 **5초 카운트다운 전면 광고 모달**이 노출됩니다.
- 카운트다운 완료 또는 스킵 시 서버 인코딩 및 고화질 다운로드가 자동으로 시작됩니다.
- **720p HD 및 M4A 원본**은 대기 시간 없이 즉시 CDN 직다운로드(0초)를 제공하여 사용자 만족도를 유지합니다.

### 2. 광고 배너 슬롯 3종
- **상단 리더보드 배너** (`#topAdBannerSlot`): 데스크톱 728x90 및 모바일 반응형
- **결과 카드 하단 인피드 배너** (`#resultAdBannerSlot`): 다운로드 옵션 하단 최고 주목도 영역
- **하단 고정 플로팅 배너** (`#floatingBottomAdSlot`): 닫기 지원 모던 플로팅 배너

### 3. 광고 플랫폼 교체 및 설정 방법 (`public/ads-config.js`)
`public/ads-config.js` 파일에서 손쉽게 광고 제공자를 변경할 수 있습니다:
- `activeProvider: 'affiliate'`: 고수익 제휴 마케팅 (NordVPN, Surfshark, AI 유틸리티 등 건당 $20~$50 확정 수익, 정지 위험 0%)
- `activeProvider: 'adsense'`: 구글 애드센스 (본인 `publisherId` 및 `slots` 번호만 입력)
- `activeProvider: 'adsterra'` / `'monetag'`: 다운로더 전문 고단가 광고망 스크립트 연동
- `adGate.durationSeconds: 5`: 카운트다운 시간 자유 조절

---

## ⚖️ 저작권 및 이용 안내
- 본 프로그램은 **대한민국 저작권법 제30조(사적이용을 위한 복제)**에 의거한 **개인 학습, 백업, 오프라인 감상 목적**을 위해 제작되었습니다.
- 다운로드한 영상 및 음원을 타인에게 재배포하거나 인터넷/SNS에 재업로드하는 행위는 저작권 침해에 해당하므로 개인 기기 내에서만 이용해 주시기 바랍니다.
