<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const tabs = [
		{
			href: '/maps',
			label: 'Maps',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />`
		},
		{
			href: '/tipps',
			label: 'Tipps',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />`
		}
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-dvh flex-col bg-gray-50">
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>

	<nav
		class="flex border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.05)] backdrop-blur-lg"
	>
		{#each tabs as tab (tab.href)}
			{@const active = page.url.pathname.startsWith(tab.href)}
			<a
				href={tab.href}
				class="group relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-200 {active
					? 'text-blue-600'
					: 'text-gray-400 hover:text-gray-600'}"
			>
				{#if active}
					<span class="absolute top-0 h-0.5 w-8 rounded-full bg-blue-600 transition-all"></span>
				{/if}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.8"
					stroke="currentColor"
					class="h-6 w-6 transition-transform duration-200 {active
						? 'scale-110'
						: 'group-active:scale-95'}"
				>
					{@html tab.icon}
				</svg>
				<span class="text-xs font-medium">{tab.label}</span>
			</a>
		{/each}
	</nav>
</div>
