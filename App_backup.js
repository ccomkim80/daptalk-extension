import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  Linking,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google AI API 키를 여기에 입력하세요 (나중에 환경변수로 관리하는 것을 권장)
const GOOGLE_AI_API_KEY = 'AIzaSyCPOkqRbG_H-Uybu5S25uHw-qkrTiAJ0IQ';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]); // 다중 이미지 배열로 변경
  const [aiReplies, setAiReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 사용자 프로필 설정
  const [userGender, setUserGender] = useState('');
  const [userAge, setUserAge] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showIntentAnalysis, setShowIntentAnalysis] = useState(false); // 의도 분석 표시 여부
  const [userSpeechStyle, setUserSpeechStyle] = useState(''); // 사용자 말투 분석 결과
  const [intentAnalysis, setIntentAnalysis] = useState(''); // 상대방 의도 분석 결과

  // 프리미엄 관련 상태
  const [isPremium, setIsPremium] = useState(false);
  const [dailyUsageCount, setDailyUsageCount] = useState(0);
  const [lastUsageDate, setLastUsageDate] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // 애니메이션 값들
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [70, 60],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // 카드 애니메이션을 위한 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 스플래시 화면 타이머
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1000); // 1초 후 메인화면으로

    // 앱 시작 시 저장된 사용자 설정 불러오기
    loadUserSettings();
    
    // 프리미엄 상태 및 사용량 불러오기
    loadPremiumStatus();

    return () => clearTimeout(splashTimer);
  }, []);

  // 사용자 설정을 AsyncStorage에 저장하는 함수
  const saveUserSettings = async (gender, age) => {
    try {
      const settings = {
        gender: gender,
        age: age
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('사용자 설정 저장 오류:', error);
    }
  };

  // 사용자 설정을 AsyncStorage에서 불러오는 함수
  const loadUserSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setUserGender(settings.gender || '');
        setUserAge(settings.age || '');
      }
    } catch (error) {
      console.error('사용자 설정 불러오기 오류:', error);
    }
  };

  // 프리미엄 상태 및 사용량 불러오기
  const loadPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem('premiumStatus');
      const usageData = await AsyncStorage.getItem('dailyUsage');
      
      if (premiumStatus) {
        setIsPremium(JSON.parse(premiumStatus));
      }
      
      if (usageData) {
        const usage = JSON.parse(usageData);
        const today = new Date().toDateString();
        
        if (usage.date === today) {
          setDailyUsageCount(usage.count);
          setLastUsageDate(usage.date);
        } else {
          // 새로운 날이면 카운트 리셋
          setDailyUsageCount(0);
          setLastUsageDate(today);
          await AsyncStorage.setItem('dailyUsage', JSON.stringify({
            date: today,
            count: 0
          }));
        }
      }
    } catch (error) {
      console.error('프리미엄 상태 불러오기 오류:', error);
    }
  };

  // 일일 사용량 증가
  const incrementDailyUsage = async () => {
    const today = new Date().toDateString();
    const newCount = dailyUsageCount + 1;
    
    setDailyUsageCount(newCount);
    setLastUsageDate(today);
    
    await AsyncStorage.setItem('dailyUsage', JSON.stringify({
      date: today,
      count: newCount
    }));
  };

  // 프리미엄 구매 처리
  const handlePremiumPurchase = async (paymentMethod) => {
    try {
      Alert.alert(
        '결제 확인',
        `${paymentMethod}로 월 2,000원 결제를 진행하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel'
          },
          {
            text: '결제',
            onPress: async () => {
              // 실제 앱에서는 여기서 결제 API를 호출해야 합니다
              // 현재는 시뮬레이션으로 구현
              setLoading(true);
              
              setTimeout(async () => {
                try {
                  setIsPremium(true);
                  await AsyncStorage.setItem('premiumStatus', JSON.stringify(true));
                  setShowPremiumModal(false);
                  setLoading(false);
                  
                  Alert.alert(
                    '결제 완료!',
                    '프리미엄 구독이 활성화되었습니다!\n이제 무제한으로 답변을 받을 수 있습니다.',
                    [{ text: '확인' }]
                  );
                } catch (error) {
                  console.error('결제 처리 오류:', error);
                  setLoading(false);
                  Alert.alert('오류', '결제 처리 중 오류가 발생했습니다.');
                }
              }, 2000); // 결제 시뮬레이션을 위한 딜레이
            }
          }
        ]
      );
    } catch (error) {
      console.error('결제 오류:', error);
      Alert.alert('오류', '결제 처리 중 오류가 발생했습니다.');
    }
  };

  // 사용량 확인 및 제한
  const checkUsageLimit = () => {
    if (isPremium) {
      return true; // 프리미엄 사용자는 무제한
    }
    
    const today = new Date().toDateString();
    if (lastUsageDate !== today) {
      // 새로운 날이면 카운트 리셋
      setDailyUsageCount(0);
      setLastUsageDate(today);
      return true;
    }
    
    if (dailyUsageCount >= 1) {
      setShowPremiumModal(true);
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (aiReplies.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [aiReplies]);

  // 이미지를 Base64로 변환하는 함수
  const convertImageToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // data:image/jpeg;base64, 부분 제거
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('이미지 변환 중 오류가 발생했습니다.');
    }
  };

  // 파일 확장자로부터 MIME 타입 결정
  const getMimeTypeFromUri = (uri) => {
    const extension = uri.toLowerCase().split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg'; // 기본값
    }
  };

  // 사용자 프로필에 맞는 말투 스타일 생성
  const generatePersonalizedStyles = () => {
    const genderStyle = userGender === 'male' ? '남성적이고' : userGender === 'female' ? '여성적이고' : '';
    const ageStyle = getAgeStyle(userAge);
    const speechStyleGuide = userSpeechStyle ? `사용자의 기존 말투 특성: "${userSpeechStyle}". 이 특성을 반영하여` : '';
    const intentGuide = intentAnalysis ? `상대방의 의도 분석: "${intentAnalysis}". 이 의도에 맞게` : '';
    
    return [
      {
        name: '친근한 스타일',
        prompt: `${speechStyleGuide} ${intentGuide} ${genderStyle} ${ageStyle} 친근하고 캐주얼한 말투로 내가 상대방에게 답장을 써주세요. 상대방과 가까운 사이처럼 자연스럽게 대화하는 느낌으로 대화의 맥락에 맞게 작성해주세요. ${userSpeechStyle ? '사용자의 평소 말투 패턴을 유지하면서 친근한 톤으로 조정해주세요.' : ''} ${intentAnalysis ? '상대방의 의도와 감정을 고려하여 적절한 반응을 보여주세요.' : ''} **중요**: 내가 상대방에게 보내는 메시지를 작성해주세요.`
      },
      {
        name: '정중한 스타일', 
        prompt: `${speechStyleGuide} ${intentGuide} ${genderStyle} ${ageStyle} 정중하고 예의바른 말투로 내가 상대방에게 답장을 써주세요. 상대방을 존중하면서도 따뜻한 느낌이 드는 답장을 대화의 맥락에 맞게 작성해주세요. ${userSpeechStyle ? '사용자의 평소 말투 패턴을 유지하면서 더 정중한 톤으로 조정해주세요.' : ''} ${intentAnalysis ? '상대방의 의도와 감정을 고려하여 적절한 반응을 보여주세요.' : ''} **중요**: 내가 상대방에게 보내는 메시지를 작성해주세요.`
      },
      {
        name: '유머러스한 스타일',
        prompt: `${speechStyleGuide} ${intentGuide} ${genderStyle} ${ageStyle} 유머러스하고 재미있는 말투로 내가 상대방에게 답장을 써주세요. 상황에 맞는 농담이나 재치있는 표현을 대화의 맥락에 맞게 사용해주세요. ${userSpeechStyle ? '사용자의 평소 말투 패턴을 유지하면서 유머러스한 요소를 추가해주세요.' : ''} ${intentAnalysis ? '상대방의 의도와 감정을 고려하여 적절한 반응을 보여주세요.' : ''} **중요**: 내가 상대방에게 보내는 메시지를 작성해주세요.`
      }
    ];
  };

  // 나이대별 말투 스타일
  const getAgeStyle = (age) => {
    switch (age) {
      case '10대':
        return '10대다운 생기발랄하고 트렌디한';
      case '20대':
        return '20대다운 활발하고 현대적인';
      case '30대':
        return '30대다운 안정적이고 세련된';
      case '40대':
        return '40대다운 성숙하고 품격있는';
      case '50대이상':
        return '50대 이상다운 차분하고 지혜로운';
      default:
        return '자연스럽고 적절한';
    }
  };

  // 사용자 말투 분석 함수
  const analyzeSpeechStyle = async (userMessages) => {
    if (!GOOGLE_AI_API_KEY || !userMessages || userMessages.length === 0) {
      return '';
    }

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const analysisPrompt = `다음 메시지들을 분석해서 사용자의 말투 특성을 파악해주세요:

사용자 메시지들:
${userMessages.join('\n')}

다음 항목들을 분석해주세요:
1. 존댓말/반말 사용 패턴
2. 문장 길이와 구조 (짧고 간결한지, 길고 자세한지)
3. 이모티콘/이모지 사용 빈도와 스타일
4. 감정 표현 방식 (직설적, 완곡한, 유머러스한)
5. 특별한 말버릉이나 어미 사용
6. 전반적인 톤 (친근한, 정중한, 활발한, 차분한 등)

분석 결과를 바탕으로 이 사용자의 말투 특성을 한 문장으로 요약해주세요.
예시: "짧고 간결한 반말을 사용하며 이모지를 자주 쓰는 친근하고 활발한 말투" 또는 "정중한 존댓말을 사용하며 차분하고 예의바른 말투"`;

      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisResult = response.text().trim();
      
      console.log('말투 분석 결과:', analysisResult);
      setUserSpeechStyle(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('말투 분석 오류:', error);
      return '';
    }
  };

  // 상대방 의도 분석 함수
  const analyzeOpponentIntent = async (opponentMessage, conversationContext = '') => {
    if (!GOOGLE_AI_API_KEY || !opponentMessage) {
      return '';
    }

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const intentPrompt = `다음 메시지를 분석해서 상대방의 의도와 감정 상태를 파악해주세요:

상대방의 메시지: "${opponentMessage}"

${conversationContext ? `대화 맥락:\n${conversationContext}` : ''}

다음 관점에서 분석해주세요:
1. **주요 의도**: 무엇을 원하는가? (정보 요청, 감정 공유, 만남 제안, 단순 대화, 도움 요청 등)
2. **감정 상태**: 어떤 기분인가? (기쁨, 슬픔, 화남, 걱정, 흥미, 지루함, 피곤함 등)
3. **대화 스타일**: 어떤 방식으로 소통하고 있는가? (직설적, 우회적, 유머러스, 진지함 등)
4. **기대하는 반응**: 어떤 답변을 원하는가? (공감, 조언, 정보, 농담, 계획 수립 등)
5. **긴급도**: 얼마나 중요하거나 급한가? (매우 급함, 보통, 단순 잡담)

분석 결과를 다음 형식으로 요약해주세요:
"의도: [주요 의도] | 감정: [감정 상태] | 기대 반응: [원하는 반응 유형]"

예시: "의도: 만남 제안 | 감정: 기대감과 약간의 불안 | 기대 반응: 긍정적 답변과 구체적 계획"`;

      const result = await model.generateContent(intentPrompt);
      const response = await result.response;
      const analysisResult = response.text().trim();
      
      console.log('상대방 의도 분석 결과:', analysisResult);
      setIntentAnalysis(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('의도 분석 오류:', error);
      return '';
    }
  };

  // 이미지 선택 및 OCR 처리 함수
  const pickImage = async () => {
    try {
      // 최대 5장까지만 허용
      if (selectedImages.length >= 5) {
        Alert.alert('알림', '최대 5장까지만 업로드할 수 있습니다.');
        return;
      }

      // 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('권한 필요', '사진에 접근하기 위해 권한이 필요합니다.');
        return;
      }

      // 이미지 선택 (crop 제거)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // crop 비활성화
        quality: 0.8, // 품질 조정으로 용량 최적화
        base64: false, // base64는 따로 처리
        allowsMultipleSelection: false, // 한 번에 하나씩만 선택
      });

      if (!result.canceled) {
        const newImage = result.assets[0];
        setSelectedImages(prev => [...prev, newImage]);
        
        Alert.alert('성공', '이미지가 추가되었습니다. "AI 답변 생성하기" 버튼을 눌러 분석을 시작하세요.');
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
      console.error('Image picker error:', error);
    }
  };

  // 이미지 OCR 처리 및 AI 답변 생성
  const processImageOCR = async (imageAsset) => {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('설정 필요', 'Google AI API 키를 설정해주세요.');
      return;
    }

    setLoading(true);
    try {
      console.log('이미지 OCR 처리 시작...');
      
      // 이미지를 Base64로 변환
      const base64Image = await convertImageToBase64(imageAsset.uri);
      
      // 올바른 MIME 타입 설정
      const mimeType = getMimeTypeFromUri(imageAsset.uri);
      console.log('감지된 MIME 타입:', mimeType);
      
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 사용자 프로필 정보
      const userProfile = userGender && userAge ? 
        `사용자 프로필: ${userGender === 'male' ? '남성' : userGender === 'female' ? '여성' : '성별 미설정'}, ${userAge}` : 
        '사용자 프로필: 미설정';

      const personalizedStyles = generatePersonalizedStyles();

      // OCR 및 대화 분석을 위한 프롬프트
      const ocrPrompt = `이 채팅 스크린샷을 분석해서 다음을 수행해주세요:

${userProfile}

1. 이미지에서 모든 채팅 메시지를 정확히 읽어주세요.
2. 메시지의 위치를 파악해서 누가 보낸 메시지인지 구분해주세요:
   - 화면 왼쪽에 있는 메시지 = 상대방이 보낸 메시지 (내가 받은 메시지)
   - 화면 오른쪽에 있는 메시지 = 내가 보낸 메시지
3. 대화의 맥락과 흐름을 파악해주세요.
4. 상대방이 보낸 가장 최근 메시지(왼쪽에 위치한 마지막 메시지)를 찾아주세요.
5. 내가 보낸 메시지를 분석해서 말투 특성을 파악해주세요.
6. 그 상대방의 최근 메시지에 대해 내가 답장하는 메시지를 3가지 스타일로 생성해주세요.

중요사항:
- 반드시 상대방(왼쪽)의 메시지에 대한 답장을 만들어주세요
- 내(오른쪽) 메시지에 대한 답장이 아닙니다
- 내가 보낸 기존 메시지들의 말투 패턴을 분석하고 반영해주세요
- 사용자의 성별과 나이대를 고려한 자연스러운 말투를 사용해주세요
- 조언이나 분석이 아닌, 실제로 채팅에서 보낼 수 있는 답장을 만들어주세요

**절대 주의**: 답장은 반드시 내가 상대방에게 보내는 메시지여야 합니다. 상대방이 나에게 보내는 메시지를 생성하면 안 됩니다.

응답 형식:
=== 읽어낸 대화 내용 ===
[전체 대화 내용을 시간순으로 나열하되, 각 메시지 앞에 "상대방:" 또는 "나:"를 붙여서 구분]

=== 상대방의 최근 메시지 ===
[상대방이 마지막으로 보낸 메시지]

=== ${personalizedStyles[0].name} ===
[${personalizedStyles[0].prompt}으로 내가 상대방에게 보낼 답장]

=== ${personalizedStyles[1].name} ===
[${personalizedStyles[1].prompt}으로 내가 상대방에게 보낼 답장]

=== ${personalizedStyles[2].name} ===
[${personalizedStyles[2].prompt}으로 내가 상대방에게 보낼 답장]`;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      };

      console.log('Google AI 요청 중...');
      const result = await model.generateContent([ocrPrompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('OCR 결과:', text);

      // 응답 파싱
      const sections = text.split('===');
      let extractedChat = '';
      let latestOpponentMessage = '';
      let userMessages = []; // 사용자 메시지 수집
      const replies = [];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.includes('읽어낸 대화 내용')) {
          extractedChat = sections[i + 1]?.trim() || '';
          
          // 대화 내용에서 사용자 메시지 추출 (간단한 패턴 매칭)
          const chatLines = extractedChat.split('\n');
          chatLines.forEach(line => {
            // "나:" 또는 "본인:" 또는 오른쪽 메시지로 표시된 것들을 사용자 메시지로 간주
            if (line.includes('나:') || line.includes('본인:') || line.includes('오른쪽:') || line.includes('자신:')) {
              const message = line.replace(/^(나:|본인:|오른쪽:|자신:)\s*/, '').trim();
              if (message) userMessages.push(message);
            }
          });
        } else if (section.includes('상대방의 최근 메시지')) {
          latestOpponentMessage = sections[i + 1]?.trim() || '';
        } else if (section.includes('친근한 스타일')) {
          replies.push({
            id: 1,
            style: '친근한 스타일',
            text: sections[i + 1]?.trim() || ''
          });
        } else if (section.includes('정중한 스타일')) {
          replies.push({
            id: 2,
            style: '정중한 스타일',
            text: sections[i + 1]?.trim() || ''
          });
        } else if (section.includes('유머러스한 스타일')) {
          replies.push({
            id: 3,
            style: '유머러스한 스타일',
            text: sections[i + 1]?.trim() || ''
          });
        }
      }

      // 사용자 메시지가 있으면 말투 분석 수행
      if (userMessages.length > 0) {
        console.log('사용자 메시지 발견:', userMessages);
        await analyzeSpeechStyle(userMessages);
      }

      // 상대방의 최근 메시지가 있으면 의도 분석 수행
      if (latestOpponentMessage) {
        console.log('상대방 메시지 의도 분석 시작...', latestOpponentMessage);
        await analyzeOpponentIntent(latestOpponentMessage, extractedChat);
      } else {
        console.log('상대방 메시지를 찾지 못했습니다. extractedChat:', extractedChat);
      }

      // 상대방의 최근 메시지가 있으면 그것을, 없으면 전체 대화 내용을 입력 필드에 설정
      const messageToShow = latestOpponentMessage || extractedChat;
      if (messageToShow) {
        setInputMessage(messageToShow);
      }

      // 답변이 제대로 파싱되지 않은 경우 fallback
      if (replies.length === 0) {
        const fallbackReplies = [
          {
            id: 1,
            style: '친근한 스타일',
            text: text.split('\n')[0] || '이미지를 분석했지만 답변을 생성하지 못했습니다.'
          },
          {
            id: 2,
            style: '정중한 스타일',
            text: text.split('\n')[1] || '죄송합니다. 다시 시도해주세요.'
          },
          {
            id: 3,
            style: '유머러스한 스타일',
            text: text.split('\n')[2] || '음... 이 이미지가 좀 어렵네요! 😅'
          }
        ];
        setAiReplies(fallbackReplies);
      } else {
        setAiReplies(replies);
      }

      Alert.alert('완료', '채팅 내용을 분석하고 답변을 생성했습니다!');
      console.log('OCR 및 답변 생성 완료');
      
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('오류', `이미지 분석 중 오류가 발생했습니다.\n오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 다중 이미지 OCR 처리 함수
  const processMultipleImagesOCR = async (imageAssets = selectedImages) => {
    // 사용량 제한 확인
    if (!checkUsageLimit()) {
      return;
    }

    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('설정 필요', 'Google AI API 키를 설정해주세요.');
      return;
    }

    if (!imageAssets || imageAssets.length === 0) {
      Alert.alert('오류', '선택된 이미지가 없습니다.');
      return;
    }

    setLoading(true);
    try {
      console.log(`${imageAssets.length}개의 이미지 OCR 처리 시작...`);
      
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 모든 이미지를 Base64로 변환
      const imageData = await Promise.all(
        imageAssets.map(async (imageAsset) => {
          const base64Image = await convertImageToBase64(imageAsset.uri);
          const mimeType = getMimeTypeFromUri(imageAsset.uri);
          return {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          };
        })
      );

      // 사용자 프로필 정보
      const userProfile = userGender && userAge ? 
        `사용자 프로필: ${userGender === 'male' ? '남성' : userGender === 'female' ? '여성' : '성별 미설정'}, ${userAge}` : 
        '사용자 프로필: 미설정';

      const personalizedStyles = generatePersonalizedStyles();

      // 다중 이미지를 위한 OCR 프롬프트
      const ocrPrompt = `이 ${imageAssets.length}개의 채팅 스크린샷을 분석해서 다음을 수행해주세요:

${userProfile}

1. 모든 이미지에서 채팅 메시지를 정확히 읽어주세요.
2. 메시지의 위치를 파악해서 누가 보낸 메시지인지 구분해주세요:
   - 화면 왼쪽에 있는 메시지 = 상대방이 보낸 메시지 (내가 받은 메시지)
   - 화면 오른쪽에 있는 메시지 = 내가 보낸 메시지
3. 모든 이미지의 대화를 시간순으로 연결해서 전체 맥락을 파악해주세요.
4. 상대방이 보낸 가장 최근 메시지(마지막 이미지의 왼쪽에 위치한 마지막 메시지)를 찾아주세요.
5. 내가 보낸 모든 메시지들을 분석해서 말투 특성을 파악해주세요.
6. 그 상대방의 최근 메시지에 대해 내가 답장하는 메시지를 3가지 스타일로 생성해주세요.

중요사항:
- 실제 대화 내용만 추출하고, 시간, 날짜, 읽음 표시 등은 제외
- 상대방의 마지막 메시지가 명확하지 않으면 "마지막 메시지를 찾을 수 없음"이라고 표시
- 답장은 내가 상대방에게 보내는 메시지여야 함 (상대방의 관점이 아닌 내 관점에서)
- 이모지, 줄임말, 반말/존댓말 등 감지된 말투 특성을 반영
- 답장은 상대방이 보낸 메시지에 대한 응답이어야 함

**절대 주의**: 답장은 반드시 내가 상대방에게 보내는 메시지여야 합니다. 상대방이 나에게 보내는 메시지를 생성하면 안 됩니다.

답변 형식:
상대방 마지막 메시지: [메시지 내용]

내 말투 분석: [분석 결과]

${personalizedStyles.map(style => 
`${style.name}: [${style.name}을 반영한 내가 상대방에게 보낼 답장]`
).join('\n')}`;

      // 다중 이미지와 함께 AI 요청
      const contentParts = [ocrPrompt, ...imageData];
      const result = await model.generateContent(contentParts);
      const response = await result.response;
      const ocrResult = response.text();

      console.log('다중 이미지 OCR 결과:', ocrResult);

      // 응답 파싱 및 처리
      await parseAndDisplayAIResponse(ocrResult);
      
      // 성공적으로 답변을 생성했으면 사용량 증가
      await incrementDailyUsage();

    } catch (error) {
      console.error('다중 이미지 OCR 오류:', error);
      Alert.alert('오류', '이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 클립보드에서 텍스트 붙여넣기
  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInputMessage(text);
        Alert.alert('성공', '클립보드의 텍스트가 붙여넣어졌습니다.');
      } else {
        Alert.alert('알림', '클립보드가 비어있습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '클립보드에서 텍스트를 가져오는 중 오류가 발생했습니다.');
    }
  };

  // 텍스트 입력을 통한 AI 답변 생성
  const generateReplies = async () => {
    // 사용량 제한 확인
    if (!checkUsageLimit()) {
      return;
    }

    // 이미지가 있으면 다중 이미지 처리를 우선 실행
    if (selectedImages.length > 0) {
      await processMultipleImagesOCR();
      return;
    }

    if (!inputMessage.trim()) {
      Alert.alert('알림', '메시지를 입력하거나 채팅 스크린샷을 불러와주세요.');
      return;
    }

    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('설정 필요', 'Google AI API 키를 설정해주세요.');
      return;
    }

    setLoading(true);
    try {
      console.log('API 키 확인:', GOOGLE_AI_API_KEY.substring(0, 10) + '...');
      
      // 입력된 메시지가 대화 형태라면 사용자 말투 분석 시도
      const dialogPattern = /\n/; // 여러 줄이면 대화로 간주
      if (dialogPattern.test(inputMessage)) {
        const lines = inputMessage.split('\n').filter(line => line.trim());
        const possibleUserMessages = lines.filter((line, index) => {
          // 홀수 번째 줄이나 특정 패턴을 사용자 메시지로 간주
          return index % 2 === 1 || line.includes('나:') || line.includes('답장:');
        });
        
        if (possibleUserMessages.length > 0) {
          await analyzeSpeechStyle(possibleUserMessages);
        }
      }

      // 상대방 메시지 의도 분석
      console.log('상대방 메시지 의도 분석 시작...');
      await analyzeOpponentIntent(inputMessage, '');

      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const personalizedStyles = generatePersonalizedStyles();
      const userProfile = userGender && userAge ? 
        `${userGender === 'male' ? '남성' : userGender === 'female' ? '여성' : '성별 미설정'}, ${userAge}` : 
        '일반적인';

      const speechStyleNote = userSpeechStyle ? 
        `\n\n사용자의 평소 말투 특성: "${userSpeechStyle}"\n이 특성을 반영해서 답장을 작성해주세요.` : '';

      const intentNote = intentAnalysis ? 
        `\n\n상대방의 의도 분석: "${intentAnalysis}"\n이 분석 결과를 바탕으로 상대방이 원하는 반응을 고려해서 답장해주세요.` : '';

      const prompts = [
        `상대방이 다음과 같이 메시지를 보냈습니다: "${inputMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${personalizedStyles[0].prompt} 

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.`,
        
        `상대방이 다음과 같이 메시지를 보냈습니다: "${inputMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${personalizedStyles[1].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.`,
        
        `상대방이 다음과 같이 메시지를 보냈습니다: "${inputMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${personalizedStyles[2].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.`
      ];

      const replies = [];
      for (let i = 0; i < prompts.length; i++) {
        console.log(`프롬프트 ${i + 1} 실행 중...`);
        const result = await model.generateContent(prompts[i]);
        const response = await result.response;
        replies.push({
          id: i + 1,
          style: personalizedStyles[i].name,
          text: response.text()
        });
        console.log(`프롬프트 ${i + 1} 완료`);
      }

      setAiReplies(replies);
      
      // 성공적으로 답변을 생성했으면 사용량 증가
      await incrementDailyUsage();
      
      console.log('모든 답변 생성 완료');
    } catch (error) {
      console.error('상세 AI Error:', error);
      Alert.alert('오류', `AI 답변 생성 중 오류가 발생했습니다.\n오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // AI 응답 파싱 및 표시 함수
  const parseAndDisplayAIResponse = async (ocrResult) => {
    try {
      // 응답 파싱
      const lines = ocrResult.split('\n').filter(line => line.trim());
      let latestOpponentMessage = '';
      let userMessages = [];
      const replies = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('상대방 마지막 메시지:')) {
          latestOpponentMessage = line.replace('상대방 마지막 메시지:', '').trim();
        } else if (line.includes('내 말투 분석:')) {
          const analysisResult = line.replace('내 말투 분석:', '').trim();
          if (analysisResult) {
            setUserSpeechStyle(analysisResult);
          }
        } else if (line.includes('친근한 스타일:')) {
          replies.push({
            id: 1,
            style: '친근한 스타일',
            text: line.replace('친근한 스타일:', '').trim()
          });
        } else if (line.includes('정중한 스타일:')) {
          replies.push({
            id: 2,
            style: '정중한 스타일',
            text: line.replace('정중한 스타일:', '').trim()
          });
        } else if (line.includes('유머러스한 스타일:')) {
          replies.push({
            id: 3,
            style: '유머러스한 스타일',
            text: line.replace('유머러스한 스타일:', '').trim()
          });
        }
      }

      // 상대방의 최근 메시지가 있으면 의도 분석 수행
      if (latestOpponentMessage) {
        console.log('상대방 메시지 의도 분석 시작...', latestOpponentMessage);
        await analyzeOpponentIntent(latestOpponentMessage, '');
        setInputMessage(latestOpponentMessage);
      }

      // 답변이 제대로 파싱되지 않은 경우 fallback
      if (replies.length === 0) {
        const fallbackReplies = [
          {
            id: 1,
            style: '친근한 스타일',
            text: '이미지를 분석했지만 답변을 생성하지 못했습니다.'
          },
          {
            id: 2,
            style: '정중한 스타일',
            text: '죄송합니다. 다시 시도해주세요.'
          },
          {
            id: 3,
            style: '유머러스한 스타일',
            text: '음... 이 이미지가 좀 어렵네요! 😅'
          }
        ];
        setAiReplies(fallbackReplies);
      } else {
        setAiReplies(replies);
      }

      Alert.alert('완료', '채팅 내용을 분석하고 답변을 생성했습니다!');
      console.log('다중 이미지 OCR 및 답변 생성 완료');

    } catch (error) {
      console.error('AI 응답 파싱 오류:', error);
      Alert.alert('오류', '응답 처리 중 오류가 발생했습니다.');
    }
  };

  // 이미지 삭제 함수
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // 답변 복사하기
  const copyReply = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('성공', '답변이 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '복사 중 오류가 발생했습니다.');
    }
  };

  // 초기화 (사용자 설정은 제외)
  const resetAll = () => {
    setInputMessage('');
    setSelectedImages([]); // 다중 이미지 배열 초기화
    setAiReplies([]);
    setUserSpeechStyle(''); // 말투 분석 결과도 초기화
    setIntentAnalysis(''); // 의도 분석 결과도 초기화
    // 사용자 설정(userGender, userAge)은 유지
  };

  // 스플래시 화면 컴포넌트
  const SplashScreen = () => (
    <View style={styles.splashContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.slogan}>AI가 제안하는 3가지 답변 스타일</Text>
    </View>
  );

  // 프리미엄 모달 컴포넌트
  const PremiumModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showPremiumModal}
      onRequestClose={() => setShowPremiumModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text style={styles.modalTitle}>💎 프리미엄 구독</Text>
            <Text style={styles.modalSubtitle}>오늘의 무료 사용이 완료되었습니다</Text>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                🆓 무료: 하루 1회 사용{'\n'}
                💎 프리미엄: 무제한 사용
              </Text>
              
              <View style={styles.pricingBox}>
                <Text style={styles.priceText}>월 2,000원</Text>
                <Text style={styles.priceDescription}>언제든지 해지 가능</Text>
              </View>
              
              <View style={styles.paymentMethods}>
                <Text style={styles.paymentTitle}>결제 방법 선택</Text>
                
                <TouchableOpacity 
                  style={styles.paymentButton} 
                  onPress={() => handlePremiumPurchase('Apple Pay')}
                  disabled={loading}
                >
                  <Text style={styles.paymentButtonText}>🍎 Apple Pay</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.paymentButton} 
                  onPress={() => handlePremiumPurchase('Google Pay')}
                  disabled={loading}
                >
                  <Text style={styles.paymentButtonText}>🔴 Google Pay</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.paymentButton} 
                  onPress={() => handlePremiumPurchase('네이버페이')}
                  disabled={loading}
                >
                  <Text style={styles.paymentButtonText}>🟢 네이버페이</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.paymentButton} 
                  onPress={() => handlePremiumPurchase('삼성페이')}
                  disabled={loading}
                >
                  <Text style={styles.paymentButtonText}>💙 삼성페이</Text>
                </TouchableOpacity>
              </View>
              
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFD4B3" />
                  <Text style={styles.loadingText}>결제 처리 중...</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowPremiumModal(false)}
                disabled={loading}
              >
                <Text style={styles.modalCloseText}>나중에</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // 스플래시 화면 표시 중이면 스플래시 화면 반환
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerText} numberOfLines={1} adjustsFontSizeToFit>AI가 3가지 스타일로 답변을 제안해드립니다</Text>
        </View>
      </Animated.View>
      
      <Animated.ScrollView 
        style={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >

      {/* 사용자 설정 섹션 */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.settingsHeader} 
          onPress={() => setShowSettings(!showSettings)}
        >
          <Text style={styles.settingsTitle}>⚙️ 사용자 설정</Text>
          <Text style={styles.toggleText}>{showSettings ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {showSettings && (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsLabel}>성별</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.optionButton, userGender === 'male' && styles.selectedButton]}
                onPress={() => handleGenderChange('male')}
              >
                <Text style={[styles.optionText, userGender === 'male' && styles.selectedText]}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionButton, userGender === 'female' && styles.selectedButton]}
                onPress={() => handleGenderChange('female')}
              >
                <Text style={[styles.optionText, userGender === 'female' && styles.selectedText]}>여성</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsLabel}>나이대</Text>
            <View style={styles.buttonGroup}>
              {['10대', '20대', '30대', '40대', '50대이상'].map((age) => (
                <TouchableOpacity 
                  key={age}
                  style={[styles.ageButton, userAge === age && styles.selectedButton]}
                  onPress={() => handleAgeChange(age)}
                >
                  <Text style={[styles.optionText, userAge === age && styles.selectedText]}>{age}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.profileSummary}>
              <Text style={styles.profileText}>
                현재 설정: {userGender ? (userGender === 'male' ? '남성' : '여성') : '성별 미설정'}, {userAge || '나이대 미설정'}
              </Text>
              {userSpeechStyle && (
                <Text style={styles.speechStyleText}>
                  💬 분석된 말투: {userSpeechStyle}
                </Text>
              )}
              
              {/* 구독 상태 표시 */}
              <View style={styles.subscriptionStatus}>
                <Text style={[styles.subscriptionText, isPremium ? styles.premiumText : styles.freeText]}>
                  {isPremium ? '💎 프리미엄 구독중' : '🆓 무료 버전'}
                </Text>
                {!isPremium && (
                  <Text style={styles.usageText}>
                    오늘 사용: {dailyUsageCount}/1회
                  </Text>
                )}
                {!isPremium && (
                  <TouchableOpacity 
                    style={styles.upgradeButton} 
                    onPress={() => setShowPremiumModal(true)}
                  >
                    <Text style={styles.upgradeButtonText}>프리미엄 구독하기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 이미지 선택 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 채팅 스크린샷 선택</Text>
        <TouchableOpacity 
          style={[styles.button, selectedImages.length >= 5 && styles.buttonDisabled]} 
          onPress={pickImage}
          disabled={selectedImages.length >= 5}
        >
          <Text style={styles.buttonText}>
            스크린샷 추가 ({selectedImages.length}/5)
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <View style={styles.imageGrid}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.imageIndexText}>{index + 1}</Text>
              </View>
            ))}
          </View>
        )}

        {selectedImages.length > 0 && (
          <Text style={styles.imageText}>
            ✅ {selectedImages.length}개의 이미지가 선택되었습니다
            {'\n'}💡 아래 "AI 답변 생성하기" 버튼을 눌러 분석을 시작하세요
          </Text>
        )}
      </View>

      {/* 텍스트 입력 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💭 직접 메시지 입력</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="답장할 메시지를 입력하세요..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline={true}
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.pasteButton} onPress={pasteFromClipboard}>
            <Text style={styles.pasteButtonText}>붙여넣기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI 답변 생성 버튼 */}
      <TouchableOpacity 
        style={[styles.generateButton, loading && styles.disabledButton]} 
        onPress={generateReplies}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#333333" />
        ) : (
          <Text style={styles.generateButtonText}>
            {selectedImages.length > 0 ? `${selectedImages.length}개 스크린샷 분석하고 답변 생성` : '답변 생성하기'}
          </Text>
        )}
      </TouchableOpacity>

      {/* AI 답변 결과 */}
      {aiReplies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 AI 답변 추천</Text>
          
          {/* 상대방 의도 분석 결과 표시 (토글 가능) */}
          {intentAnalysis && (
            <View style={styles.intentAnalysisSection}>
              <TouchableOpacity 
                style={styles.intentAnalysisHeader} 
                onPress={() => setShowIntentAnalysis(!showIntentAnalysis)}
              >
                <Text style={styles.intentAnalysisHeaderText}>🎯 상대방 의도 분석</Text>
                <Text style={styles.intentToggleText}>{showIntentAnalysis ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showIntentAnalysis && (
                <View style={styles.intentAnalysisContainer}>
                  <Text style={styles.intentAnalysisText}>{intentAnalysis}</Text>
                </View>
              )}
            </View>
          )}
          
          {aiReplies.map((reply) => (
            <View key={reply.id} style={styles.replyContainer}>
              <Text style={styles.replyStyle}>{reply.style}</Text>
              <Text style={styles.replyText}>{reply.text}</Text>
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={() => copyReply(reply.text)}
              >
                <Text style={styles.copyButtonText}>복사</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 초기화 버튼 */}
      <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
        <Text style={styles.resetButtonText}>초기화</Text>
      </TouchableOpacity>
      </Animated.ScrollView>
      
      {/* 프리미엄 모달 */}
      <PremiumModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    marginBottom: 15,
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 10,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 70,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    paddingHorizontal: 10,
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
    flexShrink: 0,
  },
  headerText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 1,
    flex: 0,
    maxWidth: '80%',
  },
  section: {
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    margin: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(99, 99, 102, 0.2)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  button: {
    backgroundColor: '#B3D9FF',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    shadowOpacity: 0,
    elevation: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 42, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 99, 102, 0.5)',
  },
  textInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
  },
  pasteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 10,
    marginRight: 5,
    justifyContent: 'center',
    minHeight: 42,
  },
  pasteButtonText: {
    color: '#B3D9FF',
    fontSize: 17,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#FFD4B3',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    minHeight: 56,
    shadowColor: '#FFD4B3',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  generateButtonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#555',
    shadowOpacity: 0,
    elevation: 0,
  },
  replyContainer: {
    backgroundColor: 'rgba(44, 44, 46, 0.9)',
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(99, 99, 102, 0.3)',
  },
  replyStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD4B3',
    marginBottom: 12,
  },
  replyText: {
    fontSize: 17,
    color: '#ffffff',
    lineHeight: 26,
  },
  copyButton: {
    backgroundColor: '#C3F0C3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: 'flex-end',
  },
  copyButtonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FFCCCB',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 40,
    minHeight: 50,
  },
  resetButtonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(40, 40, 42, 0.6)',
    borderRadius: 12,
    minHeight: 48,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  toggleText: {
    fontSize: 16,
    color: '#B3D9FF',
    fontWeight: '600',
  },
  settingsContainer: {
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 99, 102, 0.2)',
  },
  settingsLabel: {
    fontSize: 14,
    color: '#a1a1a6',
    marginBottom: 8,
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  optionButton: {
    backgroundColor: 'rgba(230, 230, 240, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(200, 200, 215, 0.5)',
  },
  ageButton: {
    backgroundColor: 'rgba(255, 240, 240, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 200, 0.5)',
  },
  optionText: {
    color: '#444444',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedButton: {
    backgroundColor: '#E6E6FA',
    borderColor: '#DDA0DD',
    shadowColor: '#DDA0DD',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedText: {
    color: '#333333',
    fontWeight: '600',
  },
  profileSummary: {
    backgroundColor: 'rgba(179, 217, 255, 0.15)',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileText: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  speechStyleText: {
    fontSize: 12,
    color: '#B3D9FF',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  intentAnalysisContainer: {
    backgroundColor: 'rgba(44, 44, 46, 0.6)',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 212, 179, 0.3)',
  },
  intentAnalysisSection: {
    backgroundColor: 'rgba(255, 212, 179, 0.1)',
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 212, 179, 0.3)',
    overflow: 'hidden',
  },
  intentAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 212, 179, 0.15)',
  },
  intentAnalysisHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD4B3',
    letterSpacing: 0.3,
  },
  intentToggleText: {
    fontSize: 16,
    color: '#FFD4B3',
    fontWeight: '700',
  },
  intentAnalysisText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 204, 203, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  removeImageText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  imageIndexText: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 24,
  },
  imageText: {
    color: '#B3D9FF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 스플래시 화면 스타일
  splashContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#87CEEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#87CEEB',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  slogan: {
    color: '#FFD4B3',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  
  // 프리미엄 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 99, 102, 0.3)',
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD4B3',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#B3D9FF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  pricingBox: {
    backgroundColor: 'rgba(255, 212, 179, 0.15)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 212, 179, 0.3)',
    alignItems: 'center',
    width: '100%',
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD4B3',
    marginBottom: 5,
  },
  priceDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
  },
  paymentMethods: {
    width: '100%',
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  paymentButton: {
    backgroundColor: '#B3D9FF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    width: '100%',
  },
  paymentButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  loadingText: {
    color: '#FFD4B3',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 99, 102, 0.3)',
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // 구독 상태 스타일
  subscriptionStatus: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  premiumText: {
    color: '#FFD4B3',
  },
  freeText: {
    color: '#B3D9FF',
  },
  usageText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: '#FFD4B3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#FFD4B3',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  upgradeButtonText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '600',
  },
});