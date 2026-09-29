import type { ConversationEvent } from '../api/types'
import { dayKey, formatDayHeading, formatTime, isReply } from '../lib/format'

function groupByDay(events: ConversationEvent[]) {
  const groups: Array<{ day: string; events: ConversationEvent[] }> = []
  for (const event of events) {
    const day = dayKey(event.at)
    const last = groups[groups.length - 1]
    if (!last || last.day !== day) groups.push({ day, events: [event] })
    else last.events.push(event)
  }
  return groups
}

export function ChatThread({ events }: { events: ConversationEvent[] }) {
  const groups = groupByDay(events)
  return (
    <div className="chat-canvas h-full overflow-auto px-3 py-5 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {groups.map((group) => (
          <div key={group.day} className="contents">
            <div className="my-2 flex justify-center">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-ink-soft shadow-sm">
                {formatDayHeading(group.day)}
              </span>
            </div>
            {group.events.map((event, index) => {
              const reply = isReply(event)
              return (
                <div key={`${event.at}-${index}`} className={reply ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      reply
                        ? 'bubble-out max-w-[85%] bg-bot px-3 py-2 text-[15px] leading-snug shadow-sm sm:max-w-[70%]'
                        : 'bubble-in max-w-[85%] bg-white px-3 py-2 text-[15px] leading-snug shadow-sm sm:max-w-[70%]'
                    }
                  >
                    <p className="whitespace-pre-wrap">{event.text}</p>
                    <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-ink-soft">
                      <span>{reply ? 'Bot' : 'Familia'}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={event.at}>{formatTime(event.at)}</time>
                      {reply ? (
                        <svg viewBox="0 0 16 12" className="h-3 w-4 text-moss" aria-hidden="true">
                          <path
                            d="M1 6.2 4.2 9.4 10.2 2.4M6 6.2 9.2 9.4 15 2.6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : null}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
