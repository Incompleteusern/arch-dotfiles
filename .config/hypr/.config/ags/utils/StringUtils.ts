export function truncate(s: string, max: number) {
    if (s.length > max) {
        return s.slice(0, max-3) + "..."
    }

    return s;
}