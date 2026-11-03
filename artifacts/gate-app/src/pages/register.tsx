import { useEffect, useState } from "react";
import { useLocation } from "wouter";
export default function RegisterPage() {
 const [,navigate]=useLocation();
 const [terms,setTerms]=useState<{id:number;version:string;content:string}|null>(null);
 const [form,setForm]=useState({firstName:"",lastName:"",email:"",phone:"",password:""});
 const [accepted,setAccepted]=useState(false);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 useEffect(()=>{fetch("/api/public/terms").then(r=>{if(!r.ok)throw Error("Registration is temporarily unavailable");return r.json()}).then(setTerms).catch(e=>setError(e.message));},[]);
 async function submit(e:React.FormEvent) {e.preventDefault();if(!terms||!accepted)return;setLoading(true);setError("");
 try {const r=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({...form,termsVersionId:terms.id,acceptTerms:true})});
 if(!r.ok){const body=await r.json();throw Error(body.error||"Registration failed");}
 navigate("/login");
 }catch(e){setError(e instanceof Error?e.message:"Registration failed")}finally{setLoading(false)}}
 return <main className="mx-auto max-w-lg p-6 space-y-4"><h1 className="text-2xl font-bold">Create Client Account</h1>
 {error&&<p role="alert" className="text-destructive">{error}</p>}
 <form onSubmit={submit} className="space-y-3">
 {(["firstName","lastName","email","phone","password"] as const).map(k=><label key={k} className="block">{k}<input className="block w-full rounded border bg-background p-2" type={k==="email"?"email":k==="password"?"password":"text"} minLength={k==="password"?12:undefined} maxLength={k==="password"?128:254} required={k!=="phone"} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></label>)}
 {terms&&<section><h2 className="font-semibold">Terms and Conditions · {terms.version}</h2><div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border p-3 text-sm">{terms.content}</div>
 <label className="flex gap-2 mt-2"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>I agree to the Terms and Conditions</label></section>}
 <button className="rounded bg-primary px-4 py-2 text-primary-foreground" disabled={!terms||!accepted||loading}>{loading?"Creating…":"Create account"}</button></form></main>;
}
