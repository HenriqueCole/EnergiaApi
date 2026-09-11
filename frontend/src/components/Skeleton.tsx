import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, radius = 8, style }: SkeletonProps) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function StatGridSkeleton() {
  return (
    <div className="stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat card">
          <Skeleton width={40} height={40} radius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="60%" height={26} />
          <Skeleton width="80%" height={13} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  const heights = [40, 65, 50, 80, 55, 72, 45, 60, 70, 50, 85, 58];
  return (
    <div className="chart">
      {heights.map((h, i) => (
        <div key={i} className="bar">
          <Skeleton width="100%" height={`${h}%`} radius={8} style={{ maxWidth: 34 }} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="alist">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="alert" style={{ ["--bar" as string]: "var(--skel)" }}>
          <Skeleton width={40} height={40} radius={12} />
          <div style={{ flex: 1 }}>
            <Skeleton width="35%" height={11} />
            <Skeleton width="75%" height={16} style={{ marginTop: 8 }} />
            <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <Skeleton width={c === 0 ? "40%" : c === cols - 1 ? "55%" : "70%"} height={14} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
