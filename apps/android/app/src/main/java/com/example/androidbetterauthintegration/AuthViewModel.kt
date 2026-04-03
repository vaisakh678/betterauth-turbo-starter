package com.example.androidbetterauthintegration

import android.content.Context
import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class AuthState(
    val isAuthenticated: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
    val otpSent: Boolean = false,
    val userEmail: String = "",
)

class AuthViewModel : ViewModel() {
    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state

    // With adb reverse tcp:3001 tcp:3001, the emulator can reach localhost directly
    private val baseURL = "http://localhost:3001"

    fun init(context: Context) {
        val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", null)
        val email = prefs.getString("auth_email", null)
        if (token != null && email != null) {
            _state.value = _state.value.copy(isAuthenticated = true, userEmail = email)
        }
    }

    fun sendOTP(email: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            try {
                val result = withContext(Dispatchers.IO) {
                    val url = URL("$baseURL/api/auth/email-otp/send-verification-otp")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true

                    val body = JSONObject().apply {
                        put("email", email)
                        put("type", "sign-in")
                    }

                    OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                    conn.responseCode
                }

                if (result == 200) {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        otpSent = true,
                        userEmail = email,
                    )
                } else {
                    _state.value = _state.value.copy(isLoading = false, error = "Failed to send OTP")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun verifyOTP(otp: String, context: Context) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            try {
                val result = withContext(Dispatchers.IO) {
                    val url = URL("$baseURL/api/auth/sign-in/email-otp")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true

                    val body = JSONObject().apply {
                        put("email", _state.value.userEmail)
                        put("otp", otp)
                    }

                    OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }

                    if (conn.responseCode == 200) {
                        val responseBody = conn.inputStream.bufferedReader().readText()
                        JSONObject(responseBody)
                    } else {
                        null
                    }
                }

                if (result != null) {
                    val token = result.optString("token", "")
                    saveSession(context, token, _state.value.userEmail)
                    _state.value = _state.value.copy(isLoading = false, isAuthenticated = true)
                } else {
                    _state.value = _state.value.copy(isLoading = false, error = "Invalid OTP")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun handleGoogleCallback(token: String, context: Context) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            try {
                val email = withContext(Dispatchers.IO) {
                    val url = URL("$baseURL/api/auth/get-session")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.setRequestProperty("Cookie", "better-auth.session_token=$token")

                    if (conn.responseCode == 200) {
                        val responseBody = conn.inputStream.bufferedReader().readText()
                        val json = JSONObject(responseBody)
                        val session = json.optJSONObject("session")
                        val user = json.optJSONObject("user")
                        user?.optString("email", "") ?: ""
                    } else {
                        null
                    }
                }

                if (!email.isNullOrEmpty()) {
                    saveSession(context, token, email)
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        userEmail = email,
                    )
                } else {
                    _state.value = _state.value.copy(isLoading = false, error = "Failed to get user info")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun getGoogleSignInUrl(): String {
        return "$baseURL/api/auth/mobile/google-android"
    }

    fun signOut(context: Context) {
        val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        _state.value = AuthState()
    }

    fun resetToEmail() {
        _state.value = _state.value.copy(otpSent = false, error = null)
    }

    private fun saveSession(context: Context, token: String, email: String) {
        val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("auth_token", token)
            .putString("auth_email", email)
            .apply()
    }
}
