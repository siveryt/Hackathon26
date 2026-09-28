// src/lib/osrm.ts
import { env } from '$env/dynamic/private';

export interface RouteResponse {
	distance: number;
	duration: number;
	geometry: {
		type: string;
		coordinates: [number, number][];
	};
}

// Liefert die Hauptroute plus bis zu `alternatives` Alternativen von OSRM
export async function getRoutes(
	startLat: number,
	startLon: number,
	endLat: number,
	endLon: number,
	alternatives: number = 3
): Promise<RouteResponse[]> {
	// Host/Port aus .env (lokal: localhost, im Docker-Netz: osrm)
	const host = env.OSRM_HOST || 'localhost';
	const port = env.OSRM_PORT || '5001';

	const url = `http://${host}:${port}/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=${alternatives > 0 ? alternatives : 'false'}`;

	console.log('[OSRM] Requesting:', url);

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const text = await response.text();
			console.error('[OSRM] Error response:', response.status, text);
			throw new Error(`OSRM Fehler: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.routes || data.routes.length === 0) {
			throw new Error('Keine Route gefunden');
		}

		return data.routes.map((route: RouteResponse) => ({
			distance: route.distance,
			duration: route.duration,
			geometry: route.geometry
		}));
	} catch (error) {
		console.error('[OSRM] Fetch error:', error);
		throw error;
	}
}

export async function getRoute(
	startLat: number,
	startLon: number,
	endLat: number,
	endLon: number
): Promise<RouteResponse> {
	const [route] = await getRoutes(startLat, startLon, endLat, endLon, 0);
	return route;
}
