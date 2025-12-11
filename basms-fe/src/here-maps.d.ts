declare global {
    namespace H {
        interface DefaultLayers {
            vector: {
                normal: {
                    map: Layer;
                };
            };
        }

        interface Layer {
            // Base layer type
        }

        class MapObject {
            // Base map object type
        }

        namespace service {
            class Platform {
                constructor(options: { apikey: string });
                createDefaultLayers(): DefaultLayers;
                getSearchService(): SearchService;
            }

            interface SearchResult {
                title?: string;
                position: {
                    lat: number;
                    lng: number;
                };
                address?: {
                    label: string;
                };
            }

            interface GeocodeResponse {
                items?: SearchResult[];
            }

            interface SearchService {
                geocode(
                    params: {
                        q: string;
                    },
                    onResult: (result: GeocodeResponse) => void,
                    onError: (error: Error) => void
                ): void;
            }
        }

        class Map {
            constructor(
                element: HTMLElement,
                baseLayer: Layer,
                options?: {
                    center?: { lat: number; lng: number };
                    zoom?: number;
                    pixelRatio?: number;
                }
            );
            addObject(object: MapObject): void;
            removeObjects(objects: MapObject[]): void;
            getObjects(): MapObject[];
            setCenter(location: { lat: number; lng: number }): void;
            setZoom(zoom: number): void;
            getViewModel(): ViewModel;
            getViewPort(): ViewPort;
            screenToGeo(x: number, y: number): { lat: number; lng: number };
            addEventListener(type: string, handler: (evt: MapEvent) => void, useCapture?: boolean): void;
            removeEventListener(type: string, handler: (evt: MapEvent) => void, useCapture?: boolean): void;
            dispose(): void;
        }

        interface ViewModel {
            // View model interface
        }

        interface ViewPort {
            resize(): void;
        }

        interface MapEvent {
            target: MapObject;
            currentPointer: {
                viewportX: number;
                viewportY: number;
            };
        }

        namespace map {
            class Marker extends MapObject {
                constructor(position: { lat: number; lng: number }, options?: { volatility?: boolean });
                draggable: boolean;
                setGeometry(geometry: { lat: number; lng: number }): void;
                getGeometry(): { lat: number; lng: number };
            }
        }

        namespace mapevents {
            class Behavior {
                constructor(mapEvents: MapEvents);
            }
            class MapEvents {
                constructor(map: H.Map);
            }
        }

        namespace ui {
            class UI {
                static createDefault(map: H.Map, defaultLayers: DefaultLayers): UI;
            }
        }

        namespace geo {
            interface Point {
                lat: number;
                lng: number;
            }
        }
    }

    interface Window {
        H: typeof H;
    }
}

export {};
