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

data class PrayerTime(
    val name: String,
    val nameAr: String,
    val time: String,
    val isNext: Boolean = false
)

@Composable
fun PrayerScreen() {
    // Synced from phone
    val prayers = remember {
        listOf(
            PrayerTime("fajr", "الفجر", "05:30"),
            PrayerTime("sunrise", "الشروق", "06:45"),
            PrayerTime("dhuhr", "الظهر", "12:15", isNext = true),
            PrayerTime("asr", "العصر", "15:30"),
            PrayerTime("maghrib", "المغرب", "18:00"),
            PrayerTime("isha", "العشاء", "19:30")
        )
    }
    
    val nextPrayer = prayers.find { it.isNext }
    val timeUntilNext = "2:45" // Would be calculated
    
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
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // Countdown Header
            item {
                Card(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(0.95f),
                    backgroundPainter = CardDefaults.cardBackgroundPainter(
                        startBackgroundColor = Color(0xFF059669),
                        endBackgroundColor = Color(0xFF10B981)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "⏱️ ${nextPrayer?.nameAr ?: ""}",
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                        Text(
                            timeUntilNext,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
            
            // Prayer Times List
            items(prayers.size) { index ->
                val prayer = prayers[index]
                PrayerTimeRow(prayer)
            }
        }
    }
}

@Composable
fun PrayerTimeRow(prayer: PrayerTime) {
    val bgColor = if (prayer.isNext) Color(0xFF10B981) else Color(0xFF1F2937)
    
    Card(
        onClick = {},
        modifier = Modifier.fillMaxWidth(0.95f),
        backgroundPainter = CardDefaults.cardBackgroundPainter(
            startBackgroundColor = bgColor,
            endBackgroundColor = bgColor
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                prayer.nameAr,
                fontSize = 14.sp,
                fontWeight = if (prayer.isNext) FontWeight.Bold else FontWeight.Normal,
                color = Color.White
            )
            Text(
                prayer.time,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = if (prayer.isNext) Color.White else Color(0xFF10B981)
            )
        }
    }
}
