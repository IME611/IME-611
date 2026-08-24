import{resolveIntakeInput as resolveBaseIntakeInput}from'./intake-input.service.js';
import{describeImageForKnowledgeIntake,multimodalCapability}from'./ai-gateway-multimodal.service.js';

const imageLike=body=>{
 const mime=String(body?.mimeType||'').toLowerCase(),name=String(body?.fileName||body?.sourceFilename||'').toLowerCase();
 return mime.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(name);
};

export async function resolveIntakeInput(body={}){
 const supplied=String(body.text||body.content||body.caption||'').trim();
 if((body.fileBase64||body.imageBase64)&&imageLike(body)&&!supplied){
  const bytes=Buffer.from(String(body.fileBase64||body.imageBase64),'base64');
  const vision=await describeImageForKnowledgeIntake({bytes,mimeType:body.mimeType,fileName:body.fileName||body.sourceFilename||''});
  const payload=await resolveBaseIntakeInput({...body,caption:vision.text});
  return{...payload,metadata:{...(payload.metadata||{}),imageAnalysisMode:'NATIVE_MULTIMODAL',imageAnalysisProvider:vision.provider,imageAnalysisModel:vision.model,imageAnalysisUsage:vision.usage||null,creatorDescriptionSupplied:false}};
 }
 const payload=await resolveBaseIntakeInput(body);
 return{...payload,metadata:{...(payload.metadata||{}),multimodalCapability:multimodalCapability(),creatorDescriptionSupplied:Boolean(supplied&&imageLike(body))}};
}

export{multimodalCapability};
