import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Search, X } from 'lucide-react';
import { loadGooglePlacesLibrary } from '../../../lib/googleMaps';

export interface GooglePlaceValue {
    ubicacion: string;
    google_place_id: string | null;
    latitud: number | null;
    longitud: number | null;
}

interface Props {
    value: GooglePlaceValue;
    onChange: (value: GooglePlaceValue) => void;
    disabled?: boolean;
}

export default function GooglePlacePicker({
    value,
    onChange,
    disabled = false,
}: Props) {
    const placesRef = useRef<google.maps.PlacesLibrary | null>(null);
    const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const timerRef = useRef<number | null>(null);

    const [query, setQuery] = useState(value.ubicacion);
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        loadGooglePlacesLibrary()
            .then((places) => {
                if (!active) return;
                placesRef.current = places;
                tokenRef.current = new places.AutocompleteSessionToken();
                setReady(true);
            })
            .catch((err) => {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'No se pudo cargar Google Places.');
            });

        return () => {
            active = false;
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        setQuery(value.ubicacion);
    }, [value.ubicacion]);

    const search = (text: string) => {
        setQuery(text);
        setError('');

        if (value.google_place_id) {
            onChange({
                ubicacion: '',
                google_place_id: null,
                latitud: null,
                longitud: null,
            });
        }

        if (timerRef.current) window.clearTimeout(timerRef.current);

        if (!ready || text.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        timerRef.current = window.setTimeout(async () => {
            const places = placesRef.current;
            if (!places) return;

            try {
                setLoading(true);

                if (!tokenRef.current) {
                    tokenRef.current = new places.AutocompleteSessionToken();
                }

                const result =
                    await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                        input: text.trim(),
                        language: 'es-MX',
                        region: 'mx',
                        includedRegionCodes: ['mx'],
                        sessionToken: tokenRef.current,
                    });

                setSuggestions(
                    result.suggestions.filter((item) => Boolean(item.placePrediction)),
                );
            } catch (err) {
                setSuggestions([]);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudieron buscar lugares.',
                );
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const selectPlace = async (
        suggestion: google.maps.places.AutocompleteSuggestion,
    ) => {
        const prediction = suggestion.placePrediction;
        if (!prediction) return;

        try {
            setLoading(true);
            setSuggestions([]);

            const place = prediction.toPlace();

            await place.fetchFields({
                fields: [
                    'id',
                    'displayName',
                    'formattedAddress',
                    'location',
                ],
            });

            if (!place.location) {
                throw new Error('Google no devolvió coordenadas.');
            }

            const address =
                place.formattedAddress ||
                place.displayName ||
                prediction.text.toString();

            onChange({
                ubicacion: address,
                google_place_id: place.id || prediction.placeId || null,
                latitud: place.location.lat(),
                longitud: place.location.lng(),
            });

            setQuery(address);

            if (placesRef.current) {
                tokenRef.current =
                    new placesRef.current.AutocompleteSessionToken();
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo seleccionar el lugar.',
            );
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setQuery('');
        setSuggestions([]);
        onChange({
            ubicacion: '',
            google_place_id: null,
            latitud: null,
            longitud: null,
        });
    };

    return (
        <div className="relative">
            <div className="relative">
                <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />

                <input
                    value={query}
                    disabled={disabled || !ready}
                    onChange={(event) => search(event.target.value)}
                    placeholder="Buscar dirección o lugar..."
                    autoComplete="off"
                    className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-10 text-[11px] text-[var(--text)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-emerald-400/25 focus:bg-white/[0.04]"
                />

                {loading ? (
                    <Loader2
                        size={15}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[var(--emerald)]"
                    />
                ) : query ? (
                    <button
                        type="button"
                        onClick={clear}
                        className="group absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-white/[0.05] hover:text-[var(--text)]"
                    >
                        <X
                            size={13}
                            className="transition-transform duration-300 group-hover:rotate-90"
                        />
                    </button>
                ) : null}
            </div>

            {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[var(--surface)] p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
                    {suggestions.map((suggestion, index) => {
                        const prediction = suggestion.placePrediction;
                        if (!prediction) return null;

                        return (
                            <button
                                key={`${prediction.placeId}-${index}`}
                                type="button"
                                onClick={() => void selectPlace(suggestion)}
                                className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all hover:bg-emerald-400/[0.07]"
                            >
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-400/[0.08] text-[var(--emerald)]">
                                    <MapPin size={14} />
                                </div>

                                <span className="text-[10px] leading-4 text-[var(--text-soft)]">
                                    {prediction.text.toString()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {value.google_place_id && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-emerald-400/[0.04] p-3">
                    <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-[var(--emerald)]"
                    />

                    <span className="text-[9px] leading-4 text-[var(--muted)]">
                        {value.ubicacion}
                    </span>
                </div>
            )}

            {error && (
                <p className="mt-2 text-[9px] text-rose-300">
                    {error}
                </p>
            )}
        </div>
    );
}