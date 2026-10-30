import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'

/**
 * Build the portal with these hosts before running (same values as CI).
 * Every request to the API origin is fulfilled here. Nothing else may leave the browser.
 */
const API_ORIGIN = 'https://api.example.invalid'

const tenant = {
  id: 'example-tenant',
  name: 'Taller Norte',
  shortName: 'Norte',
  city: 'Oviedo',
  kind: 'Taller',
  botPhoneNumberId: '1001',
  displayPhone: '+34 600 11 22 33',
  systemPrompt: 'Eres el asistente de un negocio inventado.',
  privacyPolicyUrl: 'https://example.invalid/privacy',
}

const conversation = {
  id: 'horario',
  tenantId: tenant.id,
  userPhone: '+34611111101',
  topic: 'Horario',
  anonymized: false,
  events: [
    { type: 'MessageReceived', text: '¿A qué hora abrís?', at: '2026-10-30T09:00:00.000Z' },
    { type: 'ReplyGenerated', text: 'De 9:00 a 14:00.', at: '2026-10-30T09:00:05.000Z' },
  ],
}

const dashboard = {
  generatedAt: '2026-10-30T10:00:00.000Z',
  windowLabel: '24–30 oct',
  conversationCount: 1,
  messagesThisWeek: 2,
  activeUsers: 1,
  deletionRequests: 0,
  topTopic: { topic: 'Horario', count: 1 },
  topics: [{ topic: 'Horario', count: 1 }],
  activity: [
    { date: '2026-10-29', label: 'X', received: 1, replied: 1 },
    { date: '2026-10-30', label: 'V', received: 1, replied: 1 },
  ],
  recent: [
    {
      id: conversation.id,
      topic: conversation.topic,
      preview: '¿A qué hora abrís?',
      at: '2026-10-30T09:00:05.000Z',
      anonymized: false,
      phoneMasked: '+34 611 ** ** 01',
    },
  ],
}

const document = {
  id: 'horario-pdf',
  tenantId: tenant.id,
  filename: 'horario.pdf',
  mime: 'application/pdf',
  bytes: 12000,
  uploadedAt: '2026-10-01T09:00:00.000Z',
  chunkCount: 2,
  status: 'indexed',
}

interface Problems {
  pageErrors: string[]
  consoleErrors: string[]
  httpFailures: string[]
  blocked: string[]
}

function watch(page: Page): Problems {
  const problems: Problems = {
    pageErrors: [],
    consoleErrors: [],
    httpFailures: [],
    blocked: [],
  }
  page.on('pageerror', (error) => {
    problems.pageErrors.push(error.message)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') problems.consoleErrors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      problems.httpFailures.push(`${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'failed'
    if (reason.includes('ERR_BLOCKED_BY_CLIENT') || reason.includes('ABORTED')) return
    problems.httpFailures.push(`${reason} ${request.url()}`)
  })
  return problems
}

function assertClean(problems: Problems) {
  expect(problems.pageErrors, 'uncaught exceptions').toEqual([])
  expect(problems.consoleErrors, 'console errors').toEqual([])
  expect(problems.httpFailures, 'failed requests').toEqual([])
  expect(problems.blocked, 'requests outside the app and the mocked API').toEqual([])
}

/**
 * Fail on serious and critical axe violations.
 * Moderate and minor results do not fail the build. Incomplete results do not
 * either: axe reports single-character chart labels as incomplete
 * color-contrast ("content is too short"), which is not a measured failure.
 * Those labels use ink-soft (#3d4f4a), about 8.6:1 on the card.
 */
async function expectNoSeriousAxeViolations(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const results = await new AxeBuilder({ page }).analyze()
  const violations = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  const detail = violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `  ${node.target.join(' ')}`).join('\n')
      return `${violation.id} (${violation.impact}): ${violation.help}\n${nodes}`
    })
    .join('\n')
  expect(violations, detail || 'serious or critical axe violations').toEqual([])
}

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const landingFiles: Record<string, string> = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/site.css': 'site.css',
  '/favicon.svg': 'favicon.svg',
  '/favicon.ico': 'favicon.svg',
  '/fonts/familjen-grotesk-latin.woff2': 'fonts/familjen-grotesk-latin.woff2',
}

