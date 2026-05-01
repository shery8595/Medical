import { Outlet } from "react-router-dom";
import { SidebarSponsor } from "./SidebarSponsor";

export function LayoutSponsor() {
  return (
    <div className="text-slate-900 min-h-screen flex antialiased bg-white overflow-hidden">
      <SidebarSponsor />
      <div className="flex-1 max-w-full relative h-[100dvh]">
          <Outlet />
      </div>
    </div>
  );
}
