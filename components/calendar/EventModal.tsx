"use client"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Type, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: { title: string; time?: string; color: string; description?: string }) => void;
  selectedDate: Date;
  initialEvent?: { title: string; time?: string; color: string; description?: string };
}

const EVENT_COLORS = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Red", value: "bg-red-500" },
];

const EventModal = ({ isOpen, onClose, onSave, selectedDate, initialEvent }: EventModalProps) => {
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [time, setTime] = useState(initialEvent?.time || "");
  const [color, setColor] = useState(initialEvent?.color || "bg-blue-500");
  const [description, setDescription] = useState(initialEvent?.description || "");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), time: time || undefined, color, description: description || undefined });
    setTitle("");
    setTime("");
    setColor("bg-blue-500");
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {initialEvent ? "Edit Event" : "New Event"}
                </h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Type className="w-4 h-4" /> Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title..."
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time (optional)
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Color
                  </label>
                  <div className="flex gap-2 mt-2">
                    {EVENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full ${c.value} transition-all ${
                          color === c.value ? "ring-2 ring-offset-2 ring-primary ring-offset-background" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">Description (optional)</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1" disabled={!title.trim()}>
                  Save Event
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
