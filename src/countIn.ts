export type CountInBars = 0 | 1 | 2;
export function countInTiming(bpm: number, bars: CountInBars, firstClickTime: number) {
  const beats = bars * 4, beatSeconds = 60 / bpm;
  return {
    startTime: firstClickTime + beats * beatSeconds,
    clicks: Array.from({length: beats}, (_, index) => ({time: firstClickTime + index * beatSeconds, beat: index + 1, accented: index % 4 === 0})),
  };
}
