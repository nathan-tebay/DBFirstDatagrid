import { useEffect } from "react";
import { Pagination } from "react-bootstrap";
import ReactDOM from "react-dom";

function Paginator({ itemCount, page, setPageNumber, gridName }) {
  useEffect(() => {
    let paginatorId = `${gridName}_paginator`;
    let pageCount = Math.floor(itemCount / 100);

    let startPage =
      pageCount > 5 ? (parseInt(page) > 2 ? parseInt(page) - 2 : 1) : 1;
    let endPage =
      pageCount > 5
        ? parseInt(page) + 2 < pageCount
          ? 5
          : pageCount
        : pageCount;

    const handlePageChange = (page) => {
      setPageNumber(page);
    };
    let paginatorComponents = [];

    if (pageCount >= 2)
      paginatorComponents.push(
        <Pagination.Prev
          key={`${gridName}_prevButton`}
          pageNumber={page - 1 > 0 ? page - 1 : page}
          onClick={(item) => handlePageChange(item)}
        />
      );

    if (pageCount >= 6 && page >= 4)
      paginatorComponents.push(
        <Pagination.Item
          key={`${gridName}_pageNumber_1`}
          pageNumber={1}
          onClick={(item) => handlePageChange(item)}
        >
          {1}
        </Pagination.Item>
      );
    if (pageCount >= 8 && page > 4)
      paginatorComponents.push(
        <Pagination.Ellipsis key={`${gridName}_startEllipsis`} />
      );

    for (var pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
      paginatorComponents.push(
        <Pagination.Item
          key={`${gridName}_pageNumber_${pageNumber}`}
          active={pageNumber === parseInt(page)}
          pageNumber={pageNumber}
          onClick={(item) => handlePageChange(item)}
        >
          {pageNumber}
        </Pagination.Item>
      );
    }

    if (pageCount >= 8 && page < pageCount - 3)
      paginatorComponents.push(
        <Pagination.Ellipsis key={`${gridName}_endEllipsis`} />
      );

    if (pageCount >= 7)
      paginatorComponents.push(
        <Pagination.Item
          key={`${gridName}_pageNumber_${pageCount}`}
          pageNumber={pageCount}
          onClick={(item) => handlePageChange(item)}
        >
          {pageCount}
        </Pagination.Item>
      );
    if (pageCount >= 2)
      paginatorComponents.push(
        <Pagination.Next
          key={`${gridName}_nextButton`}
          pageNumber={page + 1 > page ? page : page + 1}
          onClick={(item) => handlePageChange(item)}
        />
      );

    ReactDOM.render(
      paginatorComponents,
      document.getElementById(`${paginatorId}`)
    );
  }, []);

  return (
    <Pagination
      variant="dark"
      id={`${gridName}_paginator`}
      key={`${gridName}_paginator`}
    ></Pagination>
  );
}

export default Paginator;
