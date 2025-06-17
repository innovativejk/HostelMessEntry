import React from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  TrendingUp,
  FileText,
  GraduationCap,
  Clock,
  IndianRupee,
  Utensils,
  ChevronRight,
  ShieldCheck, // For security/trust in features
  ReceiptText // For request management/billing
} from 'lucide-react';

const Homepage: React.FC = () => {
  // Key Features data (updated icons for variety)
  const features = [
    {
      icon: <QrCode className="w-16 h-16 text-emerald-500 mb-4" />,
      title: "QR-आधारित भोजन प्रवेश",
      description: "तेज और संपर्क-रहित भोजन ट्रैकिंग के लिए अपना अद्वितीय QR कोड स्कैन करें। सहज उपस्थिति और भोजन प्रबंधन का अनुभव करें।"
    },
    {
      icon: <TrendingUp className="w-16 h-16 text-orange-500 mb-4" />,
      title: "वास्तविक समय ट्रैकिंग",
      description: "तत्काल अपडेट और सूचनाओं के साथ उपस्थिति और लागत की निगरानी करें। दैनिक मेस संचालन में अंतर्दृष्टि प्राप्त करें।"
    },
    {
      icon: <ReceiptText className="w-16 h-16 text-sky-500 mb-4" />, // Changed icon
      title: "अनुरोध प्रबंधन",
      description: "स्वचालित अनुमोदन प्रणाली के साथ भोजन योजना अनुरोध सबमिट और ट्रैक करें। संचार और रिकॉर्ड-कीपिंग को सरल बनाएं।"
    },
    {
      icon: <ShieldCheck className="w-16 h-16 text-purple-500 mb-4" />, // New feature for security
      title: "उच्च सुरक्षा प्रोटोकॉल",
      description: "आपके डेटा और मेस एंट्री को धोखाधड़ी से बचाने के लिए उन्नत सुरक्षा उपायों का कार्यान्वयन।"
    },
    {
      icon: <Clock className="w-16 h-16 text-yellow-500 mb-4" />, // New feature for time efficiency
      title: "समय की बचत",
      description: "मैन्युअल प्रक्रियाओं को खत्म कर छात्रों और स्टाफ दोनों के लिए बहुमूल्य समय बचाता है।"
    },
    {
      icon: <IndianRupee className="w-16 h-16 text-red-500 mb-4" />, // New feature for cost
      title: "लागत दक्षता",
      description: "भोजन की बर्बादी को कम करके और सटीक रिकॉर्ड रखकर परिचालन लागत को नियंत्रित करता है।"
    }
  ];

  // Dashboard Stats (can be dynamically fetched from an API)
  const stats = [
    {
      value: "450+",
      label: "कुल छात्र",
      icon: <GraduationCap className="w-10 h-10 text-white" />
    },
    {
      value: "12",
      label: "लंबित अनुरोध",
      icon: <Clock className="w-10 h-10 text-white" />
    },
    {
      value: "₹15,240",
      label: "आज की लागत",
      icon: <IndianRupee className="w-10 h-10 text-white" />
    },
    {
      value: "3",
      label: "सक्रिय स्टाफ सदस्य",
      icon: <Utensils className="w-10 h-10 text-white" />
    }
  ];

  // How It Works steps
  const howItWorksSteps = [
    {
      step: 1,
      icon: <FileText className="w-12 h-12 text-teal-600 mb-4" />,
      title: "अनुरोध करें",
      description: "हमारे सहज डैशबोर्ड के माध्यम से आसानी से अपनी भोजन योजना का अनुरोध सबमिट करें। सरल और उपयोगकर्ता-अनुकूल।"
    },
    {
      step: 2,
      icon: <QrCode className="w-12 h-12 text-orange-600 mb-4" />,
      title: "QR कोड प्राप्त करें",
      description: "अनुमोदन के बाद, त्वरित भोजन पहुंच के लिए सीधे अपने डिवाइस पर अपना व्यक्तिगत QR कोड प्राप्त करें।"
    },
    {
      step: 3,
      icon: <Utensils className="w-12 h-12 text-sky-600 mb-4" />,
      title: "स्कैन करें और भोजन करें",
      description: "मेस प्रवेश द्वार पर बस अपना QR कोड स्कैन करें, और अपने स्वच्छ और स्वादिष्ट भोजन का आनंद लें।"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white shadow-lg py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 transition-all duration-300 ease-in-out">
        <Link to="/" className="text-3xl font-extrabold text-teal-700 flex items-center mb-4 md:mb-0">
          <span className="text-4xl mr-2 animate-pulse-slow">🍲</span> संतुष्टि भोजनालय
        </Link>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-lg">
          <Link to="#features" className="text-gray-700 hover:text-teal-600 font-medium transition duration-300">विशेषताएँ</Link>
          <Link to="#stats" className="text-gray-700 hover:text-teal-600 font-medium transition duration-300">डैशबोर्ड</Link>
          <Link to="#how-it-works" className="text-gray-700 hover:text-teal-600 font-medium transition duration-300">कैसे काम करता है</Link>
          <Link to="/login" className="text-teal-600 font-bold hover:text-teal-800 transition duration-300 px-4 py-2 rounded-lg">लॉगिन</Link>
          <Link to="/register" className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-600 transition duration-300 shadow-md transform hover:scale-105">रजिस्टर करें</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-600 to-emerald-800 text-white py-24 md:py-36 px-4 text-center relative overflow-hidden flex items-center justify-center min-h-[60vh]">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.1)"></circle>
            <circle cx="80" cy="50" r="25" fill="rgba(255,255,255,0.15)"></circle>
            <rect x="10" y="70" width="30" height="10" fill="rgba(255,255,255,0.08)" rx="3"></rect>
            <path d="M0 0 L100 0 L100 20 Q50 30 0 20 Z" fill="rgba(255,255,255,0.05)"></path>
          </svg>
        </div>
        <div className="max-w-5xl mx-auto relative z-10 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight drop-shadow-lg">
            संतुष्टि भोजनालय में आपका स्वागत है
          </h1>
          <p className="text-xl md:text-2xl mb-12 opacity-90 font-light">
            भोजन को ट्रैक करें, QR कोड स्कैन करें, और अनुरोधों को आसानी से प्रबंधित करें।
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in">
            <Link
              to="/login"
              className="bg-white text-teal-700 px-12 py-5 rounded-full font-bold text-lg hover:bg-gray-100 transition duration-300 shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              लॉगिन करें <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-white hover:text-teal-700 transition duration-300 shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              छात्र के रूप में रजिस्टर करें <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* QR Access Section */}
      <section className="bg-gray-50 py-16 md:py-28 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="p-6 bg-white rounded-3xl shadow-xl inline-block mb-8 animate-float">
            <QrCode className="w-32 h-32 text-orange-500 mx-auto transform rotate-3 hover:rotate-0 transition-transform duration-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
            QR कोड स्कैन कर प्रवेश करें
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            अपने भोजन प्रवेश को प्रबंधित करने का एक सरल, सुरक्षित और संपर्क रहित तरीका। बस एक त्वरित स्कैन, और आप भोजन के लिए तैयार हैं!
          </p>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="bg-gradient-to-br from-teal-50 to-emerald-100 py-16 md:py-32 px-4 relative">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-20">हमारी प्रमुख विशेषताएँ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition duration-500 transform hover:-translate-y-3 flex flex-col items-center text-center border-t-4 border-b-4 border-transparent hover:border-teal-500 animate-fade-in-delay"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="flex justify-center items-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview / Stats Section */}
      <section id="stats" className="py-16 md:py-32 px-4 bg-gray-50 relative overflow-hidden">
        {/* Diagonal background element */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-gray-100 transform -skew-y-3 origin-top-left -z-0"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-20">वास्तविक समय डैशबोर्ड अंतर्दृष्टि</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-teal-500 to-emerald-700 p-8 rounded-2xl shadow-2xl border border-teal-400 flex flex-col items-center justify-center text-center text-white transform hover:scale-105 transition duration-300 animate-float-up-delay"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center mb-4">
                  {stat.icon}
                  <span className="text-6xl font-extrabold ml-4 drop-shadow-md">{stat.value}</span>
                </div>
                <p className="text-xl md:text-2xl font-semibold opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-20">
            <Link
              to="/dashboard" // Assuming a dashboard route
              className="bg-orange-500 text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-orange-600 transition duration-300 shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto w-fit"
            >
              पूर्ण डैशबोर्ड देखें <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-16 md:py-28 px-4 relative">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-20">यह कैसे काम करता है: सरल कदम</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-2xl shadow-lg border-2 border-transparent hover:border-orange-400 transition-all duration-300 animate-fade-in-up-delay"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex justify-center items-center mb-6 w-24 h-24 rounded-full bg-white shadow-lg border-2 border-orange-400 text-orange-500 text-5xl font-extrabold">
                  {step.step}
                </div>
                <div className="flex justify-center mb-5">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 md:py-32 px-4 bg-gradient-to-br from-teal-700 to-emerald-900 text-white text-center relative overflow-hidden">
        {/* Background texture/pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="dot-pattern" width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="1" fill="rgba(255,255,255,0.2)" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-pattern)" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto relative z-10 animate-fade-in-delay">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight drop-shadow-lg">
            क्या आप अपने मेस प्रबंधन को सरल बनाने के लिए तैयार हैं?
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90 font-light">
            आज ही संतुष्टि भोजनालय से जुड़ें और अपने दैनिक मेस अनुभव को बेहतर बनाएं।
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              to="/login"
              className="bg-orange-400 text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-orange-500 transition duration-300 shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              अभी लॉगिन करें <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-white hover:text-teal-700 transition duration-300 shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              छात्र के रूप में रजिस्टर करें <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 relative">
        <div className="max-w-6xl mx-auto text-center md:flex md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="text-3xl font-extrabold flex items-center justify-center md:justify-start">
              <span className="text-4xl mr-2">🍲</span> संतुष्टि भोजनालय
            </Link>
            <p className="text-gray-400 mt-3 text-base">छात्रावास मेस प्रबंधन को सरल बनाना</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-lg">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition duration-300">गोपनीयता</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white transition duration-300">संपर्क</Link>
            <a href="https://github.com/innovativejk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white transition duration-300">हमारी वेबसाइट</a>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          © 2025 संतुष्टि मेस. सर्वाधिकार सुरक्षित।
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInDelayed {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse-slow {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          .animate-fade-in-up { animation: fadeIn 0.8s ease-out forwards; }
          .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
          .animate-fade-in-delay { animation: fadeInDelayed 0.8s ease-out forwards; opacity: 0; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-float-up-delay { animation: fadeIn 0.8s ease-out forwards; opacity: 0; } /* Reusing fadeIn for up effect */
          .animate-pulse-slow { animation: pulse-slow 3s infinite; }
        `}</style>
      </footer>
    </div>
  );
};

export default Homepage;
