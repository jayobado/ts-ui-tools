import type {
	ServiceMap,
	OperationDef,
	ResolvedServices,
	SubscriptionCallbacks,
} from '../services/define.ts'

export interface Transport {
	query<TInput, TOutput>(path: string, input: TInput): Promise<TOutput>
	mutate<TInput, TOutput>(path: string, input: TInput): Promise<TOutput>
	subscribe<TInput, TOutput>(
		path: string,
		input: TInput,
		callbacks: SubscriptionCallbacks<TOutput>
	): () => void
}

export function resolveServices<T extends ServiceMap>(
	map: T,
	transport: Transport
): ResolvedServices<T> {
	const resolved: Record<string, Record<string, unknown>> = {}

	for (const [domain, methods] of Object.entries(map)) {
		resolved[domain] = {}
		for (const [method, def] of Object.entries(methods)) {
			const operation = def as OperationDef

			if (operation._type === 'query') {
				resolved[domain][method] = (input: unknown) =>
					transport.query(operation.path, input)

			} else if (operation._type === 'mutation') {
				resolved[domain][method] = (input: unknown) =>
					transport.mutate(operation.path, input)

			} else if (operation._type === 'subscription') {
				resolved[domain][method] = (
					input: unknown,
					callbacks: SubscriptionCallbacks<unknown>
				) => transport.subscribe(operation.path, input, callbacks)
			}
		}
	}

	return resolved as ResolvedServices<T>
}