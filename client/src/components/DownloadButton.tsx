import React from "react";

interface DownloadButtonProps {
  data: Record<string, number[]> | null;
  lat: number;
  lon: number;
  date: string;
  loading: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ data, lat, lon, date, loading }) => {
  const downloadCSV = () => {
    if (!data) return;

    const headers = ["Hour", ...Object.keys(data)];
    const rows: string[] = [];

    for (let i = 0; i < 24; i++) {
      const row = [i];
      for (const key of Object.keys(data)) {
        row.push(data[key]?.[i] ?? "");
      }
      rows.push(row.join(","));
    }

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Weather_Report_(${lat.toFixed(2)}, ${lon.toFixed(2)})_${date}.csv`;
    link.click();
  };

  return (
    <button
        className="download-button"
        onClick={downloadCSV}
        disabled={!data}
        style={{
            opacity: !data || loading ? 0.6 : 1, 
            cursor: !data || loading ? "not-allowed" : "pointer",
            }}
        title={!data ? "No Data to Download" : ""}
    >
      Download
    </button>
  );
};

export default DownloadButton;
