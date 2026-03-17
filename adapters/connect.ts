import type { Transport } from './base.ts'
import type { ServiceMap } from '../services/define.ts'
import type { SubscriptionCallbacks } from '../services/define.ts'
import { resolveServices } from './base.ts'
import type { ResolvedServices } from '../services/define.ts'

export interface ConnectAdapterOptions {
	baseUrl: string
	protocol?: 'connect' | 'grpc-web'
	getHeaders?: () => Record<string, string>
	onError?: (err: Error) => void
}

function createConnectTransport(options: ConnectAdapterOptions): Transport {
	const {
		baseUrl,
		protocol = 'connect',
		getHeaders = () => ({}),
		onError,
	} = options

	const contentType = protocol === 'grpc-web'
		? 'application/grpc-web+json'
		: 'application/connect+json'

	async function rpc<TInput, TOutput>(path: string, input: TInput): Promise<TOutput> {
		const res = await fetch(`${baseUrl}/${path}`, {
			method: 'POST',
			headers: { 'Content-Type': contentType, ...getHeaders() },
			body: JSON.stringify(input ?? {}),
		})
		if (!res.ok) {
			const err = new Error(`Connect RPC ${path} failed: ${res.status}`)
			onError?.(err)
			throw err
		}
		return res.json() as Promise<TOutput>
	}

	function subscribe<TInput, TOutput>(
		path: string,
		input: TInput,
		callbacks: SubscriptionCallbacks<TOutput>
	): () => void {
		const controller = new AbortController()

		fetch(`${baseUrl}/${path}`, {
			method: 'POST',
			headers: { 'Content-Type': contentType, ...getHeaders() },
			body: JSON.stringify(input ?? {}),
			signal: controller.signal,
		}).then(async res => {
			if (!res.body) {
				callbacks.onError?.(new Error('No response body for stream'))
				return
			}
			const reader = res.body.getReader()
			const decoder = new TextDecoder()
			while (true) {
				const { done, value } = await reader.read()
				if (done) { callbacks.onComplete?.(); break }
				try {
					callbacks.onData(JSON.parse(decoder.decode(value, { stream: true })) as TOutput)
				} catch (err) {
					callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
				}
			}
		}).catch(err => {
			if (err.name !== 'AbortError') {
				callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
			}
		})

		return () => controller.abort()
	}

	return { query: rpc, mutate: rpc, subscribe }
}

export function createConnectAdapter<T extends ServiceMap>(
	services: T,
	options: ConnectAdapterOptions
): ResolvedServices<T> {
	return resolveServices(services, createConnectTransport(options))
}