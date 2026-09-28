// src/lib/routeWithShadow.ts
import { getRoutes, type RouteResponse } from './osrm';
import { getBuildingsInRadius } from './overpass';
import { getShadowPolygon } from './sunCalc';
import * as turf from '@turf/turf';
import type { BBox, Feature, LineString, Polygon, MultiPolygon } from 'geojson';

export interface RouteAlternative {
	distance: number;
	duration: number;
	shadowPercentage: number;
	geometry: RouteResponse['geometry'];
}

export interface RouteWithShadowResult extends RouteAlternative {
	buildingCount: number;
	shadowedBuildingCount: number;
	// Index der gewählten Route in `alternatives`
	selectedIndex: number;
	alternatives: RouteAlternative[];
}

type ShadowPolygon = { poly: Feature<Polygon | MultiPolygon>; bbox: BBox };

// Halbe Breite eines Schattenstreifens (≈ halbe Gebäudebreite)
const SHADOW_HALF_WIDTH_KM = 0.005;
// Abstand der Messpunkte entlang der Route
const SAMPLE_STEP_KM = 0.01;
// Anzahl der OSRM-Alternativen zusätzlich zur Hauptroute
const MAX_ALTERNATIVES = 3;
// Ein Meter in der Sonne "kostet" so viel wie (1 + SUN_PENALTY) Meter im Schatten
const SUN_PENALTY = 1;
// Routen, die mehr als 50 % länger sind als die kürzeste, werden verworfen
const MAX_DETOUR_FACTOR = 1.5;

export async function getRouteWithShadow(
	startLat: number,
	startLon: number,
	endLat: number,
	endLon: number,
	time: Date = new Date()
): Promise<RouteWithShadowResult> {
	// 1. Hauptroute + Alternativen holen
	const routes = await getRoutes(startLat, startLon, endLat, endLon, MAX_ALTERNATIVES);
	const routeLines = routes.map((r) => turf.lineString(r.geometry.coordinates));

	// 2. Bounding Box über alle Routen berechnen
	const bounds = turf.bbox(turf.featureCollection(routeLines));

	const centerLat = (bounds[1] + bounds[3]) / 2;
	const centerLon = (bounds[0] + bounds[2]) / 2;

	// Radius: halbe Diagonale der Bounding Box
	const routeDistance = turf.distance([bounds[0], bounds[1]], [bounds[2], bounds[3]]);
	const radiusKm = routeDistance / 2 + 0.5; // +0.5km Buffer

	// 3. Gebäude entlang aller Routen einmalig abrufen
	const buildings = await getBuildingsInRadius(centerLat, centerLon, radiusKm);

	// 4. Schatten berechnen: Streifen vom Gebäude bis zum Schattenpunkt
	const shadowPolygons: ShadowPolygon[] = [];

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

	// 5. Jede Route bewerten
	const alternatives: RouteAlternative[] = routes.map((route, i) => ({
		distance: route.distance,
		duration: route.duration,
		shadowPercentage: Math.round(getShadowFraction(routeLines[i], shadowPolygons) * 100),
		geometry: route.geometry
	}));

	// 6. Route mit den geringsten Kosten wählen: Länge + Strafe für sonnige Meter
	const shortest = Math.min(...alternatives.map((a) => a.distance));
	let selectedIndex = 0;
	let bestCost = Infinity;

	alternatives.forEach((a, i) => {
		if (a.distance > shortest * MAX_DETOUR_FACTOR) return;
		const sunnyDistance = a.distance * (1 - a.shadowPercentage / 100);
		const cost = a.distance + SUN_PENALTY * sunnyDistance;
		if (cost < bestCost) {
			bestCost = cost;
			selectedIndex = i;
		}
	});

	return {
		...alternatives[selectedIndex],
		buildingCount: buildings.length,
		shadowedBuildingCount: shadowPolygons.length,
		selectedIndex,
		alternatives
	};
}

// Anteil (0–1) der Route im Schatten: Route abtasten und Punkte prüfen
function getShadowFraction(routeLine: Feature<LineString>, shadowPolygons: ShadowPolygon[]) {
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

	return samples > 0 ? shadowedSamples / samples : 0;
}
