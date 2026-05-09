'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Edit2, Trash2, Paperclip, Download, Upload, Settings } from 'lucide-react';
import { db } from '@/lib/db';
import { generateId, formatDate, formatDateShort, formatFileSize, blobToObjectURL } from '@/lib/utils';
import type { BubbleEvent, Attachment } from '@/lib/types';
import EventForm from './EventForm';

interface Props {
  event: BubbleEvent;
  tripStartDate: string;
  onClose: () => void;
  onUpdated: (event: BubbleEvent) => void;
  onDeleted: (id: string) => void;
}

export default function EventModal({ event, tripStartDate, onClose, onUpdated, onDeleted }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.attachments.where('eventId').equals(event.id).toArray().then(setAttachments);
  }, [event.id]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: Attachment[] = files.map(f => ({
      id: generateId(),
      eventId: event.id,
      name: f.name,
      size: f.size,
      mimeType: f.type,
      blob: f,
    }));
    await db.attachments.bulkAdd(newAttachments);
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  }

  async function handleDeleteAttachment(id: string) {
    await db.attachments.delete(id);
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  function downloadAttachment(attachment: Attachment) {
    const url = blobToObjectURL(attachment.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    await db.attachments.where('eventId').equals(event.id).delete();
    await db.events.delete(event.id);
    onDeleted(event.id);
  }

  const isPreTrip = event.date < tripStartDate;
  const dateLabel = event.endDate
    ? `${formatDateShort(event.date)} — ${formatDateShort(event.endDate)}`
    : formatDate(event.date);

  if (editing) {
    return (
      <EventForm
        tripId={event.tripId}
        tripStartDate={tripStartDate}
        event={event}
        onClose={() => setEditing(false)}
        onSaved={(updated) => { onUpdated(updated); setEditing(false); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${event.color}20` }}
              >
                {event.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 leading-tight">{event.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-slate-500">{dateLabel}</span>
                  {isPreTrip && (
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200">Pre-trip</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!event.isMainTransport && (
                <>
                  <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-500 disabled:opacity-50">
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {event.isMainTransport && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Settings size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500">Managed via trip settings</span>
            </div>
          )}
          {event.notes && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{event.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Attachments</h3>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Upload size={12} />
                Add files
              </button>
              <input type="file" multiple ref={fileRef} onChange={handleFileUpload} className="hidden" />
            </div>
            {attachments.length === 0 ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-16 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors"
              >
                <Paperclip size={16} />
                <span className="text-xs">Attach tickets, docs, photos</span>
              </button>
            ) : (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg group">
                    <Paperclip size={14} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{att.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(att.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => downloadAttachment(att)} className="p-1 hover:bg-white rounded text-slate-500">
                        <Download size={13} />
                      </button>
                      <button onClick={() => handleDeleteAttachment(att.id)} className="p-1 hover:bg-white rounded text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
