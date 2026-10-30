import type { DayActivity, TopicCount } from '../api/types'

export function ActivityChart({ days }: { days: DayActivity[] }) {
  const width = 640
  const height = 220
  const pad = { l: 28, r: 12, t: 18, b: 32 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const max = Math.max(4, ...days.flatMap((day) => [day.received, day.replied]))
  const x = (index: number) =>
    pad.l + (days.length <= 1 ? innerW / 2 : (index / (days.length - 1)) * innerW)
  const y = (value: number) => pad.t + innerH - (value / max) * innerH

  const path = (key: 'received' | 'replied') =>
    days
      .map((day, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(1)} ${y(day[key]).toFixed(1)}`)
      .join(' ')

  const area = (key: 'received' | 'replied') =>
    `${path(key)} L ${x(days.length - 1).toFixed(1)} ${(pad.t + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`

  const grid = [0, 0.5, 1]

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Mensajes de los últimos 14 días">
      {/* Axis labels use ink-soft (#3d4f4a). #7b8b82 was about 3.6:1 on the card. */}
      {grid.map((step) => {
        const gy = pad.t + innerH - step * innerH
        const value = Math.round(step * max)
        return (
          <g key={step}>
            <line x1={pad.l} x2={width - pad.r} y1={gy} y2={gy} stroke="#eadfcd" strokeWidth="1" />
            <text x={pad.l - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="#3d4f4a">
              {value}
            </text>
          </g>
        )
      })}
      <path d={area('received')} fill="#0f766e" opacity="0.14" />
      <path d={path('received')} fill="none" stroke="#0f766e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d={path('replied')} fill="none" stroke="#1f6f8a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="butt" strokeDasharray="8 5" />
      {days.map((day, index) =>
        index % 2 === 0 ? (
          <text key={day.date} x={x(index)} y={height - 8} textAnchor="middle" fontSize="11" fill="#3d4f4a">
            {day.label}
          </text>
        ) : null,
      )}
      </svg>
      <table className="sr-only">
        <caption>Mensajes de los últimos 14 días</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Recibidos</th>
            <th scope="col">Respuestas</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <th scope="row">
                {day.label} {day.date}
              </th>
              <td>{day.received}</td>
              <td>{day.replied}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TopicBars({ topics }: { topics: TopicCount[] }) {
  const max = Math.max(1, ...topics.map((topic) => topic.count))
  if (topics.length === 0) {
    return <p className="text-sm text-ink-soft">Todavía no hay temas en las conversaciones.</p>
  }
  return (
    <ul className="space-y-3">
      {topics.map((topic) => (
        <li key={topic.topic}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{topic.topic}</span>
            <span className="shrink-0 tabular-nums text-ink-soft">{topic.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-moss"
              style={{ width: `${Math.max(8, (topic.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
