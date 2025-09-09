import z from 'zod';
import { InvalidArgumentErrorData } from '../entities';

export function formatZodError(error: z.ZodError): InvalidArgumentErrorData {
  const data: InvalidArgumentErrorData = {};

  error.errors.forEach((issue) => {
    data[issue.path.join('.')] = [issue.message];
  });

  return data;
}
