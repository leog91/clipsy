import { listItems, searchItems, listItemsByTag, listItemsByCollection } from "@/lib/actions";
import { listTags } from "@/lib/actions-tags";
import { listCollections } from "@/lib/actions-collections";
import { ItemCard } from "@/components/item-card";
import { AddItemForm } from "@/components/add-item-form";
import { SearchBar } from "@/components/search-bar";
import { SaveClipConfirmation } from "@/components/save-clip-confirmation";
import { SaveSubscriptionConfirmation } from "@/components/save-subscription-confirmation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/lib/actions-auth";
import { isAdminUser } from "@/lib/admin-emails";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tag?: string; collection?: string; url?: string; subscribe?: string }>;
}): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const query = params.q;
  const status = params.status as "to_watch" | "watching" | undefined;
  const tagId = params.tag;
  const collectionId = params.collection;
  const urlParam = params.url;
  const subscribeParam = params.subscribe;

  let items;
  let filterLabel = "";
  if (query) {
    items = await searchItems(query);
  } else if (tagId) {
    items = await listItemsByTag(tagId);
    const allTags = await listTags();
    const tag = allTags.find((t) => t.id === tagId);
    filterLabel = tag ? `Tag: ${tag.name}` : "Unknown tag";
  } else if (collectionId) {
    items = await listItemsByCollection(collectionId);
    const allCollections = await listCollections();
    const collection = allCollections.find((c) => c.id === collectionId);
    filterLabel = collection ? `Collection: ${collection.name}` : "Unknown collection";
  } else {
    items = await listItems(status);
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <h1 className="text-3xl font-bold">Clipsy</h1>
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-4">
            {isAdminUser(session.user) && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-gray-100 rounded-md transition-colors sm:px-4"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/settings"
              className="px-3 py-2 text-sm text-gray-400 hover:text-gray-100 sm:px-4"
            >
              Settings
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-100 sm:px-4"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:gap-4">
          <Link href="/" className="rounded px-2 py-2 text-center text-sm text-gray-100 hover:bg-gray-700 sm:px-4 sm:text-base">
            All
          </Link>
          <Link href="/?status=to_watch" className="rounded px-2 py-2 text-center text-sm text-gray-100 hover:bg-gray-700 sm:px-4 sm:text-base">
            To Watch
          </Link>
          <Link href="/?status=watching" className="rounded px-2 py-2 text-center text-sm text-gray-100 hover:bg-gray-700 sm:px-4 sm:text-base">
            Watching
          </Link>
          <Link href="/subscriptions" className="rounded px-2 py-2 text-center text-sm text-gray-100 hover:bg-gray-700 sm:px-4 sm:text-base">
            Subscriptions
          </Link>
          <Link href="/collections" className="rounded px-2 py-2 text-center text-sm text-gray-100 hover:bg-gray-700 sm:px-4 sm:text-base">
            Collections
          </Link>
          <Link href="/tags" className="rounded px-2 py-2 text-center text-sm text-gray-100 hover:bg-gray-700 sm:px-4 sm:text-base">
            Tags
          </Link>
        </div>

        {urlParam && (
          <div className="mb-6">
            <Suspense fallback={<div className="h-32 bg-gray-800 rounded-lg animate-pulse" />}>
              <SaveClipConfirmation url={urlParam} />
            </Suspense>
          </div>
        )}

        {subscribeParam && (
          <div className="mb-6">
            <Suspense fallback={<div className="h-32 bg-gray-800 rounded-lg animate-pulse" />}>
              <SaveSubscriptionConfirmation channelUrl={subscribeParam} />
            </Suspense>
          </div>
        )}

        <div className="mb-6">
          <AddItemForm />
        </div>

        <div className="mb-6">
          <Suspense fallback={<div className="h-10 bg-gray-800 rounded-lg animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>

        {filterLabel && (
          <div className="mb-4 flex items-center gap-2">
            <span className="min-w-0 break-words text-gray-400">{filterLabel}</span>
            <Link href="/" className="shrink-0 text-sm text-blue-400 hover:underline">
              Clear filter
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {query ? "No results found" : "No items yet. Add a YouTube URL to get started!"}
            </p>
          ) : (
            items.map((item) => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}
