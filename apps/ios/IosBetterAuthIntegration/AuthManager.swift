import Foundation
import Observation

@Observable
@MainActor
class AuthManager {
    var isAuthenticated = false
    var isLoading = false
    var error: String?
    var otpSent = false
    var userEmail: String = ""

    private let baseURL = "http://localhost:3001"

    init() {
        checkExistingSession()
    }

    func sendOTP(email: String) async {
        isLoading = true
        error = nil

        do {
            let url = URL(string: "\(baseURL)/api/auth/email-otp/send-verification-otp")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(["email": email, "type": "sign-in"])

            let (_, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                error = "Failed to send OTP"
                isLoading = false
                return
            }

            userEmail = email
            otpSent = true
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func verifyOTP(otp: String) async {
        isLoading = true
        error = nil

        do {
            let url = URL(string: "\(baseURL)/api/auth/sign-in/email-otp")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(["email": userEmail, "otp": otp])

            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                error = "Invalid OTP"
                isLoading = false
                return
            }

            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let token = json["token"] as? String {
                UserDefaults.standard.set(token, forKey: "auth_token")
            }
            UserDefaults.standard.set(userEmail, forKey: "auth_email")

            isAuthenticated = true
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func signOut() {
        UserDefaults.standard.removeObject(forKey: "auth_token")
        UserDefaults.standard.removeObject(forKey: "auth_email")
        isAuthenticated = false
        otpSent = false
        userEmail = ""
        error = nil
    }

    private func checkExistingSession() {
        if let email = UserDefaults.standard.string(forKey: "auth_email"),
           UserDefaults.standard.string(forKey: "auth_token") != nil {
            userEmail = email
            isAuthenticated = true
        }
    }
}
