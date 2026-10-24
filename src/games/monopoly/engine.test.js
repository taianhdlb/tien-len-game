import { describe, it, expect } from 'vitest';
import {
  reduce,
  GameError,
  STARTING_GOLD,
  GO_SALARY,
  JAIL_BAIL,
  JAIL_POSITION,
  MAX_JAIL_TURNS,
  getRent,
  getUpgradeCost
} from './engine.js';
import { BOARD_TILES, EVENTS, BLESSINGS } from './data.js';

// Each entry is [value, sides]; produces the rng fraction that rollDie/pick turn into `value`.
const scripted = (...rolls) => {
  const queue = rolls.map(([v, sides]) => (v - 0.5) / sides);
  return () => {
    if (!queue.length) throw new Error('rng exhausted');
    return queue.shift();
  };
};

const lobby = (n = 2) => ({
  id: 'T',
  type: 'MONOPOLY',
  status: 'WAITING',
  version: 1,
  logs: [],
  players: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, classId: 'fighter', connected: true }))
});

const started = (n = 2) => reduce(lobby(n), 'p0', { type: 'START' });

// Places p0 at `from` and rolls a+b.
const rollFrom = (state, from, a, b, ...extra) => {
  const s = structuredClone(state);
  s.players[s.currentTurn].position = from;
  return reduce(s, s.players[s.currentTurn].id, { type: 'ROLL' }, scripted([a, 6], [b, 6], ...extra));
};

describe('START', () => {
  it('initialises players and bumps version', () => {
    const s = started();
    expect(s.status).toBe('PLAYING');
    expect(s.version).toBe(2);
    expect(s.players.every((p) => p.gold === STARTING_GOLD && p.position === 0)).toBe(true);
    expect(s.currentTurn).toBe(0);
  });

  it('rejects non-host and single player', () => {
    expect(() => reduce(lobby(), 'p1', { type: 'START' })).toThrow(GameError);
    expect(() => reduce(lobby(1), 'p0', { type: 'START' })).toThrow(/ít nhất 2/);
  });

  it('does not mutate the input state', () => {
    const l = lobby();
    const copy = structuredClone(l);
    reduce(l, 'p0', { type: 'START' });
    expect(l).toEqual(copy);
  });
});

describe('turn order', () => {
  it('rejects actions from the wrong player', () => {
    expect(() => reduce(started(), 'p1', { type: 'ROLL' })).toThrow(/Chưa tới lượt/);
  });

  it('cannot roll twice while a decision is pending', () => {
    const s = rollFrom(started(), 0, 1, 2); // -> tile 3 (property)
    expect(s.pending.kind).toBe('BUY');
    expect(() => reduce(s, 'p0', { type: 'ROLL' }, scripted([1, 6], [1, 6]))).toThrow(GameError);
  });
});

describe('properties', () => {
  it('buy -> rent -> upgrade cycle', () => {
    let s = rollFrom(started(), 0, 1, 2);
    expect(s.pending).toEqual({ kind: 'BUY', tileId: 3 });
    s = reduce(s, 'p0', { type: 'BUY' });
    expect(s.properties[3]).toEqual({ ownerId: 'p0', level: 0 });
    expect(s.players[0].gold).toBe(STARTING_GOLD - 80);
    expect(s.currentTurn).toBe(1);

    s = rollFrom(s, 0, 1, 2);
    expect(s.pending).toMatchObject({ kind: 'RENT', ownerId: 'p0', amount: getRent(BOARD_TILES[3], 0) });
    s = reduce(s, 'p1', { type: 'PAY' });
    expect(s.players[1].gold).toBe(STARTING_GOLD - 15);
    expect(s.players[0].gold).toBe(STARTING_GOLD - 80 + 15);

    s = rollFrom(s, 0, 1, 2);
    expect(s.pending.kind).toBe('UPGRADE');
    s = reduce(s, 'p0', { type: 'UPGRADE' });
    expect(s.properties[3].level).toBe(1);
    expect(s.players[0].gold).toBe(STARTING_GOLD - 80 + 15 - getUpgradeCost(BOARD_TILES[3]));
  });

  it('cannot buy without enough gold', () => {
    const s = structuredClone(started());
    s.players[0].gold = 10;
    const landed = rollFrom(s, 0, 1, 2);
    expect(() => reduce(landed, 'p0', { type: 'BUY' })).toThrow(/Không đủ vàng/);
    expect(reduce(landed, 'p0', { type: 'DECLINE' }).currentTurn).toBe(1);
  });

  it('pays GO salary when passing start', () => {
    const s = rollFrom(started(), 38, 1, 2); // 38 + 3 = 41 -> 1
    expect(s.players[0].position).toBe(1);
    expect(s.players[0].gold).toBe(STARTING_GOLD + GO_SALARY);
  });

  it('declares relic victory at 3 relics', () => {
    let s = structuredClone(started());
    s.properties = { 15: { ownerId: 'p0', level: 0 }, 28: { ownerId: 'p0', level: 0 } };
    s = rollFrom(s, 30, 2, 3); // -> 35 Ten Towns
    expect(s.pending).toEqual({ kind: 'BUY', tileId: 35 });
    s = reduce(s, 'p0', { type: 'BUY' });
    expect(s.status).toBe('FINISHED');
    expect(s.winnerId).toBe('p0');
    expect(s.winReason).toBe('RELICS');
  });
});

