package com.barakah.watch.screens

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.* // Use Wear Compose Material
import androidx.wear.compose.material.dialog.Alert
import androidx.wear.compose.material.dialog.Dialog
import com.barakah.watch.data.SyncManager
import org.json.JSONObject
import java.util.Locale

@Composable
fun FinanceScreen() {
    val context = LocalContext.current
    var balance by remember { mutableStateOf("0.0") }
    var dailyLimit by remember { mutableStateOf("0.0") }
    
    // Load initial data
    LaunchedEffect(Unit) {
        val prefs = context.getSharedPreferences("barakah_prefs", Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("finance_data", null)
        if (jsonStr != null) {
            try {
                val json = JSONObject(jsonStr)
                balance = json.optString("balance_ars", "0.0")
                dailyLimit = json.optString("daily_limit", "0.0")
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    // Listen for updates
    DisposableEffect(Unit) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val prefs = context?.getSharedPreferences("barakah_prefs", Context.MODE_PRIVATE)
                val jsonStr = prefs?.getString("finance_data", null)
                if (jsonStr != null) {
                    try {
                        val json = JSONObject(jsonStr)
                        balance = json.optString("balance_ars", "0.0")
                        dailyLimit = json.optString("daily_limit", "0.0")
                    } catch (e: Exception) { e.printStackTrace() }
                }
            }
        }
        val filter = IntentFilter("com.barakah.watch.FINANCE_UPDATE")
        context.registerReceiver(receiver, filter)

        onDispose {
            context.unregisterReceiver(receiver)
        }
    }

    // Voice Input Launcher
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val spokenText = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.get(0)
            if (spokenText != null) {
                 val parts = spokenText.split(" ")
                 // Try to parse number from first part
                 // Replace comma with dot for decimals if needed (Arabic locale might separate with comma)
                 val amountStr = parts.firstOrNull()?.replace(",", ".") ?: "0"
                 val amount = amountStr.toDoubleOrNull() ?: 0.0
                 val description = parts.drop(1).joinToString(" ")
                 
                 if (amount > 0) {
                     val json = JSONObject().apply {
                        put("amount", amount)
                        put("description", description)
                        put("type", "expense")
                     }
                     val syncManager = SyncManager(context) 
                     syncManager.sendTransaction(json.toString())
                 }
            }
        }
    }
    
    val listState = rememberScalingLazyListState()

    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize().background(Color.Black),
            state = listState,
            anchorType = ScalingLazyListAnchorType.ItemStart,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                ListHeader {
                    Text(text = "المالية", color = MaterialTheme.colors.primary)
                }
            }
            item {
                Card(onClick = { /* Refresh? */ }, modifier = Modifier.fillMaxWidth(0.9f)) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text("الرصيد الحالي", style = MaterialTheme.typography.caption2)
                        Text("$balance ARS", style = MaterialTheme.typography.title2, color = MaterialTheme.colors.secondary)
                    }
                }
            }
            item {
                Card(onClick = {}, modifier = Modifier.fillMaxWidth(0.9f)) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text("الحد اليومي", style = MaterialTheme.typography.caption2)
                        Text("$dailyLimit ARS", style = MaterialTheme.typography.title3, color = MaterialTheme.colors.secondary)
                    }
                }
            }
            item {
                 Chip(
                     onClick = {
                         val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                             putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                             putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-SA")
                             putExtra(RecognizerIntent.EXTRA_PROMPT, "قل المبلغ والوصف (مثال: 500 تاكسي)")
                         }
                         launcher.launch(intent)
                     },
                     modifier = Modifier.fillMaxWidth(0.9f),
                     label = { Text("تسجيل مصروف") },
                     colors = ChipDefaults.primaryChipColors()
                 )
            }
        }
    }
}
