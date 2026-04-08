import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Rankings from "@/pages/Rankings";
import FundDetail from "@/pages/FundDetail";
import CategoryComparison from "@/pages/CategoryComparison";
import TrusteeComparison from "@/pages/TrusteeComparison";
import { BarChart3, Building2, Trophy } from "lucide-react";

const queryClient = new QueryClient();

const navItems = [
  { href: "/", label: "排名", icon: Trophy },
  { href: "/category", label: "類別", icon: BarChart3 },
  { href: "/trustee", label: "受託人", icon: Building2 },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden safe-bottom">
      <div className="grid grid-cols-3 h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav() {
  const [location] = useLocation();
  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = location === href || (href !== "/" && location.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/60 hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label === "排名" ? "基金排名" : label === "類別" ? "類別比較" : "受託人比較"}
          </Link>
        );
      })}
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-[11px] tracking-tight">MPF</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-sm leading-tight text-foreground">MPF Compare</div>
                <div className="text-[10px] text-muted-foreground leading-tight">強積金比較平台</div>
              </div>
            </Link>
            <DesktopNav />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-20 md:pb-6">
        {children}
      </main>

      <BottomNav />
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
              <h1 className="text-2xl font-bold">404</h1>
              <Link href="/" className="text-primary mt-2 inline-block text-sm">返回首頁</Link>
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
