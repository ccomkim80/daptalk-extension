import UIKit

class ResponseCell: UICollectionViewCell {
    
    // MARK: - UI Elements
    private let containerView = UIView()
    private let styleLabel = UILabel()
    private let contentLabel = UILabel()
    private let typeIndicator = UIView()
    
    // MARK: - Initialization
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    // MARK: - UI Setup
    private func setupUI() {
        // Configure container view
        containerView.backgroundColor = UIColor.systemBackground
        containerView.layer.cornerRadius = 12.0
        containerView.layer.borderWidth = 1.0
        containerView.layer.borderColor = UIColor.systemGray4.cgColor
        containerView.layer.shadowColor = UIColor.black.cgColor
        containerView.layer.shadowOffset = CGSize(width: 0, height: 2)
        containerView.layer.shadowRadius = 4.0
        containerView.layer.shadowOpacity = 0.1
        
        // Configure style label
        styleLabel.font = UIFont.boldSystemFont(ofSize: 14)
        styleLabel.textColor = .systemBlue
        styleLabel.textAlignment = .left
        styleLabel.numberOfLines = 1
        
        // Configure content label
        contentLabel.font = UIFont.systemFont(ofSize: 12)
        contentLabel.textColor = .label
        contentLabel.textAlignment = .left
        contentLabel.numberOfLines = 0
        contentLabel.lineBreakMode = .byWordWrapping
        
        // Configure type indicator
        typeIndicator.layer.cornerRadius = 4.0
        
        // Add subviews
        contentView.addSubview(containerView)
        containerView.addSubview(typeIndicator)
        containerView.addSubview(styleLabel)
        containerView.addSubview(contentLabel)
        
        // Setup constraints
        setupConstraints()
    }
    
    private func setupConstraints() {
        containerView.translatesAutoresizingMaskIntoConstraints = false
        typeIndicator.translatesAutoresizingMaskIntoConstraints = false
        styleLabel.translatesAutoresizingMaskIntoConstraints = false
        contentLabel.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            // Container view
            containerView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 4),
            containerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 4),
            containerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -4),
            containerView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -4),
            
            // Type indicator
            typeIndicator.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 8),
            typeIndicator.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 8),
            typeIndicator.widthAnchor.constraint(equalToConstant: 8),
            typeIndicator.heightAnchor.constraint(equalToConstant: 8),
            
            // Style label
            styleLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 8),
            styleLabel.leadingAnchor.constraint(equalTo: typeIndicator.trailingAnchor, constant: 8),
            styleLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -8),
            
            // Content label
            contentLabel.topAnchor.constraint(equalTo: styleLabel.bottomAnchor, constant: 8),
            contentLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 8),
            contentLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -8),
            contentLabel.bottomAnchor.constraint(lessThanOrEqualTo: containerView.bottomAnchor, constant: -8)
        ])
    }
    
    // MARK: - Configuration
    func configure(with response: AIResponse) {
        styleLabel.text = response.styleName
        contentLabel.text = response.content
        
        // Set type indicator color based on response type
        switch response.type {
        case .friendly:
            typeIndicator.backgroundColor = .systemGreen
        case .polite:
            typeIndicator.backgroundColor = .systemBlue
        case .humorous:
            typeIndicator.backgroundColor = .systemOrange
        case .rejection:
            typeIndicator.backgroundColor = .systemRed
        case .romantic:
            typeIndicator.backgroundColor = .systemPink
        case .interest:
            typeIndicator.backgroundColor = .systemPink
        case .attractive:
            typeIndicator.backgroundColor = .systemPurple
        case .intimacy:
            typeIndicator.backgroundColor = .systemRed
        case .romanticRejection:
            typeIndicator.backgroundColor = .systemGray
        }
        
        // Update border color to match type
        containerView.layer.borderColor = typeIndicator.backgroundColor?.cgColor
    }
    
    // MARK: - Cell Lifecycle
    override func prepareForReuse() {
        super.prepareForReuse()
        styleLabel.text = nil
        contentLabel.text = nil
        typeIndicator.backgroundColor = .systemGray
        containerView.layer.borderColor = UIColor.systemGray4.cgColor
    }
    
    // MARK: - Highlight Animation
    override var isSelected: Bool {
        didSet {
            UIView.animate(withDuration: 0.2) {
                self.containerView.transform = self.isSelected ? CGAffineTransform(scaleX: 0.95, y: 0.95) : .identity
                self.containerView.alpha = self.isSelected ? 0.8 : 1.0
            }
        }
    }
    
    override var isHighlighted: Bool {
        didSet {
            UIView.animate(withDuration: 0.1) {
                self.containerView.transform = self.isHighlighted ? CGAffineTransform(scaleX: 0.95, y: 0.95) : .identity
            }
        }
    }
}
