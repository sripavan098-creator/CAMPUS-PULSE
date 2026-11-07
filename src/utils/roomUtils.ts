/**
 * Room codes are free text in the source workbooks, so the same physical room is
 * written several ways ("VBFF 1", "VBFF-1", "VBFF1"; "501-A" vs "501A";
 * "NB-107" vs "NB107"). Stored as-is, each spelling becomes its own Room row and
 * the availability engine then reports one twin free while the other is busy.
 * Canonicalising every label to a single id collapses them into one room.
 *
 * Rules, applied in order:
 *   1. drop a bracketed qualifier ("LAB-2(LIB)-2 FLOOR" -> "LAB-2"), since the
 *      qualifier is a note about the room, not part of its code
 *   2. drop spaces and hyphens (so "VBFF 1" and "VBFF-1" agree)
 *   3. reinsert a single hyphen between a leading letter prefix and its number
 *      ("VBFF1" -> "VBFF-1"), which keeps blocks like NB/VBFFTF readable
 *   4. drop leading zeros inside a number ("VBFF-01" -> "VBFF-1", "VBT-08" ->
 *      "VBT-8"), since the padding is inconsistent between workbooks
 *
 * Numeric-leading codes ("501A") keep their suffix as-is, matching the N-block
 * catalogue ids ("N-514A").
 */
export function canonicalRoomId(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim().toUpperCase();
  if (!s) return null;
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  s = s.replace(/[\s-]+/g, '');
  s = s.replace(/^([A-Z]+)(\d.*)$/, '$1-$2');
  s = s.replace(/\d+/g, (n) => String(Number(n)));
  return s;
}
