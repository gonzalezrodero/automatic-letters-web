import type { Conversation, ConversationEvent, KnowledgeDocument, TenantProfile } from '../api/types'

export interface DemoDatabase {
  version: number
  tenants: TenantProfile[]
  conversations: Conversation[]
  documents: KnowledgeDocument[]
}

export const SEED_VERSION = 1

const at = (day: number, time: string) =>
  `2026-09-${String(day).padStart(2, '0')}T${time}:00+02:00`

function thread(
  turns: Array<{ who: 'user' | 'bot'; text: string; at: string }>,
): ConversationEvent[] {
  return turns.map((turn) =>
    turn.who === 'user'
      ? { type: 'MessageReceived', text: turn.text, at: turn.at }
      : { type: 'ReplyGenerated', text: turn.text, at: turn.at },
  )
}

const clubPrompt = `Ets l'assistent del Club Bàsquet Samà (Cambrils). Ajudes famílies amb el campus d'estiu de bàsquet: dates, edats, preus, equipació, esmorzar, lesions, transport i inscripcions.

Respon en l'idioma de la família (català, castellà o anglès), amb un to proper i concret. No inventis places ni imports: si no consta a la base de coneixement, ofereix el telèfon de secretaria 977 000 214.

Dades estables del campus 2026:
- Dates: 29 de juny al 24 de juliol, de dilluns a divendres, de 9:00 a 13:30.
- Lloc: pavelló del club, Cambrils.
- Grups: iniciació 8-10, mitjà 11-13, competició 14-16.
- Preu: 145 € la setmana o 520 € el mes complet. El segon germà té un 15 % de descompte.
- Inclou entrenament, samarreta del campus i esmorzar. El dinar no està inclòs.
- Inscripció: https://www.cbsama.cat/campus

Si algú escriu BORRAR DATOS, ESBORRAR DADES o DELETE DATA, no continuïs la conversa: el sistema anonimitzarà el xat.`

const musicPrompt = `Ets la secretaria virtual de l'Escola de Música L'Harmonia (Girona). Ajudes amb matrícula, prova de nivell, horaris, quotes, lloguer d'instruments, canvi de professor i concerts.

Respon en català, castellà o anglès, segons la llengua de la persona, amb un tracte clar i tranquil. No confirmitis una plaça concreta si l'horari no surt als documents: deriva a secretaria@harmonia.cat o al 972 000 448.

Curs 2026-27:
- La matrícula obre el 15 de juny.
- Prova de nivell gratuïta, 20 minuts.
- Classes individuals de 30 o 45 minuts.
- Descompte del 10 % a la segona quota d'un germà.
- Lloguer de violí o guitarra per a alumnes: 18 € al mes.
- Lloguer de sala d'assaig: 12 € l'hora per a alumnes.

Política de privacitat: https://harmonia.cat/privacitat. Les ordres BORRAR DATOS, ESBORRAR DADES i DELETE DATA les resol el sistema, no tu.`

