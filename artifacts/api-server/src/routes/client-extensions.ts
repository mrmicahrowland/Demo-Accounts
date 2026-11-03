import { Router } from "express";
import { db, clientAddressesTable, guestServiceRequestsTable, termsVersionsTable, termsAcceptancesTable, emailChangeRequestsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth";
import { rateLimit } from "../lib/rate-limit";
const router = Router();
const text = (v: unknown, max=250) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const addressFields = ["label","address","city","state","zip"] as const;
const validAddress = (v: any) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every(k=>addressFields.includes(k as any)) && ["address","city","state","zip"].every(k=>text(v[k])) && (v.label === undefined || text(v.label));
const idOf = (v: unknown) => { const n=Number(v); return Number.isSafeInteger(n) && n>0 ? n : null; };
router.get("/client/addresses", requireAuth, async (req: AuthRequest,res) => {
 res.json(await db.select().from(clientAddressesTable).where(eq(clientAddressesTable.clientId,req.user!.id)).orderBy(desc(clientAddressesTable.createdAt)));
});
router.post("/client/addresses", requireAuth, async (req: AuthRequest,res): Promise<void> => {
 if (!validAddress(req.body)) {res.status(400).json({error:"Invalid address"});return;}
 const [row]=await db.insert(clientAddressesTable).values({...req.body,clientId:req.user!.id}).returning();res.status(201).json(row);
});
router.patch("/client/addresses/:id",requireAuth,async(req:AuthRequest,res):Promise<void>=>{
 const id=idOf(req.params.id);if(!id || !validAddress(req.body)){res.status(400).json({error:"Invalid address"});return;}
 const [row]=await db.update(clientAddressesTable).set(req.body).where(and(eq(clientAddressesTable.id,id),eq(clientAddressesTable.clientId,req.user!.id))).returning();
 if(!row){res.status(404).json({error:"Not found"});return;}res.json(row);
});
router.delete("/client/addresses/:id",requireAuth,async(req:AuthRequest,res):Promise<void>=>{
 const id=idOf(req.params.id);if(!id){res.status(400).json({error:"Invalid ID"});return;}
 const [row]=await db.delete(clientAddressesTable).where(and(eq(clientAddressesTable.id,id),eq(clientAddressesTable.clientId,req.user!.id))).returning();
 if(!row){res.status(404).json({error:"Not found"});return;}res.sendStatus(204);
});
router.get("/public/terms",async(_req,res):Promise<void>=>{
 const [terms]=await db.select().from(termsVersionsTable).where(eq(termsVersionsTable.active,true)).limit(1);
 if(!terms){res.status(503).json({error:"Terms are not configured"});return;}
 res.json({id:terms.id,version:terms.version,content:terms.content});
});
router.post("/client/terms/accept",requireAuth,async(req:AuthRequest,res):Promise<void>=>{
 const [terms]=await db.select().from(termsVersionsTable).where(eq(termsVersionsTable.active,true)).limit(1);
 if(!terms || req.body?.termsVersionId!==terms.id){res.status(409).json({error:"Current terms acceptance required"});return;}
 await db.insert(termsAcceptancesTable).values({userId:req.user!.id,termsVersionId:terms.id}).onConflictDoNothing();
 res.json({accepted:true,version:terms.version});
});
router.post("/admin/terms",requireRole("admin"),async(req,res):Promise<void>=>{
 if(!text(req.body?.version,80)||!text(req.body?.content,50000)){res.status(400).json({error:"Invalid terms"});return;}
 const [row]=await db.transaction(async tx=>{
   await tx.update(termsVersionsTable).set({active:false}).where(eq(termsVersionsTable.active,true));
   return tx.insert(termsVersionsTable).values({version:req.body.version,content:req.body.content,active:true}).returning();
 });
 res.status(201).json(row);
});
router.post("/client/email-change",requireAuth,rateLimit(3,3600000),async(req:AuthRequest,res):Promise<void>=>{
 const email=typeof req.body?.email==="string"?req.body.email.toLowerCase().trim():"";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254){res.status(400).json({error:"Invalid email"});return;}
 const [existing]=await db.select({id:usersTable.id}).from(usersTable).where(eq(usersTable.email,email));
 if(existing){res.status(409).json({error:"Email unavailable"});return;}
 const token=randomBytes(32).toString("hex");const tokenHash=createHash("sha256").update(token).digest("hex");
 await db.insert(emailChangeRequestsTable).values({userId:req.user!.id,newEmail:email,tokenHash,expiresAt:new Date(Date.now()+30*60*1000)});
 // Never return the token in an API response. An email delivery adapter must send it before this feature can be enabled.
 res.status(503).json({error:"Email verification delivery is not configured; no email change was made"});
});
router.post("/public/service-requests",rateLimit(3,3600000),async(req,res):Promise<void>=>{
 const b=req.body??{};const allowed=["name","email","phone","type","description","serviceAddress","city","state","zip"];
 if(typeof b!=="object"||Array.isArray(b)||Object.keys(b).some(k=>!allowed.includes(k))||
 !["installation","repair","upgrade","maintenance","emergency"].includes(b.type)||
 !["name","email","description","serviceAddress","city","state","zip"].every(k=>text(b[k],k==="description"?4000:250))||
 !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || (b.phone!=null && (typeof b.phone!=="string"||b.phone.length>40))){
 res.status(400).json({error:"Invalid service request"});return;}
 const [row]=await db.insert(guestServiceRequestsTable).values({name:b.name,email:b.email.toLowerCase(),phone:b.phone??null,type:b.type,description:b.description,serviceAddress:b.serviceAddress,city:b.city,state:b.state,zip:b.zip}).returning({id:guestServiceRequestsTable.id});
 res.status(201).json({id:row.id,status:"submitted"});
});
export default router;
