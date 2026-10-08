# SPEC 01 — MVP visual de Arcade Vault (5 pantallas)

> **Estado:** Aprobado
> **Depende de:** ninguna (el tema de `app/globals.css` y las fuentes de `app/layout.tsx` ya existen por el merge `01-styles`)
> **Fecha:** 2026-10-08
> **Objetivo:** Portar a Next.js las cinco pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) como interfaz navegable con datos mock, sin implementar ningún juego.

---

## Por qué existe esta spec

`references/templates/` es un prototipo en React UMD + Babel con rutas por hash, datos en `window` y CSS plano. El proyecto es Next.js 16 con App Router y `cacheComponents`. Hay que decidir cómo traducir el prototipo (rutas, límites servidor/cliente, sesión mock) para no improvisarlo durante la implementación.

---

## Alcance

**Dentro:**

- Cinco rutas reales del App Router que replican las pantallas de la plantilla:
  - `/` → Biblioteca (`biblioteca.jsx`).
  - `/juegos/[id]` → Detalle (`detalle.jsx`).
  - `/juegos/[id]/jugar` → Reproductor (`reproductor.jsx`).
  - `/auth` → Iniciar sesión / crear cuenta (`auth.jsx`).
  - `/salon` → Salón de la Fama (`salon.jsx`).
- Barra de navegación (con menú móvil) y footer comunes, definidos en `app/layout.tsx` (`nav.jsx`, footer de `app.jsx`).
- Datos mock tipados: 8 juegos, categorías y generador determinista de puntuaciones (`data.jsx`).
- Sesión mock en `localStorage` (clave `av_user`) expuesta por un contexto React.
- Reproductor como réplica del mock: HUD, marco CRT con arena decorativa en CSS, puntuación simulada con `setInterval`, pausa, fin de partida y modal de guardar puntuación (`localStorage`, clave `av_scores`).
- Portado de las clases pendientes de `references/templates/styles.css` a `app/globals.css` (los tokens y `@theme inline` ya existen).
- Página 404 temática (`app/not-found.tsx`) para ids de juego inexistentes.

**Fuera de alcance (para futuras specs):**

- Cualquier juego jugable. La arena del reproductor es decorativa.
- Backend, base de datos, autenticación real y OAuth. Los botones Google y GitHub no hacen nada.
- Validación de formularios de auth. El formulario acepta cualquier valor, como la plantilla.
- Menú desplegable de usuario (Cuenta / Cerrar sesión). El botón de usuario cierra sesión directamente.
- Tests automatizados (no hay test runner configurado).
- Internacionalización y tema claro. Solo español y tema oscuro neón.
- Lectura de `av_scores` en alguna pantalla. Se escribe, pero ninguna pantalla lo muestra todavía.

---

## Modelo de datos

