export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="alert alert-error">{message}</div>;
}
