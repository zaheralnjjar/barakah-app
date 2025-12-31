package com.barakah.watch.data

import android.util.Log
import com.google.android.gms.wearable.*
import com.google.gson.Gson
import android.content.Context
import android.content.Intent

/**
 * خدمة استقبال البيانات من الجوال
 * Receives data updates and notifications from phone
 */
class DataLayerListenerService : WearableListenerService() {
    
    private val gson = Gson()
    
    companion object {
        private const val TAG = "BarakahDataListener"
    }
    
    /**
     * استقبال البيانات المتزامنة (المالية، الصلاة، المواقع)
     * Called when synced data changes
     */
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d(TAG, "Data changed: ${dataEvents.count} events")
        
        for (event in dataEvents) {
            if (event.type == DataEvent.TYPE_CHANGED) {
                val path = event.dataItem.uri.path
                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                
                when (path) {
                    SyncManager.PATH_FINANCE -> {
                        // Update local finance data
                        val json = dataMap.getString("data")
                        Log.d(TAG, "Received finance data: $json")
                        // Store in local cache / update UI
                    }
                    SyncManager.PATH_PRAYER_TIMES -> {
                        // Update prayer times
                        val json = dataMap.getString("data")
                        Log.d(TAG, "Received prayer data: $json")
                    }
                    SyncManager.PATH_LOCATIONS -> {
                        // Update saved locations
                        val json = dataMap.getString("data")
                        Log.d(TAG, "Received locations data: $json")
                    }
                }
            }
        }
    }
    
    /**
     * استقبال الرسائل الفورية (الإشعارات)
     * Called when instant message received (notifications)
     */
    override fun onMessageReceived(messageEvent: MessageEvent) {
        super.onMessageReceived(messageEvent)
        val path = messageEvent.path
        val dataStr = String(messageEvent.data)
        
        Log.d(TAG, "Message received: $path")

        val prefs = getSharedPreferences("barakah_prefs", Context.MODE_PRIVATE)
        
        when {
            path == "/barakah/finance" -> {
                prefs.edit().putString("finance_data", dataStr).apply()
                // Broadcast update
                sendBroadcast(Intent("com.barakah.watch.FINANCE_UPDATE"))
                Log.d(TAG, "Finance data updated")
            }
            path == "/barakah/prayers" -> {
                prefs.edit().putString("prayer_data", dataStr).apply()
                sendBroadcast(Intent("com.barakah.watch.PRAYER_UPDATE"))
                Log.d(TAG, "Prayer data updated")
            }
            path == "/barakah/productivity" -> {
                prefs.edit().putString("productivity_data", dataStr).apply()
                sendBroadcast(Intent("com.barakah.watch.PRODUCTIVITY_UPDATE"))
                Log.d(TAG, "Productivity data updated")
            }
            path.startsWith("/barakah/notification/") -> {
                // Show notification on watch
                handleNotification(path, dataStr)
            }
            path == "/barakah/sync/complete" -> {
                // Sync completed from phone
                Log.d(TAG, "Sync completed")
            }
        }
    }
    
    private fun handleNotification(path: String, data: String) {
        when {
            path.contains("appointment") -> {
                // موعد قادم
                showWatchNotification("📅 موعد", data)
            }
            path.contains("prayer") -> {
                // وقت صلاة
                showWatchNotification("🕌 صلاة", data)
            }
            path.contains("task") -> {
                // تذكير مهمة
                showWatchNotification("✅ مهمة", data)
            }
        }
    }
    
    private fun showWatchNotification(title: String, body: String) {
        // Create and show notification
        // Uses NotificationCompat for Wear OS
        Log.d(TAG, "Notification: $title - $body")
    }
}
