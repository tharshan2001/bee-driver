package com.ebee.driver.location

import org.json.JSONObject

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?,
    val bearing: Float?,
    val speed: Float?,
    val altitude: Double?,
    val timestamp: Long
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("latitude", latitude)
        put("longitude", longitude)
        accuracy?.let { put("accuracy", it.toDouble()) }
        bearing?.let { put("bearing", it.toDouble()) }
        speed?.let { put("speed", it.toDouble()) }
        altitude?.let { put("altitude", it) }
        put("timestamp", timestamp)
    }
}
