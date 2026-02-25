import { Pagination } from "react-bootstrap";

function Paginator({ itemCount, page, setPageNumber, gridName }) {
  const pageSize = 100;
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  const currentPage = parseInt(page) || 1;

  // Show a sliding window of up to 5 pages centred on the current page.
  const startPage = pageCount > 5 ? Math.max(1, currentPage - 2) : 1;
  const endPage = pageCount > 5 ? Math.min(pageCount, currentPage + 2) : pageCount;

  if (pageCount <= 1) return null;

  const items = [];

  if (pageCount >= 2) {
    items.push(
      <Pagination.Prev
        key={`${gridName}_prev`}
        disabled={currentPage <= 1}
        onClick={() => setPageNumber(Math.max(1, currentPage - 1))}
      />
    );
  }

  // Always show page 1 when the window has scrolled away from it.
  if (pageCount >= 6 && currentPage >= 4) {
    items.push(
      <Pagination.Item key={`${gridName}_p1`} onClick={() => setPageNumber(1)}>
        {1}
      </Pagination.Item>
    );
  }

  if (pageCount >= 8 && currentPage > 4) {
    items.push(<Pagination.Ellipsis key={`${gridName}_startEllipsis`} disabled />);
  }

  for (let p = startPage; p <= endPage; p++) {
    items.push(
      <Pagination.Item
        key={`${gridName}_p${p}`}
        active={p === currentPage}
        onClick={() => setPageNumber(p)}
      >
        {p}
      </Pagination.Item>
    );
  }

  if (pageCount >= 8 && currentPage < pageCount - 3) {
    items.push(<Pagination.Ellipsis key={`${gridName}_endEllipsis`} disabled />);
  }

  // Always show the last page when the window has scrolled away from it.
  if (pageCount >= 7) {
    items.push(
      <Pagination.Item
        key={`${gridName}_plast`}
        onClick={() => setPageNumber(pageCount)}
      >
        {pageCount}
      </Pagination.Item>
    );
  }

  if (pageCount >= 2) {
    items.push(
      <Pagination.Next
        key={`${gridName}_next`}
        disabled={currentPage >= pageCount}
        onClick={() => setPageNumber(Math.min(pageCount, currentPage + 1))}
      />
    );
  }

  return (
    <Pagination variant="dark" id={`${gridName}_paginator`}>
      {items}
    </Pagination>
  );
}

export default Paginator;
