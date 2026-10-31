import { useEffect } from 'react';

const RULE_SECTIONS = [
  {
    icon: '🎯',
    title: 'Mục tiêu',
    lines: [
      '2–4 người chơi, mỗi người 4 chú ngựa cùng màu: Đỏ, Xanh dương, Xanh lá hoặc Vàng.',
      'Chủ phòng tung xúc xắc trước, sau đó xoay vòng theo chiều kim đồng hồ.',
      'Ai đưa đủ 4 ngựa vào chuồng của mình đầu tiên thì thắng.'
    ]
  },
  {
    icon: '🎲',
    title: 'Tung xúc xắc',
    lines: [
      'Cả ván chỉ dùng 1 viên xúc xắc D6.',
      'Tung ra 1 hoặc 6 mới được "xuất chuồng": đưa 1 ngựa ra ô xuất phát của màu mình, và được tung thêm 1 lần.',
      'Ra các số khác thì mất lượt, xoay vòng sang người kế tiếp — trừ khi quân đã ở ngoài chuồng.',
      'Quân đã ra ngoài thì đi đúng số vừa tung. Chỉ khi tung được 6 mới được tung tiếp, và không giới hạn số lần.'
    ]
  },
  {
    icon: '⚔️',
    title: 'Đá quân & sát nút',
    lines: [
      'Đi đến đúng ô đang có quân đối thủ thì quân đó bị "đá" và phải quay về chuồng.',
      'Quân của mình đứng chung ô thì không sao; được nhảy qua quân khác, chỉ ô đích mới tính.',
      '"Sát nút" là khi có quân đối thủ đứng ngay ô trước mặt — chỉ là nhãn hiển thị để bạn dễ nhìn, không đổi luật.'
    ]
  },
  {
    icon: '🏠',
    title: 'Vào chuồng',
    lines: [
      'Đi hết một vòng, quân dừng ở ô vào chuồng (ô cuối trước hàng dọc màu của bạn).',
      'Hàng dọc màu có đúng 4 ô, vào lần lượt theo số: quân thứ nhất cần tung đúng 6, quân thứ hai đúng 5, quân thứ ba đúng 4, quân thứ tư đúng 3.',
      'Tung sai số thì quân đứng yên và mất lượt. Quân đang đứng ở ô vào chuồng vẫn có thể bị đối thủ đá.'
    ]
  },
  {
    icon: '🔁',
    title: 'Những trường hợp khác',
    lines: [
      'Không có nước đi hợp lệ thì chuyển lượt; riêng tung được 6 vẫn được tung thêm.',
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
            <p className="text-[10px] font-black tracking-[0.22em] text-amber-500/80 uppercase">Luật chơi</p>
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
            Mẹo: chỉ ra 1 hoặc 6 mới xuất chuồng được, nên hãy đưa cả 4 ngựa ra sớm. Quân vừa xuất chuồng đứng ở ô xuất
            phát vẫn có thể bị đá về, nên đừng để yên quá lâu.
          </p>
        </div>
      </div>
    </div>
  );
}
