"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { PhotoCapture } from '@/components/PhotoCapture';
import { Save, ArrowRight, ArrowLeft, CheckCircle, Phone } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence, useVelocity, useSpring } from 'framer-motion';
import html2canvas from 'html2canvas';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const WELCOME_IMAGES = ['/campus/dji_0030.jpg', '/campus/dji_0028.jpg', '/campus/dji_0036.jpg', '/campus/dji_0034.jpg', '/campus/dji_0032.jpg', '/campus/dji_0024.jpg', '/campus/dji_0029.jpg'];

const GALLERY_IMAGES = [
  '/campus/gallery_1.jpg',
  '/campus/gallery_2.jpg',
  '/campus/gallery_3.jpg',
  '/campus/gallery_4.jpg',
  '/campus/gallery_5.jpg',
  '/campus/gallery_6.jpg',
  '/campus/gallery_7.jpg'
];

const QUOTES = [
  <>AMBITION MEETS OPPORTUNITY,<br />JOURNEYS BEGIN HERE.</>,
  <>EMPOWERING MINDS,<br />SHAPING FUTURES.</>,
  <>DESIGNED FOR INNOVATION,<br />BUILT FOR GROWTH.</>,
  <>PASSION MEETS PROFESSION,<br />IDEAS BECOME REALITY.</>,
  <>STATE-OF-THE-ART FACILITIES,<br />ELITE MENTORSHIP.</>,
  <>GLOBAL OPPORTUNITIES,<br />THRIVING ECOSYSTEM.</>,
  <>BUILDING TOMORROW'S LEADERS,<br />UNWAVERING DEDICATION.</>
];

function DisintegrationImage({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    let canvases: HTMLCanvasElement[] = [];
    const COUNT = 75;
    const REPEAT_COUNT = 3;
    const captureEl = captureRef.current;
    if (!captureEl) return;

    let init = false;

    const runEffect = () => {
      if (init) return;
      init = true;
      html2canvas(captureEl, { backgroundColor: null }).then((canvas) => {
        const width = canvas.width;
        const height = canvas.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, width, height);
        let dataList: ImageData[] = [];
        captureEl.style.display = 'none';

        for (let i = 0; i < COUNT; i++) {
          dataList.push(ctx.createImageData(width, height));
        }

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            for (let l = 0; l < REPEAT_COUNT; l++) {
              const index = (x + y * width) * 4;
              const dataIndex = Math.floor((COUNT * (Math.random() + (2 * x) / width)) / 3);
              if (dataIndex < COUNT) {
                for (let p = 0; p < 4; p++) {
                  dataList[dataIndex].data[index + p] = imageData.data[index + p];
                }
              }
            }
          }
        }

        dataList.forEach((data, i) => {
          let clonedCanvas = document.createElement('canvas');
          clonedCanvas.width = width;
          clonedCanvas.height = height;
          clonedCanvas.getContext('2d')?.putImageData(data, 0, 0);
          clonedCanvas.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover pointer-events-none rounded-[1.5rem]';

          if (containerRef.current) containerRef.current.appendChild(clonedCanvas);
          canvases.push(clonedCanvas);

          const randomAngle = (Math.random() - 0.5) * 2 * Math.PI;
          const randomRotationAngle = 30 * (Math.random() - 0.5);

          gsap.to(clonedCanvas, {
            scrollTrigger: {
              trigger: containerRef.current,
              scrub: 2.5,
              start: "center center",
              end: "bottom top"
            },
            duration: 1,
            rotation: randomRotationAngle,
            x: 40 * Math.sin(randomAngle),
            y: 40 * Math.cos(randomAngle),
            opacity: 0,
            delay: (i / dataList.length) * 2
          });
        });
      }).catch(e => console.error("Html2Canvas Error:", e));
    };

    if (captureEl.complete) {
      runEffect();
    } else {
      captureEl.addEventListener('load', runEffect);
    }

    return () => {
      captureEl.removeEventListener('load', runEffect);
      canvases.forEach(c => c.remove());
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [src]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/3] rounded-[1.5rem] shadow-2xl flex items-center justify-center">
      <img ref={captureRef} src={src} className="w-full h-full object-cover rounded-[1.5rem] block" crossOrigin="anonymous" alt="Campus View" />
    </div>
  );
}

function CoverflowGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Apply a parallax effect to the section movement
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isMobile) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Map mouse position percentage (0 to 1) to an active index
    const percentage = x / width;
    const newIndex = Math.min(images.length - 1, Math.max(0, Math.floor(percentage * images.length)));
    setActiveIndex(newIndex);
  };

  return (
    <motion.section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ y }}
      className="relative w-full py-24 bg-white overflow-hidden flex items-center justify-center min-h-[85vh] border-t border-gray-100 z-20 px-6 md:px-12"
    >
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col xl:flex-row items-center gap-12">
        {/* Left Side: Typography */}
        <div className="w-full xl:w-[35%] flex flex-col justify-center pointer-events-none z-30 mb-8 xl:mb-0 relative text-left px-4 sm:px-8 lg:px-12">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black text-emerald-900 uppercase leading-[0.9] tracking-tighter drop-shadow-xl mb-6 relative"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
          >
            ACADEMIC<br />STRENGTH
          </h2>
          <div className="w-16 h-[3px] bg-emerald-500 mb-8" />
          <p className="text-sm md:text-base font-bold text-black/90 lowercase tracking-widest leading-relaxed max-w-xl text-left" style={{ fontFamily: '"Switzer", -apple-system, BlinkMacSystemFont, sans-serif' }}>
            Our institution is built on a foundation of modern infrastructure and a commitment to academic excellence. With well-equipped laboratories, advanced technology, and thoughtfully designed learning spaces, students are provided with an environment that fosters innovation, creativity, and practical knowledge. Beyond facilities, we emphasize strong educational values—encouraging critical thinking, ethical responsibility, and continuous growth. This holistic approach ensures that every student is not only academically prepared but also equipped to thrive in real-world challenges and future opportunities.
          </p>
        </div>

        {/* Right Side: Spacious Image Carousel */}
        <div className="w-full xl:w-[65%] relative flex justify-center items-center h-[350px] md:h-[500px]" style={{ perspective: "1200px" }}>
          {images.map((img, i) => {
            const isActive = i === activeIndex;
            const offset = i - activeIndex;

            const rotateY = offset === 0 ? 0 : offset < 0 ? 45 : -45;
            const xGap = isMobile ? 60 : 160;
            const posX = offset * xGap;
            const z = Math.abs(offset) * -200;
            const scale = isActive ? 1 : 0.85;
            const MathOpacity = Math.abs(offset) > 2 ? 0 : 1;
            const zIndex = 50 - Math.abs(offset);

            return (
              <motion.div
                key={i}
                className="absolute w-[240px] h-[320px] md:w-[450px] md:h-[380px] lg:w-[500px] lg:h-[400px] rounded-2xl cursor-pointer"
                animate={{
                  rotateY,
                  x: `${posX}px`,
                  z: `${z}px`,
                  scale,
                  opacity: MathOpacity,
                  zIndex
                }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
                style={{ transformStyle: "preserve-3d" }}
                onClick={() => {
                  // Allows tapping to move on mobile instead of mouse hover
                  if (isMobile) setActiveIndex(i);
                }}
              >
                <div className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-500 ${isActive ? 'shadow-[0_20px_50px_rgba(0,0,0,0.2)]' : 'shadow-none'} border border-gray-200`}>
                  <img src={img} alt={`Campus ${i}`} className="w-full h-full object-cover rounded-2xl pointer-events-none" />
                  {!isActive && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function WelcomeSections() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0]);
  const scale = useTransform(scrollY, [0, 800], [1.3, 1.0]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % WELCOME_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#0a0a0a] text-white overflow-hidden relative" style={{ fontFamily: '"Inter", sans-serif' }}>
      <motion.div style={{ y, scale, opacity }} className="fixed top-0 left-0 w-full h-screen z-0 pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: 6, ease: "easeOut" }
            }}
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${WELCOME_IMAGES[currentIndex]})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/10" />
      </motion.div>

      <div className="relative z-10 w-full">
        {/* Section 1 */}
        <section className="min-h-screen w-full flex items-center justify-center px-4 py-20 relative">

          {/* Medium Brutalist Bottom-Left Quote Container */}
          <div className="absolute inset-0 flex items-end justify-start pointer-events-none pb-16 px-6 md:pb-20 md:px-12 z-20">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white text-left uppercase leading-[0.95] tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
              >
                {QUOTES[currentIndex] || QUOTES[0]}
              </motion.h2>
            </AnimatePresence>
          </div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-12 right-6 md:bottom-16 md:right-12 lg:right-20 flex flex-col items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] cursor-pointer z-30"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <span className="text-xs font-semibold tracking-widest text-white/80 uppercase">Scroll Down</span>
            <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-yellow-400 rounded-full" />
            </div>
          </motion.div>
        </section>

        {/* Section 2: Disintegration Box Layout */}
        <section className="min-h-[70vh] md:min-h-[85vh] w-full flex items-center relative overflow-hidden bg-[#0b2a1a] py-20 px-6 md:px-12">
          {/* White pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.18]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55) 0 2px, transparent 3px), radial-gradient(circle at 75% 35%, rgba(255,255,255,0.35) 0 2px, transparent 3px), radial-gradient(circle at 40% 78%, rgba(255,255,255,0.35) 0 2px, transparent 3px), linear-gradient(135deg, rgba(255,255,255,0.14), transparent 60%)',
              backgroundSize: '120px 120px, 140px 140px, 160px 160px, 100% 100%',
              backgroundRepeat: 'repeat',
            }}
          />

          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
            {/* Left Side: Minimal Box Image with Disintegration Effect */}
            <div className="w-full max-w-md mx-auto">
              <DisintegrationImage src={WELCOME_IMAGES[0]} />
            </div>

            {/* Right Side: Brutalist Typography Layout */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-full text-left px-4 sm:px-8 lg:px-12"
            >
              <h2
                className="text-4xl sm:text-5xl md:text-[3.25rem] lg:text-[4rem] font-black text-white text-left uppercase leading-[1.05] tracking-tighter drop-shadow-2xl mb-8 whitespace-nowrap"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
              >
                YOUR FUTURE<br />STARTS HERE.
              </h2>

              <div className="w-16 h-[3px] bg-emerald-500 mb-8" />

              <p className="text-sm md:text-base font-bold text-white/90 lowercase tracking-widest leading-relaxed max-w-xl text-left pb-16" style={{ fontFamily: '"Switzer", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                PSNA College of Engineering stands as a center of excellence in engineering education, combining world-class infrastructure with strong academic and ethical values, empowering students to become technologically advanced, socially responsible, and future-ready professionals; through practical learning, innovation-driven projects, and industry-oriented training, it nurtures problem-solving skills, leadership, and collaboration, while its focus on research, continuous improvement, and a student-centered approach ensures individuals are prepared to excel and contribute meaningfully to society.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Re-introduced 3D Scrolling Gallery */}
        <CoverflowGallery images={GALLERY_IMAGES} />
      </div>
    </div>
  );
}

export default function ApplicationForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [batchString, setBatchString] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [residentialStatus, setResidentialStatus] = useState('');
  const [needsBus, setNeedsBus] = useState('');
  const [hideBusFieldsAfterSave, setHideBusFieldsAfterSave] = useState(false);
  const [hostelStay, setHostelStay] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');

  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const dobDate = new Date(dobString);
    if (isNaN(dobDate.getTime())) return '';
    const today = new Date();
    let computedAge = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      computedAge--;
    }
    return computedAge >= 0 ? String(computedAge) : '';
  };
  const [savedBusInfo, setSavedBusInfo] = useState({
    bus_district: '',
    bus_area: '',
    nearby_bus_stop: '',
  });
  const [studentPhotoBase64, setStudentPhotoBase64] = useState('');
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('https://www.youtube.com');
  const [hostelGalleryOption, setHostelGalleryOption] = useState<string | null>(null);
  const [hostelImages, setHostelImages] = useState<Record<string, string[]>>({
    two_sharing_ac: [],
    two_sharing_non_ac: [],
    four_sharing_non_ac: [],
  });

  const [studentProfile, setStudentProfile] = useState<null | {
    application_number: string;
    institutional_id: string;
    full_name: string;
    date_of_birth: string; // YYYY-MM-DD
    academic_branch: string;
    father_name: string;
    mother_name: string;
    father_mobile_number?: string;
    mobile_number: string;
    is_locked?: boolean;
    access_expires_at?: string | null;
    form_submitted_at?: string | null;
  }>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDenialMessage, setAccessDenialMessage] = useState('');
  const redirectDoneRef = useRef(false);
  const latestPayloadAppliedRef = useRef(false);

  useEffect(() => {
    if (studentProfile?.date_of_birth) {
      const dbDob = studentProfile.date_of_birth.slice(0, 10);
      setDob(dbDob);
      setAge(calculateAge(dbDob));
    }
  }, [studentProfile]);

  const debouncedAutosave = useRef<(() => void) | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    debouncedAutosave.current = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const formEl = formRef.current;
        if (!formEl) return;
        
        const fd = new FormData(formEl);
        const payload: Record<string, any> = {};

        for (const [k, v] of fd.entries()) {
          if (v instanceof File) continue;
          if (payload[k] === undefined) payload[k] = v;
          else if (Array.isArray(payload[k])) payload[k].push(v);
          else payload[k] = [payload[k], v];
        }

        payload.prefill = {
          application_number: studentProfile?.application_number || '',
          institutional_id: studentProfile?.institutional_id || '',
          full_name: studentProfile?.full_name || '',
          date_of_birth: studentProfile?.date_of_birth || '',
          academic_branch: studentProfile?.academic_branch || '',
        };

        payload.meta = {
          saved_at: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          currentStep,
          autosaved: true
        };

        if (studentPhotoBase64) {
          payload.student_photo_base64 = studentPhotoBase64;
        }

        try {
          const res = await fetch('/api/forms/save-draft', {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload }),
          });
          if (!res.ok) {
            console.warn('Autosave failed:', await res.json().catch(() => ({})));
          }
        } catch (e) {
          console.warn('Autosave network error:', e);
        }
      }, 1500);
    };

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [studentProfile, currentStep, studentPhotoBase64]);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && data.tutorial_video_url) {
          setTutorialVideoUrl(data.tutorial_video_url);
        }
      })
      .catch(e => console.error('Failed to load settings:', e));

    fetch('/api/settings/hostel-images')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setHostelImages(data);
        }
      })
      .catch(e => console.error('Failed to load hostel images:', e));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    handleFormChange();
  }, [currentStep, studentPhotoBase64]);



  useEffect(() => {
    let cancelled = false;
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 5000);

    fetch('/api/students/me', { credentials: 'include' })
      .then(async (r) => {
        clearTimeout(timeout);
        if (r.status === 401) {
          if (!redirectDoneRef.current) {
            redirectDoneRef.current = true;
            router.push('/');
          }
          return null;
        }
        if (!r.ok) {
          setIsLoading(false);
          return null;
        }
        return (await r.json()) as typeof studentProfile;
      })
      .then((data) => {
        if (cancelled) return;
        if (data) {
          // Check access restrictions - only check if locked
          // If locked, they shouldn't even be able to access this page (login would prevent it)
          // But keeping this as a safety measure
          if (data.is_locked) {
            setAccessDenied(true);
            setAccessDenialMessage('Your application has been submitted and is under review. Your account is locked. The admin will unlock it if changes are needed.');
            setIsLoading(false);
            return;
          }
          if (data.access_expires_at) {
            const expiresAt = new Date(data.access_expires_at);
            if (new Date() > expiresAt) {
              setAccessDenied(true);
              setAccessDenialMessage('Your access period has expired. Please contact the admin to extend your access.');
              setIsLoading(false);
              return;
            }
          }
          setStudentProfile(data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const getDraftKey = () => {
    return studentProfile?.application_number
      ? `student_form_draft_${studentProfile.application_number}`
      : 'student_form_draft';
  };

  const applyPayloadToForm = (payload: Record<string, any>) => {
    const formEl = formRef.current;
    if (!formEl || !payload || typeof payload !== 'object') return;

    for (const [key, rawValue] of Object.entries(payload)) {
      if (key === 'meta' || key === 'prefill') continue;
      if (rawValue == null || typeof rawValue === 'object') continue;

      const value = String(rawValue);
      const fields = formEl.elements.namedItem(key);
      if (!fields) continue;

      const setFieldValue = (field: any) => {
        if (!field) return;
        if (field instanceof HTMLInputElement) {
          if (field.type === 'radio' || field.type === 'checkbox') {
            field.checked = field.value === value;
          } else {
            field.value = field.type === 'date' ? value.slice(0, 10) : value;
          }
          return;
        }
        if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          field.value = value;
        }
      };

      if (typeof RadioNodeList !== 'undefined' && fields instanceof RadioNodeList) {
        for (const field of Array.from(fields as any)) {
          setFieldValue(field);
        }
      } else {
        setFieldValue(fields as any);
      }
    }

    if (typeof payload.mark_physics !== 'undefined') setPhysics(String(payload.mark_physics ?? ''));
    if (typeof payload.mark_chemistry !== 'undefined') setChemistry(String(payload.mark_chemistry ?? ''));
    if (typeof payload.mark_maths !== 'undefined') setMaths(String(payload.mark_maths ?? ''));
    if (typeof payload.admission_batch !== 'undefined') setBatchString(String(payload.admission_batch ?? ''));
    if (typeof payload.residential_status !== 'undefined') setResidentialStatus(String(payload.residential_status ?? ''));
    if (typeof payload.day_scholar_need_bus !== 'undefined') setNeedsBus(String(payload.day_scholar_need_bus ?? ''));
    if (typeof payload.student_dob !== 'undefined') {
      const draftDob = String(payload.student_dob ?? '').slice(0, 10);
      setDob(draftDob);
      setAge(calculateAge(draftDob));
    } else if (typeof payload.student_age !== 'undefined') {
      setAge(String(payload.student_age ?? ''));
    }
    if (typeof payload.hostel_stay !== 'undefined') setHostelStay(String(payload.hostel_stay ?? ''));
    const busDistrict = String(payload.bus_district ?? '');
    const busArea = String(payload.bus_area ?? '');
    const busStop = String(payload.nearby_bus_stop ?? '');
    if (busDistrict || busArea) {
      setSavedBusInfo({
        bus_district: busDistrict,
        bus_area: busArea,
        nearby_bus_stop: busStop,
      });
    }
    if (String(payload.residential_status ?? '') === 'day' && String(payload.day_scholar_need_bus ?? '') === 'yes' && (busDistrict || busArea)) {
      setHideBusFieldsAfterSave(true);
    }
    if (typeof payload.student_photo_base64 !== 'undefined') {
      setStudentPhotoBase64(String(payload.student_photo_base64 ?? ''));
    }
    if (typeof payload.meta?.currentStep === 'number' && payload.meta.currentStep >= 1 && payload.meta.currentStep <= steps.length) {
      setCurrentStep(payload.meta.currentStep);
    } else {
      setCurrentStep(1);
    }
  };

  useEffect(() => {
    if (!studentProfile || latestPayloadAppliedRef.current) return;
    let cancelled = false;

    const loadLatest = async () => {
      try {
        const res = await fetch('/api/forms/latest', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const payload = data?.payload || {};

        const studentKey = getDraftKey();
        try {
          // Check student-specific draft first
          let localStr = localStorage.getItem(studentKey);
          if (!localStr) {
            // Check legacy draft key
            const legacyStr = localStorage.getItem('student_form_draft');
            if (legacyStr) {
              const legacyPayload = JSON.parse(legacyStr);
              // Only use legacy draft if it belongs to THIS student
              if (legacyPayload.prefill?.application_number === studentProfile.application_number) {
                localStr = legacyStr;
              } else {
                // Remove stale draft from another student
                localStorage.removeItem('student_form_draft');
              }
            }
          }

          if (localStr) {
            const localPayload = JSON.parse(localStr);
            if (!localPayload.prefill?.application_number || localPayload.prefill.application_number === studentProfile.application_number) {
              Object.assign(payload, localPayload);
            }
          }
        } catch (e) {}

        if (cancelled) return;
        if (Object.keys(payload).length > 0) {
          applyPayloadToForm(payload);
        } else {
          setCurrentStep(1);
          setIsPreviewMode(false);
        }
      } catch (error) {
        console.error('Failed to load latest form payload:', error);
      } finally {
        if (!cancelled) {
          latestPayloadAppliedRef.current = true;
          setTimeout(() => {
            isFirstRender.current = false;
          }, 500);
        }
      }
    };

    // Wait one frame so form controls are mounted before applying values.
    const id = window.setTimeout(() => {
      void loadLatest();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [studentProfile]);

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) {
      val = val.substring(0, 4) + '-' + val.substring(4, 8);
    }
    setBatchString(val);
  };

  const [physics, setPhysics] = useState('');
  const [chemistry, setChemistry] = useState('');
  const [maths, setMaths] = useState('');

  const handleFormChange = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const payload: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) continue;
      if (payload[k] === undefined) payload[k] = v;
      else if (Array.isArray(payload[k])) payload[k].push(v);
      else payload[k] = [payload[k], v];
    }
    payload.prefill = {
      application_number: studentProfile?.application_number || '',
    };
    payload.meta = { currentStep };
    if (studentPhotoBase64) {
      payload.student_photo_base64 = studentPhotoBase64;
    }
    localStorage.setItem(getDraftKey(), JSON.stringify(payload));
    debouncedAutosave.current?.();
  };

  const getCutoff = () => {
    const p = parseFloat(physics) || 0;
    const c = parseFloat(chemistry) || 0;
    const m = parseFloat(maths) || 0;
    if (!physics && !chemistry && !maths) return '';
    return (m + (p / 2) + (c / 2)).toFixed(2);
  };

  const handleMarksChange = (cls: string) => {
    const formEl = formRef.current;
    if (!formEl) return;
    const totalInput = formEl.elements.namedItem(`marks_${cls}_total`) as HTMLInputElement | null;
    const obtainedInput = formEl.elements.namedItem(`marks_${cls}_obtained`) as HTMLInputElement | null;
    const percentageInput = formEl.elements.namedItem(`marks_${cls}_percentage`) as HTMLInputElement | null;
    
    if (totalInput && obtainedInput && percentageInput) {
      const t = parseFloat(totalInput.value);
      const o = parseFloat(obtainedInput.value);
      if (!isNaN(t) && !isNaN(o) && t > 0) {
        percentageInput.value = ((o / t) * 100).toFixed(2);
      } else {
        percentageInput.value = '';
      }
    }
  };

  const steps = [
    { label: 'Personal' },
    { label: 'Family' },
    { label: 'Address' },
    { label: 'Admission' },
    { label: 'Background' },
    { label: 'Community' },
    { label: 'School' },
    { label: 'Marks' },
    { label: 'Documents' },
    { label: 'Photo' },
    { label: 'Submit' }
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const formEl = formRef.current;
      if (!formEl) {
        throw new Error('Form not found');
      }

      const fd = new FormData(formEl);
      const payload: Record<string, any> = {};

      for (const [k, v] of fd.entries()) {
        if (v instanceof File) continue;
        if (payload[k] === undefined) payload[k] = v;
        else if (Array.isArray(payload[k])) payload[k].push(v);
        else payload[k] = [payload[k], v];
      }

      // Add student profile info
      payload.prefill = {
        application_number: studentProfile?.application_number || '',
        institutional_id: studentProfile?.institutional_id || '',
        full_name: studentProfile?.full_name || '',
        date_of_birth: studentProfile?.date_of_birth || '',
        academic_branch: studentProfile?.academic_branch || '',
      };

      payload.meta = {
        saved_at: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        currentStep,
      };

      const res = await fetch('/api/forms/save-draft', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save draft');
      }

      const busDistrict = String(payload.bus_district ?? '').trim();
      const busArea = String(payload.bus_area ?? '').trim();
      const busStop = String(payload.nearby_bus_stop ?? '').trim();
      const shouldHideBusFields =
        String(payload.residential_status ?? '') === 'day' &&
        String(payload.day_scholar_need_bus ?? '') === 'yes' &&
        !!busDistrict &&
        !!busArea;
      if (shouldHideBusFields) {
        setSavedBusInfo({
          bus_district: busDistrict,
          bus_area: busArea,
          nearby_bus_stop: busStop,
        });
        setHideBusFieldsAfterSave(true);
      }

      setShowDraftModal(true);
      setTimeout(() => setShowDraftModal(false), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearForm = async () => {
    if (!confirm('Are you sure you want to clear all entered information? This will reset the form and cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/forms/clear-draft', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to clear draft on server');
      }

      localStorage.removeItem(getDraftKey());
      localStorage.removeItem('student_form_draft');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing draft:', error);
      alert('Failed to clear form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });

  const submitForm = async (attempt = 0) => {
    try {
      setIsSaving(true);

      const formEl = formRef.current;
      if (!formEl) throw new Error('Form not found');

      const fd = new FormData(formEl);
      const payload: Record<string, any> = {};

      for (const [k, v] of fd.entries()) {
        if (v instanceof File) continue;
        if (payload[k] === undefined) payload[k] = v;
        else if (Array.isArray(payload[k])) payload[k].push(v);
        else payload[k] = [payload[k], v];
      }

      // Attach DB-prefilled profile values to ensure they are stored as well.
      payload.prefill = {
        application_number: studentProfile?.application_number || '',
        institutional_id: studentProfile?.institutional_id || '',
        full_name: studentProfile?.full_name || '',
        date_of_birth: studentProfile?.date_of_birth || '',
        academic_branch: studentProfile?.academic_branch || '',
        father_name: studentProfile?.father_name || '',
        mother_name: studentProfile?.mother_name || '',
        father_mobile_number: studentProfile?.father_mobile_number || '',
        mobile_number: studentProfile?.mobile_number || '',
      };

      // Signatures removed

      payload.meta = {
        submitted_at: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };

      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      if (res.status === 401 && attempt === 0) {
        // Occasionally the session cookie / server session lookup may lag after other requests.
        // Re-check session quickly and retry once (no page refresh needed).
        await fetch('/api/students/me', { credentials: 'include', cache: 'no-store' }).catch(() => {});
        await new Promise((r) => setTimeout(r, 150));
        return await submitForm(1);
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Could not submit form.');
        return;
      }

      localStorage.removeItem(getDraftKey());
      localStorage.removeItem('student_form_draft');
      setShowSuccessModal(true);
      setShowDownloadModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPdfAndLogout = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch('/api/student/export-pdf', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition') || '';
      const match = /filename="([^"]+)"/i.exec(contentDisposition);
      const fileName = match?.[1] || 'student_details.pdf';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Logout only after the download request succeeded.
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-session-kind': 'student' },
      }).catch(() => {});
      localStorage.removeItem('activeStudent');
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Could not download PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes smoke-cloud {
          0% { transform: translate(0, 0) scale(1); opacity: 0.6; filter: blur(4px); }
          100% { transform: translate(calc(var(--dx, -15px)), calc(var(--dy, -25px))) scale(2.5); opacity: 0; filter: blur(12px); }
        }
        .smoke-particle {
          position: absolute; width: 24px; height: 24px; border-radius: 50%; pointer-events: none; z-index: -10;
          background: radial-gradient(circle, rgba(160,170,180,0.5) 0%, rgba(160,170,180,0) 70%);
          animation: smoke-cloud 0.6s ease-out infinite;
        }
        .preview-override > div.animate-in {
          display: block !important;
        }
      `}</style>
      {accessDenied && (
        <div className="max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
                <p className="text-red-800 mb-4">{accessDenialMessage}</p>
                <button
                  onClick={() => {
                    localStorage.removeItem('activeStudent');
                    router.replace('/');
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  Back to login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!accessDenied && (
        <>
          <style>{`
            @keyframes smoke-cloud {
              0% { transform: translate(0, 0) scale(1); opacity: 0.6; filter: blur(4px); }
              100% { transform: translate(calc(var(--dx, -15px)), calc(var(--dy, -25px))) scale(2.5); opacity: 0; filter: blur(12px); }
            }
            .smoke-particle {
              position: absolute; width: 24px; height: 24px; border-radius: 50%; pointer-events: none; z-index: -10;
              background: radial-gradient(circle, rgba(160,170,180,0.5) 0%, rgba(160,170,180,0) 70%);
              animation: smoke-cloud 0.6s ease-out infinite;
            }
            .preview-override > div.animate-in {
              display: block !important;
            }
          `}</style>
          <WelcomeSections />
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0%" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="bg-[#0f3a24] relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] min-h-screen pt-16 pb-20 rounded-t-[3rem] overflow-hidden"
      >
        {/* White aesthetic shapes */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute top-32 -right-24 w-80 h-80 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-1/3 w-[520px] h-[520px] rounded-full bg-white/6 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">

          {/* SCROLL-BOUND TRACKING WRAPPER FOR FLOATERS */}
          <div className="sticky top-40 w-full z-[100] h-0">
            {/* Floating Left Setup: Contact Support Pop-up */}
            <motion.div
              drag
              dragConstraints={{ left: -100, right: 1000, top: -200, bottom: 800 }}
              dragElastic={0.4}
              dragMomentum={true}
              whileDrag={{ scale: 1.05, cursor: "grabbing" }}
              onDragStart={() => setIsDraggingLeft(true)}
              onDragEnd={() => setIsDraggingLeft(false)}
              animate={isDraggingLeft ? undefined : { y: [0, -14, 0], rotate: [0, 3, -2, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex absolute -left-4 sm:-left-6 xl:-left-12 top-0 group cursor-grab z-[150]"
            >
              {isDraggingLeft && (
                <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="smoke-particle" style={{ '--dx': '15px', '--dy': '-30px', animationDelay: '0s' } as any} />
                  <div className="smoke-particle" style={{ '--dx': '2px', '--dy': '-20px', animationDelay: '0.15s' } as any} />
                  <div className="smoke-particle" style={{ '--dx': '-10px', '--dy': '-25px', animationDelay: '0.3s' } as any} />
                </div>
              )}

              {/* The Trigger Icon */}
              <div className="w-12 h-12 bg-white/90 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center cursor-pointer border border-white transition-opacity group-hover:opacity-0 absolute top-0 left-0 duration-300">
                <span className="material-symbols-outlined text-[#1e3a8a] text-[26px]">support_agent</span>
              </div>

              {/* The Glassmorphism Pop-up */}
              <div className="absolute top-0 left-0 w-64 bg-white/80 backdrop-blur-3xl border border-white/90 shadow-[0_24px_50px_rgba(0,0,0,0.15)] rounded-[1.5rem] p-5 flex flex-col items-start gap-3 opacity-0 invisible -translate-x-4 scale-95 origin-top-left group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex justify-center items-center flex-shrink-0">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">support_agent</span>
                  </div>
                  <h4 className="text-[13px] font-extrabold text-gray-900 uppercase tracking-widest leading-tight">Contact Us</h4>
                </div>
                <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-1">If you experience any doubts while filling this form, contact us directly.</p>
                <div className="w-full h-px bg-gray-300/60 my-1" />
                <a href="tel:0451-2554032" className="flex items-center gap-2 text-sm font-black text-[#1e3a8a] hover:text-[#0ea5e9] transition-colors">
                  <Phone className="w-4 h-4 fill-current" /> 0451-2554032
                </a>
              </div>
            </motion.div>

            {/* Floating Right Setup: Video Guide Tutorial */}
            <motion.div
              drag
              dragConstraints={{ left: -1000, right: 100, top: -200, bottom: 800 }}
              dragElastic={0.4}
              dragMomentum={true}
              whileDrag={{ scale: 1.05, cursor: "grabbing" }}
              onDragStart={() => setIsDraggingRight(true)}
              onDragEnd={() => setIsDraggingRight(false)}
              animate={isDraggingRight ? undefined : { y: [0, -12, 0], rotate: [0, -2, 3, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="flex absolute -right-4 sm:-right-6 xl:-right-12 top-16 xl:top-0 group cursor-grab z-[150]"
            >
              {isDraggingRight && (
                <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="smoke-particle" style={{ '--dx': '-15px', '--dy': '-30px', animationDelay: '0s' } as any} />
                  <div className="smoke-particle" style={{ '--dx': '-5px', '--dy': '-20px', animationDelay: '0.15s' } as any} />
                  <div className="smoke-particle" style={{ '--dx': '10px', '--dy': '-25px', animationDelay: '0.3s' } as any} />
                </div>
              )}

              {/* The Trigger Icon */}
              <div className="w-12 h-12 bg-white/90 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center cursor-pointer border border-white transition-opacity group-hover:opacity-0 absolute top-0 right-0 duration-300">
                <span className="material-symbols-outlined text-red-600 text-[28px]">play_circle</span>
              </div>

              {/* The Glassmorphism Pop-up */}
              <div className="absolute top-0 right-0 w-64 bg-white/80 backdrop-blur-3xl border border-white/90 shadow-[0_24px_50px_rgba(0,0,0,0.15)] rounded-[1.5rem] p-5 flex flex-col items-start gap-3 opacity-0 invisible translate-x-4 scale-95 origin-top-right group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
                <h4 className="text-[13px] font-extrabold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-[18px]">play_circle</span> Tutorial Guide
                </h4>

                <a
                  href={tutorialVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full aspect-video rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 overflow-hidden group/vdo shadow-md cursor-pointer flex flex-col items-center justify-center border border-white/40 ring-2 ring-transparent hover:ring-red-500/50 transition-all p-3 text-white"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg group-hover/vdo:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[28px] ml-0.5">play_arrow</span>
                  </div>
                  <span className="text-xs font-bold mt-2 flex items-center gap-1">
                    Watch Video on YouTube
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </span>
                </a>

                <p className="text-[11px] font-bold text-gray-600 leading-relaxed text-center w-full">Click to open and watch step-by-step video on YouTube</p>
              </div>
            </motion.div>
          </div>

          <div className="mb-10 text-center sm:text-left mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: '"Manrope", sans-serif' }}>Application Form</h1>
              <p className="mt-2 text-sm sm:text-base text-emerald-100/80 font-medium">Complete all steps accurately. Your progress is maintained locally.</p>
            </div>

            {/* Prominent YouTube Tutorial Video Button */}
            <a
              href={tutorialVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-[0_8px_25px_rgba(220,38,38,0.4)] hover:shadow-[0_12px_30px_rgba(220,38,38,0.6)] hover:-translate-y-0.5 transition-all duration-300 shrink-0 border border-white/20"
            >
              <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px] ml-0.5">play_arrow</span>
              </div>
              <div className="text-left">
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-red-200 leading-tight">Need Help?</div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1">
                  Watch Form Tutorial Video
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </div>
              </div>
            </a>
          </div>

          <div className="mb-12 px-2 sm:px-8">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>

          <Card className="shadow-lg border-gray-200">
            <CardContent className="p-6 sm:p-8">
              <form ref={formRef} onChange={handleFormChange} onSubmit={handleNext} noValidate className={isPreviewMode ? 'preview-override space-y-20' : ''}>
                {/* Step 1: Personal Details */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 1 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="student_name" label="Name of the Student" placeholder="Enter full name" required defaultValue={studentProfile?.full_name ?? ''} readOnly={!!studentProfile?.full_name} />
                    <Input name="student_branch" label="Branch" placeholder="Specific branch" required defaultValue={studentProfile?.academic_branch ?? ''} readOnly={!!studentProfile?.academic_branch} />
                    <Input
                      name="student_dob"
                      label="Date of Birth"
                      type="date"
                      required
                      value={dob}
                      onChange={(e: any) => {
                        const newDob = e.target.value;
                        setDob(newDob);
                        setAge(calculateAge(newDob));
                        setTimeout(handleFormChange, 0);
                      }}
                      readOnly={!!studentProfile?.date_of_birth}
                    />
                    <Input
                      name="student_age"
                      label="Age"
                      type="number"
                      placeholder="Enter age"
                      required
                      value={age}
                      onChange={(e: any) => {
                        setAge(e.target.value);
                        setTimeout(handleFormChange, 0);
                      }}
                    />

                    <Select
                      name="student_blood_group"
                      label="Blood Group"
                      required
                      options={[
                        { label: 'Select Blood Group', value: '' },
                        { label: 'A+', value: 'A+' },
                        { label: 'A-', value: 'A-' },
                        { label: 'B+', value: 'B+' },
                        { label: 'B-', value: 'B-' },
                        { label: 'AB+', value: 'AB+' },
                        { label: 'AB-', value: 'AB-' },
                        { label: 'O+', value: 'O+' },
                        { label: 'O-', value: 'O-' },
                      ]}
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                          <input type="radio" name="student_gender" value="male" className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer" /> Male
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                          <input type="radio" name="student_gender" value="female" className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer" /> Female
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Specially Abled</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                          <input type="radio" name="student_specially_abled" value="yes" className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer" /> Yes
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-900 font-medium">
                          <input type="radio" name="student_specially_abled" value="no" className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer" /> No
                        </label>
                      </div>
                    </div>

                    <Input name="student_mobile" label="Student Mobile Number" type="tel" placeholder="+91 00000 00000" required defaultValue={studentProfile?.mobile_number ?? ''} readOnly={!!studentProfile?.mobile_number} />
                    <Input name="student_email" label="Student Mail ID" type="email" placeholder="student@example.com" required />
                    <Input name="student_aadhaar" label="Student Aadhaar Number" placeholder="---- ---- ----" required className="md:col-span-2" />
                  </div>
                </div>


                {/* Step 2: Family Details */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 2 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Family Header</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="father_name" label="Father's Name" placeholder="Full name" required defaultValue={studentProfile?.father_name ?? ''} readOnly={!!studentProfile?.father_name} />
                    <Select name="father_occupation_type" label="Father's Occupation Type" options={[{ value: '', label: 'Select Type' }, { value: 'government', label: 'Government' }, { value: 'private', label: 'Private' }, { value: 'business', label: 'Business' }, { value: 'self_employed', label: 'Self-employed' }, { value: 'other', label: 'Other' }]} required />
                    <Input name="father_occupation" label="Father's Occupation" placeholder="Occupation" required />
                    <Input name="father_mobile" label="Father's Mobile Number" type="tel" placeholder="+91 00000 00000" required defaultValue={studentProfile?.father_mobile_number ?? ''} readOnly={!!studentProfile?.father_mobile_number} />
                    <Input name="father_income" label="Father's Annual Income (₹)" type="number" placeholder="0.00" required />

                    <Input name="mother_name" label="Mother's Name" placeholder="Full name" required defaultValue={studentProfile?.mother_name ?? ''} readOnly={!!studentProfile?.mother_name} />
                    <Select name="mother_occupation_type" label="Mother's Occupation Type" options={[{ value: '', label: 'Select Type' }, { value: 'government', label: 'Government' }, { value: 'private', label: 'Private' }, { value: 'business', label: 'Business' }, { value: 'self_employed', label: 'Self-employed' }, { value: 'other', label: 'Other' }]} required />
                    <Input name="mother_occupation" label="Mother's Occupation" placeholder="Occupation" required />
                    <Input name="mother_mobile" label="Mother's Mobile Number" type="tel" placeholder="+91 00000 00000" required />
                    <Input name="mother_income" label="Mother's Annual Income (₹)" type="number" placeholder="0.00" required />

                    <Input name="guardian_name" label="Guardian's Name (if applicable)" placeholder="Full name" className="md:col-span-2" />
                  </div>
                </div>


                {/* Step 3: Address */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 3 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Address Information</h3>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
                      <textarea name="permanent_address" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" rows={2} placeholder="Street, landmark, etc." required></textarea>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Input name="permanent_city" label="City" required />
                      <Input name="permanent_state" label="State" required />
                      <Input name="permanent_pincode" label="Pincode" type="number" required />
                    </div>
                    <div className="space-y-1 mt-6">
                      <label className="block text-sm font-medium text-gray-700">Communication Address</label>
                      <textarea name="communication_address" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" rows={2} placeholder="Street, landmark, etc." required></textarea>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Input name="communication_city" label="Communication City" required />
                      <Input name="communication_state" label="Communication State" required />
                      <Input name="communication_pincode" label="Communication Pincode" type="number" required />
                    </div>
                  </div>
                </div>


                {/* Step 4: Admission Details */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 4 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Admission Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="admission_date" label="Date of Admission" type="date" required />
                    <Input name="admission_year" label="Admission for the Year" placeholder="e.g. 2026" required />
                    <Input name="admission_batch" label="Batch" placeholder="20__ - 20__" value={batchString} onChange={handleBatchChange} maxLength={9} required />
                    <div className="flex flex-col gap-2">
                      <Select
                        name="admission_category"
                        label="Admission Category"
                        options={[
                          { value: '', label: 'Select Category' },
                          { value: 'gq', label: 'Government Quota (GQ)' },
                          { value: 'mq', label: 'Management Quota (MQ)' },
                        ]}
                        required
                      />
                      <Input name="admission_allotment_number" label="GQ Allotment No / MQ Application No" placeholder="Enter Registration/Allotment Number" required />
                    </div>
                  </div>
                </div>


                {/* Step 5: Academic Background */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 5 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Academic Background</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="mother_tongue" label="Mother Tongue" required />

                    <div className="space-y-2">
                      <Select name="board_studied" label="Board Studied" options={[{ value: '', label: 'Select Board' }, { value: 'tnhsc', label: 'TN-HSC' }, { value: 'cbse', label: 'CBSE' }, { value: 'icse', label: 'ICSE' }, { value: 'other', label: 'Other' }]} required />
                    </div>

                    <Input name="school_location" label="School Location" required />

                    <div className="space-y-2">
                      <Select name="civic_status" label="Civic Status" options={[{ value: '', label: 'Select Status' }, { value: 'corp', label: 'Corporation' }, { value: 'muni', label: 'Municipality' }, { value: 'town', label: 'Town' }, { value: 'village', label: 'Village' }]} required />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Residential Status</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-900 text-sm font-medium">
                          <input
                            type="radio"
                            name="residential_status"
                            value="day"
                            checked={residentialStatus === 'day'}
                            onChange={() => {
                              setResidentialStatus('day');
                              setHideBusFieldsAfterSave(false);
                            }}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          /> Day Scholar
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-900 text-sm font-medium">
                          <input
                            type="radio"
                            name="residential_status"
                            value="hostel"
                            checked={residentialStatus === 'hostel'}
                            onChange={() => {
                              setResidentialStatus('hostel');
                              setNeedsBus('');
                              setHostelStay('');
                              setHideBusFieldsAfterSave(false);
                            }}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          /> Hosteller
                        </label>
                      </div>
                    </div>

                    {residentialStatus === 'day' && (
                      <div className="space-y-3 md:col-span-2 bg-[#f8faf8] border border-[#d9e7dd] rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700">Do you need a bus?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-900 text-sm font-medium">
                            <input
                              type="radio"
                              name="day_scholar_need_bus"
                              value="yes"
                              checked={needsBus === 'yes'}
                              onChange={() => {
                                setNeedsBus('yes');
                                setHideBusFieldsAfterSave(false);
                              }}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            /> Yes
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-900 text-sm font-medium">
                            <input
                              type="radio"
                              name="day_scholar_need_bus"
                              value="no"
                              checked={needsBus === 'no'}
                              onChange={() => {
                                setNeedsBus('no');
                                setHideBusFieldsAfterSave(false);
                              }}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            /> No
                          </label>
                        </div>

                        {needsBus === 'yes' && !hideBusFieldsAfterSave && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input name="bus_district" label="District" placeholder="Enter district" required />
                              <Input name="bus_area" label="Area" placeholder="Enter area" required />
                            </div>
                            <p className="text-sm text-red-600 font-medium mt-1">
                              Note: For bus seat confirmation, please visit our college and contact the Transport Manager.
                            </p>
                          </div>
                        )}

                        {needsBus === 'yes' && hideBusFieldsAfterSave && (
                          <div className="space-y-3">
                            <input type="hidden" name="bus_district" value={savedBusInfo.bus_district} />
                            <input type="hidden" name="bus_area" value={savedBusInfo.bus_area} />
                            <p className="text-xs font-semibold text-emerald-700">
                              Bus details saved successfully. Edit Residential Status if you need to change them.
                            </p>
                            <p className="text-sm text-red-600 font-medium">
                              Note: For bus seat confirmation, please visit our college and contact the Transport Manager.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {residentialStatus === 'hostel' && (
                      <div className="space-y-3 md:col-span-2 bg-[#f8faf8] border border-[#d9e7dd] rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700">Hostel Stay</label>
                        <div className="space-y-2">
                          {[
                            { label: 'Two Sharing A/C with Attached Bathroom', slug: 'two_sharing_ac' },
                            { label: 'Two Sharing Non A/C with Attached Bathroom', slug: 'two_sharing_non_ac' },
                            { label: 'Four Sharing Non A/C with Common Bathroom', slug: 'four_sharing_non_ac' },
                          ].map((opt) => (
                            <div key={opt.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-150/30 transition-colors gap-4">
                              <label className="flex items-center gap-2 cursor-pointer text-gray-900 text-sm font-medium flex-1">
                                <input
                                  type="radio"
                                  name="hostel_stay"
                                  value={opt.label}
                                  checked={hostelStay === opt.label}
                                  onChange={() => setHostelStay(opt.label)}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                {opt.label}
                              </label>
                              <button
                                type="button"
                                onClick={() => setHostelGalleryOption(opt.slug)}
                                className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-150 transition-all flex items-center gap-1.5 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                View Hostel
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 md:col-span-2 mt-2">
                      <label className="block text-sm font-bold text-gray-900 border-b pb-1">Eligibility Criteria</label>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded-md gap-3">
                          <span className="text-sm font-medium text-gray-900">Studied VIII–XII in Tamil Nadu?</span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-900"><input type="radio" name="tn_study" value="yes" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" /> Yes</label>
                            <label className="flex items-center gap-2 text-sm text-gray-900"><input type="radio" name="tn_study" value="no" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" /> No</label>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded-md gap-3">
                          <span className="text-sm font-medium text-gray-900">Studied VI–XII in Government School?</span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-900"><input type="radio" name="govt_study" value="yes" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" /> Yes</label>
                            <label className="flex items-center gap-2 text-sm text-gray-900"><input type="radio" name="govt_study" value="no" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" /> No</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Step 6: Community Details */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 6 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Community Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="nationality" label="Nationality" required />
                    <Input name="religion" label="Religion" required />
                    <div className="space-y-2">
                      <Select name="community" label="Community" options={[{ value: '', label: 'Select Community' }, { value: 'oc', label: 'OC' }, { value: 'bc', label: 'BC' }, { value: 'bcm', label: 'BCM' }, { value: 'mbc', label: 'MBC & DNT' }, { value: 'sc', label: 'SC' }, { value: 'st', label: 'ST' }]} required />
                    </div>
                    <Input name="caste" label="Caste" required />
                  </div>
                </div>


                {/* Step 7: School Details */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-transparent  ${currentStep === 7 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">School Details</h3>
                  <div className="mb-4">
                    <Input name="emis_number" label="EMIS Number" placeholder="Enter EMIS No" required className="max-w-md" />
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="table-fixed min-w-[1120px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-[#f8f9fa]">
                        <tr>
                          <th className="w-[8%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Class</th>
                          <th className="w-[10%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Year Passing</th>
                          <th className="w-[12%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">State</th>
                          <th className="w-[12%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">District</th>
                          <th className="w-[12%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">School Block</th>
                          <th className="w-[19%] px-3 py-3 text-left font-semibold text-gray-700">Name of School</th>
                          <th className="w-[10%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Category</th>
                          <th className="w-[10%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Medium</th>
                          <th className="w-[7%] px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Score %</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(cls => (
                          <tr key={cls} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 font-bold text-gray-800">{cls}</td>
                            <td className="px-2 py-2"><input name={`school_${cls}_year_passing`} type="text" className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" placeholder="YYYY" /></td>
                            <td className="px-2 py-2"><input name={`school_${cls}_state`} type="text" className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" placeholder="State" /></td>
                            <td className="px-2 py-2"><input name={`school_${cls}_district`} type="text" className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" placeholder="District" /></td>
                            <td className="px-2 py-2"><input name={`school_${cls}_block`} type="text" className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" placeholder="Block" /></td>
                            <td className="px-2 py-2"><input name={`school_${cls}_name`} type="text" className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" placeholder="School Name" /></td>
                            <td className="px-2 py-2">
                              <select name={`school_${cls}_category`} className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black cursor-pointer bg-white">
                                <option value="">Select</option>
                                <option value="private">Private</option>
                                <option value="government">Government</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <select name={`school_${cls}_medium`} className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black cursor-pointer bg-white">
                                <option value="">Select</option>
                                <option value="english">English</option>
                                <option value="tamil">Tamil</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                name={`school_${cls}_score`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full p-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black"
                                placeholder="%"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* Step 8: Marks Details and Declarations */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500  ${currentStep === 8 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Details of Marks Obtained</h3>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6 shadow-sm">
                    <table className="min-w-[600px] w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-[#f8f9fa]">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Class</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Year of Passing</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Total Marks</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Marks Obtained</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Percentage (%)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {['10', '11', '12'].map(cls => (
                          <tr key={cls} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 font-bold text-gray-800">{cls}</td>
                            <td className="px-4 py-2"><input name={`marks_${cls}_year_passing`} type="text" className="w-full p-2 border border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" placeholder="YYYY" /></td>
                            <td className="px-4 py-2"><input name={`marks_${cls}_total`} type="number" onChange={() => handleMarksChange(cls)} className="w-full p-2 border border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" /></td>
                            <td className="px-4 py-2"><input name={`marks_${cls}_obtained`} type="number" onChange={() => handleMarksChange(cls)} className="w-full p-2 border border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black" /></td>
                            <td className="px-4 py-2"><input name={`marks_${cls}_percentage`} type="number" step="0.01" readOnly className="w-full p-2 border border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black bg-gray-50 cursor-not-allowed" placeholder="%" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h4 className="text-lg font-bold text-gray-800 mb-4 mt-8">Class 12 - Core Subjects</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Physics</label>
                      <input name="mark_physics" type="number" value={physics} onChange={(e) => setPhysics(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black" placeholder="Marks" />
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Chemistry</label>
                      <input name="mark_chemistry" type="number" value={chemistry} onChange={(e) => setChemistry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black" placeholder="Marks" />
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Mathematics</label>
                      <input name="mark_maths" type="number" value={maths} onChange={(e) => setMaths(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none text-black" placeholder="Marks" />
                    </div>
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-end">
                      <label className="block text-sm font-bold text-indigo-900 mb-2">Cutoff Mark</label>
                      <input name="mark_cutoff" type="number" readOnly value={getCutoff()} className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-semibold text-indigo-900" placeholder="Auto Calc" />
                    </div>
                  </div>

                  <div className="space-y-5 pt-6 border-t border-gray-200 mt-8">
                    <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <label className="block text-sm font-semibold text-gray-800">Any brother/sister/relative studying in the college?</label>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input name="relative_name" label="Name (Leave blank if none)" />
                        <Select
                          name="relative_branch"
                          label="Branch"
                          options={[
                            { value: '', label: 'Select Branch' },
                            { value: 'CSE', label: 'B.E. CSE' },
                            { value: 'ECE', label: 'B.E. ECE' },
                            { value: 'IT', label: 'B.Tech IT' },
                            { value: 'EEE', label: 'B.E. EEE' },
                            { value: 'MECH', label: 'B.E. Mechanical' },
                            { value: 'BME', label: 'B.E. Biomedical' },
                            { value: 'AI', label: 'B.Tech AI & DS' },
                            { value: 'CSBS', label: 'B.Tech CSBS' },
                            { value: 'CYS', label: 'B.Tech CYS' },
                            { value: 'Civil', label: 'B.Tech Civil' },
                            { value: 'VLSI', label: 'B.Tech VLSI' },
                            { value: 'AIML', label: 'B.Tech AI & ML' }
                          ]}
                        />
                        <Input name="relative_year" label="Year" placeholder="e.g. 2nd Year" />
                        <Input name="relative_relation" label="Relation" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Select
                        name="hear_about_psna"
                        label="How do you know about PSNA?"
                        options={[
                          { value: '', label: 'Select an option' },
                          { value: 'adv', label: 'Advertisement / Website / Stall' },
                          { value: 'old_student', label: 'Old Student' },
                          { value: 'friend', label: 'Friend' },
                          { value: 'staff', label: 'PSNA Staff' }
                        ]}
                      />
                    </div>
                  </div>


                </div>

                {/* Step 9: Document Uploads */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${currentStep === 9 ? 'block' : 'hidden'}`}>
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-6">Upload Required Documents</h3>
                  <DocumentUploadSection />
                </div>

                {/* Step 10: Photo */}
                <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${currentStep === 10 ? 'block' : 'hidden'}`}>
                  <PhotoCapture 
                    initialPhoto={studentPhotoBase64} 
                    onPhotoSelect={setStudentPhotoBase64} 
                  />
                  <input type="hidden" name="student_photo_base64" value={studentPhotoBase64} />
                </div>

                {/* Step 11: Final Submission */}
                <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10 ${currentStep === 11 ? 'block' : 'hidden'}`}>
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 bg-[#d1fae5] rounded-full flex items-center justify-center">
                      <CheckCircle className="text-[#065f46] w-12 h-12" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight" style={{ fontFamily: '"Manrope", sans-serif' }}>Ready for Final Submission?</h3>
                  <p className="text-[#4b5563] max-w-xl mx-auto text-[15px] leading-relaxed pt-2 pb-6">
                    By clicking Submit Application, you declare that all information provided is accurate and true.
                    Subsequent modifications will require administrative access.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button type="button" onClick={() => setIsPreviewMode(!isPreviewMode)} className={`w-full sm:w-auto px-6 py-3.5 font-bold text-[15px] border border-gray-200 rounded-[10px] transition-all ${isPreviewMode ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-inner' : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}>
                      {isPreviewMode ? 'Close Preview' : 'Preview Application'}
                    </button>
                    <button type="button" onClick={handleSaveDraft} disabled={isSaving} className="w-full sm:w-auto px-6 py-3.5 font-bold text-[15px] border border-gray-200 rounded-[10px] bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
                      Save Draft
                    </button>
                    <button type="button" onClick={() => void submitForm()} disabled={isSaving} className="w-full sm:w-auto px-8 py-3.5 text-[15px] font-bold rounded-[10px] shadow-sm bg-[#bbf7d0] text-[#065f46] hover:bg-[#86efac] transition-all">
                      {isSaving ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </div>


                {/* Navigation Actions */}
                <div className={`mt-10 pt-6 border-t border-gray-200 items-center justify-between gap-4 ${currentStep === 11 || isPreviewMode ? 'hidden' : 'flex flex-col sm:flex-row'}`}>
                  <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1} className="w-full sm:w-auto flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Previous
                  </Button>

                  <div className="flex w-full sm:w-auto gap-4">
                    <Button type="button" variant="ghost" onClick={handleSaveDraft} disabled={isSaving} className="hidden sm:flex items-center gap-2">
                      <Save size={16} /> {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button type="button" onClick={handleNext} className="w-full sm:w-auto flex items-center justify-center gap-2">
                      Next Step <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Glassmorphism Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/80 border border-white/40 shadow-[0_25px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl rounded-[2rem] p-8 md:p-12 max-w-md w-full flex flex-col items-center text-center mx-auto"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner mb-6">
                <CheckCircle className="text-[#065f46] w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 tracking-tight mb-2">Application Submitted!</h3>
              <p className="text-emerald-800/70 font-medium text-sm">
                Downloading the PDF is mandatory. After download, you will be logged out automatically.
              </p>

              {showDownloadModal && (
                <div className="w-full mt-6">
                  <button
                    type="button"
                    onClick={downloadPdfAndLogout}
                    disabled={isDownloadingPdf}
                    className="w-full px-6 py-3.5 rounded-[12px] font-extrabold text-[14px] bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF & Logout'}
                  </button>
                  <p className="text-[11px] text-gray-600 font-semibold mt-3">
                    If the download doesn’t start, click the button again.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Draft Modal */}
      <AnimatePresence>
        {showDraftModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/90 border border-white/50 shadow-2xl backdrop-blur-lg rounded-2xl py-4 px-6 flex items-center gap-3"
            >
              <Save className="text-indigo-500 w-5 h-5 flex-shrink-0" />
              <span className="font-bold text-gray-800">Draft saved successfully!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Hostel Gallery Modal */}
      <AnimatePresence>
        {hostelGalleryOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setHostelGalleryOption(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="font-headline text-lg font-black text-gray-900 leading-tight">
                    {hostelGalleryOption === 'two_sharing_ac' && 'Two Sharing A/C Hostel Accommodation'}
                    {hostelGalleryOption === 'two_sharing_non_ac' && 'Two Sharing Non A/C Hostel Accommodation'}
                    {hostelGalleryOption === 'four_sharing_non_ac' && 'Four Sharing Non A/C Hostel Accommodation'}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    Images uploaded by the administration
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHostelGalleryOption(null)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {(() => {
                  const imgs = hostelImages[hostelGalleryOption] || [];
                  if (imgs.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2">
                          broken_image
                        </span>
                        <p className="text-sm font-bold text-gray-800">No images available for this category.</p>
                        <p className="text-xs text-gray-500 mt-1">Please contact the administration to upload images.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                        {imgs.map((url, idx) => (
                          <div key={url} className="group relative aspect-[4/3] rounded-2xl bg-gray-50 overflow-hidden border border-gray-150 shadow-sm cursor-zoom-in hover:shadow-md transition-shadow">
                            <img
                              src={url}
                              alt={`Hostel View ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onClick={() => window.open(url, '_blank')}
                            />
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                              View {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold text-center italic mt-2">
                        💡 Click on any image to open it in a new window/tab for full-resolution view.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </>
  );
}
