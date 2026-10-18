import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OPS_SESSION_COOKIE, verifyOperationsSession } from "./opsSession";

/** Stop direct requests to internal desk URLs before their UI or data renders. */
export async function requireOperationsSession(): Promise<void> {
  const secret = process.env.MONKCRAFT_OPS_API_SECRET?.trim() || "";
  const session = (await cookies()).get(OPS_SESSION_COOKIE)?.value || "";
  if (!verifyOperationsSession(session, secret)) redirect("/ops");
}
