import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Settings, Plus, Upload, Download, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import KnowledgeDetail from "./KnowledgeDetail";

const vaultData = {
  "1": {
    name: "Frontend Patterns",
    categories: {
      "Components": [
        { id: "k1", title: "Button Best Practices", category: "Components" },
        { id: "k2", title: "Form Validation", category: "Components" },
        { id: "k3", title: "Modal Patterns", category: "Components" },
      ],
      "State Management": [
        { id: "k4", title: "Redux Setup", category: "State Management" },
        { id: "k5", title: "Context API Guide", category: "State Management" },
      ],
      "Performance": [
        { id: "k6", title: "Code Splitting", category: "Performance" },
        { id: "k7", title: "Lazy Loading", category: "Performance" },
      ],
    },
  },
  "2": {
    name: "API Documentation",
    categories: {
      "REST APIs": [
        { id: "k8", title: "Authentication Flow", category: "REST APIs" },
        { id: "k9", title: "Error Handling", category: "REST APIs" },
      ],
      "GraphQL": [
        { id: "k10", title: "Schema Design", category: "GraphQL" },
        { id: "k11", title: "Query Optimization", category: "GraphQL" },
      ],
    },
  },
  "3": {
    name: "Design System",
    categories: {
      "Typography": [
        { id: "k12", title: "Font Scale", category: "Typography" },
        { id: "k13", title: "Line Height Guidelines", category: "Typography" },
      ],
      "Colors": [
        { id: "k14", title: "Color Palette", category: "Colors" },
        { id: "k15", title: "Accessibility", category: "Colors" },
      ],
    },
  },
  "4": {
    name: "Backend Architecture",
    categories: {
      "Database": [
        { id: "k16", title: "Schema Design", category: "Database" },
        { id: "k17", title: "Indexing Strategy", category: "Database" },
      ],
      "Security": [
        { id: "k18", title: "JWT Implementation", category: "Security" },
        { id: "k19", title: "Rate Limiting", category: "Security" },
      ],
    },
  },
};

export default function VaultDetailPage() {
  const { vaultId } = useParams();
  const navigate = useNavigate();
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const vault = vaultData[vaultId as keyof typeof vaultData];

  if (!vault) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Vault not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sub-header */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/vaults")}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold">{vault.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Link Projects
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Vault Settings
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-white flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Knowledge List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {Object.entries(vault.categories).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 px-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {items
                      .filter((item) =>
                        searchQuery === "" ||
                        item.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedKnowledgeId(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedKnowledgeId === item.id
                              ? "bg-blue-50 text-blue-900 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {selectedKnowledgeId ? (
            <KnowledgeDetail knowledgeId={selectedKnowledgeId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Select a knowledge entry to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
