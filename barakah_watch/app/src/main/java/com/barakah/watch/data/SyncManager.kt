package com.barakah.watch.data

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.*
import com.google.gson.Gson
import kotlinx.coroutines.tasks.await

/**
 * مدير المزامنة الفورية بين الساعة والجوال
 * Handles instant sync between Watch and Phone
 */
class SyncManager(private val context: Context) {
    
    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val messageClient: MessageClient = Wearable.getMessageClient(context)
    private val nodeClient: NodeClient = Wearable.getNodeClient(context)
    private val gson = Gson()
    
    companion object {
        private const val TAG = "BarakahSync"
        
        // Data Paths (for synced data)
        const val PATH_FINANCE = "/barakah/finance"
        const val PATH_PRAYER_TIMES = "/barakah/prayer"
        const val PATH_LOCATIONS = "/barakah/locations"
        
        // Message Paths (for instant actions)
        const val MSG_ADD_TRANSACTION = "/barakah/action/add_transaction"
        const val MSG_SAVE_LOCATION = "/barakah/action/save_location"
        const val MSG_REQUEST_SYNC = "/barakah/action/request_sync"
        const val MSG_OPEN_MAP = "/barakah/action/open_map"
    }
    
    // ===== SEND ACTIONS TO PHONE (Instant) =====
    
    /**
     * إرسال معاملة مالية جديدة للجوال
     * Send new transaction to phone for instant sync
     */
    suspend fun addTransaction(amount: Double, description: String, type: String = "expense") {
        val data = mapOf(
            "amount" to amount,
            "description" to description,
            "type" to type,
            "currency" to "ARS",
            "timestamp" to System.currentTimeMillis()
        )
        sendMessageToPhone(MSG_ADD_TRANSACTION, gson.toJson(data))
        Log.d(TAG, "Sent transaction: $amount ARS")
    }
    
    /**
     * حفظ الموقع الحالي
     * Save current location and sync to phone
     */
    suspend fun saveCurrentLocation(lat: Double, lng: Double, name: String = "موقع جديد") {
        val data = mapOf(
            "lat" to lat,
            "lng" to lng,
            "name" to name,
            "timestamp" to System.currentTimeMillis()
        )
        sendMessageToPhone(MSG_SAVE_LOCATION, gson.toJson(data))
        Log.d(TAG, "Sent location: $lat, $lng")
    }
    
    /**
     * طلب مزامنة فورية
     * Request immediate full sync from phone
     */
    suspend fun requestFullSync() {
        sendMessageToPhone(MSG_REQUEST_SYNC, "")
        Log.d(TAG, "Requested full sync")
    }
    
    /**
     * فتح خريطة على الجوال
     * Open location in phone maps app
     */
    suspend fun openInPhoneMaps(lat: Double, lng: Double) {
        val data = mapOf("lat" to lat, "lng" to lng)
        sendMessageToPhone(MSG_OPEN_MAP, gson.toJson(data))
    }
    
    // ===== HELPER FUNCTIONS =====
    
    private suspend fun sendMessageToPhone(path: String, data: String) {
        try {
            val nodes = nodeClient.connectedNodes.await()
            for (node in nodes) {
                messageClient.sendMessage(node.id, path, data.toByteArray()).await()
                Log.d(TAG, "Message sent to ${node.displayName}: $path")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send message: ${e.message}")
        }
    }
    
    /**
     * التحقق من الاتصال بالجوال
     * Check if phone is connected
     */
    suspend fun isPhoneConnected(): Boolean {
        return try {
            val nodes = nodeClient.connectedNodes.await()
            nodes.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }
    
    // ===== DATA CLASSES =====
    
    data class FinanceData(
        val balanceARS: Double,
        val balanceUSD: Double,
        val todayExpense: Double,
        val dailyLimit: Double,
        val exchangeRate: Double
    )
    
    data class PrayerData(
        val prayers: List<PrayerTime>,
        val nextPrayerName: String,
        val timeUntilNext: String
    )
    
    data class PrayerTime(
        val name: String,
        val nameAr: String,
        val time: String
    )
    
    data class LocationData(
        val id: String,
        val name: String,
        val address: String,
        val lat: Double,
        val lng: Double
    )
}
