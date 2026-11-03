import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin=process.env.AUTH_TEST_ORIGIN??"http://127.0.0.1:4010";
const api=async(path,method="GET",body,token,contentType="application/json")=>fetch(origin+"/api"+path,{method,headers:{...(token?{Authorization:"Bearer "+token}:{}),...(body?{"Content-Type":contentType}:{})},body:body?(typeof body==="string"||Buffer.isBuffer(body)?body:JSON.stringify(body)):undefined});
async function register(){
 const terms=await (await api("/public/terms")).json();
 const r=await api("/auth/register","POST",{email:"client-"+randomUUID()+"@example.test",password:"StrongPassword-"+randomUUID(),firstName:"Client",lastName:"Test",acceptTerms:true,termsVersionId:terms.id});
 assert.equal(r.status,201);return (await r.json()).token;
}
test("client authorization, addresses, requests, private images",async()=>{
 const a=await register(),b=await register();
 const profile=await api("/client/profile","GET",undefined,a);assert.equal(profile.status,200);
 const address=await api("/client/addresses","POST",{label:"Home",address:"1 Example St",city:"Atlanta",state:"GA",zip:"30301"},a);
 assert.equal(address.status,201);const addressId=(await address.json()).id;
 assert.equal((await api("/client/addresses/"+addressId,"DELETE",undefined,b)).status,404);
 assert.equal((await api("/client/addresses/"+addressId,"DELETE",undefined,a)).status,204);
 const request=await api("/client/service-requests","POST",{type:"repair",description:"Gate will not open",serviceAddress:"1 Example St",city:"Atlanta",state:"GA",zip:"30301"},a);
 assert.equal(request.status,201);const requestId=(await request.json()).id;
 assert.equal((await api("/client/service-requests/"+requestId,"GET",undefined,b)).status,404);
 const png=Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082","hex");
 const upload=await api("/client/images?kind=service&serviceRequestId="+requestId,"POST",png,a,"image/png");
 assert.equal(upload.status,201);const imageId=(await upload.json()).id;
 assert.equal((await api("/client/images/"+imageId,"GET",undefined,b)).status,404);
 const read=await api("/client/images/"+imageId,"GET",undefined,a);assert.equal(read.status,200);
 assert.equal(read.headers.get("cache-control"),"private, no-store");
 assert.equal((await api("/client/images?kind=avatar","POST",Buffer.from("not-an-image"),a,"image/png")).status,415);
});
