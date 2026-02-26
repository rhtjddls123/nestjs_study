import { QueryRunner } from 'typeorm';

export async function runWithQueryRunner<T>(
  qr: QueryRunner,
  logic: (qr: QueryRunner) => Promise<T>,
): Promise<T> {
  await qr.connect();
  await qr.startTransaction();

  try {
    const result = await logic(qr);
    await qr.commitTransaction();
    return result;
  } catch (e) {
    await qr.rollbackTransaction();
    throw e;
  } finally {
    await qr.release();
  }
}
