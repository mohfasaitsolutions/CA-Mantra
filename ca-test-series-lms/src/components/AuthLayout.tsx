import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookCopy, BarChart, UserCheck } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  type: "login" | "register";
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  type,
}) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-accent p-12 text-white flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <img
                src="/camantralogo.jpg"
                alt="CA Mantraa Logo"
                className="h-8 w-auto"
              />
            </div>
          </Link>

          <div className="mt-24">
            <h1 className="text-3xl font-bold mb-6">
              Your Gateway to CA Success
            </h1>
            <p className="text-xl opacity-90">
              Join thousands of students excelling with CA Mantraa's realistic
              test series and expert guidance.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <BookCopy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">ICAI-Pattern Tests</h3>
              <p className="text-sm opacity-80">
                Practice with mocks that mirror the official exam format.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <BarChart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Personalized Analytics</h3>
              <p className="text-sm opacity-80">
                Identify your strengths and weaknesses with our in-depth
                reports.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Expert Mentorship</h3>
              <p className="text-sm opacity-80">
                Get guidance and support from experienced CA professionals.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:hidden">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-primary to-accent rounded-full p-3 shadow-lg">
                <img
                  src="/camantralogo.jpg"
                  alt="CA Mantraa Logo"
                  className="h-10 w-auto"
                />
              </div>
            </div>
          </div>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {children}

          <div className="mt-8 text-center text-sm">
            {type === "login" ? (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-ca-primary font-medium hover:underline"
                >
                  Register
                </Link>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-ca-primary font-medium hover:underline"
                >
                  Log in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
