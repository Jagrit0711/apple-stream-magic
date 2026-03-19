import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from "react";

type Zone = "header" | "content";

interface TVNavContextType {
  zone: Zone;
  headerCol: number;
  focusedRow: number;
  focusedCol: number;
  isTV: boolean;
  registerRow: (rowIndex: number, itemCount: number) => void;
  unregisterRow: (rowIndex: number) => void;
  registerRowAction: (rowIndex: number, fn: (col: number) => void) => void;
  unregisterRowAction: (rowIndex: number) => void;
  getHeaderFocused: (idx: number) => boolean;
}

const HEADER_ITEMS = 5; // Home Movies TV Watchlist Search

const TVNavContext = createContext<TVNavContextType>({
  zone: "header",
  headerCol: 0,
  focusedRow: 0,
  focusedCol: 0,
  isTV: false,
  registerRow: () => {},
  unregisterRow: () => {},
  registerRowAction: () => {},
  unregisterRowAction: () => {},
  getHeaderFocused: () => false,
});

export const useTVNav = () => useContext(TVNavContext);

interface TVNavProviderProps {
  children: ReactNode;
  onHeaderSelect?: (idx: number) => void;
  onRowSelect?: (row: number, col: number) => void;   // fallback if no rowAction registered
}

export const TVNavProvider = ({ children, onHeaderSelect, onRowSelect }: TVNavProviderProps) => {
  const [isTV, setIsTV] = useState(() => {
    try { return localStorage.getItem("tv-mode") === "1"; } catch { return false; }
  });
  const [zone, setZone] = useState<Zone>("header");
  const [headerCol, setHeaderCol] = useState(0);
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);

  // rowIndex → item count (for boundary checks)
  const rowSizes = useRef<Map<number, number>>(new Map());
  // rowIndex → custom Enter handler (for hero, continue watching, etc.)
  const rowActions = useRef<Map<number, (col: number) => void>>(new Map());

  const registerRow = useCallback((rowIndex: number, itemCount: number) => {
    rowSizes.current.set(rowIndex, itemCount);
  }, []);
  const unregisterRow = useCallback((rowIndex: number) => {
    rowSizes.current.delete(rowIndex);
  }, []);
  const registerRowAction = useCallback((rowIndex: number, fn: (col: number) => void) => {
    rowActions.current.set(rowIndex, fn);
  }, []);
  const unregisterRowAction = useCallback((rowIndex: number) => {
    rowActions.current.delete(rowIndex);
  }, []);
  const getHeaderFocused = useCallback(
    (idx: number) => isTV && zone === "header" && headerCol === idx,
    [isTV, zone, headerCol],
  );

  const sortedRows = useCallback(
    () => Array.from(rowSizes.current.keys()).sort((a, b) => a - b),
    [],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isArrow = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key);

      if (isArrow) {
        setIsTV(true);
        try { localStorage.setItem("tv-mode","1"); } catch {}
      }

      // Let typing pass through — only intercept nav keys outside inputs
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";

      // Special case: Escape in input exits search overlay (handled by SearchOverlay itself)
      // Escape elsewhere returns to header
      if (e.key === "Escape" && !isInput) {
        setZone("header");
        return;
      }

      if (isInput) return; // Don't intercept arrows when typing

      // ── HEADER ZONE ──────────────────────────────────────────────────
      if (zone === "header") {
        if (e.key === "ArrowRight") { e.preventDefault(); setHeaderCol(c => Math.min(c + 1, HEADER_ITEMS - 1)); }
        if (e.key === "ArrowLeft")  { e.preventDefault(); setHeaderCol(c => Math.max(c - 1, 0)); }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const rows = sortedRows();
          if (rows.length > 0) {
            setZone("content");
            setFocusedRow(rows[0]);
            setFocusedCol(0);
          }
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onHeaderSelect?.(headerCol);
        }
        return;
      }

      // ── CONTENT ZONE ─────────────────────────────────────────────────
      if (zone === "content") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const rows = sortedRows();
          const idx = rows.indexOf(focusedRow);
          const next = rows[idx + 1];
          if (next !== undefined) {
            setFocusedRow(next);
            setFocusedCol(c => Math.min(c, (rowSizes.current.get(next) ?? 1) - 1));
          }
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const rows = sortedRows();
          const idx = rows.indexOf(focusedRow);
          if (idx === 0) {
            setZone("header");
          } else {
            const prev = rows[idx - 1];
            if (prev !== undefined) {
              setFocusedRow(prev);
              setFocusedCol(c => Math.min(c, (rowSizes.current.get(prev) ?? 1) - 1));
            }
          }
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const max = (rowSizes.current.get(focusedRow) ?? 1) - 1;
          setFocusedCol(c => Math.min(c + 1, max));
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setFocusedCol(c => Math.max(c - 1, 0));
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const customAction = rowActions.current.get(focusedRow);
          if (customAction) customAction(focusedCol);
          else onRowSelect?.(focusedRow, focusedCol);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [zone, headerCol, focusedRow, focusedCol, onHeaderSelect, onRowSelect, sortedRows]);

  return (
    <TVNavContext.Provider value={{
      zone, headerCol, focusedRow, focusedCol, isTV,
      registerRow, unregisterRow,
      registerRowAction, unregisterRowAction,
      getHeaderFocused,
    }}>
      {children}
    </TVNavContext.Provider>
  );
};
