export type UploadMeta={name:string,size:number,type:string};
export function readUpload(file:File):Promise<UploadMeta>{return Promise.resolve({name:file.name,size:file.size,type:file.type||'application/octet-stream'})}
export function formatBytes(bytes:number){if(!bytes)return'0 B';const units=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);return`${(bytes/1024**i).toFixed(i?1:0)} ${units[i]}`}
