import { onBeforeUnmount, onMounted, type Ref } from 'vue';

const FOCUSABLE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab inside `containerRef` and routes Escape to `onClose`,
 * both bound on `document` (capture phase) so they fire regardless of where
 * focus has wandered inside the dialog (P1 fix: modal focus was escaping
 * behind the opaque backdrop and Escape stopped working once it did).
 *
 * `active`, when given, lets a parent dialog pause its own trap while a
 * nested dialog (e.g. a delete confirm) is open on top of it — the nested
 * dialog's own useModalKeys call handles Escape/Tab while it is open.
 */
export function useModalKeys(
  containerRef: Ref<HTMLElement | undefined>,
  onClose: () => void,
  active?: Ref<boolean>,
): void {
  function getFocusable(): HTMLElement[] {
    const root = containerRef.value;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }

  function onKeydown(e: KeyboardEvent): void {
    if (active && !active.value) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown, true));
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, true));
}
