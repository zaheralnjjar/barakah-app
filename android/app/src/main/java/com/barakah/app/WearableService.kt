package com.barakah.app

import android.content.Intent
import android.net.Uri
import android.util.Log
import android.widget.Toast
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

class WearableService : WearableListenerService() {

    override fun onMessageReceived(messageEvent: MessageEvent) {
        super.onMessageReceived(messageEvent)
        Log.d("BarakahSync", "Message received from watch: ${messageEvent.path}")

        when (messageEvent.path) {
            "/barakah/action/add_transaction" -> {
                val dataStr = String(messageEvent.data)
                try {
                    val json = JSONObject(dataStr)
                    val amount = json.getDouble("amount")
                    val description = json.getString("description")
                    
                    // Show confirmation (In a real app, save to DB here)
                    showToast("تم استلام مصروف من الساعة: $amount")
                    Log.d("BarakahSync", "Added transaction: $amount - $description")
                    
                } catch (e: Exception) {
                    Log.e("BarakahSync", "Error parsing transaction", e)
                }
            }
            "/barakah/action/save_location" -> {
                 val dataStr = String(messageEvent.data)
                try {
                    val json = JSONObject(dataStr)
                    val lat = json.getDouble("lat")
                    val lng = json.getDouble("lng")
                    
                    showToast("تم حفظ الموقع من الساعة")
                    Log.d("BarakahSync", "Saved location: $lat, $lng")
                    
                } catch (e: Exception) {
                    Log.e("BarakahSync", "Error parsing location", e)
                }
            }
            "/barakah/action/open_map" -> {
                val dataStr = String(messageEvent.data)
                try {
                    val json = JSONObject(dataStr)
                    val lat = json.getDouble("lat")
                    val lng = json.getDouble("lng")
                    
                    val gmmIntentUri = Uri.parse("geo:$lat,$lng?q=$lat,$lng")
                    val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
                    mapIntent.setPackage("com.google.android.apps.maps")
                    mapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    
                    if (mapIntent.resolveActivity(packageManager) != null) {
                        startActivity(mapIntent)
                    } else {
                        // Fallback to browser
                         val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=$lat,$lng"))
                         webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                         startActivity(webIntent)
                    }
                    
                    Log.d("BarakahSync", "Opening maps at: $lat, $lng")
                    
                } catch (e: Exception) {
                    Log.e("BarakahSync", "Error parsing map request", e)
                }
            }
        }
    }

    private fun showToast(message: String) {
        // Run on UI thread to show Toast
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }
}
