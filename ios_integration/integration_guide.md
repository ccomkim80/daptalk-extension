# React Native + iMessage Extension Integration Guide

## macOS에서 수행할 단계들

### 1. Expo Prebuild (macOS에서만 가능)

```bash
cd daptalk-extension
npx expo prebuild --platform ios --clean
```

이 명령으로 `ios/` 폴더가 생성됩니다.

### 2. Extension 통합

```bash
# Extension 파일들을 React Native iOS 프로젝트로 복사
cp -r ios_integration/DapTalkMessagesExtension ios/
```

### 3. Xcode에서 Extension Target 추가

1. `ios/chatassist.xcworkspace` 파일을 Xcode에서 열기
2. 프로젝트 네비게이터에서 프로젝트 루트 선택
3. Targets 섹션에서 "+" 버튼 클릭
4. "Messages Extension" 템플릿 선택
5. Target 이름을 "DapTalkMessagesExtension"으로 설정
6. Bundle Identifier를 `com.ccomkim80.daptalk.extension`으로 설정

### 4. Extension 파일들 연결

1. 새로 생성된 Extension target에서 기본 파일들 삭제
2. `DapTalkMessagesExtension/` 폴더의 파일들을 target에 추가:
   - `MessagesViewController.swift`
   - `Config.plist`
   - `Info.plist`
   - `Assets.xcassets`

### 5. Bundle Identifier 설정

**React Native App**: `com.ccomkim80.daptalk`
**Extension**: `com.ccomkim80.daptalk.extension`

### 6. Extension Info.plist 확인

다음 키들이 포함되어 있는지 확인:
- `NSExtension`
- `MSMessagesExtensionStoreIconName`
- `MSMessagesExtensionIconName`

### 7. 빌드 및 테스트

```bash
# Xcode에서
# Product -> Build (⌘+B)
# Product -> Run (⌘+R)
```

## 완료 후 구조

```
ios/
├── chatassist/ (React Native 메인 앱)
├── DapTalkMessagesExtension/ (iMessage Extension)
└── chatassist.xcworkspace
```

## 주의사항

- Windows에서는 `expo prebuild --platform ios`가 지원되지 않음
- 반드시 macOS 환경에서 iOS 빌드 수행
- Extension의 API 키 설정 확인 (`Config.plist`)
- 코드 서명 설정 (Development Team ID: F9C8ZFQT4N)
