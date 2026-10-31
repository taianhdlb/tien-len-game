import { BLESSINGS, BOARD_TILES, EVENTS, INSTANT_WIN_RELIC_IDS, getClass } from './data.js';
import { JAIL_BAIL, JAIL_DC, TIER_NAMES, getUpgradeCost, isSuccess } from './engine.js';
import { Dice3D } from '../../three/Dice3D.jsx';
import { FantasyIcon } from '../../components/Monopoly/FantasyIcons.jsx';

const OUTCOME = {
  CRIT_SUCCESS: { title: 'ĐỎ NHƯ SON (20)!', icon: '🧧', tone: 'text-amber-300', ring: 'border-amber-400/70 bg-amber-950/50' },
  SUCCESS: { title: 'THÀNH CÔNG', icon: '🎉', tone: 'text-emerald-300', ring: 'border-emerald-500/60 bg-emerald-950/40' },
  FAIL: { title: 'THẤT BẠI', icon: '💥', tone: 'text-rose-300', ring: 'border-rose-500/60 bg-rose-950/40' },
  CRIT_FAIL: { title: 'ĐEN PHỦI (1)!', icon: '🪦', tone: 'text-rose-400', ring: 'border-rose-500/70 bg-rose-950/60' }
};

const TONE = {
  primary:
    'bg-amber-700 text-white border-amber-500/60 hover:bg-amber-600 shadow-[0_0_18px_rgba(217,119,6,0.45)]',
  danger:
    'bg-rose-800 text-white border-rose-500/60 hover:bg-rose-700 shadow-[0_0_18px_rgba(190,18,60,0.4)]',
  ghost: 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
};

function d20View(outcome, roll, dc, extraText) {
  const info = OUTCOME[outcome] || OUTCOME.FAIL;
  return {
    outcomeInfo: info,
    text: extraText,
    d20: { roll, dc }
  };
}