function landingType(file: string): string {
  switch (extname(file)) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    case '.woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}

/** Repo-root landing files, fulfilled on the existing preview origin. No extra server. */
async function installLanding(page: Page, problems: Problems) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    const relative = landingFiles[url.pathname]
    const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
    if (local && relative) {
      const body = await readFile(join(repoRoot, relative))
      await route.fulfill({ status: 200, contentType: landingType(relative), body })
      return
    }
    problems.blocked.push(route.request().url())
    await route.abort()
  })
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function installApi(page: Page, problems: Problems, session: 'anonymous' | 'admin') {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      await route.continue()
      return
    }
    problems.blocked.push(route.request().url())
    await route.abort()
  })

  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/\/$/u, '') || '/'
    const method = request.method()
    const tenantRoot = `/tenants/${tenant.id}`

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    if (method === 'GET' && path === '/me') {
      // Logged out: an empty 200 makes profileFromBody return null without console.error.
      // The real API answers 401; that path is covered by admin/src/api/session.test.ts.
      await fulfillJson(
        route,
        200,
        session === 'admin'
          ? { email: 'ada@example.com', name: 'Ada', groups: ['admin'] }
          : {},
      )
      return
    }

    if (session === 'anonymous') {
      await fulfillJson(route, 500, { unexpected: path })
      return
    }

    if (method === 'GET' && path === '/tenants') {
      await fulfillJson(route, 200, [tenant])
      return
    }
    if (method === 'GET' && path === tenantRoot) {
      await fulfillJson(route, 200, tenant)
      return
    }
    if (method === 'GET' && path === `${tenantRoot}/dashboard`) {
      await fulfillJson(route, 200, dashboard)
      return
    }
    if (method === 'GET' && path === `${tenantRoot}/conversations`) {
      await fulfillJson(route, 200, [conversation])
      return
    }
    if (method === 'GET' && path === `${tenantRoot}/conversations/${conversation.id}`) {
      await fulfillJson(route, 200, conversation)
      return
    }
    if (method === 'GET' && path === `${tenantRoot}/documents`) {
      await fulfillJson(route, 200, [document])
      return
    }
    if (method === 'GET' && path === `${tenantRoot}/unanswered/answered`) {
      await fulfillJson(route, 200, [])
      return
    }
    if (method === 'GET' && path === `${tenantRoot}/unanswered`) {
      await fulfillJson(route, 200, [])
      return
    }

    await fulfillJson(route, 500, { unexpected: `${method} ${path}` })
  })
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    const width = Math.max(root.scrollWidth, document.body?.scrollWidth ?? 0)
    return width - root.clientWidth
  })
  expect(overflow, 'horizontal overflow in pixels').toBeLessThanOrEqual(0)
}

async function expectNoDocumentScroll(page: Page) {
  const extra = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  )
  expect(extra, 'document scroll in pixels').toBeLessThanOrEqual(0)
}

async function expectNoPanelScroll(page: Page) {
  const extra = await page.evaluate(() => {
    const selectors = ['.login-story', '.login-aside', '.login-chat', '.login-panel']
    const extras = selectors.map((selector) => {
      const el = document.querySelector(selector)
      if (!el || getComputedStyle(el).display === 'none') return 0
      return el.scrollHeight - el.clientHeight
    })
    return Math.max(0, ...extras)
  })
  expect(extra, 'panel scroll in pixels').toBeLessThanOrEqual(0)
}

