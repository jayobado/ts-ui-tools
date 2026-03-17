import type { ServiceMap, ResolvedServices } from './define.ts'

type AnyResolvedServices = ResolvedServices<ServiceMap>

let resolvedServices: AnyResolvedServices | null = null

export function configureServices<T extends ServiceMap>(
	services: ResolvedServices<T>
): void {
	resolvedServices = services as AnyResolvedServices
}

export function useServices<T extends ServiceMap>(): ResolvedServices<T> {
	if (!resolvedServices) {
		throw new Error(
			'[services] No services configured. ' +
			'Call configureServices() in main.ts before using services.'
		)
	}
	return resolvedServices as ResolvedServices<T>
}

export { defineServices, query, mutation, subscription } from './define.ts'
export type {
	ServiceMap,
	ResolvedServices,
	SubscriptionCallbacks,
	QueryDef,
	MutationDef,
	SubscriptionDef,
} from './define.ts'