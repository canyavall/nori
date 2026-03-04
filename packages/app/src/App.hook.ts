import { createMemo } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { sidebarContext } from './stores/navigation.store';

const PROJECT_ROUTES = ['/', '/projects', '/sessions'];
const PROJECT_ROUTE_PREFIXES = ['/project/'];

function isProjectRoute(path: string): boolean {
  return PROJECT_ROUTES.includes(path) || PROJECT_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const useApp = () => {
  const location = useLocation();
  const activeSidebar = createMemo(() => (isProjectRoute(location.pathname) ? sidebarContext() : null));
  return { sidebarContext: activeSidebar };
};
