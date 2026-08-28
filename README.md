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

## 🚀 실행 방법

### 방법 1. 간편 실행 (권장)
`start.bat` 파일을 더블클릭하면 서버가 실행되고 브라우저(`http://localhost:3000`)가 자동으로 열립니다.

### 방법 2. 터미널 수동 실행
```bash
npm start
# 브라우저에서 http://localhost:3000 접속
```

---

## 📂 기술 스택 & 내부 엔진
- **Backend**: Node.js, Express, Server-Sent Events (SSE)
- **Engine**: `yt-dlp` 최신 독립 실행 바이너리 (`bin/yt-dlp.exe`)
- **Encoder**: `FFmpeg 8.1` (시스템 연동)
- **Frontend**: Vanilla HTML5, Modern CSS3 (Glassmorphism & Dark Mode), ES6+ JavaScript

---

## ⚖️ 저작권 및 이용 안내
- 본 프로그램은 **대한민국 저작권법 제30조(사적이용을 위한 복제)**에 의거한 **개인 학습, 백업, 오프라인 감상 목적**을 위해 제작되었습니다.
- 다운로드한 영상 및 음원을 타인에게 재배포하거나 인터넷/SNS에 재업로드하는 행위는 저작권 침해에 해당하므로 개인 기기 내에서만 이용해 주시기 바랍니다.
