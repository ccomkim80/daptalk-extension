#!/bin/bash

# DapTalk iMessage Extension Setup Script

echo "🚀 DapTalk iMessage Extension 설정을 시작합니다..."

# 프로젝트 디렉토리로 이동
cd "$(dirname "$0")"

echo "📁 프로젝트 구조 확인 중..."

# 필요한 파일들이 존재하는지 확인
required_files=(
    "DapTalkMessagesExtension.xcodeproj/project.pbxproj"
    "DapTalkMessagesExtension/MessagesViewController.swift"
    "DapTalkMessagesExtension/Info.plist"
    "DapTalkMessagesExtension/Base.lproj/MainInterface.storyboard"
    "DapTalkHost/AppDelegate.swift"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ 필수 파일이 없습니다: $file"
        exit 1
    fi
done

echo "✅ 모든 필수 파일이 존재합니다."

# Xcode 버전 확인
echo "🔍 Xcode 버전 확인 중..."
if command -v xcodebuild &> /dev/null; then
    xcode_version=$(xcodebuild -version | head -n 1)
    echo "✅ $xcode_version 발견"
else
    echo "❌ Xcode가 설치되어 있지 않습니다. App Store에서 Xcode를 설치해주세요."
    exit 1
fi

# 기본 설정 정보 수집
echo ""
echo "📝 기본 설정 정보를 입력해주세요:"

read -p "Bundle Identifier 접두사 (예: com.yourcompany): " bundle_prefix
read -p "개발팀 ID (선택사항): " team_id
read -p "Google AI API 키: " api_key

# Bundle Identifier 업데이트
if [[ -n "$bundle_prefix" ]]; then
    echo "🔧 Bundle Identifier 업데이트 중..."
    
    # project.pbxproj 파일에서 번들 ID 변경
    sed -i '' "s/com\.daptalk\.host/${bundle_prefix}.daptalk.host/g" DapTalkMessagesExtension.xcodeproj/project.pbxproj
    sed -i '' "s/com\.daptalk\.extension/${bundle_prefix}.daptalk.extension/g" DapTalkMessagesExtension.xcodeproj/project.pbxproj
    
    echo "✅ Bundle Identifier가 업데이트되었습니다."
fi

# API 키 업데이트
if [[ -n "$api_key" ]]; then
    echo "🔧 API 키 업데이트 중..."
    
    # MessagesViewController.swift에서 API 키 변경
    sed -i '' "s/AIzaSyCPOkqRbG_H-Uybu5S25uHw-qkrTiAJ0IQ/$api_key/g" DapTalkMessagesExtension/MessagesViewController.swift
    
    echo "✅ API 키가 업데이트되었습니다."
fi

# 개발팀 ID 설정 (선택사항)
if [[ -n "$team_id" ]]; then
    echo "🔧 개발팀 ID 설정 중..."
    
    # project.pbxproj에서 DEVELOPMENT_TEAM 설정
    sed -i '' "s/DEVELOPMENT_TEAM = \"\"/DEVELOPMENT_TEAM = \"$team_id\"/g" DapTalkMessagesExtension.xcodeproj/project.pbxproj
    
    echo "✅ 개발팀 ID가 설정되었습니다."
fi

echo ""
echo "🎉 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. Xcode에서 DapTalkMessagesExtension.xcodeproj 열기"
echo "2. 연결된 iOS 기기 선택 (시뮬레이터 X)"
echo "3. DapTalkHost 타겟으로 빌드 및 실행"
echo "4. Messages 앱에서 DapTalk AI 확장 사용"
echo ""
echo "문제가 있으면 README.md 파일을 참조하세요."
