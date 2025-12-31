package com.barakah.watch

import android.Manifest
import android.os.Bundle
import androidx.lifecycle.lifecycleScope
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.barakah.watch.screens.*
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Handle Tile Actions
        val action = intent.getStringExtra("action")
        if (action != null) {
            handleTileAction(action)
        }
        
        setContent {
            BarakahWatchApp()
        }
    }

    private fun handleTileAction(action: String) {
        val syncManager = com.barakah.watch.data.SyncManager(this)
        lifecycleScope.launchWhenStarted {
            when (action) {
                "save_location" -> {
                    // In a real app, retrieve actual location here
                    // For demo/testing: send dummy location
                    syncManager.saveCurrentLocation(-34.6037, -58.3816, "تم الحفظ من الاختصار")
                    android.widget.Toast.makeText(this@MainActivity, "تم إرسال الموقع للجوال", android.widget.Toast.LENGTH_SHORT).show()
                }
                "quick_expense" -> {
                    syncManager.addTransaction(500.0, "مصروف سريع", "expense")
                    android.widget.Toast.makeText(this@MainActivity, "تم إرسال المصروف للجوال", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun BarakahWatchApp() {
    val navController = rememberSwipeDismissableNavController()
    
    // Request all permissions on first launch
    val permissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
            Manifest.permission.BODY_SENSORS
        )
    )
    
    LaunchedEffect(Unit) {
        if (!permissionsState.allPermissionsGranted) {
            permissionsState.launchMultiplePermissionRequest()
        }
    }

    MaterialTheme {
        SwipeDismissableNavHost(
            navController = navController,
            startDestination = "home"
        ) {
            composable("home") {
                HomeScreen(
                    onNavigateToFinance = { navController.navigate("finance") },
                    onNavigateToPrayer = { navController.navigate("prayer") },
                    onNavigateToLocations = { navController.navigate("locations") },
                    onNavigateToProductivity = { navController.navigate("productivity") },
                    onNavigateToSettings = { navController.navigate("settings") }
                )
            }
            composable("finance") {
                FinanceScreen()
            }
            composable("prayer") {
                PrayerScreen()
            }
            composable("locations") {
                LocationsScreen()
            }
            composable("productivity") {
                ProductivityScreen()
            }
            composable("settings") {
                SettingsScreen()
            }
        }
    }
}

@Composable
fun HomeScreen(
    onNavigateToFinance: () -> Unit,
    onNavigateToPrayer: () -> Unit,
    onNavigateToLocations: () -> Unit,
    onNavigateToProductivity: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val listState = rememberScalingLazyListState()
    
    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            state = listState,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Text(
                    text = "البركة",
                    fontSize = 20.sp,
                    color = Color.White,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 24.dp, bottom = 8.dp)
                )
            }
            
            item {
                Chip(
                    onClick = onNavigateToFinance,
                    label = { Text("💰 المالية") },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF10B981)
                    )
                )
            }
            
            item {
                Chip(
                    onClick = onNavigateToPrayer,
                    label = { Text("🕌 الصلاة") },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF3B82F6)
                    )
                )
            }
            
            item {
                Chip(
                    onClick = onNavigateToProductivity,
                    label = { Text("✅ المهام") },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF8B5CF6) // Purple
                    )
                )
            }
            
            item {
                Chip(
                    onClick = onNavigateToLocations,
                    label = { Text("📍 المواقع") },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFFF59E0B)
                    )
                )
            }
            
            item {
                Chip(
                    onClick = onNavigateToSettings,
                    label = { Text("⚙️ الإعدادات") },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF6B7280)
                    )
                )
            }
        }
    }
}
