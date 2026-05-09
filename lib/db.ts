import Dexie from 'dexie';
import type { Trip, BubbleEvent, CustomEventType, Attachment } from './types';

class TravelDB extends Dexie {
  trips: Dexie.Table<Trip, string>;
  events: Dexie.Table<BubbleEvent, string>;
  customTypes: Dexie.Table<CustomEventType, string>;
  attachments: Dexie.Table<Attachment, string>;

  constructor() {
    super('TravelPlanner');
    this.version(1).stores({
      trips: 'id, startDate, endDate, createdAt',
      events: 'id, tripId, date, order',
      customTypes: 'id',
      attachments: 'id, eventId',
    });
    this.trips = this.table('trips');
    this.events = this.table('events');
    this.customTypes = this.table('customTypes');
    this.attachments = this.table('attachments');
  }
}

export const db = new TravelDB();
