import { prismaClient } from "../src/index.js";
import { hashPassword } from "../src/utils/index.js";
async function main() {
  // Seed example data
  await prismaClient.user.deleteMany();
  const hashedPassword = await hashPassword("123456");
  await prismaClient.user.create({
    data: {
      email: "admin@mail.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
