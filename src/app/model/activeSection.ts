import type { SiteSection } from '../../shared/routing/index.ts';

export function navigationSection(section: SiteSection): SiteSection {
  return section === 'availability' ? 'price-list' : section;
}

export function activeSectionAt(
  positions: { section: SiteSection; top: number }[],
  boundary: number,
  atPageEnd = false,
): SiteSection {
  if (atPageEnd) return 'contacts';
  let active: SiteSection = 'home';
  let nearest = -Infinity;
  for (const { section, top } of positions) {
    if (top <= boundary && top >= nearest) {
      nearest = top;
      active = navigationSection(section);
    }
  }
  return active;
}
