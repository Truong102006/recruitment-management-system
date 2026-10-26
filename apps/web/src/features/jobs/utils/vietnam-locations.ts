/**
 * Utility for Vietnam Provinces / Cities location filtering
 * Supports 63 provinces with diacritics, accent-insensitive search,
 * and comprehensive alias mapping (e.g. "Hồ Chí Minh" matches "Ho Chi Minh City", "TP.HCM", etc.)
 */

export const VIETNAM_PROVINCES: string[] = [
  // Major tech hubs & prominent recruitment locations first
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Bình Dương',
  'Bắc Ninh',
  'Đồng Nai',
  'Hải Phòng',
  'Cần Thơ',
  'Hưng Yên',
  'Bà Rịa - Vũng Tàu',
  'Quảng Ninh',
  'Thừa Thiên Huế',
  'Khánh Hòa',
  'Lâm Đồng',
  // Alphabetical list of other provinces
  'An Giang',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bến Tre',
  'Bình Định',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

/**
 * Remove Vietnamese accents/diacritics and normalize to lowercase
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

/**
 * Alias mapping for major provinces/cities
 */
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
 * Returns an expanded list of search terms (variants) for a given set of location names.
 * Covers diacritics, non-diacritics, and aliases.
 */
export function expandLocationSearchTerms(locations: string | string[]): string[] {
  const locList = Array.isArray(locations)
    ? locations
    : locations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const termSet = new Set<string>();

  for (const loc of locList) {
    const raw = loc.trim();
    if (!raw) continue;

    termSet.add(raw.toLowerCase());
    const unaccented = removeVietnameseDiacritics(raw);
    if (unaccented) termSet.add(unaccented);

    // Check direct match in aliases
    for (const [canonicalName, aliases] of Object.entries(LOCATION_ALIASES)) {
      const matchCanonical =
        raw.toLowerCase() === canonicalName.toLowerCase() ||
        unaccented === removeVietnameseDiacritics(canonicalName);

      const matchAlias = aliases.some(
        (alias) =>
          alias.toLowerCase() === raw.toLowerCase() ||
          removeVietnameseDiacritics(alias) === unaccented,
      );

      if (matchCanonical || matchAlias) {
        termSet.add(canonicalName.toLowerCase());
        termSet.add(removeVietnameseDiacritics(canonicalName));
        for (const alias of aliases) {
          termSet.add(alias.toLowerCase());
          termSet.add(removeVietnameseDiacritics(alias));
        }
      }
    }
  }

  return Array.from(termSet);
}

/**
 * Match a job's location string against selected provinces (supports accented, unaccented, and aliases)
 */
export function isLocationMatch(jobLocation: string, selectedProvinces: string[]): boolean {
  if (!selectedProvinces || selectedProvinces.length === 0) return true;
  if (!jobLocation) return false;

  const normalizedJobLoc = removeVietnameseDiacritics(jobLocation);
  const variants = expandLocationSearchTerms(selectedProvinces);

  return variants.some((term) => {
    const normTerm = removeVietnameseDiacritics(term);
    return normalizedJobLoc.includes(normTerm);
  });
}
