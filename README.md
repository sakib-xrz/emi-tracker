# EMI Tracker

Mobile-first EMI tracking app built with Next.js App Router, shadcn/ui, Tailwind CSS, and Supabase.

## Features

- Owner dashboard with total paid, remaining amount, and progress bar
- Debt target includes 14.5% interest (92000 + 13340 = 105340 BDT)
- Add payment form with amount, date, method, and receipt upload (PDF/image)
- Auto-incrementing installment number
- Pending -> Approved workflow using security code + shareable link
- Public `/payment-history` view for read-only payment history and totals
- Public `/approve/[paymentId]` route to approve with code (no login required)
- Owner can delete a payment entry and its receipt file from storage

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

4. In Supabase SQL Editor, run:

```sql
-- full schema + RLS + RPC + storage policies
-- file: supabase/schema.sql
```

5. Create your owner auth account in Supabase Auth, then map it as owner:

```sql
insert into public.owner_profile (id, owner_user_id)
values (true, '<YOUR_AUTH_USER_UUID>');
```

6. Run the app:

```bash
npm run dev
```

## Important Routes

- `/` -> Owner login or owner dashboard
- `/payment-history` -> Public read-only payment status
- `/approve/[paymentId]` -> Public approval page
