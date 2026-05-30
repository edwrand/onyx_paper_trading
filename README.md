# Onyx Paper Trading

A paper trading app built on top of the Onyx Predictions API. Sign up, browse live prediction markets, and place YES/NO orders against real upstream prices — no real money, nothing actually executes on Onyx's side.

**Live:** https://onyx-paper-trading-rbnbgj3fk-edwrands-projects.vercel.app
**Repo:** https://github.com/edwrand/onyx_paper_trading

---

## Running it locally

You'll need a free [Neon](https://neon.tech) account for the database and Onyx API credentials.

**1. Clone and install**
```bash
git clone https://github.com/edwrand/onyx_paper_trading
cd onyx_paper_trading/onyx-paper-trading
npm install
```

**2. Set up your environment**

Create a `.env.local` file in the project root:
```env
DATABASE_URL="postgresql://..."   # your Neon pooled connection string
ONYX_USERNAME="your_username"
ONYX_PASSWORD="your_password"
SESSION_SECRET="a-random-string-at-least-32-characters-long"
```

To generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**3. Create the database tables**
```bash
export $(grep DATABASE_URL .env.local | xargs) && npx prisma db push
```

**4. Start the dev server**
```bash
npm run dev
```

Go to [http://localhost:3000](http://localhost:3000), create an account, and start trading.

---

## How it's built

**Stack:** Next.js 16 (App Router) · Prisma 7 · Neon (serverless Postgres) · Tailwind · Vercel

### Authentication
I used iron-session (encrypted cookies) instead of something like NextAuth. There's no OAuth — just email and password — so NextAuth would've been overkill. iron-session is about 20 lines of config and works well with the App Router.

### Database
SQLite would have been simpler, but Vercel's serverless functions run on a read-only filesystem so it doesn't work there. Neon is serverless Postgres. Same Prisma queries, just hosted.

### Live prices
The app polls `/api/markets` every 5 seconds, which proxies the Onyx REST API. I considered SSE or WebSockets, but the Onyx API is REST-only — any "live" mechanism still has to poll upstream on the server side. The transport between client and server doesn't actually change how fresh the data is. Polling is simpler to deploy and easier to reason about.

One wrinkle: the Onyx API takes 7-12 seconds to respond to the full market list fetch. To avoid blocking every poll on that, I implemented stale-while-revalidate on the server — stale data is served immediately while a background refresh runs. First load is slow, but every subsequent poll returns instantly.

### Order fills
When you place an order, the server fetches a fresh price from Onyx right then:
- BUY YES → fills at `ask_price`
- BUY NO → fills at `1 - bid_price`

The fill, position update, and balance debit all happen inside a single `prisma.$transaction()`, so you can never end up with a deducted balance but no recorded position (or vice versa). Nothing calls Onyx's actual order endpoints.

### Positions
Positions are stored as aggregated records (market + side + quantity + average fill price) rather than recomputed from the full order history on every request. The order history is still there as an append-only audit trail — I just don't scan it on every page load.

---

## Tradeoffs I made

**Polling over WebSockets** — WebSockets on Vercel serverless are painful and the upstream is REST anyway, so polling wins on simplicity without giving up much freshness.

**iron-session over NextAuth** — NextAuth adds adapters, providers, and callbacks that I don't need for a simple email/password flow.

**Neon over SQLite** — Not a preference, just a Vercel constraint.

**Market orders only** — The spec asked for market orders. Limit orders would need either a matching engine or a periodic fill checker, neither of which fits a short window.

---

## What I'd build next

- **SSE for price updates** — push from server to client instead of polling on a fixed interval
- **Limit orders** — let users set a target price and fill when the market hits it
- **Realized P&L** — track what you actually locked in when you close a position
- **Shared Redis cache** — the current in-process cache doesn't share state across Vercel serverless instances; Redis would fix that
- **Rate limiting on orders** — right now nothing stops you from spamming trades
- **Idempotency** — protect against duplicate order submissions if a request retries
- **UI Enhancements** - Bet confirmation screen, graphs for P&Lok
- Testing - I would build out a full testing sweet using Jest, unit and mock API calls