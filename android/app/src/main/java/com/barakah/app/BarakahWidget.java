package com.barakah.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;

public class BarakahWidget extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
            int appWidgetId) {

        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.barakah_widget);

        try {
            // Read data from Capacitor Preferences (SharedPreferences)
            // Capacitor uses "CapacitorStorage" as the preference file name
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

            // 1. Update Prayer Times
            String prayersJson = prefs.getString("widget_prayers", "{}");
            if (!prayersJson.equals("{}")) {
                // Parse prayers array to find next prayer or just display "Loading"
                // The React hook saves [ {name:..., time:...}, ... ]
                JSONArray prayers = new JSONArray(prayersJson);
                // Simple logic: Find next prayer based on current time
                // Or if the hook saved "nextPrayer" object separately?
                // Hook saves: JSON.stringify(prayers) which is an array.
                // It complicates next prayer calc in Java.
                // Let's just display the first one for now or "Barakah"
                // Ideally, the React hook should save { next: "Fajr 05:00", list: [...] }
                // Current hook saves the ARRAY.

                if (prayers.length() > 0) {
                    // For MVP, just show title "Barakah System"
                    // Real calculation requires parsing times.
                    // Let's try to get the first one.
                    JSONObject p = prayers.getJSONObject(0);
                    // views.setTextViewText(R.id.next_prayer_time, p.getString("time"));
                }
            }

            // 2. Update Tasks
            String tasksJson = prefs.getString("widget_tasks", "[]");
            JSONArray tasks = new JSONArray(tasksJson);
            StringBuilder taskListStr = new StringBuilder();

            for (int i = 0; i < Math.min(tasks.length(), 4); i++) {
                JSONObject t = tasks.getJSONObject(i);
                taskListStr.append("• ").append(t.getString("title")).append("\n");
            }

            if (taskListStr.length() > 0) {
                views.setTextViewText(R.id.widget_task_list, taskListStr.toString());
            } else {
                views.setTextViewText(R.id.widget_task_list, "No active tasks");
            }

        } catch (Exception e) {
            e.printStackTrace();
            views.setTextViewText(R.id.widget_task_list, "Syncing...");
        }

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        // Enter relevant functionality for when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        // Enter relevant functionality for when the last widget is disabled
    }
}
