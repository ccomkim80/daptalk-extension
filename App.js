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
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Enter your Google AI API key here (recommended to use environment variables later)
const GOOGLE_AI_API_KEY = 'AIzaSyCPOkqRbG_H-Uybu5S25uHw-qkrTiAJ0IQ';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper functions moved outside component for better performance
// Function to convert image to Base64
const convertImageToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove 'data:image/jpeg;base64,' part
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Error occurred while converting image.');
  }
};

// Determine MIME type from file extension
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
      return 'image/jpeg'; // Default value
  }
};

// Chat Assistant App Component
function DapTalkApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]); // Changed to multiple image array
  const [aiReplies, setAiReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Mode related state (newly added)
  const [isRomanceMode, setIsRomanceMode] = useState(false);
  const [opponentGender, setOpponentGender] = useState(''); // Opponent gender in dating mode
  
  // User profile settings
  const [userGender, setUserGender] = useState('');
  const [userAge, setUserAge] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showIntentAnalysis, setShowIntentAnalysis] = useState(false); // Whether to show intent analysis
  const [userSpeechStyle, setUserSpeechStyle] = useState(''); // User speech style analysis result
  const [intentAnalysis, setIntentAnalysis] = useState(''); // Opponent intent analysis result

  // Animation values
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

  // Card animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Add new state
  const [extractedMessages, setExtractedMessages] = useState([]); // Extracted chat messages
  const [showChatEdit, setShowChatEdit] = useState(false); // Whether to show chat edit section
  const [editingMessageIndex, setEditingMessageIndex] = useState(-1); // Index of message being edited

  useEffect(() => {
    // Splash screen timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1000); // Go to main screen after 1 second

    // Load saved user settings on app start
    loadUserSettings();

    return () => clearTimeout(splashTimer);
  }, []);

  // Function to save user settings to AsyncStorage
  const saveUserSettings = async (gender, age) => {
    try {
      const settings = {
        gender: gender,
        age: age
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  // Function to load user settings from AsyncStorage
  const loadUserSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setUserGender(settings.gender || '');
        setUserAge(settings.age || '');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Gender change handler
  const handleGenderChange = async (gender) => {
    setUserGender(gender);
    await saveUserSettings(gender, userAge);
  };

  // Age change handler
  const handleAgeChange = async (age) => {
    setUserAge(age);
    await saveUserSettings(userGender, age);
  };

  // Mode toggle handler
  const toggleMode = () => {
    setIsRomanceMode(!isRomanceMode);
    // Reset answers when mode changes
    setAiReplies([]);
    setIntentAnalysis('');
  };

  // Convert Korean age groups to English
  const getEnglishAgeGroup = (koreanAge) => {
    if (!koreanAge) return 'Age group not set';
    const ageMap = {
      '10대': 'Teens',
      '20대': '20s',
      '30대': '30s',
      '40대': '40s',
      '50대이상': '50s+'
    };
    return ageMap[koreanAge] || koreanAge;
  };

  // Opponent gender change handler (dating mode)
  const handleOpponentGenderChange = (gender) => {
    setOpponentGender(gender);
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

  // Speech style by age group
  const getAgeStyle = (age) => {
    switch (age) {
      case 'teens':
        return 'lively and trendy for teens';
      case '20s':
        return 'active and modern for twenties';
      case '30s':
        return 'stable and sophisticated for thirties';
      case '40s':
        return 'mature and classy for forties';
      case '50plus':
        return 'calm and wise for 50s and above';
      default:
        return 'natural and appropriate';
    }
  };

  // Generate personalized speech styles based on user profile (optimized)
  const generatePersonalizedStyles = () => {
    const baseContext = {
      genderStyle: userGender === 'male' ? 'masculine and' : userGender === 'female' ? 'feminine and' : '',
      ageStyle: getAgeStyle(userAge),
      speechStyleGuide: userSpeechStyle ? `User's existing speech characteristics: "${userSpeechStyle}". Reflecting these characteristics` : '',
      intentGuide: intentAnalysis ? `Opponent's intent analysis: "${intentAnalysis}". Responding appropriately to this intent` : ''
    };

    if (isRomanceMode) {
      return generateRomanceStyles(baseContext);
    }
    
    return generateFriendlyStyles(baseContext);
  };

  // Romance mode styles (separated for better organization)
  const generateRomanceStyles = (context) => {
    const { genderStyle, ageStyle, speechStyleGuide, intentGuide } = context;
    const opponentInfo = opponentGender ? `The opponent is ${opponentGender === 'male' ? 'male' : 'female'}.` : '';
    const genderSpecificGuide = userGender === 'male' && opponentGender === 'female' ? 
      'Use natural expressions that men use for women.' :
      userGender === 'female' && opponentGender === 'male' ?
      'Use natural expressions that women use for men.' : '';
    
    const basePrompt = `${speechStyleGuide} ${intentGuide} ${genderStyle} ${ageStyle} ${opponentInfo} ${genderSpecificGuide}`;
    const criticalNote = '**CRITICAL**: You MUST write ONLY the actual message text. Do NOT write any analysis or explanations.';
    
    return [
      {
        name: 'Interest Expression Style',
        prompt: `${basePrompt} Write a reply that subtly shows romantic interest and curiosity. Use warm, engaging language. ${criticalNote}`
      },
      {
        name: 'Attractive Style',
        prompt: `${basePrompt} Write a reply that showcases your personality and charm. Be confident and engaging. ${criticalNote}`
      },
      {
        name: 'Intimacy Building Style',
        prompt: `${basePrompt} Write a reply that creates emotional connection. Share something personal or find common ground. ${criticalNote}`
      },
      {
        name: 'Careful Rejection Style',
        prompt: `${basePrompt} Politely decline their advance while preserving dignity and friendship possibility. ${criticalNote}`
      }
    ];
  };

  // Friendly mode styles (separated for better organization)
  const generateFriendlyStyles = (context) => {
    const { genderStyle, ageStyle, speechStyleGuide, intentGuide } = context;
    const basePrompt = `${speechStyleGuide} ${intentGuide} ${genderStyle} ${ageStyle}`;
    const criticalNote = '**CRITICAL**: You MUST write ONLY the actual message text. Do NOT write any analysis or explanations.';
    
    return [
      {
        name: 'Friendly Style',
        prompt: `${basePrompt} Write a casual, friendly reply using informal language like talking to a close friend. ${criticalNote}`
      },
      {
        name: 'Polite Style', 
        prompt: `${basePrompt} Write a formal, respectful reply using polite language and honorifics. ${criticalNote}`
      },
      {
        name: 'Humorous Style',
        prompt: `${basePrompt} Write a funny, witty reply that will make the other person laugh or smile. ${criticalNote}`
      },
      {
        name: 'Polite Rejection',
        prompt: `${basePrompt} Write a polite but clear rejection. Be gentle but firm in your refusal. ${criticalNote}`
      }
    ];
  };

  // User speech style analysis function
  const analyzeSpeechStyle = async (userMessages) => {
    if (!GOOGLE_AI_API_KEY || !userMessages || userMessages.length === 0) {
      return '';
    }

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const analysisPrompt = `Please analyze the following messages to identify the user's speech characteristics:

User messages:
${userMessages.join('\n')}

Please analyze the following aspects:
1. Formal/informal language usage patterns
2. Sentence length and structure (short and concise vs. long and detailed)
3. Emoticon/emoji usage frequency and style
4. Emotional expression style (direct, subtle, humorous)
5. Special verbal habits or endings
6. Overall tone (friendly, polite, active, calm, etc.)

Based on the analysis results, please summarize this user's speech characteristics in one sentence.
Example: "Short and concise informal speech with frequent emoji use and a friendly, active tone" or "Polite formal language with a calm and courteous tone"`;

      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisResult = response.text().trim();
      
      console.log('Speech analysis result:', analysisResult);
      setUserSpeechStyle(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('Speech analysis error:', error);
      return '';
    }
  };

  // Opponent intent analysis function (dating mode support)
  const analyzeOpponentIntent = async (opponentMessage, conversationContext = '', recentMessages = []) => {
    if (!GOOGLE_AI_API_KEY || !opponentMessage) {
      return '';
    }

    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const genderContext = isRomanceMode && opponentGender ? 
        `\nOpponent's gender: ${opponentGender === 'male' ? 'male' : 'female'}\nPlease analyze considering ${opponentGender === 'male' ? 'male psychology and communication style' : 'female psychology and communication style'}.` : '';

      const modeContext = isRomanceMode ? 
        '\nThis is a conversation in a romantic context. Please focus on analyzing the opponent\'s emotions, affection level, relationship development intentions, etc.' : '';

      const recentContext = recentMessages.length > 0 ? 
        `\nRecent conversation flow (chronological):\n${recentMessages.join('\n')}\n\nBased on this conversation flow, please identify the opponent's current emotional changes and intentions.` : '';

      const intentPrompt = `Please analyze the following message to understand the opponent's intentions and emotional state:

Opponent's recent message: "${opponentMessage}"${genderContext}${modeContext}${recentContext}

${conversationContext ? `Overall conversation context:\n${conversationContext}` : ''}

Please analyze from the following perspectives:
${isRomanceMode ? `
1. **Romantic Intent**: Expressing affection, relationship development intentions, meeting proposals, keeping distance, etc.
2. **Emotional State**: What mood are they in? (excitement, affection, interest, anxiety, disappointment, etc.)
3. **Communication Style**: ${opponentGender === 'male' ? 'Male-specific' : opponentGender === 'female' ? 'Female-specific' : ''} communication style (direct, indirect, suggestive, testing, etc.)
4. **Expected Response**: What kind of answer do they want? (interest expression, affection confirmation, meeting arrangement, deep conversation, etc.)
5. **Relationship Stage**: What level of intimacy do they currently want? (exploration stage, wanting to get closer, deeper relationship, etc.)
6. **Conversation Flow Change**: How have emotions or attitudes changed in recent conversations?` : `
1. **Main Intent**: What do they want? (information request, emotional sharing, meeting proposal, simple conversation, help request, etc.)
2. **Emotional State**: What mood are they in? (joy, sadness, anger, worry, interest, boredom, tiredness, etc.)
3. **Conversation Style**: How are they communicating? (direct, indirect, humorous, serious, etc.)
4. **Expected Response**: What kind of answer do they want? (empathy, advice, information, jokes, planning, etc.)
5. **Urgency**: How important or urgent is it? (very urgent, normal, simple chat)
6. **Conversation Flow Change**: How have interests or emotions changed in recent conversations?`}

Please summarize the analysis results in the following format:
"${isRomanceMode ? 'Romantic Intent' : 'Intent'}: [main intention] | Emotion: [emotional state] | Expected Response: [desired response type] | Conversation Flow: [recent changes]"

Example: "${isRomanceMode ? 'Romantic Intent: Affection confirmation and meeting proposal | Emotion: Excitement with slight nervousness | Expected Response: Positive interest expression and meeting response | Conversation Flow: Becoming increasingly more active' : 'Intent: Meeting proposal | Emotion: Anticipation with slight anxiety | Expected Response: Positive answer and concrete planning | Conversation Flow: Evolved from casual conversation to specific proposals'}"`;

      const result = await model.generateContent(intentPrompt);
      const response = await result.response;
      const analysisResult = response.text().trim();
      
      console.log('Opponent intent analysis result:', analysisResult);
      setIntentAnalysis(analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('Intent analysis error:', error);
      return '';
    }
  };

  // Image selection function (with duplicate removal and integration)
  const pickImage = async () => {
    try {
      // Allow up to 2 images only
      if (selectedImages.length >= 2) {
        Alert.alert('Notice', 'You can upload up to 2 images only.');
        return;
      }

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission is needed to access photos.');
        return;
      }

      // Select image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        const newImage = result.assets[0];
        setSelectedImages(prev => [...prev, newImage]);
        
        Alert.alert('Success', 'Image added. Press "Generate AI Reply" button to start analysis.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while selecting image.');
      console.error('Image picker error:', error);
    }
  };

  // Image deletion function
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Copy response function
  const copyReply = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copy Complete', 'Answer has been copied to clipboard.');
    } catch (error) {
      Alert.alert('Error', 'An error occurred while copying the answer.');
    }
  };

  // Paste text from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInputMessage(text);
        Alert.alert('Success', 'Clipboard text has been pasted.');
      } else {
        Alert.alert('Notice', 'Clipboard is empty.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while getting text from clipboard.');
    }
  };

  // Image OCR processing and AI reply generation (modified)
  const processImageOCR = async (imageAsset) => {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('Setup Required', 'Please set up your Google AI API key.');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting image OCR processing...');
      
      // Convert image to Base64
      const base64Image = await convertImageToBase64(imageAsset.uri);
      
      // Set correct MIME type
      const mimeType = getMimeTypeFromUri(imageAsset.uri);
      console.log('Detected MIME type:', mimeType);
      
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // User profile information
      const userProfile = userGender && userAge ? 
        `User profile: ${userGender === 'male' ? 'Male' : userGender === 'female' ? 'Female' : 'Gender not set'}, ${userAge}` : 
        'User profile: Not set';

      const personalizedStyles = generatePersonalizedStyles();

      // OCR and conversation analysis prompt (color-based enhanced)
      const ocrPrompt = `Please analyze this chat screenshot and perform the following tasks:

${userProfile}
${isRomanceMode ? `Dating Mode: User is ${userGender === 'male' ? 'male' : 'female'}, and other person is ${opponentGender === 'male' ? 'male' : 'female'}.` : ''}

**VERY IMPORTANT MESSAGE IDENTIFICATION RULES - Follow exactly:**

1. **Identify sender by speech bubble color (Primary criteria):**
   - **Other person's messages**: Gray, white, light gray and other achromatic speech bubbles
   - **My messages**: Blue, green, yellow, pink and other chromatic speech bubbles

2. **Identify sender by position and layout (Secondary criteria):**
   - **Other person's messages**: Left-aligned on screen + name/profile picture shown
   - **My messages**: Right-aligned on screen + no name displayed

3. **Comprehensive judgment criteria (in priority order):**
   ① **Speech bubble color**: Gray/white = other person, blue/green/other colors = me
   ② **Screen position**: Left = other person, right = me
   ③ **Name display**: Name shown = other person, no name = me
   ④ **Profile picture**: Profile shown = other person, no profile = me

4. **Specific color classification:**
   - Other person: #FFFFFF, #F0F0F0, #E5E5E5, #CCCCCC, #D3D3D3 etc. gray/white series
   - Me: #007AFF, #34C759, #FF9500, #FF2D92, #5856D6 etc. iOS default colors
   - Me: #1877F2, #128C7E, #25D366 etc. app-specific brand colors

5. **Handling ambiguous cases:**
   - If color is ambiguous, judge by position (left/right)
   - If position is also ambiguous, judge by name display
   - If everything is ambiguous, mark as "Cannot determine"

**Perform analysis step by step:**

STEP 1: Accurately identify the color of each message bubble
STEP 2: Check the position of each message bubble on screen (left/right)
STEP 3: Check whether name or profile picture is displayed
STEP 4: Determine sender based on above criteria

**Must respond in the following format:**

=== Color and Position Analysis ===
Message 1: [Color: gray/blue etc.] + [Position: left/right] + [Name: yes/no] → [Judgment: other person/me]
Message 2: [Color: gray/blue etc.] + [Position: left/right] + [Name: yes/no] → [Judgment: other person/me]
(Analyze all messages)

=== Extracted Conversation Content ===
Other person: [First message sent by other person]
Me: [First message sent by me]
Other person: [Second message sent by other person]
Me: [Second message sent by me]
(List all messages chronologically like this)

=== Other Person's Latest Message ===
[Last message sent by other person]

=== My Speech Style Analysis ===
[Analysis of user's speech style characteristics]

=== ${personalizedStyles[0].name} ===
[${personalizedStyles[0].name} reply]

=== ${personalizedStyles[1].name} ===
[${personalizedStyles[1].name} reply]

=== ${personalizedStyles[2].name} ===
[${personalizedStyles[2].name} reply]

=== ${personalizedStyles[3].name} ===
[${personalizedStyles[3].name} reply]`;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      };

      console.log('Requesting Google AI...');
      const result = await model.generateContent([ocrPrompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('OCR result:', text);

      // Response parsing (significantly modified)
      const sections = text.split('===').map(section => section.trim());
      console.log('Parsed sections:', sections);
      
      let extractedChat = '';
      let latestOpponentMessage = '';
      let userMessages = [];
      const replies = [];
      const messages = [];

      // Process each section sequentially
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        if (section.includes('Extracted Conversation Content')) {
          // Next section contains conversation content
          extractedChat = sections[i + 1] || '';
          console.log('Extracted conversation content:', extractedChat);
          
          // Parse conversation content line by line
          if (extractedChat) {
            const chatLines = extractedChat.split('\n').filter(line => line.trim());
            console.log('Chat lines:', chatLines);
            
            chatLines.forEach((line, index) => {
              const trimmedLine = line.trim();
              if (trimmedLine.includes('Other person:') || trimmedLine.includes('Me:')) {
                const isUser = trimmedLine.includes('Me:');
                const messageText = trimmedLine.replace(/^(Other person:|Me:)\s*/, '').trim();
                
                if (messageText && messageText.length > 0) {
                  const newMessage = {
                    id: `ocr_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                    sender: isUser ? 'user' : 'opponent',
                    text: messageText,
                    timestamp: Date.now() + index
                  };
                  messages.push(newMessage);
                  console.log('Message added:', newMessage);
                  
                  if (isUser) {
                    userMessages.push(messageText);
                  }
                }
              }
            });
          }
        } else if (section.includes('Latest Message from Other Person')) {
          latestOpponentMessage = sections[i + 1]?.trim() || '';
          console.log('Latest opponent message:', latestOpponentMessage);
        } else if (section.includes('My Speech Style Analysis')) {
          const analysisResult = sections[i + 1]?.trim() || '';
          if (analysisResult) {
            setUserSpeechStyle(analysisResult);
            console.log('Speech style analysis result:', analysisResult);
          }
        } else if (section.includes(personalizedStyles[0].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `reply_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`, // 고유한 ID 생성
              style: personalizedStyles[0].name,
              text: replyText
            });
          }
        } else if (section.includes(personalizedStyles[1].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `reply_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`, // 고유한 ID 생성
              style: personalizedStyles[1].name,
              text: replyText
            });
          }
        } else if (section.includes(personalizedStyles[2].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `reply_${Date.now()}_3_${Math.random().toString(36).substr(2, 9)}`, // 고유한 ID 생성
              style: personalizedStyles[2].name,
              text: replyText
            });
          }
        } else if (section.includes(personalizedStyles[3].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `reply_${Date.now()}_4_${Math.random().toString(36).substr(2, 9)}`, // 고유한 ID 생성
              style: personalizedStyles[3].name,
              text: replyText
            });
          }
        }
      }

      console.log('Parsed messages:', messages);
      console.log('Parsed replies:', replies);

      // Update extracted message state
      if (messages.length > 0) {
        setExtractedMessages(messages);
        setShowChatEdit(true); // Automatically expand chat editing section
        console.log('extractedMessages state updated:', messages);
      } else {
        // fallback: attempt simple parsing
        console.log('Message parsing failed, attempting fallback');
        const lines = text.split('\n').filter(line => line.trim());
        const fallbackMessages = [];
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if ((trimmedLine.includes('Other person') || trimmedLine.includes('Me:')) && !trimmedLine.includes('===')) {
            const isUser = trimmedLine.includes('Me:');
            const messageText = trimmedLine.replace(/^(Other person:|Me:)\s*/, '').trim();
            
            if (messageText && messageText.length > 0) {
              fallbackMessages.push({
                id: `fallback_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                sender: isUser ? 'user' : 'opponent',
                text: messageText,
                timestamp: Date.now() + index
              });
            }
          }
        });
        
        if (fallbackMessages.length > 0) {
          setExtractedMessages(fallbackMessages);
          setShowChatEdit(true);
          console.log('Fallback messages set:', fallbackMessages);
        } else {
          // Last fallback: Create test message
          const testMessages = [
            {
              id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
              sender: 'opponent',
              text: 'Failed to extract conversation from screenshot. Please edit manually.',
              timestamp: Date.now()
            }
          ];
          setExtractedMessages(testMessages);
          setShowChatEdit(true);
          console.log('Test message set:', testMessages);
        }
      }

      // Perform speech style analysis if user messages exist
      if (userMessages.length > 0) {
        console.log('User messages found:', userMessages);
        await analyzeSpeechStyle(userMessages);
      }

      // Perform intent analysis if opponent's latest message exists
      if (latestOpponentMessage) {
        console.log('Starting opponent message intent analysis...', latestOpponentMessage);
        await analyzeOpponentIntent(latestOpponentMessage, extractedChat, []);
        setInputMessage(latestOpponentMessage);
      }

      // Response setting
      if (replies.length > 0) {
        setAiReplies(replies);
      } else {
        // fallback responses
        const personalizedStyles = generatePersonalizedStyles();
        const fallbackReplies = [
          {
            id: `fallback_reply_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            style: personalizedStyles[0].name,
            text: isRomanceMode ? 'Image analyzed but failed to generate romance response.' : 'Image analyzed but failed to generate response.'
          },
          {
            id: `fallback_reply_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            style: personalizedStyles[1].name,
            text: isRomanceMode ? 'Sorry. Please try again. 💕' : 'Sorry. Please try again.'
          },
          {
            id: `fallback_reply_${Date.now()}_3_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            style: personalizedStyles[2].name,
            text: isRomanceMode ? 'Hmm... this image is a bit difficult! 😊' : 'Hmm... this image is a bit difficult! 😅'
          },
          {
            id: `fallback_reply_${Date.now()}_4_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            style: personalizedStyles[3].name,
            text: isRomanceMode ? 'Failed to generate polite decline response.' : 'Failed to generate polite decline response.'
          }
        ];
        setAiReplies(fallbackReplies);
      }

      Alert.alert('Complete', 'Chat content has been analyzed and response generated!');
      console.log('OCR and response generation completed');
      
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', `An error occurred during image analysis.\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Multiple image OCR processing function (modified)
  const processMultipleImagesOCR = async (imageAssets = selectedImages) => {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('Setup Required', 'Please set up your Google AI API key.');
      return;
    }

    if (!imageAssets || imageAssets.length === 0) {
      Alert.alert('Error', 'No image selected.');
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

      // User profile information
      const userProfile = userGender && userAge ? 
        `User profile: ${userGender === 'male' ? 'Male' : userGender === 'female' ? 'Female' : 'Gender not set'}, ${userAge}` : 
        'User profile: Not set';

      const personalizedStyles = generatePersonalizedStyles();

      // OCR prompt for multiple images
      const ocrPrompt = `Please analyze these ${imageAssets.length} chat screenshots and perform the following tasks:

${userProfile}
${isRomanceMode ? `Dating Mode: User is ${userGender === 'male' ? 'male' : 'female'}, and other person is ${opponentGender === 'male' ? 'male' : 'female'}.` : ''}

**VERY IMPORTANT MESSAGE IDENTIFICATION RULES - Follow exactly:**

1. **Identify sender by speech bubble color (Primary criteria):**
   - **Other person's messages**: Gray, white, light gray and other achromatic speech bubbles
   - **My messages**: Blue, green, yellow, pink and other chromatic speech bubbles

2. **Identify sender by position and layout (Secondary criteria):**
   - **Other person's messages**: Left-aligned on screen + name/profile picture shown
   - **My messages**: Right-aligned on screen + no name displayed

**Must respond in the following format:**

=== Extracted Conversation Content ===
Other person: [First message sent by other person]
Me: [First message sent by me]
Other person: [Second message sent by other person]
Me: [Second message sent by me]

=== Other Person's Latest Message ===
[Last message sent by other person]

=== My Speech Style Analysis ===
[Analysis of user's speech style characteristics]

=== ${personalizedStyles[0].name} ===
[${personalizedStyles[0].name} reply]

=== ${personalizedStyles[1].name} ===
[${personalizedStyles[1].name} reply]

=== ${personalizedStyles[2].name} ===
[${personalizedStyles[2].name} reply]

=== ${personalizedStyles[3].name} ===
[${personalizedStyles[3].name} reply]`;

      // 다중 이미지와 함께 AI 요청
      const contentParts = [ocrPrompt, ...imageData];
      const result = await model.generateContent(contentParts);
      const response = await result.response;
      const ocrResult = response.text();

      console.log('다중 이미지 OCR 결과:', ocrResult);

      // 응답 파싱 및 처리
      const sections = ocrResult.split('===').map(section => section.trim());
      console.log('파싱된 섹션들:', sections);
      
      let extractedChat = '';
      let latestOpponentMessage = '';
      let userMessages = [];
      const replies = [];
      const messages = [];

      // 각 섹션을 순차적으로 처리
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        if (section.includes('Extracted Conversation Content')) {
          extractedChat = sections[i + 1] || '';
          console.log('Extracted conversation content:', extractedChat);
          
          if (extractedChat) {
            const chatLines = extractedChat.split('\n').filter(line => line.trim());
            console.log('Chat lines:', chatLines);
            
            chatLines.forEach((line, index) => {
              const trimmedLine = line.trim();
              if (trimmedLine.includes('Other person:') || trimmedLine.includes('Me:')) {
                const isUser = trimmedLine.includes('Me:');
                const messageText = trimmedLine.replace(/^(Other person:|Me:)\s*/, '').trim();
                
                if (messageText && messageText.length > 0) {
                  const newMessage = {
                    id: `multi_ocr_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                    sender: isUser ? 'user' : 'opponent',
                    text: messageText,
                    timestamp: Date.now() + index
                  };
                  messages.push(newMessage);
                  console.log('Message added:', newMessage);
                  
                  if (isUser) {
                    userMessages.push(messageText);
                  }
                }
              }
            });
          }
        } else if (section.includes('Other Person\'s Latest Message')) {
          latestOpponentMessage = sections[i + 1]?.trim() || '';
          console.log('Latest opponent message:', latestOpponentMessage);
        } else if (section.includes('My Speech Style Analysis')) {
          const analysisResult = sections[i + 1]?.trim() || '';
          if (analysisResult) {
            setUserSpeechStyle(analysisResult);
            console.log('Speech style analysis result:', analysisResult);
          }
        } else if (section.includes(personalizedStyles[0].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `multi_reply_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`,
              style: personalizedStyles[0].name,
              text: replyText
            });
          }
        } else if (section.includes(personalizedStyles[1].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `multi_reply_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`,
              style: personalizedStyles[1].name,
              text: replyText
            });
          }
        } else if (section.includes(personalizedStyles[2].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `multi_reply_${Date.now()}_3_${Math.random().toString(36).substr(2, 9)}`,
              style: personalizedStyles[2].name,
              text: replyText
            });
          }
        } else if (section.includes(personalizedStyles[3].name)) {
          const replyText = sections[i + 1]?.trim() || '';
          if (replyText) {
            replies.push({
              id: `multi_reply_${Date.now()}_4_${Math.random().toString(36).substr(2, 9)}`,
              style: personalizedStyles[3].name,
              text: replyText
            });
          }
        }
      }

      // 추출된 메시지 상태 업데이트
      if (messages.length > 0) {
        setExtractedMessages(messages);
        setShowChatEdit(true); // 대화 편집 섹션 자동으로 펼치기
        console.log('extractedMessages 상태 업데이트됨:', messages);
      } else {
        // fallback: 간단한 파싱 시도
        console.log('메시지 파싱 실패, fallback 시도');
        const lines = ocrResult.split('\n').filter(line => line.trim());
        const fallbackMessages = [];
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if ((trimmedLine.includes('상대방') || trimmedLine.includes('나:')) && !trimmedLine.includes('===')) {
            const isUser = trimmedLine.includes('나:');
            const messageText = trimmedLine.replace(/^(상대방:|나:)\s*/, '').trim();
            
            if (messageText && messageText.length > 0) {
              fallbackMessages.push({
                id: `multi_fallback_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`, // 고유한 ID 생성
                sender: isUser ? 'user' : 'opponent',
                text: messageText,
                timestamp: Date.now() + index
              });
            }
          }
        });
        
        if (fallbackMessages.length > 0) {
          setExtractedMessages(fallbackMessages);
          setShowChatEdit(true);
          console.log('Fallback 메시지 설정됨:', fallbackMessages);
        } else {
          // Last fallback: Create test message
          const testMessages = [
            {
              id: `multi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sender: 'opponent',
              text: 'Failed to extract conversation from screenshot. Please edit manually.',
              timestamp: Date.now()
            }
          ];
          setExtractedMessages(testMessages);
          setShowChatEdit(true);
          console.log('테스트 메시지 설정됨:', testMessages);
        }
      }

      // Perform speech style analysis if user messages exist
      if (userMessages.length > 0) {
        console.log('사용자 메시지 발견:', userMessages);
        await analyzeSpeechStyle(userMessages);
      }

      // Perform intent analysis if recent opponent message exists
      if (latestOpponentMessage) {
        console.log('Starting opponent message intent analysis...', latestOpponentMessage);
        await analyzeOpponentIntent(latestOpponentMessage, '', []);
        setInputMessage(latestOpponentMessage);
      }

      // 답변 설정
      if (replies.length > 0) {
        setAiReplies(replies);
      } else {
        // fallback 답변
        const fallbackReplies = [
          {
            id: `multi_fallback_reply_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`,
            style: personalizedStyles[0].name,
            text: isRomanceMode ? 'Problem occurred during screenshot analysis. 💕' : 'Problem occurred during screenshot analysis.'
          },
          {
            id: `multi_fallback_reply_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`,
            style: personalizedStyles[1].name,
            text: isRomanceMode ? '다시 시도해주세요! 😊' : '다시 시도해주세요.'
          },
          {
            id: `multi_fallback_reply_${Date.now()}_3_${Math.random().toString(36).substr(2, 9)}`,
            style: personalizedStyles[2].name,
            text: isRomanceMode ? '더 명확한 스크린샷을 업로드해주세요! 😅' : '더 명확한 스크린샷을 업로드해주세요.'
          },
          {
            id: `multi_fallback_reply_${Date.now()}_4_${Math.random().toString(36).substr(2, 9)}`, // 고유한 ID 생성
            style: personalizedStyles[3].name,
            text: isRomanceMode ? '지금은 답변하기 어려울 것 같아요.' : '지금은 답변하기 어려울 것 같습니다.'
          }
        ];
        setAiReplies(fallbackReplies);
      }
      
      Alert.alert('Complete', 'Chat content has been analyzed and responses generated!');
      console.log('Multiple image OCR and response generation completed');

    } catch (error) {
      console.error('Multiple image OCR error:', error);
      Alert.alert('Error', 'An error occurred during image processing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // AI response generation through text input (unified function)
  const generateReplies = async () => {
    // 이미지가 있으면 다중 이미지 처리를 우선 실행
    if (selectedImages.length > 0) {
      await processMultipleImagesOCR();
      return;
    }

    // 추출된 메시지가 있으면 그것을 사용
    if (extractedMessages.length === 0) {
      Alert.alert('Notice', 'Please upload a chat screenshot or enter conversation content.');
      return;
    }

    const latestOpponentMessage = getLatestOpponentMessage();
    if (!latestOpponentMessage) {
      Alert.alert('Notice', 'No messages from the other party found. Please check the conversation content.');
      return;
    }

    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('Setup Required', 'Please set up your Google AI API key.');
      return;
    }

    setLoading(true);
    try {
      console.log('API key check:', GOOGLE_AI_API_KEY.substring(0, 10) + '...');
      
      // Extract user messages for speech style analysis
      const userMessages = extractedMessages.filter(msg => msg.sender === 'user').map(msg => msg.text);
      if (userMessages.length > 0) {
        await analyzeSpeechStyle(userMessages);
      }

      // Analyze opponent message intent
      console.log('상대방 메시지 의도 분석 시작...');
      const recentContext = extractedMessages.slice(-4).map(msg => 
        `${msg.sender === 'user' ? 'Me' : 'Other'}: ${msg.text}`
      );
      await analyzeOpponentIntent(latestOpponentMessage, '', recentContext);

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
        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[0].prompt} 

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`,
        
        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[1].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`,
        
        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[2].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`,

        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[3].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조건이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`
      ];

      const replies = [];
      for (let i = 0; i < prompts.length; i++) {
        console.log(`프롬프트 ${i + 1} 실행 중...`);
        const result = await model.generateContent(prompts[i]);
        const response = await result.response;
        replies.push({
          id: `generate_reply_${Date.now()}_${i + 1}_${Math.random().toString(36).substr(2, 9)}`,
          style: personalizedStyles[i].name,
          text: response.text()
        });
        console.log(`프롬프트 ${i + 1} 완료`);
      }

      setAiReplies(replies);
      
      console.log('All responses generated successfully');
    } catch (error) {
      console.error('상세 AI Error:', error);
      Alert.alert('Error', `An error occurred while generating AI response.\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // AI response regeneration function for edited conversation (newly added)
  const regenerateRepliesFromEditedChat = async () => {
    if (extractedMessages.length === 0) {
      Alert.alert('Notice', 'No conversation content to edit.');
      return;
    }

    const latestOpponentMessage = getLatestOpponentMessage();
    if (!latestOpponentMessage) {
      Alert.alert('알림', '상대방의 메시지가 없습니다. 대화 내용을 확인해주세요.');
      return;
    }

    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY.length < 10) {
      Alert.alert('Setup Required', 'Please set up your Google AI API key.');
      return;
    }

    // End edit mode
    setEditingMessageIndex(-1);

    setLoading(true);
    try {
      console.log('Starting AI response regeneration from edited conversation...');
      
      // Extract user messages for speech style analysis
      const userMessages = extractedMessages.filter(msg => msg.sender === 'user').map(msg => msg.text);
      if (userMessages.length > 0) {
        await analyzeSpeechStyle(userMessages);
      }

      // Analyze opponent message intent
      console.log('상대방 메시지 의도 분석 시작...');
      const recentContext = extractedMessages.slice(-4).map(msg => 
        `${msg.sender === 'user' ? 'Me' : 'Other'}: ${msg.text}`
      );
      await analyzeOpponentIntent(latestOpponentMessage, '', recentContext);

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
        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[0].prompt} 

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`,
        
        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[1].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`,
        
        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[2].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조언이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`,

        `상대방이 다음과 같이 메시지를 보냈습니다: "${latestOpponentMessage}"

사용자 프로필: ${userProfile}${speechStyleNote}${intentNote}

${recentContext.length > 0 ? `\n최근 대화 맥락:\n${recentContext.join('\n')}\n이 대화 흐름을 고려하여 적절한 답장을 작성해주세요.\n` : ''}

${personalizedStyles[3].prompt}

**중요**: 상대방이 보낸 메시지에 대해 내가 답장하는 메시지를 작성해주세요. 상대방이 나에게 보내는 메시지가 아닙니다.
조건이나 분석이 아닌, 실제로 상대방에게 보낼 수 있는 답장 메시지를 만들어주세요.
대화의 전체적인 맥락과 흐름을 고려하여 자연스러운 답장을 작성해주세요.`
      ];

      const replies = [];
      for (let i = 0; i < prompts.length; i++) {
        console.log(`프롬프트 ${i + 1} 실행 중...`);
        const result = await model.generateContent(prompts[i]);
        const response = await result.response;
        replies.push({
          id: `edited_reply_${Date.now()}_${i + 1}_${Math.random().toString(36).substr(2, 9)}`,
          style: personalizedStyles[i].name,
          text: response.text()
        });
        console.log(`프롬프트 ${i + 1} 완료`);
      }

      setAiReplies(replies);
      
      console.log('AI response regeneration from edited conversation completed');
      Alert.alert('Complete', 'New responses have been generated based on the edited conversation!');
      
    } catch (error) {
      console.error('Edited conversation AI response generation error:', error);
      Alert.alert('Error', `An error occurred during AI response generation.\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 초기화 함수
  const resetAll = () => {
    setSelectedImages([]);
    setAiReplies([]);
    setUserSpeechStyle('');
    setIntentAnalysis('');
    setShowIntentAnalysis(false);
    setExtractedMessages([]);
    setShowChatEdit(false);
    setEditingMessageIndex(-1);
    setInputMessage('');
    Alert.alert('완료', '모든 데이터가 초기화되었습니다.');
  };

  // Chat editing toggle function added
  const toggleChatEdit = () => {
    if (extractedMessages.length === 0) {
      // Generate sample messages if no messages exist
      const sampleMessages = [
        {
          id: `sample_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`,
          sender: 'opponent',
          text: 'Hello! Please enter the other person\'s message here.',
          timestamp: Date.now()
        },
        {
          id: `sample_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`,
          sender: 'user',
          text: 'Please enter my message here.',
          timestamp: Date.now() + 1
        }
      ];
      setExtractedMessages(sampleMessages);
      setShowChatEdit(true);
    } else {
      setShowChatEdit(!showChatEdit);
    }
  };

  // 메시지 발신자 변경 함수 (새로 추가)
  const toggleMessageSender = (index) => {
    const updatedMessages = [...extractedMessages];
    updatedMessages[index].sender = updatedMessages[index].sender === 'user' ? 'opponent' : 'user';
    setExtractedMessages(updatedMessages);
  };

  // AI response generation button rendering function
  const renderActionButton = () => {
    return (
      <TouchableOpacity 
        style={[
          isRomanceMode ? styles.romanceGenerateButton : styles.generateButton, 
          loading && styles.disabledButton
        ]} 
        onPress={generateReplies}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#333333" />
        ) : (
          <Text style={isRomanceMode ? styles.romanceGenerateButtonText : styles.generateButtonText}>
            {selectedImages.length > 0 ? `Analyze ${selectedImages.length} screenshots and generate response` : 
             extractedMessages.length > 0 ? 'Generate response from extracted conversation' : 'Generate Response'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Add message function
  const addMessage = (sender) => {
    const newMessage = {
      id: `added_${Date.now()}_${sender}_${Math.random().toString(36).substr(2, 9)}`,
      sender: sender, // 'user' or 'opponent'
      text: 'Enter new message...',
      timestamp: new Date().getTime()
    };
    setExtractedMessages([...extractedMessages, newMessage]);
    setEditingMessageIndex(extractedMessages.length); // Set new message to edit mode immediately
  };

  // Get latest opponent message
  const getLatestOpponentMessage = () => {
    const opponentMessages = extractedMessages.filter(msg => msg.sender === 'opponent');
    return opponentMessages.length > 0 ? opponentMessages[opponentMessages.length - 1].text : '';
  };

  // 메시지 업데이트 함수
  const updateMessage = (index, newText) => {
    const updatedMessages = [...extractedMessages];
    updatedMessages[index].text = newText;
    setExtractedMessages(updatedMessages);
  };

  // Delete message function
  const deleteMessage = (index) => {
    const updatedMessages = extractedMessages.filter((_, i) => i !== index);
    setExtractedMessages(updatedMessages);
    // End edit mode if the message being edited is deleted
    if (editingMessageIndex === index) {
      setEditingMessageIndex(-1);
    } else if (editingMessageIndex > index) {
      setEditingMessageIndex(editingMessageIndex - 1);
    }
  };

  // 메시지 순서 변경 함수
  const moveMessage = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === extractedMessages.length - 1)) {
      return;
    }
    
    const updatedMessages = [...extractedMessages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedMessages[index], updatedMessages[targetIndex]] = [updatedMessages[targetIndex], updatedMessages[index]];
    setExtractedMessages(updatedMessages);
    
    // Move the index of the message being edited as well
    if (editingMessageIndex === index) {
      setEditingMessageIndex(targetIndex);
    } else if (editingMessageIndex === targetIndex) {
      setEditingMessageIndex(index);
    }
  };

  // 복사 버튼 텍스트 함수
  const copyButtonText = (isRomance) => {
    return isRomance ? 'Copy 💕' : 'Copy';
  };

  // 복사 버튼 컴포넌트 텍스트 스타일 추가
  const copyButtonTextStyle = () => {
    return isRomanceMode ? styles.romanceCopyButtonText : styles.copyButtonText;
  };

  // 발신자 토글 버튼 스타일 추가
  const senderToggleButton = {
    backgroundColor: 'rgba(179, 217, 255, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.5)',
    minWidth: 70,
    alignItems: 'center',
  };

  const romanceSenderToggleButton = {
    backgroundColor: 'rgba(255, 179, 209, 0.3)',
    borderColor: 'rgba(255, 179, 209, 0.5)',
  };

  const senderToggleText = {
    fontSize: 11,
    color: '#B3D9FF',
    fontWeight: '600',
    textAlign: 'center',
  };

  const romanceSenderToggleText = {
    color: '#4A90A4',
  };

  // Splash screen component
  const SplashScreen = () => (
    <View style={isRomanceMode ? styles.romanceSplashContainer : styles.splashContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={isRomanceMode ? styles.romanceSlogan : styles.slogan}>
        {isRomanceMode ? 'AI-Powered Romance Response Styles' : 'AI-Powered 4 Response Styles'}
      </Text>
    </View>
  );

  // Show splash screen while loading
  if (showSplash) {
    return <SplashScreen />;
  }

  // Main render return
  return (
    <View style={styles.container}>
      <Animated.View style={[
        isRomanceMode ? styles.romanceHeader : styles.header, 
        { height: headerHeight, opacity: headerOpacity }
      ]}>
        <View style={styles.headerContent}>
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={isRomanceMode ? styles.romanceHeaderText : styles.headerText} numberOfLines={1} adjustsFontSizeToFit>
            {isRomanceMode ? 'AI suggests responses suitable for dating situations' : 'AI suggests responses in 4 different styles'}
          </Text>
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

        {/* Dating Mode Toggle */}
        <View style={styles.romanceModeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              !isRomanceMode && styles.activeModeButton
            ]}
            onPress={() => !isRomanceMode || toggleMode()}
          >
            <Text style={[
              styles.modeButtonText,
              !isRomanceMode && styles.activeModeButtonText
            ]}>
              💬 General Mode
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              isRomanceMode && styles.activeModeButton
            ]}
            onPress={() => isRomanceMode || toggleMode()}
          >
            <Text style={[
              styles.modeButtonText,
              isRomanceMode && styles.activeModeButtonText
            ]}>
              💕 Dating Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* User settings section */}
        <View style={isRomanceMode ? styles.romanceSection : styles.section}>
          <TouchableOpacity 
            style={isRomanceMode ? styles.romanceSettingsHeader : styles.settingsHeader} 
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={isRomanceMode ? styles.romanceSettingsTitle : styles.settingsTitle}>⚙️ User Settings</Text>
            <Text style={isRomanceMode ? styles.romanceToggleText : styles.toggleText}>{showSettings ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {showSettings && (
            <View style={styles.settingsContainer}>
              <Text style={isRomanceMode ? styles.romanceSettingsLabel : styles.settingsLabel}>Gender</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[
                    isRomanceMode ? styles.romanceOptionButton : styles.optionButton, 
                    userGender === 'male' && (isRomanceMode ? styles.romanceSelectedButton : styles.selectedButton)
                  ]}
                  onPress={() => handleGenderChange('male')}
                >
                  <Text style={[
                    isRomanceMode ? styles.romanceOptionText : styles.optionText, 
                    userGender === 'male' && styles.selectedText
                  ]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    isRomanceMode ? styles.romanceOptionButton : styles.optionButton, 
                    userGender === 'female' && (isRomanceMode ? styles.romanceSelectedButton : styles.selectedButton)
                  ]}
                  onPress={() => handleGenderChange('female')}
                >
                  <Text style={[
                    isRomanceMode ? styles.romanceOptionText : styles.optionText, 
                    userGender === 'female' && styles.selectedText
                  ]}>Female</Text>
                </TouchableOpacity>
              </View>

              <Text style={isRomanceMode ? styles.romanceSettingsLabel : styles.settingsLabel}>Age Group</Text>
              <View style={styles.buttonGroup}>
                {['Teens', '20s', '30s', '40s', '50s+'].map((age, index) => {
                  const ageValues = ['10대', '20대', '30대', '40대', '50대이상'];
                  const ageValue = ageValues[index];
                  return (
                  <TouchableOpacity 
                    key={age}
                    style={[
                      isRomanceMode ? styles.romanceAgeButton : styles.ageButton, 
                      userAge === ageValue && (isRomanceMode ? styles.romanceSelectedButton : styles.selectedButton)
                    ]}
                    onPress={() => handleAgeChange(ageValue)}
                  >
                    <Text style={[
                      isRomanceMode ? styles.romanceOptionText : styles.optionText, 
                      userAge === ageValue && styles.selectedText
                    ]}>{age}</Text>
                  </TouchableOpacity>
                )})}
              </View>

              {/* Opponent gender setting (Dating mode only) */}
              {isRomanceMode && (
                <>
                  <Text style={styles.romanceSettingsLabel}>Opponent Gender</Text>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity 
                      style={[
                        styles.romanceOptionButton, 
                        opponentGender === 'male' && styles.romanceSelectedButton
                      ]}
                      onPress={() => handleOpponentGenderChange('male')}
                    >
                      <Text style={[
                        styles.romanceOptionText, 
                        opponentGender === 'male' && styles.selectedText
                      ]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.romanceOptionButton, 
                        opponentGender === 'female' && styles.romanceSelectedButton
                      ]}
                      onPress={() => handleOpponentGenderChange('female')}
                    >
                      <Text style={[
                        styles.romanceOptionText, 
                        opponentGender === 'female' && styles.selectedText
                      ]}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={isRomanceMode ? styles.romanceProfileSummary : styles.profileSummary}>
                <Text style={isRomanceMode ? styles.romanceProfileText : styles.profileText}>
                  Current Settings: {userGender ? (userGender === 'male' ? 'Male' : 'Female') : 'Gender not set'}, {getEnglishAgeGroup(userAge)}
                  {isRomanceMode && opponentGender && `\nOpponent: ${opponentGender === 'male' ? 'Male' : 'Female'}`}
                </Text>
                {userSpeechStyle && (
                  <Text style={isRomanceMode ? styles.romanceSpeechStyleText : styles.speechStyleText}>
                    💬 Analyzed Speech Style: {userSpeechStyle}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Image selection section */}
        <View style={isRomanceMode ? styles.romanceSection : styles.section}>
          <Text style={isRomanceMode ? styles.romanceSectionTitle : styles.sectionTitle}>📸 Select Chat Screenshot</Text>
          <TouchableOpacity 
            style={[
              isRomanceMode ? styles.romanceButton : styles.button, 
              selectedImages.length >= 2 && styles.buttonDisabled
            ]} 
            onPress={pickImage}
            disabled={selectedImages.length >= 2}
          >
            <Text style={isRomanceMode ? styles.romanceButtonText : styles.buttonText}>
              Add Screenshot ({selectedImages.length}/2)
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
            <Text style={isRomanceMode ? styles.romanceImageText : styles.imageText}>
              ✅ {selectedImages.length} images selected
              {'\n'}💡 Press the "Generate AI Response" button below to start analysis
            </Text>
          )}
        </View>

        {/* Chat content editing section - always displayed */}
        <View style={isRomanceMode ? styles.romanceSection : styles.section}>
          <TouchableOpacity 
            style={isRomanceMode ? styles.romanceSettingsHeader : styles.settingsHeader} 
            onPress={toggleChatEdit}
          >
            <Text style={isRomanceMode ? styles.romanceSettingsTitle : styles.settingsTitle}>
              💬 View and Edit Conversation ({extractedMessages.length} messages)
            </Text>
            <Text style={isRomanceMode ? styles.romanceToggleText : styles.toggleText}>
              {showChatEdit ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          {showChatEdit && (
            <View style={styles.chatEditContainer}>
              {extractedMessages.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={isRomanceMode ? styles.romanceEmptyStateText : styles.emptyStateText}>
                    📝 No conversation content available.
                    {'\n'}Upload a screenshot to extract automatically
                    {'\n'}or use the button below to add messages directly.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={isRomanceMode ? styles.romanceChatEditInfo : styles.chatEditInfo}>
                    Tap messages to edit, or use buttons to change order and delete.
                  </Text>
                  
                  {extractedMessages.map((message, index) => (
                    <View key={message.id} style={[
                      styles.messageItem, 
                      message.sender === 'user' ? styles.userMessage : styles.opponentMessage,
                      isRomanceMode && (message.sender === 'user' ? styles.romanceUserMessage : styles.romanceOpponentMessage)
                    ]}>
                      <View style={styles.messageHeader}>
                        <TouchableOpacity 
                          style={[
                            styles.senderToggleButton,
                            isRomanceMode && styles.romanceSenderToggleButton
                          ]}
                          onPress={() => toggleMessageSender(index)}
                        >
                          <Text style={[
                            styles.senderToggleText,
                            isRomanceMode && styles.romanceSenderToggleText
                          ]}>
                            {message.sender === 'user' ? 'Me' : 'Other'} ⇄
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.messageControls}>
                          <TouchableOpacity 
                            style={styles.controlButton}
                            onPress={() => moveMessage(index, 'up')}
                            disabled={index === 0}
                          >
                            <Text style={[styles.controlButtonText, index === 0 && styles.disabledText]}>↑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.controlButton}
                            onPress={() => moveMessage(index, 'down')}
                            disabled={index === extractedMessages.length - 1}
                          >
                            <Text style={[styles.controlButtonText, index === extractedMessages.length - 1 && styles.disabledText]}>↓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.controlButton}
                            onPress={() => deleteMessage(index)}
                          >
                            <Text style={styles.deleteButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {editingMessageIndex === index ? (
                        <View style={styles.editingContainer}>
                          <TextInput
                            style={[
                              styles.messageEditInput,
                              isRomanceMode && styles.romanceMessageEditInput
                            ]}
                            value={message.text}
                            onChangeText={(text) => updateMessage(index, text)}
                            multiline={true}
                            autoFocus={true}
                          />
                          <View style={styles.editButtons}>
                            <TouchableOpacity 
                              style={[styles.editButton, styles.saveButton]}
                              onPress={() => setEditingMessageIndex(-1)}
                            >
                              <Text style={styles.editButtonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.editButton, styles.cancelButton]}
                              onPress={() => setEditingMessageIndex(-1)}
                            >
                              <Text style={styles.editButtonText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setEditingMessageIndex(index)}>
                          <Text style={[
                            styles.messageText,
                            isRomanceMode && styles.romanceMessageText
                          ]}>
                            {message.text}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {/* AI response regeneration button from edited conversation */}
                  <TouchableOpacity 
                    style={[
                      styles.regenerateButton,
                      isRomanceMode && styles.romanceRegenerateButton,
                      loading && styles.disabledButton
                    ]} 
                    onPress={regenerateRepliesFromEditedChat}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={isRomanceMode ? "#2C5282" : "#333333"} />
                    ) : (
                      <Text style={[
                        styles.regenerateButtonText,
                        isRomanceMode && styles.romanceRegenerateButtonText
                      ]}>
                        🔄 Regenerate Response from Edited Conversation
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              
              <View style={styles.addMessageButtons}>
                <TouchableOpacity 
                  style={[
                    styles.addMessageButton,
                    isRomanceMode && styles.romanceAddMessageButton
                  ]}
                  onPress={() => addMessage('opponent')}
                >
                  <Text style={[
                    styles.addMessageButtonText,
                    isRomanceMode && styles.romanceAddMessageButtonText
                  ]}>Add Opponent Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.addMessageButton,
                    isRomanceMode && styles.romanceAddMessageButton
                  ]}
                  onPress={() => addMessage('user')}
                >
                  <Text style={[
                    styles.addMessageButtonText,
                    isRomanceMode && styles.romanceAddMessageButtonText
                  ]}>Add My Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* AI response generation button */}
        <TouchableOpacity 
          style={[
            isRomanceMode ? styles.romanceGenerateButton : styles.generateButton, 
            loading && styles.disabledButton
          ]} 
          onPress={generateReplies}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#333333" />
          ) : (
            <Text style={isRomanceMode ? styles.romanceGenerateButtonText : styles.generateButtonText}>
              {selectedImages.length > 0 ? `Analyze ${selectedImages.length} screenshot(s) and generate response` : 
               extractedMessages.length > 0 ? 'Generate response from extracted conversation' : 'Generate Response'}
            </Text>
          )}
        </TouchableOpacity>

        {/* AI response results */}
        {aiReplies.length > 0 && (
          <View style={isRomanceMode ? styles.romanceSection : styles.section}>
            <Text style={isRomanceMode ? styles.romanceSectionTitle : styles.sectionTitle}>
              {isRomanceMode ? '💕 Dating Response Suggestions' : '💡 AI Response Suggestions'}
            </Text>
            
            {/* Other party's intent analysis results display (toggleable) */}
            {intentAnalysis && (
              <View style={isRomanceMode ? styles.romanceIntentAnalysisSection : styles.intentAnalysisSection}>
                <TouchableOpacity 
                  style={isRomanceMode ? styles.romanceIntentAnalysisHeader : styles.intentAnalysisHeader} 
                  onPress={() => setShowIntentAnalysis(!showIntentAnalysis)}
                >
                  <Text style={isRomanceMode ? styles.romanceIntentAnalysisHeaderText : styles.intentAnalysisHeaderText}>
                    {isRomanceMode ? '💖 Other Party\'s Heart Analysis' : '🎯 Other Party\'s Intent Analysis'}
                  </Text>
                  <Text style={isRomanceMode ? styles.romanceIntentToggleText : styles.intentToggleText}>
                    {showIntentAnalysis ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {showIntentAnalysis && (
                  <View style={isRomanceMode ? styles.romanceIntentAnalysisContainer : styles.intentAnalysisContainer}>
                    <Text style={isRomanceMode ? styles.romanceIntentAnalysisText : styles.intentAnalysisText}>
                      {intentAnalysis}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {aiReplies.map((reply) => (
              <View key={reply.id} style={isRomanceMode ? styles.romanceReplyContainer : styles.replyContainer}>
                <Text style={isRomanceMode ? styles.romanceReplyStyle : styles.replyStyle}>{reply.style}</Text>
                <Text style={isRomanceMode ? styles.romanceReplyText : styles.replyText}>{reply.text}</Text>
                <TouchableOpacity 
                  style={isRomanceMode ? styles.romanceCopyButton : styles.copyButton} 
                  onPress={() => copyReply(reply.text)}
                >
                  <Text style={copyButtonTextStyle()}>
                    {isRomanceMode ? 'Copy 💕' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 초기화 버튼 */}
        <TouchableOpacity style={isRomanceMode ? styles.romanceResetButton : styles.resetButton} onPress={resetAll}>
          <Text style={isRomanceMode ? styles.romanceResetButtonText : styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

      </Animated.ScrollView>
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
  romanceHeader: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(240, 245, 255, 0.95)', // 연한 파랑 배경
    marginBottom: 15,
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 10,
    backdropFilter: 'blur(20px)',
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 70,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
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
  romanceSection: {
    backgroundColor: 'rgba(255, 248, 250, 0.9)', // 연한 분홍+파랑 혼합
    margin: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#FFB3D1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.2)',
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
  romanceButton: {
    backgroundColor: '#FFB3D1', // 연한 분홍
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#FFB3D1',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  buttonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '600',
  },
  romanceButtonText: {
    color: '#2C5282', // 진한 파랑색 텍스트
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
  romanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 250, 0.95)', // 연한 분홍+파랑 혼합
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.5)',
  },
  textInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
  },
  romanceTextInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#2C5282', // 진한 파랑색
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
  romancePasteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 10,
    marginRight: 5,
    justifyContent: 'center',
    minHeight: 42,
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
  romanceGenerateButton: {
    backgroundColor: '#C7D2FE', // 연한 파스텔 파랑
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    minHeight: 56,
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.3)',
  },
  generateButtonText: {
    color: '#333333',
    fontSize: 17,
    fontWeight: 'bold',
  },
  romanceGenerateButtonText: {
    color: '#2C5282', // 진한 파랑색
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
  romanceReplyContainer: {
    backgroundColor: 'rgba(255, 248, 250, 0.95)', // 연한 분홍+파랑 혼합
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.4)',
    shadowColor: '#FFB3D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  replyStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD4B3',
    marginBottom: 12,
  },
  romanceReplyStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF69B4', // 진한 분홍색
    marginBottom: 12,
  },
  replyText: {
    fontSize: 17,
    color: '#ffffff',
    lineHeight: 26,
  },
  romanceReplyText: {
    fontSize: 17,
    color: '#2C5282', // 진한 파랑색
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
  romanceCopyButton: {
    backgroundColor: '#B3D9FF', // 파스텔 파랑
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.3)',
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
  romanceResetButton: {
    backgroundColor: '#FFE4E1', // 연한 분홍
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
  romanceResetButtonText: {
    color: '#DC143C', // 진한 분홍빨강
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
  romanceSettingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(230, 240, 255, 0.8)', // 연한 파랑
    borderRadius: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  romanceSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282', // 진한 파랑색
    letterSpacing: -0.2,
  },
  toggleText: {
    fontSize: 16,
    color: '#B3D9FF',
    fontWeight: '600',
  },
  romanceToggleText: {
    fontSize: 16,
    color: '#A0756B',
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
    backgroundColor: 'rgba(230, 240, 255, 0.9)', // 연한 파랑
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(179, 217, 255, 0.6)',
  },
  romanceOptionButton: {
    backgroundColor: 'rgba(244, 194, 161, 0.9)', // 연한 분홍
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 209, 0.6)',
  },
  ageButton: {
    backgroundColor: 'rgba(255, 240, 248, 0.9)', // 연한 분홍
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 209, 0.6)',
  },
  optionText: {
    color: '#444444',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: '#4B0082', // 진한 인디고 색상
    fontSize: 14,
    fontWeight: '700', // 더 굵은 폰트
  },
  romanceOptionText: {
    color: '#2C5282', // 진한 파랑색
    fontSize: 14,
    fontWeight: '500',
  },
  selectedButton: {
    backgroundColor: '#D8BFD8', // 더 진한 라벤더 색상
    borderColor: '#9370DB', // 더 진한 보라색 경계선
    borderWidth: 3, // 경계선 두께 증가
    shadowColor: '#9370DB',
    shadowOpacity: 0.7, // 그림자 강도 증가
    shadowRadius: 10, // 그림자 크기 증가
    shadowOffset: { width: 0, height: 4 }, // 그림자 오프셋 추가
    elevation: 8, // 안드로이드 elevation 증가
  },
  romanceSelectedButton: {
    backgroundColor: '#87CEEB', // 더 진한 스카이블루
    borderColor: '#4682B4', // 더 진한 스틸블루 경계선
    borderWidth: 3, // 경계선 두께 증가
    shadowColor: '#4682B4',
    shadowOpacity: 0.7, // 그림자 강도 증가
    shadowRadius: 10, // 그림자 크기 증가
    shadowOffset: { width: 0, height: 4 }, // 그림자 오프셋 추가
    elevation: 8, // 안드로이드 elevation 증가
  },
  profileSummary: {
    backgroundColor: 'rgba(179, 217, 255, 0.25)', // 더 진한 배경
    padding: 15, // 패딩 증가
    borderRadius: 12, // 모서리 더 둥글게
    marginTop: 15, // 마진 증가
    borderWidth: 2, // 경계선 두께 증가
    borderColor: 'rgba(179, 217, 255, 0.6)', // 더 진한 경계선
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 3 }, // 그림자 오프셋 증가
    shadowOpacity: 0.2, // 그림자 강도 증가
    shadowRadius: 6, // 그림자 크기 증가
    elevation: 4, // elevation 증가
  },
  romanceProfileSummary: {
    backgroundColor: 'rgba(230, 240, 255, 0.9)', // 더 진한 배경
    padding: 15, // 패딩 증가
    borderRadius: 12, // 모서리 더 둥글게
    marginTop: 15, // 마진 증가
    borderWidth: 2, // 경계선 두께 증가
    borderColor: 'rgba(255, 179, 209, 0.7)', // 더 진한 경계선
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 3 }, // 그림자 오프셋 증가
    shadowOpacity: 0.2, // 그림자 강도 증가
    shadowRadius: 6, // 그림자 크기 증가
    elevation: 4, // elevation 증가
  },
  profileText: {
    fontSize: 14, // 크기 증가
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700', // 더 굵게
    letterSpacing: 0.3, // 자간 증가
    lineHeight: 20, // 줄 간격 추가
  },
  romanceProfileText: {
    fontSize: 14, // 크기 증가
    color: '#1A365D', // 더 진한 파랑색
    textAlign: 'center',
    fontWeight: '700', // 더 굵게
    letterSpacing: 0.3, // 자간 증가
    lineHeight: 20, // 줄 간격 추가
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
  romanceSpeechStyleText: {
    fontSize: 12,
    color: '#4A90A4', // 중간 톤 파랑
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
  romanceIntentAnalysisContainer: {
    backgroundColor: 'rgba(255, 248, 250, 0.9)', // 연한 분홍+파랑 혼합
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  intentAnalysisSection: {
    backgroundColor: 'rgba(255, 212, 179, 0.1)',
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 212, 179, 0.3)',
    overflow: 'hidden',
  },
  romanceIntentAnalysisSection: {
    backgroundColor: 'rgba(244, 194, 161, 0.1)',
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 194, 161, 0.3)',
    overflow: 'hidden',
  },
  intentAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 212, 179, 0.15)',
  },
  romanceIntentAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(230, 240, 255, 0.8)', // 연한 파랑
  },
  intentAnalysisHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD4B3',
    letterSpacing: 0.3,
  },
  romanceIntentAnalysisHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF69B4', // 진한 분홍색
    letterSpacing: 0.3,
  },
  intentToggleText: {
    fontSize: 16,
    color: '#FFD4B3',
    fontWeight: '700',
  },
  romanceIntentToggleText: {
    fontSize: 16,
    color: '#4A90A4', // 중간 톤 파랑
    fontWeight: '700',
  },
  intentAnalysisText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  romanceIntentAnalysisText: {
    fontSize: 14,
    color: '#2C5282', // 진한 파랑색
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
  romanceImageText: {
    color: '#4A90A4', // 중간 톤 파랑
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 스플래시 화면 컴포넌트
  splashContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  romanceSplashContainer: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #F0F5FF 0%, #FFF0F5 100%)', // 그라데이션 효과 (실제로는 단색으로 처리)
    backgroundColor: '#F5F8FF', // 연한 파스텔 파랑+분홍 혼합
    alignItems: 'center',
    justifyContent: 'center',
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
  romanceSlogan: {
    color: '#FF69B4', // 진한 분홍색
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  
  // 모드 토글 스타일
  modeToggle: {
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

  // 모드 토글 스타일
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    borderRadius: 25,
    margin: 15,
    marginTop: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  romanceModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 248, 250, 0.95)', // 연한 분홍+파랑 혼합
    borderRadius: 25,
    margin: 15,
    marginTop: 10,
    padding: 4,
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
    borderColor: 'rgba(255, 179, 209, 0.3)',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#B3D9FF',
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  romanceActiveToggle: {
    backgroundColor: '#B3D9FF', // 파스텔 파랑
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  romanceToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90A4', // 중간 톤 파랑
  },
  activeToggleText: {
    color: '#333',
    fontWeight: '700',
  },

  // Mode toggle button styles
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  activeModeButton: {
    backgroundColor: '#B3D9FF',
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  activeModeButtonText: {
    color: '#333',
    fontWeight: '700',
  },

  // 연애모드 컨테이너
  romanceContainer: {
    flex: 1,
    backgroundColor: '#F0F5FF', // 연한 파스텔 파랑 배경
    paddingTop: 50,
  },

  // 연애모드 헤더
  romanceHeader: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(240, 245, 255, 0.95)', // 연한 파랑 배경
    marginBottom: 15,
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 10,
    backdropFilter: 'blur(20px)',
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 70,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  romanceHeaderText: {
    fontSize: 14,
    color: '#2C5282', // 진한 파랑색 텍스트
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 1,
    flex: 0,
    maxWidth: '80%',
  },

  // 연애모드 섹션
  romanceSection: {
    backgroundColor: 'rgba(255, 248, 250, 0.9)', // 연한 분홍+파랑 혼합
    margin: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#FFB3D1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.2)',
  },
  romanceSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: '#2C5282', // 진한 파랑색
    letterSpacing: -0.3,
  },

  // 연애모드 설정
  romanceSettingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(230, 240, 255, 0.8)', // 연한 파랑
    borderRadius: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  romanceSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282', // 진한 파랑색
    letterSpacing: -0.2,
  },
  romanceSettingsLabel: {
    fontSize: 14,
    color: '#4A90A4', // 중간 톤 파랑
    marginBottom: 8,
    marginTop: 8,
  },

  // 연애모드 버튼들
  romanceButton: {
    backgroundColor: '#FFB3D1', // 연한 분홍
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#FFB3D1',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  romanceButtonText: {
    color: '#2C5282', // 진한 파랑색 텍스트
    fontSize: 17,
    fontWeight: '600',
  },
  romanceOptionButton: {
    backgroundColor: 'rgba(230, 240, 255, 0.9)', // 연한 파랑
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(179, 217, 255, 0.6)',
  },
  romanceAgeButton: {
    backgroundColor: 'rgba(255, 240, 248, 0.9)', // 연한 분홍
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 209, 0.6)',
  },
  romanceOptionText: {
    color: '#2C5282', // 진한 파랑색
    fontSize: 14,
    fontWeight: '500',
  },

  // 연애모드 입력
  romanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 250, 0.95)', // 연한 분홍+파랑 혼합
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.5)',
  },
  romanceTextInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#2C5282', // 진한 파랑색
    minHeight: 100,
  },
  romancePasteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 10,
    marginRight: 5,
    justifyContent: 'center',
    minHeight: 42,
  },
  romancePasteButtonText: {
    color: '#4A90A4', // 중간 톤 파랑
    fontSize: 17,
    fontWeight: '600',
  },

  // 연애모드 생성 버튼
  romanceGenerateButton: {
    backgroundColor: '#C7D2FE', // 연한 파스텔 파랑
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    minHeight: 56,
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.3)',
  },
  romanceGenerateButtonText: {
    color: '#2C5282', // 진한 파랑색
    fontSize: 17,
    fontWeight: 'bold',
  },

  // 연애모드 답변 컨테이너
  romanceReplyContainer: {
    backgroundColor: 'rgba(255, 248, 250, 0.95)', // 연한 분홍+파랑 혼합
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.4)',
    shadowColor: '#FFB3D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  romanceReplyStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF69B4', // 진한 분홍색
    marginBottom: 12,
  },
  romanceReplyText: {
    fontSize: 17,
    color: '#2C5282', // 진한 파랑색
    lineHeight: 26,
  },
  romanceCopyButton: {
    backgroundColor: '#B3D9FF', // 파스텔 파랑
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.3)',
  },

  // 연애모드 리셋 버튼
  romanceResetButton: {
    backgroundColor: '#FFE4E1', // 연한 분홍
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 40,
    minHeight: 50,
  },

  // 연애모드 프로필
  romanceProfileSummary: {
    backgroundColor: 'rgba(230, 240, 255, 0.8)', // 연한 파랑
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 209, 0.4)',
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  romanceProfileText: {
    fontSize: 13,
    color: '#2C5282', // 진한 파랑색
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  romanceSpeechStyleText: {
    fontSize: 12,
    color: '#4A90A4', // 중간 톤 파랑
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // 연애모드 의도 분석
  romanceIntentAnalysisSection: {
    backgroundColor: 'rgba(255, 240, 248, 0.6)', // 연한 분홍
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.4)',
    overflow: 'hidden',
  },
  romanceIntentAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(230, 240, 255, 0.8)', // 연한 파랑
  },
  romanceIntentAnalysisHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF69B4', // 진한 분홍색
    letterSpacing: 0.3,
  },
  romanceIntentToggleText: {
    fontSize: 16,
    color: '#4A90A4', // 중간 톤 파랑
    fontWeight: '700',
  },
  romanceIntentAnalysisContainer: {
    backgroundColor: 'rgba(255, 248, 250, 0.9)', // 연한 분홍+파랑 혼합
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  romanceIntentAnalysisText: {
    fontSize: 14,
    color: '#2C5282', // 진한 파랑색
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },

  // 연애모드 토글 버튼
  romanceModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 248, 250, 0.95)', // 연한 분홍+파랑 혼합
    borderRadius: 25,
    margin: 15,
    marginTop: 10,
    padding: 4,
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
    borderColor: 'rgba(255, 179, 209, 0.3)',
  },
  romanceActiveToggle: {
    backgroundColor: '#B3D9FF', // 파스텔 파랑
    shadowColor: '#B3D9FF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  romanceActiveToggleText: {
    color: '#333',
    fontWeight: '700',
  },

  // 테스트 버튼 스타일 제거
  // testButton: {
  //   backgroundColor: '#FFA500', // 오렌지색
  //   paddingVertical: 14,
  //   paddingHorizontal: 25,
  //   borderRadius: 14,
  //   alignItems: 'center',
  //   marginHorizontal: 15,
  //   marginTop: 10,
  //   marginBottom: 15,
  //   minHeight: 50,
  //   borderWidth: 2,
  //   borderColor: '#FF8C00',
  //   shadowColor: '#FFA500',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 8,
  //   elevation: 6,
  // },
  // romanceTestButton: {
  //   backgroundColor: '#98FB98', // 연한 초록
  //   paddingVertical: 14,
  //   paddingHorizontal: 25,
  //   borderRadius: 14,
  //   alignItems: 'center',
  //   marginHorizontal: 15,
  //   marginTop: 10,
  //   marginBottom: 15,
  //   minHeight: 50,
  //   borderWidth: 2,
  //   borderColor: '#90EE90',
  //   shadowColor: '#98FB98',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 8,
  //   elevation: 6,
  // },
  // testButtonText: {
  //   color: '#FFFFFF',
  //   fontSize: 16,
  //   fontWeight: 'bold',
  // },
  // romanceTestButtonText: {
  //   color: '#2C5282',
  //   fontSize: 16,
  //   fontWeight: 'bold',
  // },

  // Chat editing related styles - completely modified
  chatEditContainer: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(179, 217, 255, 0.3)',
  },
  chatEditInfo: {
    fontSize: 12,
    color: '#B3D9FF',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  romanceChatEditInfo: {
    fontSize: 12,
    color: '#4A90A4',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // 메시지 아이템 스타일
  messageItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  userMessage: {
    backgroundColor: 'rgba(179, 217,  255, 0.2)',
    borderColor: 'rgba(179, 217, 255, 0.5)',
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  opponentMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    marginRight: 40,
  },
  romanceUserMessage: {
    backgroundColor: 'rgba(199, 210, 254, 0.3)',
    borderColor: 'rgba(179, 217, 255, 0.5)',
  },
  romanceOpponentMessage: {
    backgroundColor: 'rgba(255, 179, 209, 0.2)',
    borderColor: 'rgba(255, 179, 209, 0.4)',
  },
  
  // 메시지 헤더 스타일
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // 메시지 컨트롤 버튼들
  messageControls: {
    flexDirection: 'row',
    gap: 5,
  },
  controlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(179, 217, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    fontSize: 12,
    color: '#B3D9FF',
    fontWeight: '600',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FFB3B3',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.3,
  },
  
  // 발신자 토글 버튼 스타일
  senderToggleButton: {
    backgroundColor: 'rgba(179, 217, 255, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.5)',
    minWidth: 70,
    alignItems: 'center',
  },
  romanceSenderToggleButton: {
    backgroundColor: 'rgba(255, 179, 209, 0.3)',
    borderColor: 'rgba(255, 179, 209, 0.5)',
  },
  senderToggleText: {
    fontSize: 11,
    color: '#B3D9FF',
    fontWeight: '600',
    textAlign: 'center',
  },
  romanceSenderToggleText: {
    color: '#4A90A4',
  },
  
  // 메시지 텍스트 스타일
  messageText: {
    fontSize: 14,
    color: '#E6E6FA',
    lineHeight: 20,
  },
  romanceMessageText: {
    color: '#2C5282',
  },
  
  // Editing related styles
  editingContainer: {
    marginTop: 5,
  },
  messageEditInput: {
    backgroundColor: 'rgba(179, 217, 255, 0.15)',
    color: '#ffffff',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  romanceMessageEditInput: {
    backgroundColor: 'rgba(230, 240, 255, 0.8)',
    color: '#2C5282',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#90EE90',
  },
  cancelButton: {
    backgroundColor: '#FFB3B3',
  },
  editButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 메시지 추가 버튼들
  addMessageButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  addMessageButton: {
    flex: 1,
    backgroundColor: 'rgba(179, 217, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.5)',
  },
  romanceAddMessageButton: {
    backgroundColor: 'rgba(255, 179, 209, 0.2)',
    borderColor: 'rgba(255, 179, 209, 0.3)',
  },
  addMessageButtonText: {
    color: '#B3D9FF',
    fontSize: 14,
    fontWeight: '600',
  },
  romanceAddMessageButtonText: {
    color: '#4A90A4',
  },
  
  // 빈 상태 컨테이너
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#B3D9FF',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  romanceEmptyStateText: {
    fontSize: 14,
    color: '#4A90A4',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Regeneration button style from edited conversation
  regenerateButton: {
    backgroundColor: '#C3F0C3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    shadowColor: '#C3F0C3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(179, 217, 255, 0.3)',
  },
  romanceRegenerateButton: {
    backgroundColor: '#FFE4E1',
    shadowColor: '#FFB3D1',
    borderColor: 'rgba(255, 179, 209, 0.4)',
  },
  regenerateButtonText: {
    color: '#2C5F3F',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  romanceRegenerateButtonText: {
    color: '#8B4B6B',
  },

  // 복사 버튼 텍스트 스타일
  copyButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  romanceCopyButtonText: {
    color: '#2C5282',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Export DapTalkApp directly (Google Play Billing only)
export default DapTalkApp;