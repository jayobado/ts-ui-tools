import { effect } from './signals.ts'

type CleanupFn = () => void

interface ComponentContext {
	onMount: (fn: () => void | Promise<void>) => void
	onUnmount: (fn: CleanupFn) => void
}

export interface ComponentDefinition<
	P extends Record<string, unknown> = Record<string, unknown>
> {
	(props: P): HTMLElement
	_isComponent: true
}

const mountCallbacks = new WeakMap<HTMLElement, Array<() => void | Promise<void>>>()
const unmountCallbacks = new WeakMap<HTMLElement, CleanupFn[]>()
const effectCleanups = new WeakMap<HTMLElement, CleanupFn[]>()

export function runMount(el: HTMLElement): void {
	mountCallbacks.get(el)?.forEach(fn => fn())
}

export function runUnmount(el: HTMLElement): void {
	unmountCallbacks.get(el)?.forEach(fn => fn())
	effectCleanups.get(el)?.forEach(fn => fn())
}

export function defineComponent<
	P extends Record<string, unknown> = Record<string, unknown>
>(
	setup: (props: P, ctx: ComponentContext) => HTMLElement
): ComponentDefinition<P> {
	const factory = (props: P): HTMLElement => {
		const mounts: Array<() => void | Promise<void>> = []
		const unmounts: CleanupFn[] = []
		const cleanups: CleanupFn[] = []

		const ctx: ComponentContext = {
			onMount: fn => mounts.push(fn),
			onUnmount: fn => unmounts.push(fn),
		}

		const rootEl = setup(props, ctx)

		mountCallbacks.set(rootEl, mounts)
		unmountCallbacks.set(rootEl, unmounts)
		effectCleanups.set(rootEl, cleanups)

		return rootEl
	}

	;(factory as ComponentDefinition<P>)._isComponent = true
	return factory as ComponentDefinition<P>
}

export function watchEffect(
	componentEl: HTMLElement,
	fn: () => void
): void {
	const dispose = effect(fn)
	const existing = effectCleanups.get(componentEl) ?? []
	existing.push(dispose)
	effectCleanups.set(componentEl, existing)
}