import { Link, useLocation } from "react-router";
import { Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

export default function TopNavigation() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/projects") {
      return location.pathname === "/" || location.pathname === "/projects";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-semibold text-xl">
          Nori
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            to="/vaults" 
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isActive("/vaults") 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Vaults
          </Link>
          <Link 
            to="/projects" 
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isActive("/projects") 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Projects
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-blue-500 text-white text-sm">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
