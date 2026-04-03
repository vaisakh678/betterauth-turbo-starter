import Foundation
import AuthenticationServices
import Observation
import SwiftUI

@Observable
@MainActor
class AuthManager {
    var isAuthenticated = false
    var isLoading = false
    var error: String?
    var otpSent = false
    var userEmail: String = ""

    private let baseURL = "http://localhost:3001"
    private var webAuthSession: ASWebAuthenticationSession?
    private let webAuthContextProvider = WebAuthContextProvider()

    init() {
        checkExistingSession()
    }

    // MARK: - Email OTP

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

    // MARK: - Google Sign-In

    func signInWithGoogle() async {
        isLoading = true
        error = nil

        guard let signInURL = URL(string: "\(baseURL)/api/auth/mobile/google") else {
            error = "Invalid sign-in URL"
            isLoading = false
            return
        }

        do {
            let callbackURL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
                let session = ASWebAuthenticationSession(
                    url: signInURL,
                    callbackURLScheme: "iosbetterauthintegration"
                ) { url, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                    } else if let url = url {
                        continuation.resume(returning: url)
                    } else {
                        continuation.resume(throwing: URLError(.badServerResponse))
                    }
                }
                session.prefersEphemeralWebBrowserSession = true
                session.presentationContextProvider = webAuthContextProvider
                self.webAuthSession = session
                session.start()
            }

            guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
                error = "Invalid callback URL"
                isLoading = false
                return
            }

            if let errorParam = components.queryItems?.first(where: { $0.name == "error" })?.value {
                error = "Sign-in failed: \(errorParam)"
                isLoading = false
                return
            }

            if let token = components.queryItems?.first(where: { $0.name == "token" })?.value {
                UserDefaults.standard.set(token, forKey: "auth_token")
                await fetchUserInfo(token: token)
                isAuthenticated = true
            } else {
                error = "No authentication token received"
            }
        } catch {
            let nsError = error as NSError
            if nsError.domain == ASWebAuthenticationSessionError.errorDomain,
               nsError.code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                // User cancelled — not an error
            } else {
                self.error = error.localizedDescription
            }
        }

        webAuthSession = nil
        isLoading = false
    }

    private func fetchUserInfo(token: String) async {
        let url = URL(string: "\(baseURL)/api/auth/get-session")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        if let (data, _) = try? await URLSession.shared.data(for: request),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let user = json["user"] as? [String: Any],
           let email = user["email"] as? String {
            userEmail = email
            UserDefaults.standard.set(email, forKey: "auth_email")
        }
    }

    // MARK: - Sign Out

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

// MARK: - Web Auth Presentation Context

class WebAuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return ASPresentationAnchor()
        }
        return window
    }
}
