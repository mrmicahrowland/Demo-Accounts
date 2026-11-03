import { useEffect, useState } from "react";
export default function VerifyEmailPage(){
 const [message,setMessage]=useState("Verifying email…");
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get("token");if(!token){setMessage("Missing verification token");return;}
 fetch("/api/public/email-change/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then(async r=>{if(!r.ok)throw Error("Link invalid or expired");setMessage("Email verified. Sign in again to continue.")}).catch(e=>setMessage(e.message));},[]);
 return <main className="mx-auto max-w-lg p-6"><h1 className="text-xl font-bold">Email verification</h1><p role="status">{message}</p></main>;
}
