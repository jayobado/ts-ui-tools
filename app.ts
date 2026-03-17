import { createRouter, RouteDefinition, RouterOptions } from './router.ts'

export interface AppOptions {
	mountPoint?: string | HTMLElement
	routes: RouteDefinition[]
	fallback?: RouterOptions['fallback']
	onError?: (err: unknown) => void
	onInit?: () => void | Promise<void>
}

export function createApp(options: AppOptions) {
	const { mountPoint = '#app', routes, fallback, onError, onInit } = options

	const outletElement = typeof mountPoint === 'string'
		? document.querySelector<HTMLElement>(mountPoint)
		: mountPoint

	if (!outletElement) {
		throw new Error(`[createApp] Mount point "${mountPoint}" not found in document`)
	}

	const outlet = outletElement

	async function init() {
		if (onInit) await onInit()

		const router = createRouter({
			outlet,
			routes,
			fallback,
			onError: onError ?? ((err) => console.error('[app]', err)),
		})

		router.interceptLinks()
		return router
	}

	return { init }
}