describe('bankruptcy', () => {
  it('bankrupts a player who cannot pay rent and ends the game with 2 players', () => {
    let s = structuredClone(started());
    s.properties = { 39: { ownerId: 'p1', level: 3 } };
    s.players[0].gold = 100;
    s = rollFrom(s, 34, 2, 3);
    expect(s.pending.kind).toBe('RENT');
    s = reduce(s, 'p0', { type: 'PAY' });
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.players[1].gold).toBe(STARTING_GOLD + 100);
    expect(s.status).toBe('FINISHED');
    expect(s.winnerId).toBe('p1');
  });

  it('skips bankrupt players and frees their land with 3 players', () => {
    let s = structuredClone(started(3));
    s.properties = { 39: { ownerId: 'p1', level: 3 }, 1: { ownerId: 'p0', level: 0 } };
    s.players[0].gold = 0;
    s = rollFrom(s, 34, 2, 3);
    s = reduce(s, 'p0', { type: 'PAY' });
    expect(s.status).toBe('PLAYING');
    expect(s.properties[1]).toBeUndefined();
    expect(s.currentTurn).toBe(1);
    s = rollFrom(s, 0, 2, 2); // p1 -> 4 tax
    s = reduce(s, 'p1', { type: 'PAY' });
    expect(s.currentTurn).toBe(2);
    s = rollFrom(s, 0, 2, 2);
    s = reduce(s, 'p2', { type: 'PAY' });
    expect(s.currentTurn).toBe(1); // p0 skipped
  });
});

describe('events, blessings and teleport', () => {
  const eventIdx = (id) => EVENTS.findIndex((e) => e.id === id) + 1;

  it('event safe option charges safeCost', () => {
    let s = rollFrom(started(), 0, 1, 1, [eventIdx(3), EVENTS.length]); // tile 2, Mind Flayer
    expect(s.pending).toEqual({ kind: 'EVENT', eventId: 3 });
    s = reduce(s, 'p0', { type: 'EVENT_SAFE' });
    expect(s.players[0].gold).toBe(STARTING_GOLD - 60);
    expect(s.currentTurn).toBe(1);
  });

  it('event D20 success awards gold and waits for CONTINUE', () => {
    let s = rollFrom(started(), 0, 1, 1, [eventIdx(5), EVENTS.length]);
    s = reduce(s, 'p0', { type: 'ROLL_D20' }, scripted([20, 20]));
    expect(s.pending.d20).toMatchObject({ roll: 20, outcome: 'CRIT_SUCCESS' });
    expect(s.players[0].gold).toBe(STARTING_GOLD + 300);
    expect(() => reduce(s, 'p0', { type: 'EVENT_SAFE' })).toThrow(GameError);
    s = reduce(s, 'p0', { type: 'CONTINUE' });
    expect(s.currentTurn).toBe(1);
    expect(s.pending).toBeNull();
  });

  it('event fail with failJail sends to jail', () => {
    let s = rollFrom(started(), 0, 1, 1, [eventIdx(1), EVENTS.length]);
    s = reduce(s, 'p0', { type: 'ROLL_D20' }, scripted([2, 20]));
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].position).toBe(JAIL_POSITION);
  });

  it('blessing can be declined before rolling', () => {
    let s = rollFrom(started(), 0, 3, 4, [1, BLESSINGS.length]); // tile 7
    expect(s.pending.kind).toBe('BLESSING');
    s = reduce(s, 'p0', { type: 'DECLINE' });
    expect(s.currentTurn).toBe(1);
  });

  it('teleport moves to the target on CONTINUE', () => {
    let s = rollFrom(started(), 0, 2, 3); // tile 5
    expect(s.pending).toEqual({ kind: 'TELEPORT', tileId: 5, target: 25 });
    s = reduce(s, 'p0', { type: 'CONTINUE' });
    expect(s.players[0].position).toBe(25);
  });
});

describe('jail', () => {
  const jailed = () => {
    let s = rollFrom(started(), 25, 2, 3); // -> 30 go to jail
    s = reduce(s, 'p0', { type: 'CONTINUE' });
    s = rollFrom(s, 0, 1, 1, [1, EVENTS.length]); // p1 -> 2 event
    return reduce(s, 'p1', { type: 'EVENT_SAFE' });
  };

  it('jailed player must decide before rolling', () => {
    const s = jailed();
    expect(s.currentTurn).toBe(0);
    expect(s.pending).toEqual({ kind: 'JAIL' });
    expect(() => reduce(s, 'p0', { type: 'ROLL' })).toThrow(GameError);
  });

  it('paying bail frees the player to roll', () => {
    let s = reduce(jailed(), 'p0', { type: 'PAY_BAIL' });
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].gold).toBe(STARTING_GOLD - JAIL_BAIL);
    expect(s.pending).toBeNull();
    s = reduce(s, 'p0', { type: 'ROLL' }, scripted([1, 6], [1, 6], [1, EVENTS.length]));
    expect(s.players[0].position).toBe(12);
  });

  it('failed escape ends the turn and is forced free after max turns', () => {
    let s = jailed();
    for (let i = 0; i < MAX_JAIL_TURNS; i++) {
      s = reduce(s, 'p0', { type: 'ROLL_D20' }, scripted([2, 20]));
      s = reduce(s, 'p0', { type: 'CONTINUE' });
      expect(s.currentTurn).toBe(1);
      s = rollFrom(s, 0, 2, 2); // p1 -> tax
      s = reduce(s, 'p1', { type: 'PAY' });
    }
    expect(s.players[0].inJail).toBe(false);
    expect(s.pending).toBeNull();
    expect(s.players[0].gold).toBe(STARTING_GOLD - JAIL_BAIL);
  });
});

describe('disconnects', () => {
  it('lets others skip a disconnected player only', () => {
    const s = started();
    expect(() => reduce(s, 'p1', { type: 'SKIP_TURN' })).toThrow(GameError);
    const d = structuredClone(s);
    d.players[0].connected = false;
    expect(reduce(d, 'p1', { type: 'SKIP_TURN' }).currentTurn).toBe(1);
  });
});
