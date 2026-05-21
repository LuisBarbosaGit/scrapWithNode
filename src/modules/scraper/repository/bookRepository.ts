import type { Prisma } from "../../../generated/prisma/client.js";

import { getPrisma } from "../../../infra/db/client.js";
import type { Book } from "../../../types/book.js";

function toBookRecord(book: Book): Prisma.BookCreateInput {
  const record: Prisma.BookCreateInput = {
    title: book.title,
    price: book.price,
    availability: book.availability,
    rating: book.rating,
    url: book.url,
  };

  if (book.metadata !== undefined) {
    record.metadata = book.metadata as unknown as Prisma.InputJsonValue;
  }

  return record;
}

export async function persistBooks(books: Book[]): Promise<number> {
  const prisma = getPrisma();

  await prisma.$transaction(
    books.map((book) => {
      const data = toBookRecord(book);
      return prisma.book.upsert({
        where: { url: book.url },
        create: data,
        update: {
          title: data.title,
          price: data.price,
          availability: data.availability,
          rating: data.rating,
          metadata: data.metadata,
        },
      });
    }),
  );

  return books.length;
}
