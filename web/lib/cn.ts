/**
 * Class-name joiner. Filters falsy values without pulling in clsx +
 * tailwind-merge for a project this size.
 */
export function cn(
	...values: Array<string | false | null | undefined>
): string {
	return values.filter(Boolean).join(" ");
}
