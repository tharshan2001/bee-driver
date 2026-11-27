package com.ebee.driver.location

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*

class LocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "LocationModule"
        const val NAME = "NativeLocation"
    }

    private val prefs = reactApplicationContext.getSharedPreferences("location_prefs", Context.MODE_PRIVATE)

    override fun getName(): String = NAME

    @ReactMethod
    fun start(authToken: String, apiUrl: String, wsUrl: String, promise: Promise) {
        try {
            val ctx = reactApplicationContext

            val driverId = getDriverId()

            if (driverId.isEmpty()) {
                promise.reject("NO_DRIVER_ID", "Driver ID not set. Call setDriverId first.")
                return
            }

            if (wsUrl.isEmpty()) {
                promise.reject("NO_SERVER", "Server address is empty.")
                return
            }

            if (authToken.isEmpty()) {
                promise.reject("NO_AUTH_TOKEN", "Auth token is empty.")
                return
            }

            savePrefs(apiUrl, wsUrl, authToken, driverId, true)

            val intent = Intent(ctx, NativeLocationService::class.java).apply {
                action = NativeLocationService.ACTION_START
                putExtra(NativeLocationService.EXTRA_API_URL, apiUrl)
                putExtra(NativeLocationService.EXTRA_WS_URL, wsUrl)
                putExtra(NativeLocationService.EXTRA_AUTH_TOKEN, authToken)
                putExtra(NativeLocationService.EXTRA_DRIVER_ID, driverId)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent)
            } else {
                ctx.startService(intent)
            }

            Log.d(TAG, "Location service started — driverId: $driverId")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Start error", e)
            promise.reject("START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            savePrefs("", "", "", "", false)

            val intent = Intent(reactApplicationContext, NativeLocationService::class.java).apply {
                action = NativeLocationService.ACTION_STOP
            }
            reactApplicationContext.startService(intent)
            Log.d(TAG, "Location service stopped")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Stop error", e)
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isActive(promise: Promise) {
        promise.resolve(NativeLocationService.isServiceRunning())
    }

    @ReactMethod
    fun getLastLocation(promise: Promise) {
        val loc = NativeLocationService.getLastLocation()
        if (loc != null) {
            val map = Arguments.createMap().apply {
                putDouble("latitude", loc.latitude)
                putDouble("longitude", loc.longitude)
                loc.accuracy?.let { putDouble("accuracy", it.toDouble()) }
                loc.bearing?.let { putDouble("bearing", it.toDouble()) }
                loc.speed?.let { putDouble("speed", it.toDouble()) }
                loc.altitude?.let { putDouble("altitude", it) }
                putDouble("timestamp", loc.timestamp.toDouble())
            }
            promise.resolve(map)
        } else {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun setDriverId(driverId: String, promise: Promise) {
        prefs.edit().putString("driver_id", driverId).apply()
        promise.resolve(true)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun savePrefs(apiUrl: String, wsUrl: String, authToken: String, driverId: String, wasActive: Boolean) {
        prefs.edit().apply {
            putString("api_url", apiUrl)
            putString("ws_url", wsUrl)
            putString("auth_token", authToken)
            putString("driver_id", driverId)
            putBoolean("was_active", wasActive)
            apply()
        }
    }

    private fun getDriverId(): String {
        return try {
            val driverPrefs = reactApplicationContext.getSharedPreferences("location_prefs", Context.MODE_PRIVATE)
            driverPrefs.getString("driver_id", "") ?: ""
        } catch (e: Exception) {
            ""
        }
    }
}
