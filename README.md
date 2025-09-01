# 🚀 DapTalk - AI-Powered iMessage Extension

[![iOS](https://img.shields.io/badge/iOS-14.0+-blue.svg)](https://developer.apple.com/ios/)
[![Swift](https://img.shields.io/badge/Swift-5.0+-orange.svg)](https://swift.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74+-61DAFB.svg)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

DapTalk is an AI-powered chat assistant that integrates seamlessly with iMessage, providing intelligent response suggestions for both general conversations and dating scenarios.

## ✨ **Features**

### 🧠 **Intelligent AI Responses**
- **Google Gemini AI Integration** - Advanced language understanding
- **4 Response Styles** - Formal, casual, empathetic, and direct options
- **Context-Aware** - Analyzes conversation flow and tone
- **Unlimited Usage** - No subscription or payment required

### 💬 **Dual Chat Modes**
- **General Mode** - Everyday conversation assistance
- **Dating Mode** - Romantic and flirty response suggestions
- **Gender Personalization** - Tailored responses based on user preferences

### 📱 **iMessage Integration**
- **Native Extension** - Works directly within Messages app
- **Real-time Analysis** - Instant conversation analysis
- **One-Tap Responses** - Select and send AI-generated replies
- **Privacy-Focused** - No conversation data stored

### 🎯 **Additional Features**
- **OCR Image Analysis** - Extract text from chat screenshots (main app)
- **Conversation Editing** - Modify and regenerate responses
- **Intent Analysis** - Understand conversation dynamics
- **Cross-Platform** - iPhone and iPad support

## 🛠 **Installation**

### **For Testing (TestFlight)**
1. Download TestFlight from the App Store
2. Accept the beta invitation email
3. Install DapTalk through TestFlight
4. Enable the extension in Messages → App Store → Manage

### **For Development**
```bash
# Clone the repository
git clone https://github.com/ccomkim80/daptalk-extension.git
cd daptalk-extension

# Install dependencies
npm install

# iOS Setup
cd ios && pod install && cd ..

# Run on simulator
npm run ios
```

## 🔧 **Setup Requirements**

### **Google Gemini API Key**
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update in both locations:
   - `App.js` → `GOOGLE_AI_API_KEY`
   - `DapTalkMessagesExtension/DapTalkMessagesExtension/Config.plist`

### **Apple Developer Account**
- Required for iMessage Extension deployment
- Configure proper Bundle IDs and code signing

## 📋 **Project Structure**

```
daptalk-extension/
├── App.js                          # Main React Native app
├── app.json                        # Expo configuration
├── assets/                         # App icons and images
├── DapTalkMessagesExtension/       # Xcode project for iMessage extension
│   ├── DapTalkHost/               # Host app (container)
│   ├── DapTalkMessagesExtension/  # iMessage extension code
│   └── *.xcodeproj                # Xcode project file
├── integrate_extension.md          # Integration guide
├── macINCloud_integration_guide.md # MacInCloud setup guide
└── RELEASE_NOTES.md               # Version history
```

## 🚀 **How to Use**

### **Main App**
1. Launch DapTalk
2. Choose General or Dating mode
3. Set your gender preferences
4. Input conversation text or upload screenshot
5. Get 4 AI-generated response options
6. Copy your preferred response

### **iMessage Extension**
1. Open Messages app
2. Start or continue a conversation
3. Tap the App Store icon (🔴) next to text input
4. Select "DapTalk Messages"
5. Paste conversation context
6. Choose mode and set preferences
7. Tap "Analyze" for AI suggestions
8. Select and send your preferred response

## 🔥 **Key Technologies**

- **Frontend**: React Native + Expo
- **AI Engine**: Google Gemini 1.5 Flash
- **iOS Extension**: Swift + Messages Framework
- **Storage**: AsyncStorage for preferences
- **Image Processing**: Expo ImagePicker + OCR
- **Deployment**: Xcode + TestFlight

## 📈 **Version History**

### v1.0.0 (September 2025)
- ✅ Complete app rebranding (ChatAssist → DapTalk)
- ✅ Removed all payment/subscription features
- ✅ Integrated iMessage extension with host app
- ✅ Unified Bundle ID hierarchy
- ✅ Google Gemini AI integration
- ✅ Ready for TestFlight deployment

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed changes.

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Google Gemini AI for powerful language processing
- React Native community for excellent mobile development tools
- Apple Messages framework for seamless iMessage integration

## 📞 **Support**

For questions, issues, or feature requests:
- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/ccomkim80/daptalk-extension/issues)
- 📖 Documentation: [Project Wiki](https://github.com/ccomkim80/daptalk-extension/wiki)

---

**DapTalk** - Making every conversation better with AI 🤖💬✨ 

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
