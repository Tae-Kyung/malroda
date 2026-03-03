import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("admin");

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // TODO: Add strict role/email check here to prevent regular users from accessing admin routes.
  const isAdmin =
    user.email === "admin@malroda.com" || user.email?.startsWith("misoh");

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {t("accessDenied")}
          </h2>
          <p className="text-gray-600 mb-6">{t("adminOnly")}</p>
          <Link
            href="/dashboard"
            className="text-emerald-600 font-medium hover:underline"
          >
            {t("backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  // Fetch some basic stats for MVP
  const { count: usersCount } = await supabase
    .from("malroda_profiles")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {t("totalTesters")}
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {usersCount || 0}
              <span className="text-lg text-gray-500 font-normal ml-1">
                {t("people")}
              </span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {t("totalMessages")}
            </h3>
            <p className="text-3xl font-bold text-gray-900">{t("comingSoon")}</p>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              {t("recentLogs")}
            </h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              {t("refresh")}
            </button>
          </div>
          <div className="p-6 text-center text-gray-500">
            <p>{t("noLogs")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
