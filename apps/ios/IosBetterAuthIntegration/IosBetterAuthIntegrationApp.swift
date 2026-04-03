import SwiftUI

@main
struct IosBetterAuthIntegrationApp: App {
    @State private var authManager = AuthManager()

    var body: some Scene {
        WindowGroup {
            if authManager.isAuthenticated {
                HomeScreen(authManager: authManager)
            } else {
                AuthScreen(authManager: authManager)
            }
        }
    }
}
