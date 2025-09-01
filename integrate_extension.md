# iMessage Extension Integration Guide

## MacInCloud에서 수행할 작업

### 1. 기존 React Native 앱을 iOS 네이티브로 변환

```bash
# 1. 프로젝트 클론
git clone https://github.com/ccomkim80/daptalk-extension.git
cd daptalk-extension

# 2. Expo를 iOS 네이티브로 prebuild
npx expo prebuild --platform ios --clean

# 이 명령으로 ios/ 폴더가 생성됩니다.
```

### 2. iMessage Extension 통합

```bash
# 3. 기존 Extension을 새 프로젝트로 복사
cp -r DapTalkMessagesExtension/DapTalkMessagesExtension ios/daptalk.xcworkspace/
```

### 3. Xcode에서 Extension Target 추가

1. `ios/daptalk.xcworkspace` 열기
2. 프로젝트 네비게이터에서 프로젝트 루트 선택
3. "+" 버튼으로 새 Target 추가
4. "Messages Extension" 선택
5. 기존 `MessagesViewController.swift` 파일들을 새 Extension target에 추가

### 4. Bundle ID 설정

- **Main App**: `com.ccomkim80.daptalk`
- **Extension**: `com.ccomkim80.daptalk.extension`

### 5. Info.plist 설정

**Main App Info.plist에 추가:**
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 6. Extension 파일들

기존에 만든 파일들을 복사:
- `MessagesViewController.swift` (701 lines)
- `Config.plist` (API 키 설정)
- Extension `Info.plist`

### 7. 빌드 및 테스트

```bash
# Xcode에서 빌드
# Product -> Build (⌘+B)
# 시뮬레이터에서 테스트
```

## 현재 완성된 Extension 기능

- ✅ AI 채팅 응답 (Google Gemini)
- ✅ General/Dating 모드
- ✅ 4가지 응답 옵션
- ✅ 사용자 설정 저장
- ✅ 네트워크 상태 체크
- ✅ 로컬 캐싱
- ✅ 접근성 지원

## Bundle ID 구조

```
com.ccomkim80.daptalk (Main App)
└── com.ccomkim80.daptalk.extension (iMessage Extension)
```

이렇게 하면 React Native 앱이 호스트가 되고, iMessage Extension이 포함된 완전한 앱이 됩니다.
