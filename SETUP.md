# Turning on accounts and the database (Supabase)

Until these steps are done, the store runs in **demo mode**: products come from `js/catalog.js`, the admin page is open and saves only to your own browser, and there is no sign-in.

The whole setup takes about 10 minutes and is free.

## 1. Create the Supabase project
1. Sign up at [supabase.com](https://supabase.com) and click **New project**.
2. Pick a name (e.g. `sole-thread`), set a database password (save it somewhere safe), choose the region closest to you, and create it.

## 2. Create the tables and security rules
1. In the project, open **SQL Editor → New query**.
2. Paste the whole contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

This creates the `products` and `orders` tables, the `product-images` storage bucket, and the rules that make **paquejefferson@gmail.com** the only admin. To change the admin later, edit the email in the `insert into public.admins` line and run it again (and remove the old row in **Table Editor → admins**).

## 3. Set the sign-in URLs
In **Authentication → URL Configuration**:
- **Site URL:** `https://sole-thread-store.onrender.com`
- **Redirect URLs:** add both
  - `https://sole-thread-store.onrender.com/**`
  - `http://localhost:5520/**` (for testing on your computer)

Leave **Authentication → Sign In / Providers → Email → Confirm email** turned **on**. The admin check requires a confirmed email, so nobody can claim the admin address without access to its inbox.

## 4. Connect the site
1. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
2. Paste them into [`js/config.js`](js/config.js):
   ```js
   supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
   supabaseAnonKey: 'eyJhbGciOi…',
   ```
   The anon key is meant to be public; the database rules decide what it can do.
   **Never** use the `service_role` key in the website.
3. Commit and push. Render redeploys automatically.

## 5. Become the admin and load the products
1. Open the site → **Sign in → Create account** with **paquejefferson@gmail.com**.
2. Click the confirmation link in the email, then sign in.
3. Go to **Admin**. The database starts empty, so click **Import built-in products** once.

From then on, product changes in the admin are saved to the database and are live for every visitor. Photos you upload are stored in Supabase Storage. Signed-in customers' orders appear in their **Account** page and in the **Orders** list at the bottom of the admin.

## Good to know
- Supabase's built-in email service only sends a few emails per hour, which is fine for a portfolio. For more, add your own SMTP in **Authentication → Emails → SMTP settings**.
- Free projects pause after a week without activity; open the Supabase dashboard to wake it up.
- Checkout is still a demo: no payment is taken.
