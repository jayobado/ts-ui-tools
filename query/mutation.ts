import { signal } from '../signals.ts'
import { resolveScope } from '../scope.ts'
import type { Scope } from '../scope.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MutationOptions<TResult> {
	retry?: number
	retryDelay?: number
	onSuccess?: (result: TResult) => void | Promise<void>
	onError?: (err: Error) => void | Promise<void>
	onSettled?: () => void | Promise<void>
}

export interface MutationReturn<TArgs extends unknown[], TResult> {
	mutate: (...args: TArgs) => Promise<TResult | undefined>
	data: { get: () => TResult | undefined }
	error: { get: () => Error | undefined }
	loading: { get: () => boolean }
	reset: () => void
	dispose: () => void
}

// ─── Implementation ──────────────────────────────────────────────────────────

export function useMutation<TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	options?: MutationOptions<TResult>,
	scope?: Scope,
): MutationReturn<TArgs, TResult> {
	const s = resolveScope(scope)

	const data = signal<TResult | undefined>(undefined)
	const error = signal<Error | undefined>(undefined)
	const loading = signal(false)

	const maxRetries = options?.retry ?? 0
	const retryDelay = options?.retryDelay ?? 1000

	async function mutate(...args: TArgs): Promise<TResult | undefined> {
		if (loading.get()) return

		error.set(undefined)
		loading.set(true)

		let attempt = 0
		try {
			while (true) {
				try {
					const result = await fn(...args)
					data.set(result)
					error.set(undefined)
					await options?.onSuccess?.(result)
					return result
				} catch (err) {
					const e = err instanceof Error ? err : new Error(String(err))
					if (attempt < maxRetries) {
						attempt++
						await new Promise(r => setTimeout(r, retryDelay))
						continue
					}
					error.set(e)
					await options?.onError?.(e)
					return undefined
				}
			}
		} finally {
			loading.set(false)
			await options?.onSettled?.()
		}
	}

	function reset(): void {
		data.set(undefined)
		error.set(undefined)
		loading.set(false)
	}

	function dispose(): void {
		reset()
	}

	s?.onCleanup(dispose)

	return { mutate, data, error, loading, reset, dispose }
}