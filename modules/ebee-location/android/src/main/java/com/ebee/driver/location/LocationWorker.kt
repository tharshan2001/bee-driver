package com.ebee.driver.location

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class LocationWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "LocationWorker"
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "WorkManager running")

        val prefs = applicationContext.getSharedPreferences("location_prefs", Context.MODE_PRIVATE)
        val wasActive = prefs.getBoolean("was_active", false)

        if (!wasActive) {
            Log.d(TAG, "Tracking not active — skipping")
            return Result.success()
        }

        val wsUrl = prefs.getString("ws_url", "wss://ebee.lk/raw-ws/driver") ?: "wss://ebee.lk/raw-ws/driver"
        val authToken = prefs.getString("auth_token", "") ?: ""
        val driverId = prefs.getString("driver_id", "") ?: ""

        WebSocketManager.setContext(applicationContext)
        WebSocketManager.configure(wsUrl, authToken, driverId)

        val running = NativeLocationService.isServiceRunning()
        if (!running) {
            Log.d(TAG, "Service not running — restarting")
            val intent = Intent(applicationContext, NativeLocationService::class.java).apply {
                action = NativeLocationService.ACTION_START
                putExtra(NativeLocationService.EXTRA_WS_URL, wsUrl)
                putExtra(NativeLocationService.EXTRA_AUTH_TOKEN, authToken)
                putExtra(NativeLocationService.EXTRA_DRIVER_ID, driverId)
            }
            try {
                applicationContext.startForegroundService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start service: ${e.message}")
            }
        } else {
            WebSocketManager.reconnect()
        }

        try {
            AlarmReceiver.scheduleNext(applicationContext)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule alarm: ${e.message}")
        }

        return Result.success()
    }
}
