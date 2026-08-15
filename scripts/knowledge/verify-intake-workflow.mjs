import assert from'node:assert/strict';
import{resolveIntakeInput}from'../../server/knowledge/application/intake/intake-input.service.js';

function makePdf(label='Hello EIL'){
 const stream=`BT /F1 18 Tf 72 720 Td (${label}) Tj ET`,objects=[
  `<< /Type /Catalog /Pages 2 0 R >>`,
  `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
 ];
 let pdf='%PDF-1.4\n',offsets=[];
 objects.forEach((body,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${body}\nendobj\n`});
 const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.map(offset=>`${String(offset).padStart(10,'0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(pdf);
}

const topic=await resolveIntakeInput({kind:'topic',text:'נוירופלסטיות',title:'בדיקה'});
assert.equal(topic.kind,'TOPIC');assert.equal(topic.text,'נוירופלסטיות');assert.ok(Buffer.isBuffer(topic.originalBytes));

const fileText='מערכת העצבים משפיעה על האופן שבו אנחנו מגיבים לסביבה.';
const file=await resolveIntakeInput({fileName:'note.txt',mimeType:'text/plain',fileBase64:Buffer.from(fileText).toString('base64')});
assert.equal(file.kind,'FILE');assert.equal(file.text,fileText);

const pdf=await resolveIntakeInput({fileName:'fixture.pdf',mimeType:'application/pdf',fileBase64:makePdf().toString('base64')});
assert.equal(pdf.kind,'FILE');assert.match(pdf.text,/Hello EIL/);

const url=await resolveIntakeInput({url:'https://example.com/article',text:'טקסט שסופק יחד עם כתובת מקור.'});
assert.equal(url.kind,'URL');assert.equal(url.text,'טקסט שסופק יחד עם כתובת מקור.');assert.equal(url.metadata.urlFetched,false);

let imageError=null;try{await resolveIntakeInput({fileName:'image.png',mimeType:'image/png',fileBase64:Buffer.from('fake-image').toString('base64')})}catch(error){imageError=error}
assert.equal(imageError?.code,'IMAGE_TEXT_REQUIRED');

console.log('PASS intake input workflow regression (text, file, PDF, URL, image guard)');
