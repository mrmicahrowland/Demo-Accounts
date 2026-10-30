const ROLE_HOME_ROUTES: Record<string, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  supervisor: "/jobs",
  crew: "/jobs",
  client: "/client/estimates",
};

export function getRoleHomeRoute(role: string): string {
  return ROLE_HOME_ROUTES[role] ?? "/login";
}
