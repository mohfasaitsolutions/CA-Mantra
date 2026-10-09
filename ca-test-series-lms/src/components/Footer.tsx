import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
} from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateAndScroll = (to: string) => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if (location.pathname === to) {
      scrollToTop();
      return;
    }

    navigate(to);
    scrollToTop();
    window.requestAnimationFrame(scrollToTop);
    window.setTimeout(scrollToTop, 0);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div>
            <Link to="/" className="flex flex-col items-start">
              <div className="bg-white p-2 rounded-md">
                <img
                  src="/camantralogo.jpg"
                  alt="CA Mantraa Logo"
                  className="h-10 w-auto"
                />
              </div>
            </Link>
            <p className="mt-4 text-gray-400">
              CA Mantraa is your trusted learning partner to help you excel in
              CA Foundation and Intermediate exams. We provide top-quality mock
              tests, actionable analytics, and handpicked study resources. Our
              mission is to support aspiring Chartered Accountants with
              guidance, tools, and a vibrant learning community.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/buy-now"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/buy-now");
                  }}
                >
                  Test Series
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/about");
                  }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/contact");
                  }}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/blogs"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/blogs");
                  }}
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {/* <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Help Center
                </a>
              </li> */}
              <li>
                <Link
                  to="/resources"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/resources");
                  }}
                >
                  Study Materials
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/faq");
                  }}
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/terms");
                  }}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateAndScroll("/privacy");
                  }}
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-gray-400" />
                <span className="text-gray-400">+91 80971 44319</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-gray-400" />
                <span className="text-gray-400">support@camantraa.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CA Mantraa. All rights reserved.
              version 2.0.2
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white text-sm"
                onClick={(event) => {
                  event.preventDefault();
                  navigateAndScroll("/terms");
                }}
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white text-sm"
                onClick={(event) => {
                  event.preventDefault();
                  navigateAndScroll("/privacy");
                }}
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
