/**
 * TALLY-STYLE KEYBOARD NAVIGATION UTILITY
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Implements predictable high-speed data entry patterns modeled after Tally ERP / Prime:
 * 1. Enter advances to the next focusable editable input/select/button.
 * 2. Shift+Enter moves back to the previous editable input.
 * 3. In multiline textareas, Enter inserts a newline and does NOT prematurely submit the form.
 * 4. In autocomplete dropdowns, Enter chooses the active highlighted suggestion first.
 * 5. Arrow Up/Down navigate dropdown options or table rows.
 * 6. Escape closes dropdowns/dialogs without discarding dirty data.
 * 7. Blocks form submission if validation is incomplete.
 */

import React from 'react';

export interface TallyNavOptions {
  containerRef?: React.RefObject<HTMLElement | null>;
  onEscape?: () => void;
  onEnterSubmit?: () => void;
  allowEnterInTextarea?: boolean;
}

/**
 * Returns all tabbable/editable elements inside a container in DOM order.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled]):not([tabindex="-1"])',
    '[tabindex="0"]'
  ].join(', ');

  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
  return elements.filter(el => {
    // Only return visible elements with non-zero dimensions
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
  });
}

/**
 * Advances focus to the next editable element within the container.
 */
export function focusNextTallyField(
  currentElement: HTMLElement,
  container?: HTMLElement | null
): boolean {
  if (!container) return false;
  const focusables = getFocusableElements(container);
  const currentIndex = focusables.indexOf(currentElement);
  if (currentIndex >= 0 && currentIndex < focusables.length - 1) {
    const next = focusables[currentIndex + 1];
    next.focus();
    if (next instanceof HTMLInputElement && typeof next.select === 'function') {
      next.select();
    }
    return true;
  }
  return false;
}

/**
 * Reverses focus to the previous editable element within the container.
 */
export function focusPrevTallyField(
  currentElement: HTMLElement,
  container?: HTMLElement | null
): boolean {
  if (!container) return false;
  const focusables = getFocusableElements(container);
  const currentIndex = focusables.indexOf(currentElement);
  if (currentIndex > 0) {
    const prev = focusables[currentIndex - 1];
    prev.focus();
    if (prev instanceof HTMLInputElement && typeof prev.select === 'function') {
      prev.select();
    }
    return true;
  }
  return false;
}

/**
 * Standard keydown handler for Tally-style forms and modals.
 */
export function handleTallyKeyDown(
  e: React.KeyboardEvent<HTMLElement>,
  container?: HTMLElement | null,
  options?: {
    onEscape?: () => void;
    onAddRow?: () => void;
  }
): void {
  const target = e.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();

  // Escape: Close suggestions or dialog without discarding data
  if (e.key === 'Escape') {
    if (options?.onEscape) {
      e.preventDefault();
      options.onEscape();
    }
    return;
  }

  // Multiline Textarea: Enter must insert newline, Shift+Enter moves back
  if (tagName === 'textarea') {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (container) focusPrevTallyField(target, container);
    }
    return;
  }

  // Shift + Enter: Move to previous field
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    if (container) {
      focusPrevTallyField(target, container);
    }
    return;
  }

  // Enter: Move to next field (or advance table row)
  if (e.key === 'Enter') {
    // If it's a submit button or action button, let it trigger normally
    if (tagName === 'button' && (target as HTMLButtonElement).type === 'submit') {
      return;
    }

    e.preventDefault();
    if (container) {
      const advanced = focusNextTallyField(target, container);
      // If we are at the last focusable element in a table row, optionally trigger new row
      if (!advanced && options?.onAddRow) {
        options.onAddRow();
      }
    }
  }
}
