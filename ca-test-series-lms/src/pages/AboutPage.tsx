
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        <section className="ca-gradient text-white py-16">
          <div className="content-container text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Comprehensive CA MCQ test series designed to help students excel in their exams.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="content-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-gray-700 mb-4">
                  Our mission is to provide high-quality test series for CA Foundation and Intermediate students,
                  helping them prepare effectively for their exams through comprehensive practice materials and
                  detailed evaluations.
                </p>
                <p className="text-gray-700">
                  We believe that practice is key to success in CA exams, and our platform is designed to give
                  students the tools they need to practice effectively and track their progress.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Our Team</h2>
                <p className="text-gray-700 mb-4">
                  Our team consists of experienced CA professionals and educators who understand the challenges
                  of CA exams and are committed to helping students overcome them.
                </p>
                <p className="text-gray-700">
                  With years of experience in teaching and evaluating CA students, our team has developed test
                  series that closely mirror the actual exam pattern and difficulty level.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Our Approach</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ca-card">
                  <h3 className="text-lg font-semibold mb-2">Comprehensive Coverage</h3>
                  <p className="text-gray-700">
                    Our test series cover all important topics and concepts tested in CA exams,
                    ensuring that students are well-prepared for all aspects of the curriculum.
                  </p>
                </div>

                <div className="ca-card">
                  <h3 className="text-lg font-semibold mb-2">Expert Evaluation</h3>
                  <p className="text-gray-700">
                    All answer sheets are evaluated by experienced professionals who provide
                    detailed feedback to help students improve their performance.
                  </p>
                </div>

                <div className="ca-card">
                  <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
                  <p className="text-gray-700">
                    Our platform provides detailed analytics to help students track their progress,
                    identify areas of improvement, and compare their performance with peers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
