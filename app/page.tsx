'use client';

import { useEffect, useState } from 'react';
import { Plus, Globe } from 'lucide-react';
import { db } from '@/lib/db';
import type { Trip } from '@/lib/types';
import TripCard from '@/components/TripCard';
import TripForm from '@/components/TripForm';

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.trips.orderBy('createdAt').reverse().toArray().then(t => {
      setTrips(t);
      setLoaded(true);
    });
  }, []);

  async function handleDelete(id: string) {
    await db.events.where('tripId').equals(id).delete();
    await db.trips.delete(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-lg">TripPlanner</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={16} />
            New Trip
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loaded && trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Globe size={36} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">No trips yet</h2>
              <p className="text-slate-500 text-sm mt-1">Plan your first adventure</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Plus size={16} />
              Create a Trip
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">My Trips</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </main>

      {showForm && (
        <TripForm
          onClose={() => setShowForm(false)}
          onCreated={(trip) => {
            setTrips(prev => [trip, ...prev]);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
