"use client";

interface DeleteCollectionButtonProps {
  action: (formData: FormData) => Promise<void>;
  collectionId: string;
}

export function DeleteCollectionButton({ action, collectionId }: DeleteCollectionButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name="collectionId" value={collectionId} />
      <button
        type="submit"
        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        onClick={(e) => {
          if (!confirm("Are you sure you want to delete this collection?")) {
            e.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}
