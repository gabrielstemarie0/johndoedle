// Questions for a specific game day (US Eastern date): "YYYY-MM-DD": ["qNN", ... ten ids].
// The original 70 questions are used exactly once over the first 7 days (Nov 2-8, 2026); from Nov 9 every day gets brand-new
// questions written the night before, so nothing repeats. (A day that is missing here falls back to the old 70-question
// rotation, which would repeat questions, so the nightly writer must always add tomorrow's day.)
export default {
  "2026-11-07": ["q67", "q21", "q04", "q62", "q58", "q14", "q24", "q09", "q29", "q28"],
  "2026-11-08": ["q61", "q27", "q46", "q40", "q19", "q64", "q66", "q36", "q01", "q44"],
};
