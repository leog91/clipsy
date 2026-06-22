import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkForNewVideos, createChannelAndSubscribe } from "@/lib/actions-subscriptions";
import { createCategory, listCategories, deleteCategory } from "@/lib/actions-categories";
import { SubscriptionCard } from "@/components/subscription-card";
import type { SubscriptionWithChannel, ChannelCategory } from "@clipsy/shared";

export default async function SubscriptionsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { subscriptions, refreshedCount } = await checkForNewVideos();
  const categories = await listCategories();

  async function handleAddChannel(formData: FormData) {
    "use server";
    const url = formData.get("url") as string;
    const categoryId = formData.get("categoryId") as string | undefined;
    await createChannelAndSubscribe(url, categoryId || undefined);
    revalidatePath("/subscriptions");
  }

  async function handleCreateCategory(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    await createCategory(name);
    revalidatePath("/subscriptions");
  }

  async function handleDeleteCategory(formData: FormData) {
    "use server";
    const categoryId = formData.get("categoryId") as string;
    await deleteCategory(categoryId);
    revalidatePath("/subscriptions");
  }

  const grouped = groupSubscriptionsByCategory(subscriptions);
  const hasNewCount = subscriptions.filter((s) => s.hasNew).length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-100">Subscriptions</h1>
          {hasNewCount > 0 && (
            <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-medium">
              {hasNewCount} new
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Add channel
            </h2>
            <form action={handleAddChannel} className="space-y-3">
              <input
                type="url"
                name="url"
                placeholder="Paste YouTube channel URL..."
                required
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="categoryId"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              New category
            </h2>
            <form action={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                name="name"
                placeholder="e.g. Photography"
                required
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Add
              </button>
            </form>

            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <form
                    key={category.id}
                    action={handleDeleteCategory}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                  >
                    <input type="hidden" name="categoryId" value={category.id} />
                    <span>{category.name}</span>
                    <button
                      type="submit"
                      className="text-gray-400 hover:text-red-400 ml-1"
                      title="Delete category"
                    >
                      ×
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {refreshedCount > 0
              ? `Refreshed ${refreshedCount} channel${refreshedCount === 1 ? "" : "s"}`
              : "Channels checked recently"}
          </p>
          <form
            action={async () => {
              "use server";
              await checkForNewVideos();
              revalidatePath("/subscriptions");
            }}
          >
            <button
              type="submit"
              className="text-sm px-3 py-1.5 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
            >
              Refresh now
            </button>
          </form>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No subscriptions yet. Add a YouTube channel to get started.
          </p>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ category, subscriptions: groupSubs }) => (
              <div key={category?.id ?? "uncategorized"}>
                <h2 className="text-lg font-semibold text-gray-200 mb-3">
                  {category?.name ?? "Uncategorized"}
                </h2>
                <div className="space-y-3">
                  {groupSubs.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      categories={categories}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupSubscriptionsByCategory(subscriptions: SubscriptionWithChannel[]) {
  const map = new Map<string | null, { category: ChannelCategory | null; subscriptions: SubscriptionWithChannel[] }>();

  for (const subscription of subscriptions) {
    const key = subscription.category?.id ?? null;
    if (!map.has(key)) {
      map.set(key, { category: subscription.category, subscriptions: [] });
    }
    map.get(key)!.subscriptions.push(subscription);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (!a.category) return 1;
    if (!b.category) return -1;
    return a.category.name.localeCompare(b.category.name);
  });
}
