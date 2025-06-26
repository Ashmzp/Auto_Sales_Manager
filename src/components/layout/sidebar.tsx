
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  useSidebar, // Import useSidebar hook
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Car, Users, ShoppingCart, Archive, FileText, SettingsIcon, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"; // Added PanelLeftClose, PanelLeftOpen
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/stock", label: "Stock", icon: Archive },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function SidebarToggleDesktop() {
  const { state, toggleSidebar } = useSidebar();

  if (state === null) return null; // Or a skeleton

  return (
    <Button
      variant="ghost"
      className="w-full justify-start mt-2 p-2 h-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square"
      onClick={toggleSidebar}
      title={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {state === 'expanded' ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
      <span className="ml-2 group-data-[collapsible=icon]:hidden">
        {state === 'expanded' ? 'Collapse' : 'Expand'}
      </span>
    </Button>
  );
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="border-r border-border/50 shadow-md"
      >
        <SidebarHeader className="p-4 flex flex-col items-center group-data-[collapsible=icon]:items-center">
           <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <Car className="h-8 w-8 text-primary" />
             <span className="font-headline text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">AutoSales</span>
           </Link>
        </SidebarHeader>
        <SidebarContent className="flex-grow p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      pathname.startsWith(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                    tooltip={{
                      children: item.label,
                      className: "bg-card text-card-foreground border-border shadow-sm",
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50 group-data-[collapsible=icon]:p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:aspect-square">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <span className="ml-2 font-medium group-data-[collapsible=icon]:hidden">Admin User</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Desktop Sidebar Toggle Button */}
          <div className="hidden md:block"> {/* Only show on md screens and up */}
            <SidebarToggleDesktop />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card px-4 shadow-sm md:justify-end">
           <div className="md:hidden"> {/* This is the mobile toggle trigger */}
             <SidebarTrigger>
                <Menu className="h-6 w-6" />
             </SidebarTrigger>
           </div>
           {/* Add any header content for desktop view here, e.g., search bar, notifications */}
           <div className="flex items-center gap-4">
            {/* Placeholder for User Profile / Actions in header for desktop if needed */}
           </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

