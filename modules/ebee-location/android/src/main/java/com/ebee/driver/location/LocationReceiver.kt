package com.ebee.driver.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class LocationReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "LocationReceiver"
        const val ACTION_LOCATION_UPDATE = "com.ebee.driver.location.LOCATION_BROADCAST"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_LOCATION_UPDATE) return

        WebSocketManager.setContext(context)

        val latitude = intent.getDoubleExtra("latitude", 0.0)
        val longitude = intent.getDoubleExtra("longitude", 0.0)
        if (latitude == 0.0 && longitude == 0.0) return

        val accuracy = if (intent.hasExtra("accuracy")) intent.getFloatExtra("accuracy", 0f) else null
        val bearing = if (intent.hasExtra("bearing")) intent.getFloatExtra("bearing", 0f) else null
        val speed = if (intent.hasExtra("speed")) intent.getFloatExtra("speed", 0f) else null
        val altitude = if (intent.hasExtra("altitude")) intent.getDoubleExtra("altitude", 0.0) else null
        val timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis())

        val loc = LocationData(latitude, longitude, accuracy, bearing, speed, altitude, timestamp)

        Log.d(TAG, "Location from PendingIntent: $latitude, $longitude")

        ensureServiceRunning(context)

        if (WebSocketManager.isConnected()) {
            WebSocketManager.send(loc)
        } else {
            LocationQueue.enqueue(context, loc)
        }
    }

    private fun ensureServiceRunning(context: Context) {
        try {
            val prefs = context.getSharedPreferences("location_prefs", Context.MODE_PRIVATE)
            val wasActive = prefs.getBoolean("was_active", false)
            if (!wasActive) return

            val running = NativeLocationService.isServiceRunning()
            if (!running) {
                Log.d(TAG, "Service not running — restarting")
                val serviceIntent = Intent(context, NativeLocationService::class.java).apply {
                    action = NativeLocationService.ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking service: ${e.message}")
        }
    }
}
