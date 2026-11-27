package com.ebee.driver.location

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object WebSocketManager {

    private const val TAG = "WebSocketManager"

    private var ws: WebSocket? = null
    private var isConnected = false
    private var isAuthenticated = false
    private var reconnectAttempts = 0
    private val maxReconnectDelay = 30_000L
    private val baseDelay = 1_000L

    private var url: String = "wss://ebee.lk/raw-ws/driver"
    private var authToken: String = ""
    private var driverId: String = ""
    private var appContext: Context? = null

    private val mainHandler = Handler(Looper.getMainLooper())

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    fun setContext(context: Context) {
        appContext = context.applicationContext
    }

    fun configure(wsUrl: String, token: String, driver: String) {
        if (wsUrl.isNotEmpty() && wsUrl != url) {
            // A different server: drop the old connection so the next connect() uses this one.
            url = wsUrl
            isConnected = false
            isAuthenticated = false
            ws?.close(1000, "Server changed")
            ws = null
        }
        authToken = token
        driverId = driver
        Log.d(TAG, "Configured — URL: $url driverId: $driver")
    }

    fun connect() {
        if (isConnected) {
            Log.d(TAG, "Already connected")
            return
        }
        ws?.close(1001, "Reconnecting")
        ws = null

        Log.d(TAG, "Connecting to $url")

        val request = Request.Builder()
            .url(url)
            .build()

        ws = client.newWebSocket(request, object : WebSocketListener() {

            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket OPEN — sending auth")
                isConnected = true
                reconnectAttempts = 0
                isAuthenticated = false
                webSocket.send(authToken)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.v(TAG, "WS message: $text")
                if (!isAuthenticated && "AUTH_OK" == text) {
                    isAuthenticated = true
                    Log.d(TAG, "Auth OK")
                    drainQueue()
                    return
                }
                // Handle GPS config from backend
                if (text.startsWith("{\"type\":\"GPS_CONFIG\"")) {
                    try {
                        val json = JSONObject(text)
                        val gpsIntervalMs = json.getLong("gpsIntervalMs")
                        val minAccuracy = json.optInt("minAccuracy", 10)
                        NativeLocationService.updateGpsConfig(gpsIntervalMs, minAccuracy)
                        Log.d(TAG, "GPS config applied: interval=${gpsIntervalMs}ms, accuracy=$minAccuracy")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to parse GPS config: ${e.message}")
                    }
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WS closing: $code $reason")
                webSocket.close(1000, null)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WS CLOSED: $code $reason")
                isConnected = false
                isAuthenticated = false
                scheduleReconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WS FAILURE: ${t.message}")
                isConnected = false
                isAuthenticated = false
                scheduleReconnect()
            }
        })
    }

    fun send(loc: LocationData) {
        if (!isConnected) {
            appContext?.let { LocationQueue.enqueue(it, loc) }
            Log.d(TAG, "WS not connected — queued")
            return
        }
        if (!isAuthenticated) {
            appContext?.let { LocationQueue.enqueue(it, loc) }
            Log.d(TAG, "WS not authed — queued")
            return
        }

        val json = JSONObject().apply {
            put("latitude", loc.latitude)
            put("longitude", loc.longitude)
            loc.accuracy?.let { put("accuracy", it.toDouble()) }
            loc.bearing?.let { put("bearing", it.toDouble()) }
            loc.speed?.let { put("speed", it.toDouble()) }
            loc.altitude?.let { put("altitude", it) }
        }

        val sent = ws?.send(json.toString()) == true
        if (sent) {
            Log.v(TAG, "WS sent: ${loc.latitude}, ${loc.longitude}")
        } else {
            appContext?.let { LocationQueue.enqueue(it, loc) }
        }
    }

    fun disconnect() {
        isConnected = false
        isAuthenticated = false
        reconnectAttempts = Int.MAX_VALUE
        ws?.close(1000, "Client disconnect")
        ws = null
        Log.d(TAG, "Disconnected")
    }

    fun isConnected(): Boolean = isConnected && isAuthenticated

    private fun scheduleReconnect() {
        if (reconnectAttempts >= 100) {
            Log.w(TAG, "Max reconnect attempts")
            return
        }

        val delay = (baseDelay * (1 shl reconnectAttempts.coerceAtMost(5))).coerceAtMost(maxReconnectDelay)
        reconnectAttempts++

        mainHandler.postDelayed({
            if (!isConnected) {
                connect()
            }
        }, delay)
    }

    private fun drainQueue() {
        val ctx = appContext ?: return
        Thread {
            val pending = LocationQueue.dequeueAll(ctx)
            if (pending.isEmpty()) return@Thread

            for (loc in pending) {
                if (!isConnected || !isAuthenticated) break
                val json = JSONObject().apply {
                    put("latitude", loc.latitude)
                    put("longitude", loc.longitude)
                    loc.accuracy?.let { put("accuracy", it.toDouble()) }
                    loc.bearing?.let { put("bearing", it.toDouble()) }
                    loc.speed?.let { put("speed", it.toDouble()) }
                    loc.altitude?.let { put("altitude", it) }
                }
                ws?.send(json.toString())
                Thread.sleep(300)
            }
            Log.d(TAG, "Queue drained")
        }.start()
    }

    fun reconnect() {
        Log.d(TAG, "Manual reconnect")
        isConnected = false
        isAuthenticated = false
        ws?.close(1001, "Manual reconnect")
        ws = null
        reconnectAttempts = 0
        connect()
    }
}
