import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { zodErrorMessage } from "@/lib/listing-input";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { TransferError } from "@/lib/transfers";
import { ListingInputError } from "@/lib/listings";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type Handler<C> = (user: CurrentUser & { market: NonNullable<CurrentUser["market"]> }, request: Request, context: C) => Promise<Response>;

/** Wraps a route handler: requires a signed-in, verified user and maps known errors to JSON. */
export function withUser<C>(handler: Handler<C>) {
  return async (request: Request, context: C) => {
    const user = await getCurrentUser();

    if (!user || !user.market) {
      return jsonError("Sign in with your university email first.", 401);
    }

    try {
      return await handler(user as Parameters<Handler<C>>[0], request, context);
    } catch (error) {
      if (error instanceof ZodError) return jsonError(zodErrorMessage(error));
      if (error instanceof TransferError) return jsonError(error.message, error.status);
      if (error instanceof ListingInputError) return jsonError(error.message);
      if (error instanceof SyntaxError) return jsonError("Request body must be JSON.");
      throw error;
    }
  };
}

export type IdContext = { params: Promise<{ id: string }> };
