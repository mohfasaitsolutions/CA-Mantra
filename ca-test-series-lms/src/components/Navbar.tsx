import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navLinkClass =
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50";
const mobileNavLinkClass = "py-2 px-3 rounded-md hover:bg-gray-100 block";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, getDashboardPath, user } = useAuth();

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/buy-now", label: "Buy Now" },
    { to: "/resources", label: "Resources" },
    { to: "/blogs", label: "Blogs" },
    { to: "/schedule", label: "Schedule" },
    { to: "/faq", label: "FAQs" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/camantralogo.jpg"
              alt="CA Mantraa Logo"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} className={cn(navLinkClass)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {isLoggedIn ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <Link to={getDashboardPath()}>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-primary to-accent">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t animate-in slide-in-from-top-5 fade-in duration-300 absolute w-full shadow-lg z-20">
          <div className="container px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(mobileNavLinkClass, "text-gray-700 hover:text-primary transition-colors")}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2 border-gray-100" />
              <div className="flex flex-col space-y-3 pt-2">
                {isLoggedIn ? (
                  <>
                    <div className="text-sm font-medium text-gray-900 px-3">
                      Welcome, <span className="text-primary">{user?.name}</span>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full bg-gradient-to-r from-primary to-accent shadow-md">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link
                      to="/register"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full bg-gradient-to-r from-primary to-accent">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
