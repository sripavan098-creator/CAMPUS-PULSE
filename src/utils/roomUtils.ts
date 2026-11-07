/**
 * Room codes are free text in the source workbooks, so the same physical room is
 * written several ways ("VBFF 1", "VBFF-1", "VBFF1", "VBFF-01"; "NB 107" vs
 * "NB107"; "501-A" vs "501A"). Stored as-is, each spelling becomes its own Room
 * row and the availability engine then reports one twin free while the other is
 * busy. These helpers let the seed collapse the spellings into one room.
 *
 * Two jobs, deliberately separate:
 *   - roomMatchKey() is the aggressive key used only to group aliases; it throws
 *     away everything that varies between spellings.
 *   - canonicalRoomId() is the readable id kept as the Room.id (and therefore the
 *     label shown in the UI). It only tidies whitespace and a bare "PREFIX NUM"
 *     code, so free-text labels such as "SRAVANTHI SEMINAR HALL" survive intact.
 */

/**
 * Aggressive key for grouping spellings of the same room. Not for display.
 * Rules, applied in order:
 *   1. drop a bracketed qualifier, round or square ("LAB-2(LIB)-2 FLOOR" and
 *      "SRAVANTHI SEMINAR HALL [H BLOCK]"), since the qualifier is a note about
 *      the room, not part of its code
 *   2. drop spaces and hyphens (so "VBFF 1" and "VBFF-1" agree)
 *   3. reinsert a single hyphen between a leading letter prefix and its number
 *      ("VBFF1" -> "VBFF-1"), which keeps blocks like NB/VBFFTF readable
 *   4. drop leading zeros inside a number ("VBFF-01" -> "VBFF-1", "VBT-08" ->
 *      "VBT-8"), since the padding is inconsistent between workbooks
 *
 * Numeric-leading codes ("501A") keep their suffix as-is, matching the N-block
 * catalogue ids ("N-514A").
 */
export function roomMatchKey(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim().toUpperCase();
  if (!s) return null;
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  if (!s) return null;
  // A "FLOOR" note separated from the code by whitespace is a location note, not
  // part of the code ("LAB-2 -2 FLOOR" -> "LAB-2"). A form glued to the code
  // ("LAB-12FLOOR") is left alone, since it may be a room number.
  s = s.replace(/\s+[-\u2013]?\s*\d*\s*FLOOR\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  s = s.replace(/[\s-]+/g, '');
  s = s.replace(/^([A-Z]+)(\d.*)$/, '$1-$2');
  s = s.replace(/\d+/g, (n) => String(Number(n)));
  return s;
}

/** Readable canonical id used as the Room.id and shown in the UI. */
export function canonicalRoomId(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim().toUpperCase().replace(/\s+/g, ' ');
  if (!s) return null;
  // A bare "PREFIX NUM" code reads better as "PREFIX-NUM"; anything with extra
  // words (free text) is left exactly as typed.
  s = s.replace(/^([A-Z]+) (\d[A-Z0-9]*)$/, '$1-$2');
  return s;
}
