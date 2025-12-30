package com.barakah.watch.screens

import android.Manifest
import android.content.Context
import android.location.Location
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState

data class SavedLocation(
    val id: String,
    val name: String,
    val address: String,
    val lat: Double,
    val lng: Double
)

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationsScreen() {
    val context = LocalContext.current
    
    // Synced from phone
    val locations = remember {
        mutableStateListOf(
            SavedLocation("1", "المنزل", "العنوان...", -34.6037, -58.3816),
            SavedLocation("2", "العمل", "العنوان...", -34.6118, -58.4173)
        )
    }
    
    var isSaving by remember { mutableStateOf(false) }
    val listState = rememberScalingLazyListState()
    
    val locationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    
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
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Save Current Location Button
            item {
                Chip(
                    onClick = { 
                        if (locationPermission.status.isGranted) {
                            isSaving = true
                            // Get location and send to phone via MessageClient
                            // This triggers instant sync
                        } else {
                            locationPermission.launchPermissionRequest()
                        }
                    },
                    label = { 
                        Text(
                            if (isSaving) "جاري الحفظ..." else "📍 حفظ موقعي الحالي",
                            fontSize = 13.sp
                        ) 
                    },
                    modifier = Modifier.fillMaxWidth(0.95f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF10B981)
                    )
                )
            }
            
            // Header
            item {
                Text(
                    "المواقع المحفوظة",
                    fontSize = 12.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            
            // Locations List
            items(locations.size) { index ->
                val location = locations[index]
                LocationRow(location)
            }
            
            if (locations.isEmpty()) {
                item {
                    Text(
                        "لا توجد مواقع محفوظة",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun LocationRow(location: SavedLocation) {
    Card(
        onClick = {
            // Open in phone maps via MessageClient
        },
        modifier = Modifier.fillMaxWidth(0.95f),
        backgroundPainter = CardDefaults.cardBackgroundPainter(
            startBackgroundColor = Color(0xFF1F2937),
            endBackgroundColor = Color(0xFF1F2937)
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("📍", fontSize = 18.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    location.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    location.address.take(25) + if (location.address.length > 25) "..." else "",
                    fontSize = 10.sp,
                    color = Color.Gray
                )
            }
        }
    }
}
