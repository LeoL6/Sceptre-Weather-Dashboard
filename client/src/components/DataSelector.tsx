import { useState } from "react";

const WEATHER_TYPES = ["Temperature", "Rainfall", "Snowfall", "Dust", "Wind"];

export default function DataSelector({ onChange }: { onChange: (types: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (type: string) => {
    let updated: string[];
    if (selected.includes(type)) {
      updated = selected.filter((t) => t !== type);
    } else {
      updated = [...selected, type];
    }
    setSelected(updated);
    onChange(updated); // pass the selection to parent component
  };

  return (
    <div>
      {WEATHER_TYPES.map((type) => (
        <label key={type} style={{ padding: "3px"}}>
          <input
            type="checkbox"
            checked={selected.includes(type)}
            onChange={() => toggle(type)}
          />
          {type}
        </label>
      ))}
    </div>
  );
}
