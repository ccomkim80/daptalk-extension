# DapTalk iMessage Extension 

daptalk iOS 앱을 기반으로 한 iMessage Extension 프로젝트입니다.

## 🎯 프로젝트 개요

Windows 환경에서 개발된 React Native/Expo 기반의 daptalk 앱을 macOS에서 iMessage Extension으로 포팅한 프로젝트입니다.

### 주요 기능
- **General Mode**: 일반 대화용 AI 응답 (정중한, 캐주얼, 공감적, 직접적)
- **Dating Mode**: 연애/데이팅용 AI 응답 (재미있는, 진솔한, 재치있는, 배려 깊은)
- **Google Gemini AI 통합**: 기존 daptalk 앱과 동일한 AI 엔진 사용
- **실시간 응답**: Messages 앱에서 직접 대화 분석 및 응답 생성
- **4가지 선택지**: 각 상황에 맞는 4개의 다른 스타일 응답 제공

## 📱 프로젝트 구조

```
├── App.js                              # 기존 React Native 앱
├── package.json                        # React Native 의존성
├── DapTalkMessagesExtension/           # iMessage Extension 프로젝트
│   ├── DapTalkMessagesExtension.xcodeproj
│   ├── DapTalkMessagesExtension/       # Extension 코드
│   │   ├── MessagesViewController.swift
│   │   ├── MainInterface.storyboard
│   │   └── Info.plist
│   ├── DapTalkHost/                    # 호스트 앱
│   ├── README.md                       # 상세 설치 가이드
│   └── setup.sh                       # 자동 설정 스크립트
└── assets/                             # 앱 리소스
```

## 🚀 macOS에서 빌드하기

### 1. 필요사항
- macOS 14.0+ (Sonoma)
- Xcode 15.0+
- 활성 Apple Developer 계정

### 2. 설치 방법
```bash
# 1. 저장소 클론
git clone https://github.com/ccomkim80/daptalk-extension.git
cd daptalk-extension

# 2. iMessage Extension 디렉토리로 이동
cd DapTalkMessagesExtension

# 3. 자동 설정 실행 (옵션)
chmod +x setup.sh
./setup.sh

# 4. Xcode에서 프로젝트 열기
open DapTalkMessagesExtension.xcodeproj
```

### 3. 설정 필요사항
- Bundle Identifier 변경: `com.yourteam.daptalk.*`
- Development Team 설정
- Google AI API 키 입력 (`MessagesViewController.swift`)

## 🌐 macOS 클라우드 서비스 사용

Windows 사용자는 다음 클라우드 서비스를 통해 macOS 환경에서 빌드할 수 있습니다:

### 추천 서비스
1. **MacInCloud** (가장 인기)
2. **AWS EC2 Mac**
3. **MacOS Virtual Machine**

자세한 가이드는 [README.md](DapTalkMessagesExtension/README.md) 참조

## 🎮 사용법

1. iOS 기기에서 호스트 앱 실행
2. Messages 앱 열기
3. 대화방에서 앱 스토어 아이콘 → DapTalk AI 선택
4. 모드 선택 (General/Dating)
5. 대화 내용 붙여넣기
6. AI 응답 분석 후 선택하여 전송

## 🔧 기술 스택

- **iOS**: Swift, Messages Framework
- **AI**: Google Gemini 1.5 Flash API
- **UI**: UIKit, Storyboard
- **Base**: React Native/Expo (원본 앱)

## 📝 라이센스

MIT License

## 🤝 기여

버그 리포트 및 기능 요청 환영합니다!
