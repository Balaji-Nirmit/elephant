"use client"
import { NotesProvider } from "@/contexts/NotesContext"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"

const Layout = ({ children }:{children: React.ReactNode}) => {
    return (
        <>
            <NotesProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4"
                                />
                            </div>
                        </header> */}
                        <div className="flex flex-1 flex-col gap-4">
                           {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </NotesProvider>
        </>
    )
}
export default Layout