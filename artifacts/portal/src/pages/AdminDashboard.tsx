import { useState } from "react";
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
  LayoutDashboard, Users, BarChart2, LogOut, Search, Trash2, Eye, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import logoPath from "@assets/IMG-20260622-WA0001_1782115480105.jpg";

const CHART_COLORS = ["#1e3a8a","#166534","#1d4ed8","#15803d","#3730a3","#065f46","#1e40af","#14532d"];

type Tab = "dashboard" | "applicants" | "statistics";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedApplicant, setSelectedApplicant] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  const { data: stats, isLoading: statsLoading } = useGetApplicantStats({
    query: { queryKey: getGetApplicantStatsQueryKey() },
  });

  const listParams = { search: search || undefined, page, limit: 15 };
  const { data: applicantsList, isLoading: listLoading } = useListApplicants(listParams, {
    query: { queryKey: getListApplicantsQueryKey(listParams) },
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

  if (!me) {
    setLocation("/admin/login");
    return null;
  }

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

  const totalPages = applicantsList ? Math.ceil(applicantsList.total / 15) : 1;

  const StatCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
    <div className={`bg-card border border-card-border rounded-xl p-5 shadow-sm`}>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`} data-testid={`stat-${label.toLowerCase().replace(/\s/g,"-")}`}>{value}</p>
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
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-logout">
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
            <button
              key={id}
              onClick={() => setTab(id)}
              data-testid={`nav-${id}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
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
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium flex-1 justify-center transition-colors ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
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
                            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Reg. Number</th>
                            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                            <th className="text-left py-2 px-3 text-muted-foreground font-medium">State</th>
                            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentRegistrations.map((a) => (
                            <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-xs text-primary">{a.registrationNumber}</td>
                              <td className="py-2.5 px-3 font-medium">{a.fullName}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{a.state}</td>
                              <td className="py-2.5 px-3">
                                <Badge variant={a.status === "submitted" ? "default" : "secondary"} className="text-xs">
                                  {a.status}
                                </Badge>
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

          {tab === "applicants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold text-foreground">Applicants</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    data-testid="input-search"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search by name, email, reg. number..."
                    className="pl-9 w-72"
                  />
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Reg. Number</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Full Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold hidden md:table-cell">State</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold hidden lg:table-cell">Skills</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Actions</th>
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
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors" data-testid={`row-applicant-${a.id}`}>
                          <td className="py-3 px-4 font-mono text-xs text-primary">{a.registrationNumber}</td>
                          <td className="py-3 px-4 font-medium">{a.fullName}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{a.state}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {a.skills.slice(0, 2).map(s => (
                                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                              ))}
                              {a.skills.length > 2 && <Badge variant="outline" className="text-xs">+{a.skills.length - 2}</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={a.status === "submitted" ? "default" : "secondary"} className="text-xs">{a.status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedApplicant(a as never)} data-testid={`button-view-${a.id}`} className="h-7 w-7 p-0">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} data-testid={`button-delete-${a.id}`} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!listLoading && (!applicantsList?.data.length) && (
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
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p-1)} disabled={page === 1} data-testid="button-prevPage">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= totalPages} data-testid="button-nextPage">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                        <Pie data={stats.bySkill} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name.split("/")[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
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
                        <Pie data={stats.byEmploymentStatus} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} fontSize={10}>
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

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApplicant(null)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedApplicant.fullName as string}</h3>
                <p className="text-sm text-primary font-mono">{selectedApplicant.registrationNumber as string}</p>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {[
                ["Personal", ["fullName","gender","dateOfBirth","phoneNumber","email","state","lga","nin","bankName","bankAccountNumber"]],
                ["Education", ["highestEducation","schoolAttended","graduationYear"]],
                ["Training", ["trainingExpectation","employmentStatus","hasPreviousExperience"]],
              ].map(([section, fields]) => (
                <div key={section as string}>
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground mb-2">{section as string}</h4>
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
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedApplicant.id as number)} data-testid="button-deleteModal">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
