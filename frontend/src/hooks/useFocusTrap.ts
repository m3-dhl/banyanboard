import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Traps keyboard focus within the given container element.
 * Returns focus to the trigger element when the trap is removed.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean
): void {
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!active) return

    // Remember where focus was before the trap was activated
    triggerRef.current = document.activeElement

    const container = containerRef.current
    if (!container) return

    // Move focus into the container
    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return

      const focusable = Array.from(
        container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest('[hidden]'))

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Return focus to the trigger
      if (triggerRef.current && (triggerRef.current as HTMLElement).focus) {
        ;(triggerRef.current as HTMLElement).focus()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
