type Effect = () => void

let currentEffect: Effect | null = null
let batching = false
const pendingEffects = new Set<Effect>()

export function signal<T>(initialValue: T) {
	let value = initialValue
	const subscribers = new Set<Effect>()

	const get = (): T => {
		if (currentEffect) subscribers.add(currentEffect)
		return value
	}

	const set = (newValue: T): void => {
		if (Object.is(value, newValue)) return
		value = newValue
		if (batching) {
			subscribers.forEach(e => pendingEffects.add(e))
		} else {
			subscribers.forEach(e => e())
		}
	}

	const update = (fn: (current: T) => T): void => set(fn(value))

	return { get, set, update }
}

export type Signal<T> = ReturnType<typeof signal<T>>

export function effect(fn: Effect): () => void {
	const execute = () => {
		currentEffect = execute
		try {
			fn()
		} finally {
			currentEffect = null
		}
	}
	execute()
	return () => { currentEffect = null }
}

export function computed<T>(fn: () => T): { get: () => T } {
	const s = signal<T>(undefined as unknown as T)
	effect(() => s.set(fn()))
	return { get: s.get }
}

export function batch(fn: () => void): void {
	batching = true
	try {
		fn()
	} finally {
		batching = false
		pendingEffects.forEach(e => e())
		pendingEffects.clear()
	}
}