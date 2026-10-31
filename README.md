# Split

Split- a web app for sharing expenses on trips and at group events between mulitple users. We're building it so a group can keep receipts and figure out who owes whom with ease, making everybody even at no time!

## Product Vision

We want to make shared expenses easier to manage.

- keep a group's expenses together in one event.
- let friends/users join through an invite link without creating an account.
- Split costs equally or by percentage, depending on the expense.
- Show who owes whom and track payments. money is wired outside the app, and the recipient confirms when it arrives.

## Design

See [UX-DESIGN.md](UX-DESIGN.md) for our wireframes and prototypes.

## Team

- [Ryan Han](https://github.com/jiruiryanhan)
- [Chenxin Yan](https://github.com/cy2558)
- [Eric](https://github.com/paper595)
- Tony (GitHub profile to be added)

### Scrum roles

| Sprint | Scrum Master | Product Owner |
| ------ | ------------ | ------------- |
| 0      | Ryan Han     | Chenxin Yan   |
| 1      | Eric         | Ryan Han      |

## Project Background

Split began as a team project for NYU's Agile Development and DevOps course in Fall 2026. We are building a mobile web app to help groups track shared expenses and work out who owes whom after trips and group events.

## Tech Stack

- Front-end: [React](https://react.dev/) 19 in plain JavaScript (JSX), built with [Vite](https://vite.dev/)
- Routing: [React Router](https://reactrouter.com/) (`react-router-dom`) in declarative mode
- Styling: [Tailwind CSS](https://tailwindcss.com/) v4
- Linting and formatting: [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/)

## Running the Front-End

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+, 22.13+, or 24+ (includes npm)

### Install and run

```bash
cd front-end
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### Other commands

Run these from the `front-end` folder.

- `npm run build` builds the app for production into `front-end/dist`.
- `npm run preview` serves the production build locally.
- `npm run lint` checks the code with ESLint.
- `npm run format` formats the code with Prettier.
- `npm run format:check` checks the formatting without changing any files.

### Mock data

Until the back-end exists, screens read mock JSON from `front-end/public/mock/`, which Vite serves at `/mock`. Never hard-code events, people, receipts, amounts, balances, invite codes, or user info in a component. Load them with the shared axios instance in `src/api.js` inside `useEffect`:

```jsx
import api from '../api.js'

// remember which eventId the result belongs to, so an old event or error
// never shows while the next one loads
const [result, setResult] = useState(null)

useEffect(() => {
  // ignore a reply that arrives after eventId has changed
  let ignore = false
  api
    .get(`/events/${encodeURIComponent(eventId)}.json`)
    .then(response => {
      if (!ignore) setResult({ eventId, event: response.data })
    })
    .catch(() => {
      if (!ignore) setResult({ eventId, error: 'Could not load this event.' })
    })
  return () => {
    ignore = true
  }
}, [eventId])

const loaded = result?.eventId === eventId
```

| File                | Back-end call it stands in for                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `user.json`         | the signed-in account (Alex)                                                                                                         |
| `events.json`       | the signed-in user's events, for My Events                                                                                           |
| `events/<id>.json`  | one event with its participants, receipts, balances, and settlement (`all` and `fewest` transfers, each row with a payment `status`) |
| `invites.json`      | invite code lookup for the join screen (no match means an invalid link)                                                              |
| `return-links.json` | personal return link lookup for guests                                                                                               |
| `create-event.json` | response to creating an event; its id opens the empty `events/evt_7hq2xm.json`                                                       |
| `join-event.json`   | response to joining with an invite link (always returns Maya in Lisbon trip and her return link)                                     |
| `scan-receipt.json` | receipt photo reading, with a `read` and a `failed` result                                                                           |

- Amounts are whole cents (`31900` is $319.00). Dates are `YYYY-MM-DD`.
- Responses to actions are fixed files, so keep what the user typed (for example the event name) and take only the generated fields (id, invite code, return link) from the response. Changes made in the app live in React state and reset on reload.
- `evt_lisbon` starts with every payment `unpaid`. `evt_lisbon_settling` is the same trip later on, with Maya's payment to Alex `pending` and the rest `confirmed`. It is not in `events.json`, so open it by URL, for example `/events/evt_lisbon_settling/settle-up`.
- Receipt photos are [Picsum](https://picsum.photos/) URLs stored in the JSON, such as `https://picsum.photos/seed/r_pingo/800/500`.
- A missing mock file makes `api` reject the request, so handle it in `.catch`.

### Shared components

Every page renders inside `Layout`, so the header and spacing stay the same on every screen. The shared pieces live in `front-end/src/components/`, and the colors, font, and text sizes are Tailwind theme values in `src/index.css` (for example `text-muted`, `border-line`, `text-heading`).

| Component       | Use it for                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Layout`        | page column and header: `title`, optional `subtitle`, `left` and `right` actions (a `Link` or button), and `nav` |
| `BottomNav`     | event tab bar for `nav`: `eventId`; the event's organizer also gets the People tab                               |
| `Button`        | `variant` `primary`, `outline`, or `text`; `small` for row actions; `to` makes it a `Link`                       |
| `TextField`     | labelled input with `helper` or `error` text; other props go to the `<input>`                                    |
| `SectionLabel`  | small grey heading above a group, like "Active" and "Past"                                                       |
| `ListRow`       | one `<li>` with `title`, `subtitle`, and a `right` value; `to` makes the whole row a link                        |
| `EmptyState`    | centered `title` and `description` with an optional action as children                                           |
| `Sheet`         | bottom sheet and every menu (Account, event Menu); `closeLabel="Done"` replaces Cancel                           |
| `ConfirmDialog` | centered confirm with Cancel and `confirmLabel`; children go above the buttons (rename field)                    |
| `InviteSheet`   | "Invite people" sheet with Copy link and Share: `eventName`, `inviteCode`, and `onClose`                         |

Render `Sheet` and `ConfirmDialog` only while they are open, and close them from `onClose`. Both are built on `Modal`, which already handles Escape, backdrop clicks, focus, and page scrolling:

```jsx
<>
  <button type="button" onClick={() => setAccountOpen(true)}>
    Account
  </button>
  {accountOpen && (
    <Sheet title="Account" onClose={() => setAccountOpen(false)}>
      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </Sheet>
  )}
</>
```

### Code style

We use [ESLint](https://eslint.org/) for linting and [Prettier](https://prettier.io/) for formatting. The Prettier settings are in `.prettierrc` at the repo root. Open the repo root in VS Code and install the recommended extensions (ESLint and Prettier) when prompted. The shared settings in `.vscode/settings.json` then format each file when you save it. To lint or format the whole front-end at once, run `npm run lint` or `npm run format` from the `front-end` folder.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for our team's collaboration process and contribution guidelines.
