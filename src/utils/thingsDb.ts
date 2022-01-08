import { readFileSync } from "fs";
import path from "path";
import { homedir } from "os";
import { environment } from "@raycast/api";
import initSqlJs, { Database, ParamsObject } from "sql.js";
import { INBOX_QUERY, TODAYS_QUERY, ANYTIME_QUERY, SOMEDAY_QUERY, UPCOMING_QUERY } from "./queries";
import { ListName, Todo } from "./types";

const THINGS_DB_PATH =
  homedir() + "/Library/Group Containers/JLMPQHK86H.com.culturedcode.ThingsMac/Things Database.thingsdatabase/main.sqlite";

export async function loadDatabase(): Promise<ThingsDb> {
  const SQL = await initSqlJs({ locateFile: () => path.join(environment.assetsPath, "sql-wasm.wasm") });
  const db = readFileSync(THINGS_DB_PATH);
  return new ThingsDb(new SQL.Database(db));
}

export class ThingsDb {
  database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  close() {
    this.database.close();
  }

  private toTodo(row: ParamsObject): Todo {
    return {
      id: row.uuid as string,
      title: row.title as string,
      notes: row.notes as string,
    };
  }

  private getQuery(listName: ListName): string {
    switch(listName) {
      case 'Today':
        return TODAYS_QUERY
      case 'Anytime':
        return ANYTIME_QUERY
      case 'Upcoming':
        return UPCOMING_QUERY
      case 'Someday':
        return SOMEDAY_QUERY
      default:
        return INBOX_QUERY
    }
  }

  getTodos(listName: ListName): Todo[] {
    const query = this.getQuery(listName)

    const statement = this.database.prepare(query);

    const results: Todo[] = [];
    
    while (statement.step()) {
      const row = statement.getAsObject();
      results.push(this.toTodo(row));
    }

    statement.free();

    return results;
  }
}
