import { Link } from "wouter";
import { useState, useEffect } from "react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BookOpen, Briefcase, FileText, Users } from "lucide-react";
import AdUnit from "@/components/AdUnit";

function useRegistrationCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/applicants/stats`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { totalRegistrations?: number } | null) => {
        if (data?.totalRegistrations !== undefined) setCount(data.totalRegistrations);
      })
      .catch(() => {});
  }, []);

  return count;
}

function AnimatedCount({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplayed(0); return; }
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayed.toLocaleString("en-NG")}</>;
}

export default function Home() {
  const registrationCount = useRegistrationCount();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <img src={logoPath} alt="National Empowerment Scheme Logo" className="h-12 w-auto transition-transform group-hover:scale-105" />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-primary leading-tight group-hover:underline">NATIONAL EMPOWERMENT SCHEME</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Training and Vocational Skills</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              Admin Portal
            </Link>
            <Button asChild className="bg-secondary hover:bg-secondary/90 text-white shadow-sm">
              <Link href="/register">Register Now</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-block bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                Official Registration Portal
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Empowering Nigerian Citizens Through Vocational Skills
              </h2>
              <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-xl">
                The National Empowerment Scheme provides fully funded training and capacity-building programs to equip individuals with practical skills for economic independence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-secondary hover:bg-secondary/90 text-white font-semibold text-lg px-8 h-14">
                  <Link href="/register">Start Application</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 h-14">
                  Learn More
                </Button>
              </div>

              {/* Live registration counter */}
              {registrationCount !== null && (
                <div className="mt-8 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary/80">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl leading-none">
                      <AnimatedCount value={registrationCount} />
                      {registrationCount > 0 && "+"}
                    </p>
                    <p className="text-blue-100 text-xs mt-0.5">Nigerians already registered</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse ml-1" title="Live count" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Ad — between hero and How it Works */}
        <div className="bg-white border-b border-slate-100 py-3 px-4">
          <AdUnit slot="1111111111" format="horizontal" className="max-w-4xl mx-auto" style={{ minHeight: 90 }} />
        </div>

        {/* Info Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">How the Program Works</h3>
              <p className="text-slate-600 text-lg">A straightforward process to gain valuable skills and start your journey towards financial independence.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
                <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">1. Register Online</h4>
                <p className="text-slate-600">Complete the comprehensive 7-step application form with your accurate details and selected skill preference.</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
                <div className="w-16 h-16 bg-green-100 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">2. Attend Training</h4>
                <p className="text-slate-600">If selected, you will be deployed to a certified vocational center for intensive hands-on training.</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">3. Get Empowered</h4>
                <p className="text-slate-600">Graduates receive certification, starter packs, and ongoing mentorship to launch their businesses.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 max-w-4xl">
            <h3 className="text-3xl font-bold text-slate-900 mb-10 text-center">Available Skill Categories</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['Tailoring & Fashion Design', 'Agriculture & Farming', 'ICT & Computer Skills', 'Welding & Fabrication', 'Catering & Baking', 'Electrical Installation'].map((skill) => (
                <div key={skill} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <CheckCircle2 className="text-secondary w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-slate-800">{skill}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-slate-600 mb-6">Registration is free and open to all eligible citizens.</p>
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                <Link href="/register">Begin Registration</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Ad — above footer */}
      <div className="bg-white border-t border-slate-100 py-3 px-4">
        <AdUnit slot="2222222222" format="auto" className="max-w-4xl mx-auto" style={{ minHeight: 90 }} />
      </div>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <img src={logoPath} alt="Logo" className="h-10 opacity-50 grayscale mx-auto mb-6" />
          <p className="mb-4 text-sm">© {new Date().getFullYear()} National Empowerment Scheme. All rights reserved.</p>
          <p className="text-xs max-w-md mx-auto opacity-60">This is an official government portal. Providing false information during registration is a punishable offense.</p>
        </div>
      </footer>
    </div>
  );
}
