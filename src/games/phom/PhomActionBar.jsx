import { label } from './phomView.js';

const BTN = {
  primary: 'bg-amber-600 text-white shadow-[0_0_16px_rgba(217,119,6,0.35)] hover:bg-amber-500',
  ghost: 'border border-violet-800/70 bg-black/35 text-violet-100 hover:border-amber-500/70 hover:text-amber-200',
  danger: 'border border-rose-800/70 bg-rose-950/50 text-rose-200 hover:bg-rose-900/50'
};

function Button({ tone = 'ghost', disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${BTN[tone]}`}
    >
      {children}
    </button>
  );
}

const sameSet = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

export default function PhomActionBar({ room, myId, legal, selected, waitingFor, onAct }) {
  if (!room.myTurn || !legal) {
    return (
      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-violet-900/60 bg-black/45 px-3 py-2.5">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-800 border-t-violet-300" />
        <p className="text-[11px] font-bold text-violet-200">
          {room.status === 'PLAYING' ? `Đang chờ ${waitingFor}…` : 'Chiếu đang nghỉ'}
        </p>
      </div>
    );
  }

  const meldChoice = legal.canMeld.find((group) => sameSet(group, selected));
  const sendTargets = selected.length === 1 ? legal.canSend.filter((s) => s.cardId === selected[0]) : [];
  const discardReady = selected.length === 1 && legal.discards.includes(selected[0]);
  const selectedCard =
    selected.length === 1 ? room.players.find((p) => p.id === myId)?.hand?.find((c) => c.id === selected[0]) : null;

  return (
    <div className="shrink-0 space-y-1.5 border-t border-violet-900/60 bg-black/45 px-2 py-2 backdrop-blur sm:px-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {legal.phase === 'CLAIM' ? (
          <>
            <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase">Đến lượt bạn · ăn hoặc bốc</span>
            {legal.eatOptions.map((option) => (
              <Button key={option.cards.join('+')} tone="primary" onClick={() => onAct({ op: 'EAT', cards: option.cards })}>
                Ăn {option.phom.join(' ')}
              </Button>
            ))}
            <Button tone="ghost" onClick={() => onAct({ op: 'DRAW' })}>
              {room.stockCount > 0 ? ` Bốc 1 lá (${room.stockCount})` : 'Bỏ qua · nọc hết'}
            </Button>
          </>
        ) : (
          <>
            <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase">Đến lượt bạn</span>
            {legal.canWin && (
              <Button tone="primary" onClick={() => onAct({ op: 'WIN' })}>
                🏆 Ù!
              </Button>
            )}
            <Button tone="ghost" disabled={!meldChoice} onClick={() => onAct({ op: 'MELD', cards: meldChoice })}>
              Hạ phỏm
            </Button>
            <Button
              tone="ghost"
              disabled={!legal.suggestion.length}
              onClick={() => onAct({ op: 'AUTO_MELD' })}
              title="Hạ tất cả phỏm theo gợi ý"
            >
              ✨ Tự động hạ
            </Button>
            {sendTargets.map((target) => {
              const owner = room.players.find((p) => p.id === target.ownerId);
              const meld = owner?.melds.find((m) => m.id === target.meldId);
              return (
                <Button
                  key={`${target.cardId}-${target.meldId}`}
                  tone="primary"
                  onClick={() => onAct({ op: 'SEND', card: target.cardId, meldId: target.meldId })}
                >
                  Gửi {selectedCard ? label(selectedCard) : ''} → {meld ? meld.cards.map(label).join(' ') : ''} ({owner?.name})
                </Button>
              );
            })}
            <Button tone="danger" disabled={!discardReady} onClick={() => onAct({ op: 'DISCARD', card: selected[0] })}>
              Đánh{selectedCard ? ` ${label(selectedCard)}` : ''}
            </Button>
          </>
        )}
      </div>

      <p className="px-0.5 text-[10px] leading-snug text-violet-300/70">
        {legal.mustMeld
          ? '⏳ Vòng cuối: phải hạ hết phỏm trên tay trước khi đánh lá chốt.'
          : legal.phase === 'CLAIM'
            ? legal.eatOptions.length
              ? 'Lá vừa đánh ghép được phỏm với bài của bạn — ăn sẽ bị tính phạt cho người đánh.'
              : 'Không ăn được lá này, hãy bốc thêm 1 lá từ nọc.'
            : selected.length === 0
              ? 'Nhấp vào lá bài để chọn: 3+ lá để hạ phỏm, 1 lá để gửi hoặc đánh.'
              : sendTargets.length
                ? 'Lá đang chọn gửi được vào phỏm đã hạ — gửi xong sẽ bớt điểm rác.'
                : 'Chọn 1 lá rồi bấm Đánh để kết thúc lượt.'}
      </p>
    </div>
  );
}
