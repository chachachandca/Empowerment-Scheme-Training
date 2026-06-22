import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Printer, Home } from "lucide-react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";

export default function Success() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const regNumber = params.get("reg") || "NES-XXXXXXXX";
  const name = params.get("name") ? decodeURIComponent(params.get("name")!) : "Applicant";
  const today = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-primary text-primary-foreground shadow-lg print:shadow-none">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="flex items-center gap-4 group print:pointer-events-none">
            <img src={logoPath} alt="NES Logo" className="h-14 w-14 rounded-full border-2 border-white/40 object-cover flex-shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-bold text-lg leading-tight group-hover:underline">NATIONAL EMPOWERMENT SCHEME</h1>
              <p className="text-primary-foreground/80 text-xs">Training and Vocational Skills Registration Portal</p>
            </div>
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 border-4 border-secondary mb-4">
            <CheckCircle className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground">Your application has been received and is being processed.</p>
        </div>

        {/* Registration Slip */}
        <div id="registration-slip" className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-md">
          <div className="bg-primary text-primary-foreground p-5 text-center">
            <div className="flex justify-center mb-3">
              <img src={logoPath} alt="NES Logo" className="h-16 w-16 rounded-full border-2 border-white/40 object-cover" />
            </div>
            <h3 className="font-bold text-xl">FEDERAL REPUBLIC OF NIGERIA</h3>
            <h4 className="font-semibold text-primary-foreground/90">National Empowerment Scheme</h4>
            <p className="text-primary-foreground/75 text-sm mt-1">Training and Vocational Skills Registration Slip</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Registration Number</p>
              <p className="text-3xl font-bold text-primary tracking-wider" data-testid="text-registrationNumber">{regNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Full Name</p>
                <p className="font-semibold text-foreground mt-0.5" data-testid="text-applicantName">{name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Date of Registration</p>
                <p className="font-semibold text-foreground mt-0.5">{today}</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Important Notice</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Keep this registration number safe for future reference</li>
                <li>You will be contacted via phone/email with next steps</li>
                <li>Do not share your NIN or bank details with unauthorized persons</li>
                <li>For inquiries, contact the nearest NES office</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                <p>This is an official registration confirmation</p>
                <p>National Empowerment Scheme, Federal Republic of Nigeria</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Issued: {today}</p>
                <div className="w-16 h-8 border border-dashed border-border rounded mt-1 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Stamp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex-1" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print Registration Slip
          </Button>
          <Button onClick={() => setLocation("/")} className="flex-1" data-testid="button-home">
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #registration-slip, #registration-slip * { visibility: visible; }
          #registration-slip { position: fixed; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
