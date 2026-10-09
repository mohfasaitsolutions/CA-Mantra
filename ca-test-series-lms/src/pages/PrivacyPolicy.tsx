import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => (
  <>
    <Navbar />
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="container max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-ca-primary mb-4">
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2">
                1. Information We Collect
              </h2>
              <p className="text-gray-700">
                We collect information you provide during account registration,
                including name, email, and course details. We also gather
                analytical data regarding your use of our platform and
                performance analytics from tests.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                2. Use of Information
              </h2>
              <p className="text-gray-700">
                Your information helps us personalize your experience, provide
                relevant study materials, evaluate your answers, and communicate
                important platform updates.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                3. Sharing of Information
              </h2>
              <p className="text-gray-700">
                We do not sell or rent your personal information. Your data may
                be shared with CA evaluators and trusted partners for
                educational and technical purposes, and as required by law.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
              <p className="text-gray-700">
                We implement measures to protect your personal information and
                maintain platform security. However, no method of transmission
                over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">
                6. Children's Privacy
              </h2>
              <p className="text-gray-700">
                Our services are not directed at children under the age of 13.
                If you believe a child has provided us with information, please
                contact us.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                7. Changes to Privacy Policy
              </h2>
              <p className="text-gray-700">
                We may update this policy periodically. Continued use of our
                services constitutes acceptance of changes.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about our Privacy Policy or your data,
                contact us at{" "}
                <a
                  href="mailto:support@camantraa.com"
                  className="text-ca-primary underline"
                >
                  support@camantraa.com
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
    <Footer />
  </>
);

export default PrivacyPolicy;
