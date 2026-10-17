import { auth0 } from "@/lib/auth0";

// Server component: reads the session cookie, so render it inside <Suspense>.
export async function AuthStatus() {
  const session = await auth0.getSession();

  if (!session) {
    // Plain <a>, not <Link>: these are API routes handled by the proxy.
    return (
      <a href="/auth/login" className="font-medium underline">
        Log in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span>Signed in as {session.user.email ?? session.user.name}</span>
      <a href="/auth/logout" className="font-medium underline">
        Log out
      </a>
    </div>
  );
}
