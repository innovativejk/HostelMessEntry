import React from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  TrendingUp,
  FileText,
  GraduationCap,
  Clock,
  IndianRupee,
  Utensils // Using Utensils from lucide-react now
} from 'lucide-react';

const Homepage: React.FC = () => {
  // Key Features data
  const features = [
    {
      icon: <QrCode className="w-12 h-12 text-blue-600 mb-4" />,
      title: "QR-based Meal Entry",
      description: "Scan your unique QR code for quick and contactless meal tracking. Experience seamless attendance and meal management."
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />,
      title: "Real-time Tracking",
      description: "Monitor attendance and costs with instant updates and notifications. Get insights into daily mess operations."
    },
    {
      icon: <FileText className="w-12 h-12 text-blue-600 mb-4" />,
      title: "Request Management",
      description: "Submit and track meal plan requests with an automated approval system. Simplify communication and record-keeping."
    }
  ];

  // Dashboard Stats (can be dynamically fetched from an API)
  const stats = [
    {
      value: "450+",
      label: "Total Students",
      icon: <GraduationCap className="w-8 h-8 text-blue-600" />
    },
    {
      value: "12",
      label: "Pending Requests",
      icon: <Clock className="w-8 h-8 text-blue-600" />
    },
    {
      value: "₹15,240",
      label: "Today's Cost",
      icon: <IndianRupee className="w-8 h-8 text-blue-600" />
    }
  ];

  // How It Works steps
  const howItWorksSteps = [
    {
      step: 1,
      icon: <FileText className="w-12 h-12 text-blue-600 mb-4" />,
      title: "Request",
      description: "Submit your meal plan request conveniently through our intuitive dashboard. Easy and user-friendly."
    },
    {
      step: 2,
      icon: <QrCode className="w-12 h-12 text-blue-600 mb-4" />,
      title: "QR Code",
      description: "Upon approval, receive your personalized QR code directly on your device for quick meal access."
    },
    {
      step: 3,
      icon: <Utensils className="w-12 h-12 text-blue-600 mb-4" />, // Now using Utensils icon
      title: "Scan & Eat",
      description: "Simply scan your QR code at the mess entrance, and enjoy your hygienic and delicious meal."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar - Assuming this would be a separate component for reusability */}
      <nav className="bg-white shadow-md py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50">
        <Link to="/" className="text-2xl font-bold text-blue-800 flex items-center mb-4 md:mb-0">
          {/* Consider a proper SVG logo here for better scalability */}
          <span className="text-3xl mr-2">🍲</span> Santushti Bhojnalay
        </Link>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-lg">
          <Link to="#features" className="text-gray-700 hover:text-blue-600 transition duration-300">Features</Link>
          <Link to="#stats" className="text-gray-700 hover:text-blue-600 transition duration-300">Stats</Link>
          <Link to="#how-it-works" className="text-gray-700 hover:text-blue-600 transition duration-300">How It Works</Link>
          <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 transition duration-300">Login</Link>
          <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 md:py-32 px-4 text-center relative overflow-hidden">
        {/* Background animation elements could be added here */}
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight animate-fade-in-down">
            Welcome to Santushti Bhojnalay
          </h1>
          <p className="text-xl md:text-2xl mb-10 opacity-90 animate-fade-in-up">
            Track meals, scan QR codes, and manage requests easily.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5 animate-fade-in">
            <Link
              to="/login"
              className="bg-white text-blue-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-100 transition duration-300 shadow-xl transform hover:scale-105"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-700 transition duration-300 shadow-xl transform hover:scale-105"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* QR Access Section */}
      <section className="bg-white py-16 md:py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <QrCode className="w-28 h-28 text-blue-600 mx-auto mb-8 animate-bounce-slow" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Scan QR to Access</h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            A simple, secure, and touchless way to manage your meal entries. Just a quick scan, and you're good to go!
          </p>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="bg-gradient-to-r from-blue-50 to-blue-100 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
              >
                <div className="flex justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview / Stats Section */}
      <section id="stats" className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-16">Real-time Dashboard Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl shadow-xl border border-blue-200 flex flex-col items-center justify-center text-center transform hover:scale-105 transition duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  {stat.icon}
                  <span className="text-5xl font-extrabold text-blue-700 ml-4">{stat.value}</span>
                </div>
                <p className="text-xl md:text-2xl text-gray-700 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-20">
            <Link
              to="/dashboard" // Assuming a dashboard route
              className="bg-blue-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-blue-700 transition duration-300 shadow-xl transform hover:scale-105"
            >
              View Full Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-100 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-16">How It Works: Simple Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center"
              >
                <div className="flex justify-center items-center mb-6 text-blue-600 text-6xl font-extrabold bg-blue-100 rounded-full w-20 h-20 leading-none">
                  {step.step}
                </div>
                <div className="flex justify-center mb-5">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-blue-700 to-blue-900 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
            Ready to Simplify Your Mess Management?
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90">
            Join Santushti Bhojnalay today and transform your daily mess experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <Link
              to="/login"
              className="bg-white text-blue-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-100 transition duration-300 shadow-xl transform hover:scale-105"
            >
              Login Now
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-700 transition duration-300 shadow-xl transform hover:scale-105"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center md:flex md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="text-2xl font-bold flex items-center justify-center md:justify-start">
              <span className="text-3xl mr-2">🍲</span> Santushti Bhojnalay
            </Link>
            <p className="text-gray-400 mt-2">Simplifying hostel mess management</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-lg">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition duration-300">Privacy</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white transition duration-300">Contact</Link>
            <a href="https://github.com/innovativejk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white transition duration-300">Our Website</a> {/* Changed to # for now */}
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          © 2025 Santushti Mess. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Homepage;