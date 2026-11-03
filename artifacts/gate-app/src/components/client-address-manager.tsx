import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Address={id:number;label:string;address:string;city:string;state:string;zip:string};
const empty={label:"Service address",address:"",city:"",state:"",zip:""};
export function AddressManager(){
 const [addresses,setAddresses]=useState<Address[]>([]);
 const [form,setForm]=useState(empty);
 const [editing,setEditing]=useState<number|null>(null);
 const [message,setMessage]=useState("");
 const reload=()=>clientApi<Address[]>("/addresses").then(setAddresses).catch(e=>setMessage(e.message));
 useEffect(()=>{reload()},[]);
 async function save(e:React.FormEvent){e.preventDefault();setMessage("");
 try{await clientApi("/addresses"+(editing?"/"+editing:""),{method:editing?"PATCH":"POST",body:JSON.stringify(form)});setEditing(null);setForm(empty);reload()}catch(e){setMessage(e instanceof Error?e.message:"Unable to save")}}
 async function remove(id:number){if(!window.confirm("Delete this address?"))return;try{await clientApi("/addresses/"+id,{method:"DELETE"});reload()}catch(e){setMessage(e instanceof Error?e.message:"Unable to delete")}}
 return <section className="space-y-3"><h2 className="text-xl font-semibold">Service addresses</h2>
 {addresses.map(a=><div key={a.id} className="rounded border p-3"><strong>{a.label}</strong><p>{a.address}, {a.city}, {a.state} {a.zip}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={()=>{setEditing(a.id);setForm({label:a.label,address:a.address,city:a.city,state:a.state,zip:a.zip})}}>Edit</Button><Button type="button" variant="destructive" onClick={()=>remove(a.id)}>Delete</Button></div></div>)}
 <form onSubmit={save} className="space-y-2">{(Object.keys(empty) as Array<keyof typeof empty>).map(k=><label key={k} className="block">{k}<Input required value={form[k]} maxLength={250} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></label>)}<Button type="submit">{editing?"Save address":"Add address"}</Button>{editing&&<Button type="button" variant="outline" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</Button>}</form>
 {message&&<p role="status">{message}</p>}</section>;
}
