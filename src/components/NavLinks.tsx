"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

// Desktop Navigation Link
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  // Check if current path matches (handle locale prefix)
  const isActive = pathname === href ||
    pathname.endsWith(href) ||
    (href !== "/dashboard" && pathname.includes(href));

  // Special case for dashboard - only active on exact match
  const isDashboardActive = href === "/dashboard" &&
    (pathname === "/dashboard" || pathname.match(/^\/[a-z]{2}\/dashboard$/));

  const active = href === "/dashboard" ? isDashboardActive : isActive;

  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out ${
        active
          ? "font-semibold text-emerald-700 bg-emerald-50 shadow-sm"
          : "font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      {children}
      <span
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-emerald-500 rounded-full transition-all duration-300 ease-out ${
          active ? "w-6 opacity-100" : "w-0 opacity-0"
        }`}
      />
    </Link>
  );
}

// Mobile Navigation Link
export function MobileNavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href ||
    pathname.endsWith(href) ||
    (href !== "/dashboard" && pathname.includes(href));

  const isDashboardActive = href === "/dashboard" &&
    (pathname === "/dashboard" || pathname.match(/^\/[a-z]{2}\/dashboard$/));

  const active = href === "/dashboard" ? isDashboardActive : isActive;

  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 ease-in-out ${
        active
          ? "text-white bg-emerald-500 shadow-sm scale-105"
          : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}
