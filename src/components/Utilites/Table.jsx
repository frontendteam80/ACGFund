import React from 'react';
import { Eye } from 'lucide-react';
import './Table.css';

export default function Table({ columns, data, onDetails, showDetailsColumn }) {
  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{col}</th>)}
            {showDetailsColumn && <th>Details</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx}>
              {columns.map(col => <td key={col}>{row[col] ?? ''}</td>)}
              {showDetailsColumn && (
                <td style={{ textAlign: 'left' }}>
                  <button
                    className="details-btn"
                    onClick={() => onDetails(row)}
                    type="button"
                    aria-label="View Details"
                  >
                    <Eye size={20} color="#486488"  />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
