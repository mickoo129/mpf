import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Rankings from "@/pages/Rankings";
import FundDetail from "@/pages/FundDetail";
import CategoryComparison from "@/pages/CategoryComparison";
import TrusteeComparison from "@/pages/TrusteeComparison";
import { BarChart3, Building2, Trophy, Menu, X } from "lucide-react";
import { useState } from "react";

const queryClient = new QueryClient();

function NavLink({ href, children, icon, onClick }: { href: string; children: React.ReactNode; icon: React.ReactNode; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MPF</span>
              </div>
              <span className="font-bold text-lg hidden sm:block">MPF Compare</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/" icon={<Trophy className="h-4 w-4" />}>基金排名</NavLink>
              <NavLink href="/category" icon={<BarChart3 className="h-4 w-4" />}>類別比較</NavLink>
              <NavLink href="/trustee" icon={<Building2 className="h-4 w-4" />}>受託人比較</NavLink>
            </nav>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-1">
            <NavLink href="/" icon={<Trophy className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>基金排名</NavLink>
            <NavLink href="/category" icon={<BarChart3 className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>類別比較</NavLink>
            <NavLink href="/trustee" icon={<Building2 className="h-4 w-4" />} onClick={() => setMobileMenuOpen(false)}>受託人比較</NavLink>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs text-muted-foreground text-center">
            MPF Compare - 強積金基金比較工具 | 數據僅供參考，不構成投資建議 | 基金價格及回報可能與實際有所不同
          </p>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Rankings} />
        <Route path="/fund/:id" component={FundDetail} />
        <Route path="/category" component={CategoryComparison} />
        <Route path="/trustee" component={TrusteeComparison} />
        <Route>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold">404 - 找不到頁面</h1>
              <Link href="/" className="text-primary mt-2 inline-block">返回首頁</Link>
            </div>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
