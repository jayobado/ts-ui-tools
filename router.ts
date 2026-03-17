import { runMount, runUnmount } from './component.ts'

export interface RouteParams { [key: string]: string }
export interface QueryParams { [key: string]: string }

export interface RouteContext {
	params: RouteParams
	query: QueryParams
	path: string
}

export type GuardFn = (
	context: RouteContext
) => boolean | string | Promise<boolean | string>

export interface RouteDefinition {
	path: string
	view: (context: RouteContext) => HTMLElement
	layout?: (content: HTMLElement, context: RouteContext) => HTMLElement
	guards?: GuardFn[]
	meta?: Record<string, unknown>
}

function pathToRegex(path: string): RegExp {
	const pattern = path
		.replace(/\//g, '\\/')
		.replace(/:([^/]+)/g, '(?<$1>[^/]+)')
	return new RegExp(`^${pattern}$`)
}

function extractQuery(search: string): QueryParams {
	const params: QueryParams = {}
	new URLSearchParams(search).forEach((value, key) => { params[key] = value })
	return params
}

export interface RouterOptions {
	outlet: HTMLElement
	routes: RouteDefinition[]
	onError?: (err: unknown) => void
	fallback?: (context: RouteContext) => HTMLElement
}

export function createRouter(options: RouterOptions) {
	const { outlet, routes, onError, fallback } = options

	const compiled = routes.map(route => ({
		route,
		regex: pathToRegex(route.path),
	}))

	let currentEl: HTMLElement | null = null

	function matchRoute(pathname: string) {
		for (const { route, regex } of compiled) {
			const match = pathname.match(regex)
			if (match) return { route, params: match.groups ?? {} as RouteParams }
		}
		return null
	}

	async function runGuards(
		guards: GuardFn[],
		context: RouteContext
	): Promise<true | string> {
		for (const guard of guards) {
			const result = await guard(context)
			if (result === false) return '/login'
			if (typeof result === 'string') return result
		}
		return true
	}

	async function render(pathname: string, search = ''): Promise<void> {
		const matched = matchRoute(pathname)
		const context: RouteContext = {
			params: matched?.params ?? {},
			query: extractQuery(search),
			path: pathname,
		}

		try {
			if (matched?.route.guards?.length) {
				const guardResult = await runGuards(matched.route.guards, context)
				if (guardResult !== true) {
					navigateTo(guardResult)
					return
				}
			}

			if (currentEl) {
				runUnmount(currentEl)
				currentEl.remove()
				currentEl = null
			}

			let viewEl: HTMLElement

			if (!matched) {
				viewEl = fallback
					? fallback(context)
					: (() => {
						const el = document.createElement('div')
						el.textContent = '404 — Page not found'
						return el
					})()
			} else {
				const rawView = matched.route.view(context)
				viewEl = matched.route.layout
					? matched.route.layout(rawView, context)
					: rawView
			}

			outlet.appendChild(viewEl)
			currentEl = viewEl
			runMount(viewEl)

		} catch (err) {
			onError ? onError(err) : console.error('[router]', err)
		}
	}

	function navigateTo(url: string): void {
		history.pushState(null, '', url)
		const { pathname, search } = new URL(url, location.origin)
		render(pathname, search)
	}

	function back(): void { history.back() }
	function forward(): void { history.forward() }

	function interceptLinks(root: HTMLElement | Document = document): void {
		root.addEventListener('click', (e) => {
			const target = (e.target as Element).closest('a')
			if (!target) return
			const href = target.getAttribute('href')
			if (!href || href.startsWith('http') || href.startsWith('//')) return
			e.preventDefault()
			navigateTo(href)
		})
	}

	window.addEventListener('popstate', () => {
		render(location.pathname, location.search)
	})

	render(location.pathname, location.search)

	return { navigateTo, back, forward, interceptLinks }
}

export type Router = ReturnType<typeof createRouter>