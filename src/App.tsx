import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import type { NavItem } from "./components/AppShell";
import { Home } from "./pages/site/Home";
import { DemoStoreProvider } from "./state/store";

// The public website is the landing page; the owner console loads on demand.
const AppShell = lazy(() => import("./components/AppShell").then((module) => ({ default: module.AppShell })));
const Dashboard = lazy(() => import("./pages/app/Dashboard").then((module) => ({ default: module.Dashboard })));
const Pipeline = lazy(() => import("./pages/app/Pipeline").then((module) => ({ default: module.Pipeline })));
const Enquiries = lazy(() => import("./pages/app/Enquiries").then((module) => ({ default: module.Enquiries })));
const CheckIn = lazy(() => import("./pages/app/CheckIn").then((module) => ({ default: module.CheckIn })));
const Automations = lazy(() => import("./pages/app/Automations").then((module) => ({ default: module.Automations })));

const OWNER_NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/pipeline", label: "Pipeline" },
  { to: "/app/enquiries", label: "WhatsApp agent" },
  { to: "/app/automations", label: "Win-back automation" },
  { to: "/app/checkin", label: "Front-desk check-in" },
];

function Loading() {
  return (
    <p className="p-8 text-sm text-muted" role="status">
      Loading…
    </p>
  );
}

export function App() {
  return (
    <DemoStoreProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app" element={<AppShell nav={OWNER_NAV} />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="automations" element={<Automations />} />
              <Route path="checkin" element={<CheckIn />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DemoStoreProvider>
  );
}
