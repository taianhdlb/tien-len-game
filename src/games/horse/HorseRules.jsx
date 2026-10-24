import { useEffect } from 'react';

const RULE_SECTIONS = [
  {
    icon: '🎯',
    title: 'Mục tiêu',
    lines: [
      '2–4 kỵ sĩ, mỗi người điều khiển 4 chú ngựa cùng màu: Đỏ, Xanh dương, Xanh lá hoặc Vàng.',
      'Đưa cả 4 ngựa vào đúng bốn bậc cao nhất 3 – 4 – 5 – 6 của chuồng nhà mình để giành chiến thắng.'
    ]
  },
  {
    icon: '🎲',
    title: 'Tung xúc xắc & xuất quân',
    lines: [
      'Mỗi lượt tung 2 viên xúc xắc. Bạn có thể dùng tổng hai viên, hoặc điểm của từng viên, nhưng chỉ di chuyển một ngựa cho mỗi lần tung.',
      'Xuất quân khi tung được đôi (1-1 đến 6-6) hoặc cặp 1–6. Ngựa ra ô xuất quân của màu mình.',
      'Xuất quân, tung đôi hoặc đá được quân đối thủ sẽ được tung thêm lượt (tối đa 3 lượt thưởng liên tiếp).'
    ]
  },
  {
    icon: '🏇',
    title: 'Đường đua chung',
    lines: [
      'Đường đua có 48 ô, di chuyển một chiều theo chiều kim đồng hồ.',
      'Luật Việt Nam: được nhảy qua quân khác, chỉ ô đích mới quan trọng. Đích có quân mình thì xếp chồng; đích có quân địch thì đá toàn bộ về chuồng.',
      'Mỗi màu có ô xuất quân riêng và một cổng vào chuồng về đích.'
    ]
  },
  {
    icon: '🪜',
    title: 'Leo chuồng về đích',
    lines: [
      'Đi hết một vòng, phần điểm dư khi vượt cổng sẽ đưa ngựa lên bậc tương ứng (1–6).',
      'Được nhảy bậc nếu bậc đích còn trống. Bậc đã có ngựa của mình thì không vào được, và không được vượt quá bậc 6.',
      'Thắng ngay khi 4 ngựa nằm đúng các bậc 3, 4, 5, 6.'
    ]
  },
  {
    icon: '🔁',
    title: 'Những trường hợp khác',
    lines: [
      'Không có nước đi hợp lệ thì chuyển lượt; nếu đang là xúc xắc đôi thì vẫn được tung thêm.',
      'Người chơi mất kết nối có thể bị chủ phòng bỏ qua lượt để ván đấu không bị kẹt.',
      'Rời phòng giữa ván: người trụ lại cuối cùng sẽ thắng.'
    ]
  }
];

export default function HorseRules({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="horse-rules-title"
      onClick={onClose}
    >
      <div
        className="anim-rise my-auto w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-amber-700/60 bg-stone-950 shadow-[0_0_80px_rgba(0,0,0,0.9)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-amber-900/50 bg-gradient-to-r from-stone-900 to-stone-950 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-black tracking-[0.22em] text-amber-500/80 uppercase">Luật chơi truyền thống</p>
            <h2 id="horse-rules-title" className="font-display text-xl font-bold text-amber-300 sm:text-2xl">
              Cờ Cá Ngựa
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1 text-sm font-bold text-stone-300 transition hover:border-amber-600 hover:text-amber-200"
            aria-label="Đóng luật chơi"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[75vh] space-y-2.5 overflow-y-auto p-3 sm:p-5">
          {RULE_SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl border border-stone-800 bg-stone-900/60 p-3">
              <h3 className="flex items-center gap-2 text-sm font-black text-amber-200">
                <span aria-hidden="true" className="text-base">{section.icon}</span>
                {section.title}
              </h3>
              <ul className="mt-1.5 space-y-1">
                {section.lines.map((line) => (
                  <li key={line} className="flex gap-1.5 text-[12px] leading-relaxed text-stone-300">
                    <span aria-hidden="true" className="mt-[2px] text-amber-600">▸</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-[11px] leading-relaxed text-emerald-200">
            Mẹo: giữ một ngựa ở ô xuất quân để chặn hướng đối thủ, nhưng nhớ rằng luật Việt Nam cho phép nhảy qua — chỉ ô đích mới chặn được.
          </p>
        </div>
      </div>
    </div>
  );
}
