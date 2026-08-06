function RoutineCard({
    title,
    icon,
    items,
    completedSteps = [],
    routineType,
    onToggle,
}){
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-700 to-emerald-500 px-6 py-5 flex items-center gap-4">

        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
          {icon}
        </div>

        <div>

          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>

          <p className="text-green-100 text-sm">
            Your personalized skincare routine
          </p>

        </div>

      </div>

      {/* Content */}

      <div className="p-6">

        {items.length === 0 ? (

          <div className="text-center py-10">

            <div className="text-5xl mb-4">
              🌿
            </div>

            <p className="text-gray-500">
              No routine available.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {items.map((item, index) => (

              <div
                key={index}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-200 transition-all duration-300 p-4"
              >

                <div className="flex items-center gap-4">

                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">

<input
  type="checkbox"
  checked={completedSteps.some(step =>
    item.startsWith(step)
  )}
  onChange={(e) => {
    console.log("checked:", e.target.checked);

    onToggle(
      routineType,
      item,
      e.target.checked
    );
  }}
/>
</div>

                  <div>

                    <h3 className="font-semibold text-gray-800">
                      {item}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Recommended by AI
                    </p>

                  </div>

                </div>

                <span className="text-green-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                  →
                </span>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default RoutineCard;