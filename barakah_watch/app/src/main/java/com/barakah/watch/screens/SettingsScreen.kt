package com.barakah.watch.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*

@Composable
fun SettingsScreen() {
    var isSyncing by remember { mutableStateOf(false) }
    var lastSync by remember { mutableStateOf("منذ 5 دقائق") }
    var isConnected by remember { mutableStateOf(true) }
    
    val listState = rememberScalingLazyListState()
    
    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            state = listState,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Header
            item {
                Text(
                    "⚙️ الإعدادات",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(top = 20.dp, bottom = 8.dp)
                )
            }
            
            // Connection Status
            item {
                Card(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(0.95f),
                    backgroundPainter = CardDefaults.cardBackgroundPainter(
                        startBackgroundColor = if (isConnected) Color(0xFF059669) else Color(0xFFDC2626),
                        endBackgroundColor = if (isConnected) Color(0xFF10B981) else Color(0xFFEF4444)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            if (isConnected) "✅ متصل بالجوال" else "❌ غير متصل",
                            fontSize = 13.sp,
                            color = Color.White
                        )
                    }
                }
            }
            
            // Instant Sync Button
            item {
                Chip(
                    onClick = { 
                        isSyncing = true
                        // Trigger full sync via DataClient
                        // This will sync all data both ways
                    },
                    label = { 
                        Text(
                            if (isSyncing) "🔄 جاري المزامنة..." else "🔄 مزامنة فورية",
                            fontSize = 14.sp
                        ) 
                    },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF3B82F6)
                    )
                )
            }
            
            // Last Sync Info
            item {
                Text(
                    "آخر مزامنة: $lastSync",
                    fontSize = 11.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )
            }
            
            // Version Info
            item {
                Text(
                    "البركة ووتش v1.0.0",
                    fontSize = 10.sp,
                    color = Color.Gray.copy(alpha = 0.6f),
                    modifier = Modifier.padding(top = 16.dp)
                )
            }
        }
    }
}
