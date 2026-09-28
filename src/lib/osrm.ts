// src/lib/osrm.ts
import { env } from '$env/dynamic/private';

interface RouteResponse {
	distance: number;
	duration: number;
	geometry: {
		type: string;
		coordinates: [number, number][];
	};
}

export async function getRoute(
	startLat: number,
	startLon: number,
	endLat: number,
	endLon: number
): Promise<RouteResponse> {
	// Host/Port aus .env (lokal: localhost, im Docker-Netz: osrm)
	const host = env.OSRM_HOST || 'localhost';
	const port = env.OSRM_PORT || '5001';

	const url = `http://${host}:${port}/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

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

		const route = data.routes[0];

		return {
			distance: route.distance,
			duration: route.duration,
			geometry: route.geometry
		};
	} catch (error) {
		console.error('[OSRM] Fetch error:', error);
		throw error;
	}
}
