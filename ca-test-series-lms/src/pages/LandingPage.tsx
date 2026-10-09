import { Link } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import WhyChooseUsSection from "@/components/landing/WhyChooseUsSection";
import { useAuth } from "@/hooks/use-auth";

const LandingPage = () => {
  const { isLoggedIn, getDashboardPath } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <WhyChooseUsSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-accent">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Ace Your CA Exams?
          </h2>
          <p className="text-xl mb-8 opacity-80 max-w-2xl mx-auto">
            Join thousands of successful CA students who trust our platform for
            their exam preparation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link to={getDashboardPath()}>
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-gray-200 px-8 py-4 text-lg font-semibold"
                >
                  <User className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-gray-200 px-8 py-4 text-lg font-semibold"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link to="/buy-now">
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-gray-200 px-8 py-4 text-lg font-semibold"
              >
                Browse Test Series
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
