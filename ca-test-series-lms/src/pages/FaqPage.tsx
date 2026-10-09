import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle } from "lucide-react";
import { TEXT_COLORS } from "@/constants/colors";

const faqs = [
  {
    question: "What is CA Mantraa Test Series?",
    answer:
      "CA Mantraa is an online platform offering ICAI-pattern mock test series for CA Foundation, Inter, and Final. We provide both Subjective and Objective (MCQ) tests, chapter-wise and full syllabus, to help you prepare thoroughly and confidently.",
  },
  {
    question: "How are the test papers designed?",
    answer:
      "Our test papers are curated by qualified Chartered Accountants and subject experts. They follow the latest ICAI pattern, including updated weightage, question formats, and expected difficulty level.",
  },
  {
    question: "Do you provide evaluation and feedback?",
    answer:
      "Yes! Every subjective test is evaluated by professionals, and detailed feedback is provided within a few days. This includes marking schemes, improvement tips, and rectification of conceptual errors.",
  },
  {
    question: "Are MCQ-based tests included?",
    answer:
      "Absolutely. Our Foundation, Inter and Final level tests include MCQ-based exams for subjects with objective-type questions. These are auto-evaluated with instant scoring.",
  },
  {
    question: "What types of test plans are available?",
    answer:
      "We offer: Chapter-wise Test Series, Full Syllabus Mock Exams, Detailed Revision Batches, Pass Guarantee Success Plans. You can choose as per your preparation level.",
  },
  {
    question: "What is the success rate of CA Mantraa students?",
    answer:
      "We're proud to have a 95%+ success rate among students who followed our structured test plan with dedication.",
  },
  {
    question: "How do I register?",
    answer:
      "Click on the “Register Now” button on our homepage. Choose your course level, select a test plan, and you’re all set to begin!",
  },
  {
    question: "Do you provide mentorship or guidance?",
    answer:
      "Yes! We offer 1-on-1 mentorship, performance tracking, and doubt-solving support to guide you throughout your CA journey.",
  },
  {
    question: "Is this suitable for repeaters?",
    answer:
      "Definitely. We have special test plans for repeaters and working students, helping them focus on key areas and boost their scores strategically.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach out to us through the Contact page or via WhatsApp support available on the website for quick help.",
  },
];

const FaqPage = () => {
  const renderAnswer = (answer: string) => {
    if (answer.startsWith("We offer:")) {
      const parts = answer.split(", ");
      const listItems = parts.slice(1);
      listItems[0] = listItems[0].replace(
        "Chapter-wise Test Series",
        "Chapter-wise Test Series"
      );
      const lastPart = listItems.pop()!.split(". ");
      listItems.push(lastPart[0]);
      const restOfString = lastPart[1];

      return (
        <div>
          <p>We offer:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {listItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="mt-2">{restOfString}</p>
        </div>
      );
    }
    if (answer.startsWith("Yes!")) {
      return (
        <div className="flex items-start gap-2">
          <CheckCircle className={`h-5 w-5 ${TEXT_COLORS.SUCCESS} mt-1 shrink-0`} />
          <span>{answer.substring(4)}</span>
        </div>
      );
    }
    return answer;
  };

  return (
    <div className="bg-white">
      <Navbar />
      <main className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
          </div>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-lg text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">
                    {renderAnswer(faq.answer)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FaqPage;
