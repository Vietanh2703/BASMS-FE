declare namespace H {
    namespace service {
        class Platform {
            constructor(options: { apikey: string });
            createDefaultLayers(): any;
            getSearchService(): SearchService;
        }

        interface SearchService {
            geocode(
                params: {
                    q: string;
                },
                onResult: (result: any) => void,
                onError: (error: any) => void
            ): void;
        }
    }

    class Map {
        constructor(
            element: HTMLElement,
            baseLayer: any,
            options?: {
                center?: { lat: number; lng: number };
                zoom?: number;
                pixelRatio?: number;
            }
        );
        addObject(object: any): void;
        removeObjects(objects: any[]): void;
        getObjects(): any[];
        setCenter(location: { lat: number; lng: number }): void;
        setZoom(zoom: number): void;
        getViewModel(): any;
        getViewPort(): ViewPort;
        screenToGeo(x: number, y: number): { lat: number; lng: number };
        addEventListener(type: string, handler: (evt: any) => void, useCapture?: boolean): void;
        removeEventListener(type: string, handler: (evt: any) => void, useCapture?: boolean): void;
        dispose(): void;
    }

    interface ViewPort {
        resize(): void;
    }

    namespace map {
        class Marker {
            constructor(position: { lat: number; lng: number }, options?: any);
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
            static createDefault(map: H.Map, defaultLayers: any): UI;
        }
    }

    namespace geo {
        interface Point {
            lat: number;
            lng: number;
        }
    }
}

declare global {
    interface Window {
        H: typeof H;
    }
}

export {};
