import SwiftUI

struct HomeScreen: View {
    @Bindable var authManager: AuthManager

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Welcome")
                .font(.largeTitle)
                .fontWeight(.bold)

            VStack(spacing: 4) {
                Text("Signed in as")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(authManager.userEmail)
                    .font(.body)
                    .fontWeight(.medium)
            }

            Button {
                authManager.signOut()
            } label: {
                Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)

            Spacer()
        }
        .padding()
    }
}
