package com.example.androidbetterauthintegration

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.androidbetterauthintegration.ui.theme.AndroidBetterAuthIntegrationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val authViewModel: AuthViewModel = viewModel()
            authViewModel.init(this)

            // Handle deep link from Google OAuth callback
            handleDeepLink(intent, authViewModel)

            AndroidBetterAuthIntegrationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    val state = authViewModel.state.collectAsState()

                    if (state.value.isAuthenticated) {
                        HomeScreen(viewModel = authViewModel)
                    } else {
                        AuthScreen(viewModel = authViewModel)
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle deep link when app is already running
        setContent {
            val authViewModel: AuthViewModel = viewModel()
            handleDeepLink(intent, authViewModel)

            AndroidBetterAuthIntegrationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    val state = authViewModel.state.collectAsState()

                    if (state.value.isAuthenticated) {
                        HomeScreen(viewModel = authViewModel)
                    } else {
                        AuthScreen(viewModel = authViewModel)
                    }
                }
            }
        }
    }

    private fun handleDeepLink(intent: Intent?, viewModel: AuthViewModel) {
        val uri = intent?.data ?: return
        if (uri.scheme == "androidbetterauthintegration" && uri.host == "auth-callback") {
            val token = uri.getQueryParameter("token")
            val error = uri.getQueryParameter("error")

            if (token != null) {
                viewModel.handleGoogleCallback(token, this)
            }
        }
    }
}
