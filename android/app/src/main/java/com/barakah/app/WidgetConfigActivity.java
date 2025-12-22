package com.barakah.app;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;

public class WidgetConfigActivity extends Activity {

    private int appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set result to CANCELED in case user backs out
        setResult(RESULT_CANCELED);

        setContentView(R.layout.widget_config);

        prefs = getSharedPreferences("WidgetSettings", Context.MODE_PRIVATE);

        // Get widget ID from intent
        Intent intent = getIntent();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            appWidgetId = extras.getInt(
                    AppWidgetManager.EXTRA_APPWIDGET_ID,
                    AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        // Load saved preferences
        loadPreferences();

        // Save button
        Button saveBtn = findViewById(R.id.btnSaveConfig);
        saveBtn.setOnClickListener(v -> saveAndFinish());
    }

    private void loadPreferences() {
        CheckBox showPrayer = findViewById(R.id.chkShowPrayer);
        CheckBox showTasks = findViewById(R.id.chkShowTasks);
        CheckBox showFinance = findViewById(R.id.chkShowFinance);
        CheckBox showShopping = findViewById(R.id.chkShowShopping);

        showPrayer.setChecked(prefs.getBoolean("show_prayer_" + appWidgetId, true));
        showTasks.setChecked(prefs.getBoolean("show_tasks_" + appWidgetId, true));
        showFinance.setChecked(prefs.getBoolean("show_finance_" + appWidgetId, true));
        showShopping.setChecked(prefs.getBoolean("show_shopping_" + appWidgetId, true));
    }

    private void saveAndFinish() {
        CheckBox showPrayer = findViewById(R.id.chkShowPrayer);
        CheckBox showTasks = findViewById(R.id.chkShowTasks);
        CheckBox showFinance = findViewById(R.id.chkShowFinance);
        CheckBox showShopping = findViewById(R.id.chkShowShopping);

        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean("show_prayer_" + appWidgetId, showPrayer.isChecked());
        editor.putBoolean("show_tasks_" + appWidgetId, showTasks.isChecked());
        editor.putBoolean("show_finance_" + appWidgetId, showFinance.isChecked());
        editor.putBoolean("show_shopping_" + appWidgetId, showShopping.isChecked());
        editor.apply();

        // Update widget
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this);
        BarakahWidget.updateAppWidget(this, appWidgetManager, appWidgetId);

        // Return success
        Intent resultValue = new Intent();
        resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        setResult(RESULT_OK, resultValue);
        finish();
    }
}
