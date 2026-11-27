package com.ebee.driver.location

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONArray

object LocationQueue {

    private const val TAG = "LocationQueue"
    private const val PREFS_NAME = "location_queue"
    private const val KEY_QUEUE = "pending_locations"
    private const val MAX_QUEUE_SIZE = 500

    private fun prefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun enqueue(context: Context, loc: LocationData) {
        val queue = getQueue(context)
        queue.put(loc.toJson())
        if (queue.length() > MAX_QUEUE_SIZE) {
            queue.remove(0)
        }
        saveQueue(context, queue)
        Log.d(TAG, "Enqueued, queue size: ${queue.length()}")
    }

    fun dequeueAll(context: Context): List<LocationData> {
        val queue = getQueue(context)
        val result = mutableListOf<LocationData>()
        for (i in 0 until queue.length()) {
            try {
                val obj = queue.getJSONObject(i)
                result.add(
                    LocationData(
                        latitude = obj.getDouble("latitude"),
                        longitude = obj.getDouble("longitude"),
                        accuracy = if (obj.has("accuracy") && !obj.isNull("accuracy")) obj.getDouble("accuracy").toFloat() else null,
                        bearing = if (obj.has("bearing") && !obj.isNull("bearing")) obj.getDouble("bearing").toFloat() else null,
                        speed = if (obj.has("speed") && !obj.isNull("speed")) obj.getDouble("speed").toFloat() else null,
                        altitude = if (obj.has("altitude") && !obj.isNull("altitude")) obj.getDouble("altitude") else null,
                        timestamp = obj.getLong("timestamp")
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing queued location: ${e.message}")
            }
        }
        clear(context)
        Log.d(TAG, "Dequeued ${result.size} locations")
        return result
    }

    fun clear(context: Context) {
        prefs(context).edit().remove(KEY_QUEUE).apply()
    }

    fun size(context: Context): Int {
        return getQueue(context).length()
    }

    private fun getQueue(context: Context): JSONArray {
        val raw = prefs(context).getString(KEY_QUEUE, "[]") ?: "[]"
        return try {
            JSONArray(raw)
        } catch (e: Exception) {
            JSONArray()
        }
    }

    private fun saveQueue(context: Context, queue: JSONArray) {
        prefs(context).edit().putString(KEY_QUEUE, queue.toString()).apply()
    }
}
