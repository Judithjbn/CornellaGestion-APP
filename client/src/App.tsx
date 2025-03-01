import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import FormsPage from "@/pages/admin/forms";
import FormView from "@/pages/form-view";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { FileText, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logoutMutation } = useAuth();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/admin/forms">
                  <FileText className="mr-2" />
                  <span>Formularios</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Forms Dashboard</h1>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}


function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/auth" />
      </Route>
      <Route path="/admin/forms">
        {() => (
           <ProtectedRoute>
           <DashboardLayout>
             <FormsPage />
           </DashboardLayout>
         </ProtectedRoute>
        )}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/form/:id" component={FormView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;