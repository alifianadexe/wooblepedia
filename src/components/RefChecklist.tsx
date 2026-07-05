import { useState } from "react";
import { getReadRefs, setRefRead } from "../lib/storage";

export interface ReferenceItem {
  title: string;
  meta: string;
  url: string;
}

export function RefChecklist({ lessonKey, items }: { lessonKey: string; items: ReferenceItem[] }) {
  const [readMap, setReadMap] = useState(() => getReadRefs(lessonKey));
  return (
    <div className="ref-checklist">
      <div className="ref-checklist__title">REFERENCES — CHECK OFF AS YOU READ</div>
      {items.map((item, i) => (
        <label className="ref-item" key={i}>
          <input
            type="checkbox"
            checked={!!readMap[i]}
            onChange={(e) => setReadMap(setRefRead(lessonKey, i, e.target.checked))}
          />
          <span className="ref-item__body">
            <a className="ref-item__title" href={item.url} target="_blank" rel="noreferrer">
              {item.title}
            </a>
            <div className="ref-item__meta">{item.meta}</div>
          </span>
        </label>
      ))}
    </div>
  );
}
