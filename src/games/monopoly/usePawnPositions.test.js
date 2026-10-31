import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPawnWalker } from './usePawnPositions.js';

const STEP_MS = 130;

const playing = (positions) => ({
  status: 'PLAYING',
  players: Object.entries(positions).map(([id, position]) => ({ id, position, left: false }))
});

describe('pawn walker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
  });

  const seed = () => {
    const walker = createPawnWalker();
    walker.sync({ status: 'WAITING', players: [{ id: 'a', position: 0, left: false }] });
    return walker;
  };

  it('steps one tile at a time instead of teleporting', () => {
    const walker = seed();
    walker.sync(playing({ a: 4 }));
    expect(walker.getSnapshot().a).toBe(0);

    for (const expected of [1, 2, 3, 4]) {
      vi.advanceTimersByTime(STEP_MS);
      expect(walker.getSnapshot().a).toBe(expected);
    }
  });

  it('keeps walking when another player broadcast lands mid-move', () => {
    const walker = createPawnWalker();
    walker.sync({
      status: 'WAITING',
      players: [
        { id: 'a', position: 0, left: false },
        { id: 'b', position: 0, left: false }
      ]
    });

    walker.sync(playing({ a: 6, b: 1 }));
    vi.advanceTimersByTime(STEP_MS * 2);
    expect(walker.getSnapshot()).toEqual({ a: 2, b: 1 });

    // Same authoritative snapshot re-sent (the usual 4-player chatter); 'a' must not freeze at 2.
    walker.sync(playing({ a: 6, b: 1 }));
    vi.advanceTimersByTime(STEP_MS * 2);
    expect(walker.getSnapshot().a).toBe(4);

    vi.advanceTimersByTime(STEP_MS * 2);
    expect(walker.getSnapshot().a).toBe(6);
  });

  it('re-routes to a new target without restarting the walk', () => {
    const walker = seed();
    walker.sync(playing({ a: 5 }));
    vi.advanceTimersByTime(STEP_MS * 2);
    expect(walker.getSnapshot().a).toBe(2);

    walker.sync(playing({ a: 8 }));
    vi.advanceTimersByTime(STEP_MS * 3);
    expect(walker.getSnapshot().a).toBe(5);
    vi.advanceTimersByTime(STEP_MS * 3);
    expect(walker.getSnapshot().a).toBe(8);
  });

  it('snaps for long jumps such as flights and jail', () => {
    const walker = seed();
    walker.sync(playing({ a: 37 }));
    expect(walker.getSnapshot().a).toBe(37);
  });

  it('stops the timer once everyone has arrived', () => {
    const walker = seed();
    walker.sync(playing({ a: 2 }));
    vi.advanceTimersByTime(STEP_MS * 2);
    expect(walker.getSnapshot().a).toBe(2);
    expect(vi.getTimerCount()).toBe(0);

    walker.sync(playing({ a: 2 }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('follows a player who leaves the table', () => {
    const walker = seed();
    walker.sync(playing({ a: 3 }));
    vi.advanceTimersByTime(STEP_MS);
    walker.sync({
      status: 'PLAYING',
      players: [
        { id: 'a', position: 3, left: false },
        { id: 'ghost', position: 9, left: true }
      ]
    });
    expect(walker.getSnapshot()).toEqual({ a: 1 });
    vi.advanceTimersByTime(STEP_MS * 5);
    expect(walker.getSnapshot().a).toBe(3);
  });

  it('holds still outside a live game', () => {
    const walker = seed();
    walker.sync(playing({ a: 5 }));
    walker.sync({ status: 'FINISHED', players: [{ id: 'a', position: 5, left: false }] });
    expect(walker.getSnapshot().a).toBe(5);
    expect(vi.getTimerCount()).toBe(0);
  });
});
