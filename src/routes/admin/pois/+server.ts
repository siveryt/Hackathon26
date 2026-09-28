// src/routes/admin/pois/+page.server.ts
import { db } from '$lib/server/db';
import { poi } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pois = await db.select().from(poi).orderBy(desc(poi.createdAt));
	return { pois };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();

		const name = data.get('name')?.toString();
		const latitude = Number(data.get('latitude'));
		const longitude = Number(data.get('longitude'));

		if (!name) return fail(400, { error: 'Name ist erforderlich' });
		if (isNaN(latitude) || isNaN(longitude)) {
			return fail(400, { error: 'Ungültige Koordinaten' });
		}

		await db.insert(poi).values({
			name,
			description: data.get('description')?.toString() ?? null,
			category: data.get('category')?.toString() || 'general',
			latitude,
			longitude,
			address: data.get('address')?.toString() ?? null,
			imageUrl: data.get('imageUrl')?.toString() ?? null,
			isPublished: data.get('isPublished') === 'on'
		});

		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (isNaN(id)) return fail(400, { error: 'Ungültige ID' });

		await db
			.update(poi)
			.set({
				name: data.get('name')?.toString(),
				description: data.get('description')?.toString() ?? null,
				category: data.get('category')?.toString() || 'general',
				latitude: Number(data.get('latitude')),
				longitude: Number(data.get('longitude')),
				address: data.get('address')?.toString() ?? null,
				imageUrl: data.get('imageUrl')?.toString() ?? null,
				isPublished: data.get('isPublished') === 'on',
				updatedAt: new Date()
			})
			.where(eq(poi.id, id));

		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (isNaN(id)) return fail(400, { error: 'Ungültige ID' });

		await db.delete(poi).where(eq(poi.id, id));
		return { success: true };
	},

	togglePublish: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const current = data.get('current') === 'true';

		await db
			.update(poi)
			.set({ isPublished: !current, updatedAt: new Date() })
			.where(eq(poi.id, id));

		return { success: true };
	}
};
