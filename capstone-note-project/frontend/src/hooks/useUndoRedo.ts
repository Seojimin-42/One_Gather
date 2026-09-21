import { useCallback, useState } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

function isSame<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useUndoRedo<T>(initialState: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((value: SetStateAction<T>) => {
    setPresent((current) => {
      const next =
        typeof value === "function"
          ? (value as (prev: T) => T)(current)
          : value;

      if (isSame(current, next)) {
        return current;
      }

      setPast((prevPast) => [...prevPast, current]);
      setFuture([]);

      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];

      setFuture((prevFuture) => [present, ...prevFuture]);
      setPresent(previous);

      return prevPast.slice(0, prevPast.length - 1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];

      setPast((prevPast) => [...prevPast, present]);
      setPresent(next);

      return prevFuture.slice(1);
    });
  }, [present]);

  const reset = useCallback((newState: T) => {
    setPast([]);
    setPresent(newState);
    setFuture([]);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}