function buildView(room, pending) {
  const actor = room.players[room.currentTurn];
  const gold = actor?.gold ?? 0;
  const base = { actor, gold };

  if (pending.kind === 'BUY') {
    const tile = BOARD_TILES[pending.tileId];
    const relic = INSTANT_WIN_RELIC_IDS.includes(tile.id);
    const affordable = gold >= tile.price;
    return {
      ...base,
      icon: tile.iconKey,
      eyebrow: relic ? 'Kỳ Quan Việt Nam' : 'Đất Chính Chủ Đang Bán',
      title: tile.name,
      speaker: relic ? 'Sở Du Lịch' : 'Chủ Đất',
      text: relic
        ? 'Một Kỳ Quan nằm trong bộ ba di sản. Sưu đủ 3 Kỳ Quan là thắng tuyệt đối!'
        : 'Mảnh đất này chưa có chủ, ngân hàng sẵn sàng sang tên nếu bạn đủ tiền.',
      meta: [
        `Giá đất: ${tile.price}g`,
        `Thuê gốc: ${tile.rents?.[0] ?? 0}g`,
        `Xây dựng: ${getUpgradeCost(tile)}g`
      ],
      actions: [
        {
          label: `Mua · ${tile.price}g`,
          action: { type: 'BUY' },
          tone: 'primary',
          disabled: !affordable,
          hint: affordable ? null : 'Không đủ vàng'
        },
        { label: 'Bỏ qua', action: { type: 'DECLINE' }, tone: 'ghost' }
      ]
    };
  }

  if (pending.kind === 'UPGRADE') {
    const tile = BOARD_TILES[pending.tileId];
    const level = room.properties?.[tile.id]?.level ?? 0;
    const cost = getUpgradeCost(tile);
    const next = Math.min(level + 1, TIER_NAMES.length - 1);
    const affordable = gold >= cost;
    return {
      ...base,
      icon: 'relic',
      eyebrow: 'Xây Dựng Nhà Cửa',
      title: tile.name,
      speaker: 'Thầu Xây Địa Phương',
      text: `Lô đất đang là ${TIER_NAMES[level]}, xây lên ${TIER_NAMES[next]} thì tiền thuê sẽ nhảy vọt.`,
      meta: [`Hiện tại: ${TIER_NAMES[level]}`, `Chi phí: ${cost}g`, `Thuê mới: ${tile.rents?.[next] ?? 0}g`],
      actions: [
        {
          label: `Nâng cấp · ${cost}g`,
          action: { type: 'UPGRADE' },
          tone: 'primary',
          disabled: !affordable,
          hint: affordable ? null : 'Không đủ vàng'
        },
        { label: 'Giữ nguyên', action: { type: 'DECLINE' }, tone: 'ghost' }
      ]
    };
  }

  if (pending.kind === 'RENT') {
    const tile = BOARD_TILES[pending.tileId];
    const owner = room.players.find((p) => p.id === pending.ownerId);
    const broke = gold < pending.amount;
    const relicBuyout = tile.type === 'RELIC' ? pending.buyoutPrice : null;
    return {
      ...base,
      icon: tile.iconKey,
      eyebrow: relicBuyout ? 'Kỳ Quan Có Chủ' : 'Đất Có Chủ',
      title: relicBuyout ? `Kỳ Quan · ${tile.name}` : `Tiền Thuê · ${tile.name}`,
      speaker: owner?.name || 'Chủ đất',
      text: relicBuyout
        ? `${owner?.name || 'Đối thủ'} đang sở hữu ${tile.name}. Trả thuê để đi tiếp, hoặc trả giá cao hơn để chuộc lại Kỳ Quan.`
        : `Bạn đặt chân vào đất của ${owner?.name || 'đối thủ'}. Trả tiền thuê rồi đi tiếp.`,
      meta: [
        `Phải trả: ${pending.amount}g`,
        `Tiền của bạn: ${gold}g`,
        ...(relicBuyout ? [`Chuộc Kỳ Quan: ${relicBuyout}g`] : []),
        ...(broke ? ['⚠️ Sẽ phá sản!'] : [])
      ],
      actions: [
        ...(relicBuyout
          ? [
              {
                label: `Chuộc Kỳ Quan · ${relicBuyout}g`,
                action: { type: 'BUY_RELIC' },
                tone: 'primary',
                disabled: gold < relicBuyout,
                hint: gold < relicBuyout ? 'Không đủ vàng' : null
              }
            ]
          : []),
        {
          label: `Thanh toán · ${pending.amount}g`,
          action: { type: 'PAY' },
          tone: relicBuyout ? 'ghost' : broke ? 'danger' : 'primary'
        }
      ]
    };
  }

  if (pending.kind === 'TAX') {
    const tile = BOARD_TILES[pending.tileId];
    const broke = gold < pending.amount;
    return {
      ...base,
      icon: 'tax',
      eyebrow: 'Lệnh Thuế',
      title: tile.name,
      speaker: 'Cán Bộ Thuế',
      text: 'Cơ quan thuế yêu cầu bạn đóng góp theo luật định, tính trên số tiền đang có.',
      meta: [`Phải nộp: ${pending.amount}g`, `Tiền của bạn: ${gold}g`, ...(broke ? ['⚠️ Sẽ phá sản!'] : [])],
      actions: [{ label: `Nộp thuế · ${pending.amount}g`, action: { type: 'PAY' }, tone: broke ? 'danger' : 'primary' }]
    };
  }

  if (pending.kind === 'EVENT') {
    const ev = EVENTS.find((e) => e.id === pending.eventId) || EVENTS[0];
    if (pending.d20) {
      const success = isSuccess(pending.d20.outcome);
      return {
        ...base,
        icon: 'event',
        eyebrow: `Cơ Hội · D20 DC ${ev.dc}`,
        title: ev.title,
        speaker: ev.speaker,
        meta: [],
        actions: [{ label: 'Tiếp tục', action: { type: 'CONTINUE' }, tone: 'primary' }],
        ...d20View(pending.d20.outcome, pending.d20.roll, ev.dc, success ? ev.passText : ev.failText)
      };
    }
    return {
      ...base,
      icon: 'event',
      eyebrow: `Ô Cơ Hội · DC ${ev.dc}`,
      title: ev.title,
      speaker: ev.speaker,
      text: ev.desc,
      meta: [
        ev.safeCost > 0 ? `An toàn: ${ev.safeCost}g` : 'An toàn: miễn phí',
        `Thử thách: D20 ≥ ${ev.dc}`,
        ev.passGold ? `Phần thưởng: +${ev.passGold}g` : null
      ].filter(Boolean),
      actions: [
        { label: ev.safeLabel, action: { type: 'EVENT_SAFE' }, tone: 'ghost' },
        { label: `${ev.rollLabel} · D20`, action: { type: 'ROLL_D20' }, tone: 'primary' }
      ]
    };
  }

  if (pending.kind === 'BLESSING') {
    const bl = BLESSINGS.find((b) => b.id === pending.blessingId) || BLESSINGS[0];
    if (pending.d20) {
      const success = isSuccess(pending.d20.outcome);
      return {
        ...base,
        icon: 'blessing',
        eyebrow: `Khí Vận · ${bl.god}`,
        title: bl.title,
        speaker: bl.god,
        meta: [],
        actions: [{ label: 'Tiếp tục', action: { type: 'CONTINUE' }, tone: 'primary' }],
        ...d20View(
          pending.d20.outcome,
          pending.d20.roll,
          bl.dc,
          success
            ? `${bl.god} linh ứng, bạn trúng lộc +${bl.passGold}g!`
            : `Khí vận chưa tới, bạn tốn ${bl.failCost}g sắm lễ.`
        )
      };
    }
    return {
      ...base,
      icon: 'blessing',
      eyebrow: `Ô Khí Vận · DC ${bl.dc}`,
      title: bl.title,
      speaker: bl.god,
      text: bl.desc,
      meta: [`Trúng lộc: +${bl.passGold}g`, `Trượt: -${bl.failCost}g`],
      actions: [
        { label: 'Bỏ qua', action: { type: 'DECLINE' }, tone: 'ghost' },
        { label: 'Khấn cầu · D20', action: { type: 'ROLL_D20' }, tone: 'primary' }
      ]
    };
  }

  if (pending.kind === 'JAIL') {
    if (pending.d20) {
      const success = isSuccess(pending.d20.outcome);
      return {
        ...base,
        icon: 'jail',
        eyebrow: `Xin Tại Ngoại · DC ${JAIL_DC}`,
        title: 'Phòng Tạm Giam',
        speaker: 'Công An Phường',
        meta: [],
        actions: [
          {
            label: success ? 'Về nhà & tung xúc xắc' : 'Chịu án',
            action: { type: 'CONTINUE' },
            tone: success ? 'primary' : 'ghost'
          }
        ],
        ...d20View(
          pending.d20.outcome,
          pending.d20.roll,
          JAIL_DC,
          success
            ? 'Hồ sơ hợp lệ! Bạn được tại ngoại và đi tiếp.'
            : 'Chưa được chấp nhận. Bạn phải ở lại thêm một lượt.'
        )
      };
    }
    return {
      ...base,
      icon: 'jail',
      eyebrow: 'Phòng Tạm Giam',
      title: 'Đang Bị Tạm Giam',
      speaker: 'Công An Phường',
      text: 'Bạn đang bị tạm giam. Nộp tiền bảo lãnh để về ngay, hoặc làm đơn xin tại ngoại bằng D20.',
      meta: [`Bảo lãnh: ${JAIL_BAIL}g`, `Tại ngoại: D20 ≥ ${JAIL_DC}`],
      actions: [
        {
          label: `Nộp bảo lãnh · ${JAIL_BAIL}g`,
          action: { type: 'PAY_BAIL' },
          tone: 'ghost',
          disabled: gold < JAIL_BAIL,
          hint: gold < JAIL_BAIL ? 'Không đủ tiền' : null
        },
        { label: 'Xin tại ngoại · D20', action: { type: 'ROLL_D20' }, tone: 'primary' }
      ]
    };
  }

  if (pending.kind === 'TELEPORT') {
    const tile = BOARD_TILES[pending.tileId];
    const target = BOARD_TILES[pending.target];
    return {
      ...base,
      icon: 'teleport',
      eyebrow: 'Chuyến Bay',
      title: tile.name,
      speaker: 'Nhân Viên Mặt Đất',
      text: `Chặng bay vừa khởi hành, bạn được chuyển thẳng ra ${target.name}.`,
      meta: [`Điểm đến: ${target.name}`, target.price > 0 ? `Giá đất: ${target.price}g` : 'Ô an toàn'],
      actions: [{ label: 'Lên máy bay', action: { type: 'CONTINUE' }, tone: 'primary' }]
    };
  }

  if (pending.kind === 'GO_TO_JAIL') {
    return {
      ...base,
      icon: 'jail',
      eyebrow: 'Lệnh Bắt Giữ',
      title: 'Về Tạm Giam!',
      speaker: 'Công An Phường',
      text: 'Bạn bị bắt tại chỗ vì vi phạm nội lệ và phải về ngay phòng tạm giam.',
      meta: ['Không được đòi hỏi', 'Mất lượt hiện tại'],
      actions: [{ label: 'Chấp nhận', action: { type: 'CONTINUE' }, tone: 'danger' }]
    };
  }

  return null;
}

