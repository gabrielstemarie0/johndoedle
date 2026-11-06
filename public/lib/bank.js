// The full question bank: the original questions plus the compact extras.
// Each question gets ONE fixed ranking: answers are ordered by their starting weight (ties keep the order they are
// written in), then re-numbered 1000, 999, 998... so no two answers ever tie. Rank 1 is the John Doe, ranks 2-4 are
// Average Joes, 5-9 Neighbors, 10-19 Strangers, and anything else that is a real answer is an Alien.
import base from "./questions.js";
import more from "./questions2.js";
import daily from "./daily-questions.js";

const fix = (q) => ({
  ...q,
  answers: q.answers
    .map((a, i) => [a, i])
    .sort((x, y) => y[0][1] - x[0][1] || x[1] - y[1])
    .map(([a], i) => (a[2] ? [a[0], 1000 - i, a[2]] : [a[0], 1000 - i])),
});

export const BASE_COUNT = 70; // the original rotation; questions after these only appear on days listed in schedule.js
export default [...base, ...more, ...daily].map(fix);
