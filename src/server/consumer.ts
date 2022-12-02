import record from '@/commands/loot/record';
import { __kafka__ } from '@/constants';
import { Kafka } from 'kafkajs';

const clientId = 'loot-parser-client';

const brokers = [__kafka__.brokers];
const kafka = new Kafka({
  clientId,
  brokers,
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-256',
    username: __kafka__.username,
    password: __kafka__.password,
  },
});

const consumer = kafka.consumer({
  groupId: 'loot-parser-client',
});

export const start = async (topic: string) => {
  await consumer.connect();
  await consumer.subscribe({
    topic,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { key, value } = message;
      const jsonValue = JSON.parse(value?.toString() || '{}');
      if (Object.keys(jsonValue).length === 0 || !key?.toString()) {
        console.error('Invalid message/key', [key, value]);
        return;
      }
      console.log('received message', {
        topic,
        partition,
        key: key.toString(),
        value: jsonValue,
      });

      try {
        const res = await record(BigInt(`${key.toString()}`), [jsonValue]);
        console.log('recorded lines: ', res);
      } catch (e) {
        console.log('recorded no lines because');
        console.warn(e.message);
      }
    },
  });
};

export const disconnect = async (): Promise<void> => {
  try {
    await consumer.disconnect();
  } catch (e) {
    console.error('Failed to gracefully disconnect consumer', e);
  }
  // This will cause fly.io to reboot the process
  console.error('terminating process');
  process.exit(1);
};
