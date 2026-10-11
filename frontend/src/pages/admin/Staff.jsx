import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  Modal,
  PageHeader,
  StatusBadge,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
  smallBtn,
  smallDangerBtn,
} from "../../components/admin/AdminUi";
import {
  assignStaff,
  createStaff,
  deleteStaff,
  getOfficeCounters,
  getOffices,
  getStaff,
  updateStaff,
} from "../../services/adminApi";

// staffId is the MongoDB User._id
const staffIdOf = (member) => member._id || member.id;

/**
 * Office + counter pickers. The counter list is loaded from the selected
 * office only, so a counter from another office can never be chosen.
 */
function AssignmentFields({ offices, officeId, counterId, onChange, disabled }) {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!officeId) {
      setCounters([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getOfficeCounters(officeId)
      .then((list) => {
        if (!cancelled) {
          setCounters([...list].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [officeId]);

  return (
    <>
      <div>
        <label htmlFor="assignOffice" className={labelClass}>Office</label>
        <select
          id="assignOffice"
          value={officeId}
          onChange={(e) => onChange(e.target.value, "")}
          disabled={disabled}
          className={`${inputClass} backdrop-blur-md bg-white/80 border-slate-200/80 focus:bg-white transition-all`}
        >
          <option value="">Select an office</option>
          {offices.map((office) => (
            <option key={office._id} value={office._id}>{office.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="assignCounter" className={labelClass}>Counter</label>
        <select
          id="assignCounter"
          value={counterId}
          onChange={(e) => onChange(officeId, e.target.value)}
          disabled={disabled || !officeId || loading}
          className={`${inputClass} backdrop-blur-md bg-white/80 border-slate-200/80 focus:bg-white transition-all`}
        >
          <option value="">
            {!officeId ? "Select an office first" : loading ? "Loading counters..." : "Select a counter"}
          </option>
          {counters.map((counter) => (
            <option key={counter._id} value={counter._id}>
              {counter.name} (#{counter.number}) · {counter.status}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {officeId && !loading && !error && counters.length === 0 && (
          <p className="mt-1 text-xs text-amber-700 font-medium">
            This office has no counters. Create one on the Counters page first.
          </p>
        )}
      </div>
    </>
  );
}

const EMPTY_CREATE = { name: "", email: "", password: "", phone: "", officeId: "", counterId: "" };

export default function Staff({ user }) {
  const [staff, setStaff] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // modal: null | { type: "create" } | { type: "edit"|"assign"|"delete", member }
  const [modal, setModal] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [assignForm, setAssignForm] = useState({ officeId: "", counterId: "" });
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [staffList, officeList] = await Promise.all([getStaff(), getOffices()]);
      setStaff(staffList);
      setOffices(officeList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function closeModal() {
    if (!busy) setModal(null);
  }

  function openCreate() {
    setCreateForm(EMPTY_CREATE);
    setFormError("");
    setModal({ type: "create" });
  }

  function openEdit(member) {
    setEditForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
    });
    setFormError("");
    setModal({ type: "edit", member });
  }

  function openAssign(member) {
    setAssignForm({
      officeId: member.officeId?._id || "",
      counterId: member.counterId?._id || "",
    });
    setFormError("");
    setModal({ type: "assign", member });
  }

  function openDelete(member) {
    setFormError("");
    setModal({ type: "delete", member });
  }

  // Runs a mutation, then refreshes server data.
  async function run(action, onSuccessMessage) {
    setBusy(true);
    setFormError("");
    try {
      const result = await action();
      setModal(null);
      setNotice(result?.message || onSuccessMessage);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCreate(event) {
    event.preventDefault();
    const { name, email, password, phone, officeId, counterId } = createForm;

    if (!name.trim()) return setFormError("Name is required.");
    if (!email.trim()) return setFormError("Email is required.");
    if (password.length < 6) return setFormError("Password must be at least 6 characters.");
    if (!officeId) return setFormError("Select an office.");
    if (!counterId) return setFormError("Select a counter.");

    const body = {
      name: name.trim(),
      email: email.trim(),
      password,
      officeId,
      counterId,
    };
    if (phone.trim()) body.phone = phone.trim();

    run(() => createStaff(body), "Operator created.");
  }

  function handleEdit(event) {
    event.preventDefault();
    const name = editForm.name.trim();
    const email = editForm.email.trim();

    if (!name) return setFormError("Name is required.");
    if (!email) return setFormError("Email is required.");

    run(
      () =>
        updateStaff(staffIdOf(modal.member), {
          name,
          email,
          phone: editForm.phone.trim(),
        }),
      "Operator updated."
    );
  }

  function handleAssign(event) {
    event.preventDefault();
    if (!assignForm.officeId) return setFormError("Select an office.");
    if (!assignForm.counterId) return setFormError("Select a counter.");

    run(
      () => assignStaff(staffIdOf(modal.member), assignForm.officeId, assignForm.counterId),
      "Assignment updated."
    );
  }

  function handleDelete() {
    run(() => deleteStaff(staffIdOf(modal.member)), "Operator deleted.");
  }

  const formButtons = (label) => (
    <div className="flex gap-3 border-t border-slate-100/80 bg-slate-50/50 p-6 backdrop-blur-sm">
      <button type="button" onClick={closeModal} disabled={busy} className={`${secondaryBtn} flex-1 shadow-sm hover:bg-slate-100 transition-all`}>
        Cancel
      </button>
      <button type="submit" disabled={busy} className={`${primaryBtn} flex-1 shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all`}>
        {busy ? "Saving..." : label}
      </button>
    </div>
  );

  return (
    <AdminLayout user={user}>
      <div className="relative min-h-screen -m-6 p-6 lg:p-8">
        {/* Background image overlay matching reference aesthetic */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-fixed pointer-events-none opacity-25"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-teal-950/70 backdrop-blur-[2px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 lg:p-8">
            <PageHeader
              title="Staff Directory"
              description="Operators who manage counters. Each operator is assigned to one office and counter."
              action={
                !loading &&
                !error && (
                  <button type="button" onClick={openCreate} className={`${primaryBtn} shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:-translate-y-0.5 transition-all duration-200`}>
                    + Add operator
                  </button>
                )
              }
            />
          </div>

          <div className="space-y-6">
            {notice && (
              <Alert type="success" onClose={() => setNotice("")}>
                {notice}
              </Alert>
            )}

            {loading && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <LoadingBlock label="Loading staff..." />
              </div>
            )}
            {!loading && error && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <ErrorBlock message={error} onRetry={load} />
              </div>
            )}

            {!loading && !error && staff.length === 0 && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <EmptyState
                  icon="👥"
                  title="No operators yet"
                  description="Create an operator account and assign it to an office counter."
                  action={
                    <button type="button" onClick={openCreate} className={`${primaryBtn} shadow-lg shadow-teal-600/25`}>
                      + Add operator
                    </button>
                  }
                />
              </div>
            )}

            {!loading && !error && staff.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/75 backdrop-blur-xl shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200/60 bg-white/50 text-sm font-semibold text-slate-700">
                        <th className="px-6 py-5">Operator</th>
                        <th className="px-6 py-5">Phone</th>
                        <th className="px-6 py-5">Office</th>
                        <th className="px-6 py-5">Counter</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {staff.map((member) => (
                        <tr key={staffIdOf(member) || member.email} className="hover:bg-white/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 font-bold text-white shadow-md shadow-teal-600/20">
                                {(member.name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{member.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{member.phone || "—"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {member.officeId ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-800 font-medium text-xs">
                                {member.officeId.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium text-xs border border-amber-200/60">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {member.counterId ? (
                              <div className="flex items-center gap-2.5">
                                <span className="font-medium text-slate-900">{member.counterId.name}</span>
                                <StatusBadge status={member.counterId.status} />
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium text-xs border border-amber-200/60">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => openEdit(member)} className={`${smallBtn} hover:bg-slate-100 shadow-sm transition-all`}>Edit</button>
                              <button type="button" onClick={() => openAssign(member)} className={`${smallBtn} hover:bg-slate-100 shadow-sm transition-all`}>Assign</button>
                              <button type="button" onClick={() => openDelete(member)} className={`${smallDangerBtn} shadow-sm transition-all`}>Delete</button>
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
        </div>

        {modal?.type === "create" && (
          <Modal title="Add operator" subtitle="Creates an operator account and assigns it to a counter." onClose={closeModal}>
            <form onSubmit={handleCreate} noValidate>
              <div className="space-y-5 p-6 backdrop-blur-xl bg-white/90">
                {formError && <Alert>{formError}</Alert>}

                <div>
                  <label htmlFor="createName" className={labelClass}>Full name</label>
                  <input id="createName" type="text" value={createForm.name} disabled={busy}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                </div>
                <div>
                  <label htmlFor="createEmail" className={labelClass}>Email</label>
                  <input id="createEmail" type="email" value={createForm.email} disabled={busy}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                </div>
                <div>
                  <label htmlFor="createPassword" className={labelClass}>Password</label>
                  <input id="createPassword" type="password" autoComplete="new-password" value={createForm.password} disabled={busy}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                  <p className="mt-1 text-xs text-slate-500 font-medium">At least 6 characters.</p>
                </div>
                <div>
                  <label htmlFor="createPhone" className={labelClass}>
                    Phone <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input id="createPhone" type="tel" value={createForm.phone} disabled={busy}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                </div>

                <AssignmentFields
                  offices={offices}
                  officeId={createForm.officeId}
                  counterId={createForm.counterId}
                  disabled={busy}
                  onChange={(officeId, counterId) => setCreateForm({ ...createForm, officeId, counterId })}
                />
              </div>
              {formButtons("Create operator")}
            </form>
          </Modal>
        )}

        {modal?.type === "edit" && (
          <Modal title="Edit operator" subtitle="Name, email and phone. Use Assign to change office or counter." onClose={closeModal}>
            <form onSubmit={handleEdit} noValidate>
              <div className="space-y-5 p-6 backdrop-blur-xl bg-white/90">
                {formError && <Alert>{formError}</Alert>}

                <div>
                  <label htmlFor="editName" className={labelClass}>Full name</label>
                  <input id="editName" type="text" value={editForm.name} disabled={busy}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                </div>
                <div>
                  <label htmlFor="editEmail" className={labelClass}>Email</label>
                  <input id="editEmail" type="email" value={editForm.email} disabled={busy}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                </div>
                <div>
                  <label htmlFor="editPhone" className={labelClass}>Phone</label>
                  <input id="editPhone" type="tel" value={editForm.phone} disabled={busy}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={`${inputClass} backdrop-blur-md bg-white/80`} />
                </div>
              </div>
              {formButtons("Save changes")}
            </form>
          </Modal>
        )}

        {modal?.type === "assign" && (
          <Modal title="Assign operator" subtitle={modal.member.name} onClose={closeModal}>
            <form onSubmit={handleAssign} noValidate>
              <div className="space-y-5 p-6 backdrop-blur-xl bg-white/90">
                {formError && <Alert>{formError}</Alert>}
                <AssignmentFields
                  offices={offices}
                  officeId={assignForm.officeId}
                  counterId={assignForm.counterId}
                  disabled={busy}
                  onChange={(officeId, counterId) => setAssignForm({ officeId, counterId })}
                />
              </div>
              {formButtons("Save assignment")}
            </form>
          </Modal>
        )}

        {modal?.type === "delete" && (
          <ConfirmDialog
            title="Delete operator?"
            message={`${modal.member.name} (${modal.member.email}) will be permanently deleted. An operator whose counter is currently calling or serving a token cannot be deleted.`}
            confirmLabel="Delete operator"
            busy={busy}
            error={formError}
            onConfirm={handleDelete}
            onCancel={closeModal}
          />
        )}
      </div>
    </AdminLayout>
  );
}