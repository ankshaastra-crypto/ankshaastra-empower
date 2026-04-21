import { lazy } from "react";
import { Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";

const AdminLayout = lazy(() => import("./components/AdminLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Inquiries = lazy(() => import("./pages/Inquiries"));
const Reports = lazy(() => import("./pages/Reports"));
const Revenue = lazy(() => import("./pages/Revenue"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));

export const adminV2Routes = (
  <Route
    path="/admin/v2"
    element={
      <ToastProvider>
        <AdminLayout />
      </ToastProvider>
    }
  >
    <Route index element={<Dashboard />} />
    <Route path="clients" element={<Clients />} />
    <Route path="clients/:id" element={<ClientDetail />} />
    <Route path="inquiries" element={<Inquiries />} />
    <Route path="reports" element={<Reports />} />
    <Route path="revenue" element={<Revenue />} />
    <Route path="workflows" element={<Workflows />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="settings" element={<Settings />} />
  </Route>
);
