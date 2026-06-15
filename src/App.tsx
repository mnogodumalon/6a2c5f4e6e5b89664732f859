import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import VeVerwaltungPage from '@/pages/VeVerwaltungPage';
import VeVerwaltungDetailPage from '@/pages/VeVerwaltungDetailPage';
import FotodokumentationPage from '@/pages/FotodokumentationPage';
import FotodokumentationDetailPage from '@/pages/FotodokumentationDetailPage';
import KommunikationPage from '@/pages/KommunikationPage';
import KommunikationDetailPage from '@/pages/KommunikationDetailPage';
import TagesberichtePage from '@/pages/TagesberichtePage';
import TagesberichteDetailPage from '@/pages/TagesberichteDetailPage';
import BaustellenPage from '@/pages/BaustellenPage';
import BaustellenDetailPage from '@/pages/BaustellenDetailPage';
import VorOrtChecklistePage from '@/pages/VorOrtChecklistePage';
import VorOrtChecklisteDetailPage from '@/pages/VorOrtChecklisteDetailPage';
import LeitungsauskunftPage from '@/pages/LeitungsauskunftPage';
import LeitungsauskunftDetailPage from '@/pages/LeitungsauskunftDetailPage';
import MaengelerfassungPage from '@/pages/MaengelerfassungPage';
import MaengelerfassungDetailPage from '@/pages/MaengelerfassungDetailPage';
import PublicFormVeVerwaltung from '@/pages/public/PublicForm_VeVerwaltung';
import PublicFormFotodokumentation from '@/pages/public/PublicForm_Fotodokumentation';
import PublicFormKommunikation from '@/pages/public/PublicForm_Kommunikation';
import PublicFormTagesberichte from '@/pages/public/PublicForm_Tagesberichte';
import PublicFormBaustellen from '@/pages/public/PublicForm_Baustellen';
import PublicFormVorOrtCheckliste from '@/pages/public/PublicForm_VorOrtCheckliste';
import PublicFormLeitungsauskunft from '@/pages/public/PublicForm_Leitungsauskunft';
import PublicFormMaengelerfassung from '@/pages/public/PublicForm_Maengelerfassung';
// <public:imports>
// </public:imports>
// <custom:imports>
const TagesberichtErstellenPage = lazy(() => import('@/pages/intents/TagesberichtErstellenPage'));
const MangelMeldenPage = lazy(() => import('@/pages/intents/MangelMeldenPage'));
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6a2c5f128320e49fee0782df" element={<PublicFormVeVerwaltung />} />
              <Route path="public/6a2c5f156476392f056b1b6d" element={<PublicFormFotodokumentation />} />
              <Route path="public/6a2c5f1737b1758cae8c5e36" element={<PublicFormKommunikation />} />
              <Route path="public/6a2c5f1b22f933a50d29cc67" element={<PublicFormTagesberichte />} />
              <Route path="public/6a2c5f0c38e206d8f43b2a0b" element={<PublicFormBaustellen />} />
              <Route path="public/6a2c5f14742c88e340e1e58a" element={<PublicFormVorOrtCheckliste />} />
              <Route path="public/6a2c5f169a7902a433caa841" element={<PublicFormLeitungsauskunft />} />
              <Route path="public/6a2c5f19fe95c4a9b239f807" element={<PublicFormMaengelerfassung />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="ve-verwaltung" element={<VeVerwaltungPage />} />
                <Route path="ve-verwaltung/:id" element={<VeVerwaltungDetailPage />} />
                <Route path="fotodokumentation" element={<FotodokumentationPage />} />
                <Route path="fotodokumentation/:id" element={<FotodokumentationDetailPage />} />
                <Route path="kommunikation" element={<KommunikationPage />} />
                <Route path="kommunikation/:id" element={<KommunikationDetailPage />} />
                <Route path="tagesberichte" element={<TagesberichtePage />} />
                <Route path="tagesberichte/:id" element={<TagesberichteDetailPage />} />
                <Route path="baustellen" element={<BaustellenPage />} />
                <Route path="baustellen/:id" element={<BaustellenDetailPage />} />
                <Route path="vor-ort-checkliste" element={<VorOrtChecklistePage />} />
                <Route path="vor-ort-checkliste/:id" element={<VorOrtChecklisteDetailPage />} />
                <Route path="leitungsauskunft" element={<LeitungsauskunftPage />} />
                <Route path="leitungsauskunft/:id" element={<LeitungsauskunftDetailPage />} />
                <Route path="maengelerfassung" element={<MaengelerfassungPage />} />
                <Route path="maengelerfassung/:id" element={<MaengelerfassungDetailPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                <Route path="intents/tagesbericht-erstellen" element={<Suspense fallback={null}><TagesberichtErstellenPage /></Suspense>} />
                <Route path="intents/mangel-melden" element={<Suspense fallback={null}><MangelMeldenPage /></Suspense>} />
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
