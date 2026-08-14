export type AppRoot=
 |'home'
 |'journey'
 |'content-library'
 |'crystals'
 |'my-space'
 |'sources'
 |'about'
 |'settings'
 |'insights'
 |'transformation'
 |'media'
 |'research'
 |'atlas'
 |'mentor'
 |'activity';

export type AppRoute={
 path:string;
 root:AppRoot|string;
 segments:string[];
};

const aliases:Record<string,string>={
 dashboard:'my-space',
 library:'journey',
};

export function canonicalPath(target:string){
 const clean=target.replace(/^#\/?/,'').replace(/^\/+|\/+$/g,'').split('?')[0]||'home';
 const parts=clean.split('/').filter(Boolean);
 if(parts.length===0)return'home';
 parts[0]=aliases[parts[0]]??parts[0];
 return parts.join('/');
}

export function parseAppRoute(value?:string):AppRoute{
 const source=value??(typeof location!=='undefined'?location.hash:'');
 const path=canonicalPath(source);
 const parts=path.split('/').filter(Boolean);
 return{path,root:parts[0]||'home',segments:parts.slice(1)};
}

export function routeHash(target:string){
 return`#/${canonicalPath(target)}`;
}
