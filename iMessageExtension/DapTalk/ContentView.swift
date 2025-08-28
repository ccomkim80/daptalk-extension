import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "message.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            Text("DapTalk AI Assistant")
                .font(.title)
                .fontWeight(.bold)
            
            Text("AI-powered message suggestions for iMessage")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            VStack(alignment: .leading, spacing: 10) {
                Text("How to use:")
                    .font(.headline)
                
                HStack {
                    Image(systemName: "1.circle.fill")
                        .foregroundColor(.blue)
                    Text("Open Messages app")
                }
                
                HStack {
                    Image(systemName: "2.circle.fill")
                        .foregroundColor(.blue)
                    Text("Start a conversation")
                }
                
                HStack {
                    Image(systemName: "3.circle.fill")
                        .foregroundColor(.blue)
                    Text("Tap the App Store icon")
                }
                
                HStack {
                    Image(systemName: "4.circle.fill")
                        .foregroundColor(.blue)
                    Text("Select DapTalk Assistant")
                }
                
                HStack {
                    Image(systemName: "5.circle.fill")
                        .foregroundColor(.blue)
                    Text("Get AI-powered suggestions!")
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
            
            Spacer()
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
