<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const tabs = [
		{ href: '/maps', label: 'Maps' },
		{ href: '/tipps', label: 'Tipps' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-dvh flex-col">
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>

	<nav class="flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class="flex-1 py-3 text-center text-sm font-medium {page.url.pathname.startsWith(tab.href)
					? 'text-blue-600'
					: 'text-gray-500'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>
</div>
