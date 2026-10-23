import React, { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { apiRequest, ApiRequestError } from "../api/client";
import { PageHeader } from "../components/ui/PageHeader";
import { buttonClass } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

type Staff = { id:number; username:string; first_name:string; last_name:string; email:string; role:string; branch_id:number|null; branch_name:string|null; is_active:boolean; last_login:string|null };
const roles = [{value:"manager",label:"Manager"},{value:"cashier",label:"Cashier"},{value:"inventory",label:"Inventory"},{value:"accountant",label:"Accountant"},{value:"owner",label:"Owner"}];
const inputClass="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink";
const initial={username:"",first_name:"",last_name:"",email:"",role:"cashier",branch_id:"",password:""};
function asList<T>(value: unknown): T[] {
 if (Array.isArray(value)) return value as T[];
 if (value && typeof value === "object" && "results" in value && Array.isArray((value as {results?:unknown}).results)) return (value as {results:T[]}).results;
 return [];
}
function friendlyCreateError(error: unknown): string {
 if (!(error instanceof ApiRequestError)) return error instanceof Error ? error.message : "Please check the details and try again.";
 const payload = error.payload;
 if (!payload || typeof payload !== "object") return error.message;
 const messages: string[] = [];
 for (const [field, raw] of Object.entries(payload)) {
   const items = Array.isArray(raw) ? raw : [raw];
   for (const item of items) {
     if (typeof item !== "string") continue;
     const message = item.toLowerCase();
     if (field === "password" && message.includes("too common")) messages.push("This password is easy to guess. Choose a less predictable password.");
     else if (field === "password" && message.includes("entirely numeric")) messages.push("Add letters to your password; it can't contain only numbers.");
     else if (field === "password" && message.includes("too short")) messages.push("Use a longer password to keep this account secure.");
     else if (field === "password" && message.includes("too similar")) messages.push("Avoid using personal details such as the staff member's name or username in the password.");
     else if (field === "password") messages.push(item);
     else if (field === "username" && message.includes("already exists")) messages.push("That username is already in use. Choose a different username.");
     else if (field === "email" && message.includes("valid")) messages.push("Enter a valid email address.");
     else if (field === "branch_id") messages.push("Choose an active branch. If no branches appear, create a branch first.");
     else if (field === "role") messages.push(item);
     else if (field === "detail" || field === "non_field_errors") messages.push(item);
     else messages.push(item);
   }
 }
 return messages.length ? [...new Set(messages)].join(" ") : error.message;
}
export function UserManagement() {
 const {user}=useAuth();
 const [staff,setStaff]=useState<Staff[]>([]);
 const [branches,setBranches]=useState<Array<{id:number;name:string}>>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [showForm,setShowForm]=useState(false);
 const [saving,setSaving]=useState(false);
 const [createError,setCreateError]=useState("");
 const [draft,setDraft]=useState(initial);
 const canAssignOwner=Boolean(user?.is_superuser||user?.role==="owner");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const [peopleResponse,branchResponse]=await Promise.all([apiRequest<unknown>("/api/v1/auth/users/"),apiRequest<unknown>("/api/v1/auth/branches/")]);setStaff(asList<Staff>(peopleResponse));setBranches(asList<{id:number;name:string}>(branchResponse));}catch(e){setError(e instanceof Error?e.message:"Could not load staff accounts.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 async function create(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setCreateError("");try{const body={...draft,branch_id:draft.branch_id?Number(draft.branch_id):null};const person=await apiRequest<Staff>("/api/v1/auth/users/",{method:"POST",body});setStaff(p=>[...p,person].sort((a,b)=>a.username.localeCompare(b.username)));setDraft(initial);setShowForm(false);toast.success("Staff account created");}catch(e){const message=friendlyCreateError(e);setCreateError(message);toast.error("Could not create staff account",{description:message});}finally{setSaving(false);}}
 async function toggle(person:Staff){try{const updated=await apiRequest<Staff>(`/api/v1/auth/users/${person.id}/`,{method:"PATCH",body:{is_active:!person.is_active}});setStaff(p=>p.map(x=>x.id===updated.id?updated:x));toast.success(updated.is_active?"Staff account activated":"Staff account deactivated");}catch(e){toast.error("Account status could not be changed",{description:e instanceof Error?e.message:"Please try again."});}}
 return <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
 <PageHeader title="User Management" description="Manage staff accounts, roles, branch assignments and account access." actions={<button className={buttonClass("primary")} onClick={()=>{setShowForm(v=>!v);setCreateError("");}} type="button">{showForm?<X className="h-4 w-4"/>:<Plus className="h-4 w-4"/>}{showForm?"Cancel":"Add staff member"}</button>}/>
 {error&&<div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm"><p className="font-semibold">Staff accounts could not be loaded</p><p className="mt-1">{error}</p><button type="button" className="mt-2 underline" onClick={()=>void load()}>Retry</button></div>}
 {showForm&&<form onSubmit={create} className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-card"><h2 className="font-semibold">Create staff account</h2><p className="text-sm text-ink-muted">Set a temporary password and share it securely with the staff member.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {([{key:"username",label:"Username",required:true},{key:"first_name",label:"First name"},{key:"last_name",label:"Last name"},{key:"email",label:"Email",type:"email"}] as const).map(f=><label key={f.key} className="text-sm font-medium">{f.label}<input className={inputClass+" mt-1"} required={f.required} type={"type" in f?f.type:"text"} value={draft[f.key]} onChange={e=>{setDraft(p=>({...p,[f.key]:e.target.value}));setCreateError("");}}/></label>)}
 <label className="text-sm font-medium">Role<select className={inputClass+" mt-1"} value={draft.role} onChange={e=>setDraft(p=>({...p,role:e.target.value}))}>{roles.filter(r=>canAssignOwner||r.value!=="owner").map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
 <label className="text-sm font-medium">Branch<select className={inputClass+" mt-1"} value={draft.branch_id} onChange={e=>setDraft(p=>({...p,branch_id:e.target.value}))}><option value="">No branch assigned</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 <label className="text-sm font-medium sm:col-span-2">Temporary password<input required minLength={8} type="password" autoComplete="new-password" className={inputClass+" mt-1"} value={draft.password} aria-describedby="password-help" onChange={e=>{setDraft(p=>({...p,password:e.target.value}));setCreateError("");}}/><span id="password-help" className="mt-1 block text-xs font-normal text-ink-muted">Choose a long, hard-to-guess password. Avoid common passwords, number-only passwords, and personal details.</span></label>
 </div>
 {createError&&<div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm"><p className="font-semibold">Please review the following</p><p className="mt-1">{createError}</p></div>}
 <button disabled={saving} className={buttonClass("primary")} type="submit">{saving?"Creating…":"Create account"}</button></form>}
 <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card"><div className="flex items-center justify-between border-b border-line p-4"><div><h2 className="font-semibold">Staff directory</h2><p className="text-sm text-ink-muted">{loading?"Loading…":`${staff.length} account${staff.length===1?"":"s"}`}</p></div><button aria-label="Refresh staff" title="Refresh staff" type="button" disabled={loading} onClick={()=>void load()} className={buttonClass("secondary")}><RefreshCw className="h-4 w-4"/></button></div>
 {loading?<p className="p-8 text-sm text-ink-muted">Loading staff from Django…</p>:staff.length===0?<div className="p-10 text-center"><UserRound className="mx-auto h-8 w-8 text-ink-subtle"/><p className="mt-3 font-medium">No staff accounts found</p><p className="text-sm text-ink-muted">Create a staff account to get started.</p></div>:<div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-canvas text-xs uppercase text-ink-muted"><tr><th className="px-4 py-3">Staff member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-line">{staff.map(person=><tr key={person.id}><td className="px-4 py-3"><p className="font-medium">{person.first_name||person.last_name?`${person.first_name} ${person.last_name}`.trim():person.username}</p><p className="text-xs text-ink-muted">{person.username} · {person.email||"No email"}</p></td><td className="px-4 py-3 capitalize">{person.role}</td><td className="px-4 py-3">{person.branch_name||"Unassigned"}</td><td className="px-4 py-3">{person.last_login?new Date(person.last_login).toLocaleString():"Never"}</td><td className="px-4 py-3"><span className={person.is_active?"text-success":"text-danger"}>{person.is_active?"Active":"Inactive"}</span></td><td className="px-4 py-3"><button type="button" disabled={person.id===user?.id} onClick={()=>void toggle(person)} className="font-medium text-accent hover:underline disabled:opacity-40">{person.is_active?"Deactivate":"Activate"}</button></td></tr>)}</tbody></table></div>}
 </section><p className="flex items-center gap-2 text-xs text-ink-muted"><ShieldCheck className="h-4 w-4"/>The API restricts staff management to authorized owners and managers.</p>
 </div>;
}
