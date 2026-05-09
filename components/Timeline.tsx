'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, Plane } from 'lucide-react';
import { db } from '@/lib/db';
import { interpolateDate } from '@/lib/utils';
import type { BubbleEvent, Trip } from '@/lib/types';
import BubbleNode from './BubbleNode';
import EventModal from './EventModal';
import EventForm from './EventForm';

interface Props {
  trip: Trip;
  events: BubbleEvent[];
  onEventsChange: (events: BubbleEvent[]) => void;
}

export default function Timeline({ trip, events, onEventsChange }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<BubbleEvent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addInitialDate, setAddInitialDate] = useState<string | undefined>();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const sorted = [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.order - b.order;
  });

  const tripStartIdx = sorted.findIndex(e => e.date >= trip.startDate);
  const hasSeparator = sorted.some(e => e.date < trip.startDate) && sorted.some(e => e.date >= trip.startDate);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeEvent = sorted.find(e => e.id === active.id);
    if (activeEvent?.isMainTransport) return;

    const oldIdx = sorted.findIndex(e => e.id === active.id);
    const newIdx = sorted.findIndex(e => e.id === over.id);
    const reordered = arrayMove(sorted, oldIdx, newIdx);

    // Calculate new date for dragged event based on neighbors
    const actualNewIdx = reordered.findIndex(e => e.id === active.id);
    const prev = reordered[actualNewIdx - 1];
    const next = reordered[actualNewIdx + 1];
    const newDate = interpolateDate(prev?.date, next?.date);

    const updated = reordered.map((e, i) => ({ ...e, order: i }));
    const draggedIdx = updated.findIndex(e => e.id === active.id);
    updated[draggedIdx] = { ...updated[draggedIdx], date: newDate };

    // Persist
    await Promise.all(updated.map(e => db.events.put(e)));
    onEventsChange(updated);
  }

  function handleAddAt(date?: string) {
    setAddInitialDate(date);
    setShowAddForm(true);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <span className="text-sm text-slate-500">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => handleAddAt(trip.startDate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium"
        >
          <Plus size={15} />
          Add Event
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-h-full flex items-center px-8 py-10">
          {events.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Plane size={24} className="text-slate-300" />
              </div>
              <p className="text-sm">No events yet</p>
              <button
                onClick={() => handleAddAt(trip.startDate)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Add your first event
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sorted.map(e => e.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex items-center gap-0">
                  {sorted.map((event, idx) => {
                    const isPreTrip = event.date < trip.startDate;
                    const showSep = hasSeparator && idx === tripStartIdx;

                    return (
                      <div key={event.id} className="flex items-center">
                        {/* Trip start separator */}
                        {showSep && (
                          <div className="flex flex-col items-center mx-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-px h-12 bg-indigo-300" />
                              <div className="px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full whitespace-nowrap flex items-center gap-1">
                                <Plane size={10} />
                                Trip Starts
                              </div>
                              <div className="w-px h-12 bg-indigo-300" />
                            </div>
                          </div>
                        )}

                        {/* Connector line before */}
                        {idx > 0 && !showSep && (
                          <div className="w-8 h-px bg-slate-200 flex-shrink-0" />
                        )}

                        <BubbleNode
                          event={event}
                          isPreTrip={isPreTrip}
                          disabled={!!event.isMainTransport}
                          onClick={() => setSelectedEvent(event)}
                        />
                      </div>
                    );
                  })}

                  {/* Add button at end */}
                  <div className="flex items-center">
                    <div className="w-8 h-px bg-slate-200 flex-shrink-0" />
                    <button
                      onClick={() => handleAddAt(sorted[sorted.length - 1]?.date)}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          tripStartDate={trip.startDate}
          onClose={() => setSelectedEvent(null)}
          onUpdated={(updated) => {
            onEventsChange(events.map(e => e.id === updated.id ? updated : e));
            setSelectedEvent(updated);
          }}
          onDeleted={(id) => {
            onEventsChange(events.filter(e => e.id !== id));
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Add event form */}
      {showAddForm && (
        <EventForm
          tripId={trip.id}
          tripStartDate={trip.startDate}
          initialDate={addInitialDate}
          onClose={() => setShowAddForm(false)}
          onSaved={(event) => {
            onEventsChange([...events, event]);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}
