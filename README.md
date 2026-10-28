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

### Code style

We use [ESLint](https://eslint.org/) for linting and [Prettier](https://prettier.io/) for formatting. The Prettier settings are in `.prettierrc` at the repo root. Open the repo root in VS Code and install the recommended extensions (ESLint and Prettier) when prompted. The shared settings in `.vscode/settings.json` then format each file when you save it. To lint or format the whole front-end at once, run `npm run lint` or `npm run format` from the `front-end` folder.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for our team's collaboration process and contribution guidelines.
