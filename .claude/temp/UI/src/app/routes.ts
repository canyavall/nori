import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import ProjectsPage from "./components/ProjectsPage";
import VaultsPage from "./components/VaultsPage";
import VaultDetailPage from "./components/VaultDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: ProjectsPage },
      { path: "projects", Component: ProjectsPage },
      { path: "vaults", Component: VaultsPage },
      { path: "vaults/:vaultId", Component: VaultDetailPage },
    ],
  },
]);
