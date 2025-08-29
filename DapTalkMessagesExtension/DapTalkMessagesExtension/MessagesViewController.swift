import UIKit
import Messages

class MessagesViewController: MSMessagesAppViewController {
    
    // MARK: - Properties
    private var modeSegmentedControl: UISegmentedControl!
    private var chatTextView: UITextView!
    private var responseStackView: UIStackView!
    private var loadingIndicator: UIActivityIndicatorView!
    private var genderSegmentedControl: UISegmentedControl!
    private var opponentGenderSegmentedControl: UISegmentedControl!
    private var analyzeButton: UIButton!
    
    private var currentMode: ChatMode = .general
    private var userGender: Gender = .none
    private var opponentGender: Gender = .none
    private let geminiAPIKey = "AIzaSyCPOkqRbG_H-Uybu5S25uHw-qkrTiAJ0IQ"
    
    enum ChatMode: Int, CaseIterable {
        case general = 0
        case dating = 1
        
        var title: String {
            switch self {
            case .general: return "General"
            case .dating: return "Dating"
            }
        }
    }
    
    enum Gender: Int, CaseIterable {
        case none = -1
        case male = 0
        case female = 1
        
        var title: String {
            switch self {
            case .none: return "None"
            case .male: return "Male"
            case .female: return "Female"
            }
        }
    }
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        createUIElements()
        setupUI()
        setupConversationObserver()
    }
    
    // MARK: - UI Creation
    private func createUIElements() {
        // Create main scroll view
        let scrollView = UIScrollView()
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scrollView)
        
        // Create content view
        let contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentView)
        
        // Create UI elements
        modeSegmentedControl = UISegmentedControl(items: ["General", "Dating"])
        modeSegmentedControl.selectedSegmentIndex = 0
        modeSegmentedControl.translatesAutoresizingMaskIntoConstraints = false
        
        genderSegmentedControl = UISegmentedControl(items: ["Male", "Female"])
        genderSegmentedControl.translatesAutoresizingMaskIntoConstraints = false
        
        opponentGenderSegmentedControl = UISegmentedControl(items: ["Male", "Female"])
        opponentGenderSegmentedControl.translatesAutoresizingMaskIntoConstraints = false
        
        chatTextView = UITextView()
        chatTextView.text = "Paste or load your conversation here..."
        chatTextView.font = UIFont.systemFont(ofSize: 16)
        chatTextView.layer.borderColor = UIColor.systemGray4.cgColor
        chatTextView.layer.borderWidth = 1
        chatTextView.layer.cornerRadius = 8
        chatTextView.translatesAutoresizingMaskIntoConstraints = false
        
        analyzeButton = UIButton(type: .system)
        analyzeButton.setTitle("Analyze & Get AI Responses", for: .normal)
        analyzeButton.backgroundColor = UIColor.systemBlue
        analyzeButton.setTitleColor(.white, for: .normal)
        analyzeButton.layer.cornerRadius = 8
        analyzeButton.translatesAutoresizingMaskIntoConstraints = false
        
        loadingIndicator = UIActivityIndicatorView(style: .medium)
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        
        responseStackView = UIStackView()
        responseStackView.axis = .vertical
        responseStackView.spacing = 8
        responseStackView.translatesAutoresizingMaskIntoConstraints = false
        
        // Add to content view
        contentView.addSubview(modeSegmentedControl)
        contentView.addSubview(genderSegmentedControl)
        contentView.addSubview(opponentGenderSegmentedControl)
        contentView.addSubview(chatTextView)
        contentView.addSubview(analyzeButton)
        contentView.addSubview(loadingIndicator)
        contentView.addSubview(responseStackView)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            // Scroll view constraints
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            // Content view constraints
            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            
            // Mode segmented control
            modeSegmentedControl.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            modeSegmentedControl.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            modeSegmentedControl.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            
            // Gender controls
            genderSegmentedControl.topAnchor.constraint(equalTo: modeSegmentedControl.bottomAnchor, constant: 20),
            genderSegmentedControl.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            genderSegmentedControl.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            
            opponentGenderSegmentedControl.topAnchor.constraint(equalTo: genderSegmentedControl.bottomAnchor, constant: 10),
            opponentGenderSegmentedControl.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            opponentGenderSegmentedControl.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            
            // Text view
            chatTextView.topAnchor.constraint(equalTo: opponentGenderSegmentedControl.bottomAnchor, constant: 20),
            chatTextView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            chatTextView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            chatTextView.heightAnchor.constraint(equalToConstant: 120),
            
            // Analyze button
            analyzeButton.topAnchor.constraint(equalTo: chatTextView.bottomAnchor, constant: 20),
            analyzeButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            analyzeButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            analyzeButton.heightAnchor.constraint(equalToConstant: 44),
            
            // Loading indicator
            loadingIndicator.topAnchor.constraint(equalTo: analyzeButton.bottomAnchor, constant: 20),
            loadingIndicator.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            
            // Response stack view
            responseStackView.topAnchor.constraint(equalTo: loadingIndicator.bottomAnchor, constant: 20),
            responseStackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            responseStackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20),
            responseStackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20)
        ])
    }
    
    // MARK: - UI Setup
    private func setupUI() {
        // Configure mode segmented control
        modeSegmentedControl.removeAllSegments()
        for (index, mode) in ChatMode.allCases.enumerated() {
            modeSegmentedControl.insertSegment(withTitle: mode.title, at: index, animated: false)
        }
        modeSegmentedControl.selectedSegmentIndex = 0
        modeSegmentedControl.addTarget(self, action: #selector(modeChanged), for: .valueChanged)
        
        // Configure gender controls
        setupGenderControls()
        
        // Configure chat text view
        chatTextView.layer.borderColor = UIColor.systemGray4.cgColor
        chatTextView.layer.borderWidth = 1
        chatTextView.layer.cornerRadius = 8
        chatTextView.font = UIFont.systemFont(ofSize: 16)
        
        // Configure analyze button
        analyzeButton.backgroundColor = UIColor.systemBlue
        analyzeButton.setTitleColor(.white, for: .normal)
        analyzeButton.layer.cornerRadius = 8
        analyzeButton.addTarget(self, action: #selector(analyzeConversation), for: .touchUpInside)
        
        // Configure loading indicator
        loadingIndicator.hidesWhenStopped = true
        
        updateUIForMode()
    }
    
    private func setupGenderControls() {
        // User gender control
        genderSegmentedControl.removeAllSegments()
        for (index, gender) in [Gender.male, Gender.female].enumerated() {
            genderSegmentedControl.insertSegment(withTitle: gender.title, at: index, animated: false)
        }
        genderSegmentedControl.addTarget(self, action: #selector(genderChanged), for: .valueChanged)
        
        // Opponent gender control
        opponentGenderSegmentedControl.removeAllSegments()
        for (index, gender) in [Gender.male, Gender.female].enumerated() {
            opponentGenderSegmentedControl.insertSegment(withTitle: gender.title, at: index, animated: false)
        }
        opponentGenderSegmentedControl.addTarget(self, action: #selector(opponentGenderChanged), for: .valueChanged)
    }
    
    private func setupConversationObserver() {
        // Auto-load conversation when extension is opened
        loadRecentConversation()
    }
    
    // MARK: - Actions
    @objc private func modeChanged() {
        currentMode = ChatMode(rawValue: modeSegmentedControl.selectedSegmentIndex) ?? .general
        updateUIForMode()
    }
    
    @objc private func genderChanged() {
        userGender = Gender(rawValue: genderSegmentedControl.selectedSegmentIndex) ?? .none
    }
    
    @objc private func opponentGenderChanged() {
        opponentGender = Gender(rawValue: opponentGenderSegmentedControl.selectedSegmentIndex) ?? .none
    }
    
    @objc private func analyzeConversation() {
        guard !chatTextView.text.isEmpty else {
            showAlert(title: "Empty Conversation", message: "Please enter or load a conversation to analyze.")
            return
        }
        
        if currentMode == .dating {
            guard userGender != .none && opponentGender != .none else {
                showAlert(title: "Gender Selection Required", message: "Please select both your gender and your opponent's gender for dating mode.")
                return
            }
        }
        
        generateAIResponses()
    }
    
    @objc private func responseButtonTapped(_ sender: UIButton) {
        guard let responseText = sender.titleLabel?.text else { return }
        
        // Copy to clipboard
        UIPasteboard.general.string = responseText
        
        // Create and send message
        if let activeConv = activeConversation {
            let message = MSMessage()
            let layout = MSMessageTemplateLayout()
            layout.caption = "DapTalk AI Response"
            layout.subcaption = responseText
            layout.image = UIImage(systemName: "message.fill")
            message.layout = layout
            
            activeConv.insert(message) { error in
                if let error = error {
                    print("Error inserting message: \(error)")
                } else {
                    print("Message sent successfully")
                }
            }
        }
        
        // Show feedback
        let alert = UIAlertController(title: "Response Sent", message: "The response has been copied to clipboard and sent to the conversation.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    // MARK: - UI Updates
    private func updateUIForMode() {
        let isDatingMode = currentMode == .dating
        genderSegmentedControl.isHidden = !isDatingMode
        opponentGenderSegmentedControl.isHidden = !isDatingMode
        
        // Update placeholder text based on mode
        if isDatingMode {
            chatTextView.text = "Paste or load your dating conversation here..."
        } else {
            chatTextView.text = "Paste or load your conversation here..."
        }
    }
    
    // MARK: - Conversation Loading
    private func loadRecentConversation() {
        guard let _ = activeConversation else { return }
        
        // Get recent messages from the conversation
        let conversationText = ""
        
        // Note: In a real implementation, you would need to access the conversation messages
        // For now, we'll use a placeholder
        if conversationText.isEmpty {
            // Could load recent messages here in the future
            print("No recent conversation found. Please paste your conversation text manually.")
        }
        
        chatTextView.text = conversationText
    }
    
    // MARK: - AI Response Generation
    private func generateAIResponses() {
        loadingIndicator.startAnimating()
        analyzeButton.isEnabled = false
        
        let conversationText = chatTextView.text ?? ""
        let prompt = buildPrompt(for: conversationText)
        
        Task {
            do {
                let responses = try await fetchAIResponses(prompt: prompt)
                await MainActor.run {
                    self.displayResponses(responses)
                    self.loadingIndicator.stopAnimating()
                    self.analyzeButton.isEnabled = true
                }
            } catch {
                await MainActor.run {
                    self.showAlert(title: "Error", message: "Failed to generate AI responses: \(error.localizedDescription)")
                    self.loadingIndicator.stopAnimating()
                    self.analyzeButton.isEnabled = true
                }
            }
        }
    }
    
    private func buildPrompt(for conversationText: String) -> String {
        let basePrompt: String
        
        switch currentMode {
        case .general:
            basePrompt = """
            Analyze this conversation and provide 4 different helpful response options. 
            Consider the context, tone, and provide varied responses (formal, casual, empathetic, direct).
            
            Conversation:
            \(conversationText)
            
            Please provide exactly 4 response options, each on a new line starting with "Option X:".
            """
            
        case .dating:
            let userGenderText = userGender.title
            let opponentGenderText = opponentGender.title
            
            basePrompt = """
            Analyze this dating conversation and provide 4 different romantic/flirty response options.
            User is \(userGenderText), chatting with \(opponentGenderText).
            Consider dating context, flirtation level, and provide varied responses (playful, sincere, witty, caring).
            
            Conversation:
            \(conversationText)
            
            Please provide exactly 4 dating response options, each on a new line starting with "Option X:".
            """
        }
        
        return basePrompt
    }
    
    private func fetchAIResponses(prompt: String) async throws -> [String] {
        let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=\(geminiAPIKey)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody: [String: Any] = [
            "contents": [
                [
                    "parts": [
                        ["text": prompt]
                    ]
                ]
            ]
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        
        guard let candidates = response?["candidates"] as? [[String: Any]],
              let firstCandidate = candidates.first,
              let content = firstCandidate["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let firstPart = parts.first,
              let text = firstPart["text"] as? String else {
            throw NSError(domain: "AIResponseError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid response format"])
        }
        
        // Parse the response to extract 4 options
        let lines = text.components(separatedBy: .newlines)
        var options: [String] = []
        
        for line in lines {
            if line.lowercased().contains("option") && line.contains(":") {
                let parts = line.components(separatedBy: ":")
                if parts.count > 1 {
                    let response = parts.dropFirst().joined(separator: ":").trimmingCharacters(in: .whitespacesAndNewlines)
                    if !response.isEmpty {
                        options.append(response)
                    }
                }
            }
        }
        
        // Ensure we have exactly 4 options
        while options.count < 4 {
            options.append("Sorry, I couldn't generate a response for this option.")
        }
        
        return Array(options.prefix(4))
    }
    
    private func displayResponses(_ responses: [String]) {
        // Clear previous responses
        responseStackView.arrangedSubviews.forEach { $0.removeFromSuperview() }
        
        // Add new response buttons
        for (index, response) in responses.enumerated() {
            let button = UIButton(type: .system)
            button.setTitleColor(.systemBlue, for: .normal)
            button.titleLabel?.numberOfLines = 0
            button.titleLabel?.textAlignment = .left
            button.contentHorizontalAlignment = .left
            button.backgroundColor = UIColor.systemGray6
            button.layer.cornerRadius = 8
            button.layer.borderColor = UIColor.systemGray4.cgColor
            button.layer.borderWidth = 1
            
            // Use configuration instead of deprecated contentEdgeInsets
            var config = UIButton.Configuration.plain()
            config.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
            config.title = response
            button.configuration = config
            
            button.addTarget(self, action: #selector(responseButtonTapped), for: .touchUpInside)
            
            responseStackView.addArrangedSubview(button)
            
            // Add spacing between buttons
            if index < responses.count - 1 {
                let spacer = UIView()
                spacer.translatesAutoresizingMaskIntoConstraints = false
                spacer.heightAnchor.constraint(equalToConstant: 8).isActive = true
                responseStackView.addArrangedSubview(spacer)
            }
        }
    }
    
    // MARK: - Helper Methods
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    // MARK: - MSMessagesAppViewController
    override func willBecomeActive(with conversation: MSConversation) {
        super.willBecomeActive(with: conversation)
        // Load conversation when extension becomes active
        loadRecentConversation()
    }
    
    override func didResignActive(with conversation: MSConversation) {
        super.didResignActive(with: conversation)
        // Clean up if needed
    }
    
    override func didReceive(_ message: MSMessage, conversation: MSConversation) {
        super.didReceive(message, conversation: conversation)
        // Handle received messages if needed
    }
    
    override func didStartSending(_ message: MSMessage, conversation: MSConversation) {
        super.didStartSending(message, conversation: conversation)
        // Handle message sending start
    }
    
    override func didCancelSending(_ message: MSMessage, conversation: MSConversation) {
        super.didCancelSending(message, conversation: conversation)
        // Handle message sending cancellation
    }
    
    override func willTransition(to presentationStyle: MSMessagesAppPresentationStyle) {
        super.willTransition(to: presentationStyle)
        // Handle presentation style changes
    }
}
