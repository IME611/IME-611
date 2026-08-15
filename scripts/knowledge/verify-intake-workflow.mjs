import assert from'node:assert/strict';
import{resolveIntakeInput}from'../../server/knowledge/application/intake/intake-input.service.js';

const topic=await resolveIntakeInput({kind:'topic',text:'נוירופלסטיות',title:'בדיקה'});
assert.equal(topic.kind,'TOPIC');assert.equal(topic.text,'נוירופלסטיות');assert.ok(Buffer.isBuffer(topic.originalBytes));

const fileText='מערכת העצבים משפיעה על האופן שבו אנחנו מגיבים לסביבה.';
const file=await resolveIntakeInput({fileName:'note.txt',mimeType:'text/plain',fileBase64:Buffer.from(fileText).toString('base64')});
assert.equal(file.kind,'FILE');assert.equal(file.text,fileText);

const url=await resolveIntakeInput({url:'https://example.com/article',text:'טקסט שסופק יחד עם כתובת מקור.'});
assert.equal(url.kind,'URL');assert.equal(url.text,'טקסט שסופק יחד עם כתובת מקור.');assert.equal(url.metadata.urlFetched,false);

let imageError=null;try{await resolveIntakeInput({fileName:'image.png',mimeType:'image/png',fileBase64:Buffer.from('fake-image').toString('base64')})}catch(error){imageError=error}
assert.equal(imageError?.code,'IMAGE_TEXT_REQUIRED');

console.log('PASS intake input workflow regression');
