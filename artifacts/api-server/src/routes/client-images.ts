import { Router, raw } from "express";
import { db, clientImagesTable, serviceRequestsTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { rateLimit } from "../lib/rate-limit";

const router=Router();
const maxBytes=3*1024*1024;
const bodyParser=raw({type:["image/jpeg","image/png","image/webp"],limit:maxBytes});
function mimeFor(b:Buffer):string|null {
 if(b.length>=4 && b.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff])) && b[b.length-2]===0xff && b[b.length-1]===0xd9)return "image/jpeg";
 if(b.length>=24 && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && b.toString("ascii",12,16)==="IHDR")return "image/png";
 if(b.length>=16 && b.toString("ascii",0,4)==="RIFF" && b.toString("ascii",8,12)==="WEBP")return "image/webp";
 return null;
}
router.post("/client/images",requireAuth,rateLimit(20,3600000),bodyParser,async(req:AuthRequest,res):Promise<void>=>{
 const kind=req.query.kind;
 const id=Number(req.query.serviceRequestId);
 if(kind!=="avatar"&&kind!=="service"){res.status(400).json({error:"Invalid image kind"});return;}
 if(kind==="service"&&(!Number.isSafeInteger(id)||id<1)){res.status(400).json({error:"Service request required"});return;}
 if(!Buffer.isBuffer(req.body)||req.body.length===0||req.body.length>maxBytes){res.status(413).json({error:"Invalid image size"});return;}
 const detected=mimeFor(req.body);
 if(!detected || detected!==req.headers["content-type"]){res.status(415).json({error:"Invalid image format"});return;}
 if(kind==="service"){
  const [owned]=await db.select({id:serviceRequestsTable.id}).from(serviceRequestsTable).where(and(eq(serviceRequestsTable.id,id),eq(serviceRequestsTable.clientId,req.user!.id)));
  if(!owned){res.status(404).json({error:"Service request not found"});return;}
  const existing=await db.select({id:clientImagesTable.id}).from(clientImagesTable).where(and(eq(clientImagesTable.ownerId,req.user!.id),eq(clientImagesTable.serviceRequestId,id)));
  if(existing.length>=4){res.status(409).json({error:"Maximum four images per service request"});return;}
 }
 const [image]=await db.insert(clientImagesTable).values({ownerId:req.user!.id,serviceRequestId:kind==="service"?id:null,kind,mimeType:detected,data:req.body}).returning({id:clientImagesTable.id});
 if(kind==="avatar"){
  await db.update(usersTable).set({avatarUrl:"/api/client/images/"+image.id}).where(eq(usersTable.id,req.user!.id));
 }
 res.status(201).json({id:image.id,url:"/api/client/images/"+image.id});
});
router.get("/client/images/:id",requireAuth,async(req:AuthRequest,res):Promise<void>=>{
 const id=Number(req.params.id);
 if(!Number.isSafeInteger(id)||id<1){res.status(400).json({error:"Invalid image ID"});return;}
 const [image]=await db.select().from(clientImagesTable).where(and(eq(clientImagesTable.id,id),eq(clientImagesTable.ownerId,req.user!.id)));
 if(!image){res.status(404).json({error:"Not found"});return;}
 res.setHeader("Content-Type",image.mimeType);
 res.setHeader("Cache-Control","private, no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("Content-Disposition","inline");
 res.send(image.data);
});
router.get("/client/service-requests/:id/images",requireAuth,async(req:AuthRequest,res):Promise<void>=>{
 const id=Number(req.params.id);
 if(!Number.isSafeInteger(id)||id<1){res.status(400).json({error:"Invalid ID"});return;}
 const [owned]=await db.select({id:serviceRequestsTable.id}).from(serviceRequestsTable).where(and(eq(serviceRequestsTable.id,id),eq(serviceRequestsTable.clientId,req.user!.id)));
 if(!owned){res.status(404).json({error:"Not found"});return;}
 const rows=await db.select({id:clientImagesTable.id,kind:clientImagesTable.kind}).from(clientImagesTable).where(and(eq(clientImagesTable.ownerId,req.user!.id),eq(clientImagesTable.serviceRequestId,id)));
 res.json(rows.map(row=>({...row,url:"/api/client/images/"+row.id})));
});
export default router;
