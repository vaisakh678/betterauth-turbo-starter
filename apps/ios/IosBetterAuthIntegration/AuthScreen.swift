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

            Button {
                Task { await authManager.signInWithGoogle() }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill")
                        .font(.title2)
                    Text("Continue with Google")
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity, minHeight: 28)
            }
            .buttonStyle(.bordered)
            .tint(.primary)
            .controlSize(.large)
            .disabled(authManager.isLoading)

            HStack {
                Rectangle().frame(height: 1).foregroundStyle(.secondary.opacity(0.3))
                Text("or").font(.caption).foregroundStyle(.secondary)
                Rectangle().frame(height: 1).foregroundStyle(.secondary.opacity(0.3))
            }

            TextField("you@example.com", text: $email)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .frame(height: 50)

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
                        .frame(maxWidth: .infinity, minHeight: 28)
                } else {
                    Text("Send Code")
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity, minHeight: 28)
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
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
                .frame(height: 50)

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
                        .frame(maxWidth: .infinity, minHeight: 28)
                } else {
                    Text("Verify & Sign In")
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity, minHeight: 28)
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
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
