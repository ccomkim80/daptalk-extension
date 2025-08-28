import Foundation

// MARK: - AI Response Model
struct AIResponse {
    let styleName: String
    let content: String
    let type: ResponseType
    
    enum ResponseType {
        case friendly
        case polite
        case humorous
        case rejection
        case romantic
        case interest
        case attractive
        case intimacy
        case romanticRejection
    }
}

// MARK: - User Profile Model
struct UserProfile: Codable {
    let gender: String
    let age: String
    let opponentGender: String
    let isDatingMode: Bool
    
    static let `default` = UserProfile(gender: "", age: "", opponentGender: "", isDatingMode: false)
}

// MARK: - AI Service
class AIService {
    
    // Google AI API Key (You should move this to a secure location)
    private let apiKey = "AIzaSyCPOkqRbG_H-Uybu5S25uHw-qkrTiAJ0IQ"
    private let baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    // MARK: - Public Methods
    func generateResponses(for message: String, userProfile: UserProfile = .default, completion: @escaping (Result<[AIResponse], Error>) -> Void) {
        let responseStyles = userProfile.isDatingMode ? 
            createDatingResponseStyles(userProfile: userProfile) : 
            createResponseStyles()
        let dispatchGroup = DispatchGroup()
        var responses: [AIResponse] = []
        var errors: [Error] = []
        
        for style in responseStyles {
            dispatchGroup.enter()
            generateSingleResponse(for: message, style: style) { result in
                defer { dispatchGroup.leave() }
                
                switch result {
                case .success(let response):
                    responses.append(response)
                case .failure(let error):
                    errors.append(error)
                }
            }
        }
        
        dispatchGroup.notify(queue: .main) {
            if responses.isEmpty {
                let error = errors.first ?? NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to generate responses"])
                completion(.failure(error))
            } else {
                completion(.success(responses))
            }
        }
    }
    
    // MARK: - Private Methods
    private func createResponseStyles() -> [(name: String, prompt: String, type: AIResponse.ResponseType)] {
        return [
            (
                name: "Friendly",
                prompt: "Write a casual, friendly reply using informal language like you're talking to a close friend. Use casual expressions, contractions, and a relaxed tone. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .friendly
            ),
            (
                name: "Polite",
                prompt: "Write a formal, respectful reply using polite language and honorifics. Use complete sentences, avoid contractions, and maintain a courteous tone throughout. Include phrases like 'please', 'thank you', and formal sentence structures. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .polite
            ),
            (
                name: "Humorous",
                prompt: "Write a funny, witty reply that will make the other person laugh or smile. Use appropriate humor, playful teasing, or clever wordplay. Make sure the humor is appropriate for the conversation context. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .humorous
            ),
            (
                name: "Polite Decline",
                prompt: "Write a polite but clear rejection that declines the other person's request or proposal. Be gentle but firm in your refusal. Include appreciation for their interest but make your position clear. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .rejection
            )
        ]
    }
    
