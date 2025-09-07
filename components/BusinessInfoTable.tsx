import React from 'react';
import type { BusinessInfo } from '../types';

interface BusinessInfoTableProps {
  data: BusinessInfo[];
}

export const BusinessInfoTable: React.FC<BusinessInfoTableProps> = ({ data }) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-slate-600 uppercase tracking-wider w-16">S.No.</th>
              <th className="p-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Business Name</th>
              <th className="p-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Address</th>
              <th className="p-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Contact Number</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((info, index) => (
              <tr key={index} className="odd:bg-white even:bg-slate-50">
                <td className="p-4 text-center font-medium text-slate-700">{index + 1}</td>
                <td className="p-4 font-medium text-slate-800 whitespace-normal break-words">{info.name}</td>
                <td className="p-4 text-slate-600 whitespace-normal break-words">{info.address}</td>
                <td className="p-4 text-slate-600 whitespace-normal break-words">{info.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};