export default function PendingDialog({ room, myId, isMyTurn, onDispatch }) {
  const pending = room.pending;
  if (!pending) return null;
  const view = buildView(room, pending);
  if (!view) return null;

  const actorClass = view.actor ? getClass(view.actor.classId) : null;
  const outcome = view.outcomeInfo;
  const actorIsMe = view.actor?.id === myId;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-2 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-labelledby="pending-title"
        className="anim-pop pointer-events-auto flex max-h-[86dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border-2 border-amber-700/70 bg-stone-900/98 shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur"
      >
        <div className="flex items-start gap-2.5 border-b border-amber-900/50 bg-stone-950/90 p-3 sm:gap-3 sm:p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-700/50 bg-stone-900 shadow-inner sm:h-12 sm:w-12">
            <FantasyIcon name={view.icon} className="h-7 w-7 sm:h-8 sm:w-8" glow />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.18em] text-amber-500/90 uppercase">{view.eyebrow}</p>
            <h2 id="pending-title" className="font-display truncate text-lg font-bold text-amber-300 text-shadow-gold sm:text-xl">
              {view.title}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-400">
              <span aria-hidden="true">{actorClass?.icon}</span>
              <span className="truncate font-semibold text-stone-300">
                {view.actor?.name}
                {actorIsMe && <span className="ml-1 text-emerald-400">(Bạn)</span>}
              </span>
              <span>·</span>
              <span className="shrink-0 font-bold text-amber-400">🪙 {view.gold}g</span>
            </p>
          </div>
          {INSTANT_WIN_RELIC_IDS.includes(pending.tileId) && (
            <span className="shrink-0 rounded-full border border-amber-500/60 bg-amber-950/70 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-300 uppercase">
              Kỳ quan
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
          <p className="text-xs leading-relaxed text-stone-300 italic sm:text-sm">
            <span className="mr-1 font-semibold text-amber-500/80 not-italic">“{view.speaker}:”</span>
            {view.text}
          </p>

          {view.meta?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {view.meta.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-stone-700 bg-stone-950/80 px-2 py-0.5 text-[10px] font-semibold text-stone-300"
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          {view.d20 && outcome && (
            <div className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${outcome.ring}`}>
              <Dice3D
                type="D20"
                value={view.d20.roll}
                rollKey={view.d20.roll}
                size={112}
                theme="amethyst"
                animateOnMount
              />
              <div className={`flex items-center gap-1.5 text-sm font-black ${outcome.tone}`}>
                <span aria-hidden="true">{outcome.icon}</span>
                {outcome.title}
              </div>
              <p className="text-[11px] font-semibold text-stone-300">
                Kết quả D20: <span className="font-black text-white">{view.d20.roll}</span> / DC {view.d20.dc}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-stone-800 bg-stone-950/80 p-2.5 sm:p-3">
          {isMyTurn ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {view.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  disabled={a.disabled}
                  title={a.hint || undefined}
                  onClick={() => onDispatch(a.action)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:text-sm ${TONE[a.tone] || TONE.ghost}`}
                >
                  {a.label}
                  {a.disabled && a.hint && <span className="ml-1 text-[10px] font-normal opacity-80">({a.hint})</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 py-1 text-center text-xs text-stone-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Đang chờ <strong className="text-amber-300">{view.actor?.name}</strong> đưa ra quyết định…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
