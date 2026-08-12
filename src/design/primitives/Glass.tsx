import React from'react';

type DivProps=React.HTMLAttributes<HTMLDivElement>&{tone?:'default'|'hero'|'quiet'};
type AsideProps=React.HTMLAttributes<HTMLElement>;
type ButtonProps=React.ButtonHTMLAttributes<HTMLButtonElement>;
type InputProps=React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps=React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const classes=(base:string,extra?:string)=>extra?`${base} ${extra}`:base;

export function GlassSurface({tone='default',className,...props}:DivProps){return <div className={classes(`glassSurface glassSurface--${tone}`,className)} {...props}/>}
export function GlassCard({tone='default',className,...props}:DivProps){return <section className={classes(`glassCard glassCard--${tone}`,className)} {...props}/>}
export const GlassNavigation=React.forwardRef<HTMLElement,AsideProps>(function GlassNavigation({className,...props},ref){return <aside ref={ref} className={classes('glassNavigation',className)} {...props}/>});
export function GlassModal({className,...props}:DivProps){return <div className={classes('glassModal',className)} {...props}/>}
export function GlassButton({className,...props}:ButtonProps){return <button className={classes('glassButton',className)} {...props}/>}
export function GlassInput({className,...props}:InputProps){return <input className={classes('glassInput',className)} {...props}/>}
export function GlassTextarea({className,...props}:TextareaProps){return <textarea className={classes('glassInput',className)} {...props}/>}
