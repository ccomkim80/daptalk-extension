# DapTalk iMessage Extension

현재 React Native 앱의 AI 기반 채팅 기능을 iOS iMessage Extension으로 구현한 프로젝트입니다.

## 주요 기능

- **AI 기반 채팅**: Google Generative AI를 사용하여 사용자 입력에 대한 4가지 스타일의 응답 생성
- **2가지 모드**:
  - **Chat Mode (일반 채팅 모드)**: 
    - Friendly (친근한 스타일)
    - Polite (정중한 스타일) 
    - Humorous (유머러스한 스타일)
    - Polite Decline (정중한 거절)
  - **Dating Mode (데이팅 모드)**:
    - Show Interest (관심 표현)
    - Be Attractive (매력적인 스타일)
    - Build Intimacy (친밀감 형성)
    - Polite Decline (정중한 거절)
- **개인화 설정**: 사용자 성별, 나이, 상대방 성별 설정으로 맞춤형 응답 생성
- **iMessage 통합**: 선택한 응답을 바로 iMessage로 전송
- **직관적인 UI**: 제한된 iMessage Extension 화면에 최적화된 UI

## 프로젝트 구조

```
iMessageExtension/
├── DapTalkMessagesExtension.xcodeproj/
│   └── project.pbxproj
└── DapTalkMessagesExtension/
    ├── MessagesViewController.swift    # 메인 뷰 컨트롤러
    ├── AIService.swift                # AI API 서비스
    ├── ResponseCell.swift             # 응답 셀 UI 컴포넌트
    ├── Info.plist                     # 앱 정보
    └── Base.lproj/
        └── MainInterface.storyboard   # UI 스토리보드
```

## 설정 방법

### 1. Xcode에서 프로젝트 열기
1. Xcode를 실행합니다
2. `DapTalkMessagesExtension.xcodeproj` 파일을 엽니다

### 2. API 키 설정
1. `AIService.swift` 파일을 엽니다
2. `apiKey` 상수에 Google AI API 키를 입력합니다:
```swift
private let apiKey = "YOUR_GOOGLE_AI_API_KEY_HERE"
```

### 3. Bundle Identifier 설정
1. 프로젝트 네비게이터에서 프로젝트 파일을 선택합니다
2. Target > DapTalkMessagesExtension을 선택합니다
3. General 탭에서 Bundle Identifier를 고유한 값으로 변경합니다:
   - 예: `com.yourcompany.daptalk.extension`

### 4. 호스트 앱 생성 (필수)
iMessage Extension은 단독으로 실행할 수 없으므로 호스트 앱이 필요합니다:

1. Xcode에서 File > New > Target을 선택합니다
2. iOS > App을 선택합니다
3. Product Name: "DapTalk"
4. Bundle Identifier: `com.yourcompany.daptalk`
5. Language: Swift

### 5. Extension을 호스트 앱에 연결
1. 호스트 앱 타겟을 선택합니다
2. General 탭에서 "Embedded Binaries" 또는 "Frameworks and Libraries" 섹션에 Extension을 추가합니다

### 6. 개발자 계정 설정
1. Xcode > Preferences > Accounts에서 Apple ID를 추가합니다
2. 프로젝트 설정에서 Team을 선택합니다

### 7. 시뮬레이터에서 테스트
1. 호스트 앱을 타겟으로 선택합니다
2. iOS 시뮬레이터에서 실행합니다
3. Messages 앱을 열고 대화를 시작합니다
4. 앱 스토어 아이콘을 누르고 DapTalk Assistant를 선택합니다

## 사용 방법

1. iMessage 대화에서 DapTalk Extension을 실행합니다
2. 설정 버튼(⚙️)을 눌러 개인 설정을 구성합니다:
   - **Dating Mode**: 데이팅 모드 활성화/비활성화
   - **Your Gender**: 본인의 성별 선택
   - **Your Age**: 본인의 연령대 선택
   - **Their Gender**: 상대방의 성별 선택 (데이팅 모드에서 중요)
3. 텍스트 입력 필드에 메시지를 입력합니다
4. "Send" 버튼을 눌러 AI 응답을 요청합니다
5. 4가지 스타일의 응답 중 하나를 선택합니다
6. 선택한 응답이 자동으로 iMessage로 전송됩니다

### Dating Mode 특징
- **개인화된 응답**: 사용자와 상대방의 성별, 나이를 고려한 맞춤형 응답
- **로맨틱 스타일**: 연애 상황에 특화된 4가지 응답 스타일
- **성별별 커뮤니케이션**: 남성/여성별 자연스러운 표현 방식 적용
- **연령대별 톤**: 10대부터 50대 이상까지 연령에 맞는 어조 조절

## 구현된 기능

### MessagesViewController.swift
- iMessage Extension의 메인 뷰 컨트롤러
- 사용자 입력 처리 및 AI 응답 표시
- 선택된 응답을 iMessage로 전송

### AIService.swift
- Google Generative AI API 연동
- 2가지 모드별 4가지 스타일의 프롬프트 생성
- 사용자 프로필 기반 개인화된 응답 생성
- 비동기 응답 처리

### ResponseCell.swift
- 커스텀 컬렉션 뷰 셀
- 응답 타입별 색상 구분
- 터치 애니메이션 효과

## 제한 사항

1. **네트워크 연결 필요**: AI 응답 생성을 위해 인터넷 연결이 필요합니다
2. **API 비용**: Google AI API 사용량에 따른 비용이 발생할 수 있습니다
3. **화면 크기 제한**: iMessage Extension의 제한된 화면 크기
4. **iOS 15.0+**: iOS 15.0 이상에서만 동작합니다

## 추가 개발 가능 사항

1. **사용자 설정**: 성별, 나이 등의 개인화 설정
2. **로컬 캐싱**: 자주 사용하는 응답 캐싱
3. **다국어 지원**: 여러 언어로 응답 생성
4. **커스텀 스타일**: 사용자 정의 응답 스타일
5. **오프라인 모드**: 로컬 AI 모델 사용

## 문제 해결

### 빌드 오류
- Bundle Identifier가 고유한지 확인
- 개발자 계정이 올바르게 설정되었는지 확인
- Xcode와 iOS 버전 호환성 확인

### API 오류
- Google AI API 키가 올바른지 확인
- 네트워크 연결 상태 확인
- API 할당량 확인

### Extension이 표시되지 않음
- 호스트 앱이 올바르게 설치되었는지 확인
- Messages 앱을 재시작
- 시뮬레이터 재시작

## 라이선스

이 프로젝트는 원본 React Native 앱을 기반으로 하여 iMessage Extension으로 포팅한 버전입니다.