    private func createDatingResponseStyles(userProfile: UserProfile) -> [(name: String, prompt: String, type: AIResponse.ResponseType)] {
        let genderStyle = userProfile.gender == "male" ? "masculine and" : userProfile.gender == "female" ? "feminine and" : ""
        let ageStyle = getAgeStyle(userProfile.age)
        let opponentInfo = userProfile.opponentGender.isEmpty ? "" : "The opponent is \(userProfile.opponentGender)."
        
        let genderSpecificGuide = userProfile.gender == "male" && userProfile.opponentGender == "female" ? 
            "Use natural expressions and titles that men use for women. Never use titles like \"oppa\" that women use for men." :
            userProfile.gender == "female" && userProfile.opponentGender == "male" ?
            "Use natural expressions and titles that women use for men." : ""
        
        return [
            (
                name: "Show Interest",
                prompt: "\(genderStyle) \(ageStyle) \(opponentInfo) \(genderSpecificGuide) Write a reply that subtly shows romantic interest and curiosity about the other person. Use warm, engaging language that invites more conversation. \(userProfile.gender == "male" && userProfile.opponentGender == "female" ? "Use confident masculine expressions that show genuine interest in getting to know her better." : userProfile.gender == "female" && userProfile.opponentGender == "male" ? "Use warm feminine expressions that show interest while maintaining some mystery." : "") Include questions or comments that encourage them to share more about themselves. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .interest
            ),
            (
                name: "Be Attractive",
                prompt: "\(genderStyle) \(ageStyle) \(opponentInfo) \(genderSpecificGuide) Write a reply that showcases your personality and charm to attract their interest. Be confident, engaging, and memorable. \(userProfile.gender == "male" && userProfile.opponentGender == "female" ? "Use confident masculine charm with wit and humor to impress her." : userProfile.gender == "female" && userProfile.opponentGender == "male" ? "Use charming feminine appeal with playful confidence that draws his attention." : "") Show your best qualities through your words and tone. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .attractive
            ),
            (
                name: "Build Intimacy",
                prompt: "\(genderStyle) \(ageStyle) \(opponentInfo) \(genderSpecificGuide) Write a reply that creates emotional connection and brings you closer together. Share something personal or find common ground. \(userProfile.gender == "male" && userProfile.opponentGender == "female" ? "Use sincere masculine expressions that build trust and emotional connection with her." : userProfile.gender == "female" && userProfile.opponentGender == "male" ? "Use caring feminine expressions that create emotional intimacy and understanding with him." : "") Be vulnerable and encouraging to deepen the relationship. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .intimacy
            ),
            (
                name: "Polite Decline",
                prompt: "\(genderStyle) \(ageStyle) \(opponentInfo) \(genderSpecificGuide) Politely decline their romantic advance while preserving their dignity and the possibility of friendship. Be gentle but clear about your boundaries. \(userProfile.gender == "male" && userProfile.opponentGender == "female" ? "Use respectful masculine language that declines gently while appreciating her feelings." : userProfile.gender == "female" && userProfile.opponentGender == "male" ? "Use soft feminine expressions that let him down easy while being clear about your position." : "") Acknowledge their feelings while redirecting the relationship. **CRITICAL**: You MUST write ONLY the actual message text that I will send to the other person. Do NOT write any analysis, advice, or explanations. Write ONLY the direct reply message.",
                type: .romanticRejection
            )
        ]
    }
    
    private func getAgeStyle(_ age: String) -> String {
        switch age.lowercased() {
        case "teens", "10대":
            return "lively and trendy for teens"
        case "20s", "20대":
            return "active and modern for twenties"
        case "30s", "30대":
            return "stable and sophisticated for thirties"
        case "40s", "40대":
            return "mature and classy for forties"
        case "50plus", "50대이상":
            return "calm and wise for 50s and above"
        default:
            return "natural and appropriate"
        }
    }
    
    private func generateSingleResponse(for message: String, style: (name: String, prompt: String, type: AIResponse.ResponseType), completion: @escaping (Result<AIResponse, Error>) -> Void) {
        
        guard let url = URL(string: "\(baseURL)?key=\(apiKey)") else {
            completion(.failure(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        let fullPrompt = """
        User message: "\(message)"
        
        \(style.prompt)
        """
        
        let requestBody: [String: Any] = [
            "contents": [
                [
                    "parts": [
                        [
                            "text": fullPrompt
                        ]
                    ]
                ]
            ],
            "generationConfig": [
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 200
            ]
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let candidates = json["candidates"] as? [[String: Any]],
                   let firstCandidate = candidates.first,
                   let content = firstCandidate["content"] as? [String: Any],
                   let parts = content["parts"] as? [[String: Any]],
                   let firstPart = parts.first,
                   let text = firstPart["text"] as? String {
                    
                    let cleanedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
                    let aiResponse = AIResponse(styleName: style.name, content: cleanedText, type: style.type)
                    completion(.success(aiResponse))
                } else {
                    // Try to parse error response
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let error = json["error"] as? [String: Any],
                       let message = error["message"] as? String {
                        completion(.failure(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "API Error: \(message)"])))
                    } else {
                        completion(.failure(NSError(domain: "AIService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to parse response"])))
                    }
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// MARK: - Error Extensions
extension AIService {
    enum AIServiceError: LocalizedError {
        case invalidURL
        case noDataReceived
        case invalidResponse
        case apiError(String)
        
        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Invalid URL"
            case .noDataReceived:
                return "No data received from server"
            case .invalidResponse:
                return "Invalid response format"
            case .apiError(let message):
                return "API Error: \(message)"
            }
        }
    }
}