```ts
// lib/games.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type AccentColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug: "bloque-buster", "caida", ...
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;       // clase CSS: "cover-bricks", "cover-tetro", ...
  color: AccentColor;  // color del botón JUGAR en la tarjeta
  best: number;        // mejor puntuación global
  plays: string;       // texto ya formateado: "12.4K"
};

export const GAMES: Game[];                              // los 8 juegos de data.jsx, sin cambios
export const CATS: ("TODOS" | Category)[];               // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]

// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date: "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[];             // determinista, sin Math.random

// components/session-provider.tsx
export type SessionUser = { name: string };              // máx. 10 caracteres, en mayúsculas
// localStorage "av_user"   → SessionUser | null
// localStorage "av_scores" → { game: string; score: number; name: string; at: number }[]
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- `seededScores` se llama con las mismas semillas que la plantilla: `id.length * 17 + 3` (detalle, 10 filas) y `id.length * 23 + 7` (salón, 12 filas).
- El contexto de sesión expone `{ user, login(user), signOut() }`.

---

## Plan de implementación

1. **Datos mock.** Crear `lib/games.ts` y `lib/scores.ts` con los tipos anteriores, portando `data.jsx`. Prueba manual: `npm run lint` pasa.
2. **Estilos.** Portar a `app/globals.css` las clases de `styles.css` que aún no estén (nav, `.btn`, hero, filtros, `.card`, `.cover-*`, detalle, leaderboard, player/CRT, modal, auth, salón, utilidades `.fade-in` y `.slide-in`). Prueba manual: `npm run dev` arranca sin errores de CSS.
3. **Sesión mock.** Crear `components/session-provider.tsx` (`"use client"`) con el contexto, lectura de `av_user` en `useEffect` y funciones `login` / `signOut`.
4. **Shell común.** Crear `components/nav.tsx` (cliente: menú móvil, enlace activo con `usePathname`, botón de sesión) y `components/footer.tsx`. Montarlos en `app/layout.tsx` dentro de `.av-root`, con `SessionProvider` envolviendo el contenido. Prueba manual: la nav se ve en `/`.
5. **Biblioteca.** Crear `components/game-card.tsx` (cliente, efecto tilt) y `components/library.tsx` (cliente, búsqueda y chips de categoría, estado "NO HAY RESULTADOS"). Reemplazar `app/page.tsx`. Prueba manual: filtrar por texto y categoría; pulsar una tarjeta lleva a `/juegos/[id]`.
6. **Detalle.** Crear `app/juegos/[id]/page.tsx` como Server Component con `generateStaticParams` y `notFound()`. Crear `components/leaderboard.tsx`. Crear `app/not-found.tsx`. Prueba manual: `/juegos/caida` se ve completo; `/juegos/xyz` muestra el 404.
7. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx` y `components/game-player.tsx` (cliente): HUD, CRT, pausa, FIN, modal de fin de partida, guardar puntuación en `av_scores`, "Jugar de nuevo" y "Volver al vault". Prueba manual: la puntuación sube sola; pausa la detiene; FIN abre el modal.
8. **Auth.** Crear `app/auth/page.tsx` y `components/auth-form.tsx` (cliente): pestañas entrar / crear cuenta, campo de correo solo en "crear", entrar como invitado, botones sociales inertes. Al enviar, `login` y redirección a `/` con `useRouter`. Prueba manual: tras entrar, la nav muestra el nombre en mayúsculas.
9. **Salón de la fama.** Crear `app/salon/page.tsx` y `components/hall-of-fame.tsx` (cliente): pestañas por juego, podio, tabla animada y bloque "TU MEJOR MARCA" solo con sesión. Prueba manual: cambiar de pestaña cambia podio y tabla.
10. **Cierre de metadatos.** Ajustar el título de `metadata` si hace falta (`Arcade Vault · Portal Retro`). Ejecutar `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` termina sin errores.
- [ ] `npm run build` termina sin errores ni avisos de `cacheComponents` sobre rutas dinámicas sin `Suspense`.
- [ ] `/` muestra 8 tarjetas de juego con portada CSS, categoría, mejor puntuación y botón JUGAR.
- [ ] En `/`, escribir "caí" en el buscador deja solo la tarjeta CAÍDA.
- [ ] En `/`, el chip SHOOTER deja exactamente 2 tarjetas (INVASORES y ROCAS).
- [ ] En `/`, una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/<id>` muestra portada, etiquetas, descripción larga, tira de estadísticas y 10 filas de "MEJORES PUNTUACIONES" con las 3 primeras en oro, plata y bronce.
- [ ] Recargar `/juegos/<id>` muestra las mismas 10 puntuaciones (datos deterministas).
- [ ] `/juegos/xyz` muestra la página 404 temática.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar`; "VOLVER AL VAULT" navega a `/`.
- [ ] En el reproductor la puntuación aumenta sola cada ~220 ms; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la continúa.
- [ ] En el reproductor, FIN abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" muestra "PUNTUACIÓN GUARDADA_" y añade una entrada a `localStorage["av_scores"]`.
- [ ] En el modal, "JUGAR DE NUEVO" reinicia puntuación, vidas y nivel; SALIR lleva a `/juegos/<id>`.
- [ ] El campo de nombre del modal admite como máximo 10 caracteres y los convierte a mayúsculas.
- [ ] En `/auth`, la pestaña "CREAR CUENTA" muestra el campo de correo y "INICIAR SESIÓN" lo oculta.
- [ ] Enviar el formulario de `/auth` con usuario "kai" redirige a `/`, guarda `{"name":"KAI"}` en `localStorage["av_user"]` y la nav muestra "KAI ▾".
- [ ] Enviar el formulario de `/auth` con el usuario vacío usa el nombre "PLAYER1".
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin sesión (la nav sigue mostrando "Iniciar Sesión").
- [ ] Pulsar el botón con el nombre de usuario en la nav cierra sesión, borra `av_user` y vuelve a mostrar "Iniciar Sesión".
- [ ] La sesión persiste al recargar la página.
- [ ] `/salon` muestra una pestaña por cada uno de los 8 juegos; cambiar de pestaña cambia podio y tabla.
- [ ] En `/salon`, el bloque "TU MEJOR MARCA EN <JUEGO>" aparece solo con sesión iniciada.
- [ ] La nav marca como activa "Biblioteca" en `/`, `/juegos/*` y `/juegos/*/jugar`, y "Salón de la Fama" en `/salon`.
- [ ] Con ancho ≤ 840 px la nav oculta los enlaces y muestra el botón `≡`, que abre y cierra el panel lateral.
- [ ] Con ancho ≤ 720 px el podio del salón pasa a una columna y no hay scroll horizontal en ninguna pantalla.
- [ ] Ninguna pantalla produce errores de hidratación ni errores en la consola del navegador.

