import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  Modal,
  StatusBadge,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
  smallBtn,
  smallDangerBtn,
} from "../../components/admin/AdminUi";
import {
  createService,
  deactivateService,
  getOfficeServices,
  getOffices,
  updateService,
} from "../../services/adminApi";

const EMPTY_FORM = { name: "", description: "", averageServiceTime: "" };

export default function Services({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [offices, setOffices] = useState([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [officesError, setOfficesError] = useState("");

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");

  const [notice, setNotice] = useState("");

  // form modal: null | { mode: "create" } | { mode: "edit", service }
  const [formModal, setFormModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // deactivate confirm
  const [toDeactivate, setToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");

  // selected office comes from ?office=ID, falling back to the first office
  const requested = searchParams.get("office");
  const selectedOffice =
    offices.find((o) => o._id === requested) || offices[0] || null;
  const officeId = selectedOffice?._id;

  const loadOffices = useCallback(async () => {
    setOfficesLoading(true);
    setOfficesError("");
    try {
      setOffices(await getOffices());
    } catch (err) {
      setOfficesError(err.message);
    } finally {
      setOfficesLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    if (!officeId) return;
    setServicesLoading(true);
    setServicesError("");
    try {
      setServices(await getOfficeServices(officeId));
    } catch (err) {
      setServicesError(err.message);
    } finally {
      setServicesLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    loadOffices();
  }, [loadOffices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormModal({ mode: "create" });
  }

  function openEdit(service) {
    setForm({
      name: service.name || "",
      description: service.description || "",
      averageServiceTime: String(service.averageServiceTime ?? ""),
    });
    setFormError("");
    setFormModal({ mode: "edit", service });
  }

  function closeForm() {
    if (!saving) setFormModal(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const time = Number(form.averageServiceTime);

    if (!name) return setFormError("Service name is required.");
    if (!Number.isInteger(time) || time < 1) {
      return setFormError("Average service time must be a whole number of at least 1 minute.");
    }

    const body = {
      name,
      description: form.description.trim(),
      averageServiceTime: time,
    };

    setSaving(true);
    setFormError("");

    try {
      const result =
        formModal.mode === "edit"
          ? await updateService(formModal.service._id, body)
          : await createService(officeId, body);

      setFormModal(null);
      setNotice(result.message || "Saved.");
      await loadServices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setDeactivating(true);
    setDeactivateError("");

    try {
      const result = await deactivateService(toDeactivate._id);
      setToDeactivate(null);
      setNotice(result.message || "Service deactivated.");
      await loadServices();
    } catch (err) {
      setDeactivateError(err.message);
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <AdminLayout user={user}>
      {/* Immersive Hero Section with Forest Background & Overlay */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl mb-8">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay filter blur-[1px] scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=2000&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-emerald-950/40" />

        <div className="relative z-10 px-8 py-10 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-4 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Official Digital Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
              Manage <span className="text-emerald-400">Services</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
              Configure and maintain the services offered by each government office to keep public queues flowing smoothly.
            </p>
          </div>

          {selectedOffice && (
            <div className="flex-shrink-0">
              <button 
                type="button" 
                onClick={openCreate} 
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-600/20 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                + Add service
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {notice && (
          <Alert type="success" onClose={() => setNotice("")}>
            {notice}
          </Alert>
        )}

        {officesLoading && <LoadingBlock label="Loading offices..." />}
        {!officesLoading && officesError && (
          <ErrorBlock message={officesError} onRetry={loadOffices} />
        )}

        {!officesLoading && !officesError && offices.length === 0 && (
          <EmptyState icon="🏛️" title="No offices found" description="Services belong to an office, and none were returned by the backend." />
        )}

        {selectedOffice && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="max-w-md">
              <label htmlFor="officeSelect" className={labelClass}>
                Select Government Office
              </label>
              <select
                id="officeSelect"
                value={officeId}
                onChange={(e) => setSearchParams({ office: e.target.value })}
                className={`${inputClass} bg-slate-50/50 font-medium text-slate-800`}
              >
                {offices.map((office) => (
                  <option key={office._id} value={office._id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Only active services are listed. A deactivated service is hidden from citizens and from this list.</span>
            </div>
          </div>
        )}

        {servicesLoading && <LoadingBlock label="Loading services..." />}
        {!servicesLoading && servicesError && (
          <ErrorBlock message={servicesError} onRetry={loadServices} />
        )}

        {!servicesLoading && !servicesError && services.length === 0 && selectedOffice && (
          <EmptyState
            icon="📋"
            title="No active services"
            description={`${selectedOffice.name} has no active services yet.`}
            action={
              <button type="button" onClick={openCreate} className={primaryBtn}>
                + Add service
              </button>
            }
          />
        )}

        {!servicesLoading && !servicesError && services.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Office</th>
                    <th className="px-6 py-4">Avg. service time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((service) => (
                    <tr key={service._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{service.name}</p>
                        {service.description && (
                          <p className="mt-1 max-w-sm text-sm text-slate-500 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {selectedOffice.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {service.averageServiceTime} min
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button type="button" onClick={() => openEdit(service)} className={smallBtn}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeactivateError("");
                              setToDeactivate(service);
                            }}
                            className={smallDangerBtn}
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {formModal && (
        <Modal
          title={formModal.mode === "edit" ? "Edit service" : "Add service"}
          subtitle={selectedOffice?.name}
          onClose={closeForm}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5 p-6">
              {formError && <Alert>{formError}</Alert>}

              <div>
                <label htmlFor="serviceName" className={labelClass}>Service name</label>
                <input
                  id="serviceName"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={saving}
                  className={inputClass}
                  placeholder="e.g. Passport Renewal"
                />
              </div>

              <div>
                <label htmlFor="serviceDescription" className={labelClass}>
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="serviceDescription"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={saving}
                  className={inputClass}
                  placeholder="Briefly describe what this service entails..."
                />
              </div>

              <div>
                <label htmlFor="serviceTime" className={labelClass}>Average service time (minutes)</label>
                <input
                  id="serviceTime"
                  type="number"
                  min="1"
                  step="1"
                  value={form.averageServiceTime}
                  onChange={(e) => setForm({ ...form, averageServiceTime: e.target.value })}
                  disabled={saving}
                  className={inputClass}
                  placeholder="15"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 p-6 rounded-b-2xl">
              <button type="button" onClick={closeForm} disabled={saving} className={`${secondaryBtn} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={`${primaryBtn} flex-1`}>
                {saving ? "Saving..." : formModal.mode === "edit" ? "Save changes" : "Create service"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toDeactivate && (
        <ConfirmDialog
          title="Deactivate service?"
          message={`"${toDeactivate.name}" will be marked inactive and will no longer be offered to citizens. The service record is kept; it is not permanently deleted.`}
          confirmLabel="Deactivate"
          busy={deactivating}
          error={deactivateError}
          onConfirm={handleDeactivate}
          onCancel={() => setToDeactivate(null)}
        />
      )}
    </AdminLayout>
  );
}