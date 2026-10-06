-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT_SEEKER', 'STUDENT_LISTER', 'LANDLORD', 'ADMIN');

-- CreateEnum
CREATE TYPE "UniversityVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_EMAIL', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ManualVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('PASSPORT', 'ENROLLMENT_PROOF');

-- CreateEnum
CREATE TYPE "ListingState" AS ENUM ('DRAFT', 'SCREENING', 'UNDER_REVIEW', 'ACTIVE', 'MATCHED', 'TRANSFERRED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('PRIVATE_ROOM', 'SHARED_ROOM', 'STUDIO', 'ENTIRE_APARTMENT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "ScamDecision" AS ENUM ('APPROVED', 'HELD_FOR_REVIEW');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingAmenity" AS ENUM ('WIFI', 'LAUNDRY', 'PARKING', 'GYM', 'PET_FRIENDLY', 'AIR_CONDITIONING', 'ELEVATOR', 'DOORMAN', 'BALCONY', 'DISHWASHER');

-- CreateEnum
CREATE TYPE "FurnishingStatus" AS ENUM ('UNFURNISHED', 'PARTIALLY_FURNISHED', 'FULLY_FURNISHED');

-- CreateEnum
CREATE TYPE "LeaseTransferStatus" AS ENUM ('AWAITING_LISTER_SELECTION', 'LANDLORD_REVIEW', 'LANDLORD_REJECTED', 'READY_FOR_SIGNATURE', 'OUTGOING_SIGNED', 'INCOMING_SIGNED', 'FULLY_EXECUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LandlordDecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SignatureProvider" AS ENUM ('DOCUSIGN', 'HELLOSIGN');

-- CreateEnum
CREATE TYPE "SignatureEnvelopeStatus" AS ENUM ('DRAFT', 'SENT', 'OUTGOING_SIGNED', 'INCOMING_SIGNED', 'COMPLETED', 'VOIDED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('PROFILE_PHOTO', 'ORIGINAL_LEASE', 'SIGNED_LEASE', 'PASSPORT', 'ENROLLMENT_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING_PAYMENT', 'HELD_IN_ESCROW', 'RELEASE_SCHEDULED', 'RELEASED', 'DISPUTED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED');

-- CreateEnum
CREATE TYPE "TourSlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('OUTGOING_TO_INCOMING', 'INCOMING_TO_OUTGOING', 'LANDLORD_TO_STUDENT', 'STUDENT_TO_LANDLORD');

-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('CLEAN', 'FLAGGED', 'HIDDEN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "bio" VARCHAR(200),
    "universityName" TEXT,
    "graduationYear" INTEGER,
    "roles" "UserRole"[] DEFAULT ARRAY['STUDENT_SEEKER']::"UserRole"[],
    "universityVerificationStatus" "UniversityVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "manualVerificationStatus" "ManualVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "manualVerificationNotes" TEXT,
    "isEduEmail" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "profilePhotoKey" TEXT,
    "marketId" TEXT,
    "experimentGroups" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000),
    "streetLine1" TEXT NOT NULL,
    "streetLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateRegion" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "campusName" TEXT,
    "neighborhood" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "monthlyRentCents" INTEGER NOT NULL,
    "securityDepositCents" INTEGER,
    "leaseStartDate" TIMESTAMP(3) NOT NULL,
    "leaseEndDate" TIMESTAMP(3) NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3),
    "furnishingStatus" "FurnishingStatus" NOT NULL DEFAULT 'UNFURNISHED',
    "isFurnished" BOOLEAN NOT NULL DEFAULT false,
    "bathrooms" DECIMAL(3,1),
    "bedrooms" DECIMAL(3,1),
    "squareFeet" INTEGER,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "amenities" "ListingAmenity"[],
    "roomType" "RoomType" NOT NULL DEFAULT 'PRIVATE_ROOM',
    "lifestyleTags" TEXT[],
    "photoUrls" TEXT[],
    "state" "ListingState" NOT NULL DEFAULT 'DRAFT',
    "scamScore" INTEGER,
    "scamFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "appealNote" VARCHAR(1000),
    "landlordName" TEXT,
    "landlordEmail" TEXT,
    "landlordPhoneNumber" TEXT,
    "draftSavedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseDocument" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "uploadedById" TEXT,
    "kind" "DocumentKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "providerUrl" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VerificationDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "reviewedByAdmin" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FurnitureItem" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "askingPriceCents" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FurnitureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "fitBreakdown" JSONB NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'REQUESTED',
    "introMessage" VARCHAR(300),
    "declineReason" VARCHAR(300),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseTransfer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "outgoingStudentId" TEXT NOT NULL,
    "incomingStudentId" TEXT NOT NULL,
    "landlordId" TEXT,
    "status" "LeaseTransferStatus" NOT NULL DEFAULT 'AWAITING_LISTER_SELECTION',
    "landlordDecisionStatus" "LandlordDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "landlordDecisionReason" TEXT,
    "landlordPortalToken" TEXT,
    "landlordDecisionAt" TIMESTAMP(3),
    "readyForSignatureAt" TIMESTAMP(3),
    "outgoingSignatureName" TEXT,
    "outgoingSignedAt" TIMESTAMP(3),
    "incomingSignatureName" TEXT,
    "incomingSignedAt" TIMESTAMP(3),
    "fullyExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureEnvelope" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "signedLeaseDocumentId" TEXT,
    "provider" "SignatureProvider" NOT NULL,
    "providerEnvelopeId" TEXT NOT NULL,
    "status" "SignatureEnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "outgoingSignedAt" TIMESTAMP(3),
    "incomingSignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL,
    "transferId" TEXT,
    "furnitureItemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "amountCents" INTEGER NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "providerPaymentIntentId" TEXT,
    "providerTransferId" TEXT,
    "holdPlacedAt" TIMESTAMP(3),
    "releaseEligibleAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeTicket" (
    "id" TEXT NOT NULL,
    "escrowTransactionId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "assignedAdminId" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" VARCHAR(500) NOT NULL,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DisputeTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourSlot" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "googleCalendarEventId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "TourSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourBooking" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "googleCalendarEventId" TEXT,
    "googleMeetUrl" TEXT,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "transferId" TEXT,
    "type" "ReviewType" NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'CLEAN',
    "moderationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "emailDomains" TEXT[],
    "city" TEXT NOT NULL,
    "stateRegion" TEXT NOT NULL,
    "campusLatitude" DECIMAL(9,6) NOT NULL,
    "campusLongitude" DECIMAL(9,6) NOT NULL,
    "marketAvgRentCents" INTEGER NOT NULL,
    "neighborhoods" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "budgetMinCents" INTEGER NOT NULL,
    "budgetMaxCents" INTEGER NOT NULL,
    "preferredArea" TEXT NOT NULL,
    "areaLatitude" DECIMAL(9,6) NOT NULL,
    "areaLongitude" DECIMAL(9,6) NOT NULL,
    "commuteRadiusMiles" DECIMAL(5,2) NOT NULL,
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "leaseDurationMonths" INTEGER NOT NULL,
    "roomType" "RoomType",
    "wantsFurnished" BOOLEAN NOT NULL DEFAULT false,
    "lifestyleTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamCheck" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "heuristicFlags" TEXT[],
    "claudeRiskScore" INTEGER,
    "claudeFlags" TEXT[],
    "claudeReasoning" TEXT,
    "claudeError" TEXT,
    "threshold" INTEGER NOT NULL,
    "decision" "ScamDecision" NOT NULL,
    "reviewOutcome" "ReviewOutcome" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "inputs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScamCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLoginToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "marketId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventProperties" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Listing_marketId_state_idx" ON "Listing"("marketId", "state");

-- CreateIndex
CREATE INDEX "Listing_state_availableFrom_idx" ON "Listing"("state", "availableFrom");

-- CreateIndex
CREATE INDEX "Listing_city_stateRegion_idx" ON "Listing"("city", "stateRegion");

-- CreateIndex
CREATE INDEX "Listing_monthlyRentCents_idx" ON "Listing"("monthlyRentCents");

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseDocument_fileKey_key" ON "LeaseDocument"("fileKey");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDocument_fileKey_key" ON "VerificationDocument"("fileKey");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Match_listingId_preferenceId_key" ON "Match"("listingId", "preferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseTransfer_listingId_key" ON "LeaseTransfer"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseTransfer_matchId_key" ON "LeaseTransfer"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseTransfer_landlordPortalToken_key" ON "LeaseTransfer"("landlordPortalToken");

-- CreateIndex
CREATE INDEX "LeaseTransfer_status_idx" ON "LeaseTransfer"("status");

-- CreateIndex
CREATE INDEX "LeaseTransfer_landlordDecisionStatus_idx" ON "LeaseTransfer"("landlordDecisionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureEnvelope_transferId_key" ON "SignatureEnvelope"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureEnvelope_signedLeaseDocumentId_key" ON "SignatureEnvelope"("signedLeaseDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureEnvelope_providerEnvelopeId_key" ON "SignatureEnvelope"("providerEnvelopeId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_providerPaymentIntentId_key" ON "EscrowTransaction"("providerPaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_providerTransferId_key" ON "EscrowTransaction"("providerTransferId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_status_idx" ON "EscrowTransaction"("status");

-- CreateIndex
CREATE INDEX "EscrowTransaction_releaseEligibleAt_idx" ON "EscrowTransaction"("releaseEligibleAt");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeTicket_escrowTransactionId_key" ON "DisputeTicket"("escrowTransactionId");

-- CreateIndex
CREATE INDEX "TourSlot_listingId_startsAt_idx" ON "TourSlot"("listingId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TourBooking_slotId_key" ON "TourBooking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "TourBooking_googleCalendarEventId_key" ON "TourBooking"("googleCalendarEventId");

-- CreateIndex
CREATE INDEX "Review_subjectId_createdAt_idx" ON "Review"("subjectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceProfile_userId_key" ON "PreferenceProfile"("userId");

-- CreateIndex
CREATE INDEX "ScamCheck_listingId_createdAt_idx" ON "ScamCheck"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ScamCheck_decision_reviewOutcome_idx" ON "ScamCheck"("decision", "reviewOutcome");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLoginToken_tokenHash_key" ON "EmailLoginToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailLoginToken_email_idx" ON "EmailLoginToken"("email");

-- CreateIndex
CREATE INDEX "Event_eventType_createdAt_idx" ON "Event"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "Event_marketId_eventType_idx" ON "Event"("marketId", "eventType");

-- CreateIndex
CREATE INDEX "Event_userId_eventType_idx" ON "Event"("userId", "eventType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseDocument" ADD CONSTRAINT "LeaseDocument_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseDocument" ADD CONSTRAINT "LeaseDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FurnitureItem" ADD CONSTRAINT "FurnitureItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "PreferenceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseTransfer" ADD CONSTRAINT "LeaseTransfer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseTransfer" ADD CONSTRAINT "LeaseTransfer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseTransfer" ADD CONSTRAINT "LeaseTransfer_outgoingStudentId_fkey" FOREIGN KEY ("outgoingStudentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseTransfer" ADD CONSTRAINT "LeaseTransfer_incomingStudentId_fkey" FOREIGN KEY ("incomingStudentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseTransfer" ADD CONSTRAINT "LeaseTransfer_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureEnvelope" ADD CONSTRAINT "SignatureEnvelope_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "LeaseTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureEnvelope" ADD CONSTRAINT "SignatureEnvelope_signedLeaseDocumentId_fkey" FOREIGN KEY ("signedLeaseDocumentId") REFERENCES "LeaseDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "LeaseTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_furnitureItemId_fkey" FOREIGN KEY ("furnitureItemId") REFERENCES "FurnitureItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeTicket" ADD CONSTRAINT "DisputeTicket_escrowTransactionId_fkey" FOREIGN KEY ("escrowTransactionId") REFERENCES "EscrowTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeTicket" ADD CONSTRAINT "DisputeTicket_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeTicket" ADD CONSTRAINT "DisputeTicket_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourSlot" ADD CONSTRAINT "TourSlot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourSlot" ADD CONSTRAINT "TourSlot_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TourSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "LeaseTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceProfile" ADD CONSTRAINT "PreferenceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceProfile" ADD CONSTRAINT "PreferenceProfile_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScamCheck" ADD CONSTRAINT "ScamCheck_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
