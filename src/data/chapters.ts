export type Chapter={id:string;number:number;title:string;subtitle:string;paragraphs:string[]};
export const chapters:Chapter="+json.dumps(chapters,ensure_ascii=False,separators=(',',':'))+";
