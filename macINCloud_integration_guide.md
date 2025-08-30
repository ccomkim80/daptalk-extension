# MacInCloud에서 React Native + iMessage Extension 통합 가이드

## 1단계: Expo Development Build 설정

### EAS CLI 설치 및 설정
```bash
# EAS CLI 설치
npm install -g @expo/eas-cli

# EAS 로그인
eas login

# 프로젝트 설정
eas build:configure
```

### eas.json 설정
```json
{
  "cli": {
    "version": ">= 11.0.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## 2단계: iOS 네이티브 프로젝트 생성

### 로컬 빌드 준비
```bash
# 로컬에서 iOS 프로젝트 생성
npx expo run:ios

# 또는 prebuild 사용
npx expo prebuild --platform ios --clean
```

이 명령으로 `ios/` 폴더가 생성됩니다.

## 3단계: iMessage Extension 통합

### Extension Target 추가
1. `ios/chatassist.xcworkspace` 열기
2. 프로젝트 파일 선택
3. Targets 섹션에서 "+" 클릭
4. "Messages Extension" 선택
5. Product Name: "ChatAssistantMessages"
6. Bundle Identifier: "com.ccomkim80.chatassist.extension"

### 기존 Extension 파일 복사
```bash
# Extension 소스 파일 복사
cp DapTalkMessagesExtension/DapTalkMessagesExtension/MessagesViewController.swift ios/ChatAssistantMessages/
cp DapTalkMessagesExtension/DapTalkMessagesExtension/Config.plist ios/ChatAssistantMessages/
```

### Info.plist 설정
Extension의 Info.plist에 추가:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 4단계: Bundle ID 및 설정

### Bundle ID 구조
- Main App: `com.ccomkim80.chatassist`
- Extension: `com.ccomkim80.chatassist.extension`

### Capabilities 추가
1. Main App Target 선택
2. "Signing & Capabilities" 탭
3. "App Groups" 추가 (Extension과 데이터 공유용)

## 5단계: 빌드 및 테스트

### Xcode에서 빌드
1. Scheme을 Main App으로 설정
2. Product → Build (⌘+B)
3. iOS 시뮬레이터에서 실행

### 디버깅
- Extension은 Messages 앱에서만 실행됨
- Extension Target으로 직접 실행하여 디버깅 가능

## 현재 Extension 기능

✅ **완성된 기능들:**
- AI 채팅 응답 (Google Gemini API)
- General/Dating 모드 전환
- 4가지 응답 옵션 제공
- 사용자 설정 저장 (UserDefaults)
- 네트워크 상태 확인
- 로컬 응답 캐싱
- 접근성 지원
- 키보드 자동 숨김
- 에러 핸들링

## 예상 결과

1. **Main App**: React Native 기반의 Chat Assistant 앱
2. **iMessage Extension**: Messages 앱에서 AI 응답 제공
3. **통합된 경험**: 메인 앱에서 설정한 선호도가 Extension에 반영

이렇게 하면 기존 React Native 앱이 호스트가 되고, iMessage Extension이 포함된 완전한 앱이 완성됩니다! 🎉
