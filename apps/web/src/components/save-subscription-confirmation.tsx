import { createChannelAndSubscribe } from "@/lib/actions-subscriptions";
import { listCategories } from "@/lib/actions-categories";
import { resolveChannel } from "@/lib/youtube-channels";
import { redirect } from "next/navigation";

interface SaveSubscriptionConfirmationProps {
  channelUrl: string;
}

export async function SaveSubscriptionConfirmation({ channelUrl }: SaveSubscriptionConfirmationProps) {
  const channel = await resolveChannel(channelUrl);
  const categories = await listCategories();

  async function handleSubscribe(formData: FormData) {
    "use server";
    const categoryId = (formData.get("categoryId") as string) || undefined;
    await createChannelAndSubscribe(channelUrl, categoryId);
    redirect("/subscriptions");
  }

  return (
    <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">Subscribe to this channel?</h2>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        {channel?.latestVideo?.thumbnail && (
          <img
            src={channel.latestVideo.thumbnail}
            alt={channel.name}
            className="aspect-video w-full rounded object-cover sm:h-24 sm:w-40 sm:shrink-0 sm:aspect-auto"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg text-gray-100">
            {channel?.name || "YouTube channel"}
          </h3>
          <p className="text-xs text-gray-500 mt-2 break-all">{channelUrl}</p>
        </div>
      </div>

      <form action={handleSubscribe} className="space-y-4">
        <div>
          <label htmlFor="categoryId" className="block text-sm text-gray-400 mb-1">
            Category (optional)
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-base text-gray-100 focus:border-blue-500 focus:outline-none sm:text-sm"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 sm:w-auto"
          >
            Subscribe
          </button>
          <a
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg bg-gray-700 px-6 py-2 text-gray-200 hover:bg-gray-600 sm:w-auto"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
