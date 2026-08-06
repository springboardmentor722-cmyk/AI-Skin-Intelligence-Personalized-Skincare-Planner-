function DashboardCard({
  title,
  value,
  icon,
  color,
  

}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 p-6">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-gray-500 text-sm font-medium">
            {title}
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mt-2">
            {value}
          </h2>

          <div className="flex items-center gap-2 mt-4">

            <p className="text-gray-500 text-sm mt-2">
  Live statistics
</p>

            

          </div>

        </div>

        <div
          className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white shadow-md`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export default DashboardCard;