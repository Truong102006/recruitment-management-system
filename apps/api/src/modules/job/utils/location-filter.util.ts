/**
 * Location filter helper for job query searching
 * Provides diacritics removal and alias expansion (e.g. "Hồ Chí Minh" -> "Ho Chi Minh City", "TP.HCM", etc.)
 */

export function removeVietnameseDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export const LOCATION_ALIASES: Record<string, string[]> = {
  'Hồ Chí Minh': [
    'hồ chí minh',
    'ho chi minh',
    'hcm',
    'hcmc',
    'tp.hcm',
    'tp hcm',
    'tp. hcm',
    'tp. hồ chí minh',
    'tp hồ chí minh',
    'tp. ho chi minh',
    'tp ho chi minh',
    'ho chi minh city',
    'saigon',
    'sài gòn',
    'sai gon',
    'thành phố hồ chí minh',
    'thanh pho ho chi minh',
  ],
  'Hà Nội': [
    'hà nội',
    'ha noi',
    'hanoi',
    'hn',
    'tp hà nội',
    'tp ha noi',
    'ha noi city',
    'hanoi city',
    'thủ đô hà nội',
  ],
  'Đà Nẵng': [
    'đà nẵng',
    'da nang',
    'danang',
    'dn',
    'tp đà nẵng',
    'tp da nang',
    'da nang city',
  ],
  'Bình Dương': ['bình dương', 'binh duong', 'binhduong'],
  'Bắc Ninh': ['bắc ninh', 'bac ninh', 'bacninh'],
  'Đồng Nai': ['đồng nai', 'dong nai', 'dongnai', 'biên hòa', 'bien hoa'],
  'Hải Phòng': ['hải phòng', 'hai phong', 'haiphong', 'hp', 'tp hải phòng', 'tp hai phong'],
  'Cần Thơ': ['cần thơ', 'can tho', 'cantho', 'tp cần thơ', 'tp can tho'],
  'Bà Rịa - Vũng Tàu': [
    'bà rịa - vũng tàu',
    'ba ria - vung tau',
    'bà rịa vũng tàu',
    'ba ria vung tau',
    'vũng tàu',
    'vung tau',
    'vungtau',
    'bà rịa',
    'ba ria',
  ],
  'Thừa Thiên Huế': [
    'thừa thiên huế',
    'thua thien hue',
    'thừa thiên - huế',
    'thua thien - hue',
    'huế',
    'hue',
  ],
  'Quảng Ninh': ['quảng ninh', 'quang ninh', 'hạ long', 'ha long'],
  'Khánh Hòa': ['khánh hòa', 'khanh hoa', 'nha trang'],
  'Lâm Đồng': ['lâm đồng', 'lam dong', 'đà lạt', 'da lat', 'dalat'],
};

/**
 * Expands raw location string (which may be comma-separated) into all searchable variants
 */
export function expandLocationVariants(rawLocation: string): string[] {
  if (!rawLocation || rawLocation.trim().length === 0) return [];

  const rawList = rawLocation
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const resultSet = new Set<string>();

  for (const item of rawList) {
    resultSet.add(item);
    const unaccented = removeVietnameseDiacritics(item);
    if (unaccented) {
      resultSet.add(unaccented);
    }

    // Check alias dictionaries
    for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
      const matchCanonical =
        item.toLowerCase() === canonical.toLowerCase() ||
        unaccented === removeVietnameseDiacritics(canonical);

      const matchAlias = aliases.some(
        (alias) =>
          alias.toLowerCase() === item.toLowerCase() ||
          removeVietnameseDiacritics(alias) === unaccented,
      );

      if (matchCanonical || matchAlias) {
        resultSet.add(canonical);
        resultSet.add(removeVietnameseDiacritics(canonical));
        for (const a of aliases) {
          resultSet.add(a);
        }
      }
    }
  }

  return Array.from(resultSet).filter((v) => v.length > 0);
}
