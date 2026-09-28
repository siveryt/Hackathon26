// src/routes/api/route/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRouteWithShadow } from '$lib/routeWithShadow';

export const GET: RequestHandler = async ({ url }) => {
	const startLat = url.searchParams.get('startLat');
	const startLon = url.searchParams.get('startLon');
	const endLat = url.searchParams.get('endLat');
	const endLon = url.searchParams.get('endLon');
	const time = url.searchParams.get('time');

	// Validierung (außerhalb von try, sonst wird der 400 zum 500)
	if (!startLat || !startLon || !endLat || !endLon) {
		error(400, 'Fehlende Parameter: startLat, startLon, endLat, endLon');
	}

	const startLatNum = parseFloat(startLat);
	const startLonNum = parseFloat(startLon);
	const endLatNum = parseFloat(endLat);
	const endLonNum = parseFloat(endLon);

	// Validierung: Koordinaten im gültigen Bereich?
	const validLat = (v: number) => Number.isFinite(v) && Math.abs(v) <= 90;
	const validLon = (v: number) => Number.isFinite(v) && Math.abs(v) <= 180;
	if (
		!validLat(startLatNum) ||
		!validLon(startLonNum) ||
		!validLat(endLatNum) ||
		!validLon(endLonNum)
	) {
		error(400, 'Ungültige Koordinaten');
	}

	// Optional: Zeit-Parameter
	const queryTime = time ? new Date(time) : new Date();
	if (isNaN(queryTime.getTime())) {
		error(400, 'Ungültige Zeit');
	}

	try {
		// Route mit Schatten berechnen
		const result = await getRouteWithShadow(
			startLatNum,
			startLonNum,
			endLatNum,
			endLonNum,
			queryTime
		);

		return json(result);
	} catch (err) {
		console.error('Route Fehler:', err);
		error(500, `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
	}
};
