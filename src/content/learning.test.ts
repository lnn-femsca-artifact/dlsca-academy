import { describe, expect, it } from 'vitest';
import { journey } from './journey';
import { chapters } from './chapters';
import { lessonDetails } from './lessonDetails';
import { deepProbes } from './deepProbes';

describe('beginner learning completeness and integrity', () => {
  it('teaches through a full ordered causal chain with explanations', () => {
    expect(journey.length).toBeGreaterThanOrEqual(16);
    expect(new Set(journey.map(x=>x.id)).size).toBe(journey.length);
    for (const stage of journey) {
      expect(stage.situation.length).toBeGreaterThanOrEqual(3);
      expect(stage.why.length).toBeGreaterThanOrEqual(3);
      expect(stage.example.length).toBeGreaterThan(15);
      expect(stage.counterexample.length).toBeGreaterThan(15);
      expect(stage.known.length).toBeGreaterThan(0);
      expect(stage.unknown.length).toBeGreaterThan(0);
      expect(stage.checkpoint.options).toHaveLength(3);
      expect(stage.checkpoint.why).toHaveLength(3);
      expect(stage.checkpoint.answer).toBeGreaterThanOrEqual(0);
      expect(stage.checkpoint.answer).toBeLessThan(3);
      stage.checkpoint.why.forEach(explain => expect(explain.length).toBeGreaterThan(8));
    }
  });
  it('does not leave placeholder course chapters without explanation exercises', () => {
    expect(chapters).toHaveLength(12);
    for (const chapter of chapters) {
      expect(chapter.status).toBe('available');
      const lesson=lessonDetails[chapter.number];
      expect(lesson).toBeDefined();
      expect(lesson.sections).toHaveLength(3);
      const why=deepProbes[chapter.number];
      expect(why).toHaveLength(3);
      why.forEach(p=>{expect(p.steps.length).toBeGreaterThanOrEqual(3);expect(p.question.length).toBeGreaterThan(12);expect(p.wrong.length).toBeGreaterThan(12);});
    }
  });
});
