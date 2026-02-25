import { useState } from "react";

export function usePagination(initialPage = 1, pageSize = 100) {
  const [page, setPage] = useState(initialPage);

  const offset = (page - 1) * pageSize;

  return { page, setPage, pageSize, offset };
}
