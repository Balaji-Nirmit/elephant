"use client"
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  StickyNote, 
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  CalendarDays,
  Plus,
  Trash2
} from "lucide-react";
import { useNotesContext } from "@/contexts/NotesContext";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import CalendarStats from "@/components/calendar/CalendarStats";
import EventModal from "@/components/calendar/EventModal";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import AgendaView from "@/components/calendar/AgendaView";

interface CalendarPageProps {
  onNavigate: (nav: string, noteId?: string) => void;
}

type ViewMode = "month" | "week" | "day" | "agenda";

const CalendarPage = ({ onNavigate }: CalendarPageProps) => {
  const { notes } = useNotesContext();
  const { events, createEvent, deleteEvent } = useCalendarEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const currentMonth = useMemo(() => {
    return startOfMonth(currentDate);
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const notesForDate = (date: Date) => {
    return notes.filter((note) => isSameDay(new Date(note.createdAt), date));
  };

  const eventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  const selectedDateNotes = selectedDate ? notesForDate(selectedDate) : [];
  const selectedDateEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month" || viewMode === "agenda") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === "month") {
      // Double-click to add event
    }
  };

  const handleAddEvent = () => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: { title: string; time?: string; color: string; description?: string }) => {
    createEvent({
      ...eventData,
      date: (selectedDate || new Date()).toISOString(),
    });
  };

  const handleNoteClick = (noteId: string) => {
    onNavigate("ideas", noteId);
  };

  const viewModes = [
    { id: "month", icon: LayoutGrid, label: "Month" },
    { id: "week", icon: CalendarDays, label: "Week" },
    { id: "day", icon: CalendarIcon, label: "Day" },
    { id: "agenda", icon: List, label: "Agenda" },
  ];

  const getTitle = () => {
    if (viewMode === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <div className="flex-1 h-full bg-background overflow-y-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Calendar</h1>
              <p className="text-muted-foreground">View and manage your schedule</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button size="sm" onClick={handleAddEvent}>
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <mode.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <CalendarStats notes={notes} events={events} currentMonth={currentMonth} />

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <button
            onClick={() => navigate("prev")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{getTitle()}</h2>
          <button
            onClick={() => navigate("next")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Calendar Views */}
        {viewMode === "month" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Month Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 bg-card rounded-xl border border-border p-6"
            >
              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayNotes = notesForDate(day);
                  const dayEvents = eventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const hasItems = dayNotes.length > 0 || dayEvents.length > 0;

                  return (
                    <motion.button
                      key={day.toISOString()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.005 }}
                      onClick={() => handleDateClick(day)}
                      onDoubleClick={() => { setSelectedDate(day); setIsEventModalOpen(true); }}
                      className={`
                        aspect-square p-1 rounded-lg text-sm relative transition-colors flex flex-col items-center
                        ${isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"}
                        ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                        ${isToday && !isSelected ? "ring-2 ring-primary" : ""}
                      `}
                    >
                      <span className="mb-1">{format(day, "d")}</span>
                      {hasItems && (
                        <div className="flex gap-0.5">
                          {dayNotes.length > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-blue-500"}`} />
                          )}
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <span
                              key={event.id}
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : event.color.replace("bg-", "bg-")}`}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Selected Date Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                </h3>
                {selectedDate && (
                  <Button size="sm" variant="ghost" onClick={() => setIsEventModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {selectedDate ? (
                <div className="space-y-4">
                  {/* Events */}
                  {selectedDateEvents.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Events</p>
                      <div className="space-y-2">
                        {selectedDateEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-lg ${event.color} text-white flex items-center justify-between group`}
                          >
                            <div>
                              <p className="font-medium">{event.title}</p>
                              {event.time && (
                                <p className="text-xs opacity-80">{event.time}</p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedDateNotes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                      <div className="space-y-2">
                        {selectedDateNotes.map((note) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleNoteClick(note.id)}
                            className="p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                          >
                            <h4 className="font-medium truncate">{note.title || "Untitled"}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {note.blocks.find((b) => b.content)?.content || "No content"}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDateNotes.length === 0 && selectedDateEvents.length === 0 && (
                    <div className="text-center py-8">
                      <StickyNote className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No items on this date</p>
                      <Button size="sm" variant="outline" onClick={() => setIsEventModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Click on a date to see details
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {viewMode === "week" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <WeekView
              currentDate={currentDate}
              notes={notes}
              events={events}
              onDateClick={(date) => { setSelectedDate(date); setIsEventModalOpen(true); }}
              onNoteClick={handleNoteClick}
              onDeleteEvent={deleteEvent}
            />
          </motion.div>
        )}

        {viewMode === "day" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <DayView
              currentDate={currentDate}
              notes={notes}
              events={events}
              onAddEvent={() => { setSelectedDate(currentDate); setIsEventModalOpen(true); }}
              onNoteClick={handleNoteClick}
              onDeleteEvent={deleteEvent}
            />
          </motion.div>
        )}

        {viewMode === "agenda" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <AgendaView
              currentMonth={currentMonth}
              notes={notes}
              events={events}
              onNoteClick={handleNoteClick}
              onDeleteEvent={deleteEvent}
            />
          </motion.div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate || new Date()}
      />
    </div>
  );
};

export default CalendarPage;
