package com.ordereasy.inventory_service.util;

/**
 * Bounding-box calculator for geographic radius search.
 *
 * Given a center point (lat, lon) and a radius in km, computes the axis-aligned
 * bounding box that contains all points within that radius. This box is then used
 * to pre-filter dark stores from the database using simple BETWEEN comparisons,
 * avoiding a full table scan.
 *
 * Interview note:
 *   1° latitude ≈ 111.32 km (constant).
 *   1° longitude ≈ 111.32 * cos(lat) km (varies with latitude).
 *
 *   Bounding box slightly overestimates the circular area, so some false-positives
 *   are possible. These are eliminated in the subsequent Haversine sort step.
 */
public class BoundingBoxUtil {

    private static final double KM_PER_DEGREE_LAT = 111.32;

    private BoundingBoxUtil() {
        // utility class, no instantiation
    }

    /**
     * Calculates a bounding box around a given point for the specified radius.
     *
     * @param latitude   center latitude (degrees)
     * @param longitude  center longitude (degrees)
     * @param radiusKm   search radius in kilometers
     * @return double[4] = { minLat, maxLat, minLng, maxLng }
     */
    public static double[] calculate(double latitude, double longitude, double radiusKm) {
        double deltaLat = radiusKm / KM_PER_DEGREE_LAT;
        double deltaLng = radiusKm / (KM_PER_DEGREE_LAT * Math.cos(Math.toRadians(latitude)));

        double minLat = latitude - deltaLat;
        double maxLat = latitude + deltaLat;
        double minLng = longitude - deltaLng;
        double maxLng = longitude + deltaLng;

        return new double[]{minLat, maxLat, minLng, maxLng};
    }
}
