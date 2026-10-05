import { ListingForm } from "@/components/client/listing-form";
import { PageHeader } from "@/components/ui";
import { parseNeighborhoods } from "@/lib/markets";
import { requireUser } from "@/lib/session";

export default async function NewListingPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <PageHeader
        overline={user.market.universityName}
        title="List your room"
        description="Verified students near campus see your room ranked by how well it fits them. You choose who takes it over."
      />
      <div className="nn-card p-5 sm:p-6">
        <ListingForm neighborhoods={parseNeighborhoods(user.market.neighborhoods)} universityName={user.market.name} />
      </div>
    </div>
  );
}
