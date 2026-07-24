export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
      <p className="text-sm text-gray-500">Fleet analytics and reporting dashboard coming soon.</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Fuel Efficiency", "Driver Performance", "Delivery Metrics", "Maintenance Costs", "Utilization Report", "Cost Analysis"].map((r) => (
          <div key={r} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{r}</h3>
            <p className="text-xs text-gray-400">No data yet — connect your fleet to generate reports.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
