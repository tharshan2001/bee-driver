package com.ebee.driver.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class BootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "BootReceiver"
        private const val WORK_NAME = "location-watchdog"
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed")

            val prefs = ctx.getSharedPreferences("location_prefs", Context.MODE_PRIVATE)
            val wasActive = prefs.getBoolean("was_active", false)
            val apiUrl = prefs.getString("api_url", "https://ebee.lk/api") ?: "https://ebee.lk/api"
            val wsUrl = prefs.getString("ws_url", "wss://ebee.lk/raw-ws/driver") ?: "wss://ebee.lk/raw-ws/driver"
            val authToken = prefs.getString("auth_token", "") ?: ""
            val driverId = prefs.getString("driver_id", "") ?: ""

            if (!wasActive || driverId.isEmpty() || authToken.isEmpty()) {
                Log.d(TAG, "Not auto-starting — wasActive=$wasActive, driverId=$driverId, hasToken=${authToken.isNotEmpty()}")
                return
            }

            Log.d(TAG, "Starting location service after boot")

            WebSocketManager.setContext(ctx)
            WebSocketManager.configure(wsUrl, authToken, driverId)

            val serviceIntent = Intent(ctx, NativeLocationService::class.java).apply {
                action = NativeLocationService.ACTION_START
                putExtra(NativeLocationService.EXTRA_API_URL, apiUrl)
                putExtra(NativeLocationService.EXTRA_WS_URL, wsUrl)
                putExtra(NativeLocationService.EXTRA_AUTH_TOKEN, authToken)
                putExtra(NativeLocationService.EXTRA_DRIVER_ID, driverId)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(serviceIntent)
            } else {
                ctx.startService(serviceIntent)
            }

            // Schedule WorkManager
            val workRequest = PeriodicWorkRequestBuilder<LocationWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES
            ).build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )

            // Schedule AlarmManager watchdog (30s interval)
            AlarmReceiver.scheduleNext(ctx)
            Log.d(TAG, "AlarmManager watchdog scheduled on boot")
        }
    }
}
