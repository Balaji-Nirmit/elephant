"use client"
import { motion } from "framer-motion";
import { StickyNote, CalendarDays, Flame, CheckCircle } from "lucide-react";
import { Note } from "@/hooks/useNotes";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { format, isSameMonth, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

interface CalendarStatsProps {
  notes: Note[];
  events: CalendarEvent[];
  currentMonth: Date;
}

const CalendarStats = ({ notes, events, currentMonth }: CalendarStatsProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Notes this month
  const notesThisMonth = notes.filter((note) => 
    isSameMonth(new Date(note.createdAt), currentMonth)
  ).length;

  // Events this month
  const eventsThisMonth = events.filter((event) => 
    isSameMonth(new Date(event.date), currentMonth)
  ).length;

  // Calculate streak (days with notes in a row ending today)
  const today = new Date();
  let streak = 0;
  const daysToCheck = eachDayOfInterval({ start: monthStart, end: today > monthEnd ? monthEnd : today }).reverse();
  
  for (const day of daysToCheck) {
    const hasNote = notes.some((note) => isSameDay(new Date(note.createdAt), day));
    const hasEvent = events.some((event) => isSameDay(new Date(event.date), day));
    if (hasNote || hasEvent) {
      streak++;
    } else {
      break;
    }
  }

  // Active days (days with at least one note or event)
  const activeDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((day) => {
    return notes.some((note) => isSameDay(new Date(note.createdAt), day)) ||
           events.some((event) => isSameDay(new Date(event.date), day));
  }).length;

  const stats = [
    { icon: StickyNote, label: "Notes", value: notesThisMonth, color: "text-blue-500" },
    { icon: CalendarDays, label: "Events", value: eventsThisMonth, color: "text-green-500" },
    { icon: Flame, label: "Streak", value: streak, suffix: "days", color: "text-orange-500" },
    { icon: CheckCircle, label: "Active Days", value: activeDays, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {stat.value}
              {stat.suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.suffix}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CalendarStats;
