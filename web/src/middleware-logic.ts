// Pure redirect logic, extracted from middleware.ts so it's unit-testable
// without exercising NextAuth's request/JWT plumbing.
export function redirectTarget(pathname: string, isLoggedIn: boolean): "/login" | "/" | null {
  const isLoginPage = pathname.startsWith("/login");
  if (!isLoggedIn && !isLoginPage) return "/login";
  if (isLoggedIn && isLoginPage) return "/";
  return null;
}
