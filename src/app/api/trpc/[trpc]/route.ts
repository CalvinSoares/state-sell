import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@/src/server/trpc/context";
import { appRouter } from "@/src/server/trpc/routers";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
