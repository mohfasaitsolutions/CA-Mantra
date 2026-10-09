import {
  Layers,
  Target,
  TrendingUp,
  BookCopy,
  BarChart,
  UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Comprehensive Coverage Across All Levels",
    description:
      "Your ICAI Success Starts Here — Foundation, Inter & Final Covered! Experience expertly designed Subjective & Objective Test Series that reflect the latest ICAI pattern.",
    color: "blue",
  },
  {
    icon: Target,
    title: "Goal Oriented Test Plans",
    description:
      "Our test series are designed with your end goal in mind — to clear ICAI exams in the 1st attempt. Stay focused, stay ahead.",
    color: "green",
  },
  {
    icon: TrendingUp,
    title: "95% Success Rate",
    description:
      "Join thousands of CA students who’ve cracked their exams with our high-conversion success strategy. You could be next!",
    color: "purple",
  },
  {
    icon: BookCopy,
    title: "Flexible & ICAI-Pattern Test Series",
    description:
      "Practice with a wide range of Subjective and MCQ-style mocks designed to reflect the real ICAI exam environment. Whether it’s chapter-wise, full syllabus, or focused revision tests, we’ve got every format you need to excel.",
    color: "yellow",
  },
  {
    icon: BarChart,
    title: "Performance Analytics",
    description:
      "Track your progress with detailed analytics, performance insights, and personalized study recommendations.",
    color: "red",
  },
  {
    icon: UserCheck,
    title: "1:1 Mentorship & Expert Counseling",
    description:
      "Facing mental blocks or exam pressure? We provide personalized mentorship and mental wellness support to keep you motivated and balanced.",
    color: "indigo",
  },
];

const iconColors = {
  blue: "text-primary bg-primary/10",
  green: "text-green-600 bg-green-100",
  purple: "text-accent bg-accent/10",
  yellow: "text-yellow-600 bg-yellow-100",
  red: "text-red-600 bg-red-100",
  indigo: "text-primary bg-primary/10",
};

const WhyChooseUsSection = () => {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Why Choose CA Mantraa?
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We're more than a test series; we're your success partner. Our
            platform mirrors the ICAI exam pattern with remarkable accuracy,
            providing personalized support and a proven system to help you clear
            your exams in the next attempt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-white rounded-xl border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <CardContent className="p-0">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${iconColors[feature.color as keyof typeof iconColors]
                      }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
