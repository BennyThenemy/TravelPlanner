'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { db } from '@/lib/db';
import { blobToObjectURL } from '@/lib/utils';
import type { Trip, DefaultEventType } from '@/lib/types';
import DestinationInput from '@/components/DestinationInput';

const TRANSPORT_OPTIONS: { type: DefaultEventType; label: string; icon: string; color: string }[] = [
  { type: 'flight', label: 'Flight', icon: '✈️', color: '#3B82F6' },
  { type: 'car', label: 'Car', icon: '🚗', color: '#84CC16' },
  { type: 'public_transport', label: 'Public Transport', icon: '🚌', color: '#F97316' },
  { type: 'sailing', label: 'Sailing', icon: '⛵', color: '#06B6D4' },
  { type: 'other', label: 'Other', icon: '📌', color: '#6B7280' },
];

const TRANSPORT_TYPES = new Set(TRANSPORT_OPTIONS.map(o => o.type));

interface Props {
  trip: Trip;
  onClose: () => void;
  onSaved: (trip: Trip) => void;
}

export default function TripEditForm({ trip, onClose, onSaved }: Props) {
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [coverPhoto, setCoverPhoto] = useState<Blob | null>(trip.coverPhoto ?? null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    trip.coverPhoto ? blobToObjectURL(trip.coverPhoto) : null
  );
  const [transport, setTransport] = useState<DefaultEventType>('flight');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.events.where('tripId').equals(trip.id).toArray().then(events => {
      const mainEvent = events.find(e => e.isMainTransport);
      if (mainEvent && TRANSPORT_TYPES.has(mainEvent.type as DefaultEventType)) {
        setTransport(mainEvent.type as DefaultEventType);
      }
    });
  }, [trip.id]);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPhoto(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !destination || !startDate || !endDate) return;
    setSaving(true);
    const selected = TRANSPORT_OPTIONS.find(o => o.type === transport)!;
    const updated: Trip = {
      ...trip,
      name,
      destination,
      startDate,
      endDate,
      coverPhoto: coverPhoto ?? undefined,
    };
    await db.trips.put(updated);

    const events = await db.events.where('tripId').equals(trip.id).toArray();
    const mainEvents = events
      .filter(e => e.isMainTransport)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (mainEvents.length >= 1) {
      await db.events.update(mainEvents[0].id, {
        title: `arriving ${destination}`,
        date: startDate,
        type: selected.type,
        icon: selected.icon,
        color: selected.color,
      });
    }
    if (mainEvents.length >= 2) {
      await db.events.update(mainEvents[1].id, {
        title: `leaving ${destination}`,
        date: endDate,
        type: selected.type,
        icon: selected.icon,
        color: selected.color,
      });
    }

    onSaved(updated);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Trip Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trip Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <DestinationInput value={destination} onChange={setDestination} required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Getting there</label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setTransport(opt.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    transport === opt.type
                      ? 'text-white border-transparent shadow-sm'
                      : 'text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={transport === opt.type ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cover Photo <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleCoverChange} className="hidden" />
            {coverPreview ? (
              <div className="relative h-28 rounded-lg overflow-hidden">
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverPhoto(null); setCoverPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors"
              >
                <Upload size={18} />
                <span className="text-xs">Click to upload</span>
              </button>
            )}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
