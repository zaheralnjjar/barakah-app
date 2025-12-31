package com.barakah.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.content.Context;
import com.getcapacitor.BridgeActivity;
import com.barakah.app.WatchPlugin;

public class MainActivity extends BridgeActivity {
        private android.content.BroadcastReceiver watchReceiver;

        @Override
        public void onCreate(Bundle savedInstanceState) {
                registerPlugin(WatchPlugin.class);
                super.onCreate(savedInstanceState);
                createNotificationChannels();
                setupWatchReceiver();
        }

        @Override
        public void onDestroy() {
                super.onDestroy();
                if (watchReceiver != null) {
                        unregisterReceiver(watchReceiver);
                }
        }

        private void setupWatchReceiver() {
                watchReceiver = new android.content.BroadcastReceiver() {
                        @Override
                        public void onReceive(android.content.Context context, android.content.Intent intent) {
                                if ("com.barakah.app.WATCH_MESSAGE".equals(intent.getAction())) {
                                        String path = intent.getStringExtra("path");
                                        String data = intent.getStringExtra("data");

                                        // Create a JSON object to send to JS
                                        String jsData = String.format("{\"path\": \"%s\", \"data\": %s}", path,
                                                        data.isEmpty() ? "{}" : data);

                                        // Trigger event in WebView
                                        // "watch_event" will be the event name window.addEventListener('watch_event',
                                        // ...)
                                        if (getBridge() != null) {
                                                getBridge().triggerWindowJSEvent("watch_event", jsData);
                                        }
                                }
                        }
                };

                android.content.IntentFilter filter = new android.content.IntentFilter("com.barakah.app.WATCH_MESSAGE");
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                        registerReceiver(watchReceiver, filter, Context.RECEIVER_EXPORTED);
                } else {
                        registerReceiver(watchReceiver, filter);
                }
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
