import { notFound } from "next/navigation";
import { Check, PartyPopper } from "lucide-react";
import { SignForm } from "@/components/client/actions";
import { Banner } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function Steps({ current }: { current: number }) {
  const steps = ["Match accepted", "Review terms", "Both sign", "Complete"];

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Transfer progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <span className={cn("h-1.5 rounded-full", done || active ? "bg-nest" : "bg-line")} />
            <span className={cn("flex items-center gap-1 text-caption", done || active ? "text-ink" : "text-ink-faint")}>
              {done ? <Check aria-hidden size={12} className="text-nest" /> : null}
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function TransferPage({ params }: { params: Promise<{ transferId: string }> }) {
  const { transferId } = await params;
  const user = await requireUser();
  const transfer = await prisma.leaseTransfer.findUnique({
    where: { id: transferId },
    include: { listing: { include: { market: true } }, outgoingStudent: true, incomingStudent: true, match: { include: { preference: true } } }
  });

  if (!transfer || (transfer.outgoingStudentId !== user.id && transfer.incomingStudentId !== user.id)) {
    notFound();
  }

  const { listing, outgoingStudent, incomingStudent } = transfer;
  const isOutgoing = transfer.outgoingStudentId === user.id;
  const mySignedAt = isOutgoing ? transfer.outgoingSignedAt : transfer.incomingSignedAt;
  const complete = transfer.status === "FULLY_EXECUTED";
  const signedCount = Number(Boolean(transfer.outgoingSignedAt)) + Number(Boolean(transfer.incomingSignedAt));
  const step = complete ? 4 : signedCount > 0 ? 2 : 1;
  const effectiveDate = new Date(Math.max(listing.availableFrom.getTime(), transfer.match.preference.moveInDate.getTime()));
  const endDate = listing.availableUntil ?? listing.leaseEndDate;

  // Once signed, the document shows the typed legal names rather than display names.
  const assignorName = transfer.outgoingSignatureName ?? outgoingStudent.name;
  const assigneeName = transfer.incomingSignatureName ?? incomingStudent.name;

  const parties = [
    { role: "Assignor (current tenant)", user: outgoingStudent, name: transfer.outgoingSignatureName, signedAt: transfer.outgoingSignedAt },
    { role: "Assignee (incoming student)", user: incomingStudent, name: transfer.incomingSignatureName, signedAt: transfer.incomingSignedAt }
  ];

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-4">
        <p className="nn-overline">Lease transfer</p>
        <h1 className="text-heading-lg">{listing.title}</h1>
        <Steps current={step} />
      </div>

      {complete ? (
        <Banner tone="nest" icon={<PartyPopper size={16} />}>
          Both of you signed on {formatDate(transfer.fullyExecutedAt!)}. Next, send this signed assignment to the landlord
          {listing.landlordName ? ` (${listing.landlordName})` : ""} for their consent if your lease requires it, then plan the key handoff.
        </Banner>
      ) : mySignedAt ? (
        <Banner tone="sky">You signed. We’re waiting on {isOutgoing ? incomingStudent.name ?? "the incoming student" : outgoingStudent.name ?? "the current tenant"}.</Banner>
      ) : null}

      <section className="nn-card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-heading">Contact</h2>
        <p className="text-body-sm text-ink-muted">You both agreed to this match, so your contact details are now shared.</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {parties.map((party) => (
            <li key={party.role} className="rounded-md bg-surface-sunken p-3">
              <p className="text-caption text-ink-muted">{party.role}</p>
              <p className="font-medium">{party.user.name}</p>
              <a className="nn-link text-body-sm" href={`mailto:${party.user.email}`}>
                {party.user.email}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="nn-card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="terms-heading">
        <h2 id="terms-heading" className="text-heading">
          Lease assignment
        </h2>
        <div className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface p-4 text-body-sm">
          <p>
            <strong>{assignorName}</strong> (“Assignor”) assigns to <strong>{assigneeName}</strong> (“Assignee”) the Assignor’s rights and
            obligations under the residential lease for <strong>{listing.streetLine1}, {listing.city}, {listing.stateRegion}</strong>
            {listing.landlordName ? ` with ${listing.landlordName} (“Landlord”)` : ""}, for the period from <strong>{formatDate(effectiveDate)}</strong> to{" "}
            <strong>{formatDate(endDate)}</strong>.
          </p>
          <p>
            The Assignee will pay rent of <strong>{formatCurrency(listing.monthlyRentCents / 100)} per month</strong> for this period and follow the terms of the
            original lease. The Assignor stays responsible for obligations before the effective date.
            {listing.isFurnished ? " Furniture listed with the room is included as described in the listing." : ""}
          </p>
          <p>
            This assignment takes effect only if the Landlord consents where the lease requires it. Both parties confirm they are students verified through
            their university email.
          </p>
        </div>
        <p className="text-caption text-ink-muted">
          This is a plain-language template, not legal advice. Check your original lease for transfer and subletting rules.
        </p>
      </section>

      <section className="nn-card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-heading">Signatures</h2>
        <ul className="flex flex-col gap-2">
          {parties.map((party) => (
            <li key={party.role} className="flex items-center justify-between gap-3 border-b border-line-subtle pb-2 last:border-0">
              <span className="text-body-sm text-ink-muted">{party.role}</span>
              {party.signedAt ? (
                <span className="text-right text-body-sm">
                  <span className="font-medium italic">{party.name}</span>
                  <span className="block text-caption text-ink-faint">Signed {formatDate(party.signedAt)}</span>
                </span>
              ) : (
                <span className="text-body-sm text-ink-faint">Not signed yet</span>
              )}
            </li>
          ))}
        </ul>
        {!mySignedAt && !complete ? <SignForm transferId={transfer.id} expectedName="" /> : null}
      </section>
    </div>
  );
}
