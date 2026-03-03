import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import FarmItemsManager from "./FarmItemsManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user's farm data
  const { data: members } = await supabase
    .from("malroda_farm_members")
    .select("farm_id, role")
    .eq("user_id", user.id)
    .single();

  let farmData = null;
  let farmItems: any[] = [];

  if (members?.farm_id) {
    const { data: farm } = await supabase
      .from("malroda_farms")
      .select("*")
      .eq("id", members.farm_id)
      .single();

    farmData = farm;

    const { data: items } = await supabase
      .from("malroda_items")
      .select("*")
      .eq("farm_id", members.farm_id)
      .order("zone", { ascending: true })
      .order("item_name", { ascending: true });

    farmItems = items || [];
  }

  const updateFarmName = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const newName = formData.get("farm_name") as string;
    const farmId = formData.get("farm_id") as string;

    if (!newName || !farmId) return;

    await supabase
      .from("malroda_farms")
      .update({ farm_name: newName })
      .eq("id", farmId);

    revalidatePath("/dashboard/settings");
  };

  return (
    <div className="px-4 py-6 sm:px-0">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
              <p className="text-sm text-gray-500">{t("settings.subtitle")}</p>
            </div>
          </div>
        </div>

        {farmData ? (
          <FarmItemsManager
            farmId={farmData.id}
            farmName={farmData.farm_name}
            isOwner={members?.role === "owner"}
            initialItems={farmItems}
            updateFarmNameAction={updateFarmName}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-gray-500">{t("settings.noFarm")}</p>
          </div>
        )}
    </div>
  );
}
