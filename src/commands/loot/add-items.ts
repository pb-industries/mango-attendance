import { getConnection } from '@/util/db';
// @ts-ignore
import * as csv from 'fast-csv';
import * as fs from 'fs';

// Only run this in dev
export default async (): Promise<any> => {
  const knex = await getConnection();

  const itemPath = '';

  const itemsToAdd: any[] = [];

  await fs
    .createReadStream(itemPath)
    .pipe(csv.parse({ headers: true }))
    .on('error', (error: any) => console.error(error))
    .on('data', (row: any) => {
      const { name, lucy_url, lucy_id } = row;
      itemsToAdd.push({
        name: name.toLowerCase().trim(),
        lucy_url: lucy_url,
        lucy_id: lucy_id,
      });
    })
    .on('end', async (rowCount: number) => {
      console.log(`Parsed ${itemsToAdd.length}/${rowCount} rows`);
      await knex.batchInsert('item', itemsToAdd, 1000);
    });

  // return await fs.readFile(itemPath, (err: any, data: any) => {
  //   if (err) {
  //     throw err;
  //   }

  //   parse(
  //     data,
  //     { columns: false, trim: true },
  //     async (err: any, output: any) => {
  //       if (err) {
  //         console.log(output);
  //         throw err;
  //       }

  //       const itemsToAdd = output.filter((item: any) => {
  //         // @ts-ignore
  //         return items.includes(item.name);
  //       });

  //       itemsToAdd.map((item: any) => {
  //         console.log(item);
  //         return {
  //           name: item.name,
  //           category: null,
  //           lucy_url: item.lucy_url,
  //           lucy_id: item.lucy_id,
  //           created_at: new Date().toISOString(),
  //           updated_at: new Date().toISOString(),
  //         };
  //       });

  //       // await knex.batchInsert('item', itemsToAddToDb, itemsToAddToDb.length);
  //     }
  //   );
  // });
};
