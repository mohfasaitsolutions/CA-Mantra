import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  return (
    <section className="relative flex items-center justify-center min-h-screen py-20 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container mx-auto text-center">
        <Badge
          variant="outline"
          className="mb-6 bg-white border-ca-primary/30 text-ca-primary text-sm py-1 px-4"
        >
          India's #1 CA Test Platform
        </Badge>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CA Mantraa Test Series
          </span>
        </h1>

        <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
          India's first test platform with personalised guidance as per students preperation level.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/buy-now?level=FOUNDATION"
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg font-semibold px-6 py-3 text-lg rounded-lg hover:scale-[1.02] transition-transform"
          >
            CA Foundation
          </Link>
          <Link
            to="/buy-now?level=INTERMEDIATE"
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg font-semibold px-6 py-3 text-lg rounded-lg hover:scale-[1.02] transition-transform"
          >
            CA Intermediate
          </Link>
          <Link
            to="/buy-now?level=FINAL"
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg font-semibold px-6 py-3 text-lg rounded-lg hover:scale-[1.02] transition-transform"
          >
            CA Final
          </Link>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800">
            Where CA Dreams Turn Into Results.
          </h2>
          <p className="text-lg text-gray-600 mt-2">
            Thousands have trusted us. Now it’s your turn.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
