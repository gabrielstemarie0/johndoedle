// Questions for a specific game day (US Eastern date): "YYYY-MM-DD": ["qNN", ... seven ids].
// Days had 10 questions until Nov 6, 2026; they have 7 from then on. The original 70 questions were used once over
// Nov 2-8; from Nov 9 every day gets 7 brand-new questions written the night before, so nothing repeats. (A day that is
// missing here falls back to the old 70-question rotation, which would repeat questions, so the nightly writer must
// always add tomorrow's day.)
export default {
  "2026-11-06": ["q23", "q63", "q55", "q13", "q68", "q60", "q52"],
  "2026-11-07": ["q67", "q21", "q04", "q62", "q58", "q14", "q24"],
  "2026-11-08": ["q61", "q27", "q46", "q40", "q19", "q64", "q66"],
  "2026-11-09": ["q71", "q72", "q73", "q74", "q75", "q76", "q77"],
  "2026-11-10": ["q78", "q79", "q80", "q81", "q82", "q83", "q84"],
  "2026-11-11": ["q85", "q86", "q87", "q88", "q89", "q90", "q91"],
  "2026-11-12": ["q92", "q93", "q94", "q95", "q96", "q97", "q98"],
};
