import React, { useState } from 'react';
import {
    User, Mail, Lock, BadgeIndianRupee, Eye, EyeOff, Sun, Moon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ROLES = [
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'hod', label: 'HOD' },
    { value: 'dean', label: 'Dean' },
    { value: 'principal', label: 'Principal' },
    { value: 'admin', label: 'Admin' },
];

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EEE'];
const YEARS = ['1', '2', '3', '4'];

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [regRole, setRegRole] = useState('student');

    const [loginId, setLoginId] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [step, setStep] = useState(1);

    const [regName, setRegName] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

        const navigate = useNavigate();
        const { isDark, toggleTheme } = useTheme();

    const fieldClass =
        'w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm ' +
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition';

    const isCollegeEmail = (email) => email.trim().toLowerCase().endsWith('@mountzion.ac.in');

    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!regName.trim()) return 'Please enter your full name.';
            if (regRole === 'student' && !regNumber.trim()) return 'Register number is required.';
            if (['faculty', 'dean', 'principal', 'admin'].includes(regRole) && !facultyId.trim())
                return 'Staff / Official ID is required.';
            if (['student', 'faculty', 'hod'].includes(regRole) && !department)
                return 'Please select a department.';
            if (regRole === 'student' && !year) return 'Please select a year.';
        }
        if (currentStep === 2) {
            if (!regEmail.trim()) return 'College email is required.';
            if (regRole === 'student' && !isCollegeEmail(regEmail))
                return 'Students must use a valid @mountzion.ac.in email address.';
            if (!regPassword) return 'Password is required.';
            if (regPassword !== confirmPassword) return 'Passwords do not match!';
        }
        return '';
    };

    const handleNext = () => {
        const msg = validateStep(1);
        if (msg) { setError(msg); return; }
        setError(''); setSuccess('');
        setStep(2);
    };

    const handleBack = () => { setError(''); setStep(1); };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post('login/', {
                email: loginId.trim(),
                password: loginPassword,
            });
            const data = response.data;
            const userRole = data.user.role;

            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            localStorage.setItem('campusUser', JSON.stringify({
                token: data.access,
                role: userRole,
                name: (data['user'] && data['user']['name']) || '',
            }));

            const route = {
                admin: '/admin/dashboard', superuser: '/admin/dashboard',
                staff: '/faculty/dashboard', faculty: '/faculty/dashboard',
                hod: '/hod/dashboard', dean: '/dean/dashboard',
                principal: '/principal/dashboard', student: '/student/dashboard',
            }[userRole.toLowerCase()];
            if (route) navigate(route);
            else setError('Role not recognized.');
        } catch (err) {
            setError(
                (err.response && err.response.data && err.response.data.error) ||
                'Invalid credentials. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (regPassword !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }
        if (regRole === 'student' && !regEmail.endsWith('@mountzion.ac.in')) {
            setError('Students must use a valid @mountzion.ac.in email address.');
            return;
        }
        setLoading(true);
        try {
            const payload = { role: regRole, email: regEmail, password: regPassword, name: regName };
            if (regRole === 'student') {
                payload.register_number = regNumber;
                payload.department = department;
                payload.year = year;
            }
            if (['faculty', 'dean', 'principal', 'admin'].includes(regRole)) payload.faculty_id = facultyId;
            if (['faculty', 'hod'].includes(regRole)) payload.department = department;

            await api.post('auth/register/', payload);
            setSuccess('Registration successful! You can now log in.');
            setIsLogin(true);
            setRegPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(
                (err.response && err.response.data && err.response.data.error) ||
                'Failed to register. Email may already be in use.'
            );
        } finally {
            setLoading(false);
        }
    };

    const inputIcon = (Icon) => (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
        </span>
    );

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
            {/* Blurred background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('/login-bg.jpg')",
                    filter: 'blur(16px)',
                    transform: 'scale(1.1)',
                }}
            />
            {/* Overlay to keep the card readable */}
            <div className="absolute inset-0 bg-slate-900/40" />

            {/* Theme toggle */}
            <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm backdrop-blur transition"
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-6">
                   <img 
    src="https://tse3.mm.bing.net/th/id/OIP.9q_A-XpQXjaQZbSD724AtAAAAA?r=0&pid=Api&P=0&h=180" 
    alt="College Logo" 
    className="h-12 w-12 rounded-full object-cover" 
/>                    <h1 className="text-2xl font-extrabold text-slate-800 mt-4">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isLogin ? 'Sign in to your portal' : 'Join the Smart Campus Portal'}
                    </p>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                    {['login', 'register'].map((t) => (
                        <button
                            key={t}
                            onClick={() => { setIsLogin(t === 'login'); setError(''); setSuccess(''); setStep(1); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                                (isLogin ? 'login' : 'register') === t
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium border border-rose-100">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
                        {success}
                    </div>
                )}

                {isLogin ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="relative">
                            {inputIcon(User)}
                            <input
                                type="text" placeholder="Username / Specific ID" required
                                value={loginId} onChange={(e) => setLoginId(e.target.value)}
                                className={fieldClass}
                            />
                        </div>
                        <div className="relative">
                            {inputIcon(Lock)}
                            <input
                                type={showPassword ? 'text' : 'password'} placeholder="Password" required
                                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                                className={fieldClass}
                            />
                            <button
                                type="button" onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-60"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-2">
                            {[1, 2].map((s) => (
                                <div key={s} className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className={`h-full transition-all duration-300 ${step >= s ? 'bg-indigo-600 w-full' : 'w-0'}`} />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mb-2">
                            Step {step} of 2 · {step === 1 ? 'Your Identity' : 'Account Credentials'}
                        </p>

                        {step === 1 && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">I am a</label>
                                    <select
                                        value={regRole} onChange={(e) => setRegRole(e.target.value)}
                                        className={fieldClass}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    {inputIcon(User)}
                                    <input type="text" placeholder="Full Name" value={regName}
                                        onChange={(e) => setRegName(e.target.value)} className={fieldClass} />
                                </div>

                                {regRole === 'student' && (
                                    <div className="relative">
                                        {inputIcon(BadgeIndianRupee)}
                                        <input type="text" placeholder="Register Number" value={regNumber}
                                            onChange={(e) => setRegNumber(e.target.value)} className={fieldClass} />
                                    </div>
                                )}

                                {['faculty', 'dean', 'principal', 'admin'].includes(regRole) && (
                                    <div className="relative">
                                        {inputIcon(BadgeIndianRupee)}
                                        <input type="text" placeholder="Staff / Official ID" value={facultyId}
                                            onChange={(e) => setFacultyId(e.target.value)} className={fieldClass} />
                                    </div>
                                )}

                                {['student', 'faculty', 'hod'].includes(regRole) && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                                        <select value={department} onChange={(e) => setDepartment(e.target.value)}
                                            className={fieldClass}>
                                            <option value="" disabled>Select Department</option>
                                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                )}

                                {regRole === 'student' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
                                        <select value={year} onChange={(e) => setYear(e.target.value)} className={fieldClass}>
                                            <option value="" disabled>Select Year</option>
                                            {YEARS.map((y) => <option key={y} value={y}>{y}{y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year</option>)}
                                        </select>
                                    </div>
                                )}

                                <button
                                    type="button" onClick={handleNext}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                                >
                                    Continue
                                </button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="relative">
                                    {inputIcon(Mail)}
                                    <input type="email" placeholder="College Email" value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)} className={fieldClass} />
                                </div>

                                <div className="relative">
                                    {inputIcon(Lock)}
                                    <input type={showRegPassword ? 'text' : 'password'} placeholder="Password" value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)} className={fieldClass} />
                                    <button
                                        type="button" onClick={() => setShowRegPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="relative">
                                    {inputIcon(Lock)}
                                    <input type={showRegPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass} />
                                    <button
                                        type="button" onClick={() => setShowRegPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button" onClick={handleBack}
                                        className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit" disabled={loading}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-60"
                                    >
                                        {loading ? 'Creating Account...' : 'Sign up'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}

                <p className="text-center text-sm text-slate-500 mt-6">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setStep(1); }}
                        className="text-indigo-600 font-semibold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
