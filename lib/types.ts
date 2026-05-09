export type DefaultEventType = 'flight' | 'accommodation' | 'activity' | 'task' | 'other' | 'sailing' | 'public_transport' | 'car';

export const DEFAULT_EVENT_TYPES: { type: DefaultEventType; label: string; icon: string; color: string }[] = [
  { type: 'flight', label: 'Flight', icon: '✈️', color: '#3B82F6' },
  { type: 'accommodation', label: 'Accommodation', icon: '🏨', color: '#8B5CF6' },
  { type: 'activity', label: 'Activity', icon: '🎯', color: '#10B981' },
  { type: 'task', label: 'Task', icon: '✅', color: '#F59E0B' },
  { type: 'sailing', label: 'Sailing', icon: '⛵', color: '#06B6D4' },
  { type: 'public_transport', label: 'Public Transport', icon: '🚌', color: '#F97316' },
  { type: 'car', label: 'Car', icon: '🚗', color: '#84CC16' },
  { type: 'other', label: 'Other', icon: '📌', color: '#6B7280' },
];

export interface CustomEventType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  coverPhoto?: Blob;
  createdAt: string;
}

export interface Attachment {
  id: string;
  eventId: string;
  name: string;
  size: number;
  mimeType: string;
  blob: Blob;
}

export interface BubbleEvent {
  id: string;
  tripId: string;
  title: string;
  date: string;      // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD (for multi-day events)
  type: string;      // DefaultEventType or CustomEventType.id
  icon: string;      // emoji
  color: string;     // hex
  notes?: string;
  order: number;     // tie-breaker for same-date events
  isMainTransport?: boolean; // locked arrival/departure bubble, managed by trip settings
}
