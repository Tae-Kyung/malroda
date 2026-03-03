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
  let farmItems = [];

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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
      <div className="bg-white shadow rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t("settings.title")}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {t("settings.subtitle")}
            </p>
          </div>
          {members?.role === "owner" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {t("common.owner")}
            </span>
          )}
        </div>

        <div className="px-6 py-6 sm:p-10">
          {farmData ? (
            <>
              <form action={updateFarmName} className="space-y-6 max-w-md mb-8">
                <input type="hidden" name="farm_id" value={farmData.id} />

                <div>
                  <label
                    htmlFor="farm_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("settings.farmName")}
                  </label>
                  <div className="mt-2 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="farm_name"
                      id="farm_name"
                      defaultValue={farmData.farm_name}
                      autoComplete="off"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-gray-900"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent border-l-0 rounded-r-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      {t("common.save")}
                    </button>
                  </div>
                </div>
              </form>

              <FarmItemsManager farmId={farmData.id} initialItems={farmItems} />
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">{t("settings.noFarm")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
