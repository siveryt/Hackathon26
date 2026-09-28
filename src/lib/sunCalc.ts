// src/lib/sunCalc.ts
import { getPosition } from 'suncalc';

export interface ShadowInfo {
	sunAltitude: number;
	sunAzimuth: number;
	shadowLength: number;
	shadowPoint: {
		lat: number;
		lon: number;
	};
}

// Bei sehr flacher Sonne wird der Schatten beliebig lang – deckeln
const MAX_SHADOW_LENGTH = 300; // Meter

export function getShadowPolygon(
	buildingLat: number,
	buildingLon: number,
	height: number,
	time: Date = new Date()
): ShadowInfo | null {
	// Sonnenposition berechnen (suncalc v2: Grad, Azimut im Uhrzeigersinn ab Norden)
	const { altitude, azimuth } = getPosition(time, buildingLat, buildingLon);

	// Wenn Sonne unter Horizont: kein Schatten
	if (altitude <= 0) {
		return null;
	}

	// Schattenlänge berechnen
	const altitudeRad = (altitude * Math.PI) / 180;
	const shadowLength = Math.min(MAX_SHADOW_LENGTH, height / Math.tan(altitudeRad));

	// Schatten fällt entgegengesetzt zur Sonne
	const shadowBearingRad = (((azimuth + 180) % 360) * Math.PI) / 180;

	// Schattenpunkt berechnen
	const lat_offset = (shadowLength / 111000) * Math.cos(shadowBearingRad);
	const lon_offset =
		(shadowLength / 111000 / Math.cos((buildingLat * Math.PI) / 180)) * Math.sin(shadowBearingRad);

	return {
		sunAltitude: altitude,
		sunAzimuth: azimuth,
		shadowLength,
		shadowPoint: {
			lat: buildingLat + lat_offset,
			lon: buildingLon + lon_offset
		}
	};
}
