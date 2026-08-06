import React from "react";
import { Link } from "react-router-dom";

export default function FooterLinks() {
  return (
    <div className="text-center text-xs sm:text-sm font-medium text-slate-500 pt-6">
      <span>New to Skin Intelligence? </span>
      <Link
        to="/register"
        className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors ml-1 cursor-pointer"
      >
        Create an Account
      </Link>
    </div>
  );
}
