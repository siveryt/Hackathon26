// src/lib/routeWithShadow.ts
import { getRoute } from './osrm';
import { getBuildingsInRadius } from './overpass';
import { getShadowPolygon } from './sunCalc';
import * as turf from '@turf/turf';
import type { BBox, Feature, Polygon, MultiPolygon } from 'geojson';

export interface RouteWithShadowResult {
	distance: number;
	duration: number;
	shadowPercentage: number;
	buildingCount: number;
	shadowedBuildingCount: number;
	geometry: {
		type: string;
		coordinates: [number, number][];
	};
}

// Halbe Breite eines Schattenstreifens (≈ halbe Gebäudebreite)
const SHADOW_HALF_WIDTH_KM = 0.005;
// Abstand der Messpunkte entlang der Route
const SAMPLE_STEP_KM = 0.01;

export async function getRouteWithShadow(
	startLat: number,
	startLon: number,
	endLat: number,
	endLon: number,
	time: Date = new Date()
): Promise<RouteWithShadowResult> {
	// 1. Route holen
	const route = await getRoute(startLat, startLon, endLat, endLon);
	const routeLine = turf.lineString(route.geometry.coordinates);

	// 2. Bounding Box der Route berechnen
	const bounds = turf.bbox(routeLine);

	const centerLat = (bounds[1] + bounds[3]) / 2;
	const centerLon = (bounds[0] + bounds[2]) / 2;

	// Radius: halbe Diagonale der Bounding Box
	const routeDistance = turf.distance([bounds[0], bounds[1]], [bounds[2], bounds[3]]);
	const radiusKm = routeDistance / 2 + 0.5; // +0.5km Buffer

	// 3. Gebäude entlang Route abrufen
	const buildings = await getBuildingsInRadius(centerLat, centerLon, radiusKm);

	// 4. Schatten berechnen: Streifen vom Gebäude bis zum Schattenpunkt
	const shadowPolygons: { poly: Feature<Polygon | MultiPolygon>; bbox: BBox }[] = [];

	for (const b of buildings) {
		const shadow = getShadowPolygon(b.lat, b.lon, b.height, time);
		if (!shadow) continue;

		try {
			const shadowLine = turf.lineString([
				[b.lon, b.lat],
				[shadow.shadowPoint.lon, shadow.shadowPoint.lat]
			]);
			const poly = turf.buffer(shadowLine, SHADOW_HALF_WIDTH_KM, { units: 'kilometers' });
			if (poly) {
				shadowPolygons.push({ poly, bbox: turf.bbox(poly) });
			}
		} catch (error) {
			console.error('Geometrie-Fehler:', error);
		}
	}

	// 5. Wie viel % der Route ist im Schatten? Route abtasten und Punkte prüfen
	const totalLengthKm = turf.length(routeLine, { units: 'kilometers' });
	let samples = 0;
	let shadowedSamples = 0;

	for (let d = 0; d <= totalLengthKm; d += SAMPLE_STEP_KM) {
		const pt = turf.along(routeLine, d, { units: 'kilometers' });
		const [x, y] = pt.geometry.coordinates;
		samples++;

		const inShadow = shadowPolygons.some(
			({ poly, bbox }) =>
				x >= bbox[0] &&
				x <= bbox[2] &&
				y >= bbox[1] &&
				y <= bbox[3] &&
				turf.booleanPointInPolygon(pt, poly)
		);
		if (inShadow) shadowedSamples++;
	}

	const shadowPercentage = samples > 0 ? (shadowedSamples / samples) * 100 : 0;

	return {
		distance: route.distance,
		duration: route.duration,
		shadowPercentage: Math.round(shadowPercentage),
		buildingCount: buildings.length,
		shadowedBuildingCount: shadowPolygons.length,
		geometry: route.geometry
	};
}
