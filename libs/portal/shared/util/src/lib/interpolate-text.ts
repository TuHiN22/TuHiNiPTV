export function interpolateText(
    text: string,
    params: Record<string, string | number> = {}
): string {
    return Object.entries(params).reduce(
        (result, [name, value]) =>
            result.split(`{{${name}}}`).join(String(value)),
        text
    );
}
