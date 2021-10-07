import { getConnection } from "../../util/db";

export default async (
  raidName: string
): Promise<{ id: number; name: string; date: string }> => {
  const date = new Date().toLocaleDateString();

  const raids = await getConnection()
    .insert({
      name: raidName.toLowerCase(),
      created_at: date,
      updated_at: date,
    })
    .into("raid")
    .onConflict(["created_at"])
    .merge({ updated_at: new Date(), name: raidName })
    .returning("*");

  return { id: raids[0]?.id, name: `${raidName}@${date}`, date };
};
