/**
 * Deterministically returns a preset color based on a category's name.
 * Ensures consistent colors for categories without storing color codes in the database.
 *
 * @param categoryName Name of the category
 * @returns Hex color string
 */
export function getCategoryColor(categoryName: string | undefined | null): string {
  if (!categoryName) return '#64748b'; // Slate gray fallback

  const PRESET_COLORS = [
    '#ef4444', // Red
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f59e0b', // Amber/Orange
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ];

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % PRESET_COLORS.length;
  return PRESET_COLORS[index];
}
