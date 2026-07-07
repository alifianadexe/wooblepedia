import { useUI } from "../lib/i18n";

export function TakeawaysBox({ items }: { items: string[] }) {
  const ui = useUI();
  return (
    <div className="takeaways-box">
      <div className="takeaways-box__title">{ui.keyTakeaways}</div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
