export interface PageData<T> {
  pageSize: number;
  pageNumber: number;
  totalPageNumber: number;
  totalSize: number;
  list: T[];
}
