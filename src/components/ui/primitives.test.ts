import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToString } from 'react-dom/server';

import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Input } from './input';
import { Badge } from './badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, useDialog } from './dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent, useTabs } from './tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, useSheet } from './sheet';
import { Skeleton } from './skeleton';
import { Tooltip } from './tooltip';

describe('UI Primitives - Empirical Stress Testing & Verification', () => {
  describe('Button Component', () => {
    test('renders default button with 44px min-height touch target', () => {
      const html = renderToString(React.createElement(Button, null, 'Click Me'));
      assert.match(html, /min-h-\[44px\]/);
      assert.match(html, /type="button"/);
      assert.match(html, /bg-indigo-600/);
      assert.match(html, /focus-visible:ring-2/);
      assert.match(html, /Click Me/);
    });

    test('supports icon size with 44px x 44px minimum touch target', () => {
      const html = renderToString(React.createElement(Button, { size: 'icon' }, 'X'));
      assert.match(html, /min-h-\[44px\]/);
      assert.match(html, /min-w-\[44px\]/);
    });

    test('supports lg size with 48px min-height touch target', () => {
      const html = renderToString(React.createElement(Button, { size: 'lg' }, 'Large Button'));
      assert.match(html, /min-h-\[48px\]/);
    });

    test('handles isLoading state by disabling button and rendering spinner', () => {
      const html = renderToString(React.createElement(Button, { isLoading: true }, 'Save'));
      assert.match(html, /disabled=""/);
      assert.match(html, /animate-spin/);
      assert.match(html, /Save/);
    });

    test('merges custom className cleanly via cn()', () => {
      const html = renderToString(React.createElement(Button, { className: 'custom-class-test' }, 'Test'));
      assert.match(html, /custom-class-test/);
      assert.match(html, /min-h-\[44px\]/);
    });

    test('renders destructive, secondary, outline, and ghost variants correctly', () => {
      const variants = ['destructive', 'secondary', 'outline', 'ghost'] as const;
      for (const variant of variants) {
        const html = renderToString(React.createElement(Button, { variant }, 'Variant'));
        assert.ok(html.length > 0);
      }
    });
  });

  describe('Input Component', () => {
    test('renders input with 44px min-height touch target and focus ring', () => {
      const html = renderToString(React.createElement(Input, { placeholder: 'Enter text...' }));
      assert.match(html, /min-h-\[44px\]/);
      assert.match(html, /glass-input/);
      assert.match(html, /focus-visible:ring-indigo-400/);
    });

    test('renders leftIcon and applies pl-10 padding offset', () => {
      const icon = React.createElement('span', { id: 'search-icon' }, '🔍');
      const html = renderToString(React.createElement(Input, { leftIcon: icon }));
      assert.match(html, /search-icon/);
      assert.match(html, /pl-10/);
      assert.match(html, /pointer-events-none/);
    });

    test('renders rightIcon and applies pr-10 padding offset', () => {
      const icon = React.createElement('button', { id: 'clear-icon' }, '✕');
      const html = renderToString(React.createElement(Input, { rightIcon: icon }));
      assert.match(html, /clear-icon/);
      assert.match(html, /pr-10/);
    });

    test('renders error state with red border and red focus ring', () => {
      const html = renderToString(React.createElement(Input, { error: true }));
      assert.match(html, /border-red-500\/50/);
      assert.match(html, /focus-visible:ring-red-400/);
    });
  });

  describe('Badge Component', () => {
    test('renders default badge with uppercase tracking', () => {
      const html = renderToString(React.createElement(Badge, null, 'Active'));
      assert.match(html, /uppercase/);
      assert.match(html, /Active/);
    });

    test('renders pulsing indicator dot when dot=true', () => {
      const html = renderToString(React.createElement(Badge, { variant: 'success', dot: true }, 'Online'));
      assert.match(html, /animate-pulse/);
      assert.match(html, /bg-emerald-400/);
      assert.match(html, /Online/);
    });

    test('supports all variant color themes (success, warning, error, info, etc.)', () => {
      const variants = ['success', 'warning', 'error', 'info', 'secondary', 'outline'] as const;
      for (const variant of variants) {
        const html = renderToString(React.createElement(Badge, { variant }, variant));
        assert.ok(html.length > 0);
      }
    });
  });

  describe('Card Components', () => {
    test('renders Card with glass variant by default', () => {
      const html = renderToString(
        React.createElement(
          Card,
          null,
          React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'Title')),
          React.createElement(CardContent, null, 'Body Content'),
          React.createElement(CardFooter, null, 'Footer')
        )
      );
      assert.match(html, /glass-card/);
      assert.match(html, /Title/);
      assert.match(html, /Body Content/);
      assert.match(html, /Footer/);
    });

    test('supports interactive variant with hover-lift effect', () => {
      const html = renderToString(React.createElement(Card, { variant: 'interactive' }, 'Clickable Card'));
      assert.match(html, /hover-lift/);
      assert.match(html, /cursor-pointer/);
    });
  });

  describe('Dialog Component', () => {
    test('throws error if useDialog is invoked outside Dialog context', () => {
      function BadComponent() {
        useDialog();
        return null;
      }
      assert.throws(() => renderToString(React.createElement(BadComponent)), /useDialog must be used within a Dialog/);
    });

    test('renders dialog trigger and hidden content when closed', () => {
      const html = renderToString(
        React.createElement(
          Dialog,
          { open: false },
          React.createElement(DialogTrigger, null, 'Open Modal'),
          React.createElement(
            DialogContent,
            null,
            React.createElement(DialogHeader, null, React.createElement(DialogTitle, null, 'Modal Title')),
            React.createElement(DialogDescription, null, 'Modal Description')
          )
        )
      );
      assert.match(html, /Open Modal/);
      assert.doesNotMatch(html, /Modal Title/);
    });

    test('renders modal overlay and accessible role="dialog" when open', () => {
      const html = renderToString(
        React.createElement(
          Dialog,
          { open: true },
          React.createElement(
            DialogContent,
            null,
            React.createElement(DialogHeader, null, React.createElement(DialogTitle, null, 'Modal Title')),
            React.createElement(DialogDescription, null, 'Modal Description'),
            React.createElement(DialogFooter, null, React.createElement(DialogClose, null, 'Close'))
          )
        )
      );
      assert.match(html, /role="dialog"/);
      assert.match(html, /aria-modal="true"/);
      assert.match(html, /aria-label="Close dialog"/);
      assert.match(html, /Modal Title/);
      assert.match(html, /Modal Description/);
      assert.match(html, /Close/);
    });
  });

  describe('Tabs Component', () => {
    test('throws error if useTabs is invoked outside Tabs context', () => {
      function BadComponent() {
        useTabs();
        return null;
      }
      assert.throws(() => renderToString(React.createElement(BadComponent)), /useTabs must be used within Tabs/);
    });

    test('renders tablist, tabs triggers, and active tab content', () => {
      const html = renderToString(
        React.createElement(
          Tabs,
          { defaultValue: 'tab1' },
          React.createElement(
            TabsList,
            null,
            React.createElement(TabsTrigger, { value: 'tab1' }, 'Tab 1'),
            React.createElement(TabsTrigger, { value: 'tab2' }, 'Tab 2')
          ),
          React.createElement(TabsContent, { value: 'tab1' }, 'Content for Tab 1'),
          React.createElement(TabsContent, { value: 'tab2' }, 'Content for Tab 2')
        )
      );
      assert.match(html, /role="tablist"/);
      assert.match(html, /role="tab"/);
      assert.match(html, /aria-selected="true"/);
      assert.match(html, /aria-selected="false"/);
      assert.match(html, /Content for Tab 1/);
      assert.doesNotMatch(html, /Content for Tab 2/);
    });
  });

  describe('Sheet Component', () => {
    test('throws error if useSheet is invoked outside Sheet context', () => {
      function BadComponent() {
        useSheet();
        return null;
      }
      assert.throws(() => renderToString(React.createElement(BadComponent)), /useSheet must be used within Sheet/);
    });

    test('renders mobile drawer when open with specified slide side', () => {
      const html = renderToString(
        React.createElement(
          Sheet,
          { open: true },
          React.createElement(
            SheetContent,
            { side: 'left' },
            React.createElement(SheetHeader, null, React.createElement(SheetTitle, null, 'Navigation Drawer')),
            React.createElement(SheetDescription, null, 'Drawer links...'),
            React.createElement(SheetFooter, null, React.createElement(SheetClose, null, 'Dismiss'))
          )
        )
      );
      assert.match(html, /role="dialog"/);
      assert.match(html, /aria-modal="true"/);
      assert.match(html, /slide-in-from-left/);
      assert.match(html, /Navigation Drawer/);
      assert.match(html, /aria-label="Close menu"/);
    });
  });

  describe('Skeleton Component', () => {
    test('renders rounded card loader with shimmer effect by default', () => {
      const html = renderToString(React.createElement(Skeleton, { className: 'h-12 w-full' }));
      assert.match(html, /animate-pulse/);
      assert.match(html, /animate-shimmer/);
      assert.match(html, /h-12 w-full/);
    });

    test('omits animate-shimmer when shimmer=false', () => {
      const html = renderToString(React.createElement(Skeleton, { shimmer: false }));
      assert.match(html, /animate-pulse/);
      assert.doesNotMatch(html, /animate-shimmer/);
    });
  });

  describe('Tooltip Component', () => {
    test('renders trigger children wrapped in container', () => {
      const html = renderToString(
        React.createElement(Tooltip, { content: 'Tooltip text' }, React.createElement('button', null, 'Hover me'))
      );
      assert.match(html, /Hover me/);
      // Tooltip content is hidden until hover/focus state
      assert.doesNotMatch(html, /role="tooltip"/);
    });
  });
});
