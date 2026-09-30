import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={wide ? { width: 'min(960px, 100%)' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    حاضر: 'badge-ok',
    متأخر: 'badge-warn',
    'انصراف مبكر': 'badge-warn',
    ناقص: 'badge-info',
    غائب: 'badge-danger',
    نشط: 'badge-ok',
    موقوف: 'badge-warn',
    منتهي: 'badge-muted',
    معلق: 'badge-warn',
    موافق: 'badge-ok',
    مرفوض: 'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
