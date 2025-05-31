# UI Components Module

A collection of reusable UI components for building interactive user interfaces in browser extensions and web applications.

## Features

- 🎯 **Floating Icon**: Customizable floating action button
- 📋 **Context Menu**: Rich context menu with nested items
- 📊 **Sidebar**: Collapsible and resizable sidebar
- 📱 **Mini Menu**: Compact menu for quick actions
- ⏳ **Loading States**: Various loading indicators
- 🔔 **Notifications**: Toast notifications system
- 🎨 **Providers**: Context providers for UI state
- 🪝 **Hooks**: Utility hooks for UI interactions

## Installation

```bash
# No external dependencies required
```

## Components

### Floating Icon

A customizable floating action button that can be positioned anywhere on the screen.

```typescript
import { FloatingIcon } from '~modules/ui-components';

function MyPage() {
  return (
    <div>
      <FloatingIcon
        icon={<IconComponent />}
        tooltip="Quick Action"
        position="right"
        offset={20}
        showOn="hover"
        onClick={() => console.log('Clicked!')}
      />
    </div>
  );
}
```

#### Props

```typescript
interface FloatingIconConfig {
  icon: ReactNode;
  tooltip?: string;
  onClick?: () => void;
  onHover?: () => void;
  position?: 'left' | 'right';
  offset?: number;
  showOn?: 'hover' | 'always' | 'selection';
  className?: string;
  delay?: number;
}
```

### Context Menu

A rich context menu that can be triggered on right-click or custom events.

```typescript
import { useContextMenu } from '~modules/ui-components';

function DocumentViewer() {
  const { showContextMenu } = useContextMenu();

  const handleContextMenu = (e) => {
    e.preventDefault();

    showContextMenu(e, [
      {
        id: 'copy',
        label: 'Copy',
        icon: <CopyIcon />,
        shortcut: '⌘C',
        onClick: () => navigator.clipboard.writeText(selectedText)
      },
      {
        id: 'search',
        label: 'Search',
        icon: <SearchIcon />,
        onClick: () => searchFor(selectedText)
      },
      { separator: true },
      {
        id: 'more',
        label: 'More Options',
        children: [
          {
            id: 'share',
            label: 'Share',
            icon: <ShareIcon />,
            onClick: () => share(selectedText)
          }
        ]
      }
    ]);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      Document content here...
    </div>
  );
}
```

#### Types

```typescript
interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}
```

### Sidebar

A collapsible and resizable sidebar component.

```typescript
import { Sidebar } from '~modules/ui-components';

function AppLayout() {
  return (
    <div className="app-container">
      <Sidebar
        position="left"
        width={250}
        minWidth={200}
        maxWidth={400}
        resizable={true}
        collapsible={true}
        defaultCollapsed={false}
      >
        <div className="sidebar-content">
          <h2>Navigation</h2>
          <nav>
            <ul>
              <li>Dashboard</li>
              <li>Analytics</li>
              <li>Settings</li>
            </ul>
          </nav>
        </div>
      </Sidebar>

      <main className="main-content">
        Main content here
      </main>
    </div>
  );
}
```

#### Props

```typescript
interface SidebarConfig {
  position?: 'left' | 'right';
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  overlay?: boolean;
  pushContent?: boolean;
  className?: string;
  zIndex?: number;
}
```

### Mini Menu

A compact menu for quick actions.

```typescript
import { MiniMenu } from '~modules/ui-components';

function TextEditor() {
  return (
    <div className="editor">
      <textarea />

      <MiniMenu
        items={[
          { icon: <BoldIcon />, tooltip: 'Bold', onClick: () => formatText('bold') },
          { icon: <ItalicIcon />, tooltip: 'Italic', onClick: () => formatText('italic') },
          { icon: <UnderlineIcon />, tooltip: 'Underline', onClick: () => formatText('underline') }
        ]}
        position={{ x: 100, y: 200 }}
        direction="horizontal"
      />
    </div>
  );
}
```

### Loading States

Various loading indicators for different UI states.

```typescript
import {
  Spinner,
  ProgressBar,
  SkeletonLoader,
  LoadingOverlay
} from '~modules/ui-components';

function DataView({ loading, progress }) {
  if (loading) {
    return (
      <div>
        <Spinner size="md" color="primary" />
        <ProgressBar value={progress} max={100} />
        <SkeletonLoader type="text" lines={3} />
        <LoadingOverlay visible={loading} text="Loading data..." />
      </div>
    );
  }

  return <div>Data loaded!</div>;
}
```

