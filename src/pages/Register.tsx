import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, Lock, Mail, User, Phone, Hash, Building2, BadgeCheck, BookOpen } from 'lucide-react'; // Added BookOpen icon

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(''); // New state for course
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register, user } = useAuth();

  React.useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'student':
          navigate('/student');
          break;
        case 'staff':
          navigate('/staff');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/login');
      }
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Full Name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';
    if (!password.trim() || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!rollNo.trim()) newErrors.rollNo = 'Roll Number is required';
    if (!enrollmentNo.trim()) newErrors.enrollmentNo = 'Enrollment Number is required';
    if (!branch.trim()) newErrors.branch = 'Branch is required';
    if (!year.trim()) newErrors.year = 'Year is required';
    if (!phone.trim() || phone.length < 10 || phone.length > 15) newErrors.phone = 'Phone must be 10 to 15 digits';
    if (!course.trim()) newErrors.course = 'Course is required'; // New validation for course

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setErrors({});
    setIsLoading(true);

    if (!validate()) {
      setIsLoading(false);
      return;
    }

    try {
      await register({ name, email, password, rollNo, enrollmentNo, branch, year, phone, course }); // Pass course
      setSuccess(true);
      setName(''); setEmail(''); setPassword(''); setRollNo(''); setEnrollmentNo('');
      setBranch(''); setYear(''); setPhone(''); setCourse(''); // Clear course state
    } catch (err: any) {
      if (err.message && Array.isArray(err.message)) {
          const apiErrors: { [key: string]: string } = {};
          err.message.forEach((err: { msg: string; param: string }) => {
              if (err.param) {
                  apiErrors[err.param] = err.msg;
              } else {
                  setError(err.msg);
              }
          });
          setErrors(apiErrors);
      } else {
          setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <QrCode className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Student Sign Up</h2>
          <p className="mt-2 text-sm text-gray-600">Register your student account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 text-sm">
            Student registration submitted successfully. Please wait for admin approval.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Full Name" id="name" type="text" placeholder="John Doe"
            icon={<User className="h-5 w-5 text-gray-400" />} value={name} setValue={setName} error={errors.name}
            autoComplete="name" // Added autocomplete for name
          />
          <Field
            label="Email Address" id="email" type="email" placeholder="john.doe@example.com"
            icon={<Mail className="h-5 w-5 text-gray-400" />} value={email} setValue={setEmail} error={errors.email}
            autoComplete="email" // Added autocomplete for email
          />
          <Field
            label="Password" id="password" type="password" placeholder="••••••••"
            icon={<Lock className="h-5 w-5 text-gray-400" />} value={password} setValue={setPassword} error={errors.password}
            autoComplete="new-password" // Added autocomplete for new password
          />
          <Field
            label="Roll Number" id="rollNo" type="text" placeholder="2023CS001"
            icon={<Hash className="h-5 w-5 text-gray-400" />} value={rollNo} setValue={setRollNo} error={errors.rollNo}
          />
          <Field
            label="Enrollment Number" id="enrollmentNo" type="text" placeholder="ENR2023001"
            icon={<BadgeCheck className="h-5 w-5 text-gray-400" />} value={enrollmentNo} setValue={setEnrollmentNo} error={errors.enrollmentNo}
          />
          <Field
            label="Branch" id="branch" type="text" placeholder="Computer Science"
            icon={<Building2 className="h-5 w-5 text-gray-400" />} value={branch} setValue={setBranch} error={errors.branch}
          />
          <Field
            label="Year" id="year" type="text" placeholder="Second Year"
            icon={<User className="h-5 w-5 text-gray-400" />} value={year} setValue={setYear} error={errors.year}
          />
          <Field
            label="Phone Number" id="phone" type="tel" placeholder="9876543210"
            icon={<Phone className="h-5 w-5 text-gray-400" />} value={phone} setValue={setPhone} error={errors.phone}
            autoComplete="tel" // Added autocomplete for phone number
          />
          <Field // New field for Course
            label="Course" id="course" type="text" placeholder="B.Tech"
            icon={<BookOpen className="h-5 w-5 text-gray-400" />} value={course} setValue={setCourse} error={errors.course}
          />

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Reusable Field Component (keep this as is)
const Field = ({ label, id, value, setValue, icon, type, placeholder, error, autoComplete }: { // Added autoComplete prop
  label: string; id: string; value: string; setValue: (val: string) => void;
  icon: React.ReactNode; type: string; placeholder: string; error?: string; autoComplete?: string; // Added autoComplete prop
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        id={id} type={type} value={value} onChange={(e) => setValue(e.target.value)}
        className={`pl-10 block w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 py-2 px-3`}
        placeholder={placeholder} required
        autoComplete={autoComplete} // Passed autoComplete to input
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default Register;