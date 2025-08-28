import UIKit
import Messages

class MessagesViewController: MSMessagesAppViewController {
    
    // MARK: - IBOutlets
    @IBOutlet weak var inputTextView: UITextView!
    @IBOutlet weak var sendButton: UIButton!
    @IBOutlet weak var responseCollectionView: UICollectionView!
    @IBOutlet weak var loadingIndicator: UIActivityIndicatorView!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var inputContainerView: UIView!
    @IBOutlet weak var responsesStackView: UIStackView!
    @IBOutlet weak var settingsButton: UIButton!
    @IBOutlet weak var modeLabel: UILabel!
    @IBOutlet weak var settingsContainerView: UIView!
    @IBOutlet weak var datingModeSwitch: UISwitch!
    @IBOutlet weak var userGenderSegmentedControl: UISegmentedControl!
    @IBOutlet weak var userAgeSegmentedControl: UISegmentedControl!
    @IBOutlet weak var opponentGenderSegmentedControl: UISegmentedControl!
    
    // MARK: - Properties
    private var aiService = AIService()
    private var currentResponses: [AIResponse] = []
    private var isLoading = false
    private var userProfile = UserProfile.default
    private var isSettingsVisible = false
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupCollectionView()
        setupSettings()
        loadUserProfile()
        updateModeDisplay()
    }
    
    // MARK: - UI Setup
    private func setupUI() {
        // Configure title
        titleLabel.text = "DapTalk AI Assistant"
        titleLabel.font = UIFont.boldSystemFont(ofSize: 18)
        titleLabel.textColor = .systemBlue
        
        // Configure input text view
        inputTextView.layer.borderColor = UIColor.systemGray4.cgColor
        inputTextView.layer.borderWidth = 1.0
        inputTextView.layer.cornerRadius = 8.0
        inputTextView.font = UIFont.systemFont(ofSize: 16)
        inputTextView.textContainerInset = UIEdgeInsets(top: 8, left: 8, bottom: 8, right: 8)
        inputTextView.delegate = self
        
        // Configure send button
        sendButton.backgroundColor = .systemBlue
        sendButton.setTitleColor(.white, for: .normal)
        sendButton.layer.cornerRadius = 8.0
        sendButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16)
        sendButton.isEnabled = false
        
        // Configure input container
        inputContainerView.layer.cornerRadius = 12.0
        inputContainerView.backgroundColor = UIColor.systemBackground
        inputContainerView.layer.shadowColor = UIColor.black.cgColor
        inputContainerView.layer.shadowOffset = CGSize(width: 0, height: 2)
        inputContainerView.layer.shadowRadius = 4.0
        inputContainerView.layer.shadowOpacity = 0.1
        
        // Configure loading indicator
        loadingIndicator.hidesWhenStopped = true
        loadingIndicator.color = .systemBlue
        
        // Configure responses stack view
        responsesStackView.axis = .vertical
        responsesStackView.spacing = 12
        responsesStackView.alignment = .fill
        responsesStackView.distribution = .fillEqually
        
        // Configure settings button
        settingsButton.setImage(UIImage(systemName: "gearshape.fill"), for: .normal)
        settingsButton.tintColor = .systemBlue
        
        // Configure mode label
        modeLabel.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        modeLabel.textColor = .systemBlue
        
        // Configure settings container (initially hidden)
        settingsContainerView.isHidden = true
        settingsContainerView.backgroundColor = UIColor.systemBackground
        settingsContainerView.layer.cornerRadius = 12.0
        settingsContainerView.layer.borderWidth = 1.0
        settingsContainerView.layer.borderColor = UIColor.systemGray4.cgColor
    }
    
    private func setupCollectionView() {
        guard let collectionView = responseCollectionView else { return }
        
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumLineSpacing = 12
        layout.minimumInteritemSpacing = 8
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        
        collectionView.collectionViewLayout = layout
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.backgroundColor = .clear
        collectionView.showsVerticalScrollIndicator = false
        
        // Register cell
        collectionView.register(ResponseCell.self, forCellWithReuseIdentifier: "ResponseCell")
    }
    
    private func setupSettings() {
        // Configure segmented controls
        userGenderSegmentedControl.insertSegment(withTitle: "Male", at: 0, animated: false)
        userGenderSegmentedControl.insertSegment(withTitle: "Female", at: 1, animated: false)
        userGenderSegmentedControl.addTarget(self, action: #selector(userGenderChanged(_:)), for: .valueChanged)
        
        userAgeSegmentedControl.insertSegment(withTitle: "Teens", at: 0, animated: false)
        userAgeSegmentedControl.insertSegment(withTitle: "20s", at: 1, animated: false)
        userAgeSegmentedControl.insertSegment(withTitle: "30s", at: 2, animated: false)
        userAgeSegmentedControl.insertSegment(withTitle: "40s", at: 3, animated: false)
        userAgeSegmentedControl.insertSegment(withTitle: "50+", at: 4, animated: false)
        userAgeSegmentedControl.addTarget(self, action: #selector(userAgeChanged(_:)), for: .valueChanged)
        
        opponentGenderSegmentedControl.insertSegment(withTitle: "Male", at: 0, animated: false)
        opponentGenderSegmentedControl.insertSegment(withTitle: "Female", at: 1, animated: false)
        opponentGenderSegmentedControl.addTarget(self, action: #selector(opponentGenderChanged(_:)), for: .valueChanged)
    }
    
    private func loadUserProfile() {
        // Load from UserDefaults if available
        if let data = UserDefaults.standard.data(forKey: "userProfile"),
           let profile = try? JSONDecoder().decode(UserProfile.self, from: data) {
            userProfile = profile
            updateUIFromProfile()
        }
    }
    
    private func saveUserProfile() {
        if let data = try? JSONEncoder().encode(userProfile) {
            UserDefaults.standard.set(data, forKey: "userProfile")
        }
    }
    
    private func updateUIFromProfile() {
        datingModeSwitch.isOn = userProfile.isDatingMode
        
        switch userProfile.gender {
        case "male": userGenderSegmentedControl.selectedSegmentIndex = 0
        case "female": userGenderSegmentedControl.selectedSegmentIndex = 1
        default: userGenderSegmentedControl.selectedSegmentIndex = UISegmentedControl.noSegment
        }
        
        switch userProfile.age {
        case "teens": userAgeSegmentedControl.selectedSegmentIndex = 0
        case "20s": userAgeSegmentedControl.selectedSegmentIndex = 1
        case "30s": userAgeSegmentedControl.selectedSegmentIndex = 2
        case "40s": userAgeSegmentedControl.selectedSegmentIndex = 3
        case "50plus": userAgeSegmentedControl.selectedSegmentIndex = 4
        default: userAgeSegmentedControl.selectedSegmentIndex = UISegmentedControl.noSegment
        }
        
        switch userProfile.opponentGender {
        case "male": opponentGenderSegmentedControl.selectedSegmentIndex = 0
        case "female": opponentGenderSegmentedControl.selectedSegmentIndex = 1
        default: opponentGenderSegmentedControl.selectedSegmentIndex = UISegmentedControl.noSegment
        }
        
        updateModeDisplay()
    }
    
    private func updateModeDisplay() {
        if userProfile.isDatingMode {
            modeLabel.text = "💕 Dating Mode"
            modeLabel.textColor = .systemPink
        } else {
            modeLabel.text = "💬 Chat Mode"
            modeLabel.textColor = .systemBlue
        }
    }
    
    // MARK: - IBActions
    @IBAction func sendButtonTapped(_ sender: UIButton) {
        guard let userMessage = inputTextView.text, !userMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return
        }
        
        generateAIResponses(for: userMessage)
    }
    
    @IBAction func settingsButtonTapped(_ sender: UIButton) {
        isSettingsVisible.toggle()
        UIView.animate(withDuration: 0.3) {
            self.settingsContainerView.isHidden = !self.isSettingsVisible
        }
    }
    
    @IBAction func datingModeSwitchChanged(_ sender: UISwitch) {
        userProfile = UserProfile(
            gender: userProfile.gender,
            age: userProfile.age,
            opponentGender: userProfile.opponentGender,
            isDatingMode: sender.isOn
        )
        saveUserProfile()
        updateModeDisplay()
        
        // Clear previous responses when switching modes
        currentResponses.removeAll()
        updateResponsesUI()
    }
    
    @objc private func userGenderChanged(_ sender: UISegmentedControl) {
        let gender = sender.selectedSegmentIndex == 0 ? "male" : sender.selectedSegmentIndex == 1 ? "female" : ""
        userProfile = UserProfile(
            gender: gender,
            age: userProfile.age,
            opponentGender: userProfile.opponentGender,
            isDatingMode: userProfile.isDatingMode
        )
        saveUserProfile()
    }
    
    @objc private func userAgeChanged(_ sender: UISegmentedControl) {
        let ages = ["teens", "20s", "30s", "40s", "50plus"]
        let age = sender.selectedSegmentIndex >= 0 && sender.selectedSegmentIndex < ages.count ? 
                  ages[sender.selectedSegmentIndex] : ""
        userProfile = UserProfile(
            gender: userProfile.gender,
            age: age,
            opponentGender: userProfile.opponentGender,
            isDatingMode: userProfile.isDatingMode
        )
        saveUserProfile()
    }
    
    @objc private func opponentGenderChanged(_ sender: UISegmentedControl) {
        let opponentGender = sender.selectedSegmentIndex == 0 ? "male" : sender.selectedSegmentIndex == 1 ? "female" : ""
        userProfile = UserProfile(
            gender: userProfile.gender,
            age: userProfile.age,
            opponentGender: opponentGender,
            isDatingMode: userProfile.isDatingMode
        )
        saveUserProfile()
    }
    
    // MARK: - AI Response Generation
    private func generateAIResponses(for message: String) {
        setLoadingState(true)
        
        aiService.generateResponses(for: message, userProfile: userProfile) { [weak self] result in
            DispatchQueue.main.async {
                self?.setLoadingState(false)
                
                switch result {
                case .success(let responses):
                    self?.currentResponses = responses
                    self?.updateResponsesUI()
                case .failure(let error):
                    self?.showError(error.localizedDescription)
                }
            }
        }
    }
    
    private func setLoadingState(_ loading: Bool) {
        isLoading = loading
        sendButton.isEnabled = !loading && !inputTextView.text.isEmpty
        
        if loading {
            loadingIndicator.startAnimating()
            currentResponses.removeAll()
            updateResponsesUI()
        } else {
            loadingIndicator.stopAnimating()
        }
    }
    
    private func updateResponsesUI() {
        // Clear existing response views
        responsesStackView.arrangedSubviews.forEach { $0.removeFromSuperview() }
        
        // Add new response buttons
        for (index, response) in currentResponses.enumerated() {
            let responseButton = createResponseButton(for: response, at: index)
            responsesStackView.addArrangedSubview(responseButton)
        }
        
        // Show/hide collection view based on responses
        responseCollectionView.isHidden = currentResponses.isEmpty
        if !currentResponses.isEmpty {
            responseCollectionView.reloadData()
        }
    }
    
    private func createResponseButton(for response: AIResponse, at index: Int) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(response.styleName, for: .normal)
        button.setTitleColor(.systemBlue, for: .normal)
        button.backgroundColor = UIColor.systemBlue.withAlphaComponent(0.1)
        button.layer.cornerRadius = 8.0
        button.layer.borderWidth = 1.0
        button.layer.borderColor = UIColor.systemBlue.cgColor
        button.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        button.contentEdgeInsets = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
        button.tag = index
        
        button.addTarget(self, action: #selector(responseButtonTapped(_:)), for: .touchUpInside)
        
        return button
    }
    
    @objc private func responseButtonTapped(_ sender: UIButton) {
        let index = sender.tag
        guard index < currentResponses.count else { return }
        
        let selectedResponse = currentResponses[index]
        sendSelectedResponse(selectedResponse.content)
    }
    
    private func sendSelectedResponse(_ responseText: String) {
        // Create and send iMessage
        let message = MSMessage()
        let layout = MSMessageTemplateLayout()
        layout.caption = responseText
        layout.subcaption = "Generated by DapTalk AI"
        layout.trailingCaption = "AI"
        
        message.layout = layout
        
        // Send the message
        activeConversation?.insert(message) { [weak self] error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.showError("Failed to send message: \(error.localizedDescription)")
                }
            } else {
                DispatchQueue.main.async {
                    self?.clearInput()
                }
            }
        }
    }
    
    private func clearInput() {
        inputTextView.text = ""
        sendButton.isEnabled = false
        currentResponses.removeAll()
        updateResponsesUI()
    }
    
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UITextViewDelegate
extension MessagesViewController: UITextViewDelegate {
    func textViewDidChange(_ textView: UITextView) {
        let hasText = !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        sendButton.isEnabled = hasText && !isLoading
    }
    
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if text == "\n" {
            if sendButton.isEnabled {
                sendButtonTapped(sendButton)
            }
            return false
        }
        return true
    }
}

// MARK: - UICollectionViewDataSource
extension MessagesViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return currentResponses.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ResponseCell", for: indexPath) as! ResponseCell
        let response = currentResponses[indexPath.item]
        cell.configure(with: response)
        return cell
    }
}

// MARK: - UICollectionViewDelegate
extension MessagesViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let selectedResponse = currentResponses[indexPath.item]
        sendSelectedResponse(selectedResponse.content)
    }
}

// MARK: - UICollectionViewDelegateFlowLayout
extension MessagesViewController: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        let width = (collectionView.bounds.width - 48) / 2 // 2 columns with spacing
        return CGSize(width: width, height: 120)
    }
}
