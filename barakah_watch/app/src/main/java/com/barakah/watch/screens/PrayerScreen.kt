package com.barakah.watch.screens

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import org.json.JSONObject

@Composable
fun PrayerScreen() {
    val context = LocalContext.current
    var nextPrayerName by remember { mutableStateOf("--") }
    var timeRemaining by remember { mutableStateOf("--") }
    // Store times as list of Pair<Name, Time>
    var prayerTimes by remember { mutableStateOf<List<Pair<String, String>>>(emptyList()) }

    // Load data
    fun loadData() {
        val prefs = context.getSharedPreferences("barakah_prefs", Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("prayer_data", null)
        if (jsonStr != null) {
            try {
                val json = JSONObject(jsonStr)
                timeRemaining = json.optString("time_remaining", "--")
                
                val nextObj = json.optJSONObject("next_prayer")
                if (nextObj != null) {
                    nextPrayerName = nextObj.optString("nameAr", nextObj.optString("name", "--"))
                }

                val timesArr = json.optJSONArray("times")
                val list = mutableListOf<Pair<String, String>>()
                if (timesArr != null) {
                    for (i in 0 until timesArr.length()) {
                        val obj = timesArr.getJSONObject(i)
                        list.add(Pair(obj.optString("nameAr", "?"), obj.optString("time", "--")))
                    }
                }
                prayerTimes = list
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    LaunchedEffect(Unit) { loadData() }

    DisposableEffect(Unit) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                loadData()
            }
        }
        val filter = IntentFilter("com.barakah.watch.PRAYER_UPDATE")
        context.registerReceiver(receiver, filter)
        onDispose { context.unregisterReceiver(receiver) }
    }

    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize().background(Color.Black),
        anchorType = ScalingLazyListAnchorType.ItemStart
    ) {
        item {
            ListHeader {
                Text("أوقات الصلاة", color = Color(0xFF10B981))
            }
        }
        // Next Prayer Card
        item {
            Card(
                onClick = {},
                modifier = Modifier.fillMaxWidth(0.9f),
                backgroundPainter = CardDefaults.cardBackgroundPainter(
                    startBackgroundColor = Color(0xFF065F46),
                    endBackgroundColor = Color(0xFF047857) // Dark Green
                )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("الصلاة القادمة", fontSize = 10.sp, color = Color.White.copy(alpha = 0.7f))
                    Text(nextPrayerName, fontSize = 20.sp, color = Color.White)
                    Text("بعد $timeRemaining", fontSize = 12.sp, color = Color(0xFFA7F3D0))
                }
            }
        }

        items(prayerTimes.size) { index ->
            val (name, time) = prayerTimes[index]
            val isNext = name == nextPrayerName
            
            Row(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .padding(vertical = 4.dp)
                    .background(
                        if (isNext) Color(0xFF064E3B) else Color.Transparent, 
                        shape = MaterialTheme.shapes.small
                    )
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(name, fontSize = 14.sp, color = if (isNext) Color.White else Color.Gray)
                Text(time, fontSize = 14.sp, color = if (isNext) Color.White else Color.Gray)
            }
        }
    }
}
