import type{MediaCardProps}from'./media.types';

export function MediaCard({eyebrow='VISUAL LAYER',title,description,children}:MediaCardProps){
 return <section className="mediaCard"><header><span>{eyebrow}</span><h3>{title}</h3>{description&&<p>{description}</p>}</header><div className="mediaCardBody">{children}</div></section>;
}
