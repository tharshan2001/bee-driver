package com.ebee.driver.location

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.ebee.location.R
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import java.util.concurrent.TimeUnit

class NativeLocationService : Service() {

    companion object {
        private const val TAG = "NativeLocationService"
        private const val CHANNEL_ID = "ebee-native-location"
        private const val NOTIFICATION_ID = 2001

        const val ACTION_START = "com.ebee.driver.location.START"
        const val ACTION_STOP = "com.ebee.driver.location.STOP"

        const val EXTRA_API_URL = "api_url"
        const val EXTRA_WS_URL = "ws_url"
        const val EXTRA_AUTH_TOKEN = "auth_token"
        const val EXTRA_DRIVER_ID = "driver_id"

        private const val WORK_NAME = "location-watchdog"

        @Volatile
        private var isRunning = false

        @Volatile
        private var lastLocation: LocationData? = null

        @Volatile
        private var gpsIntervalMs: Long = 1000L

        @Volatile
        private var minAccuracy: Int = 10

        fun isServiceRunning(): Boolean = isRunning
        fun getLastLocation(): LocationData? = lastLocation

        fun updateGpsConfig(intervalMs: Long, accuracy: Int) {
            gpsIntervalMs = intervalMs.coerceIn(500L, 60000L)
            minAccuracy = accuracy.coerceIn(1, 100)
            Log.d(TAG, "GPS config updated: interval=${gpsIntervalMs}ms, minAccuracy=$minAccuracy")
        }
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var wakeLock: PowerManager.WakeLock? = null
    private var notificationManager: NotificationManager? = null

    private var apiUrl: String = "https://ebee.lk/api"
    private var wsUrl: String = "wss://ebee.lk/ws"
    private var authToken: String = ""
    private var driverId: String = ""

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        acquireWakeLock()
        scheduleWorkManager()
        AlarmReceiver.scheduleNext(this)
        WebSocketManager.setContext(applicationContext)
        Log.d(TAG, "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                Log.d(TAG, "STOP action")
                stopAll()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                // The alarm and watchdog restarts send no extras, so begin from what was saved.
                readFromPrefs()
                apiUrl = intent.getStringExtra(EXTRA_API_URL) ?: apiUrl
                wsUrl = intent.getStringExtra(EXTRA_WS_URL) ?: wsUrl
                authToken = intent.getStringExtra(EXTRA_AUTH_TOKEN) ?: authToken
                driverId = intent.getStringExtra(EXTRA_DRIVER_ID) ?: driverId

                Log.d(TAG, "START — driverId: $driverId")
                startForeground(NOTIFICATION_ID, buildNotification())
                if (isRunning) {
                    // Already tracking: this is a new token. Use it for the next connection without
                    // registering a second set of location updates.
                    WebSocketManager.configure(wsUrl, authToken, driverId)
                    WebSocketManager.connect()
                } else {
                    startTracking()
                }
                return START_STICKY
            }
        }
        if (intent == null) {
            Log.d(TAG, "START_STICKY restart")
            readFromPrefs()
            startForeground(NOTIFICATION_ID, buildNotification())
            startTracking()
            return START_STICKY
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopAll()
    }

    private fun stopAll() {
        isRunning = false
        Log.d(TAG, "Stopping")
        try {
            if (::locationCallback.isInitialized) {
                fusedLocationClient.removeLocationUpdates(locationCallback)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error removing updates: ${e.message}")
        }
        releaseWakeLock()
        serviceScope.cancel()
        try {
            WorkManager.getInstance(this).cancelUniqueWork(WORK_NAME)
        } catch (e: Exception) {}
    }

    private fun startTracking() {
        if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)
            != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Location permission not granted")
            stopSelf()
            return
        }

        isRunning = true

        WebSocketManager.configure(wsUrl, authToken, driverId)
        WebSocketManager.setContext(applicationContext)
        WebSocketManager.connect()

