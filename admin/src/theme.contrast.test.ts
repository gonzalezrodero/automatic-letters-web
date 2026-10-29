import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (value: number) => {
    const s = value / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const r = channel((n >> 16) & 255)
  const g = channel((n >> 8) & 255)
  const b = channel(n & 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string): number {
  const left = luminance(foreground)
  const right = luminance(background)
  const [hi, lo] = left > right ? [left, right] : [right, left]
  return (hi + 0.05) / (lo + 0.05)
}

const ivory = '#fffbeb'
const ink = '#1c1917'
const inkSoft = '#3d4f4a'
const teal = '#0f766e'
const tealDeep = '#115e59'
const orange = '#f97316'
const orangeDeep = '#ea580c'
const ember = '#c2410c'
const danger = '#9f2d2d'
const foam = '#ccfbf1'

describe('brand contrast', () => {
  it('keeps the pinned palette in the public site and the portal', () => {
    const site = readFileSync(new URL('../../site.css', import.meta.url), 'utf8')
    const portal = readFileSync(new URL('./index.css', import.meta.url), 'utf8')
    for (const hex of [ivory, teal, orange, ember, ink]) {
      expect(site.toLowerCase()).toContain(hex)
      expect(portal.toLowerCase()).toContain(hex)
    }
  })

  it('meets WCAG AA for text on ivory, teal, and orange', () => {
    expect(contrast('#ffffff', teal)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ivory, teal)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ivory, tealDeep)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ink, ivory)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(inkSoft, ivory)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(tealDeep, ivory)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ember, ivory)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(danger, ivory)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(tealDeep, foam)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ink, orange)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ink, orangeDeep)).toBeGreaterThanOrEqual(4.5)
  })

  it('rejects white or teal text on the orange action', () => {
    expect(contrast('#ffffff', orange)).toBeLessThan(3)
    expect(contrast(teal, orange)).toBeLessThan(3)
  })

  it('keeps the error colour distinct from the orange accent', () => {
    expect(danger).not.toBe(orange)
    expect(danger).not.toBe(ember)
    expect(contrast(danger, orange)).toBeGreaterThanOrEqual(1.4)
  })
})
