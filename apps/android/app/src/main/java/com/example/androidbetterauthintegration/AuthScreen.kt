package com.example.androidbetterauthintegration

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AuthScreen(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "Sign In",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                )

                if (!state.otpSent) {
                    EmailStep(
                        state = state,
                        onSendOTP = { email -> viewModel.sendOTP(email) },
                        onGoogleSignIn = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(viewModel.getGoogleSignInUrl()))
                            context.startActivity(intent)
                        },
                    )
                } else {
                    OTPStep(
                        state = state,
                        onVerifyOTP = { otp -> viewModel.verifyOTP(otp, context) },
                        onBack = { viewModel.resetToEmail() },
                    )
                }
            }
        }
    }
}

@Composable
private fun EmailStep(
    state: AuthState,
    onSendOTP: (String) -> Unit,
    onGoogleSignIn: () -> Unit,
) {
    var email by remember { mutableStateOf("") }

    Text(
        text = "Enter your email to receive a login code",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    OutlinedButton(
        onClick = onGoogleSignIn,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = !state.isLoading,
    ) {
        Text("Continue with Google", fontSize = 16.sp)
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        HorizontalDivider(modifier = Modifier.weight(1f))
        Text(
            text = "  or  ",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        HorizontalDivider(modifier = Modifier.weight(1f))
    }

    OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        label = { Text("you@example.com") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
    )

    state.error?.let {
        Text(
            text = it,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall,
        )
    }

    Button(
        onClick = { onSendOTP(email) },
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = email.isNotBlank() && !state.isLoading,
    ) {
        if (state.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary,
            )
        } else {
            Text("Send Code", fontSize = 16.sp)
        }
    }
}

@Composable
private fun OTPStep(
    state: AuthState,
    onVerifyOTP: (String) -> Unit,
    onBack: () -> Unit,
) {
    var otp by remember { mutableStateOf("") }

    Text(
        text = "We sent a code to ${state.userEmail}",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    OutlinedTextField(
        value = otp,
        onValueChange = { if (it.length <= 6) otp = it },
        label = { Text("Enter 6-digit code") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        textStyle = LocalTextStyle.current.copy(
            textAlign = TextAlign.Center,
            fontSize = 20.sp,
            letterSpacing = 4.sp,
        ),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
    )

    state.error?.let {
        Text(
            text = it,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall,
        )
    }

    Button(
        onClick = { onVerifyOTP(otp) },
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = otp.isNotBlank() && !state.isLoading,
    ) {
        if (state.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary,
            )
        } else {
            Text("Verify & Sign In", fontSize = 16.sp)
        }
    }

    TextButton(onClick = onBack) {
        Text("Use a different email")
    }
}
