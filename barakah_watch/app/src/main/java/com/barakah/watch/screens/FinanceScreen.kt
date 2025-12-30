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
import androidx.wear.compose.material.dialog.*

@Composable
fun FinanceScreen() {
    // These would be synced from phone via DataClient
    var balanceARS by remember { mutableStateOf(150000.0) }
    var balanceUSD by remember { mutableStateOf(125.0) }
    var todayExpense by remember { mutableStateOf(5000.0) }
    var dailyLimit by remember { mutableStateOf(10000.0) }
    var showAddDialog by remember { mutableStateOf(false) }
    
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
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Balance Card
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
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("الرصيد", fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f))
                        Text(
                            "${balanceARS.toInt().toString().reversed().chunked(3).joinToString(",").reversed()} ARS",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            "≈ $${String.format("%.2f", balanceUSD)} USD",
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                }
            }
            
            // Today's Expense
            item {
                Card(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(0.95f),
                    backgroundPainter = CardDefaults.cardBackgroundPainter(
                        startBackgroundColor = Color(0xFFDC2626),
                        endBackgroundColor = Color(0xFFEF4444)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("مصاريف اليوم", fontSize = 10.sp, color = Color.White.copy(alpha = 0.8f))
                            Text(
                                "${todayExpense.toInt()}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("الحد اليومي", fontSize = 10.sp, color = Color.White.copy(alpha = 0.8f))
                            Text(
                                "${dailyLimit.toInt()}",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
            
            // Add Transaction Button
            item {
                Chip(
                    onClick = { showAddDialog = true },
                    label = { Text("➕ إضافة معاملة", fontSize = 14.sp) },
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color(0xFF3B82F6)
                    )
                )
            }
        }
    }
    
    // Add Transaction Dialog
    if (showAddDialog) {
        AddTransactionDialog(
            onDismiss = { showAddDialog = false },
            onAdd = { amount, description ->
                // Send to phone via MessageClient for instant sync
                showAddDialog = false
            }
        )
    }
}

@Composable
fun AddTransactionDialog(
    onDismiss: () -> Unit,
    onAdd: (Double, String) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    
    Dialog(
        showDialog = true,
        onDismissRequest = onDismiss
    ) {
        Alert(
            title = { Text("مصروف جديد", textAlign = TextAlign.Center) },
            negativeButton = {
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.secondaryButtonColors()
                ) {
                    Text("إلغاء")
                }
            },
            positiveButton = {
                Button(
                    onClick = { 
                        amount.toDoubleOrNull()?.let { onAdd(it, "مصروف") }
                    },
                    colors = ButtonDefaults.primaryButtonColors()
                ) {
                    Text("حفظ")
                }
            }
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(8.dp)
            ) {
                Text("أدخل المبلغ", fontSize = 12.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(8.dp))
                // In production, use Stepper or voice input
                Text(
                    if (amount.isEmpty()) "0" else amount,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}
