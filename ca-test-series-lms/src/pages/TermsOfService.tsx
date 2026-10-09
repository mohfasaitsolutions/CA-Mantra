import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => (
  <>
    <Navbar />
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="container max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-ca-primary mb-4">
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700">
                By accessing or using CA Mantraa, you agree to comply with and
                be bound by these Terms of Service. If you do not agree to these
                terms, please do not use our services.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">2. Eligibility</h2>
              <p className="text-gray-700">
                Our platform is intended for CA Foundation and Intermediate
                students. By registering, you confirm that you meet the
                eligibility and age requirements for using our services.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">3. Use of Services</h2>
              <p className="text-gray-700">
                You agree to use the platform for educational purposes only.
                Sharing, distributing, or reproducing study material, tests, or
                videos without permission is strictly prohibited.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">4. User Accounts</h2>
              <p className="text-gray-700">
                You are responsible for maintaining the security of your account
                credentials. Inform us immediately of any unauthorized use of
                your account.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                5. Payments and Refunds
              </h2>
              <p className="text-gray-700">
                Certain services may require payment. All transactions on paid
                test series are subject to our refund policy. Please review
                package details carefully before purchase.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                6. Intellectual Property
              </h2>
              <p className="text-gray-700">
                All content, including study material, tests, and analytics, is
                the property of CA Mantraa and its licensors. Unauthorized use
                is prohibited.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">7. Termination</h2>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that
                violate these terms, at our discretion, without prior notice.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                8. Changes to Terms
              </h2>
              <p className="text-gray-700">
                We may update these terms periodically. Continued use of our
                services after changes means you accept the revised terms.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, contact our support
                team at{" "}
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

export default TermsOfService;
