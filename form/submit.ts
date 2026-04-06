import type { StandardSchemaV1 } from '@standard-schema/spec'

import { signal } from '../signals.ts'
import { resolveScope } from '../scope.ts'
import type { Scope } from '../scope.ts'
import type { ErrorsFormatter, StandardErrors } from './errors.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmitSignals<TErrors> {
	submitting?: { get: () => boolean; set: (v: boolean) => void }
	submitted?: { get: () => boolean; set: (v: boolean) => void }
	errors?: { get: () => TErrors | undefined; set: (v: TErrors | undefined) => void }
}

export interface SubmitOptions<TErrors> extends SubmitSignals<TErrors> {
	form?: () => HTMLElement | undefined
	input?: () => unknown
	schema?: () => StandardSchemaV1
	formatErrors?: ErrorsFormatter<TErrors>
	onErrors?: (errors: TErrors) => void | Promise<void>
}

export interface SubmitReturn<TArgs extends unknown[], TResult, TErrors> {
	submit: (...args: TArgs) => Promise<TResult | undefined>
	submitting: { get: () => boolean }
	submitted: { get: () => boolean }
	errors: { get: () => TErrors | undefined }
	dispose: () => void
}

type SubmitFn<TArgs extends unknown[], TResult> =
	(...args: TArgs) => TResult | PromiseLike<TResult>

// ─── Overloads ────────────────────────────────────────────────────────────────

/** With schema — callback receives validated output as first arg. */
export function useSubmit<TSchema extends StandardSchemaV1, TArgs extends unknown[], TResult, TErrors = StandardErrors> (
	options: SubmitOptions<TErrors> & { schema: () => TSchema },
	onSubmit: SubmitFn<[StandardSchemaV1.InferOutput<TSchema>, ...TArgs], TResult>,
	scope ?: Scope,
): SubmitReturn<TArgs, TResult, TErrors>

/** Without schema — callback receives raw input (if provided) or just forwarded args. */
export function useSubmit<TArgs extends unknown[], TResult, TErrors = StandardErrors> (
	options ?: SubmitOptions<TErrors>,
	onSubmit ?: SubmitFn<TArgs, TResult>,
	scope ?: Scope,
): SubmitReturn<TArgs, TResult, TErrors>

// ─── Implementation ──────────────────────────────────────────────────────────

export function useSubmit(
	options?: SubmitOptions<unknown>,
	onSubmit?: SubmitFn<unknown[], unknown>,
	scope?: Scope,
): SubmitReturn<unknown[], unknown, unknown> {
	const s = resolveScope(scope)
	const opts = options ?? {}
	const hasInput = opts.input !== undefined

	const submitting = opts.submitting ?? signal(false)
	const submitted = opts.submitted ?? signal(false)
	const errors = opts.errors ?? signal<unknown>(undefined)
	const formatErrors = opts.formatErrors ?? ((issues: StandardErrors) => issues)

	async function submit(...args: unknown[]) {
		if (submitting.get()) return

		submitted.set(false)
		errors.set(undefined)

		const formEl = opts.form?.()
		if (formEl && 'checkValidity' in formEl) {
			const htmlForm = formEl as HTMLFormElement
			if (!htmlForm.checkValidity()) {
				htmlForm.reportValidity()
				return
			}
		}

		submitting.set(true)
		try {
			const input = opts.input?.()
			const schema = opts.schema?.()

			if (schema) {
				const result = await schema['~standard'].validate(input)
				if (result.issues) {
					errors.set(formatErrors(result.issues))
					await opts.onErrors?.(errors.get() as unknown)
					return
				}
				const returnValue = await onSubmit?.(result.value, ...args)
				if (errors.get() !== undefined) {
					await opts.onErrors?.(errors.get() as unknown)
				} else {
					submitted.set(true)
				}
				return returnValue
			}

			const returnValue = hasInput
				? await onSubmit?.(input, ...args)
				: await onSubmit?.(...args)

			if (errors.get() !== undefined) {
				await opts.onErrors?.(errors.get() as unknown)
			} else {
				submitted.set(true)
			}
			return returnValue
		} finally {
			submitting.set(false)
		}
	}

	const dispose = () => {
		submitting.set(false)
		submitted.set(false)
		errors.set(undefined)
	}

	s?.onCleanup(dispose)

	return { submit, submitting, submitted, errors, dispose }
}