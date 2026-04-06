import type { StandardSchemaV1 } from '@standard-schema/spec'

export type StandardErrors = readonly StandardSchemaV1.Issue[]

export type ErrorsFormatter<T> = (issues: StandardErrors) => T

export interface FlatErrors {
	root?: string[]
	nested?: Partial<Record<string, string[]>>
}

export function flatten(issues: StandardErrors): FlatErrors {
	const errors: FlatErrors = {}
	for (const issue of issues) {
		const dotPath = issue.path
			?.map(p => typeof p === 'object' ? p.key : p)
			.join('.')
		if (dotPath) {
			errors.nested ??= {}
			errors.nested[dotPath] ??= []
			errors.nested[dotPath]!.push(issue.message)
		} else {
			errors.root ??= []
			errors.root.push(issue.message)
		}
	}
	return errors
}