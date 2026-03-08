'use client'
import { motion } from "framer-motion";
import { Shield, Lock, EyeOff, Server, XCircle, CheckCircle2, Fingerprint, WifiOff } from "lucide-react";

const privacyChecks = [
    { label: "Local-first storage", status: true, icon: WifiOff },
    { label: "End-to-end encryption", status: true, icon: Lock },
    { label: "Zero-knowledge architecture", status: true, icon: EyeOff },
    { label: "Server access to notes", status: false, icon: Server },
    { label: "Third-party data sharing", status: false, icon: XCircle },
];

const PrivacyDashboardMockup = () => (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/30 bg-[hsl(var(--green-badge))]/5 px-4 py-3">
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[hsl(var(--green-badge))]" />
                <span className="text-xs font-semibold text-foreground">Privacy Dashboard</span>
            </div>
            <div className="rounded-full bg-[hsl(var(--green-badge))]/15 px-2.5 py-1">
                <span className="text-[10px] font-semibold text-[hsl(var(--green-badge))]">Score: 100%</span>
            </div>
        </div>

        <div className="p-4 space-y-4">
            <div className="flex items-center justify-center py-4">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", delay: 0.3 }} className="relative">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--green-light))" strokeWidth="8" />
                        <motion.circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--green-badge))" strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52}
                            initial={{ strokeDashoffset: 2 * Math.PI * 52 }} whileInView={{ strokeDashoffset: 0 }} viewport={{ once: true }}
                            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }} transform="rotate(-90 60 60)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Fingerprint className="h-5 w-5 text-[hsl(var(--green-badge))] mb-1" />
                        <span className="text-2xl font-bold text-foreground">100</span>
                        <span className="text-[8px] text-muted-foreground">Privacy Score</span>
                    </div>
                </motion.div>
            </div>

            <div className="space-y-2">
                {privacyChecks.map((check, i) => (
                    <motion.div key={check.label} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.1 }} whileHover={{ x: 3 }}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 cursor-default ${check.status ? "bg-[hsl(var(--green-light))]/50 hover:bg-[hsl(var(--green-light))]" : "bg-[hsl(var(--peach-bg))]/50 hover:bg-[hsl(var(--peach-bg))]"}`}>
                        <div className="flex items-center gap-2">
                            <check.icon className={`h-3.5 w-3.5 ${check.status ? "text-[hsl(var(--green-badge))]" : "text-destructive/60"}`} />
                            <span className="text-[11px] font-medium text-foreground">{check.label}</span>
                        </div>
                        {check.status ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--green-badge))]" /> : <div className="rounded-full bg-destructive/10 px-2 py-0.5 text-[8px] font-medium text-destructive">Blocked</div>}
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }}
                className="rounded-xl bg-linear-to-r from-[hsl(var(--green-badge))]/10 to-accent/10 p-3 border border-[hsl(var(--green-badge))]/10 text-center">
                <Lock className="h-4 w-4 text-[hsl(var(--green-badge))] mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-foreground">AES-256 Encryption</p>
                <p className="text-[8px] text-muted-foreground">Military-grade protection for all your notes</p>
            </motion.div>
        </div>
    </motion.div>
);

export default PrivacyDashboardMockup;