---

## Decisiones tomadas y descartadas

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). Dan URLs compartibles, prerenderizado y encajan con `cacheComponents`.
- **No:** SPA con estado y hash como la plantilla. Funciona, pero desaprovecha Next.js y obliga a un único componente cliente gigante.
- **Sí:** sesión mock en `localStorage` con contexto React. Es lo que hace la plantilla y mantiene el alcance en "solo visual".
- **No:** cookie con Server Actions. Es lógica de auth que esta spec excluye y complica `cacheComponents`.
- **Sí:** el reproductor replica el mock completo (puntuación simulada, pausa, modal, guardado). Deja la pantalla lista para sustituir la arena por un juego real en otra spec.
- **Sí:** guardar `av_scores` aunque nada lo lea todavía. Es el contrato que usará la futura spec de puntuaciones reales.
- **Sí:** datos y tipos en `lib/`, componentes en `components/`, Server Components por defecto y `"use client"` solo donde hay estado, efectos o `localStorage`.
- **No:** componentes colocados dentro de `app/` junto a cada ruta. Nav, tarjetas y leaderboard se reutilizan entre pantallas.
- **Sí:** portar las clases de `styles.css` a `globals.css` tal cual. Garantiza fidelidad con la plantilla y es el camino de menor riesgo.
- **No:** reescribir el CSS en utilidades Tailwind. Más trabajo y riesgo de divergir del diseño sin aportar valor al MVP.
- **Sí:** `notFound()` para ids inexistentes, con `not-found.tsx` temático. La plantilla devolvía `null` (pantalla en blanco).
- **Sí:** el botón de usuario de la nav cierra sesión directamente, igual que la plantilla.
- **No:** dropdown de usuario. No existe en las plantillas y amplía el alcance.
- **Sí:** la pestaña activa del salón es estado de cliente (como la plantilla). **No:** sincronizarla con la URL (`?juego=`); queda para otra spec si se necesita.
- **Sí:** usar `/frontend-design` como guía visual al implementar, según el `CLAUDE.md` del proyecto, sin alejarse del diseño de las plantillas.

---

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Con `cacheComponents`, leer `params` en una ruta dinámica sin `generateStaticParams` impide prerenderizarla. | `generateStaticParams` devuelve los 8 ids de `GAMES` en detalle y reproductor. Consultar `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` antes de escribir las páginas. |
| Leer `localStorage` en el render provoca errores de hidratación. | Leer `av_user` solo en `useEffect` del `SessionProvider`; el primer render siempre es "sin sesión". |
| Parpadeo de "Iniciar Sesión" a "NOMBRE ▾" al cargar con sesión guardada. | Se acepta en el MVP. No se oculta el botón durante la carga. |
| `localStorage` no disponible (modo privado o bloqueado). | Envolver lecturas y escrituras en `try/catch`, como hace la plantilla; la app funciona sin persistir. |
| Duplicar el gran bloque de CSS genera selectores que chocan con Tailwind. | Portar el CSS fuera de `@layer` solo si hace falta; verificar visualmente cada pantalla contra `references/templates/Arcade Vault.html`. |
| El efecto de nivel del mock (`score % 2500 < 100`) puede subir de nivel varias veces seguidas. | Se mantiene el comportamiento de la plantilla; el juego real lo sustituirá. |

---

## Qué **no** está en esta spec

- Ningún juego jugable (la arena es decorativa).
- Backend, base de datos, auth real, OAuth y validación de formularios.
- Menú desplegable de usuario.
- Pantallas que lean o muestren `av_scores`.
- Tests automatizados.
- Internacionalización y tema claro.

Cada una de estas cosas, si se aborda, va en su propia spec.
