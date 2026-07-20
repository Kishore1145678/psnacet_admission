'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const AnimatedNavLink = ({ title, href }: { title: string; href: string }) => {
  return (
    <Link
      href={href}
      className="group relative bg-white text-[#063d30] px-3 md:px-5 py-1 md:py-2 rounded-full font-semibold text-[11px] md:text-[13px] transition-colors tracking-tight overflow-hidden flex items-center justify-center hover:bg-[#ffda24] active:bg-[#ffda24]"
    >
      <span className="relative flex overflow-hidden">
        <span className="flex">
          {title.split('').map((char, index) => (
            <span
              key={`top-${index}`}
              className="inline-block transition-transform duration-[400ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full group-active:-translate-y-full"
              style={{ transitionDelay: `${index * 0.02}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
        <span className="absolute top-full left-0 flex">
          {title.split('').map((char, index) => (
            <span
              key={`bottom-${index}`}
              className="inline-block transition-transform duration-[400ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full group-active:-translate-y-full"
              style={{ transitionDelay: `${index * 0.02}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
};

// Reveal Text component using Framer Motion
const RevealText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const ref = useRef(null);
  // Strict requirement applied: "Ensure animations run only once"
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

  return (
    <div ref={ref} className="overflow-hidden inline-block">
      <motion.span
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        className="block"
      >
        {text}
      </motion.span>
    </div>
  );
};

export default function Home() {
  // Dedicated wrapper ref to provide scroll depth for the home exit animation
  const homeWrapRef = useRef(null);
  const { scrollYProgress: homeScrollY } = useScroll({
    target: homeWrapRef,
    offset: ["start start", "end start"]
  });

  // Home section dynamically scales and blurs out smoothly based purely on the 40vh runway
  const homeScale = useTransform(homeScrollY, [0, 1], [1, 0.85]);
  const homeOpacity = useTransform(homeScrollY, [0, 1], [1, 0]);
  const glassOpacity = useTransform(homeScrollY, [0, 0.8], [0, 1]);

  // Subtle Parallax for hero cards accelerating smoothly during runway scroll
  const backCardY = useTransform(homeScrollY, [0, 1], [0, 150]);
  const frontCardY = useTransform(homeScrollY, [0, 1], [0, 250]);

  // About us specific animations (scale parallax mapping to the about section)
  const aboutRef = useRef(null);
  const { scrollYProgress: aboutScrollY } = useScroll({
    target: aboutRef,
    offset: ["start end", "end start"]
  });

  const imageScale = useTransform(aboutScrollY, [0, 1], [0.95, 1.15]);

  // "We" Scroll Tracking Logic
  // Using an elongated container on the right side provides the scroll runway necessary.
  const phrasesContainerRef = useRef(null);
  const { scrollYProgress: phrasesScrollY } = useScroll({
    target: phrasesContainerRef,
    // Start tracking the effect once the right container enters the viewport center
    offset: ["start center", "end center"]
  });
  const [activeLine, setActiveLine] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [founderIndex, setFounderIndex] = useState(0);

  useEffect(() => {
    // Switch founder every 1 minute (60000ms)
    const interval = setInterval(() => {
      setFounderIndex((prev) => (prev + 1) % 5);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const founders = [
    {
      name: "Shri R.S.Kothandaraman",
      title: "Founder",
      desc: "Welcome to a place where education transforms lives and builds brighter futures. Founded in 1984, this institution is driven by a mission to uplift rural communities through quality technical education. Inspired by the vision of R. S. Kothandaraman, it empowers the underprivileged and breaks the cycle of poverty through learning. Built on values of service, dedication, and innovation, it nurtures skilled professionals for a growing nation. With strong academic and ethical foundations, education here goes beyond classrooms—helping you grow, achieve, and shape a meaningful future.",
      image: "/campus/founder1.jpg",
      positionClass: "object-center",
    },
    {
      name: "Smt. K. Dhanalakshmi",
      title: "Chairperson",
      desc: "Carrying forward the noble legacy of our Founder, Shri R. S. Kothandaraman, Smt. K. Dhanalakshmi leads with a profound commitment to altruism and social upliftment. Under her visionary guidance, the institution has evolved into a premier hub of professionalism where cultural ethos meets global career ambitions.An industrialist and passionate agriculturalist, she integrates innovation with tradition, championing organic farming and environmental stewardship. Her leadership focuses on broadening horizons and empowering students to scale new heights. Dedicated to the holistic growth of the student community, she ensures that every individual is inspired to realize their dreams and contribute meaningfully to a sustainable world.",
      image: "/campus/dhanalakshmi.jpeg",
      positionClass: "object-top",
    },
    {
      name: "Rtn R.S.K.Raguraam",
      title: "Pro-Chairman",
      desc: "Driven by a vision of service and social upliftment, this institution stands as a symbol of purpose and progress. Inspired by the ideals of R. S. Kothandaraman, it was founded to transform lives through quality education. With a mission to empower the underserved, it creates equal opportunities for growth and success. Built on strong values of integrity, innovation, and dedication, it nurtures future-ready professionals. Its foundation reflects compassion, resilience, and a commitment to meaningful change. Today, this vision continues to inspire excellence and shape impactful journeys for every learner.",
      image: "/campus/001.JPG",
      positionClass: "object-top",
    },
    {
      name: "Mr. Surya Raguram",
      title: "Director & Managing Director",
      desc: "As a dynamic leader and the grandson of the Founder, Shri R. S. Kothandaraman, Mr. Surya Raguram bridges the gap between academic excellence and industrial innovation. He plays a pivotal role in modernizing the institution’s strategic vision, ensuring it remains at the forefront of global technological trends and professional training.Combining his leadership at the college with his expertise as Managing Director of SIPL, he actively fosters industry-institute partnerships to enhance career opportunities for the next generation. Focused on infrastructure development and entrepreneurial growth, he is dedicated to creating a future-ready ecosystem that empowers students to excel in a competitive global landscape.",
      image: "/campus/surya_raguram.jpeg",
      positionClass: "object-[85%_center]",
    },
    {
      name: "Dr. D. Vasudevan",
      title: "Principal",
      desc: "With over 32 years of rich experience in teaching and research, Dr. D. Vasudevan serves as a cornerstone of the institution's academic excellence. A specialist in Mechanical Engineering, he combines deep technical expertise with a visionary approach to administration, ensuring the institution remains a leader in quality technical education across South Tamil Nadu.Under his leadership, the college has strengthened its research culture, fostering innovation through numerous patents, international publications, and collaborative industry projects. He is a dedicated mentor who has guided dozens of Master's and Doctoral scholars, emphasizing a hands-on, scientific approach to engineering. Committed to the holistic development of the student community, he works tirelessly to create an environment where academic rigor meets ethical values, empowering students to become globally competent professionals.",
      image: "/campus/vasudevan.jpeg",
      positionClass: "object-top",
    }
  ];

  // Login modal state
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showDevelopers, setShowDevelopers] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials. Please try again.');
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 600);
        return;
      }
      if (data.role === 'admin') {
        router.push('/admin');
        return;
      }
      if (data.role === 'student' && data.student) {
        localStorage.setItem('activeStudent', JSON.stringify(data.student));
        router.push('/student');
        return;
      }
      setLoginError('Invalid credentials. Please try again.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
    } catch {
      setLoginError('Unable to reach server. Is the database configured?');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
    } finally {
      setLoginLoading(false);
    }
  };

  // Lock body scroll when modal open
  useEffect(() => {
    if (showLogin || showDevelopers) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    if (!showLogin) {
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
      setShowPassword(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [showLogin, showDevelopers]);

  // Department specific scroll parallax animations
  const deptRef = useRef(null);
  // -------------------------
  // UNIFIED HERO TO GRID GSAP
  // -------------------------
  const heroGridRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Determine screen size precisely for responsive layout offsets
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    // Scale spacings for smaller screens so cards don't clip off the screen
    const spacingX = isMobile ? 85 : isTablet ? 120 : 180;
    const spacingY = isMobile ? 65 : isTablet ? 90 : 140;

    // Center cards on mobile/tablet natively or offset slightly for deck look
    gsap.set(card1Ref.current, { x: 0, y: 0, rotation: -6, scale: 0.9, zIndex: 10 });
    gsap.set(card2Ref.current, { x: isMobile ? 8 : 15, y: -5, rotation: 2, scale: 0.9, zIndex: 20 });
    gsap.set(card3Ref.current, { x: isMobile ? 16 : 30, y: 5, rotation: -4, scale: 0.9, zIndex: 30 });
    gsap.set(card4Ref.current, { x: isMobile ? 24 : 45, y: 15, rotation: 6, scale: 0.9, zIndex: 40 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroGridRef.current,
        start: "top top",
        end: "+=2000",
        scrub: 1,
        pin: true,
      }
    });

    // 1) Fade text out 
    tl.to(textRef.current, { opacity: 0, x: isMobile ? 0 : -100, y: isMobile ? -50 : 0, duration: 1 }, 0);

    // 2) Move the entire grid wrapper to absolute center.
    // On mobile, text is ABOVE the stack. To center the grid, we slide it UPWARDS heavily.
    tl.to(gridContainerRef.current, {
      x: isMobile ? 0 : isTablet ? "-10vw" : "-24vw",
      y: isMobile ? "-20vh" : 0,
      duration: 2, ease: "power2.inOut"
    }, 0);

    // 3) Expand the stack out
    tl.to(card1Ref.current, { x: -spacingX, y: -spacingY, rotation: 0, scale: 1, duration: 2 }, 0);
    tl.to(card2Ref.current, { x: spacingX, y: -spacingY, rotation: 0, scale: 1, duration: 2 }, 0.2);
    tl.to(card3Ref.current, { x: -spacingX, y: spacingY, rotation: 0, scale: 1, duration: 2 }, 0.1);
    tl.to(card4Ref.current, { x: spacingX, y: spacingY, rotation: 0, scale: 1, duration: 2 }, 0.3);

  }, { scope: heroGridRef });

  // -------------------------
  // FOUNDERS GSAP
  // -------------------------
  const founderSectionRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!founderSectionRef.current) return;

    gsap.from(".founder-img-field", {
      scrollTrigger: {
        trigger: founderSectionRef.current,
        start: "top 75%",
      },
      opacity: 0,
      x: -100,
      rotateY: -15,
      duration: 1.2,
      ease: "power3.out"
    });

    gsap.from(".founder-text-field", {
      scrollTrigger: {
        trigger: founderSectionRef.current,
        start: "top 75%",
      },
      opacity: 0,
      x: 100,
      duration: 1.2,
      ease: "power3.out",
      delay: 0.2
    });
  }, { scope: founderSectionRef });

  useEffect(() => {
    // using framer-motion latest string API, fallback for older fn
    // This watches exactly how far scrolled, updating active line index
    const unsubscribe = phrasesScrollY.on ? phrasesScrollY.on("change", (latest) => {
      if (latest < 0.25) setActiveLine(0);
      else if (latest < 0.5) setActiveLine(1);
      else if (latest < 0.75) setActiveLine(2);
      else setActiveLine(3);
    }) : phrasesScrollY.onChange((latest) => {
      if (latest < 0.25) setActiveLine(0);
      else if (latest < 0.5) setActiveLine(1);
      else if (latest < 0.75) setActiveLine(2);
      else setActiveLine(3);
    });

    return () => unsubscribe();
  }, [phrasesScrollY]);

  return (
    <main className="relative w-full font-sans bg-white overflow-x-hidden">

      {/* ------------------------- */}
      {/* HOME SECTION (STICKY PARALLAX RUNWAY) */}
      {/* ------------------------- */}
      <div id="home" ref={homeWrapRef} className="relative w-full z-0 h-[100svh]">
        <motion.div
          className="sticky top-0 w-full h-[100svh] flex flex-col bg-[#f5f4ef] pb-4 sm:pb-8 md:pb-12 shadow-sm origin-top rounded-b-[1.5rem] sm:rounded-b-[2rem] overflow-hidden"
          style={{ scale: homeScale, opacity: homeOpacity }}
        >
          {/* Glassmorphism cinematic wash overlay when scrolling */}
          <motion.div
            className="absolute inset-0 z-40 bg-[#063d30]/30 backdrop-blur-xl pointer-events-none"
            style={{ opacity: glassOpacity }}
          />

          {/* Navbar */}
          <motion.header
            initial={{ y: -40, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex justify-center pt-3 md:pt-6 z-50 relative px-4 sm:px-8 text-[#063d30] flex-shrink-0"
          >
            {/* Absolute Top Right CTA aligned with navbar row */}
            <div className="absolute right-4 top-2 sm:top-2 md:right-8 md:top-6 z-[60]">
              <button
                id="get-started-btn"
                onClick={() => setShowLogin(true)}
                className="flex flex-row items-center justify-center bg-[#063d30] text-white px-4 sm:px-5 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-[10px] sm:text-xs md:text-sm tracking-wide transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-[0_10px_30px_rgba(6,61,48,0.3)] cursor-pointer"
              >
                Get Started
              </button>
            </div>

            <nav className="inline-flex items-center gap-1 p-1 md:p-1.5 bg-[#063d30] rounded-[40px] shadow-sm max-w-[95vw] overflow-x-auto custom-scrollbar relative z-10">
              {/* Nav Items */}
              <div className="flex gap-1 pr-1 pl-1 md:pl-2 md:pr-0 items-center">
                <Link
                  href="#home"
                  className="group relative bg-white text-[#063d30] p-1.5 md:p-2 rounded-full flex items-center justify-center hover:bg-[#ffda24] transition-colors mr-1"
                  aria-label="Home"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </Link>
                <AnimatedNavLink title="About Us" href="#about-us" />
                <AnimatedNavLink title="Service" href="#service" />
                <AnimatedNavLink title="Blog" href="#blog" />
                <AnimatedNavLink title="Contact Us" href="#contact" />
              </div>
            </nav>
          </motion.header>

          {/* Hero Grid */}
          <div className="flex-1 max-w-[85rem] mx-auto w-full px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-16 items-center mt-4 sm:mt-6 md:mt-10 lg:mt-0 pb-4 sm:pb-6">

            {/* Left Column: Typography */}
            <div className="w-full flex flex-col justify-center relative z-20">
              <h1
                className="font-black uppercase text-[#063d30] mb-3 sm:mb-4 md:mb-6 flex flex-col"
                style={{ fontSize: "clamp(2rem, 7vw, 4.5rem)", letterSpacing: '-0.04em', lineHeight: 0.88, transformOrigin: 'left top' }}
              >
                <motion.span
                  initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  transition={{ type: "spring", stiffness: 45, damping: 15, delay: 0.1 }}
                  className="block"
                  style={{ transform: 'scaleY(1.15)' }}
                >
                  BRINGING YOUR
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  transition={{ type: "spring", stiffness: 45, damping: 15, delay: 0.4 }}
                  className="block mt-1"
                  style={{ transform: 'scaleY(1.15)' }}
                >
                  VISION TO LIFE.
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="font-bold text-[#063d30] max-w-[32rem] leading-[1.3] mb-3 sm:mb-4 tracking-tight mt-3 sm:mt-4 hidden sm:block text-justify" style={{ fontSize: "clamp(13px, 2vw, 18px)" }}
              >
                Your journey begins with curiosity, grows with dedication, and leads to excellence Here, every step shapes your success story.
              </motion.p>
            </div>

            {/* Right Column: Visuals */}
            <div className="w-full relative h-[200px] xs:h-[240px] sm:h-[320px] md:h-[420px] lg:h-[400px] xl:h-[450px] flex items-center justify-center lg:mt-0">

              {/* Back Card */}
              <motion.div
                onHoverStart={() => setHoveredCard(1)}
                onHoverEnd={() => setHoveredCard(null)}
                onDoubleClick={() => setFullscreenImage("/campus/dji_0034.jpg")}
                initial={{ scale: 0.85, rotate: 6, opacity: 0, filter: "blur(12px)" }}
                animate={{
                  scale: hoveredCard === 1 ? 1.05 : 1,
                  rotate: hoveredCard === 1 ? 2 : 6,
                  opacity: 1,
                  filter: "blur(0px)",
                  zIndex: hoveredCard === 1 ? 40 : 10
                }}
                transition={{ type: "spring", stiffness: 40, damping: 20, delay: 0.5 }}
                style={{ y: backCardY, x: "2%", marginTop: "-2%", marginBottom: "-2%" }}
                className="absolute w-[180px] sm:w-[260px] md:w-[300px] lg:w-[300px] xl:w-[340px] h-[120px] sm:h-[180px] md:h-[200px] lg:h-[200px] xl:h-[220px] bg-gray-200 border-[2px] md:border-[3px] border-white/60 rounded-[1.2rem] lg:rounded-[1.5rem] overflow-hidden shadow-xl"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/5 z-10 transition-transform duration-500 group-hover:scale-105"></div>
                  <img src="/campus/dji_0034.jpg" className="w-full h-full object-cover opacity-100 brightness-[1.15] transition-transform duration-500 group-hover:scale-105" alt="College Campus View" />
                </motion.div>
              </motion.div>

              {/* Front Card */}
              <motion.div
                onHoverStart={() => setHoveredCard(2)}
                onHoverEnd={() => setHoveredCard(null)}
                onDoubleClick={() => setFullscreenImage("/campus/dji_0030.jpg")}
                initial={{ scale: 0.85, rotate: -6, opacity: 0, filter: "blur(12px)" }}
                animate={{
                  scale: hoveredCard === 2 ? 1.05 : 1,
                  rotate: hoveredCard === 2 ? -2 : -6,
                  opacity: 1,
                  filter: "blur(0px)",
                  zIndex: hoveredCard === 2 ? 40 : (hoveredCard === 1 ? 10 : 20)
                }}
                transition={{ type: "spring", stiffness: 40, damping: 20, delay: 0.7 }}
                style={{ y: frontCardY, x: "-2%", marginTop: "2%", marginBottom: "2%" }}
                className="absolute w-[220px] sm:w-[320px] md:w-[400px] lg:w-[400px] xl:w-[460px] h-[140px] sm:h-[220px] md:h-[260px] lg:h-[260px] xl:h-[300px] bg-white border-[2px] md:border-[3px] border-white rounded-[1.2rem] lg:rounded-[1.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full relative cursor-pointer"
                >
                  <img
                    src="/campus/dji_0030.jpg"
                    className={`w-full h-full object-cover opacity-100 brightness-[1.12] transition-transform duration-500 ${hoveredCard === 2 ? 'scale-110' : 'scale-[1.03]'}`}
                    alt="College Aerial View"
                  />
                </motion.div>
              </motion.div>

            </div>

          </div>
        </motion.div>
      </div>

      {/* ------------------------- */}
      {/* ABOUT US SECTION */}
      {/* ------------------------- */}
      <section id="about-us" ref={aboutRef} className="relative z-10 w-full bg-[#063d30] text-white rounded-t-[1.5rem] sm:rounded-t-[2.5rem] lg:rounded-t-[4rem] px-4 sm:px-6 lg:px-12 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.5)] pt-12 sm:pt-20 lg:pt-32 pb-[10vh] sm:pb-[15vh]">
        <div className="max-w-[85rem] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative">

          {/* Left Column (Sticky Image & Header) */}
          <div className="w-full flex-col hidden lg:flex sticky top-[10vh] lg:top-[12vh] self-start items-center overflow-hidden pt-[4vh]">
            <div className="w-full max-w-[480px] flex flex-col items-start mx-auto">
              <motion.div
                initial={{ x: -100, opacity: 0, filter: "blur(12px)" }}
                whileInView={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "0px 0px -20% 0px" }}
                transition={{ type: "spring", stiffness: 45, damping: 20, delay: 0.1 }}
                className="mb-8 lg:mb-12 w-full text-left"
              >
                <h2 className="leading-[0.95] font-black uppercase text-white tracking-tighter" style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", transform: 'scaleY(1.05)', transformOrigin: 'left top' }}>
                  INSPIRE EXCELLENCE <br />
                  AND CREATE <br />
                  LASTING IMPACT.
                </h2>
              </motion.div>

              <motion.div
                initial={{ x: 100, rotate: 10, opacity: 0, filter: "blur(12px)" }}
                whileInView={{ x: 0, rotate: 0, opacity: 1, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "0px 0px -20% 0px" }}
                transition={{ type: "spring", stiffness: 45, damping: 20, delay: 0.3 }}
                className="w-full aspect-[4/5] rounded-[2rem] relative shadow-2xl origin-bottom overflow-visible cursor-pointer"
              >
                <motion.div
                  animate={{ y: [-15, 15, -15] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full rounded-[2rem] overflow-hidden shadow-xl"
                >
                  <motion.img
                    style={{ scale: imageScale }}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.85 }}
                    src="/campus/slider_4.JPG"
                    className="w-full h-full object-cover opacity-95 transition-transform duration-[1500ms]"
                    alt="Students and Teacher"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Fallback Left Column for mobile (non-sticky image) */}
          <div className="w-full flex flex-col pt-12 lg:hidden items-center overflow-x-hidden">
            <div className="w-full max-w-[450px] flex flex-col items-start mx-auto px-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-8 w-full text-left"
              >
                <h2 className="leading-[0.95] font-black uppercase text-white tracking-tighter" style={{ fontSize: "clamp(2.5rem, 8vw, 3.5rem)", transform: 'scaleY(1.05)', transformOrigin: 'left top' }}>
                  INSPIRE EXCELLENCE <br />
                  AND CREATE <br />
                  LASTING IMPACT.
                </h2>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-full aspect-[4/5] sm:aspect-[4/3] rounded-[1.5rem] relative shadow-2xl overflow-visible"
              >
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full rounded-[1.5rem] overflow-hidden shadow-lg"
                >
                  <motion.img
                    whileTap={{ scale: 0.85 }}
                    src="/campus/slider_4.JPG"
                    className="w-full h-full object-cover opacity-95"
                    alt="Students and Teacher"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Right Column (Animated Typography Sliding "We") */}
          <div ref={phrasesContainerRef} className="w-full flex flex-col justify-center relative min-h-[50vh] sm:min-h-[60vh] lg:min-h-[160vh] py-[8vh] sm:py-[15vh]">

            <div className="flex flex-col font-semibold leading-[1.05] text-[#f5f4ef] gap-2 md:gap-3 lg:gap-4 overflow-hidden" style={{ fontSize: "clamp(1.3rem, 4vw, 2.75rem)", letterSpacing: "-0.02em" }}>

              {/* Phrase 0 */}
              <div className="flex w-full items-start">
                <div className="w-[20%] lg:w-[25%] pr-4 md:pr-6 lg:pr-8 text-right text-[#ffda24] drop-shadow-md min-h-[1.1em]">
                  {activeLine === 0 && <motion.div layoutId="we-pointer">We</motion.div>}
                </div>
                <div className="w-[80%] lg:w-[75%]">
                  <RevealText text="keep exploring." delay={0.1} />
                </div>
              </div>

              {/* Phrase 1 */}
              <div className="flex w-full items-start">
                <div className="w-[20%] lg:w-[25%] pr-4 md:pr-6 lg:pr-8 text-right text-[#ffda24] drop-shadow-md min-h-[1.1em]">
                  {activeLine === 1 && <motion.div layoutId="we-pointer">We</motion.div>}
                </div>
                <div className="w-[80%] lg:w-[75%]">
                  <RevealText text="work together." delay={0.2} />
                </div>
              </div>

              {/* Phrase 2 */}
              <div className="flex w-full items-start">
                <div className="w-[20%] lg:w-[25%] pr-4 md:pr-6 lg:pr-8 text-right text-[#ffda24] drop-shadow-md min-h-[1.1em]">
                  {activeLine === 2 && <motion.div layoutId="we-pointer">We</motion.div>}
                </div>
                <div className="w-[80%] lg:w-[75%]">
                  <RevealText text="grow brilliance." delay={0.3} />
                </div>
              </div>

              {/* Phrase 3 */}
              <div className="flex w-full items-start">
                <div className="w-[20%] lg:w-[25%] pr-4 md:pr-6 lg:pr-8 text-right text-[#ffda24] drop-shadow-md min-h-[1.1em]">
                  {activeLine === 3 && <motion.div layoutId="we-pointer">We</motion.div>}
                </div>
                <div className="w-[80%] lg:w-[75%]">
                  <RevealText text="shape tomorrow." delay={0.4} />
                </div>
              </div>

            </div>

            {/* Subtext anchored directly below the grid */}
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="mt-8 sm:mt-12 ml-0 sm:ml-[22%] lg:ml-[25%] max-w-[32rem] pr-2"
            >
              <p className="text-gray-300 leading-relaxed font-light text-justify" style={{ fontSize: "clamp(15px, 2vw, 17px)" }}>
                PSNA College of Engineering & Technology is a premier institution located in the serene landscape of Dindigul, offering world-class engineering education with a strong foundation in innovation, research, and academic excellence. Established under the Sri Rangalatchumi Educational Trust, the institution is affiliated with Anna University and approved by AICTE, ensuring high standards of quality education. With state-of-the-art infrastructure, experienced faculty, and a vibrant learning environment, PSNA empowers students to become technologically advanced, socially responsible, and industry-ready professionals. Guided by its mission of excellence and ethical values, the institution continues to nurture future leaders who contribute meaningfully to society.
              </p>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ------------------------- */}
      {/* STATS SECTION (INFINITE SCROLL MARQUEE) */}
      {/* ------------------------- */}
      <section className="w-full bg-[#fbfcfa] text-[#063d30] py-8 sm:py-12 lg:py-20 relative z-20 overflow-hidden group">
        {/* Edge Gradient Masks for premium fade effect */}
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #fbfcfa 0%, transparent 10%, transparent 90%, #fbfcfa 100%)' }}></div>

        <div className="w-full relative flex items-center overflow-hidden">
          <div className="flex w-max animate-[marquee_35s_linear_infinite] md:animate-[marquee_25s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[
              { value: "6500+", label: "Students Enrolled", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              { value: "380+", label: "Faculty Members", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
              { value: "95%+", label: "Placement Rate", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg> },
              { value: "38+", label: "Years of Excellence", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg> },
              { value: "1650+", label: "Computer Systems", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
              { value: "50+", label: "Transport Buses", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-4.3c.3-2.7.3-5.7.3-5.7H5l.3 5.7C5.5 16.3 6 18 6 18h3" /><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /><path d="M4 18h1" /><path d="M19 18h1" /></svg> },
              // Duplicate content for infinite loop illusion
              { value: "6500+", label: "Students Enrolled", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              { value: "380+", label: "Faculty Members", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
              { value: "95%+", label: "Placement Rate", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg> },
              { value: "38+", label: "Years of Excellence", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg> },
              { value: "1650+", label: "Computer Systems", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
              { value: "50+", label: "Transport Buses", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-4.3c.3-2.7.3-5.7.3-5.7H5l.3 5.7C5.5 16.3 6 18 6 18h3" /><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /><path d="M4 18h1" /><path d="M19 18h1" /></svg> },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center px-4 sm:px-8 lg:px-16"
              >
                <div className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-110 cursor-default gap-1 sm:gap-2">
                  <span className="text-[#063d30]/50 mb-0.5 sm:mb-1 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 lg:[&>svg]:w-7 lg:[&>svg]:h-7">{stat.icon}</span>
                  <span className="text-[1.8rem] sm:text-[3rem] lg:text-[4.5rem] font-light leading-none tracking-tighter text-[#063d30] whitespace-nowrap">{stat.value}</span>
                  <span className="text-[0.65rem] sm:text-[0.85rem] lg:text-[1.1rem] opacity-70 leading-snug font-medium max-w-[160px] sm:max-w-[240px] uppercase tracking-widest">{stat.label}</span>
                </div>
                {/* Soft divider */}
                <div className="h-14 sm:h-20 w-px bg-[#063d30]/20 ml-4 sm:ml-8 lg:ml-16 hidden md:block"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------- */}
      {/* UNIFIED HERO-TO-GRID SHOWCASE SECTION */}
      {/* ------------------------- */}
      <section
        id="service"
        ref={heroGridRef}
        className="relative w-full min-h-[100vh] bg-[#063d30] overflow-hidden"
      >
        {/* We let GSAP handle the pinning. The container inside is 100vh tall wrapper. */}
        <div className="relative w-full h-[100vh] flex items-center justify-center">

          {/* Layout Container */}
          <div className="w-full h-full max-w-[90rem] mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-3 sm:gap-6 lg:gap-[40px] px-4 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-0">

            {/* Left Column: Typography */}
            <div
              ref={textRef}
              className="w-full lg:flex-1 flex flex-col justify-center z-10 shrink-0"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-white/10 w-max mb-3 sm:mb-6 border border-white/20 shadow-sm backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-white">Admissions Open </span>
              </div>

              <h2 className="font-black tracking-tighter leading-[0.95] mb-3 sm:mb-6 text-white" style={{ fontSize: "clamp(1.9rem, 5vw, 4.5rem)" }}>
                Legacy Learning <br />
                <span className="text-white/80">Future of Success.</span>
              </h2>

              <p className="text-white/70 text-sm sm:text-base md:text-xl font-light leading-relaxed mb-4 sm:mb-8 max-w-[500px] hidden sm:block text-justify">
                <strong className="text-white font-semibold">Strategic education that drives growth, not just grades.</strong> We build academic ecosystems powered by innovation, advanced technology, and visionary leadership to transform ambition into real-world success.
              </p>


            </div>

            {/* GSAP Grids Container */}
            <div
              ref={gridContainerRef}
              className="relative flex items-center justify-center shrink-0 w-full lg:w-[600px] min-h-[240px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[500px] pointer-events-none z-20"
            >

              {/* Card 1 (Top Left) */}
              <div
                ref={card1Ref}
                className="absolute w-[160px] h-[120px] md:w-[220px] md:h-[165px] lg:w-[320px] lg:h-[240px] rounded-[1rem] lg:rounded-[1.5rem] overflow-visible shadow-2xl border border-white/10 bg-[#0a201a] p-1.5 lg:p-2 pointer-events-auto group cursor-pointer origin-center transition-shadow hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
              >
                <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-full h-full rounded-xl overflow-hidden relative">
                  <img src="/campus/hero-grid-1.jpeg" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90" alt="Work 1" />
                </motion.div>
              </div>

              {/* Card 2 (Top Right) */}
              <div
                ref={card2Ref}
                className="absolute w-[160px] h-[120px] md:w-[220px] md:h-[165px] lg:w-[320px] lg:h-[240px] rounded-[1rem] lg:rounded-[1.5rem] overflow-visible shadow-2xl border border-white/10 bg-[#0f2a22] p-1.5 lg:p-2 pointer-events-auto group cursor-pointer origin-center transition-shadow hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
              >
                <motion.div animate={{ y: [-9, 9, -9] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="w-full h-full rounded-xl overflow-hidden relative">
                  <img src="/campus/research-1.JPG" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90" alt="Work 2" />
                </motion.div>
              </div>

              {/* Card 3 (Bottom Left) */}
              <div
                ref={card3Ref}
                className="absolute w-[160px] h-[120px] md:w-[220px] md:h-[165px] lg:w-[320px] lg:h-[240px] rounded-[1rem] lg:rounded-[1.5rem] overflow-visible shadow-2xl border border-white/10 bg-[#143329] p-1.5 lg:p-2 pointer-events-auto group cursor-pointer origin-center transition-shadow hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
              >
                <motion.div animate={{ y: [-7, 7, -7] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="w-full h-full rounded-xl overflow-hidden relative">
                  <img src="/campus/research-2.JPG" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90" alt="Work 3" />
                </motion.div>
              </div>

              {/* Card 4 (Bottom Right) */}
              <div
                ref={card4Ref}
                className="absolute w-[160px] h-[120px] md:w-[220px] md:h-[165px] lg:w-[320px] lg:h-[240px] rounded-[1rem] lg:rounded-[1.5rem] overflow-visible shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20 bg-white/10 backdrop-blur-md p-1.5 lg:p-3 pointer-events-auto group cursor-pointer origin-center transition-shadow hover:shadow-[0_50px_100px_rgba(0,0,0,0.4)]"
              >
                <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="w-full h-full rounded-xl overflow-hidden relative bg-black">
                  <img src="/campus/research-3.JPG" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-95" alt="Work 4" />

                  {/* Floating Action Button */}
                  <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white/20 backdrop-blur-md text-white p-2 md:p-3 rounded-full md:rounded-xl shadow-lg border border-white/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ------------------------- */}
      {/* FOUNDERS SECTION */}
      {/* ------------------------- */}
      <section id="blog" ref={founderSectionRef} className="w-full bg-white text-[#063d30] py-16 sm:py-24 relative overflow-hidden flex flex-col items-center justify-center">

        <div className="text-center px-4 sm:px-6 mb-12 sm:mb-16 max-w-3xl mx-auto z-10 relative">
          <h2 className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-5xl tracking-tighter mb-4 text-[#ffda24]">
            Driving Innovation in Education
          </h2>
          <div className="w-20 h-1 bg-[#ffda24] mx-auto rounded-full mb-6"></div>
          <p className="text-[#063d30]/70 text-lg font-medium text-justify">
            The pillars supporting quality education and innovation.
          </p>
        </div>

        <div className="w-full max-w-[75rem] mx-auto flex flex-col md:flex-row items-center md:items-center gap-8 md:gap-16 relative z-10 px-4 lg:px-12">

          {/* GSAP wrapper for Left: Founder Image */}
          <div className="founder-img-field w-full md:w-[45%] flex justify-center md:justify-end shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${founderIndex}`}
                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="relative w-[280px] h-[360px] md:w-[320px] md:h-[400px] lg:w-[400px] lg:h-[480px] rounded-[2rem] overflow-hidden shadow-2xl bg-gray-50 flex items-center justify-center group cursor-pointer"
              >
                <img src={founders[founderIndex].image} alt={founders[founderIndex].name} className={`w-full h-full object-cover ${founders[founderIndex].positionClass || 'object-center'} transition-transform duration-700 group-hover:scale-105`} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* GSAP wrapper Right: Text Content */}
          <div className="founder-text-field w-full md:w-[55%] flex flex-col justify-center text-center md:text-left h-full py-4 md:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${founderIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="w-full"
              >
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#063d30] mb-2 tracking-tight">
                  {founders[founderIndex].name}
                </h3>
                <span className="text-xl md:text-2xl font-bold text-[#ffda24] mb-6 block uppercase tracking-wide">
                  {founders[founderIndex].title}
                </span>

                <div className="relative">
                  <p className="text-black text-lg md:text-xl leading-[1.8] font-medium max-w-2xl lg:max-w-xl mb-12 relative z-10 text-justify whitespace-pre-line">
                    {founders[founderIndex].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Dots indicator (kept outside animate presence so it doesn't flicker) */}
            <div className="flex gap-4 justify-center md:justify-start mt-auto pt-4 relative z-20">
              {founders.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFounderIndex(i)}
                  className={`w-14 h-1.5 rounded-full transition-all duration-500 ${founderIndex === i ? 'bg-[#ffda24] scale-y-125' : 'bg-gray-200 hover:bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------- */}
      {/* 6) PLACEMENT & COMPANIES SHOWCASE */}
      {/* ------------------------- */}
      <section className="w-[calc(100%-1rem)] sm:w-[calc(100%-4rem)] max-w-[100rem] mx-auto bg-[#063d30] text-white py-12 sm:py-16 lg:py-24 relative overflow-hidden flex flex-col items-center z-10 rounded-[2rem] sm:rounded-[4rem] my-8 sm:my-16 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">

        {/* Section Header */}
        <div className="text-center px-4 sm:px-6 mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto">
          <h2 className="font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter mb-3 sm:mb-4 text-white">
            Our Placement Impact
          </h2>
          <p className="text-white/80 text-base sm:text-lg md:text-xl font-medium text-justify">
            Empowering students with opportunities across leading global companies
          </p>
        </div>



        {/* Marquee Wrapper */}
        <div className="w-full relative py-6 sm:py-8 lg:py-12 bg-gradient-to-r from-transparent via-[#084A3B] to-transparent border-y border-white/5 overflow-hidden">

          {/* Edge Gradient Masks (Left & Right) */}
          <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#063d30] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[#063d30] to-transparent z-20 pointer-events-none"></div>

          <div className="flex w-max animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">

            {/* Array is mapped twice for seamless infinite scrolling */}
            {[...Array(2)].map((_, arrayIndex) => (
              <div key={arrayIndex} className="flex items-center gap-12 md:gap-20 px-8 md:px-12">
                {[
                  "Zoho",
                  "Cognizant",
                  "Hexaware",
                  "ITC Infotech",
                  "LTI Mindtree",
                  "ServiceNow",
                  "Kaar Technologies",
                  "Mallow Tech",
                  "AVASOFT",
                  "Juspay",
                  "TAFE",
                  "Motherson"
                ].map((name, i) => (
                  <div
                    key={i}
                    className="group relative flex items-center justify-center px-2 sm:px-4 py-1 sm:py-2 rounded-xl transition-all duration-300 hover:scale-[1.12] cursor-pointer"
                  >
                    <span className="font-black text-base sm:text-xl md:text-2xl lg:text-3xl tracking-tighter text-white/40 group-hover:text-white transition-all duration-300 whitespace-nowrap">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ------------------------- */}
      {/* 7) CONTACT / FOOTER SECTION */}
      {/* ------------------------- */}
      <section id="contact" className="w-full bg-[#eef1ef] pt-12 sm:pt-16 lg:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-[90rem] mx-auto flex flex-col justify-between relative">

          {/* Top Half: Text LEFT, Image RIGHT */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-12 w-full mb-10 sm:mb-20 lg:mb-32 relative z-10">

            {/* Massive Typography & Paragraph - LEFT */}
            <div className="flex flex-col items-start text-left mx-auto sm:mx-0 shrink-0">
              <h2 className="font-black text-[#033626] uppercase tracking-tighter" style={{ fontSize: "clamp(2rem, 6vw, 5rem)", lineHeight: "0.85" }}>
                Empowered <br />
                Futures
              </h2>
              <p className="mt-6 text-sm sm:text-base text-[#033626]/75 leading-relaxed max-w-[320px] sm:max-w-[460px] font-medium text-justify">
                Built on strong values of integrity, innovation, and dedication, it nurtures future-ready professionals.
                Its foundation reflects compassion, resilience, and a commitment to meaningful change,
                inspiring excellence and shaping impactful journeys for every learner.
              </p>
            </div>

            {/* Image Stack Overlay - RIGHT */}
            <div className="relative w-[220px] h-[160px] sm:w-[320px] sm:h-[220px] md:w-[400px] md:h-[280px] lg:w-[500px] lg:h-[340px] z-20 mt-0 sm:mt-0 shrink-0 mx-auto sm:mx-0 cursor-pointer active:scale-[0.92] transition-transform duration-300 hover:shadow-xl">
              <div className="absolute top-6 left-6 w-full h-full bg-[#d6ddd9] rounded-[2rem] transition-all duration-300"></div>
              <div className="absolute top-3 left-3 w-full h-full bg-[#dfe5e1] rounded-[2rem] transition-all duration-300"></div>
              <div className="absolute top-0 left-0 w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 transition-all duration-300">
                <img src="/campus/dji_0026.JPG" className="w-full h-full object-cover brightness-[0.8] contrast-125 hover:scale-105 transition-transform duration-700" alt="Contact visual" />
              </div>
            </div>
          </div>

          {/* Bottom Half: Contact Grid */}
          <div className="flex flex-col w-full relative z-30 pt-8 sm:pt-12 lg:pt-16">

            {/* Info Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-4 mb-6 sm:mb-8">

              <div className="flex flex-col lg:col-span-3">
                <span className="font-black text-[#033626] mb-3 text-sm tracking-wider uppercase">Visit Us</span>
                <p className="text-[#033626]/80 font-medium leading-[1.6] text-justify">
                  PSNA College of Engineering and <br />Technology,Kothandaraman <br />Nagar,Dindigul-<br />624622,Tamilnadu,India.<br />
                </p>
              </div>

              <div className="flex flex-col lg:col-span-4">
                <span className="font-black text-[#033626] mb-3 text-sm tracking-wider uppercase">Contact Us</span>
                <p className="text-[#033626]/80 font-medium leading-[1.6] text-justify">
                  contact@psnacet.edu.in<br />
                  (0451) 2554032
                </p>
              </div>

              {/* Social Icons (Far Right top) */}
              <div className="flex flex-col items-start sm:items-end lg:col-span-5 w-full">
                <p className="font-black text-[#033626] mb-3 text-sm tracking-wider uppercase">Follow Us</p>
                <div className="flex items-center gap-3 text-[#033626]">
                  <a href="https://www.facebook.com/psnacetofficial/" className="p-2 border border-[#033626]/20 rounded-full hover:bg-[#033626] hover:text-[#f4f6f5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
                  <a href="https://www.instagram.com/psnacetofficial/" className="p-2 border border-[#033626]/20 rounded-full hover:bg-[#033626] hover:text-[#f4f6f5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
                  <a href="https://www.linkedin.com/authwall?trk=gf&trkInfo=AQHoJ_qN9lftiAAAAZ2f7cDgQPNMpHDBgNvYf4qC2YLFUTusEuBTQi3dbWjfqoecXrxC6f_5kfX7FCkRtlYSE3kftuX__F3URsQ6eNeXj9ntV9KHGvuDDC_qIr_9a14E0dtK3Wk=&original_referer=https://psnacet.edu.in/&sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2Fschool%2Fpsnacetofficials%2F" className="p-2 border border-[#033626]/20 rounded-full hover:bg-[#033626] hover:text-[#f4f6f5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
                  <a href="https://x.com/psnacetofficial/" className="p-2 border border-[#033626]/20 rounded-full hover:bg-[#033626] hover:text-[#f4f6f5] transition-colors" title="X"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg></a>
                </div>
              </div>
            </div>

            {/* Bottom Row / Copyright */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full pt-6 sm:pt-8 border-t border-[#033626]/10 font-medium tracking-wide text-[#033626]/60 text-xs sm:text-sm relative gap-3 sm:gap-0">
              <span className="w-full sm:w-auto text-left">Copyright ©2026 PSNACET. All Rights Reserved.</span>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <a href="#" className="hover:text-[#033626] transition-colors">Terms &amp; Conditions</a>
                <span className="w-1 h-1 rounded-full bg-[#033626]/40 mx-2 hidden sm:block"></span>
                <a href="#" className="hover:text-[#033626] transition-colors">Privacy Policy</a>
                <span className="w-1 h-1 rounded-full bg-[#033626]/40 mx-2 hidden sm:block"></span>
                <button onClick={() => setShowDevelopers(true)} className="hover:text-[#033626] transition-colors text-left sm:text-center mt-2 sm:mt-0 font-bold">Application Developed by</button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================= */}
      {/* FULL-SCREEN GLASSMORPHISM LOGIN  */}
      {/* ========================= */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            key="login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-[999] flex"
          >
            {/* Background College Image + Glassmorphism Blur */}
            <div className="absolute inset-0 overflow-hidden">
              <img src="/campus/dji_0030.jpg" alt="PSNACET Campus" className="w-full h-full object-cover scale-105" />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
              {/* Subtle animated background particles over the blur */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-[#ffda24]/10 blur-3xl pointer-events-none"
                  style={{
                    width: `${200 + i * 100}px`,
                    height: `${200 + i * 100}px`,
                    left: `${[10, 80, 40, 70, 20][i]}%`,
                    top: `${[20, 15, 80, 60, 50][i]}%`,
                  }}
                  animate={{ y: [0, -40, 0], x: [0, 20, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {/* Split Screen Layout Container */}
            <div className="relative z-10 flex w-full h-full pointer-events-none">

              {/* Left Side: Aesthetic Typography */}
              <div className="hidden lg:flex flex-1 flex-col justify-center px-12 lg:px-24 pointer-events-auto">
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.25 } }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.h1
                    variants={{ hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } } }}
                    className="text-6xl xl:text-[4rem] font-extrabold tracking-tighter leading-[1.05] text-white drop-shadow-xl mb-8"
                  >
                    Experience <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffda24] to-[#fff2c8]">
                      Modern Education.
                    </span>
                  </motion.h1>

                  <motion.div
                    variants={{ hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } } }}
                    className="text-white text-base xl:text-lg font-medium leading-[1.7] max-w-lg drop-shadow-md space-y-3 opacity-90"
                  >
                    <p>Step into your future—where ambition meets opportunity, and every step you take brings you closer to your goals. Log in to explore your journey, track your progress, and unlock what’s next with clarity and confidence. This is your space to grow, build, and make things happen.</p>

                  </motion.div>
                </motion.div>
              </div>

              {/* Right Side: Glass Auth Form Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full lg:w-[480px] bg-[rgba(23,26,29,0.55)] backdrop-blur-[32px] border-l border-white/10 shrink-0 flex items-center justify-center pointer-events-auto h-full"
                style={{ boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}
              >
                <div className="w-full h-full max-h-[100vh] overflow-y-auto custom-scrollbar px-6 sm:px-10 py-12 flex flex-col justify-center relative">

                  {/* Close button */}
                  <button
                    onClick={() => setShowLogin(false)}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200"
                    aria-label="Close"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="mb-10 text-left">
                    <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">Welcome back.</h2>
                    <p className="text-gray-400 text-sm font-medium">Sign in to access your portal</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-6">
                      <div className="group">
                        <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2 px-1">USERNAME</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={loginUsername}
                            onChange={e => setLoginUsername(e.target.value)}
                            className="w-full bg-[#292c31]/60 border-none rounded-lg py-4 px-5 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-[#ffda24]/50 focus:bg-[#292c31]/90 transition-all outline-none"
                            placeholder="Enter your unique ID"
                            required
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffda24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
                          </div>
                        </div>
                      </div>

                      <div className="group">
                        <div className="flex justify-between items-center mb-2 px-1">
                          <label className="block text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">PASSWORD</label>
                          <a className="text-[10px] font-bold text-[#ffda24] hover:text-[#fff2c8] transition-colors uppercase tracking-widest" href="#">Forgot?</a>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className="w-full bg-[#292c31]/60 border-none rounded-lg py-4 px-5 pr-12 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-[#ffda24]/50 focus:bg-[#292c31]/90 transition-all outline-none"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffda24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffda24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-lg text-center"
                        >
                          {loginError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full bg-[#ffda24] text-[#063d30] font-black tracking-wide py-4.5 min-h-[56px] rounded-lg shadow-lg hover:shadow-[0_10px_30px_rgba(253,218,36,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {loginLoading ? (
                          <>
                            <svg className="animate-spin w-5 h-5 text-[#063d30]" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Authenticating...
                          </>
                        ) : (
                          'Sign In →'
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Replaced institutional section directly into the right panel to show text */}
                  <div className="mt-12 text-center lg:hidden">
                    <p className="text-[#ffda24] tracking-widest text-xs uppercase font-bold mb-2">Experience Modern Education</p>
                  </div>

                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 sm:p-8 cursor-zoom-out"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={fullscreenImage}
              className="max-w-[100vw] max-h-[100vh] w-auto h-auto object-contain rounded-xl sm:rounded-3xl shadow-2xl border border-white/20"
              alt="Fullscreen view"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 backdrop-blur-md transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================= */}
      {/* DEVELOPERS MODAL  */}
      {/* ========================= */}
      <AnimatePresence>
        {showDevelopers && (
          <motion.div
            key="developers-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8"
          >
            {/* Background Blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDevelopers(false)} />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-[rgba(23,26,29,0.75)] backdrop-blur-[32px] border border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl overflow-y-auto custom-scrollbar"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowDevelopers(false); }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 z-[99]"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-10 text-center relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">Application Developers</h2>
                <div className="w-16 h-1 bg-[#ffda24] mx-auto rounded-full mb-4"></div>
                <p className="text-gray-300 text-sm sm:text-base font-medium">The team behind the project</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12 relative z-10 mt-8">
                {[
                  { name: "NARESH KUMAR B", dept: "INFORMATION TECHNOLOGY", role: "FRONTEND DEVELOPER", img: "/team/naresh.jpeg", imgClass: "" },
                  { name: "RAMLAKSHMAN SM", dept: "INFORMATION TECHNOLOGY", role: "BACKEND DEVELOPER", img: "/team/ramlakshman_v2.jpeg", imgClass: "" },
                  { name: "KISHORE S", dept: "INFORMATION TECHNOLOGY", role: "BACKEND DEVELOPER", img: "/team/kishore_v2.jpeg", imgClass: "" }
                ].map((dev, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx + 0.2 }}
                    className="flex flex-col items-center bg-white/5 rounded-[2rem] p-8 md:p-10 border border-white/10 hover:bg-white/10 hover:-translate-y-3 transition-all duration-300 group hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer"
                    onClick={() => setFullscreenImage(dev.img)}
                  >
                    <div className="w-48 h-48 md:w-60 md:h-60 rounded-full overflow-hidden mb-8 border-[4px] border-[#ffda24] shadow-[0_0_35px_rgba(255,218,36,0.3)]">
                      <img src={dev.img} alt={dev.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${dev.imgClass}`} />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 text-center">{dev.name}</h3>
                    <p className="text-xs md:text-sm font-bold tracking-[0.15em] text-[#ffda24] uppercase mb-4 text-center">{dev.role}</p>
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold tracking-widest uppercase text-center">{dev.dept}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS settings */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Ensure no horizontal bleed on all screen sizes */
        * { box-sizing: border-box; }
        @media (max-width: 639px) {
          section { overflow-x: hidden; }
        }
      `}} />
    </main>
  );
}
