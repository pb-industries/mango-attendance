import { getConnection } from "../../util/db";

export default async (
  cursor: number,
  direction: "asc" | "desc",
  pageSize: number,
): Promise<Page> => {
    console.log(cursor, direction, pageSize)
  const raids = await getConnection()
    .select('*')
    .from("raid")
    .where(`id`, `${direction === "asc" ? ">" : "<"}`, `${cursor}`)
    .limit(pageSize);

    console.log(raids)

  return { data: raids, totalRows: raids.length, cursor, direction, pageSize };
};
