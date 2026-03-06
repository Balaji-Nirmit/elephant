"use client";

import { useEffect, useState } from "react";
import { StorageEngine, SyncStatus, SyncProgress } from "@/lib/storage-engine";
import { Cloud, CloudOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const SyncStatusIndicator = () => {
    const [status, setStatus] = useState<SyncStatus>("synced");
    const [prog, setProg] = useState<SyncProgress>({ current: 0, total: 0 });

    useEffect(() => {
        StorageEngine.onStatusChange(setStatus);
        StorageEngine.onProgressChange(setProg);
    }, []);

    const config = {
        synced: {
            icon: CheckCircle2,
            text: "Synced",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            dot: "bg-emerald-500"
        },
        syncing: {
            icon: Cloud,
            text: prog.total > 1 ? `Syncing ${prog.current}/${prog.total}` : "Updating...",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            dot: "bg-blue-500 animate-pulse"
        },
        error: {
            icon: AlertCircle,
            text: "Sync Paused",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            dot: "bg-amber-500"
        },
        offline: {
            icon: CloudOff,
            text: "Offline",
            color: "text-zinc-400",
            bg: "bg-zinc-100",
            dot: "bg-zinc-400"
        },
    };

    const active = config[status];
    const Icon = active.icon;

    return (
        <div className="px-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg shadow-sm", active.bg)}>
                        <Icon className={cn("h-3.5 w-3.5", active.color)} />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight text-foreground/80">
                        {active.text}
                    </span>
                </div>
                {/* Minimalist Status Dot */}
                <div className={cn("h-1.5 w-1.5 rounded-full ring-4 ring-background", active.dot)} />
            </div>

            {status === "syncing" && prog.total > 0 && (
                <div className="space-y-1.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                            className="h-full bg-blue-500 transition-all duration-700 ease-in-out"
                            style={{ width: `${(prog.current / prog.total) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] font-medium tabular-nums text-muted-foreground/60">
                        <span>{Math.round((prog.current / prog.total) * 100)}% complete</span>
                        <span>{prog.current} of {prog.total}</span>
                    </div>
                </div>
            )}
        </div>
    );
};