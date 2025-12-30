package com.barakah.watch.data

import android.util.Log
import com.google.android.gms.wearable.*
import com.google.gson.Gson

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
        val path = messageEvent.path
        val data = String(messageEvent.data)
        
        Log.d(TAG, "Message received: $path")
        
        when {
            path.startsWith("/barakah/notification/") -> {
                // Show notification on watch
                handleNotification(path, data)
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