        startLocationUpdates()
    }

    private fun readFromPrefs() {
        val prefs = getSharedPreferences("location_prefs", Context.MODE_PRIVATE)
        apiUrl = prefs.getString("api_url", "https://ebee.lk/api") ?: "https://ebee.lk/api"
        wsUrl = prefs.getString("ws_url", "wss://ebee.lk/raw-ws/driver") ?: "wss://ebee.lk/raw-ws/driver"
        authToken = prefs.getString("auth_token", "") ?: ""
        driverId = prefs.getString("driver_id", "") ?: ""
        Log.d(TAG, "Prefs loaded — driverId: $driverId")
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        val interval = gpsIntervalMs
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
            .setMinUpdateIntervalMillis(interval)
            .setMaxUpdateDelayMillis((interval * 1.5).toLong())
            .setWaitForAccurateLocation(false)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    val loc = LocationData(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        accuracy = location.accuracy,
                        bearing = if (location.hasBearing()) location.bearing else null,
                        speed = if (location.hasSpeed()) location.speed else null,
                        altitude = if (location.hasAltitude()) location.altitude else null,
                        timestamp = System.currentTimeMillis()
                    )
                    lastLocation = loc
                    handleLocation(loc)
                }
            }

            override fun onLocationAvailability(availability: LocationAvailability) {
                Log.d(TAG, "Location availability: ${availability.isLocationAvailable}")
            }
        }

            // PendingIntent for when service is killed and restarted by AlarmReceiver/WorkManager
            val pendingIntent = PendingIntent.getBroadcast(
                this, 0,
                Intent(this, LocationReceiver::class.java).apply {
                    action = LocationReceiver.ACTION_LOCATION_UPDATE
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )

            try {
                // In-process callback (primary — fastest)
                fusedLocationClient.requestLocationUpdates(
                    locationRequest,
                    locationCallback,
                    mainLooper
                )
                // PendingIntent broadcast (backup — fires if service process was killed)
                fusedLocationClient.requestLocationUpdates(
                    LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, interval)
                        .setMinUpdateIntervalMillis(interval)
                        .build(),
                    pendingIntent
                )
                Log.d(TAG, "FusedLocationProvider started (1s interval, callback + pendingIntent)")
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting location updates: ${e.message}")
        }
    }

    private fun handleLocation(loc: LocationData) {
        // Send immediately via WebSocket
        if (WebSocketManager.isConnected()) {
            WebSocketManager.send(loc)
        } else {
            // Queue to persistent storage — will be drained on reconnect
            LocationQueue.enqueue(this, loc)
            Log.d(TAG, "WS not connected — queued (size: ${LocationQueue.size(this)})")
        }
        updateNotification()
    }

    private fun scheduleWorkManager() {
        val workRequest = PeriodicWorkRequestBuilder<LocationWorker>(
            15, TimeUnit.MINUTES,
            5, TimeUnit.MINUTES
        ).build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Driver Location",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "eBee Go driver location tracking"
                setShowBadge(false)
                setSound(null, null)
                enableVibration(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        // The app's launcher activity: a library can't name the app's classes.
        val openIntent = (packageManager.getLaunchIntentForPackage(packageName) ?: Intent()).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPending = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, NativeLocationService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPending = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val lastLoc = lastLocation
        val bodyText = if (lastLoc != null) {
            val wsStatus = if (WebSocketManager.isConnected()) "●" else "○"
            "$wsStatus ${String.format("%.5f", lastLoc.latitude)}, ${String.format("%.5f", lastLoc.longitude)}"
        } else {
            "Starting..."
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("eBee Go — Live Location")
            .setContentText(bodyText)
            .setSmallIcon(R.drawable.ic_location)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setContentIntent(openPending)
            .addAction(0, "Stop", stopPending)
            .build()
    }

    private fun updateNotification() {
        try {
            notificationManager?.notify(NOTIFICATION_ID, buildNotification())
        } catch (e: Exception) {
            Log.e(TAG, "Error updating notification: ${e.message}")
        }
    }

    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "eBeeGo:NativeLocation").apply {
            acquire(10 * 60 * 60 * 1000L)
        }
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing wake lock: ${e.message}")
        }
    }
}
