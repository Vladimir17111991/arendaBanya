/** Stable category colours, including newly created categories. */
export function categoryColor(id: number): string {
  return `hsl(${(245 + id * 137.508) % 360} 48% 38%)`;
}
export function categoryTint(id: number): string {
  return `hsl(${(245 + id * 137.508) % 360} 65% 91%)`;
}
export function categoryBackground(ids: number[]): string | undefined {
  const unique = [...new Set(ids)];
  if (!unique.length) return undefined;
  if (unique.length === 1) return categoryTint(unique[0]!);
  return `linear-gradient(135deg, ${unique.map((id, index) => `${categoryTint(id)} ${(index * 100) / unique.length}% ${((index + 1) * 100) / unique.length}%`).join(', ')})`;
}
