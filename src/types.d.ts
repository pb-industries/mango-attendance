interface Page {
    data: any[];
    totalRows: number;
    cursor: number;
    direction: Direction
    pageSize: number
}

type Direction = "asc" | "desc"
