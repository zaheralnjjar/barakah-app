package com.barakah.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class BarakahWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId,
            Bundle newOptions) {
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Get widget size to determine layout
        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        int minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH);
        int minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT);

        RemoteViews views;

        // Choose layout based on size
        if (minWidth < 110 && minHeight < 110) {
            // 1x1 widget
            views = new RemoteViews(context.getPackageName(), R.layout.widget_1x1);
        } else if (minHeight < 110) {
            // 4x1 horizontal widget
            views = new RemoteViews(context.getPackageName(), R.layout.widget_4x1);
            updateHorizontalWidget(context, views);
        } else if (minWidth >= 250 && minHeight >= 250) {
            // 4x4 large widget
            views = new RemoteViews(context.getPackageName(), R.layout.widget_4x4);
            updateLargeWidget(context, views);
        } else {
            // 2x2 widget
            views = new RemoteViews(context.getPackageName(), R.layout.widget_2x2);
            updateFullWidget(context, views);
        }

        // Set click to open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(android.R.id.background, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void updateFullWidget(Context context, RemoteViews views) {
        try {
            // Capacitor stores preferences in app's default SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            // Fallback: try app's default prefs if CapacitorStorage is empty
            String prayersJson = prefs.getString("widget_prayers", null);
            if (prayersJson == null) {
                prefs = context.getSharedPreferences(context.getPackageName() + "_preferences", Context.MODE_PRIVATE);
                prayersJson = prefs.getString("widget_prayers", "[]");
            }

            // Date
            SimpleDateFormat sdf = new SimpleDateFormat("EEEE، d MMMM", java.util.Locale.forLanguageTag("ar"));
            views.setTextViewText(R.id.tvDate, sdf.format(new Date()));

            // Next Prayer
            JSONArray prayers = new JSONArray(prayersJson);
            String nextPrayer = "الصلاة القادمة";
            if (prayers.length() > 0) {
                JSONObject p = prayers.getJSONObject(0);
                nextPrayer = "🕌 " + p.optString("name", "") + " - " + p.optString("time", "");
            }
            views.setTextViewText(R.id.tvNextPrayer, nextPrayer);

            // Tasks count
            String tasksJson = prefs.getString("widget_tasks", "[]");
            JSONArray tasks = new JSONArray(tasksJson);
            views.setTextViewText(R.id.tvTasks, "📋 " + tasks.length() + " مهمة");

            // Medications count
            String medsJson = prefs.getString("widget_meds", "[]");
            JSONArray meds = new JSONArray(medsJson);
            views.setTextViewText(R.id.tvMeds, "💊 " + meds.length() + " دواء");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void updateHorizontalWidget(Context context, RemoteViews views) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

            // Next Prayer
            String prayersJson = prefs.getString("widget_prayers", "[]");
            JSONArray prayers = new JSONArray(prayersJson);
            if (prayers.length() > 0) {
                JSONObject p = prayers.getJSONObject(0);
                views.setTextViewText(R.id.tvNextPrayerName, p.optString("name", "الصلاة"));
                views.setTextViewText(R.id.tvNextPrayerTime, p.optString("time", "--:--"));
            }

            // Tasks count
            String tasksJson = prefs.getString("widget_tasks", "[]");
            JSONArray tasks = new JSONArray(tasksJson);
            views.setTextViewText(R.id.tvTasksCount, String.valueOf(tasks.length()));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void updateLargeWidget(Context context, RemoteViews views) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

            // Date
            SimpleDateFormat sdf = new SimpleDateFormat("d MMMM", java.util.Locale.forLanguageTag("ar"));
            views.setTextViewText(R.id.tvDate, sdf.format(new Date()));

            // Financial
            String financeJson = prefs.getString("widget_finance", "{}");
            JSONObject finance = new JSONObject(financeJson);
            views.setTextViewText(R.id.tvBalance, finance.optString("balance", "0") + " ARS");
            views.setTextViewText(R.id.tvDebt, finance.optString("debt", "0") + " ARS");

            // Tasks & Habits
            String tasksJson = prefs.getString("widget_tasks", "[]");
            JSONArray tasks = new JSONArray(tasksJson);
            views.setTextViewText(R.id.tvTasks, String.valueOf(tasks.length()));

            String habitsJson = prefs.getString("widget_habits", "[]");
            JSONArray habits = new JSONArray(habitsJson);
            views.setTextViewText(R.id.tvHabits, String.valueOf(habits.length()));

            // Appointments
            String appointmentsJson = prefs.getString("widget_appointments", "[]");
            JSONArray appointments = new JSONArray(appointmentsJson);
            if (appointments.length() > 0) {
                StringBuilder apptText = new StringBuilder();
                for (int i = 0; i < Math.min(appointments.length(), 2); i++) {
                    JSONObject a = appointments.getJSONObject(i);
                    apptText.append("• ").append(a.optString("title", "")).append("\n");
                }
                views.setTextViewText(R.id.tvAppointments, apptText.toString().trim());
            } else {
                views.setTextViewText(R.id.tvAppointments, "لا توجد مواعيد");
            }

            // Shopping
            String shoppingJson = prefs.getString("widget_shopping", "[]");
            JSONArray shopping = new JSONArray(shoppingJson);
            if (shopping.length() > 0) {
                StringBuilder shopText = new StringBuilder();
                for (int i = 0; i < Math.min(shopping.length(), 2); i++) {
                    JSONObject s = shopping.getJSONObject(i);
                    shopText.append("• ").append(s.optString("name", "")).append("\n");
                }
                views.setTextViewText(R.id.tvShopping, shopText.toString().trim());
            } else {
                views.setTextViewText(R.id.tvShopping, "القائمة فارغة");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onEnabled(Context context) {
        // First widget created
    }

    @Override
    public void onDisabled(Context context) {
        // Last widget removed
    }
}
