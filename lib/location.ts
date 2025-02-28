export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  // Filter stations within a certain radius (in km)
  export function filterNearbyStations(
    stations: any[],
    userLat: number,
    userLon: number,
    radius: number = 10 // Default 10km radius
  ): any[] {
    return stations.filter((station) => {
      const distance = calculateDistance(
        userLat,
        userLon,
        parseFloat(station.gtfs_latitude),
        parseFloat(station.gtfs_longitude)
      );
      station.distance = distance; // Add distance to station object
      return distance <= radius;
    }).sort((a, b) => a.distance - b.distance); // Sort by distance
  }
  
  // Get user's location using Geolocation API
  export function getUserLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error: GeolocationPositionError) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location access was denied. Please enable location services to see nearby stations.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable. Please try again.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out. Please try again.'));
              break;
            default:
              reject(new Error('An unknown error occurred while getting your location.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }