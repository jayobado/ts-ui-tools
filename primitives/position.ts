export type Placement = 'top' | 'bottom' | 'left' | 'right'

export interface PositionOptions {
	placement?: Placement
	offset?: number
}

export function computePosition(
	trigger: HTMLElement,
	floating: HTMLElement,
	options?: PositionOptions,
): { top: number; left: number; placement: Placement } {
	const { placement: preferred = 'bottom', offset = 8 } = options ?? {}

	const triggerRect = trigger.getBoundingClientRect()
	const floatingRect = floating.getBoundingClientRect()
	const viewport = { width: globalThis.innerWidth, height: globalThis.innerHeight }

	const positions: Record<Placement, { top: number; left: number }> = {
		top: {
			top: triggerRect.top - floatingRect.height - offset,
			left: triggerRect.left + (triggerRect.width - floatingRect.width) / 2,
		},
		bottom: {
			top: triggerRect.bottom + offset,
			left: triggerRect.left + (triggerRect.width - floatingRect.width) / 2,
		},
		left: {
			top: triggerRect.top + (triggerRect.height - floatingRect.height) / 2,
			left: triggerRect.left - floatingRect.width - offset,
		},
		right: {
			top: triggerRect.top + (triggerRect.height - floatingRect.height) / 2,
			left: triggerRect.right + offset,
		},
	}

	const fallbackOrder: Record<Placement, Placement[]> = {
		top: ['top', 'bottom', 'left', 'right'],
		bottom: ['bottom', 'top', 'left', 'right'],
		left: ['left', 'right', 'top', 'bottom'],
		right: ['right', 'left', 'top', 'bottom'],
	}

	function fits(p: Placement): boolean {
		const pos = positions[p]
		return pos.top >= 0
			&& pos.left >= 0
			&& pos.top + floatingRect.height <= viewport.height
			&& pos.left + floatingRect.width <= viewport.width
	}

	const actual = fallbackOrder[preferred].find(fits) ?? preferred
	const pos = positions[actual]

	const top = Math.max(0, Math.min(pos.top, viewport.height - floatingRect.height))
	const left = Math.max(0, Math.min(pos.left, viewport.width - floatingRect.width))

	return { top, left, placement: actual }
}