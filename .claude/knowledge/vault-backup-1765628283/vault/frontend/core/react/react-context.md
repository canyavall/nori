# React Context

<\!--
Migrated from: libraries/react-context.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# React Context Pattern

**Last Updated**: 2025-01-25
**Tags**: react, context, state-management, frontend

## Overview

Context API patterns for global state management.

---

## Context Template

```typescript
interface GameState {
  currentHero: Hero | null;
  currentEnemy: Monster | null;
}

interface GameContextType {
  state: GameState;
  setHero: (hero: Hero) => void;
  setEnemy: (enemy: Monster) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, setState] = useState<GameState>({
    currentHero: null,
    currentEnemy: null,
  });

  const setHero = (hero: Hero) => {
    setState(prev => ({ ...prev, currentHero: hero }));
  };

  const setEnemy = (enemy: Monster) => {
    setState(prev => ({ ...prev, currentEnemy: enemy }));
  };

  return (
    <GameContext.Provider value={{ state, setHero, setEnemy }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
```

---

## When to Use Context

- Theme settings
- User/game state
- Shared data across many components

---

## Related Knowledge

- `libraries/react-hooks.md` - Custom hooks
