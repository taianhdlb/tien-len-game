import Card, { CardBack } from '../../components/Card.jsx';
import { label, initials, toneOf } from './phomView.js';

const red = (card) => card.suitColor === 'red';

function Chip({ card, strong, chot }) {
  return (
    <span
      className={`rounded border px-1 py-0.5 font-mono text-[10px] font-bold ${
        strong ? 'border-amber-400/80 bg-amber-500/20 text-amber-100' : 'border-stone-700 bg-black/40'
      } ${red(card) ? 'text-rose-300' : 'text-stone-200'} ${strong && red(card) ? '!text-rose-200' : ''}`}
      title={chot ? 'Quân chốt' : undefined}
    >
      {label(card)}
      {chot && <span aria-hidden="true"> ⚑</span>}
    </span>
  );
}

export function MeldGroup({ cards, compact = false }) {
  return (
    <div className={`flex ${compact ? '-space-x-3' : '-space-x-2'}`} aria-label={`Phỏm ${cards.map(label).join(' ')}`}>
      {cards.map((card) => (
        <Card key={card.id} card={card} size="sm" />
      ))}
    </div>
  );
}

function DiscardStream({ cards, claimId }) {
  if (!cards.length) return <p className="text-[10px] text-stone-600 italic">chưa đánh lá nào</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {cards.map((entry, i) => (
        <Chip
          key={entry.card.id}
          card={entry.card}
          chot={entry.chot}
          strong={entry.card.id === claimId && i === cards.length - 1}
        />
      ))}
    </div>
  );
}

function SeatPanel({ player, index, active, claim, isWinner }) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-2 transition ${
        active ? 'border-amber-400/80 bg-amber-950/25 shadow-[0_0_18px_rgba(245,158,11,0.22)]' : 'border-violet-900/50 bg-black/30'
      } ${player.left ? 'opacity-45' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${toneOf(index)}`}>
          {initials(player.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-[11px] font-bold text-stone-100">
            <span className="truncate">{player.name}</span>
            {isWinner && <span aria-hidden="true">🏆</span>}
          </p>
          <p className="text-[9px] font-semibold text-violet-300/80">
            {player.cardCount} lá · hạ {player.melds.length} phỏm
            {player.left ? ' · đã bỏ chiếu' : player.connected === false ? ' · mất kết nối' : ''}
          </p>
        </div>
        {active && <span className="rounded bg-amber-500 px-1 text-[8px] font-black text-black uppercase">Lượt</span>}
      </div>

      {player.melds.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {player.melds.map((meld) => (
            <MeldGroup key={meld.id} cards={meld.cards} compact />
          ))}
        </div>
      )}

      <div className="mt-1.5">
        <p className="mb-0.5 text-[8px] font-black tracking-wider text-stone-500 uppercase">Rác đã đánh</p>
        <DiscardStream cards={player.discards.slice(-8)} claimId={claim?.playerId === player.id ? claim.card.id : null} />
      </div>
    </div>
  );
}

function StockPile({ count }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="relative h-14 w-11 sm:h-16 sm:w-12">
        {count > 0 && (
          <>
            <CardBack size="md" className="absolute inset-0 translate-x-1 translate-y-1 opacity-45" />
            <CardBack size="md" className="absolute inset-0 -translate-x-0.5 -translate-y-0.5 opacity-75" />
            <CardBack size="md" className="absolute inset-0" />
          </>
        )}
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-black text-amber-300 drop-shadow">
          {count}
        </span>
      </div>
      <p className="text-[9px] font-black tracking-wider text-violet-300/80 uppercase">Nọc</p>
    </div>
  );
}

export default function PhomTable({ room, myId, selected, onToggleCard, disabled }) {
  const me = room.players.find((p) => p.id === myId);
  const opponents = room.players.filter((p) => p.id !== myId);
  const claim = room.claim;
  const claimOwner = claim ? room.players.find((p) => p.id === claim.playerId) : null;
  const seatOf = (player) => room.players.indexOf(player);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="grid shrink-0 gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {opponents.map((player) => (
          <SeatPanel
            key={player.id}
            player={player}
            index={seatOf(player)}
            active={room.status === 'PLAYING' && room.players[room.turn]?.id === player.id}
            claim={claim}
            isWinner={room.results?.winnerId === player.id}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 px-3 py-1 sm:gap-6">
        <StockPile count={room.stockCount} />
        <div className="h-14 w-px bg-violet-900/60 sm:h-16" />
        <div className="flex min-w-0 flex-col items-center gap-1">
          {claim ? (
            <>
              <p className="truncate text-[10px] font-bold text-violet-200">
                <span className="text-amber-300">{claimOwner?.name}</span> vừa đánh
                {claim.chot && <span className="ml-1 rounded bg-rose-900/80 px-1 text-[9px] font-black text-rose-100">CHỐT</span>}
              </p>
              <Card card={claim.card} size="md" />
            </>
          ) : (
            <p className="text-center text-[10px] text-violet-300/70">
              {room.status === 'PLAYING' ? 'Chiếu đang trống' : 'Hạ màn · chiếu đã nghỉ'}
            </p>
          )}
        </div>
        <div className="h-14 w-px bg-violet-900/60 sm:h-16" />
        <div className="flex shrink-0 flex-col items-center">
          <p className="font-display text-lg leading-none text-amber-300">{room.round}</p>
          <p className="text-[9px] font-black tracking-wider text-violet-300/80 uppercase">/ 4 vòng</p>
          <p className="mt-0.5 text-[9px] text-violet-400/70">{room.phase === 'CLAIM' ? 'Ăn / Bốc' : 'Hạ / Đánh'}</p>
        </div>
      </div>

      {me && (
        <div className="mx-2 mt-2 shrink-0 rounded-xl border border-violet-900/50 bg-black/25 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-black tracking-wider text-violet-300/80 uppercase">Phỏm của bạn</p>
            {me.melds.length === 0 ? (
              <span className="text-[10px] text-stone-600 italic">chưa hạ phỏm nào</span>
            ) : (
              me.melds.map((meld) => <MeldGroup key={meld.id} cards={meld.cards} />)
            )}
          </div>
          {me.discards.length > 0 && (
            <div className="mt-1.5">
              <p className="mb-0.5 text-[9px] font-black tracking-wider text-stone-500 uppercase">Rác của bạn</p>
              <DiscardStream cards={me.discards.slice(-10)} claimId={claim?.playerId === me.id ? claim.card.id : null} />
            </div>
          )}
        </div>
      )}

      <div className="mt-auto shrink-0 border-t border-violet-900/50 bg-black/35 px-2 pb-2 pt-2 backdrop-blur-sm sm:px-3">
        <p className="mb-1 px-1 text-[10px] font-bold text-violet-200/80">
          Bài trên tay <span className="text-violet-400">({me?.hand?.length ?? 0} lá)</span>
          {selected.length > 0 && <span className="ml-2 text-amber-300">đã chọn {selected.length}</span>}
        </p>
        <div className="no-scrollbar flex items-end gap-1 overflow-x-auto px-1 pb-1 pt-3 sm:justify-center">
          {(me?.hand ?? []).map((card) => (
            <Card
              key={card.id}
              card={card}
              size="md"
              selected={selected.includes(card.id)}
              onClick={() => onToggleCard(card)}
              disabled={disabled}
            />
          ))}
          {(me?.hand ?? []).length === 0 && (
            <p className="w-full py-4 text-center text-xs text-violet-300/70 italic">Hết bài trên tay — hãy hạ hoặc ù.</p>
          )}
        </div>
      </div>
    </div>
  );
}
