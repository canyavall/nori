import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const vaults = [
  {
    id: "1",
    name: "Frontend Patterns",
    path: "/Users/john/vaults/frontend",
    projectsConnected: 3,
    knowledgeEntries: 47,
    type: "local" as const,
  },
  {
    id: "2",
    name: "API Documentation",
    path: "/Users/john/vaults/api-docs",
    projectsConnected: 5,
    knowledgeEntries: 92,
    type: "git" as const,
  },
  {
    id: "3",
    name: "Design System",
    path: "/Users/john/vaults/design-system",
    projectsConnected: 2,
    knowledgeEntries: 31,
    type: "local" as const,
  },
  {
    id: "4",
    name: "Backend Architecture",
    path: "/Users/john/vaults/backend",
    projectsConnected: 4,
    knowledgeEntries: 68,
    type: "git" as const,
  },
];

export default function VaultsPage() {
  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Vaults</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaults.map((vault) => (
            <Link key={vault.id} to={`/vaults/${vault.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{vault.name}</CardTitle>
                    <Badge 
                      variant={vault.type === "git" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {vault.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Path</p>
                    <p className="text-sm font-mono text-gray-700 truncate">
                      {vault.path}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-gray-600">
                      Projects connected: <span className="font-medium text-gray-900">{vault.projectsConnected}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      Knowledge entries: <span className="font-medium text-gray-900">{vault.knowledgeEntries}</span>
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle sync action
                    }}
                  >
                    Sync
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
