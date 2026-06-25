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
    <div className="mb-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">Subscribe to this channel?</h2>

      <div className="flex gap-4 mb-6">
        {channel?.latestVideo?.thumbnail && (
          <img
            src={channel.latestVideo.thumbnail}
            alt={channel.name}
            className="w-40 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
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
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Subscribe
          </button>
          <a
            href="/"
            className="px-6 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 inline-flex items-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
