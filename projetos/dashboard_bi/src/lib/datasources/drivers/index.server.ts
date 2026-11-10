// Server-only driver registry. Adding an engine = one adapter file + one entry.
import type { DatabaseDriver, DsType } from "../types";
import { DriverError } from "../types";
import { postgresDriver } from "./postgres.server";
import { mariadbDriver, mysqlDriver } from "./mysql-http.server";
import { sqliteDriver } from "./libsql.server";

const DRIVERS: Partial<Record<DsType, DatabaseDriver>> = {
  postgresql: postgresDriver,
  mysql: mysqlDriver,
  mariadb: mariadbDriver,
  sqlite: sqliteDriver,
};

export function getDriver(type: DsType): DatabaseDriver {
  const driver = DRIVERS[type];
  if (!driver) {
    throw new DriverError(
      `No live driver is available for "${type}" yet. The connection can be catalogued, but testing and discovery are not supported.`,
      "offline",
    );
  }
  return driver;
}

export function hasDriver(type: DsType): boolean {
  return Boolean(DRIVERS[type]);
}
