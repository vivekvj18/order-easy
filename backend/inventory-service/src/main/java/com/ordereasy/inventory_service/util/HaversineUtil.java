package com.ordereasy.inventory_service.util;

/**
 * Haversine distance calculator.
 *
 * The Haversine formula computes the great-circle distance between two points
 * on a sphere given their longitudes and latitudes.
 *
 * Interview note:
 *   - Used to sort candidate dark stores by actual distance from the user.
 *   - Bounding-box pre-filter is applied first to limit candidates.
 *   - Haversine is O(1) per store; total cost is O(k) where k = candidate stores.
 *   - Future optimization: Redis GEO commands (GEOSEARCH) for O(log N) lookups.
 */
public class HaversineUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private HaversineUtil() {
        // utility class, no instantiation
    }

    /**
     * Calculates the distance in kilometers between two geographic coordinates
     * using the Haversine formula.
     *
     * @param lat1 latitude of point 1 (degrees)
     * @param lon1 longitude of point 1 (degrees)
     * @param lat2 latitude of point 2 (degrees)
     * @param lon2 longitude of point 2 (degrees)
     * @return distance in kilometers
     */
    public static double calculateDistanceKm(double lat1, double lon1,
                                              double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }
}
