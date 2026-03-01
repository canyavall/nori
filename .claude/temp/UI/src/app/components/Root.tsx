import { Outlet } from "react-router";
import TopNavigation from "./TopNavigation";

export default function Root() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopNavigation />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
