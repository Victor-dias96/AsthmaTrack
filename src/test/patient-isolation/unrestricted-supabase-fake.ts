/**
 * In-memory stand-in for the Supabase client used by the Issue 130
 * application-layer isolation suites.
 *
 * It deliberately implements NO Row Level Security: every table behaves as
 * if every patient's rows were visible and writable. A query returns only
 * what the application's own filters (`.eq`, `.gte`, `.lt`, ...) select.
 * That isolates the application layer from the database layer, so a loader,
 * route or write surface that forgot its `patient_id` filter would leak or
 * modify the other fictional patient's rows here even though production RLS
 * would still hide them. RLS itself is covered separately by
 * supabase/tests/database/patient_isolation.test.sql.
 *
 * Only the PostgREST builder methods the patient code paths call are
 * supported; anything else throws so an unsupported chain fails loudly
 * instead of silently returning every row.
 */

type Row = Record<string, unknown>;

type FilterOperator = "eq" | "is" | "gte" | "lt";

export type RecordedFilter = {
  operator: FilterOperator;
  column: string;
  value: unknown;
};

export type RecordedQuery = {
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  filters: RecordedFilter[];
  payload: Row | null;
};

type QueryResult = {
  data: unknown;
  error: null;
  count: number | null;
  status: number;
};

function parseColumns(columns: string): string[] | null {
  const trimmed = columns.trim();

  if (trimmed === "*") {
    return null;
  }

  return trimmed.split(",").map((column) => column.trim());
}

function project(row: Row, columns: string[] | null): Row {
  if (columns === null) {
    return { ...row };
  }

  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

function compareValues(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function matches(row: Row, filter: RecordedFilter): boolean {
  const value = row[filter.column];

  switch (filter.operator) {
    case "eq":
    case "is":
      return value === filter.value;
    case "gte":
      return compareValues(value, filter.value) >= 0;
    case "lt":
      return compareValues(value, filter.value) < 0;
  }
}

class UnrestrictedQuery implements PromiseLike<QueryResult> {
  private operation: RecordedQuery["operation"] = "select";
  private columns: string[] | null = null;
  private returning: string[] | null | undefined = undefined;
  private countRequested = false;
  private readonly filters: RecordedFilter[] = [];
  private readonly orders: { column: string; ascending: boolean }[] = [];
  private rangeBounds: [number, number] | null = null;
  private limitCount: number | null = null;
  private single = false;
  private payload: Row | null = null;

  constructor(
    private readonly fake: UnrestrictedSupabaseFake,
    private readonly table: string
  ) {}

  select(columns = "*", options?: { count?: string }) {
    if (this.operation === "select") {
      this.columns = parseColumns(columns);
      this.countRequested = options?.count === "exact";
    } else {
      this.returning = parseColumns(columns);
    }

    return this;
  }

  insert(payload: Row) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ operator: "eq", column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ operator: "is", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ operator: "gte", column, value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ operator: "lt", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  range(from: number, to: number) {
    this.rangeBounds = [from, to];
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.single = true;
    return this;
  }

  overrideTypes() {
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }

  private execute(): QueryResult {
    this.fake.queries.push({
      table: this.table,
      operation: this.operation,
      filters: [...this.filters],
      payload: this.payload ? { ...this.payload } : null,
    });

    const rows = this.fake.tableRows(this.table);
    const matched = rows.filter((row) =>
      this.filters.every((filter) => matches(row, filter))
    );

    switch (this.operation) {
      case "select":
        return this.executeSelect(matched);
      case "insert":
        return this.executeInsert(rows);
      case "update":
        return this.executeUpdate(matched);
      case "delete":
        return this.executeDelete(rows, matched);
    }
  }

  private executeSelect(matched: Row[]): QueryResult {
    const sorted = [...matched].sort((left, right) => {
      for (const { column, ascending } of this.orders) {
        const difference = compareValues(left[column], right[column]);

        if (difference !== 0) {
          return ascending ? difference : -difference;
        }
      }

      return 0;
    });

    let page = sorted;

    if (this.rangeBounds) {
      page = page.slice(this.rangeBounds[0], this.rangeBounds[1] + 1);
    }

    if (this.limitCount !== null) {
      page = page.slice(0, this.limitCount);
    }

    const projected = page.map((row) => project(row, this.columns));

    return {
      data: this.single ? (projected[0] ?? null) : projected,
      error: null,
      count: this.countRequested ? matched.length : null,
      status: 200,
    };
  }

  private executeInsert(rows: Row[]): QueryResult {
    if (!this.payload) {
      throw new Error("insert requires a payload");
    }

    const inserted: Row = {
      id: `inserted-${rows.length + 1}`,
      ...this.payload,
    };
    rows.push(inserted);

    return this.writeResult([inserted], 201);
  }

  private executeUpdate(matched: Row[]): QueryResult {
    for (const row of matched) {
      Object.assign(row, this.payload);
    }

    return this.writeResult(matched, 200);
  }

  private executeDelete(rows: Row[], matched: Row[]): QueryResult {
    for (const row of matched) {
      rows.splice(rows.indexOf(row), 1);
    }

    return this.writeResult(matched, 200);
  }

  private writeResult(affected: Row[], status: number): QueryResult {
    if (this.returning === undefined) {
      return { data: null, error: null, count: null, status };
    }

    const projected = affected.map((row) => project(row, this.returning ?? null));

    return {
      data: this.single ? (projected[0] ?? null) : projected,
      error: null,
      count: null,
      status,
    };
  }
}

export class UnrestrictedSupabaseFake {
  readonly queries: RecordedQuery[] = [];
  private readonly tables = new Map<string, Row[]>();
  private actorId: string | null = null;

  constructor(tables: Record<string, Row[]>) {
    for (const [name, rows] of Object.entries(tables)) {
      this.tables.set(
        name,
        rows.map((row) => ({ ...row }))
      );
    }
  }

  /** Sets the identity the fake auth API reports; `null` means anonymous. */
  signInAs(actorId: string | null) {
    this.actorId = actorId;
  }

  tableRows(table: string): Row[] {
    const rows = this.tables.get(table);

    if (!rows) {
      throw new Error(`Unexpected table: ${table}`);
    }

    return rows;
  }

  /** Snapshot copy so assertions can never mutate fixture state. */
  snapshot(table: string): Row[] {
    return this.tableRows(table).map((row) => ({ ...row }));
  }

  queriesOn(table: string): RecordedQuery[] {
    return this.queries.filter((query) => query.table === table);
  }

  from(table: string) {
    this.tableRows(table);
    return new UnrestrictedQuery(this, table);
  }

  rpc(name: string): never {
    throw new Error(`Patient code paths must not call RPC ${name}`);
  }

  readonly auth = {
    getClaims: async () =>
      this.actorId
        ? {
            data: { claims: { sub: this.actorId, role: "authenticated" } },
            error: null,
          }
        : { data: null, error: null },
    getUser: async () =>
      this.actorId
        ? { data: { user: { id: this.actorId } }, error: null }
        : {
            data: { user: null },
            error: { name: "AuthSessionMissingError", status: 400 },
          },
  };
}

/**
 * Hands the fake to code typed against the real Supabase client. The cast is
 * confined here so test files stay free of `as unknown as` noise.
 */
export function asSupabaseClient<T>(fake: UnrestrictedSupabaseFake): T {
  return fake as unknown as T;
}
