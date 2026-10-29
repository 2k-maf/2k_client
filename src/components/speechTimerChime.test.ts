import { speechChimeForSecond, speechChimeSpan, speechChimeTones, takeSpeechChime } from './speechTimerChime';

test('на 10 секундах два короткі піки, на нулі один прохід як таймер телефону', () => {
  expect(speechChimeForSecond(10)).toBe('warning');
  expect(speechChimeForSecond(0)).toBe('expired');

  const warning = speechChimeTones('warning');
  const expired = speechChimeTones('expired');

  expect(warning).toHaveLength(2);
  expect(warning.every((tone) => tone.duration <= 100 && tone.frequency > 800)).toBe(true);
  expect(expired.every((tone) => tone.type === 'sine' && tone.frequency > 800)).toBe(true);
  expect(expired.at(-1)!.duration).toBeGreaterThan(expired[0].duration);
  const span = speechChimeSpan('expired');
  expect(span).toBeGreaterThan(speechChimeSpan('warning'));
  expect(span).toBeLessThan(2500);
});

test('кожен сигнал грає один раз за відлік', () => {
  let played = takeSpeechChime(10, null);
  expect(played.chime).toBe('warning');

  played = takeSpeechChime(10, played.played);
  expect(played.chime).toBeNull();

  played = takeSpeechChime(0, played.played);
  expect(played.chime).toBe('expired');

  played = takeSpeechChime(0, played.played);
  expect(played.chime).toBeNull();

  played = takeSpeechChime(10, null);
  expect(played.chime).toBe('warning');
});
