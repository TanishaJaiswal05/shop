import { route, ok, HttpError } from "@/lib/api";
import { seedProducts } from "@/lib/seed";

// Manual re-seed: http://localhost:3000/api/seed?key=<SEED_KEY>
// (Not required for first run: the home page seeds automatically when the database is empty.)
// Warning: re-seeding resets product stock to the dummyjson values.
export const GET = route(async (req) => {
  if (!process.env.SEED_KEY || new URL(req.url).searchParams.get("key") !== process.env.SEED_KEY)
    throw new HttpError(403, "Forbidden");
  return ok({ seeded: await seedProducts() });
});
