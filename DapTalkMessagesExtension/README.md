# DapTalk iMessage Extension

현재 daptalk React Native 앱을 기반으로 한 iOS iMessage Extension입니다. 이 확장은 Messages 앱에서 직접 AI 기반 대화 응답을 제공합니다.

## 주요 기능

### 🤖 AI 응답 생성
- Google Gemini AI를 사용하여 대화를 분석하고 4가지 응답 옵션 제공
- 각 응답을 탭하여 클립보드에 복사하고 메시지로 전송

### 🎯 두 가지 모드
1. **General Mode**: 일반적인 대화 상황을 위한 다양한 응답 스타일
   - 정중한 응답
   - 캐주얼한 응답  
   - 공감적인 응답
   - 직접적인 응답

2. **Dating Mode**: 연애/데이팅 상황에 특화된 응답
   - 재미있고 유머러스한 응답
   - 진솔한 응답
   - 재치있는 응답
   - 배려 깊은 응답

### 👥 성별 설정 (데이팅 모드)
- 사용자 성별 설정
- 상대방 성별 설정
- 성별에 따른 맞춤형 응답 생성

## 설치 및 설정

### 필요 사항
- Xcode 15.0 이상
- iOS 17.0 이상
- 활성 Apple Developer 계정

### 설정 단계

1. **Xcode에서 프로젝트 열기**
   ```
   DapTalkMessagesExtension/DapTalkMessagesExtension.xcodeproj
   ```

2. **개발 팀 설정**
   - Project Navigator에서 프로젝트 선택
   - Targets에서 `DapTalkHost`와 `DapTalkMessagesExtension` 선택
   - Signing & Capabilities에서 Team 설정

3. **Bundle Identifier 변경**
   - `DapTalkHost`: `com.yourteam.daptalk.host`
   - `DapTalkMessagesExtension`: `com.yourteam.daptalk.extension`

4. **API 키 설정**
   - `MessagesViewController.swift`에서 `geminiAPIKey` 값을 본인의 Google AI API 키로 변경
   ```swift
   private let geminiAPIKey = "YOUR_GOOGLE_AI_API_KEY_HERE"
   ```

### 빌드 및 실행

1. **기기 연결**
   - 실제 iOS 기기를 Mac에 연결 (시뮬레이터는 iMessage Extension 지원 안 함)

2. **빌드 및 설치**
   - Xcode에서 `DapTalkHost` 타겟 선택
   - Product → Run 또는 Cmd+R
   - 앱이 기기에 설치됨

3. **확장 기능 활성화**
   - 기기에서 Messages 앱 열기
   - 아무 대화방 들어가기
   - 텍스트 입력창 옆의 앱 스토어 아이콘 탭
   - 하단에서 DapTalk AI 확장 찾아서 탭

## 사용 방법

### General Mode 사용
1. Messages 앱에서 DapTalk 확장 열기
2. "General" 모드 선택 (기본값)
3. 대화 내용을 텍스트 뷰에 붙여넣기
4. "Analyze & Get AI Responses" 버튼 탭
5. 4개의 AI 응답 옵션 중 하나 선택하여 전송

### Dating Mode 사용
1. "Dating" 모드 선택
2. 본인 성별과 상대방 성별 선택
3. 데이팅 대화 내용 붙여넣기
4. "Analyze & Get AI Responses" 버튼 탭
5. 로맨틱/재미있는 응답 옵션 중 선택하여 전송

## 프로젝트 구조

```
DapTalkMessagesExtension/
├── DapTalkMessagesExtension.xcodeproj
├── DapTalkMessagesExtension/          # 메시지 확장 코드
│   ├── MessagesViewController.swift   # 메인 확장 로직
│   ├── MainInterface.storyboard      # UI 인터페이스
│   ├── Info.plist                    # 확장 설정
│   └── Assets.xcassets/              # 아이콘 및 이미지
└── DapTalkHost/                      # 호스트 앱
    └── AppDelegate.swift             # 호스트 앱 코드
```

## 기술적 세부사항

### Messages Framework 사용
- `MSMessagesAppViewController`: 메시지 확장의 기본 뷰 컨트롤러
- `MSConversation`: 현재 대화 컨텍스트 액세스
- `MSMessage`: 사용자 정의 메시지 생성 및 전송

### AI 통합
- Google Gemini 1.5 Flash API 사용
- HTTP 요청을 통한 실시간 AI 응답 생성
- 프롬프트 엔지니어링으로 모드별 맞춤형 응답

### UI/UX 특징
- 스크롤 가능한 인터페이스로 모든 화면 크기 지원
- 로딩 인디케이터로 사용자 피드백
- 모드별 동적 UI 변경
- 터치 친화적인 버튼 크기

## 문제 해결

### 확장이 Messages 앱에 나타나지 않는 경우
1. 기기 재시작
2. Messages 앱 완전 종료 후 재시작
3. 호스트 앱을 한 번 실행해보기

### API 응답 오류
1. API 키가 올바른지 확인
2. 인터넷 연결 상태 확인
3. Google AI Studio에서 API 키 할당량 확인

### 빌드 오류
1. Bundle Identifier가 고유한지 확인
2. 개발 팀이 올바르게 설정되었는지 확인
3. Xcode를 최신 버전으로 업데이트

## 향후 개선 사항

- [ ] 로컬 대화 기록 자동 읽기
- [ ] 더 많은 응답 스타일 옵션
- [ ] 사용자 맞춤형 응답 학습
- [ ] 다국어 지원
- [ ] 오프라인 모드 지원

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 기여

버그 리포트, 기능 요청, Pull Request를 환영합니다!
