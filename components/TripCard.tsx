'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Trash2 } from 'lucide-react';
import type { Trip } from '@/lib/types';
import { formatDate, blobToObjectURL } from '@/lib/utils';

interface Props {
  trip: Trip;
  onDelete: (id: string) => void;
}

export default function TripCard({ trip, onDelete }: Props) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (trip.coverPhoto) {
      const url = blobToObjectURL(trip.coverPhoto);
      setCoverUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [trip.coverPhoto]);

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="h-40 bg-gradient-to-br from-indigo-400 to-teal-400 relative overflow-hidden">
          {coverUrl && (
            <img src={coverUrl} alt={trip.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <MapPin size={13} />
              <span>{trip.destination}</span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 text-lg leading-tight">{trip.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-slate-500 text-sm">
            <Calendar size={13} />
            <span>{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); onDelete(trip.id); }}
        className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-500 hover:bg-white"
        title="Delete trip"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
