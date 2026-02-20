"use client"
import { motion } from "framer-motion";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { Note } from "@/hooks/useNotes";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { Plus, Trash2 } from "lucide-react";

interface WeekViewProps {
  currentDate: Date;
  notes: Note[];
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onNoteClick: (noteId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const WeekView = ({ currentDate, notes, events, onDateClick, onNoteClick, onDeleteEvent }: WeekViewProps) => {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getNotesForDate = (date: Date) => 
    notes.filter((note) => isSameDay(new Date(note.createdAt), date));

  const getEventsForDate = (date: Date) =>
    events.filter((event) => isSameDay(new Date(event.date), date));

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-3 text-xs text-muted-foreground border-r border-border" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-3 text-center border-r border-border last:border-r-0 ${
              isToday(day) ? "bg-primary/10" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
            <p className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* All-day events section */}
      <div className="grid grid-cols-8 border-b border-border min-h-15">
        <div className="p-2 text-xs text-muted-foreground border-r border-border flex items-center justify-center">
          All day
        </div>
        {weekDays.map((day) => {
          const dayNotes = getNotesForDate(day);
          const dayEvents = getEventsForDate(day).filter(e => !e.time);
          
          return (
            <div
              key={day.toISOString()}
              className="p-1 border-r border-border last:border-r-0 space-y-1 min-h-15 cursor-pointer hover:bg-muted/50"
              onClick={() => onDateClick(day)}
            >
              {dayNotes.slice(0, 2).map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={(e) => { e.stopPropagation(); onNoteClick(note.id); }}
                  className="text-xs p-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 truncate cursor-pointer hover:bg-blue-500/30"
                >
                  {note.title || "Untitled"}
                </motion.div>
              ))}
              {dayEvents.slice(0, 2).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs p-1 rounded ${event.color}/20 truncate flex items-center justify-between group`}
                >
                  <span className="truncate">{event.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </motion.div>
              ))}
              {(dayNotes.length + dayEvents.length) > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{dayNotes.length + dayEvents.length - 4} more
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid - scrollable */}
      <div className="max-h-100 overflow-y-auto">
        {hours.slice(6, 22).map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0">
            <div className="p-2 text-xs text-muted-foreground border-r border-border text-right">
              {format(new Date().setHours(hour, 0), "h a")}
            </div>
            {weekDays.map((day) => {
              const hourEvents = events.filter((event) => {
                if (!event.time) return false;
                const eventHour = parseInt(event.time.split(":")[0]);
                return isSameDay(new Date(event.date), day) && eventHour === hour;
              });

              return (
                <div
                  key={day.toISOString()}
                  className="p-1 border-r border-border last:border-r-0 min-h-10 hover:bg-muted/30 cursor-pointer relative group"
                  onClick={() => onDateClick(day)}
                >
                  {hourEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs p-1 rounded ${event.color} text-white truncate flex items-center justify-between`}
                    >
                      <span className="truncate">{event.time} {event.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
