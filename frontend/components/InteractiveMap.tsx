import React, { useEffect, useRef } from 'react';

// Declare Leaflet to TypeScript
declare var L: any;

interface InteractiveMapProps {
    position: [number, number];
    address: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ position, address }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return; // If container is not ready or map is already initialized, do nothing
        }

        // Initialize map
        const map = L.map(mapContainerRef.current).setView(position, 16);
        mapInstanceRef.current = map;

        // Add tile layer from OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add a marker for the restaurant
        const marker = L.marker(position).addTo(map);
        marker.bindPopup(`<b>AGRIA ROUEN</b><br>${address}`).openPopup();

        // Cleanup on component unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [position, address]);

    return (
        <div ref={mapContainerRef} className="h-full w-full" aria-label="Carte de localisation du restaurant"></div>
    );
};

export default InteractiveMap;
