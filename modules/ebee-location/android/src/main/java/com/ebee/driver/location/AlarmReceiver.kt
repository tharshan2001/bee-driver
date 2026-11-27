package com.ebee.driver.location

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.os.SystemClock

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AlarmReceiver"
        private const val ALARM_REQUEST_CODE = 9999

        fun scheduleNext(context: Context) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, AlarmReceiver::class.java)
                val pending = PendingIntent.getBroadcast(
                    context, ALARM_REQUEST_CODE, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (!alarmManager.canScheduleExactAlarms()) {
                        Log.w(TAG, "Cannot schedule exact alarms — using inexact")
                        alarmManager.set(
                            AlarmManager.ELAPSED_REALTIME_WAKEUP,
                            SystemClock.elapsedRealtime() + 30_000L,
                            pending
                        )
                        return
                    }
                }

                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + 30_000L,
                    pending
                )
                Log.d(TAG, "Next alarm scheduled in 30s")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule alarm: ${e.message}")
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Alarm fired")

        scheduleNext(context)

        WebSocketManager.setContext(context)

        val prefs = context.getSharedPreferences("location_prefs", Context.MODE_PRIVATE)
        val wasActive = prefs.getBoolean("was_active", false)
        if (!wasActive) return

        val running = NativeLocationService.isServiceRunning()
        if (!running) {
            Log.d(TAG, "Service dead — restarting")
            val serviceIntent = Intent(context, NativeLocationService::class.java).apply {
                action = NativeLocationService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } else {
            WebSocketManager.reconnect()
        }
    }
}
