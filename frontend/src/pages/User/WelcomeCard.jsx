function WelcomeCard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg text-white p-8">

      <h1 className="text-3xl font-bold">
        👋 {greeting}, {user?.name || "User"}
      </h1>

      <p className="mt-2 text-green-100">
        Welcome back to AI Skin Intelligence
      </p>

      <div className="mt-6 flex gap-8">

        <div>
          <p className="text-sm opacity-80">Role</p>
          <h2 className="text-xl font-semibold">
            {user?.role}
          </h2>
        </div>

        <div>
          <p className="text-sm opacity-80">Status</p>
          <h2 className="text-xl font-semibold">
            Active
          </h2>
        </div>

      </div>

    </div>
  );
}

export default WelcomeCard;