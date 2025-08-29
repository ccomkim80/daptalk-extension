# DapTalk iOS App & iMessage Extension

완전한 DapTalk iOS 애플리케이션과 iMessage Extension 프로젝트입니다.

## 프로젝트 구조

### React Native/Expo 앱
- `App.js` - 메인 DapTalk 앱 (React Native/Expo)
- `package.json` - 의존성 및 설정
- `app.json` - Expo 설정

### iMessage Extension (Xcode 프로젝트)
- `DapTalkMessagesExtension/` - 네이티브 iOS iMessage Extension
- Swift로 구현된 Messages Framework 기반 확장

## 기능

### DapTalk 메인 앱
- ✅ Google Gemini AI 채팅
- ✅ 이미지 OCR 및 분석
- ✅ General & Dating 모드
- ✅ 사용자 성별 설정
- ✅ 프리미엄 기능

### iMessage Extension
- ✅ Messages 앱 내 AI 응답 생성
- ✅ General & Dating 모드
- ✅ 4가지 응답 선택지
- ✅ 원터치 메시지 전송
- ✅ 대화 자동 분석

## 개발 환경

### React Native 앱
- Node.js 22.18.0
- Expo CLI
- React Native 0.79.5

### iMessage Extension
- Xcode 15.0+
- iOS 17.0+
- Swift 5.0
- Messages Framework

## 설치 및 실행

### React Native 앱
```bash
npm install
npx expo start
```

### iMessage Extension (macOS 필요)
1. Xcode에서 `DapTalkMessagesExtension.xcodeproj` 열기
2. Bundle Identifier 및 Team 설정
3. 실제 iOS 기기에 빌드 및 설치
4. Messages 앱에서 확장 사용

## 클라우드 개발 (Windows → macOS)

Windows 사용자는 다음 클라우드 서비스를 통해 macOS Xcode에 접근 가능:

### 추천 서비스
1. **MacinCloud** (가장 안정적)
2. **MacStadium**
3. **AWS EC2 Mac instances**

## 라이센스

MIT License
