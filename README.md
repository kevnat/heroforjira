# Hero for Jira

Custom dashboard for managing Jira chaos on your own terms. Access Jira through Proxy function using an API key. Can be run locally or hosted (currently Netlify & Supabase).

---

## Deploy in 5 steps

### 1. Fork this repo

Click **Fork** at the top-right of this page on GitHub, then clone your fork to your machine.

### 2. Connect to Netlify

Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → pick your fork.

### 3. Add environment variables

In Netlify: **Site configuration → Environment variables → Add a variable**.

| Variable | What to put |
|---|---|
| `JIRA_EMAIL` | Your Jira login email |
| `JIRA_API_TOKEN` | [Create a token here](https://id.atlassian.net/manage/api-tokens) |
| `JIRA_SITE` | `https://yourorg.atlassian.net` |
| `VITE_JIRA_SITE` | Same as `JIRA_SITE` |
| `VITE_JIRA_PROJECT` | Your Jira project name, e.g. `Platform` |
| `VITE_EDIT_PASSPHRASE_HASH` | See below ↓ |

**Getting your passphrase hash** — open Terminal and run:

```sh
echo -n "the password you want" | shasum -a 256
```

Copy the long string of letters and numbers. That's your hash.

### 4. (Optional) Add Supabase for shared state

Skip this if you're the only user. Without Supabase, notes and card positions only save in your browser.

1. Create a free project at [supabase.com](https://supabase.com)
2. In your Supabase project, open the **SQL Editor**, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**
3. Add two more Netlify env vars (find the values under **Project Settings → API** in Supabase):
   - `VITE_SUPABASE_URL` — your Project URL
   - `VITE_SUPABASE_ANON_KEY` — your anon/public key

### 5. Deploy

Click **Deploy site** in Netlify. Your board will be live in about a minute.

---

## Local development

```sh
npm install
cp .env.example .env.local   # fill in your values
netlify dev                   # opens at localhost:8888
```

> Use `netlify dev` (not `npm run dev`) so the Jira proxy function runs locally.
> Install the Netlify CLI first if needed: `npm install -g netlify-cli`

---

## How the board works

| Column | What goes here |
|---|---|
| ⏭️ Up Next | Epics with Jira status **Open** — not yet started |
| 🌱 Starting | In Progress, but ≥ 65% of child tickets are still in early statuses |
| 🔨 In Dev | Majority of child tickets are actively in development |
| 🧪 In Test | More tickets in review/test than in active dev |
| 🏁 Almost Done | ≥ 55% of child tickets are done or cancelled |

**Edit mode** (click 🔒) lets you drag cards between columns, hide cards, add notes, and reorder within a column. Changes sync to teammates via Supabase if configured.

---

## Customisation

- **Avatar colours** — open `src/FlywheelBoard.jsx` and add your teammates to `AVATAR_COLORS` at the top
- **Grooming checklist** — edit the `GROOM_LABELS` array in the same file
- **Column thresholds** — tweak the `categorise()` function

---

## Tightening Supabase access

By default the schema allows anonymous writes. The data isn't sensitive, but if you want tighter control: remove the `anon write` policy from `supabase/schema.sql` and route writes through a Netlify function using `SUPABASE_SERVICE_ROLE_KEY` (kept server-side, never in the browser).

---

## Contributing

PRs welcome. The board logic lives in one file: `src/FlywheelBoard.jsx`. The Jira proxy is `netlify/functions/jira.js`.

Planned: notifications for watched tickets, create-ticket shortcuts, per-user avatar colours.
