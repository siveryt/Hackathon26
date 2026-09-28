import { db } from '$lib/server/db';
import { poi } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pois = await db
		.select({
			id: poi.id,
			name: poi.name,
			description: poi.description,
			category: poi.category,
			latitude: poi.latitude,
			longitude: poi.longitude,
			imageUrl: poi.imageUrl
		})
		.from(poi)
		.where(eq(poi.isPublished, true));

	return { pois };
};
