import AdminSignInForm from "../../components/auth/AdminSignInForm";
import { FaChartLine, FaUsers, FaTrophy } from "react-icons/fa";

export default function AdminSignIn() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <AdminSignInForm />
        </div>
      </div>

      {/* Right Side - Branding Panel */}
      <div className="relative hidden w-1/2 lg:flex items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 dark:from-brand-600 dark:via-brand-700 dark:to-brand-800">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-8">
          {/* Logo/Brand Name */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-2 tracking-tight">
              Tipst<span className="text-yellow-300">⭐</span>rs
            </h1>
            <div className="h-1 w-24 bg-yellow-300 mx-auto rounded-full"></div>
          </div>

          {/* Tagline */}
          <p className="text-xl mb-12 text-white/90 font-medium">
            Soccer Prediction Platform
          </p>
          <p className="text-lg mb-16 text-white/80">
            Manage tipsters, predictions, and customers with ease
          </p>

          {/* Feature Icons */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm mb-3">
                <FaChartLine className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Analytics</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm mb-3">
                <FaUsers className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Management</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm mb-3">
                <FaTrophy className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Predictions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
