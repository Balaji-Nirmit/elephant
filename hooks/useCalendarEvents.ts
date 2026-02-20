import { useState, useEffect, useCallback } from "react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  time?: string; // HH:mm format
  color: string;
  description?: string;
  createdAt: string;
}

const EVENTS_KEY = "elephant-calendar-events";

const getStoredEvents = (): CalendarEvent[] => {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(getStoredEvents);

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  const createEvent = useCallback((event: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      )
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split("T")[0];
      return events.filter((event) => event.date.split("T")[0] === dateStr);
    },
    [events]
  );

  const getEventsForMonth = useCallback(
    (year: number, month: number) => {
      return events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      });
    },
    [events]
  );

  return {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
  };
};
