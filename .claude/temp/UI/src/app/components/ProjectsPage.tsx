import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const noriProjects = [
  {
    id: "1",
    name: "E-commerce Platform",
    path: "/Users/john/projects/ecommerce",
    vaultsConnected: 2,
  },
  {
    id: "2",
    name: "Dashboard Analytics",
    path: "/Users/john/projects/dashboard",
    vaultsConnected: 1,
  },
  {
    id: "3",
    name: "Mobile App Backend",
    path: "/Users/john/projects/mobile-backend",
    vaultsConnected: 3,
  },
];

const claudeProjects = [
  {
    id: "4",
    name: "Marketing Website",
    path: "/Users/john/projects/marketing-site",
    needsSetup: true,
  },
  {
    id: "5",
    name: "Internal Tools",
    path: "/Users/john/projects/internal-tools",
    needsSetup: true,
  },
];

export default function ProjectsPage() {
  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Nori Projects Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Nori Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {noriProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Path</p>
                    <p className="text-sm font-mono text-gray-700 truncate">
                      {project.path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {project.vaultsConnected} {project.vaultsConnected === 1 ? "vault" : "vaults"} connected
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Claude Code Discovery Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Claude Code Discovery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claudeProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Path</p>
                    <p className="text-sm font-mono text-gray-700 truncate">
                      {project.path}
                    </p>
                  </div>
                  {project.needsSetup && (
                    <Button className="w-full" variant="default">
                      Setup Nori
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
