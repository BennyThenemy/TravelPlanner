'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, FileDown, Settings } from 'lucide-react';
import { db } from '@/lib/db';
import { formatDate, blobToObjectURL } from '@/lib/utils';
import type { Trip, BubbleEvent } from '@/lib/types';
import Timeline from '@/components/Timeline';
import TripEditForm from '@/components/TripEditForm';

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [events, setEvents] = useState<BubbleEvent[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    db.trips.get(id).then(t => {
      if (!t) { router.push('/'); return; }
      setTrip(t);
      if (t.coverPhoto) {
        const url = blobToObjectURL(t.coverPhoto);
        setCoverUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    });
    db.events.where('tripId').equals(id).toArray().then(setEvents);
  }, [id, router]);

  async function handleExportPDF() {
    if (!trip) return;
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

      // Header
      doc.setFontSize(22);
      doc.setTextColor(55, 65, 81);
      doc.text(trip.name, 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(`${trip.destination}  •  ${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`, 14, 30);

      // Events list
      doc.setFontSize(10);
      let y = 45;
      sorted.forEach((ev, i) => {
        if (y > 185) { doc.addPage(); y = 20; }
        const label = ev.date < trip.startDate ? '[Pre-trip] ' : '';
        doc.setTextColor(99, 102, 241);
        doc.text(`${ev.icon} ${label}${ev.title}`, 14, y);
        doc.setTextColor(107, 114, 128);
        doc.text(formatDate(ev.date) + (ev.endDate ? ` – ${formatDate(ev.endDate)}` : ''), 160, y);
        if (ev.notes) {
          y += 5;
          doc.setTextColor(75, 85, 99);
          doc.setFontSize(8);
          const lines = doc.splitTextToSize(ev.notes, 230);
          doc.text(lines.slice(0, 2), 20, y);
          doc.setFontSize(10);
        }
        y += 10;
      });

      doc.save(`${trip.name.replace(/\s+/g, '-')}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ArrowLeft size={18} />
          </button>

          {coverUrl && (
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
              <img src={coverUrl} alt={trip.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-800 leading-tight truncate">{trip.name}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={10} />{trip.destination}</span>
              <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
            </div>
          </div>

          <button
            onClick={() => setEditingTrip(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
            title="Trip settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <FileDown size={15} />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      {/* Timeline */}
      <div ref={timelineRef} className="flex-1 flex flex-col overflow-hidden">
        <Timeline trip={trip} events={events} onEventsChange={setEvents} />
      </div>

      {editingTrip && (
        <TripEditForm
          trip={trip}
          onClose={() => setEditingTrip(false)}
          onSaved={async (updated) => {
            setTrip(updated);
            if (updated.coverPhoto) setCoverUrl(blobToObjectURL(updated.coverPhoto));
            else setCoverUrl(null);
            const freshEvents = await db.events.where('tripId').equals(updated.id).toArray();
            setEvents(freshEvents);
            setEditingTrip(false);
          }}
        />
      )}
    </div>
  );
}
