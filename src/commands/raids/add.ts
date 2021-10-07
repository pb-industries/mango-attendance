import { getConnection } from "../../util/db";

export default async (
  raidName: string
): Promise<{ name: string; date: string }> => {
  const date = new Date().toLocaleDateString();

  const rows = await getConnection()
    .insert({
      name: raidName,
      created_at: date,
      updated_at: date,
      deleted_at: null,
    })
    .into("raids")
    .onConflict(["created_at"])
    .merge({ updated_at: new Date(), name: raidName })
    .returning("*");

  console.log("added raid: ", rows);
  return { name: `${raidName}@${date}`, date };
};
