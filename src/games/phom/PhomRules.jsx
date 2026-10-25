import { useEffect } from 'react';

const SECTIONS = [
  {
    title: 'Chia bài & mục tiêu',
    items: [
      'Bộ bài Tây 52 lá, giá trị A=1, 2..10, J=11, Q=12, K=13.',
      '2–4 người ngồi chiếu. Người chia bài trước nhận 10 lá, những người còn lại 9 lá.',
      'Mục tiêu: hạ được nhiều phỏm, vứt hết bài rác. Hết 4 vòng, ai ít điểm rác nhất sẽ thắng.'
    ]
  },
  {
    title: 'Phỏm hợp lệ',
    items: [
      'Phỏm ngang (Sám): 3–4 lá cùng số, ví dụ 7♠ 7♥ 7♦.',
      'Phỏm dọc (Sảnh): từ 3 lá cùng chất liên tiếp, ví dụ 4♥ 5♥ 6♥ hay A♣ 2♣ 3♣ 4♣.',
      'Không tính sảnh vòng K–A–2. A chỉ là lá nhỏ nhất.'
    ]
  },
  {
    title: 'Diễn biến một lượt',
    items: [
      'Mở lượt: ĂN lá vừa đánh của người trước (nếu ghép thành phỏm) hoặc BỐC 1 lá từ nọc.',
      'Sau đó bắt buộc đánh ra 1 lá rác cho người kế tiếp.',
      'Nếu tay bài vào hết mọi phỏm (sạch rác) thì được tuyên bố Ù để thắng tuyệt đối.',
      'Vòng 1–3: được phép hạ phỏm tuỳ ý. Vòng 4: phải hạ hết phỏm trên tay rồi mới được đánh chốt.'
    ]
  },
  {
    title: 'Hạ bài & gửi bài',
    items: [
      'Hạ phỏm: công khai bộ bài hợp lệ lên chiếu, bắt buộc khi đã tới vòng cuối.',
      'Gửi bài: chỉ được gửi sau khi đã hạ ít nhất 1 phỏm. Lá rác được ghép vào phỏm đã hạ của bất kỳ ai (hai đầu sảnh hoặc lá thứ 4 của sám).',
      'Lá đã gửi không bị tính điểm rác.'
    ]
  },
  {
    title: 'Kết thúc & tính điểm',
    items: [
      'Hết 4 vòng (mỗi người đánh đủ 4 lá rác), chiếu mở bài tính điểm các lá rác còn lại.',
      'Điểm = tổng giá trị lá rác (A=1, J=11, Q=12, K=13). Thấp nhất là nhất.',
      'Bằng điểm: người hạ phỏm trước xếp trên.',
      'Móm (không hạ được phỏm nào) mặc định về bét.'
    ]
  },
  {
    title: 'Bảng phạt (điểm cược tham khảo)',
    items: [
      'Ù: mỗi người khác trả 4 cược cho người ù.',
      'Bị ăn: người bị ăn trả 1 cược (lá đầu), 2 cược (lá thứ hai), 3 cược (lá thứ ba).',
      'Ăn quân chốt (lá rác cuối vòng 3 đánh sang vòng 4): người đánh chốt trả thêm 4 cược.',
      'Đền Ù: nếu một người bị ăn 3 lá liên tiếp dẫn tới ù, hoặc để đối thủ ăn chốt rồi ù, người đó trả thay cả bàn.',
      'Không ù: nhì trả nhất 1 cược, ba trả 2 cược, bét trả 3 cược.'
    ]
  }
];

export default function PhomRules({ open, onClose }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Luật chơi Phỏm"
      onClick={onClose}
    >
      <div
        className="anim-rise flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-violet-700/70 bg-stone-950 shadow-[0_0_60px_rgba(0,0,0,0.9)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-violet-900 px-4 py-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-violet-400 uppercase">Tài liệu chiếu bài</p>
            <h2 className="font-display text-lg font-bold text-amber-300">Luật Phỏm (Tá Lả)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng luật chơi"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-950 text-sm text-violet-200 transition hover:bg-violet-900"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl border border-violet-900/50 bg-violet-950/25 p-3">
              <h3 className="text-xs font-black tracking-wider text-amber-300 uppercase">{section.title}</h3>
              <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-stone-300">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="shrink-0 border-t border-violet-900 px-4 py-2 text-center text-[10px] text-stone-500">
          Nhấn Esc hoặc nền tối để đóng
        </footer>
      </div>
    </div>
  );
}
