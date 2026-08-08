import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, FileText } from 'lucide-react';

const profileSchema = z.object({
    full_name: z.string().min(2, 'Required'),
    qualifications: z.string().min(2, 'Required'),
    registration_number: z.string().min(2, 'Required'),
    hospital_affiliation: z.string().min(2, 'Required'),
    years_of_experience: z.preprocess((val) => Number(val), z.number().min(0, 'Must be a positive number')),
    specialization: z.string().optional(),
    consultation_mode: z.string().min(2, 'Required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().min(5, 'Required').optional(),
    bio: z.string().optional()
});

type ProfileForm = z.infer<typeof profileSchema>;

interface Props {
    role: 'Dermatologist' | 'Consultant';
    onComplete: () => void;
}

const ProfessionalOnboarding: React.FC<Props> = ({ role, onComplete }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            consultation_mode: 'Both'
        }
    });

    const [step, setStep] = useState(1);
    const [activeDays, setActiveDays] = useState<string[]>(['M', 'T', 'W', 'Th', 'F']);
    const [consultationMode, setConsultationMode] = useState('Both');
    const [timeRanges, setTimeRanges] = useState([{ id: 1, start: 6, end: 17 }]);
    const [specializations, setSpecializations] = useState<string[]>(['Dermatology', 'Acne', 'Cosmetic']);
    const [specInput, setSpecInput] = useState('');
    const [medicalLicenseFile, setMedicalLicenseFile] = useState<File | null>(null);
    const [degreeCertificateFile, setDegreeCertificateFile] = useState<File | null>(null);

    const daysOfWeek = [
        { label: 'S', id: 'Su' },
        { label: 'M', id: 'M' },
        { label: 'T', id: 'T' },
        { label: 'W', id: 'W' },
        { label: 'T', id: 'Th' },
        { label: 'F', id: 'F' },
        { label: 'S', id: 'Sa' },
    ];

    const toggleDay = (id: string) => {
        if (activeDays.includes(id)) {
            setActiveDays(activeDays.filter(d => d !== id));
        } else {
            setActiveDays([...activeDays, id]);
        }
    };

    const getActiveDaysText = () => {
        const fullNames: Record<string, string> = { 'Su': 'Sun', 'M': 'Mon', 'T': 'Tue', 'W': 'Wed', 'Th': 'Thu', 'F': 'Fri', 'Sa': 'Sat' };
        const sortedActive = daysOfWeek.filter(d => activeDays.includes(d.id)).map(d => fullNames[d.id]);
        return sortedActive.length > 0 ? `Active Days: ${sortedActive.join(', ')}` : 'No days selected';
    };

    const formatTime = (hour: number) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:00 ${ampm}`;
    };

    const updateTimeRange = (id: number, e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
        const val = parseInt(e.target.value);
        setTimeRanges(timeRanges.map(tr => {
            if (tr.id === id) {
                if (type === 'start') {
                    return { ...tr, start: Math.min(val, tr.end - 1) };
                } else {
                    return { ...tr, end: Math.max(val, tr.start + 1) };
                }
            }
            return tr;
        }));
    };

    const addTimeRange = () => {
        setTimeRanges([...timeRanges, { id: Date.now(), start: 9, end: 17 }]);
    };

    const onSubmit = async (data: ProfileForm) => {
        if (step === 1) {
            setStep(2);
            return;
        }
        
        try {
            if (!medicalLicenseFile || !degreeCertificateFile) {
                alert("Please upload your Medical License and Degree Certificate before submitting.");
                return;
            }

            const formData = new FormData();
            formData.append('full_name', data.full_name);
            formData.append('qualifications', data.qualifications);
            formData.append('registration_number', data.registration_number);
            formData.append('hospital_affiliation', data.hospital_affiliation || '');
            formData.append('years_of_experience', data.years_of_experience.toString());
            formData.append('specialization', specializations.join(', '));
            formData.append('consultation_mode', data.consultation_mode);
            formData.append('available_days', activeDays.join(','));
            formData.append('available_time', JSON.stringify(timeRanges));
            formData.append('email', data.email || '');
            formData.append('phone', data.phone || '');
            formData.append('bio', data.bio || '');
            formData.append('medical_license', medicalLicenseFile);
            formData.append('degree_certificate', degreeCertificateFile);

            const res = await fetch('http://localhost:8000/api/v1/professionals/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error("Failed to save profile");
            }

            console.log("Submitted profile to backend");
            onComplete();
        } catch (error: any) {
            console.error("Failed to save professional profile", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-sans">
            <div className="w-full max-w-[1000px] h-[650px] relative">
                
                <div 
                    className={`absolute inset-0 ${step === 1 ? 'right-[80px]' : 'right-0'} bg-[#f9f8f4] rounded-2xl shadow-2xl border-2 border-[#e5dfd1] overflow-hidden flex flex-col transition-all duration-300`}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h10v10H10zM30 10h10v10H30z' fill='%23e5dfd1' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`
                    }}
                >
                    <svg className="absolute top-0 right-0 w-64 h-64 text-[#d4cdbd] opacity-40 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <path d="M100 0L50 50v20M80 0v30l-20 20M100 20H70L40 50M60 100V70l20-20h20" />
                        <circle cx="50" cy="70" r="2" fill="currentColor" />
                        <circle cx="80" cy="50" r="2" fill="currentColor" />
                    </svg>
                    <svg className="absolute bottom-0 left-0 w-64 h-64 text-[#d4cdbd] opacity-40 pointer-events-none transform rotate-180" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <path d="M100 0L50 50v20M80 0v30l-20 20M100 20H70L40 50M60 100V70l20-20h20" />
                        <circle cx="50" cy="70" r="2" fill="currentColor" />
                    </svg>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="px-10 pt-8 pb-4">
                            <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Verify Your Professional Profile</h2>
                            <p className="text-[#595959] text-sm mt-1 max-w-[600px]">
                                Please complete your professional profile for verification. This information helps us verify your credentials and sets up your public profile.
                            </p>
                        </div>

                        <div className="px-10 flex-1 overflow-y-auto">
                            <form id="profile-form" onSubmit={handleSubmit(onSubmit as any)} className="h-full">
                                {step === 1 ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-6 border-b border-[#e5dfd1] pb-2 w-[550px]">
                                            <div className="w-5 h-5 bg-[#d6e4e5] rounded flex items-center justify-center text-[#087f8c]">
                                                <User className="w-3 h-3" />
                                            </div>
                                            <h3 className="font-bold text-[#1a1a1a]">Professional Information</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-[550px]">
                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">Full Name</label>
                                                <input {...register('full_name')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder="Jane Doe" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">{role === 'Dermatologist' ? 'Highest Qualification' : 'Skincare Certification'}</label>
                                                <select {...register('qualifications')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] text-slate-700 transition">
                                                    <option value="">Select or type qualification</option>
                                                    {role === 'Dermatologist' ? (
                                                        <>
                                                            <option value="MD">MD</option>
                                                            <option value="DO">DO</option>
                                                            <option value="MBBS">MBBS</option>
                                                            <option value="PhD">PhD</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="Esthetician">Esthetician License</option>
                                                            <option value="Cosmetology">Cosmetology Degree</option>
                                                            <option value="CIDESCO">CIDESCO Diploma</option>
                                                            <option value="Other">Other Certification</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">{role === 'Dermatologist' ? 'Medical Registration' : 'Certification ID'}</label>
                                                <input {...register('registration_number')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder={role === 'Dermatologist' ? 'e.g. 123456789' : 'e.g. EST-12345'} />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">Specialization</label>
                                                <div className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-2 py-1.5 min-h-[38px] flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-wrap">
                                                    {specializations.map((spec, i) => (
                                                        <span key={i} className="bg-[#e9e6df] text-[#404040] text-xs px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap">
                                                            {spec} <span className="text-[#8c8c8c] cursor-pointer text-[10px] hover:text-red-500" onClick={() => setSpecializations(specializations.filter((_, idx) => idx !== i))}>×</span>
                                                        </span>
                                                    ))}
                                                    <input 
                                                        type="text" 
                                                        value={specInput} 
                                                        onChange={(e) => setSpecInput(e.target.value)} 
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && specInput.trim()) {
                                                                e.preventDefault();
                                                                setSpecializations([...specializations, specInput.trim()]);
                                                                setSpecInput('');
                                                            }
                                                        }}
                                                        placeholder="Add specialization..." 
                                                        className="flex-1 min-w-[100px] bg-transparent text-sm focus:outline-none text-[#404040]" 
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">Years of Experience</label>
                                                <input type="number" {...register('years_of_experience')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder="e.g. 10" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">{role === 'Dermatologist' ? 'Hospital / Clinic' : 'Brand / Spa Affiliation'}</label>
                                                <input {...register('hospital_affiliation')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder={role === 'Dermatologist' ? 'General Hospital' : 'e.g. Sephora, Local Spa'} />
                                            </div>

                                            <div className="col-span-2 mt-4">
                                                <label className="block text-sm text-[#404040] mb-2 font-medium">Consultation Mode</label>
                                                <div className="flex gap-4">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setConsultationMode('Online Only')}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${consultationMode === 'Online Only' ? 'border-[#087f8c] bg-[#e6f2f3] text-[#087f8c]' : 'border-[#d4cdbd] bg-[#fcfcfb] hover:bg-[#f5f5f5] text-[#595959]'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${consultationMode === 'Online Only' ? 'border-[#087f8c]' : 'border-[#a6a6a6]'}`}>
                                                            {consultationMode === 'Online Only' && <div className="w-2 h-2 rounded-full bg-[#087f8c]" />}
                                                        </div>
                                                        Online Only
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setConsultationMode('In-Person Only')}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${consultationMode === 'In-Person Only' ? 'border-[#087f8c] bg-[#e6f2f3] text-[#087f8c]' : 'border-[#d4cdbd] bg-[#fcfcfb] hover:bg-[#f5f5f5] text-[#595959]'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${consultationMode === 'In-Person Only' ? 'border-[#087f8c]' : 'border-[#a6a6a6]'}`}>
                                                            {consultationMode === 'In-Person Only' && <div className="w-2 h-2 rounded-full bg-[#087f8c]" />}
                                                        </div>
                                                        In-Person Only
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setConsultationMode('Both')}
                                                        className={`flex items-center gap-2 px-8 py-2 rounded-lg border text-sm transition ${consultationMode === 'Both' ? 'border-[#087f8c] bg-[#e6f2f3] text-[#087f8c]' : 'border-[#d4cdbd] bg-[#fcfcfb] hover:bg-[#f5f5f5] text-[#595959]'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${consultationMode === 'Both' ? 'border-[#087f8c]' : 'border-[#a6a6a6]'}`}>
                                                            {consultationMode === 'Both' && <div className="w-2 h-2 rounded-full bg-[#087f8c]" />}
                                                        </div>
                                                        Both
                                                    </button>
                                                </div>
                                                <input type="hidden" {...register('consultation_mode')} value={consultationMode} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-[800px] flex flex-col gap-8 pb-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4 border-b border-[#e5dfd1] pb-2">
                                                <div className="w-5 h-5 bg-[#d6e4e5] rounded flex items-center justify-center text-[#087f8c]">
                                                    <User className="w-3 h-3" />
                                                </div>
                                                <h3 className="font-bold text-[#1a1a1a]">Contact Details</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                <div>
                                                    <label className="block text-sm text-[#404040] mb-1.5 font-medium">Email Address</label>
                                                    <input type="email" {...register('email')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder="dr@example.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-[#404040] mb-1.5 font-medium">Phone Number</label>
                                                    <input type="tel" {...register('phone')} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder="+1 234 567 8900" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-4 border-b border-[#e5dfd1] pb-2">
                                                <div className="w-5 h-5 bg-[#d6e4e5] rounded flex items-center justify-center text-[#087f8c]">
                                                    <FileText className="w-3 h-3" />
                                                </div>
                                                <h3 className="font-bold text-[#1a1a1a]">Documents</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                <div>
                                                    <label className="block text-sm text-[#404040] mb-2 font-medium">{role === 'Dermatologist' ? 'Medical License' : 'Certification Proof'}</label>
                                                    <div className="flex items-center gap-3">
                                                        <label className="bg-gradient-to-b from-[#8f7556] to-[#765e41] hover:from-[#7c6446] hover:to-[#654f35] text-[#ebdcc2] text-sm font-medium px-4 py-1.5 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] border border-[#5d4a32] cursor-pointer transition">
                                                            Choose file
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                onChange={(e) => setMedicalLicenseFile(e.target.files ? e.target.files[0] : null)}
                                                                accept=".pdf,.jpg,.png" 
                                                            />
                                                        </label>
                                                        <span className="text-sm text-[#8c8c8c]">{medicalLicenseFile ? medicalLicenseFile.name : 'No file chosen'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-[#404040] mb-2 font-medium">{role === 'Dermatologist' ? 'Degree Certificate' : 'Training Certificate'}</label>
                                                    <div className="flex items-center gap-3">
                                                        <label className="bg-gradient-to-b from-[#8f7556] to-[#765e41] hover:from-[#7c6446] hover:to-[#654f35] text-[#ebdcc2] text-sm font-medium px-4 py-1.5 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] border border-[#5d4a32] cursor-pointer transition">
                                                            Choose file
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                onChange={(e) => setDegreeCertificateFile(e.target.files ? e.target.files[0] : null)}
                                                                accept=".pdf,.jpg,.png" 
                                                            />
                                                        </label>
                                                        <span className="text-sm text-[#8c8c8c]">{degreeCertificateFile ? degreeCertificateFile.name : 'No file chosen'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-4 border-b border-[#e5dfd1] pb-2">
                                                <div className="w-5 h-5 bg-[#d6e4e5] rounded flex items-center justify-center text-[#087f8c]">
                                                    <User className="w-3 h-3" />
                                                </div>
                                                <h3 className="font-bold text-[#1a1a1a]">About</h3>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-[#404040] mb-1.5 font-medium">Short Bio</label>
                                                <textarea {...register('bio')} rows={3} className="w-full bg-[#fcfcfb] rounded-md border border-[#d4cdbd] px-3 py-2 text-sm focus:outline-none focus:border-[#087f8c] focus:ring-1 focus:ring-[#087f8c] transition" placeholder="Tell your patients a bit about yourself..." />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="mt-auto px-10 pb-8 flex flex-col items-center relative z-20 bg-gradient-to-t from-[#f9f8f4] via-[#f9f8f4] to-transparent pt-4">
                            <div className={`flex gap-4 w-full ${step === 1 ? 'max-w-[600px] mr-auto' : 'max-w-[800px] justify-between'}`}>
                                {step === 2 && (
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 rounded-lg border border-[#a89c8a] bg-[#7c6f5a] hover:bg-[#6b5f4c] text-white font-medium text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition"
                                    >
                                        Back
                                    </button>
                                )}
                                <button 
                                    type={step === 1 ? "button" : "submit"}
                                    onClick={step === 1 ? () => setStep(2) : undefined}
                                    form="profile-form"
                                    disabled={isSubmitting}
                                    className={`${step === 1 ? 'flex-1' : 'w-[400px]'} px-6 py-3 rounded-lg bg-gradient-to-b from-[#dcb974] to-[#b88c3f] hover:from-[#cda35d] hover:to-[#ae8033] text-[#2c1d05] font-bold text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.1)] border border-[#a17a36] transition`}
                                >
                                    {step === 1 ? 'Continue' : 'Save and Submit Profile'}
                                </button>
                            </div>
                            
                            <div className={`mt-6 flex items-center justify-center gap-10 w-full ${step === 1 ? 'max-w-[600px] mr-auto pl-10' : 'max-w-[800px]'}`}>
                                <div className="flex flex-col items-center cursor-pointer" onClick={() => setStep(1)}>
                                    <div className="w-32 h-1 bg-[#087f8c] rounded-full mb-1.5" />
                                    <span className={`text-xs font-semibold ${step === 1 ? 'text-[#1a1a1a]' : 'text-[#8c8c8c]'}`}>Step 1: Details</span>
                                </div>
                                <div className={`flex flex-col items-center ${step === 1 ? 'opacity-40' : ''}`}>
                                    <div className={`w-32 h-1 ${step === 2 ? 'bg-[#087f8c]' : 'bg-[#d4cdbd]'} rounded-full mb-1.5 transition-colors`} />
                                    <span className={`text-xs font-semibold ${step === 2 ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>Step 2: Verification</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {step === 1 && (
                    <div className="absolute right-0 top-1/2 -translate-y-[60%] w-[340px] bg-[#f9f8f4] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-[#e5dfd1] p-6 z-30 transition-all duration-300">
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-[#e5dfd1]">
                            <div className="w-6 h-6 bg-[#e6e2fd] rounded flex items-center justify-center text-[#6e5cd6]">
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-bold text-[#1a1a1a]">Availability</h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-[#404040] mb-3">Daily Activity</p>
                            <div className="flex justify-between items-center mb-2">
                                {daysOfWeek.map((day) => {
                                    const isActive = activeDays.includes(day.id);
                                    return (
                                        <button
                                            type="button"
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                                                isActive 
                                                    ? 'bg-[#087f8c] text-white shadow-md' 
                                                    : 'bg-white text-[#8c8c8c] border border-[#d4cdbd] hover:bg-gray-50'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="bg-[#e9e6df] text-[#595959] text-[11px] px-3 py-1.5 rounded-md font-medium inline-block">
                                {getActiveDaysText()}
                            </div>
                        </div>

                        <div className="mb-4 flex-1 overflow-y-auto pr-2 max-h-[200px] scrollbar-hide">
                            <p className="text-sm text-[#404040] mb-3">Available Time</p>
                            
                            {timeRanges.map((tr) => (
                                <div key={tr.id} className="mb-6">
                                    <div className="px-2 mb-4 mt-6 relative h-6">
                                        <div className="absolute left-0 w-full flex justify-between -top-5 px-1 pointer-events-none">
                                            <span className="text-xs font-medium text-[#595959]">{formatTime(tr.start)}</span>
                                            <span className="text-xs font-medium text-[#595959]">{formatTime(tr.end)}</span>
                                        </div>
                                        
                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[#d4cdbd] rounded-full mt-2">
                                            <div 
                                                className="absolute h-full bg-[#087f8c] rounded-full pointer-events-none" 
                                                style={{ left: `${(tr.start / 24) * 100}%`, right: `${100 - (tr.end / 24) * 100}%` }} 
                                            />
                                        </div>

                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="24" 
                                            value={tr.start}
                                            onChange={(e) => updateTimeRange(tr.id, e, 'start')}
                                            className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-auto cursor-pointer mt-2 z-20"
                                            style={{
                                                WebkitAppearance: 'none',
                                            }}
                                        />
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="24" 
                                            value={tr.end}
                                            onChange={(e) => updateTimeRange(tr.id, e, 'end')}
                                            className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-auto cursor-pointer mt-2 z-10"
                                            style={{
                                                WebkitAppearance: 'none',
                                            }}
                                        />
                                    </div>

                                    <p className="text-sm font-bold text-[#1a1a1a] mb-2 text-center">
                                        {formatTime(tr.start)} - {formatTime(tr.end)}
                                    </p>
                                </div>
                            ))}

                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    pointer-events: all;
                                    width: 16px;
                                    height: 16px;
                                    background: #f9f8f4;
                                    border: 3px solid #087f8c;
                                    border-radius: 50%;
                                    cursor: pointer;
                                }
                            `}</style>
                            
                            <button type="button" onClick={addTimeRange} className="w-full bg-[#7c6f5a] hover:bg-[#6b5f4c] text-white text-xs font-medium px-4 py-2 rounded-lg transition shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                Add another time slot
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfessionalOnboarding;