### Notifications

Toast notification system for displaying messages.

```typescript
import { useNotifications } from '~modules/ui-components';

function UserActions() {
  const { showNotification, dismissNotification } = useNotifications();

  const handleSave = async () => {
    try {
      await saveData();

      showNotification({
        title: 'Success',
        message: 'Your changes have been saved',
        type: 'success',
        duration: 3000,
        action: {
          label: 'Undo',
          onClick: () => revertChanges()
        }
      });
    } catch (error) {
      showNotification({
        title: 'Error',
        message: error.message,
        type: 'error',
        closable: true
      });
    }
  };

  return <button onClick={handleSave}>Save Changes</button>;
}
```

#### Types

```typescript
interface NotificationConfig {
  id?: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}
```

## Hooks

### usePosition

Hook for tracking element position and dimensions.

```typescript
import { usePosition } from '~modules/ui-components/hooks';

function PositionedElement() {
  const [ref, position] = usePosition();

  return (
    <>
      <div ref={ref}>This element's position is tracked</div>
      <div>
        Position: {position.left}px, {position.top}px
        <br />
        Size: {position.width}px x {position.height}px
      </div>
    </>
  );
}
```

### useClickOutside

Hook for detecting clicks outside an element.

```typescript
import { useClickOutside } from '~modules/ui-components/hooks';

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Dropdown</button>
      {isOpen && (
        <div className="dropdown-menu">
          Dropdown content
        </div>
      )}
    </div>
  );
}
```

### useDrag

Hook for making elements draggable.

```typescript
import { useDrag } from '~modules/ui-components/hooks';

function DraggableElement() {
  const [position, ref] = useDrag({ initialPosition: { x: 0, y: 0 } });

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: 'move'
      }}
    >
      Drag me!
    </div>
  );
}
```

### useResize

Hook for making elements resizable.

```typescript
import { useResize } from '~modules/ui-components/hooks';

function ResizableElement() {
  const [size, ref] = useResize({
    initialSize: { width: 200, height: 200 },
    minSize: { width: 100, height: 100 },
    maxSize: { width: 500, height: 500 }
  });

  return (
    <div
      ref={ref}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        border: '1px solid black',
        resize: 'both',
        overflow: 'auto'
      }}
    >
      Resize me!
    </div>
  );
}
```

## Providers

### UI Provider

Main provider for UI state and theme.

```typescript
import { UIProvider } from '~modules/ui-components/providers';

function App() {
  return (
    <UIProvider
      theme="light"
      animations={true}
      density="comfortable"
    >
      <AppContent />
    </UIProvider>
  );
}
```

### Notifications Provider

Provider for the notification system.

```typescript
import { NotificationsProvider } from '~modules/ui-components/providers';

function App() {
  return (
    <NotificationsProvider
      maxNotifications={5}
      defaultDuration={3000}
      defaultPosition="top-right"
    >
      <AppContent />
    </NotificationsProvider>
  );
}
```

## API Reference

### Types

```typescript
// Position
interface Position {
  x: number;
  y: number;
}

// Rectangle
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

// Floating Icon
interface FloatingIconConfig {
  icon: ReactNode;
  tooltip?: string;
  onClick?: () => void;
  onHover?: () => void;
  position?: 'left' | 'right';
  offset?: number;
  showOn?: 'hover' | 'always' | 'selection';
  className?: string;
  delay?: number;
}

// Context Menu
interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

// Sidebar
interface SidebarConfig {
  position?: 'left' | 'right';
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  overlay?: boolean;
  pushContent?: boolean;
  className?: string;
  zIndex?: number;
}

// Notification
interface NotificationConfig {
  id?: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}
```

## Best Practices

1. **Component Composition**: Combine components to create complex UIs
2. **Responsive Design**: Test components on different screen sizes
3. **Accessibility**: Ensure components are accessible with proper ARIA attributes
4. **Performance**: Use memoization for expensive components
5. **Theme Consistency**: Use the UIProvider for consistent theming
6. **Error Handling**: Implement proper error boundaries
7. **Animation Control**: Respect user preferences for reduced motion
8. **Keyboard Navigation**: Ensure components are keyboard accessible
