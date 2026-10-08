"use server";

import {
  parseRegistration,
  type RegistrationParseResult,
} from "@/features/auth/lib/registration-schema";

/**
 * Re-checks registration input on the server before the client calls
 * Supabase Auth. This function does not create users, send email, or read
 * credentials.
 */
export async function validateRegistrationAction(
  input: unknown
): Promise<RegistrationParseResult> {
  return parseRegistration(input);
}
