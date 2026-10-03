# MyShop: Next.js + MongoDB + Razorpay

## Run it
1. `npm install`
2. `cp .env.example .env.local` and fill in the values (see below)
3. `npm run dev` and open http://localhost:3000
4. Seed products once: http://localhost:3000/api/seed?key=YOUR_SEED_KEY
   (then delete `src/app/api/seed`)

## Credentials
- **MongoDB**: https://www.mongodb.com/atlas > free M0 cluster > Database Access (user) >
  Network Access (add your IP) > Connect > Drivers > copy the string into `MONGODB_URI`.
- **Razorpay**: https://dashboard.razorpay.com > switch to Test Mode > Account & Settings > API Keys >
  Generate Test Key. Put the Key ID in `NEXT_PUBLIC_RAZORPAY_KEY_ID`, the secret in `RAZORPAY_KEY_SECRET`.
- **JWT_SECRET / ADMIN_KEY / SEED_KEY**: any long random strings (`openssl rand -base64 32`).
- **Webhook (optional)**: Razorpay > Settings > Webhooks > URL `https://<public-url>/api/payment/webhook`,
  event `payment.captured`, secret into `RAZORPAY_WEBHOOK_SECRET`. Use ngrok for a public URL locally.

## Test payments
Card 4111 1111 1111 1111 (any future expiry, any CVV). UPI: success@razorpay / failure@razorpay.

## Move an order along (acts as the warehouse)
curl -X PATCH http://localhost:3000/api/admin/orders/ORDER_ID \
  -H "x-admin-key: YOUR_ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"status":"shipped","note":"Courier: Delhivery"}'
Statuses: processing, shipped, out_for_delivery, delivered, refunded (approves a return).

## Structure
src/app/api   backend routes     src/lib      db, auth, pricing, order logic
src/models    Mongoose schemas   src/components  UI pieces     src/proxy.js  login redirect
