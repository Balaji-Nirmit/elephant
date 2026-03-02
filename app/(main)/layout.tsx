"use client";

import { NotesProvider } from "@/contexts/NotesContext";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <NotesProvider>
      <SidebarProvider>

        {/* 🔥 LOCK APP HEIGHT */}
        <div className="flex h-screen w-screen overflow-hidden">

          <AppSidebar />

          {/* 🔥 VERY IMPORTANT */}
          <SidebarInset className="flex flex-1 flex-col min-h-0 overflow-hidden">
            {children}
          </SidebarInset>

        </div>

      </SidebarProvider>
    </NotesProvider>
  );
};

export default Layout;