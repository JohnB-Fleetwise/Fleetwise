export default function MaintenancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance</h1>
      <p className="text-sm text-gray-500">Vehicle maintenance scheduling and history.</p>
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Maintenance Alerts</h2>
            <p className="text-xs text-gray-500">2 vehicles need attention</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { vehicle: "Van Eta", issue: "Oil change overdue", date: "2026-06-15" },
            { vehicle: "Truck Iota", issue: "Brake inspection required", date: "2026-07-01" },
          ].map((alert, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{alert.vehicle}</p>
                <p className="text-xs text-gray-500">{alert.issue}</p>
              </div>
              <span className="text-xs text-gray-400">{alert.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
