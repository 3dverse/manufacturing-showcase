# Factory Store

This directory contains Zustand store slices for global state management.

## useFactoryStore

The `useFactoryStore` manages the current factory state throughout the application.

### Usage Examples

#### 1. Get the current factory

```tsx
import { useCurrentFactory } from "@/hooks/useCurrentFactory";

function MyComponent() {
    const currentFactory = useCurrentFactory();
    
    if (!currentFactory) {
        return <div>No factory selected</div>;
    }
    
    return (
        <div>
            <h1>{currentFactory.name}</h1>
            <p>{currentFactory.location}</p>
        </div>
    );
}
```

#### 2. Set the current factory

```tsx
import { useFactoryStore } from "@/store/useFactoryStore";
import { factories } from "@/content/factory";

function FactorySelector() {
    const setCurrentFactory = useFactoryStore((state) => state.setCurrentFactory);
    
    const handleSelect = (factoryId: string) => {
        const factory = factories.find(f => f.id === factoryId);
        if (factory) {
            setCurrentFactory(factory);
        }
    };
    
    return (
        <div>
            {factories.map(factory => (
                <button key={factory.id} onClick={() => handleSelect(factory.id)}>
                    {factory.name}
                </button>
            ))}
        </div>
    );
}
```

#### 3. Clear the current factory

```tsx
import { useFactoryStore } from "@/store/useFactoryStore";

function NavigationButton() {
    const clearCurrentFactory = useFactoryStore((state) => state.clearCurrentFactory);
    
    const handleBackToHome = () => {
        clearCurrentFactory();
        // navigate to home page
    };
    
    return <button onClick={handleBackToHome}>Back to Home</button>;
}
```

#### 4. Use multiple store values

```tsx
import { useFactoryStore } from "@/store/useFactoryStore";

function FactoryInfo() {
    const { currentFactory, setCurrentFactory, clearCurrentFactory } = useFactoryStore();
    
    // Use all store values and methods
    return (
        <div>
            {currentFactory ? (
                <>
                    <h1>{currentFactory.name}</h1>
                    <button onClick={clearCurrentFactory}>Clear</button>
                </>
            ) : (
                <p>No factory selected</p>
            )}
        </div>
    );
}
```

### Store API

- **currentFactory**: `Factory | null` - The currently selected factory
- **setCurrentFactory**: `(factory: Factory | null) => void` - Set the current factory
- **clearCurrentFactory**: `() => void` - Clear the current factory (sets to null)

### Automatic Updates

The factory store is automatically updated when navigating to factory routes:
- When navigating to `/factory/x-factory`, the store is updated with the X Factory data
- When navigating away from a factory route (e.g., to `/` or `/theme`), the store is cleared
- Browser back/forward navigation is handled automatically
