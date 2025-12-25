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
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);

            // Prayer times channel - High importance with sound
            NotificationChannel prayerChannel = new NotificationChannel(
                    "prayers",
                    "أوقات الصلاة",
                    NotificationManager.IMPORTANCE_HIGH);
            prayerChannel.setDescription("تنبيهات أوقات الصلاة");
            prayerChannel.enableVibration(true);
            prayerChannel.enableLights(true);
            prayerChannel.setShowBadge(true);
            notificationManager.createNotificationChannel(prayerChannel);

            // Appointments channel
            NotificationChannel appointmentsChannel = new NotificationChannel(
                    "appointments",
                    "المواعيد",
                    NotificationManager.IMPORTANCE_HIGH);
            appointmentsChannel.setDescription("تذكيرات المواعيد");
            appointmentsChannel.enableVibration(true);
            notificationManager.createNotificationChannel(appointmentsChannel);

            // Tasks channel
            NotificationChannel tasksChannel = new NotificationChannel(
                    "tasks",
                    "المهام",
                    NotificationManager.IMPORTANCE_DEFAULT);
            tasksChannel.setDescription("تذكيرات المهام");
            notificationManager.createNotificationChannel(tasksChannel);

            // Medications channel - High importance
            NotificationChannel medsChannel = new NotificationChannel(
                    "medications",
                    "الأدوية",
                    NotificationManager.IMPORTANCE_HIGH);
            medsChannel.setDescription("تذكيرات مواعيد الأدوية");
            medsChannel.enableVibration(true);
            notificationManager.createNotificationChannel(medsChannel);

            // Finance channel
            NotificationChannel financeChannel = new NotificationChannel(
                    "finance",
                    "المالية",
                    NotificationManager.IMPORTANCE_DEFAULT);
            financeChannel.setDescription("تذكيرات الدفعات المالية");
            notificationManager.createNotificationChannel(financeChannel);

            // Default/fallback channel
            NotificationChannel defaultChannel = new NotificationChannel(
                    "barakah_notifications",
                    "تنبيهات البركة",
                    NotificationManager.IMPORTANCE_HIGH);
            defaultChannel.setDescription("تنبيهات عامة");
            defaultChannel.enableVibration(true);
            notificationManager.createNotificationChannel(defaultChannel);
        }
    }
}
