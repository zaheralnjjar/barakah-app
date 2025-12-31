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

        val dataStr = String(messageEvent.data)
        
        // Broadcast the message to MainActivity
        val intent = Intent("com.barakah.app.WATCH_MESSAGE")
        intent.putExtra("path", messageEvent.path)
        intent.putExtra("data", dataStr)
        sendBroadcast(intent)
        
        // Also show a debug toast for confirmation
        // showToast("Received: ${messageEvent.path}") 
    }

    private fun showToast(message: String) {
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            Toast.makeText(applicationContext, message, Toast.LENGTH_SHORT).show()
        }
    }
}
