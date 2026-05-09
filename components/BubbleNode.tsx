'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDateShort } from '@/lib/utils';
import type { BubbleEvent } from '@/lib/types';

interface Props {
  event: BubbleEvent;
  isPreTrip: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function BubbleNode({ event, isPreTrip, disabled, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    disabled: !!disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const dateLabel = event.endDate
    ? `${formatDateShort(event.date)}–${formatDateShort(event.endDate)}`
    : formatDateShort(event.date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col items-center gap-1.5 select-none ${disabled ? 'cursor-default' : 'cursor-pointer'} ${isDragging ? 'opacity-80' : ''}`}
      onClick={onClick}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      <span className="text-xs text-slate-400 whitespace-nowrap">{dateLabel}</span>
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 transition-transform ${
            disabled ? '' : 'hover:scale-110 active:scale-95'
          } ${isPreTrip ? 'border-dashed' : 'border-solid'}`}
          style={{
            backgroundColor: `${event.color}15`,
            borderColor: event.color,
          }}
        >
          {event.icon}
        </div>
        {disabled && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-slate-700 max-w-[80px] text-center leading-tight line-clamp-2">
        {event.title}
      </span>
    </div>
  );
}
