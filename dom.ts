import { css, StyleObject } from './css.ts'

type Child = Node | string | number | null | undefined | false

export interface ElementProps {
	class?: string
	styles?: StyleObject
	id?: string
	role?: string
	title?: string
	tabIndex?: number
	key?: string | number
	'aria-label'?: string
	'aria-hidden'?: string
	'aria-expanded'?: string
	'aria-live'?: string
	onClick?: (e: MouseEvent) => void
	onDblclick?: (e: MouseEvent) => void
	onMouseenter?: (e: MouseEvent) => void
	onMouseleave?: (e: MouseEvent) => void
	onFocus?: (e: FocusEvent) => void
	onBlur?: (e: FocusEvent) => void
	onKeydown?: (e: KeyboardEvent) => void
	onKeyup?: (e: KeyboardEvent) => void
	onInput?: (e: InputEvent) => void
	onChange?: (e: Event) => void
	onSubmit?: (e: SubmitEvent) => void
}

export interface InputProps extends ElementProps {
	type?: string
	name?: string
	value?: string
	placeholder?: string
	disabled?: boolean
	required?: boolean
	readonly?: boolean
	checked?: boolean
	min?: string
	max?: string
	step?: string
	autocomplete?: string
	autofocus?: boolean
}

export interface ButtonProps extends ElementProps {
	type?: 'button' | 'submit' | 'reset'
	disabled?: boolean
}

export interface AnchorProps extends ElementProps {
	href?: string
	target?: string
	rel?: string
}

export interface ImgProps extends ElementProps {
	src?: string
	alt?: string
	loading?: 'lazy' | 'eager'
	width?: number
	height?: number
}

export interface FormProps extends ElementProps {
	action?: string
	method?: string
	enctype?: string
}

export interface SelectProps extends ElementProps {
	name?: string
	value?: string
	disabled?: boolean
	required?: boolean
	multiple?: boolean
}

export interface OptionProps extends ElementProps {
	value?: string
	selected?: boolean
	disabled?: boolean
}

export interface TextareaProps extends ElementProps {
	name?: string
	value?: string
	placeholder?: string
	disabled?: boolean
	required?: boolean
	readonly?: boolean
	rows?: number
	cols?: number
}

export interface LabelProps extends ElementProps {
	for?: string
}

export interface ThProps extends ElementProps {
	scope?: string
	colSpan?: number
	rowSpan?: number
}

export interface TdProps extends ElementProps {
	colSpan?: number
	rowSpan?: number
}

const eventMap: Record<string, string> = {
	onClick: 'click',
	onDblclick: 'dblclick',
	onMouseenter: 'mouseenter',
	onMouseleave: 'mouseleave',
	onFocus: 'focus',
	onBlur: 'blur',
	onKeydown: 'keydown',
	onKeyup: 'keyup',
	onInput: 'input',
	onChange: 'change',
	onSubmit: 'submit',
}

const booleanAttrs = new Set([
	'disabled', 'required', 'readonly', 'checked',
	'autofocus', 'multiple', 'selected',
])

const skipAttrs = new Set([
	'class', 'styles', 'key',
	...Object.keys(eventMap),
])

function applyProps(el: HTMLElement, props: ElementProps): void {
	const classes: string[] = []
	if (props.class) classes.push(props.class)
	if (props.styles) classes.push(css(props.styles))
	if (classes.length) el.className = classes.join(' ')

	for (const [key, value] of Object.entries(props)) {
		if (value == null || skipAttrs.has(key)) continue

		if (key in eventMap) {
			el.addEventListener(eventMap[key], value as EventListener)
			continue
		}

		if (booleanAttrs.has(key)) {
			if (value) el.setAttribute(key, '')
			continue
		}

		const attrName = key === 'tabIndex' ? 'tabindex'
			: key === 'colSpan' ? 'colspan'
				: key === 'rowSpan' ? 'rowspan'
					: key

		el.setAttribute(attrName, String(value))
	}
}

function normaliseChildren(children: Child[]): (Node | string)[] {
	return (children.flat(Infinity as 1) as Child[])
		.filter(c => c != null && c !== false)
		.map(c => c instanceof Node ? c : String(c)) as (Node | string)[]
}

function el<P extends ElementProps>(
	tag: string,
	props: P | null | undefined,
	...children: Child[]
): HTMLElement {
	const element = document.createElement(tag)
	if (props) applyProps(element, props)
	normaliseChildren(children).forEach(child => element.append(child))
	return element
}

