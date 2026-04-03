import SwiftUI

struct AuthScreen: View {
    @Bindable var authManager: AuthManager
    @State private var email = ""
    @State private var otp = ""

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Sign In")
                .font(.largeTitle)
                .fontWeight(.bold)

            if !authManager.otpSent {
                emailStep
            } else {
                otpStep
            }

            Spacer()
        }
        .padding()
    }

    private var emailStep: some View {
        VStack(spacing: 16) {
            Text("Enter your email to receive a login code")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            TextField("you@example.com", text: $email)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)

            if let error = authManager.error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            Button {
                Task { await authManager.sendOTP(email: email) }
            } label: {
                if authManager.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Send Code")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(email.isEmpty || authManager.isLoading)
        }
    }

    private var otpStep: some View {
        VStack(spacing: 16) {
            Text("We sent a code to \(authManager.userEmail)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            TextField("Enter 6-digit code", text: $otp)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.title2.monospaced())

            if let error = authManager.error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            Button {
                Task { await authManager.verifyOTP(otp: otp) }
            } label: {
                if authManager.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Verify & Sign In")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(otp.isEmpty || authManager.isLoading)

            Button("Use a different email") {
                authManager.otpSent = false
                authManager.error = nil
                otp = ""
            }
            .foregroundStyle(.secondary)
        }
    }
}
