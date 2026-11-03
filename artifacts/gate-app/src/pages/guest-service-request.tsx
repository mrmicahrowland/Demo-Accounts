import { useState } from "react";
import { Link } from "wouter";
export default function GuestServiceRequestPage() {
 const [form,setForm]=useState({name:"",email:"",phone:"",type:"repair",description:"",serviceAddress:"",city:"",state:"",zip:""});
 const [message,setMessage]=useState("");const [pending,setPending]=useState(false);
 async function submit(e:React.FormEvent) {
  e.preventDefault();setPending(true);setMessage("");
  try {
   const response=await fetch("/api/public/service-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
   if(!response.ok)throw new Error("Unable to submit request. Please check your information.");
   const data=await response.json();setMessage("Request #"+data.id+" submitted. Our team will review it.");
  } catch(e) {setMessage(e instanceof Error?e.message:"Unable to submit request");}finally{setPending(false);}
 }
 return <main className="mx-auto max-w-xl p-6 space-y-5"><h1 className="text-2xl font-bold">Request Gate or Landscape Service</h1>
 <p>Already have an account? <Link href="/login">Sign in</Link> to track your requests.</p>
 <form onSubmit={submit} className="space-y-3">
 {(["name","email","phone","serviceAddress","city","state","zip"] as const).map(k=><label key={k} className="block text-sm font-medium">{k==="serviceAddress"?"Service address":k}<input className="mt-1 block w-full rounded border bg-background p-2" type={k==="email"?"email":"text"} required={k!=="phone"} maxLength={250} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></label>)}
 <label className="block">Service type<select className="block w-full rounded border bg-background p-2" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{["installation","repair","upgrade","maintenance","emergency"].map(t=><option key={t}>{t}</option>)}</select></label>
 <label className="block">Describe the service<textarea className="block w-full rounded border bg-background p-2" required maxLength={4000} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></label>
 {form.type==="emergency"&&<p>Next-day emergency: $75 site visit plus $150 for the first hour of troubleshooting. Additional work quoted separately.</p>}
 <button className="rounded bg-primary px-4 py-2 text-primary-foreground" disabled={pending}>{pending?"Submitting…":"Submit request"}</button>
 </form><p role="status">{message}</p></main>;
}
