import { PrismaClient } from "../generated/prisma-client/client";

const prisma = new PrismaClient();

async function main() {
  // Users (with fake clerkIds for demo)
  const alice = await prisma.user.upsert({
    where: { clerkId: "demo_clerk_alice" },
    create: {
      clerkId: "demo_clerk_alice",
      email: "alice@example.com",
      fullName: "Alice Wanjiru",
      county: "Nairobi",
      accountType: "INDIVIDUAL",
      role: "INDIVIDUAL",
      isVerified: true,
    },
    update: {},
  });
  const clubAdmin = await prisma.user.upsert({
    where: { clerkId: "demo_clerk_admin" },
    create: {
      clerkId: "demo_clerk_admin",
      email: "admin@eco.edu",
      fullName: "Eco Club Admin",
      county: "Kiambu",
      accountType: "INSTITUTION",
      role: "CLUB_ADMIN",
      isVerified: true,
    },
    update: {},
  });

  // Club
  const club = await prisma.club.upsert({
    where: { id: "seed_club_1" },
    create: {
      id: "seed_club_1",
      name: "Green Roots Club",
      institutionEmail: "club@eco.edu",
      county: "Kiambu",
      adminId: clubAdmin.id,
      verified: true,
    },
    update: {},
  });

  // Stations + Inventory
  const stationA = await prisma.seedlingStation.create({
    data: { name: "UoN Botany Dept Station", location: "Nairobi", contactPhone: "+254700000001" },
  });
  const stationB = await prisma.seedlingStation.create({
    data: { name: "Karura Hub", location: "Nairobi", contactPhone: "+254700000002" },
  });
  await prisma.seedlingInventory.createMany({
    data: [
      { stationId: stationA.id, seedlingType: "Moringa", quantityAvailable: 80, status: "AVAILABLE" },
      { stationId: stationA.id, seedlingType: "Acacia", quantityAvailable: 12, status: "LOW_STOCK" },
      { stationId: stationB.id, seedlingType: "Jacaranda", quantityAvailable: 0, status: "OUT_OF_STOCK" },
      { stationId: stationB.id, seedlingType: "Neem", quantityAvailable: 40, status: "AVAILABLE" },
    ],
    skipDuplicates: true,
  });

  // Posts (Achievement + Event)
  await prisma.post.create({
    data: {
      authorId: alice.id,
      type: "ACHIEVEMENT",
      title: "Planted 10 seedlings at Uhuru Park",
      description: "Great community turnout and lovely weather!",
      mediaUrls: [],
      location: "Uhuru Park, Nairobi",
    },
  });

  await prisma.post.create({
    data: {
      authorId: clubAdmin.id,
      type: "EVENT",
      title: "Karura Forest Clean-up & Planting",
      description: "Join us Saturday for a joint clean-up and planting session.",
      mediaUrls: [],
      location: "Karura Forest",
      eventDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      incentive: "Snacks & certificates provided",
    },
  });

  console.log("Seed complete: users, club, stations, inventory, posts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
