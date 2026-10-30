import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Empty, PageHeader } from '../components/ui';
import { useStore } from '../store/useStore';

function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'এইমাত্র';
  if (m < 60) return `${m.toLocaleString('bn-BD')} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h.toLocaleString('bn-BD')} ঘণ্টা আগে`;
  return new Date(t).toLocaleDateString('bn-BD');
}

export default function Notifications() {
  const nav = useNavigate();
  const list = useStore((s) => s.notifications);
  const set = useStore((s) => s.set);
  const markAll = () => set('notifications', list.map((x) => ({ ...x, read: true })));
  return (
    <div>
      <PageHeader back title="নোটিফিকেশন" right={list.length > 0 && <>
        <button aria-label="mark all read" onClick={markAll} className="tap p-2 text-brand"><CheckCheck size={22} /></button>
        <button aria-label="clear all" onClick={() => set('notifications', [])} className="tap p-2 text-muted"><Trash2 size={20} /></button>
      </>} />
      {list.length === 0 ? <Empty icon={<Bell size={36} />} title="কোনো নোটিফিকেশন নেই" sub="নামাজের অ্যালার্ম ও রিমাইন্ডার এখানে দেখাবে" action={<button className="btn-soft" onClick={() => nav('/alarm')}>অ্যালার্ম সেটিংস</button>} />
        : list.map((x) => (
          <button key={x.id} onClick={() => { set('notifications', list.map((y) => (y.id === x.id ? { ...y, read: true } : y))); if (x.link) nav(x.link); }}
            className={`flex w-full gap-4 border-b border-line px-5 py-4 text-left ${x.read ? 'bg-surface' : 'bg-chip/50'}`}>
            <span className="icon-circle mt-1 h-11 w-11 shrink-0 text-brand"><Bell size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[17px] text-ink">{x.title}{!x.read && <span className="h-2 w-2 rounded-full bg-alert" />}</span>
              <span className="block text-sm text-muted">{x.body}</span>
              <span className="mt-1 block text-xs text-muted">{ago(x.time)}</span>
            </span>
          </button>
        ))}
    </div>
  );
}
