import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createOfficeInputSchema,
  submitDoctorReferralInputSchema,
  reviewReferralInputSchema,
  filterDoctorsInputSchema
} from './schema';

// Import handlers
import { createOffice } from './handlers/create_office';
import { getOffices } from './handlers/get_offices';
import { submitDoctorReferral } from './handlers/submit_doctor_referral';
import { reviewReferral } from './handlers/review_referral';
import { getPendingReferrals } from './handlers/get_pending_referrals';
import { getApprovedDoctors } from './handlers/get_approved_doctors';
import { searchDoctors } from './handlers/search_doctors';
import { getDoctorsWithLocations } from './handlers/get_doctors_with_locations';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Office management
  createOffice: publicProcedure
    .input(createOfficeInputSchema)
    .mutation(({ input }) => createOffice(input)),

  getOffices: publicProcedure
    .query(() => getOffices()),

  // Doctor referral submission
  submitDoctorReferral: publicProcedure
    .input(submitDoctorReferralInputSchema)
    .mutation(({ input }) => submitDoctorReferral(input)),

  // Admin approval workflow
  reviewReferral: publicProcedure
    .input(reviewReferralInputSchema)
    .mutation(({ input }) => reviewReferral(input)),

  getPendingReferrals: publicProcedure
    .query(() => getPendingReferrals()),

  // Public doctor listings with filtering
  getApprovedDoctors: publicProcedure
    .input(filterDoctorsInputSchema.optional())
    .query(({ input }) => getApprovedDoctors(input)),

  // Search functionality
  searchDoctors: publicProcedure
    .input(z.string().min(1, 'Search term is required'))
    .query(({ input }) => searchDoctors(input)),

  // Map feature - doctors with addresses
  getDoctorsWithLocations: publicProcedure
    .query(() => getDoctorsWithLocations()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();