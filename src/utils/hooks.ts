import { useEffect, useState } from "react";
import { ThingsDb, loadDatabase } from "./thingsDb";

export function useThingsDb(): [ThingsDb | undefined, Error | undefined] {
  const [db, setDb] = useState<ThingsDb>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const connect = async () => {
      try {
        setDb(await loadDatabase());
      } catch (err: any) {
        setError(new Error("Couldn't load Things database. Make sure you have Things installed."));
      }
    };
    connect();

    return () => db?.close();
  }, []);

  return [db, error];
}
