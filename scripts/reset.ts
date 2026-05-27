import "dotenv/config";
import * as schema from "../db/schema";
import db from "../db/drizzle";

const main = async () => {
  try {
    console.log("Resetting the database");

    await db.delete(schema.curriculum);
    await db.delete(schema.userProgress);
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.challenges);
    await db.delete(schema.challengeOptions);
    await db.delete(schema.challengeProgress);
    await db.delete(schema.userSubscription);

    console.log("Resetting finished");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to reset the database");
  }
};

main();
