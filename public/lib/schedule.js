// Questions for a specific game day (US Eastern date): "YYYY-MM-DD": ["qNN", ... seven ids].
// Days had 10 questions until Nov 6, 2026; they have 7 from then on. The original 70 questions were used once over
// Nov 2-8; from Nov 9 every day gets 7 brand-new questions written the night before, so nothing repeats. (A day that is
// missing here falls back to the old 70-question rotation, which would repeat questions, so the nightly writer must
// always add tomorrow's day.)
export default {
  "2026-11-06": ["q23", "q63", "q55", "q13", "q68", "q60", "q52"],
  "2026-11-07": ["q67", "q21", "q04", "q62", "q58", "q14", "q24"],
  "2026-11-08": ["q61", "q27", "q46", "q40", "q19", "q64", "q66"],
};
