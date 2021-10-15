import { getConnection } from "../../util/db";

export default async (
  raidName: string
): Promise<{ id: number; name: string; date: string }> => {
  const date = getFormattedDate(new Date());

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

function getFormattedDate(date: any) {
  var year = date.getFullYear();

  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : "0" + month;

  var day = date.getDate().toString();
  day = day.length > 1 ? day : "0" + day;

  return month + "/" + day + "/" + year;
}
