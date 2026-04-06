import { createScope, runInScope } from './scope.ts'
import type { Scope } from './scope.ts'

type CleanupFn = () => void

export interface ComponentContext extends Scope {
	onMount: (fn: () => void | Promise<void>) => void
	onUnmount: (fn: CleanupFn) => void
}

export interface ComponentDefinition<P extends Record<string, unknown> = Record<string, unknown>> {
	(props: P): HTMLElement
	_isComponent: true
}

// ─── Lifecycle registries ─────────────────────────────────────────────────
// WeakMap so entries are garbage collected when the element is removed

const mountCallbacks = new WeakMap<HTMLElement, Array<() => void | Promise<void>>>()
const scopeMap = new WeakMap<HTMLElement, Scope>()

// ─── Lifecycle runners — called by the router ─────────────────────────────

export function runMount(el: HTMLElement): void {
	mountCallbacks.get(el)?.forEach(fn => fn())
}

export function runUnmount(el: HTMLElement): void {
	scopeMap.get(el)?.dispose()
}

// ─── defineComponent ──────────────────────────────────────────────────────

export function defineComponent<P extends Record<string, unknown> = Record<string, unknown>>(
	setup: (props: P, ctx: ComponentContext) => HTMLElement
): ComponentDefinition<P> {
	const factory = (props: P): HTMLElement => {
		const scope = createScope()
		const mounts: Array<() => void | Promise<void>> = []

		const ctx: ComponentContext = {
			effect: scope.effect,
			onCleanup: scope.onCleanup,
			dispose: scope.dispose,
			onMount: fn => mounts.push(fn),
			onUnmount: fn => scope.onCleanup(fn),
		}

		const rootEl = runInScope(scope, () => setup(props, ctx))

		mountCallbacks.set(rootEl, mounts)
		scopeMap.set(rootEl, scope)

		return rootEl
	}

		; (factory as ComponentDefinition<P>)._isComponent = true
	return factory as ComponentDefinition<P>
}