export const seedDatabase: DemoDatabase = {
  version: SEED_VERSION,
  tenants: [
    {
      id: 'club-basquet-sama',
      name: 'Club Bàsquet Samà',
      shortName: 'CB Samà',
      city: 'Cambrils',
      kind: 'Campus d’estiu de bàsquet',
      botPhoneNumberId: '109283746510293',
      displayPhone: '+34 977 000 214',
      systemPrompt: clubPrompt,
      privacyPolicyUrl: 'https://www.cbsama.cat/privacitat',
    },
    {
      id: 'escola-harmonia',
      name: 'Escola de Música L’Harmonia',
      shortName: 'L’Harmonia',
      city: 'Girona',
      kind: 'Escola de música',
      botPhoneNumberId: '109588221004871',
      displayPhone: '+34 972 000 448',
      systemPrompt: musicPrompt,
      privacyPolicyUrl: 'https://harmonia.cat/privacitat',
    },
  ],
  documents: [
    {
      id: 'doc-cbs-1',
      tenantId: 'club-basquet-sama',
      filename: 'campus-estiu-2026.pdf',
      mime: 'application/pdf',
      bytes: 842_113,
      uploadedAt: at(2, '11:20'),
      chunkCount: 46,
      status: 'indexed',
    },
    {
      id: 'doc-cbs-2',
      tenantId: 'club-basquet-sama',
      filename: 'normativa-equipacio.md',
      mime: 'text/markdown',
      bytes: 18_440,
      uploadedAt: at(3, '16:05'),
      chunkCount: 8,
      status: 'indexed',
    },
    {
      id: 'doc-cbs-3',
      tenantId: 'club-basquet-sama',
      filename: 'menu-esmorzar.txt',
      mime: 'text/plain',
      bytes: 6_210,
      uploadedAt: at(8, '09:40'),
      chunkCount: 3,
      status: 'indexed',
    },
    {
      id: 'doc-cbs-4',
      tenantId: 'club-basquet-sama',
      filename: 'faq-families.pdf',
      mime: 'application/pdf',
      bytes: 220_480,
      uploadedAt: at(12, '18:12'),
      chunkCount: 19,
      status: 'indexed',
    },
    {
      id: 'doc-har-1',
      tenantId: 'escola-harmonia',
      filename: 'guia-matricula-2026-27.pdf',
      mime: 'application/pdf',
      bytes: 510_220,
      uploadedAt: at(1, '10:00'),
      chunkCount: 31,
      status: 'indexed',
    },
    {
      id: 'doc-har-2',
      tenantId: 'escola-harmonia',
      filename: 'professors-i-instruments.md',
      mime: 'text/markdown',
      bytes: 27_900,
      uploadedAt: at(4, '13:30'),
      chunkCount: 11,
      status: 'indexed',
    },
    {
      id: 'doc-har-3',
      tenantId: 'escola-harmonia',
      filename: 'lloguer-instruments.txt',
      mime: 'text/plain',
      bytes: 4_880,
      uploadedAt: at(9, '17:18'),
      chunkCount: 3,
      status: 'indexed',
    },
    {
      id: 'doc-har-4',
      tenantId: 'escola-harmonia',
      filename: 'calendari-concerts.pdf',
      mime: 'application/pdf',
      bytes: 188_640,
      uploadedAt: at(14, '12:45'),
      chunkCount: 14,
      status: 'indexed',
    },
  ],
  conversations: [
    {
      id: 'cbs-01',
      tenantId: 'club-basquet-sama',
      userPhone: '+34611223301',
      language: 'ca',
      topic: 'Inscripció al campus',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(28, '09:14'),
          text: 'Hola, bon dia! Vull inscriure la meva filla de 9 anys al campus d’estiu. Encara hi ha places al grup d’iniciació?',
        },
        {
          who: 'bot',
          at: at(28, '09:14'),
          text: 'Bon dia! Sí, al grup d’iniciació (8-10 anys) queden 7 places. El campus és del 29 de juny al 24 de juliol, de dilluns a divendres, de 9:00 a 13:30, al pavelló del Club Bàsquet Samà, a Cambrils.',
        },
        {
          who: 'user',
          at: at(28, '09:16'),
          text: 'Què inclou el preu? Té una germana de 12 anys i potser les apunto totes dues.',
        },
        {
          who: 'bot',
          at: at(28, '09:16'),
          text: 'La quota és de 145 € per setmana o 520 € el mes complet. Inclou l’entrenament, la samarreta del campus i l’esmorzar. La germana de 12 aniria al grup mitjà (11-13). El segon germà té un 15 % de descompte.',
        },
        {
          who: 'user',
          at: at(28, '09:18'),
          text: 'Perfecte. Em pots passar l’enllaç d’inscripció?',
        },
        {
          who: 'bot',
          at: at(28, '09:18'),
          text: 'És clar: https://www.cbsama.cat/campus. Si necessiteu factura a nom de l’AMPA, indiqueu-ho al formulari. Secretaria: 977 000 214.',
        },
      ]),
    },
    {
      id: 'cbs-02',
      tenantId: 'club-basquet-sama',
      userPhone: '+34622001102',
      language: 'es',
      topic: 'Precios y pago',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(28, '11:02'),
          text: 'Buenas, ¿se puede pagar el campus semana a semana? En julio nos vamos de vacaciones una semana.',
        },
        {
          who: 'bot',
          at: at(28, '11:02'),
          text: 'Sí. Puedes reservar semanas sueltas a 145 € cada una, o el mes completo por 520 €. Si faltáis una semana, lo más sencillo es no incluirla en la inscripción.',
        },
        {
          who: 'user',
          at: at(28, '11:05'),
          text: '¿Y el pago es por transferencia? Necesito factura para la empresa.',
        },
        {
          who: 'bot',
          at: at(28, '11:05'),
          text: 'El formulario admite transferencia y tarjeta. El IBAN aparece al final del paso de pago. Marca la casilla de factura y escribe el NIF: la emitimos a nombre de quien indiques.',
        },
        {
          who: 'user',
          at: at(28, '11:07'),
          text: 'Genial, lo miro esta tarde. Gracias.',
        },
        {
          who: 'bot',
          at: at(28, '11:07'),
          text: 'Cuando quieras. Si el formulario te da un error, secretaría lo revisa en el 977 000 214.',
        },
      ]),
    },
    {
      id: 'cbs-03',
      tenantId: 'club-basquet-sama',
      userPhone: '+34633112203',
      language: 'ca',
      topic: 'Equipació',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(26, '17:41'),
          text: 'Quina roba ha de portar el nen? És el primer any i no tenim samarreta del club.',
        },
        {
          who: 'bot',
          at: at(26, '17:41'),
          text: 'El primer dia lliurem la samarreta del campus. Cal que porti pantaló curt esportiu, sabatilles de sala (no de futbol) i una ampolla d’aigua amb el nom. La normativa completa és al document d’equipació.',
        },
        {
          who: 'user',
          at: at(26, '17:44'),
          text: 'Juga amb ulleres. Hi ha cap problema?',
        },
        {
          who: 'bot',
          at: at(26, '17:44'),
          text: 'Cap problema. Si són ulleres de dia, millor unes de subjecció esportiva. Ho apuntem a la fitxa si ho escrius al formulari, a l’apartat d’observacions.',
        },
      ]),
    },
    {
      id: 'cbs-04',
      tenantId: 'club-basquet-sama',
      userPhone: '+34644889904',
      language: 'es',
      topic: 'Alergias y comida',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(25, '08:22'),
          text: 'Mi hijo es celíaco. ¿El desayuno del campus lo puede tomar? No quiero que se quede sin nada.',
        },
        {
          who: 'bot',
          at: at(25, '08:23'),
          text: 'El desayuno incluye fruta, bocadillo y agua. Hay opción sin gluten si lo avisáis al inscribiros. El menú de la semana está en el documento menu-esmorzar. El almuerzo no entra en la cuota: se come en casa.',
        },
        {
          who: 'user',
          at: at(25, '08:26'),
          text: 'También es alérgico a los frutos secos, no solo al gluten.',
        },
        {
          who: 'bot',
          at: at(25, '08:26'),
          text: 'Indícalo en observaciones y llama a secretaría al 977 000 214 para dejarlo por escrito. El monitor del grupo lleva la lista de alergias cada mañana. No servimos frutos secos en el desayuno del campus.',
        },
        {
          who: 'user',
          at: at(25, '08:28'),
          text: 'Vale, llamo luego. Muchas gracias.',
        },
        {
          who: 'bot',
          at: at(25, '08:28'),
          text: 'Gracias a ti. Secretaría coge el teléfono de 9:30 a 13:30.',
        },
      ]),
    },
    {
      id: 'cbs-05',
      tenantId: 'club-basquet-sama',
      userPhone: '+34655110005',
      language: 'ca',
      topic: 'Lesió',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(24, '19:05'),
          text: 'La Jana s’ha torçat el turmell al pati. El metge diu que pot caminar però no saltar durant dues setmanes. Pot venir igualment al campus?',
        },
        {
          who: 'bot',
          at: at(24, '19:06'),
          text: 'Sí, pot venir. El protocol de lesions preveu feina a banda pista: passada, lectura de joc i tir estàtic, sense salt ni contacte. Porta el justificant el primer dia i avisa el monitor.',
        },
        {
          who: 'user',
          at: at(24, '19:08'),
          text: 'I si es troba malament a mig matí?',
        },
        {
          who: 'bot',
          at: at(24, '19:08'),
          text: 'Truquem a la família i, si cal, al 112. No donem medicació. Al formulari ha de constar un telèfon que agafi algú entre les 9:00 i les 13:30.',
        },
      ]),
    },
    {
      id: 'cbs-06',
      tenantId: 'club-basquet-sama',
      userPhone: '+447700900123',
      language: 'en',
      topic: 'Schedule and pickup',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(23, '16:12'),
          text: 'Hi, we are visiting Cambrils in July. Is the basketball camp open to children who are not club members? My son is 10.',
        },
        {
          who: 'bot',
          at: at(23, '16:12'),
          text: 'Hi! Yes, the summer camp is open to non-members. A 10-year-old joins the initiation group (ages 8–10). It runs 29 June to 24 July, Monday to Friday, 9:00–13:30.',
        },
        {
          who: 'user',
          at: at(23, '16:15'),
          text: 'Where do we pick him up, and can we book just the second week of July?',
        },
        {
          who: 'bot',
          at: at(23, '16:16'),
          text: 'Pickup is at the pavilion door at 13:30. Single weeks are 145 €. The week of 6–10 July is still open. Enrolment form: https://www.cbsama.cat/campus — you can fill it in English and we will answer in English.',
        },
      ]),
    },
    {
      id: 'cbs-07',
      tenantId: 'club-basquet-sama',
      userPhone: '+34667002206',
      language: 'es',
      topic: 'Transporte desde Reus',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(22, '13:48'),
          text: 'Hola, ¿hay autobús desde Reus? No tenemos coche entre semana.',
        },
        {
          who: 'bot',
          at: at(22, '13:49'),
          text: 'Sí. El autobús del campus sale a las 8:20 de la estación de Reus y vuelve a salir del pabellón a las 13:40. Las plazas son limitadas y se marcan en el formulario, suplemento de 18 € por semana.',
        },
        {
          who: 'user',
          at: at(22, '13:52'),
          text: '¿Para en Salou o solo en Reus?',
        },
        {
          who: 'bot',
          at: at(22, '13:52'),
          text: 'Solo tiene parada en la estación de Reus y en el pabellón de Cambrils. Salou no entra en la ruta de este año.',
        },
        {
          who: 'user',
          at: at(22, '13:54'),
          text: 'Entendido. Reservaré la plaza del bus al apuntarlo.',
        },
        {
          who: 'bot',
          at: at(22, '13:54'),
          text: 'Perfecto. Si la ruta se llena, secretaría escribe por aquí antes de cobrar el suplemento.',
        },
      ]),
    },
    {
      id: 'cbs-08',
      tenantId: 'club-basquet-sama',
      userPhone: '',
      language: 'ca',
      topic: 'Borrado de datos',
      anonymized: true,
      deletionRequestedAt: at(21, '19:42'),
      events: [],
    },
    {
      id: 'cbs-09',
      tenantId: 'club-basquet-sama',
      userPhone: '+34678123407',
      language: 'es',
      topic: 'Grupos por edad',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(18, '20:11'),
          text: 'Mi hijo cumple 11 el 10 de julio, durante el campus. ¿Empieza con los de 10 o ya pasa al grupo de 11?',
        },
        {
          who: 'bot',
          at: at(18, '20:11'),
          text: 'El grupo se asigna con la edad que tendrá el 29 de junio, el primer día. Si ese día aún tiene 10, empieza en iniciación. Si el monitor ve que se le queda corto, lo subimos a mitad de semana sin cambiar la cuota.',
        },
        {
          who: 'user',
          at: at(18, '20:14'),
          text: 'Lleva dos años en el colegio, pero es muy tímido. Prefiero que no lo subáis enseguida.',
        },
        {
          who: 'bot',
          at: at(18, '20:15'),
          text: 'Lo anotamos. Escribe “mantener en iniciación” en observaciones y no lo cambiaremos de grupo sin hablar antes contigo.',
        },
      ]),
    },
    {
      id: 'cbs-10',
      tenantId: 'club-basquet-sama',
      userPhone: '+34689234508',
      language: 'ca',
      topic: 'Nivell competitiu',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(16, '18:36'),
          text: 'El meu fill juga a infantil en un altre club. El grup de competició del campus fa algun partit o només entrenen?',
        },
        {
          who: 'bot',
          at: at(16, '18:37'),
          text: 'El grup de 14-16 anys entrena amb oposició i tàctica. Els divendres hi ha un partit intern, sense classificació. No és un torneig federat.',
        },
        {
          who: 'user',
          at: at(16, '18:40'),
          text: 'Pot portar la samarreta del seu club o és obligatòria la del campus?',
        },
        {
          who: 'bot',
          at: at(16, '18:40'),
          text: 'La samarreta del campus és obligatòria als partits del divendres, perquè els equips es fan barrejats. A l’entrenament pot portar la seva si vol, però molts dies fem petos.',
        },
        {
          who: 'user',
          at: at(16, '18:43'),
          text: 'D’acord, miraré places aquest cap de setmana.',
        },
        {
          who: 'bot',
          at: at(16, '18:43'),
          text: 'Al grup de competició en queden 4. Si vols que t’avisem quan en quedin dues, escriu-nos i ho diem a secretaria.',
        },
      ]),
    },
    {
      id: 'har-01',
      tenantId: 'escola-harmonia',
      userPhone: '+34610101011',
      language: 'ca',
      topic: 'Prova de piano',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(28, '10:05'),
          text: 'Bon dia. La meva filla de 8 anys vol començar piano. Cal fer prova de nivell si no n’ha fet mai?',
        },
        {
          who: 'bot',
          at: at(28, '10:05'),
          text: 'Bon dia! Si no ha estudiat abans, la prova és igualment de 20 minuts i gratuïta: serveix per conèixer la professora i triar horari, no per aprovar. Aquest curs la fa la Laia Serra.',
        },
        {
          who: 'user',
          at: at(28, '10:08'),
          text: 'Teniu algun forat els dimarts a última hora? Sortim de l’escola a les 17:00.',
        },
        {
          who: 'bot',
          at: at(28, '10:09'),
          text: 'Dimarts queda un 30 minuts a les 17:30 i un 45 minuts a les 18:15. No puc reservar-lo des d’aquí: escriu a secretaria@harmonia.cat o truca al 972 000 448 i demana la prova amb la Laia.',
        },
        {
          who: 'user',
          at: at(28, '10:11'),
          text: 'Truco ara. Gràcies!',
        },
        {
          who: 'bot',
          at: at(28, '10:11'),
          text: 'De res. Si no agafen el telèfon, deixeu un missatge: tornen la trucada el mateix dia lectiu.',
        },
      ]),
    },
    {
      id: 'har-02',
      tenantId: 'escola-harmonia',
      userPhone: '+34621212112',
      language: 'es',
      topic: 'Alquiler de violín',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(27, '12:16'),
          text: 'Hola, ¿alquiláis violines de media talla? Mi hijo mide 1,32 y no quiero comprar todavía.',
        },
        {
          who: 'bot',
          at: at(27, '12:17'),
          text: 'Sí. El alquiler para alumnos es de 18 € al mes e incluye el instrumento y el arco. La talla la confirma el profesor en la prueba de nivel: con 1,32 m suele tocar un 1/2.',
        },
        {
          who: 'user',
          at: at(27, '12:20'),
          text: '¿Hay fianza? Y si se rompe una cuerda, ¿quién la paga?',
        },
        {
          who: 'bot',
          at: at(27, '12:20'),
          text: 'La fianza es de 40 €, se devuelve al entregar el violín. Las cuerdas de recambio por uso normal las pone la escuela. Un golpe o una rotura del cuerpo se valora aparte, está en lloguer-instruments.txt.',
        },
      ]),
    },
    {
      id: 'har-03',
      tenantId: 'escola-harmonia',
      userPhone: '+34632323213',
      language: 'ca',
      topic: 'Horari de violoncel',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(27, '18:02'),
          text: 'Busco classe de violoncel per a una adulta, principiació total. Hi ha horaris de matí?',
        },
        {
          who: 'bot',
          at: at(27, '18:03'),
          text: 'Sí. El Pau Riera fa adults els dimecres i divendres al matí. Queda una classe de 45 minuts els divendres a les 10:30. Les de 30 minuts del dimecres estan plenes fins al novembre.',
        },
        {
          who: 'user',
          at: at(27, '18:06'),
          text: 'El divendres em va bé. Quant costa al mes?',
        },
        {
          who: 'bot',
          at: at(27, '18:06'),
          text: 'La classe de 45 minuts és de 98 € al mes, més 35 € de matrícula un sol cop. La prova de nivell és gratuïta. La matrícula del curs 2026-27 ja és oberta.',
        },
        {
          who: 'user',
          at: at(27, '18:09'),
          text: 'Em podeu agafar la prova divendres que ve?',
        },
        {
          who: 'bot',
          at: at(27, '18:09'),
          text: 'Des del xat no puc bloquejar l’agenda. Truca al 972 000 448 i demana prova de violoncel amb el Pau, divendres a les 10:30. Si aquella hora es cobreix, t’oferiran la següent.',
        },
      ]),
    },
    {
      id: 'har-04',
      tenantId: 'escola-harmonia',
      userPhone: '+34643434314',
      language: 'es',
      topic: 'Audición de invierno',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(25, '09:33'),
          text: '¿Cuándo es el concierto de invierno? Mi hija toca flauta en primero y quiere saber si puede salir.',
        },
        {
          who: 'bot',
          at: at(25, '09:34'),
          text: 'El concierto de invierno es el 19 de diciembre a las 18:00 en el Teatre Municipal de Girona. En primero de flauta se participa si la profesora lo propone: normalmente una pieza corta en grupo, no a solo.',
        },
        {
          who: 'user',
          at: at(25, '09:37'),
          text: '¿Hay ensayo general el mismo día? Trabajamos hasta las 17:00.',
        },
        {
          who: 'bot',
          at: at(25, '09:37'),
          text: 'El ensayo general es el 18 de diciembre de 17:30 a 19:00 en la escuela, aula gran. El día 19 hay que estar en el teatro a las 17:15. El calendario completo está en calendari-concerts.pdf.',
        },
      ]),
    },
    {
      id: 'har-05',
      tenantId: 'escola-harmonia',
      userPhone: '+34654545415',
      language: 'ca',
      topic: 'Quotes i germans',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(24, '15:21'),
          text: 'Tenim dos fills a l’escola, guitarra i cant. El descompte de germans s’aplica als dos rebuts o només al segon?',
        },
        {
          who: 'bot',
          at: at(24, '15:22'),
          text: 'Només al segon rebut, el de l’import més baix. És un 10 % sobre la quota mensual, no sobre la matrícula. Si els dos fan 30 minuts, el descompte va a un dels dos.',
        },
        {
          who: 'user',
          at: at(24, '15:25'),
          text: 'Al rebut de setembre no el veig. Ha sigut un error?',
        },
        {
          who: 'bot',
          at: at(24, '15:25'),
          text: 'Al setembre el descompte entra a partir del segon rebut domiciliat. Si tots dos ja éreu alumnes el curs passat i no surt, secretaria ho revisa: secretaria@harmonia.cat amb els dos noms.',
        },
      ]),
    },
    {
      id: 'har-06',
      tenantId: 'escola-harmonia',
      userPhone: '+33612345678',
      language: 'en',
      topic: 'Adult guitar lessons',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(23, '19:48'),
          text: 'Hello, I just moved to Girona. Do you take adult beginners for acoustic guitar, ideally after 19:00?',
        },
        {
          who: 'bot',
          at: at(23, '19:49'),
          text: 'Hello, and welcome. Yes. Adult acoustic guitar is with Joana Vidal. There is a 45-minute opening on Thursdays at 19:15. Earlier evening slots are full until January.',
        },
        {
          who: 'user',
          at: at(23, '19:52'),
          text: 'I can do Thursdays. Can I rent a guitar for the first term?',
        },
        {
          who: 'bot',
          at: at(23, '19:52'),
          text: 'Students can rent a guitar for 18 € a month, plus a 40 € deposit. The first placement meeting is free and lasts 20 minutes. Call 972 000 448 and ask for Joana on Thursday at 19:15.',
        },
        {
          who: 'user',
          at: at(23, '19:55'),
          text: 'Perfect, I will call tomorrow.',
        },
        {
          who: 'bot',
          at: at(23, '19:55'),
          text: 'Great. Office hours are weekdays 10:00–13:30 and 16:00–19:30.',
        },
      ]),
    },
    {
      id: 'har-07',
      tenantId: 'escola-harmonia',
      userPhone: '+34665656516',
      language: 'es',
      topic: 'Cambio de profesor',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(22, '11:27'),
          text: 'Querríamos cambiar de profesora de piano. No es un conflicto, es que el horario de la Marta ya no nos encaja con el entreno.',
        },
        {
          who: 'bot',
          at: at(22, '11:28'),
          text: 'Se puede pedir el cambio al empezar el trimestre. El siguiente corte es el 1 de octubre. Piano también lo da el Nil Bosch, con hueco el lunes a las 18:00 (30 min) y el miércoles a las 17:15 (45 min).',
        },
        {
          who: 'user',
          at: at(22, '11:31'),
          text: 'El lunes a las 18:00 nos iría bien. ¿Perdemos la plaza de la Marta si lo pedimos y luego no hay hueco?',
        },
        {
          who: 'bot',
          at: at(22, '11:31'),
          text: 'No. La plaza actual se mantiene hasta que secretaría confirma el cambio por escrito. Escribe a secretaria@harmonia.cat con el nombre del alumno y “cambio a Nil, lunes 18:00”.',
        },
      ]),
    },
    {
      id: 'har-08',
      tenantId: 'escola-harmonia',
      userPhone: '',
      language: 'es',
      topic: 'Borrado de datos',
      anonymized: true,
      deletionRequestedAt: at(20, '21:06'),
      events: [],
    },
    {
      id: 'har-09',
      tenantId: 'escola-harmonia',
      userPhone: '+34676767617',
      language: 'es',
      topic: 'Matrícula 2026-27',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(17, '17:04'),
          text: 'Somos nuevos en Girona. ¿Hasta cuándo está abierta la matrícula de lenguaje musical? La niña tiene 7 años.',
        },
        {
          who: 'bot',
          at: at(17, '17:05'),
          text: 'La matrícula del curso 2026-27 sigue abierta. Lenguaje musical de 7 años es en grupo, los martes de 17:00 a 17:50. La prueba de nivel es gratuita y en este caso solo reparte el grupo, no excluye.',
        },
        {
          who: 'user',
          at: at(17, '17:08'),
          text: '¿Hace falta instrumento propio para lenguaje musical?',
        },
        {
          who: 'bot',
          at: at(17, '17:08'),
          text: 'No. En lenguaje musical se trabaja con la voz y con material de la escuela. El instrumento, si más adelante elige uno, se decide con el profesorado.',
        },
        {
          who: 'user',
          at: at(17, '17:11'),
          text: '¿Me pasas el precio del grupo?',
        },
        {
          who: 'bot',
          at: at(17, '17:11'),
          text: 'El grupo de lenguaje musical es de 42 € al mes, más 35 € de matrícula única. El segundo hermano tiene un 10 % en la cuota, no en la matrícula.',
        },
      ]),
    },
    {
      id: 'har-10',
      tenantId: 'escola-harmonia',
      userPhone: '+34687878718',
      language: 'ca',
      topic: 'Lloguer de sala',
      anonymized: false,
      events: thread([
        {
          who: 'user',
          at: at(15, '20:18'),
          text: 'Som un quartet d’alumnes i necessitem sala per assajar abans del concert. Quin preu feu?',
        },
        {
          who: 'bot',
          at: at(15, '20:19'),
          text: 'Per a alumnes, la sala gran és de 12 € l’hora. Cal que almenys una persona del quartet estigui matriculada aquest curs. Fora d’alumnes la tarifa és de 22 € i no la gestiono jo.',
        },
        {
          who: 'user',
          at: at(15, '20:22'),
          text: 'Podem els diumenges? Entre setmana no coincidim.',
        },
        {
          who: 'bot',
          at: at(15, '20:22'),
          text: 'Diumenge l’escola és tancada. Dissabte hi ha assajos de 10:00 a 14:00. Aquesta setmana queda dissabte 3 d’octubre, d’11:00 a 13:00, si el voleu sencer.',
        },
        {
          who: 'user',
          at: at(15, '20:25'),
          text: 'Sí, dues hores. Ho deixes apuntat?',
        },
        {
          who: 'bot',
          at: at(15, '20:25'),
          text: 'No puc confirmar reserves. Envia un correu a secretaria@harmonia.cat amb els quatre noms i “sala gran, 3 d’octubre, 11:00-13:00”. Us respondran amb el número de reserva.',
        },
      ]),
    },
  ],
}
