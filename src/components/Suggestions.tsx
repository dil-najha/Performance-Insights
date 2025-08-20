import React from 'react';

export default function Suggestions({ tips }: { tips: string[] }) {
  if (!tips.length) return null;
  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body">
        <h3 className="card-title">How to improve</h3>
        <ul className="list-disc ml-6 space-y-1">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
