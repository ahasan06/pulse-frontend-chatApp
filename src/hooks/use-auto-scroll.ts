import { useLayoutEffect, useRef, useState } from 'react'

export function useAutoScroll(dependency: unknown, resetKey?: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const [showJump, setShowJump] = useState(false)

  function onScroll() {
    const element = ref.current
    if (!element) return
    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight
    const atBottom = distance < 96
    stickToBottom.current = atBottom
    setShowJump(!atBottom)
  }

  function scrollToBottom() {
    const element = ref.current
    if (!element) return
    element.scrollTop = element.scrollHeight
    stickToBottom.current = true
    setShowJump((open) => (open ? false : open))
  }

  useLayoutEffect(() => {
    stickToBottom.current = true
    scrollToBottom()
  }, [resetKey])

  useLayoutEffect(() => {
    if (stickToBottom.current) scrollToBottom()
    else setShowJump(true)
  }, [dependency])

  return { ref, onScroll, scrollToBottom, showJump }
}
