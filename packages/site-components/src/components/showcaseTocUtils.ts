export function sectionSlug(title: string): string {
  return `section-${title.replace(/\s+/g, "-").toLowerCase()}`;
}

export function sectionId(title: string): string {
  return sectionSlug(title);
}
