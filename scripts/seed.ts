import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create default test account (admin)
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "john@doe.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("johndoe123", 10);
    await prisma.user.create({
      data: {
        username: "john@doe.com",
        email: "john@doe.com",
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: "Admin User",
      },
    });
    console.log("✓ Created default admin account");
  } else {
    console.log("✓ Default admin account already exists");
  }

  // Create a demo student
  const existingStudent = await prisma.user.findUnique({
    where: { username: "student1" },
  });

  if (!existingStudent) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        username: "student1",
        password: hashedPassword,
        role: UserRole.STUDENT,
        name: "Demo Student",
      },
    });
    console.log("✓ Created demo student account");
  } else {
    console.log("✓ Demo student account already exists");
  }

  // Create a demo parent
  const existingParent = await prisma.user.findUnique({
    where: { username: "parent1" },
  });

  if (!existingParent) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const parent = await prisma.user.create({
      data: {
        username: "parent1",
        password: hashedPassword,
        role: UserRole.PARENT,
        name: "Demo Parent",
      },
    });

    // Link parent to student
    const student = await prisma.user.findUnique({
      where: { username: "student1" },
    });

    if (student) {
      await prisma.studentParentLink.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
        },
      });
      console.log("✓ Created demo parent account and linked to student");
    }
  } else {
    console.log("✓ Demo parent account already exists");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
