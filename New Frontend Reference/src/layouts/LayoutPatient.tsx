import { Outlet } from "react-router-dom";
import { SidebarPatient } from "./SidebarPatient";

export function LayoutPatient() {
  return (
    <div className="text-on-background min-h-screen flex antialiased bg-surface overflow-hidden">
      <SidebarPatient />
      <div className="flex-1 max-w-full relative h-[100dvh]">
          <Outlet />
      </div>
    </div>
  );
}
