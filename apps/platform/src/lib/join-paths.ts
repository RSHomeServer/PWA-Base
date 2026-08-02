/**
 * Joins a site base path with a route path for React Router.
 */
export function joinPaths(basePath: string, routePath: string): string {
  const normalizedBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const normalizedRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;

  if (normalizedRoute === "/") {
    return normalizedBase || "/";
  }

  return `${normalizedBase}${normalizedRoute}`.replace(/\/+/g, "/");
}
