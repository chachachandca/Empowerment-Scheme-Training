import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useGetMe,
  useGetApplicantStats,
  useListApplicants,
  useDeleteApplicant,
  useAdminLogout,
  getGetApplicantStatsQueryKey,
  getListApplicantsQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Users, BarChart2, LogOut, Search, Trash2, Eye, X,
  ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet, Filter, Printer,
} from "lucide-react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const CHART_COLORS = ["#1e3a8a","#166534","#1d4ed8","#15803d","#3730a3","#065f46","#1e40af","#14532d"];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const SKILLS_OPTIONS = [
  "Tailoring/Fashion Design","Hairdressing/Barbing","Catering & Baking",
  "Agriculture/Farming","Welding/Fabrication","Electrical Installation",
  "Plumbing","ICT/Computer Skills","Carpentry","Soap/Cosmetics Production","Other",
];

type Tab = "dashboard" | "applicants" | "statistics";
type Applicant = Record<string, unknown>;

function flattenApplicant(a: Applicant) {
  return {
    "Reg. Number": a.registrationNumber,
    "Full Name": a.fullName,
    Gender: a.gender,
    "Date of Birth": a.dateOfBirth,
    Phone: a.phoneNumber,
    Email: a.email,
    State: a.state,
    LGA: a.lga,
    "State of Origin": a.stateOfOrigin,
    "LGA of Origin": a.lgaOfOrigin,
    NIN: a.nin,
    "Bank Name": a.bankName,
    "Account No.": a.bankAccountNumber,
    Education: a.highestEducation,
    "School Attended": a.schoolAttended,
    "Graduation Year": a.graduationYear,
    Skills: Array.isArray(a.skills) ? (a.skills as string[]).join(", ") : "",
    "Employment Status": a.employmentStatus,
    "Training Expectation": a.trainingExpectation,
    Status: a.status,
    "Registered On": a.createdAt ? new Date(a.createdAt as string).toLocaleDateString("en-NG") : "",
  };
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [page, setPage] = useState(1);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slipRef = useRef<HTMLDivElement>(null);

  const { data: me, isLoading: meLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  const { data: stats, isLoading: statsLoading } = useGetApplicantStats({
    query: { queryKey: getGetApplicantStatsQueryKey() },
  });

  const listParams = {
    search: search || undefined,
    state: filterState || undefined,
    skill: filterSkill || undefined,
    page,
    limit: 15,
  };
  const { data: applicantsList, isLoading: listLoading } = useListApplicants(listParams, {
    query: { queryKey: getListApplicantsQueryKey(listParams) },
  });

  // For exports we fetch all matching (no pagination)
  const exportParams = {
    search: search || undefined,
    state: filterState || undefined,
    skill: filterSkill || undefined,
    limit: 10000,
    page: 1,
  };
  const { data: allForExport } = useListApplicants(exportParams, {
    query: { queryKey: getListApplicantsQueryKey(exportParams), enabled: tab === "applicants" },
  });

  const deleteApplicant = useDeleteApplicant();
  const adminLogout = useAdminLogout();

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!me) { setLocation("/admin/login"); return null; }

  const handleLogout = () => {
    adminLogout.mutate(undefined, {
      onSuccess: () => { queryClient.clear(); setLocation("/admin/login"); },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this applicant?")) return;
    deleteApplicant.mutate({ id } as never, {
      onSuccess: () => {
        toast({ title: "Applicant deleted" });
        queryClient.invalidateQueries({ queryKey: getListApplicantsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApplicantStatsQueryKey() });
        if (selectedApplicant && (selectedApplicant.id as number) === id) setSelectedApplicant(null);
      },
      onError: () => toast({ title: "Failed to delete applicant", variant: "destructive" }),
    });
  };

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleFilterState = (val: string) => { setFilterState(val); setPage(1); };
  const handleFilterSkill = (val: string) => { setFilterSkill(val); setPage(1); };

  const totalPages = applicantsList ? Math.ceil(applicantsList.total / 15) : 1;
  const rows = allForExport?.data ?? applicantsList?.data ?? [];
  const activeFilters = [filterState, filterSkill].filter(Boolean).length;

  // ── Export helpers ────────────────────────────────────────────────
  const exportCSV = () => {
    const flat = rows.map(r => flattenApplicant(r as Applicant));
    if (!flat.length) { toast({ title: "No data to export" }); return; }
    const headers = Object.keys(flat[0]);
    const csvRows = [headers.join(","), ...flat.map(r => headers.map(h => `"${String((r as Record<string,unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "NES_Applicants.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${flat.length} records as CSV` });
  };

  const exportExcel = () => {
    const flat = rows.map(r => flattenApplicant(r as Applicant));
    if (!flat.length) { toast({ title: "No data to export" }); return; }
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applicants");
    XLSX.writeFile(wb, "NES_Applicants.xlsx");
    toast({ title: `Exported ${flat.length} records as Excel` });
  };

  const exportPDF = () => {
    const flat = rows.map(r => flattenApplicant(r as Applicant));
    if (!flat.length) { toast({ title: "No data to export" }); return; }
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("National Empowerment Scheme — Applicants Report", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString("en-NG")}   Total: ${flat.length}`, 14, 21);
    const cols = ["Reg. Number","Full Name","Gender","State","Skills","Education","Status","Registered On"];
    const tableRows = flat.map(r => cols.map(c => String((r as Record<string,unknown>)[c] ?? "")));
    autoTable(doc, {
      head: [cols], body: tableRows, startY: 25,
      headStyles: { fillColor: [30, 58, 138], fontSize: 8, cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { left: 14, right: 14 },
    });
    doc.save("NES_Applicants.pdf");
    toast({ title: `Exported ${flat.length} records as PDF` });
  };

  const downloadRegistrationSlip = (a: Applicant) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header band
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FEDERAL REPUBLIC OF NIGERIA", pageW / 2, 14, { align: "center" });
    doc.setFontSize(13);
    doc.text("National Empowerment Scheme", pageW / 2, 22, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Training and Vocational Skills — Registration Slip", pageW / 2, 30, { align: "center" });

    // Reg number
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Registration Number", pageW / 2, 50, { align: "center" });
    doc.setFontSize(20);
    doc.text(String(a.registrationNumber ?? ""), pageW / 2, 60, { align: "center" });

    doc.setDrawColor(200, 210, 230);
    doc.line(14, 65, pageW - 14, 65);

    // Details table
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const fields: [string, string][] = [
      ["Full Name", String(a.fullName ?? "")],
      ["Gender", String(a.gender ?? "")],
      ["Date of Birth", String(a.dateOfBirth ?? "")],
      ["Phone Number", String(a.phoneNumber ?? "")],
      ["Email Address", String(a.email ?? "")],
      ["State of Residence", String(a.state ?? "")],
      ["LGA", String(a.lga ?? "")],
      ["State of Origin", String(a.stateOfOrigin ?? "")],
      ["NIN", String(a.nin ?? "")],
      ["Education", String(a.highestEducation ?? "")],
      ["School Attended", String(a.schoolAttended ?? "")],
      ["Skills", Array.isArray(a.skills) ? (a.skills as string[]).join(", ") : ""],
      ["Employment Status", String(a.employmentStatus ?? "")],
      ["Training Expectation", String(a.trainingExpectation ?? "")],
      ["Bank Name", String(a.bankName ?? "")],
      ["Account Number", String(a.bankAccountNumber ?? "")],
      ["Date Submitted", a.createdAt ? new Date(a.createdAt as string).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" }) : ""],
    ];

    autoTable(doc, {
      body: fields,
      startY: 68,
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [240, 245, 255] }, 1: { cellWidth: 120 } },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    // Footer notice
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, finalY, pageW - 28, 24, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text("• Keep this registration number safe for future reference.", 18, finalY + 7);
    doc.text("• You will be contacted with further instructions via phone/email.", 18, finalY + 13);
    doc.text("• Do not share your NIN or bank details with unauthorized persons.", 18, finalY + 19);

    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text("This is an official registration confirmation — National Empowerment Scheme, Federal Republic of Nigeria", pageW / 2, 285, { align: "center" });

    doc.save(`NES_Slip_${String(a.registrationNumber ?? "")}.pdf`);
    toast({ title: "Registration slip downloaded" });
  };

  // ── Sub-components ────────────────────────────────────────────────
  const StatCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
    <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 group">
            <img src={logoPath} alt="NES Logo" className="h-10 w-10 rounded-full border-2 border-white/40 object-cover flex-shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-bold text-base leading-tight group-hover:underline">NATIONAL EMPOWERMENT SCHEME</h1>
              <p className="text-primary-foreground/75 text-xs">Admin Dashboard</p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground/80 hidden sm:block">Welcome, <span className="font-semibold">{(me as Record<string, unknown>).username as string}</span></span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-48 flex-shrink-0 gap-1">
          {([
            ["dashboard", "Dashboard", LayoutDashboard],
            ["applicants", "Applicants", Users],
            ["statistics", "Statistics", BarChart2],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </button>
          ))}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full">
          <div className="flex gap-1 mb-4 bg-card border border-border rounded-lg p-1">
            {([
              ["dashboard", "Dashboard", LayoutDashboard],
              ["applicants", "Applicants", Users],
              ["statistics", "Statistics", BarChart2],
            ] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium flex-1 justify-center transition-colors ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* DASHBOARD TAB */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Dashboard Overview</h2>
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse bg-muted/40" />)}
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label="Total Registrations" value={stats.totalRegistrations} color="text-primary" />
                    <StatCard label="Submitted" value={stats.submittedCount} color="text-secondary" />
                    <StatCard label="Drafts" value={stats.draftCount} color="text-muted-foreground" />
                    <StatCard label="Male" value={stats.maleCount} color="text-blue-600" />
                    <StatCard label="Female" value={stats.femaleCount} color="text-purple-600" />
                    <StatCard label="Other Gender" value={stats.otherGenderCount} color="text-orange-600" />
                  </div>
                  <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-foreground mb-4">Recent Registrations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            {["Reg. Number","Name","State","Status"].map(h => (
                              <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentRegistrations.map((a) => (
                            <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-xs text-primary">{a.registrationNumber}</td>
                              <td className="py-2.5 px-3 font-medium">{a.fullName}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{a.state}</td>
                              <td className="py-2.5 px-3">
                                <Badge variant={a.status === "submitted" ? "default" : "secondary"} className="text-xs">{a.status}</Badge>
                              </td>
                            </tr>
                          ))}
                          {stats.recentRegistrations.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No registrations yet</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* APPLICANTS TAB */}
          {tab === "applicants" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground mr-auto">Applicants</h2>
                {/* Export buttons */}
                <Button variant="outline" size="sm" onClick={exportCSV} title="Export CSV">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportExcel} title="Export Excel">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF} title="Export PDF">
                  <Download className="w-3.5 h-3.5 mr-1.5" />PDF
                </Button>
              </div>

              {/* Search + Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => handleSearch(e.target.value)}
                    placeholder="Search name, email, reg. number…" className="pl-9" />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}
                  className={showFilters || activeFilters > 0 ? "border-primary text-primary" : ""}>
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
                </Button>
                {(filterState || filterSkill) && (
                  <Button variant="ghost" size="sm" onClick={() => { setFilterState(""); setFilterSkill(""); setPage(1); }}
                    className="text-muted-foreground text-xs">
                    <X className="w-3 h-3 mr-1" />Clear
                  </Button>
                )}
              </div>

              {/* Filter dropdowns */}
              {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 bg-card border border-border rounded-xl">
                  <div className="flex-1 min-w-40">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">State</label>
                    <select
                      value={filterState}
                      onChange={e => handleFilterState(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">All States</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Skill</label>
                    <select
                      value={filterSkill}
                      onChange={e => handleFilterSkill(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">All Skills</option>
                      {SKILLS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Active filter pills */}
              {(filterState || filterSkill) && (
                <div className="flex flex-wrap gap-2">
                  {filterState && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      State: {filterState}
                      <button onClick={() => handleFilterState("")}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterSkill && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                      Skill: {filterSkill}
                      <button onClick={() => handleFilterSkill("")}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {applicantsList && (
                    <span className="text-xs text-muted-foreground self-center">{applicantsList.total} result{applicantsList.total !== 1 ? "s" : ""}</span>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {["Reg. Number","Full Name","State","Skills","Status","Actions"].map(h => (
                          <th key={h} className={`text-left py-3 px-4 text-muted-foreground font-semibold ${h === "State" ? "hidden md:table-cell" : ""} ${h === "Skills" ? "hidden lg:table-cell" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {listLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td colSpan={6} className="py-4 px-4"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                          </tr>
                        ))
                      ) : applicantsList?.data.map(a => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-primary">{a.registrationNumber}</td>
                          <td className="py-3 px-4 font-medium">{a.fullName}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{a.state}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {a.skills.slice(0, 2).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                              {a.skills.length > 2 && <Badge variant="outline" className="text-xs">+{a.skills.length - 2}</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={a.status === "submitted" ? "default" : "secondary"} className="text-xs">{a.status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(a as never)} className="h-7 w-7 p-0" title="View">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => downloadRegistrationSlip(a as never)} className="h-7 w-7 p-0 text-primary hover:text-primary" title="Download slip">
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!listLoading && !applicantsList?.data.length && (
                        <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No applicants found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {applicantsList && applicantsList.total > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page-1)*15)+1}–{Math.min(page*15, applicantsList.total)} of {applicantsList.total}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p-1)} disabled={page === 1}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= totalPages}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATISTICS TAB */}
          {tab === "statistics" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Statistics</h2>
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-64 animate-pulse bg-muted/40" />)}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-foreground mb-4">Registrations by State (Top 10)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.byState} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-45} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-foreground mb-4">Skills Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={stats.bySkill} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75}
                          label={({ name, percent }) => `${(name as string).split("/")[0]} ${((percent as number)*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                          {stats.bySkill.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-foreground mb-4">Education Level</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.byEducation} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                        <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-foreground mb-4">Employment Status</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={stats.byEmploymentStatus} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75}
                          label={({ name, percent }) => `${String(name)} ${((percent as number)*100).toFixed(0)}%`} fontSize={10}>
                          {stats.byEmploymentStatus.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[(idx+2) % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {/* ── APPLICANT DETAIL MODAL ── */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApplicant(null)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedApplicant.fullName as string}</h3>
                <p className="text-sm text-primary font-mono">{selectedApplicant.registrationNumber as string}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadRegistrationSlip(selectedApplicant)} className="text-primary border-primary/30 hover:bg-primary/5">
                  <Printer className="w-3.5 h-3.5 mr-1.5" />Download Slip
                </Button>
                <button onClick={() => setSelectedApplicant(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4 text-sm" ref={slipRef}>
              {[
                ["Personal", ["fullName","gender","dateOfBirth","phoneNumber","email","state","lga","nin","bankName","bankAccountNumber"]],
                ["Education", ["highestEducation","schoolAttended","graduationYear"]],
                ["Training", ["trainingExpectation","employmentStatus","hasPreviousExperience"]],
              ].map(([section, fields]) => (
                <div key={section as string}>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">{section as string}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(fields as string[]).map(field => (
                      <div key={field} className="bg-muted/30 rounded-md p-2">
                        <p className="text-xs text-muted-foreground capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="font-medium text-foreground mt-0.5 truncate">{String(selectedApplicant[field] ?? "—")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {((selectedApplicant.skills as string[]) || []).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <Badge variant={selectedApplicant.status === "submitted" ? "default" : "secondary"}>{selectedApplicant.status as string}</Badge>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedApplicant.id as number)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