const loginViewports = [
  { width: 1280, height: 600 },
  { width: 1366, height: 650 },
  { width: 1440, height: 700 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const

/** Public site, served beside the portal preview. See playwright.config.ts. */
const SITE_ORIGIN = 'http://127.0.0.1:4174'

test('production login shows Cognito and the example conversation, not the demo form', async ({ page }) => {
  const problems = watch(page)
  await installApi(page, problems, 'anonymous')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/admin/login')

  await expect(page.getByRole('heading', { name: 'Entra al portal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar con mi cuenta' })).toBeVisible()
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await expect(page.getByText('Cuentas de demostración')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toHaveCount(0)

  const example = page.getByRole('complementary', { name: 'Conversación de ejemplo' })
  await expect(example).toBeVisible()
  await expect(example.getByText('El Mostrador')).toBeVisible()
  await expect(example.getByText('¿A qué hora abrís?')).toBeVisible()
  await expect(example.getByText('¿Dónde estáis?')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expectNoHorizontalOverflow(page)
  await expectNoSeriousAxeViolations(page)

  for (const viewport of loginViewports) {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('heading', { name: 'Entra al portal' })).toBeVisible()
    const button = page.getByRole('button', { name: 'Entrar con mi cuenta' })
    await expect(button).toBeVisible()
    await expect(button).toBeInViewport({ ratio: 1 })
    await expect(example.getByText('¿A qué hora abrís?')).toBeInViewport({ ratio: 1 })
    await expect(example.getByText(/Los domingos cerramos/)).toBeInViewport({ ratio: 1 })
    if (viewport.height > 680) {
      await expect(example.getByText('¿Dónde estáis?')).toBeInViewport({ ratio: 1 })
      await expect(
        example.getByText('Estamos en la calle Mayor, número 12. El autobús para en la puerta.'),
      ).toBeInViewport({ ratio: 1 })
    }
    await expectNoDocumentScroll(page)
    await expectNoPanelScroll(page)
    await expectNoHorizontalOverflow(page)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Entra al portal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar con mi cuenta' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar con mi cuenta' })).toBeInViewport({ ratio: 1 })
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await expectNoDocumentScroll(page)
  await expectNoHorizontalOverflow(page)
  await expectNoSeriousAxeViolations(page)

  assertClean(problems)
})

test('landing keeps the example beside the hero without a large gap', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${SITE_ORIGIN}/`)
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { name: 'Las preguntas de siempre, contestadas en WhatsApp.' })).toBeVisible()

  // The broken layout left about 229px under the hero. Section rhythm is 4.25rem.
  const gapLimit = 120
  const desktop = await page.evaluate(() => {
    const hero = document.querySelector('.hero-copy')
    const ejemplo = document.getElementById('ejemplo')
    const next = document.getElementById('sirve-titulo')?.closest('section')
    if (!hero || !ejemplo || !next) return null
    const heroBox = hero.getBoundingClientRect()
    const ejemploBox = ejemplo.getBoundingClientRect()
    const nextBox = next.getBoundingClientRect()
    const root = document.documentElement
    const width = Math.max(root.scrollWidth, document.body?.scrollWidth ?? 0)
    return {
      gap: nextBox.top - heroBox.bottom,
      ejemploTop: ejemploBox.top,
      heroTop: heroBox.top,
      ejemploLeft: ejemploBox.left,
      heroRight: heroBox.right,
      ejemploBottom: ejemploBox.bottom,
      nextTop: nextBox.top,
      overflow: width - root.clientWidth,
    }
  })
  expect(desktop).not.toBeNull()
  expect(desktop!.overflow, 'horizontal overflow in pixels').toBeLessThanOrEqual(0)
  expect(desktop!.gap, 'gap under the hero in pixels').toBeLessThanOrEqual(gapLimit)
  expect(Math.abs(desktop!.ejemploTop - desktop!.heroTop)).toBeLessThanOrEqual(8)
  expect(desktop!.ejemploLeft).toBeGreaterThan(desktop!.heroRight)
  expect(desktop!.ejemploBottom).toBeGreaterThan(desktop!.nextTop)

  await page.evaluate(() => window.scrollTo(0, 480))
  const stuck = await page.evaluate(() => {
    const box = document.getElementById('ejemplo')!.getBoundingClientRect()
    return { top: box.top, left: box.left }
  })
  expect(stuck.top, 'example stays on screen while the page scrolls').toBeGreaterThan(0)
  expect(stuck.top).toBeLessThan(40)
  expect(stuck.left).toBeGreaterThan(desktop!.heroRight)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => window.scrollTo(0, 0))
  const mobile = await page.evaluate(() => {
    const hero = document.querySelector('.hero-copy')!.getBoundingClientRect()
    const ejemplo = document.getElementById('ejemplo')!.getBoundingClientRect()
    const next = document.getElementById('sirve-titulo')!.closest('section')!.getBoundingClientRect()
    const root = document.documentElement
    const width = Math.max(root.scrollWidth, document.body?.scrollWidth ?? 0)
    return {
      stacked: ejemplo.top >= hero.bottom - 1 && next.top >= ejemplo.bottom - 1,
      overflow: width - root.clientWidth,
    }
  })
  expect(mobile.stacked, 'mobile keeps a single column with the example after the hero').toBe(true)
  expect(mobile.overflow, 'horizontal overflow in pixels').toBeLessThanOrEqual(0)
})

test('authenticated pages load without console errors or failed requests', async ({ page }) => {
  const problems = watch(page)
  await installApi(page, problems, 'admin')
  await page.setViewportSize({ width: 1280, height: 800 })

  await page.goto('/admin/')
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Ada' })).toBeVisible()
  await expect(page.getByText('Semana del 24–30 oct')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expectNoSeriousAxeViolations(page)

  const nav = page.getByRole('navigation', { name: 'Secciones' })
  const sections: Array<{ link: string; heading: string; url: RegExp; settled: string }> = [
    { link: 'Conversaciones', heading: 'Conversaciones', url: /\/conversaciones$/, settled: 'Horario' },
    { link: 'Sin respuesta', heading: 'Sin respuesta', url: /\/sin-respuesta$/, settled: 'No hay preguntas pendientes.' },
    { link: 'Conocimiento', heading: 'Conocimiento', url: /\/conocimiento$/, settled: 'horario.pdf' },
    { link: 'Ajustes del bot', heading: 'Ajustes del bot', url: /\/ajustes$/, settled: 'Cómo habla el bot' },
    { link: 'Organizaciones', heading: 'Organizaciones', url: /\/organizaciones$/, settled: 'Abrir el panel' },
    { link: 'Panel', heading: 'Hola, Ada', url: /\/admin\/?$/, settled: 'Semana del 24–30 oct' },
  ]

  for (const section of sections) {
    await nav.getByRole('link', { name: section.link, exact: true }).click()
    await expect(page).toHaveURL(section.url)
    await expect(page.getByRole('heading', { level: 1, name: section.heading })).toBeVisible()
    await expect(page.getByText(section.settled).first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/No hemos podido/)).toHaveCount(0)
  }

  await page.goto('/admin/conversaciones')
  await expect(page.getByRole('heading', { level: 1, name: 'Conversaciones' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Conversaciones' })).toBeVisible()
  await expect(page.getByText('Horario').first()).toBeVisible()
  await page.waitForLoadState('networkidle')

  assertClean(problems)
})

test('signed-in shell exposes the skip link, sidebar focus, menu, and errors', async ({ page }) => {
  const problems = watch(page)
  await installApi(page, problems, 'admin')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/admin/')
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Ada' })).toBeVisible()

  const skip = page.getByRole('link', { name: 'Saltar al contenido' })
  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()

  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const sectionLink = page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Conversaciones' })
  await expect(sectionLink).toBeFocused()
  const ring = await sectionLink.evaluate((el) => {
    const link = getComputedStyle(el)
    const aside = el.closest('aside')
    return {
      outline: link.outlineColor,
      style: link.outlineStyle,
      background: aside ? getComputedStyle(aside).backgroundColor : '',
    }
  })
  expect(ring.style).toBe('solid')
  expect(ring.outline).not.toBe(ring.background)

  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#contenido')).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  const insideDrawer = await page.evaluate(() => document.querySelector('aside')?.contains(document.activeElement) ?? false)
  expect(insideDrawer).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused()

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Ajustes del bot' }).click()
  const privacyUrl = page.getByRole('textbox', { name: 'URL de la política de privacidad' })
  await privacyUrl.fill('http://example.com/privacy')
  await page.getByRole('button', { name: 'Guardar' }).click()
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(privacyUrl).toHaveAttribute('aria-invalid', 'true')
  await expect(privacyUrl).toHaveAttribute('aria-describedby', 'privacy-url-error')

  assertClean(problems)
})

test('landing page has no serious or critical accessibility violations', async ({ page }) => {
  const problems = watch(page)
  await installLanding(page, problems)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Las preguntas de siempre, contestadas en WhatsApp.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Escríbenos' }).first()).toBeVisible()
  await expectNoSeriousAxeViolations(page)
  assertClean(problems)
})
