import React from 'react';
import { Package, DollarSign, ListOrdered, Users, ArrowUpRight, Filter, Search, MoreVertical } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">Products Sold</h3>
            <p className="text-slate-400 text-xs mb-4">Number of items sold</p>
            <p className="text-2xl font-bold text-slate-800">16</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Package size={20} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">Total Sales</h3>
            <p className="text-slate-400 text-xs mb-4">Cumulative sales revenue</p>
            <p className="text-2xl font-bold text-slate-800">$ 5000</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">Monthly Sales</h3>
            <p className="text-slate-400 text-xs mb-4">Sales generated</p>
            <p className="text-2xl font-bold text-slate-800">$ 670</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
            <ListOrdered size={20} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-slate-800 font-semibold mb-1">Total Customers</h3>
            <p className="text-slate-400 text-xs mb-4">Customers acquired</p>
            <p className="text-2xl font-bold text-slate-800">5</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Welcome Card */}
          <div className="bg-blue-50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h3>
            <h3 className="text-xl font-bold text-slate-800">Admin</h3>
            <div className="mt-8">
              <div className="w-32 h-20 opacity-0"></div> {/* Spacer for image if needed */}
            </div>
          </div>

          {/* Monthly Earnings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-slate-800 font-semibold">Monthly Earnings</h3>
              <div className="w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center text-white">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-2">$670</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-teal-500 text-xs font-semibold bg-teal-50 px-2 py-1 rounded">
                <ArrowUpRight size={14} className="mr-1" /> 14.68%
              </div>
              <span className="text-slate-400 text-xs">last month</span>
            </div>
          </div>
        </div>

        {/* Right Column - Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-800 font-semibold">Sales Overview</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 8 Months</option>
              <option>This Year</option>
            </select>
          </div>
          
          {/* Mock Chart Area */}
          <div className="flex-grow flex items-end justify-between px-2 pt-10 pb-4 relative min-h-[200px]">
            {/* Chart Bars */}
            {[45, 50, 60, 48, 55, 62, 43, 58].map((val, i) => (
              <div key={i} className="flex gap-1.5 items-end h-full">
                <div className="w-3 bg-blue-600 rounded-t-sm" style={{ height: `${val}%` }}></div>
                <div className="w-3 bg-cyan-400 rounded-t-sm" style={{ height: `${val + 10}%` }}></div>
              </div>
            ))}
          </div>
          {/* X Axis Labels */}
          <div className="flex justify-between px-2 text-xs text-slate-400 mt-2">
            <span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
          </div>
        </div>
      </div>

      {/* Bottom Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
          <h3 className="text-slate-800 font-semibold">Total Orders</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Filter size={16} /> Filter
            </button>
            <div className="relative flex-grow sm:flex-grow-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search order here..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="font-semibold p-4">Id</th>
                <th className="font-semibold p-4">Product</th>
                <th className="font-semibold p-4">Customer</th>
                <th className="font-semibold p-4">Quantity</th>
                <th className="font-semibold p-4">Status</th>
                <th className="font-semibold p-4">Price</th>
                <th className="font-semibold p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="p-4 text-slate-600 text-sm">1</td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-800">UltraSoft Premium Cooling</div>
                  <div className="text-xs text-slate-500">Memory Foam Pillow Set</div>
                </td>
                <td className="p-4 text-slate-600 text-sm">Mark Johnson</td>
                <td className="p-4 text-slate-600 text-sm">2</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">pending</span>
                </td>
                <td className="p-4 text-slate-800 font-semibold text-sm">$120.00</td>
                <td className="p-4 text-slate-400">
                  <button className="hover:text-slate-600 transition"><MoreVertical size={16} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
