import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let ready = false;
let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;

function configure() {
    if (ready) return;

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

    if (!key) {
        throw new Error('Falta VITE_GOOGLE_MAPS_API_KEY en .env');
    }

    setOptions({
        key,
        v: 'weekly',
        language: 'es',
        region: 'MX',
    });

    ready = true;
}

export function loadGooglePlacesLibrary() {
    configure();

    if (!placesPromise) {
        placesPromise = importLibrary('places');
    }

    return placesPromise;
}