import clsx from "clsx";

export default function Input({
  icon,
  rightIcon,
  className = "",
  ...props
}) {
  return (
    <div className="relative w-full">

      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}

      <input
        {...props}
        className={clsx(
          `
          w-full
          h-14
          rounded-2xl
          bg-white/80
          backdrop-blur-xl
          border
          border-gray-200
          pl-12
          pr-12
          text-gray-800
          placeholder:text-gray-400
          focus:outline-none
          focus:ring-2
          focus:ring-emerald-500
          focus:border-emerald-500
          transition-all
          duration-300
          shadow-sm
          `,
          className
        )}
      />

      {rightIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          {rightIcon}
        </div>
      )}

    </div>
  );
}