// Layout
export const div = (p?: ElementProps | null, ...c: Child[]) => el('div', p, ...c)
export const section = (p?: ElementProps | null, ...c: Child[]) => el('section', p, ...c)
export const article = (p?: ElementProps | null, ...c: Child[]) => el('article', p, ...c)
export const aside = (p?: ElementProps | null, ...c: Child[]) => el('aside', p, ...c)
export const header = (p?: ElementProps | null, ...c: Child[]) => el('header', p, ...c)
export const footer = (p?: ElementProps | null, ...c: Child[]) => el('footer', p, ...c)
export const main = (p?: ElementProps | null, ...c: Child[]) => el('main', p, ...c)
export const nav = (p?: ElementProps | null, ...c: Child[]) => el('nav', p, ...c)

// Text
export const span = (p?: ElementProps | null, ...c: Child[]) => el('span', p, ...c)
export const p = (p?: ElementProps | null, ...c: Child[]) => el('p', p, ...c)
export const h1 = (p?: ElementProps | null, ...c: Child[]) => el('h1', p, ...c)
export const h2 = (p?: ElementProps | null, ...c: Child[]) => el('h2', p, ...c)
export const h3 = (p?: ElementProps | null, ...c: Child[]) => el('h3', p, ...c)
export const h4 = (p?: ElementProps | null, ...c: Child[]) => el('h4', p, ...c)
export const h5 = (p?: ElementProps | null, ...c: Child[]) => el('h5', p, ...c)
export const h6 = (p?: ElementProps | null, ...c: Child[]) => el('h6', p, ...c)
export const strong = (p?: ElementProps | null, ...c: Child[]) => el('strong', p, ...c)
export const em = (p?: ElementProps | null, ...c: Child[]) => el('em', p, ...c)
export const small = (p?: ElementProps | null, ...c: Child[]) => el('small', p, ...c)
export const code = (p?: ElementProps | null, ...c: Child[]) => el('code', p, ...c)
export const pre = (p?: ElementProps | null, ...c: Child[]) => el('pre', p, ...c)

// Lists
export const ul = (p?: ElementProps | null, ...c: Child[]) => el('ul', p, ...c)
export const ol = (p?: ElementProps | null, ...c: Child[]) => el('ol', p, ...c)
export const li = (p?: ElementProps | null, ...c: Child[]) => el('li', p, ...c)

// Form
export const form = (p?: FormProps | null, ...c: Child[]) => el('form', p, ...c)
export const label = (p?: LabelProps | null, ...c: Child[]) => el('label', p, ...c)
export const input = (p?: InputProps | null) => el('input', p)
export const button = (p?: ButtonProps | null, ...c: Child[]) => el('button', p, ...c)
export const select = (p?: SelectProps | null, ...c: Child[]) => el('select', p, ...c)
export const option = (p?: OptionProps | null, ...c: Child[]) => el('option', p, ...c)
export const textarea = (p?: TextareaProps | null) => el('textarea', p)
export const fieldset = (p?: ElementProps | null, ...c: Child[]) => el('fieldset', p, ...c)

// Media / navigation
export const img = (p?: ImgProps | null) => el('img', p)
export const a = (p?: AnchorProps | null, ...c: Child[]) => el('a', p, ...c)
export const hr = (p?: ElementProps | null) => el('hr', p)
export const br = () => el('br', null)

// Table
export const table = (p?: ElementProps | null, ...c: Child[]) => el('table', p, ...c)
export const thead = (p?: ElementProps | null, ...c: Child[]) => el('thead', p, ...c)
export const tbody = (p?: ElementProps | null, ...c: Child[]) => el('tbody', p, ...c)
export const tfoot = (p?: ElementProps | null, ...c: Child[]) => el('tfoot', p, ...c)
export const tr = (p?: ElementProps | null, ...c: Child[]) => el('tr', p, ...c)
export const th = (p?: ThProps | null, ...c: Child[]) => el('th', p, ...c)
export const td = (p?: TdProps | null, ...c: Child[]) => el('td', p, ...c)

export type ComponentFn<P extends Record<string, unknown> = Record<string, unknown>> =
	(props: P) => HTMLElement

export function h<P extends Record<string, unknown>>(
	component: ComponentFn<P>,
	props: P
): HTMLElement {
	return component(props)
}