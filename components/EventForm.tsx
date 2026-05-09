'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { DEFAULT_EVENT_TYPES } from '@/lib/types';
import type { BubbleEvent, CustomEventType } from '@/lib/types';

interface Props {
  tripId: string;
  tripStartDate: string;
  initialDate?: string;
  event?: BubbleEvent; // for editing
  onClose: () => void;
  onSaved: (event: BubbleEvent) => void;
}

export default function EventForm({ tripId, tripStartDate, initialDate, event, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(event?.date ?? initialDate ?? tripStartDate);
  const [endDate, setEndDate] = useState(event?.endDate ?? '');
  const [selectedType, setSelectedType] = useState(event?.type ?? 'activity');
  const [icon, setIcon] = useState(event?.icon ?? '🎯');
  const [color, setColor] = useState(event?.color ?? '#10B981');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [customTypes, setCustomTypes] = useState<CustomEventType[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.customTypes.toArray().then(setCustomTypes);
  }, []);

  function handleTypeSelect(type: string, ico: string, col: string) {
    setSelectedType(type);
    setIcon(ico);
    setColor(col);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) return;
    setSaving(true);

    const maxOrder = await db.events
      .where('tripId').equals(tripId)
      .toArray()
      .then(evs => evs.length > 0 ? Math.max(...evs.map(e => e.order)) + 1 : 0);

    const saved: BubbleEvent = {
      id: event?.id ?? generateId(),
      tripId,
      title,
      date,
      endDate: endDate || undefined,
      type: selectedType,
      icon,
      color,
      notes: notes || undefined,
      order: event?.order ?? maxOrder,
    };

    if (event) {
      await db.events.put(saved);
    } else {
      await db.events.add(saved);
    }

    onSaved(saved);
    setSaving(false);
  }

  const allTypes = [
    ...DEFAULT_EVENT_TYPES.map(t => ({ id: t.type, label: t.label, icon: t.icon, color: t.color })),
    ...customTypes.map(t => ({ id: t.id, label: t.label, icon: t.icon, color: t.color })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">{event ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Flight to Bangkok"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date <span className="text-slate-400 font-normal">(opt)</span></label>
              <input
                type="date"
                value={endDate}
                min={date}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {allTypes.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeSelect(t.id, t.icon, t.color)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedType === t.id
                      ? 'text-white border-transparent shadow-sm'
                      : 'text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={selectedType === t.id ? { backgroundColor: t.color, borderColor: t.color } : {}}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes, details, reminders..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : event ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
