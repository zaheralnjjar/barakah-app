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
fun ProductivityScreen() {
    val context = LocalContext.current
    var tasks by remember { mutableStateOf<List<Triple<String, String, String>>>(emptyList()) } // id, title, priority
    var appointments by remember { mutableStateOf<List<Triple<String, String, String>>>(emptyList()) } // id, title, time

    fun loadData() {
        val prefs = context.getSharedPreferences("barakah_prefs", Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("productivity_data", null)
        
        if (jsonStr != null) {
            try {
                val json = JSONObject(jsonStr)
                
                // Tasks
                val tasksArr = json.optJSONArray("tasks")
                val tList = mutableListOf<Triple<String, String, String>>()
                if (tasksArr != null) {
                    for (i in 0 until tasksArr.length()) {
                        val obj = tasksArr.getJSONObject(i)
                        tList.add(Triple(
                            obj.optString("id"),
                            obj.optString("title"),
                            obj.optString("priority", "medium")
                        ))
                    }
                }
                tasks = tList

                // Appointments
                val apptsArr = json.optJSONArray("appointments")
                val aList = mutableListOf<Triple<String, String, String>>()
                if (apptsArr != null) {
                    for (i in 0 until apptsArr.length()) {
                        val obj = apptsArr.getJSONObject(i)
                        aList.add(Triple(
                            obj.optString("id"),
                            obj.optString("title"),
                            obj.optString("time", "--:--")
                        ))
                    }
                }
                appointments = aList
                
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
        val filter = IntentFilter("com.barakah.watch.PRODUCTIVITY_UPDATE")
        context.registerReceiver(receiver, filter)
        onDispose { context.unregisterReceiver(receiver) }
    }

    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize().background(Color.Black),
        anchorType = ScalingLazyListAnchorType.ItemStart
    ) {
        item {
            ListHeader {
                Text("المواعيد القادمة", color = Color(0xFF60A5FA))
            }
        }
        
        if (appointments.isEmpty()) {
            item { Text("لا توجد مواعيد", fontSize = 12.sp, color = Color.Gray) }
        } else {
            items(appointments.size) { i ->
                val (_, title, time) = appointments[i]
                Card(onClick = {}, modifier = Modifier.fillMaxWidth(0.9f)) {
                    Column {
                        Text(title, style = MaterialTheme.typography.body2)
                        Text(time, style = MaterialTheme.typography.caption2, color = Color.Gray)
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            ListHeader {
                Text("المهام", color = Color(0xFFF472B6))
            }
        }

        if (tasks.isEmpty()) {
            item { Text("لا توجد مهام", fontSize = 12.sp, color = Color.Gray) }
        } else {
            items(tasks.size) { i ->
                val (_, title, priority) = tasks[i]
                Chip(
                    onClick = {},
                    label = { Text(title, maxLines = 1) },
                    secondaryLabel = { Text(priority, fontSize = 10.sp) }, // Translate priority in real app
                    colors = ChipDefaults.secondaryChipColors()
                )
            }
        }
    }
}
