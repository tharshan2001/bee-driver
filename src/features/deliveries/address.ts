/**
 * Splits the server's one-line address into a street line and a town line, dropping only exact
 * repeats (the district often repeats the city) and the country. Nothing else is removed.
 */
export function addressLines(address: string): { street: string; town: string } {
  const seen = new Set<string>();
  const parts = address.split(',').map((p) => p.trim()).filter((p) => {
    const key = p.toLowerCase();
    if (!p || key === 'sri lanka' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (parts.length < 2) return { street: parts[0] ?? address, town: '' };

  const postcodeAt = parts.findIndex((p) => /^\d{5}$/.test(p));
  const postcode = postcodeAt >= 0 ? parts.splice(postcodeAt, 1)[0] : '';
  const town = parts.length > 1 ? parts.pop()! : '';
  return { street: parts.join(', '), town: [town, postcode].filter(Boolean).join(' ') };
}

/** 0772781324 → 077 278 1324; anything else is shown as stored. */
export function formatPhone(phone: string): string {
  return /^0\d{9}$/.test(phone) ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : phone;
}
