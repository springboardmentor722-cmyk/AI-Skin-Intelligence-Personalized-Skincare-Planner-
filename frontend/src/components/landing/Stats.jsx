import { FaUsers, FaRobot, FaHeartbeat, FaShieldAlt } from "react-icons/fa";

function Stats() {
  const stats = [
    {
      icon: <FaUsers />,
      value: "15K+",
      title: "Happy Users",
    },
    {
      icon: <FaRobot />,
      value: "98%",
      title: "AI Accuracy",
    },
    {
      icon: <FaHeartbeat />,
      value: "24/7",
      title: "Skin Monitoring",
    },
    {
      icon: <FaShieldAlt />,
      value: "100%",
      title: "Secure Data",
    },
  ];

  return (
    <section className="stats-section">
      <div className="stats-container">
        {stats.map((item, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-icon">{item.icon}</div>
            <h2>{item.value}</h2>
            <p>{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;