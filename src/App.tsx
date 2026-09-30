import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell, type NavItem } from "./components/AppShell";
import { Dashboard } from "./pages/app/Dashboard";
import { Enquiries } from "./pages/app/Enquiries";
import { Pipeline } from "./pages/app/Pipeline";
import { DemoStoreProvider } from "./state/store";

const OWNER_NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/pipeline", label: "Pipeline" },
  { to: "/app/enquiries", label: "WhatsApp agent" },
];

export function App() {
  return (
    <DemoStoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/app" element={<AppShell nav={OWNER_NAV} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="enquiries" element={<Enquiries />} />
          </Route>
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </DemoStoreProvider>
  );
}
