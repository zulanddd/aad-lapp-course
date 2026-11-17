import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import './LocationPicker.css';
import {useLanguage} from '../aad/Language';

const LocationPicker = ({ latitude, longitude, onLocationChange, disabled = false }) => {
  const {t}=useLanguage();
  // Use useMemo to ensure libraries array is stable across re-renders
  const libraries = useMemo(() => ['places'], []);
  const [mapCenter, setMapCenter] = useState({
    lat: latitude ?? 61.0583,
    lng: longitude ?? 28.1888
  });
  const [markerPosition, setMarkerPosition] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [address, setAddress] = useState('');
  const autocompleteRef = useRef(null);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results[0]) {
        setAddress(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, []);

  // Update map when latitude/longitude props change (for edit mode)
  useEffect(() => {
    if (latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };
      setMapCenter(newPosition);
      setMarkerPosition(newPosition);
      reverseGeocode(latitude, longitude);
    }
  }, [latitude, longitude, reverseGeocode]);

  // Handle map click to set location
  const onMapClick = useCallback((event) => {
    if (disabled) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setMarkerPosition({ lat, lng });
    onLocationChange(lat, lng);

    // Reverse geocode to get address
    reverseGeocode(lat, lng);
  }, [disabled, onLocationChange, reverseGeocode]);

  // Handle autocomplete place selection
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        setAddress(place.formatted_address || '');
        onLocationChange(lat, lng);
        
        toast.success(t('Location selected','Sijainti valittu'));
      }
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (disabled) return;

    if (navigator.geolocation) {
      toast.info(t('Getting your location…','Haetaan sijaintia…'));
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setMapCenter({ lat, lng });
          setMarkerPosition({ lat, lng });
          onLocationChange(lat, lng);
          reverseGeocode(lat, lng);
          
          toast.success(t('Location detected','Sijainti saatu'));
        },
        (error) => {
          toast.error(t('Location unavailable. Use the text location field.','Sijaintia ei saatu. Käytä sijainnin tekstikenttää.'));
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error(t('Location is not supported. Use the text field.','Paikannus ei ole tuettu. Käytä tekstikenttää.'));
    }
  };

  if (loadError) {
    return (
      <div className="location-error">
        <p>⚠️ {t("Error loading Google Maps","Karttaa ei voitu ladata")}</p>
        <p className="error-hint">{t("Please check your API key and internet connection","Voit käyttää sijainnin tekstikenttää")}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="location-loading">
        <p>{t("Loading map...","Ladataan karttaa...")}</p>
      </div>
    );
  }

  return (
    <div className="location-picker">
        <div className="location-controls">
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={onPlaceChanged}
          >
            <div className="search-box-container">
              <input
                type="text"
                placeholder={t("Search for an address or place...","Hae osoitetta tai paikkaa...")}
                className="location-search-input"
                disabled={disabled}
              />
            </div>
          </Autocomplete>

          <button
            type="button"
            onClick={getCurrentLocation}
            className="current-location-btn"
            disabled={disabled}
          >
            📍 {t("Use My Current Location","Käytä nykyistä sijaintiani")}
          </button>
        </div>

        <div className="map-wrapper">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={markerPosition ? 16 : 12}
            onClick={onMapClick}
            options={mapOptions}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                animation={window.google?.maps?.Animation?.DROP}
                title="Selected Location"
              />
            )}
          </GoogleMap>
        </div>

        {markerPosition && (
          <div className="location-info">
            <div className="coordinates">
              <strong>📍 {t("Coordinates:","Koordinaatit:")}</strong>
              <span>Lat: {markerPosition.lat.toFixed(6)}, Lng: {markerPosition.lng.toFixed(6)}</span>
            </div>
            <div className="address">
              <strong>🏠 {t("Address:","Osoite:")}</strong>
              <span>{address || 'Fetching address...'}</span>
            </div>
          </div>
        )}

        {!markerPosition && (
          <div className="location-hint">
            💡 {t("Click on the map, search for an address, or use your current location","Valitse paikka kartalta, hae osoite tai käytä nykyistä sijaintia")}
          </div>
        )}
    </div>
  );
};

export default LocationPicker;
