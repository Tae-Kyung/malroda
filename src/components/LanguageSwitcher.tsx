"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { locales, localeNames, type Locale } from "@/i18n/config";

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-2 py-1 rounded transition-colors ${
            locale === loc
              ? "bg-emerald-100 text-emerald-700 font-medium"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
