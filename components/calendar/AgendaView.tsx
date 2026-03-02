"use client"
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, isBefore, addDays } from "date-fns";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { StickyNote, Clock, Calendar, Trash2 } from "lucide-react";
import { Note, NoteIndex } from "@/lib/types";

interface AgendaViewProps {
  currentMonth: Date;
  notes: NoteIndex[];
  events: CalendarEvent[];
  onNoteClick: (noteId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  getNoteById?: (id: string) => Note | undefined;
}

interface AgendaItem {
  id: string;
  type: "note" | "event";
  title: string;
  date: Date;
  time?: string;
  color?: string;
  description?: string;
  noteId?: string;
}

const AgendaView = ({ currentMonth, notes, events, onNoteClick, onDeleteEvent, getNoteById }: AgendaViewProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const today = new Date();
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create agenda items
  const getAgendaItems = (date: Date): AgendaItem[] => {
    const items: AgendaItem[] = [];

    // Add notes
    notes.forEach((note) => {
      if (isSameDay(new Date(note.createdAt), date)) {
        items.push({
          id: note.id,
          type: "note",
          title: note.title || "Untitled",
          date: new Date(note.createdAt),
          noteId: note.id,
        });
      }
    });

    // Add events
    events.forEach((event) => {
      if (isSameDay(new Date(event.date), date)) {
        items.push({
          id: event.id,
          type: "event",
          title: event.title,
          date: new Date(event.date),
          time: event.time,
          color: event.color,
          description: event.description,
        });
      }
    });

    // Sort by time
    return items.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  };

  // Filter to only days with items
  const daysWithItems = daysInMonth.filter((day) => getAgendaItems(day).length > 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")} Agenda</h3>
        <p className="text-sm text-muted-foreground">
          {daysWithItems.length} days with activities
        </p>
      </div>

      <div className="max-h-150 overflow-y-auto divide-y divide-border">
        {daysWithItems.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No events or notes this month</p>
          </div>
        ) : (
          daysWithItems.map((day, dayIndex) => {
            const items = getAgendaItems(day);
            const isPast = isBefore(day, today) && !isSameDay(day, today);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.02 }}
                className={`p-4 ${isPast ? "opacity-60" : ""} ${isToday ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <span className="text-xs font-medium">{format(day, "EEE")}</span>
                    <span className="text-lg font-bold">{format(day, "d")}</span>
                  </div>
                  <div>
                    <p className="font-medium">{format(day, "EEEE")}</p>
                    <p className="text-sm text-muted-foreground">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 ml-15">
                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIndex * 0.02 + itemIndex * 0.01 }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        item.type === "event"
                          ? `${item.color}/20 hover:${item.color}/30`
                          : "bg-muted hover:bg-muted/80"
                      } ${item.type === "note" ? "cursor-pointer" : ""} group`}
                      onClick={() => item.type === "note" && item.noteId && onNoteClick(item.noteId)}
                    >
                      {item.type === "note" ? (
                        <StickyNote className="w-5 h-5 text-blue-500 shrink-0" />
                      ) : (
                        <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{item.title}</p>
                          {item.time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.time}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        )}
                      </div>

                      {item.type === "event" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteEvent(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AgendaView;
