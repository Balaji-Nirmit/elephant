"use client"
import { motion } from "framer-motion";
import { format, isSameDay, isToday } from "date-fns";
import { Note, NoteIndex, NoteBlock } from "@/lib/types";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { Plus, Trash2, StickyNote, Clock } from "lucide-react";

interface DayViewProps {
  currentDate: Date;
  notes: NoteIndex[];
  events: CalendarEvent[];
  onAddEvent: () => void;
  onNoteClick: (noteId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  getNoteById?: (id: string) => Note | undefined;
}

const DayView = ({ currentDate, notes, events, onAddEvent, onNoteClick, onDeleteEvent, getNoteById }: DayViewProps) => {
  const dayNotes = notes.filter((note) => isSameDay(new Date(note.createdAt), currentDate));
  const dayEvents = events.filter((event) => isSameDay(new Date(event.date), currentDate));
  
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) =>
    dayEvents.filter((event) => {
      if (!event.time) return false;
      const eventHour = parseInt(event.time.split(":")[0]);
      return eventHour === hour;
    });

  const allDayEvents = dayEvents.filter((e) => !e.time);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className={`p-6 border-b border-border ${isToday(currentDate) ? "bg-primary/10" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{format(currentDate, "EEEE")}</p>
            <h2 className="text-3xl font-bold">{format(currentDate, "MMMM d, yyyy")}</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddEvent}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </motion.button>
        </div>
      </div>

      {/* All-day events and notes */}
      {(allDayEvents.length > 0 || dayNotes.length > 0) && (
        <div className="p-4 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">All Day</p>
          <div className="space-y-2">
            {allDayEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg ${event.color} text-white flex items-center justify-between`}
              >
                <span className="font-medium">{event.title}</span>
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            {dayNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onNoteClick(note.id)}
                className="p-3 rounded-lg bg-card border border-border flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors"
              >
                <StickyNote className="w-4 h-4 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{note.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getNoteById?.(note.id)?.blocks.find((b: NoteBlock) => b.content)?.content || "No content"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="max-h-125 overflow-y-auto">
        {hours.slice(6, 22).map((hour) => {
          const hourEvents = getEventsForHour(hour);
          
          return (
            <div
              key={hour}
              className="flex border-b border-border last:border-b-0 min-h-15 hover:bg-muted/20 transition-colors"
            >
              <div className="w-20 p-3 text-sm text-muted-foreground border-r border-border shrink-0">
                {format(new Date().setHours(hour, 0), "h:mm a")}
              </div>
              <div className="flex-1 p-2 space-y-1">
                {hourEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-3 rounded-lg ${event.color} text-white flex items-center justify-between group`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{event.title}</span>
                      {event.description && (
                        <span className="text-sm opacity-80">- {event.description}</span>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
