import type { ParentProps } from 'solid-js';
import { Show } from 'solid-js';
import { TopNav } from './components/layout/TopNav/TopNav';
import { ContextualSidebar } from './components/layout/ContextualSidebar/ContextualSidebar';
import { useApp } from './App.hook';

export const App = (props: ParentProps) => {
  const { sidebarContext } = useApp();

  return (
    <div class="flex flex-col h-screen">
      <TopNav />
      <div class="flex flex-1 min-h-0">
        <Show when={sidebarContext()}>
          <ContextualSidebar />
        </Show>
        <main class="flex-1 overflow-auto">
          {props.children}
        </main>
      </div>
    </div>
  );
};
