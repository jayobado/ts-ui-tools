export interface QueryDef<TInput, TOutput> {
	_type: 'query'
	_input: TInput
	_output: TOutput
	path: string
}

export interface MutationDef<TInput, TOutput> {
	_type: 'mutation'
	_input: TInput
	_output: TOutput
	path: string
}

export interface SubscriptionDef<TInput, TOutput> {
	_type: 'subscription'
	_input: TInput
	_output: TOutput
	path: string
}

export type OperationDef<TInput = unknown, TOutput = unknown> =
	| QueryDef<TInput, TOutput>
	| MutationDef<TInput, TOutput>
	| SubscriptionDef<TInput, TOutput>

export function query<TInput, TOutput>(path: string): QueryDef<TInput, TOutput> {
	return { _type: 'query', _input: undefined as TInput, _output: undefined as TOutput, path }
}

export function mutation<TInput, TOutput>(path: string): MutationDef<TInput, TOutput> {
	return { _type: 'mutation', _input: undefined as TInput, _output: undefined as TOutput, path }
}

export function subscription<TInput, TOutput>(path: string): SubscriptionDef<TInput, TOutput> {
	return { _type: 'subscription', _input: undefined as TInput, _output: undefined as TOutput, path }
}

export type DomainDef = {
	[method: string]: OperationDef
}

export type ServiceMap = {
	[domain: string]: DomainDef
}

type ResolveOperation<T> =
	T extends QueryDef<infer TInput, infer TOutput>
	? (input: TInput) => Promise<TOutput>
	: T extends MutationDef<infer TInput, infer TOutput>
	? (input: TInput) => Promise<TOutput>
	: T extends SubscriptionDef<infer TInput, infer TOutput>
	? (input: TInput, callbacks: SubscriptionCallbacks<TOutput>) => () => void
	: never

export type ResolvedDomain<T extends DomainDef> = {
	[K in keyof T]: ResolveOperation<T[K]>
}

export type ResolvedServices<T extends ServiceMap> = {
	[K in keyof T]: ResolvedDomain<T[K]>
}

export interface SubscriptionCallbacks<T> {
	onData: (data: T) => void
	onError?: (err: Error) => void
	onComplete?: () => void
}

export function defineDomain<T extends DomainDef>(domain: T): T {
	return domain
}

export function defineServices<T extends ServiceMap>(services: T): T {
	return services
}