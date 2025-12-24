package com.barakah.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Main notification channel
            NotificationChannel channel = new NotificationChannel(
                    "barakah_notifications",
                    "تنبيهات البركة",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("تنبيهات المواعيد والمهام والأدوية");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setShowBadge(true);

            // Prayer times channel
            NotificationChannel prayerChannel = new NotificationChannel(
                    "prayer_notifications",
                    "أوقات الصلاة",
                    NotificationManager.IMPORTANCE_HIGH);
            prayerChannel.setDescription("تنبيهات أوقات الصلاة");
            prayerChannel.enableVibration(true);
            prayerChannel.enableLights(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
            notificationManager.createNotificationChannel(prayerChannel);
        }
    }
}
