import { getConnection } from "../../util/db";

export default async (
  raidName: string
): Promise<{ name: string; date: string }> => {
  const date = new Date().toLocaleDateString();

  await getConnection()
    .insert({
      name: raidName.toLowerCase(),
      created_at: date,
      updated_at: date,
    })
    .into("raid")
    .onConflict(["created_at"])
    .merge({ updated_at: new Date(), name: raidName })
    .returning("*");

  return { name: `${raidName}@${date}`, date };
};
