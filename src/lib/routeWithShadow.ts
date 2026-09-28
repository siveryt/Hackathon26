// src/lib/routeWithShadow.ts
import { getRoutes, type RouteResponse } from './osrm';
import { getBuildingsInBBox } from './overpass';
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
// Puffer um die Routen-Bounding-Box für die Gebäudeabfrage (= maximale Schattenlänge)
const BBOX_BUFFER_KM = 0.3;

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

	// Puffer: Gebäude bis zur maximalen Schattenlänge (300 m) neben der Route zählen
	const bufferLat = BBOX_BUFFER_KM / 111;
	const bufferLon =
		BBOX_BUFFER_KM / (111 * Math.cos((((bounds[1] + bounds[3]) / 2) * Math.PI) / 180));

	// 3. Gebäude entlang aller Routen einmalig abrufen
	const buildings = await getBuildingsInBBox(
		bounds[1] - bufferLat,
		bounds[0] - bufferLon,
		bounds[3] + bufferLat,
		bounds[2] + bufferLon
	);

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

	// 6. Schattigste Route wählen (bei Gleichstand die kürzere)
	let selectedIndex = 0;
	alternatives.forEach((a, i) => {
		const best = alternatives[selectedIndex];
		if (
			a.shadowPercentage > best.shadowPercentage ||
			(a.shadowPercentage === best.shadowPercentage && a.distance < best.distance)
		) {
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
