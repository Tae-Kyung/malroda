import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/routing";
import { signout } from "@/app/[locale]/login/actions";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NavLink, MobileNavLink } from "@/components/NavLinks";
import DashboardProviders from "@/components/DashboardProviders";
import FarmSwitcher from "@/components/FarmSwitcher";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const t = await getTranslations();

  if (error || !user) {
    redirect(`/${locale}/login`);
  }

  const initial = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <DashboardProviders>
      <div className="min-h-screen bg-gray-50/50 flex flex-col">
        {/* Modern Minimal Navbar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left: Brand + Nav */}
              <div className="flex items-center gap-8">
                {/* Brand */}
                <Link href="/dashboard" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {t("nav.brand")}
                  </span>
                  <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded">
                    {t("common.beta")}
                  </span>
                </Link>

                {/* Farm Switcher */}
                <div className="hidden sm:block">
                  <FarmSwitcher />
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  <NavLink href="/dashboard">
                    {t("nav.dashboard")}
                  </NavLink>
                  <NavLink href="/dashboard/simulator">
                    {t("nav.simulator")}
                  </NavLink>
                  <NavLink href="/dashboard/settings">
                    {t("nav.farmSettings")}
                  </NavLink>
                </nav>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <LanguageSwitcher />

                {/* User Menu */}
                <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {initial}
                  </div>
                  <form action={signout}>
                    <button
                      type="submit"
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {t("common.logout")}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto items-center">
            <FarmSwitcher />
            <div className="w-px h-6 bg-gray-200" />
            <MobileNavLink href="/dashboard">
              {t("nav.dashboard")}
            </MobileNavLink>
            <MobileNavLink href="/dashboard/simulator">
              {t("nav.simulator")}
            </MobileNavLink>
            <MobileNavLink href="/dashboard/settings">
              {t("nav.farmSettings")}
            </MobileNavLink>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </DashboardProviders>
  );
}
