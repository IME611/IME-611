import React from'react';

interface Props{children:React.ReactNode}
interface State{error:Error|null}

export class AppErrorBoundary extends React.Component<Props,State>{
 state:State={error:null};
 static getDerivedStateFromError(error:Error):State{return{error}}
 componentDidCatch(error:Error,info:React.ErrorInfo){
  console.error(JSON.stringify({level:'error',event:'ui.crash',message:error.message,componentStack:info.componentStack?.slice(0,800)}));
 }
 private recover=()=>this.setState({error:null});
 private reload=()=>window.location.reload();
 render(){
  if(!this.state.error)return this.props.children;
  return <main className="errorBoundary" role="alert"><section className="glassCard errorBoundaryCard"><span className="eyebrow">RECOVERY MODE</span><h1>משהו השתבש בתצוגה</h1><p>המידע שלך לא נמחק. אפשר לנסות לטעון מחדש את האזור או לרענן את האפליקציה.</p><div className="errorBoundaryActions"><button className="primary" onClick={this.recover}>נסה שוב</button><button className="secondary" onClick={this.reload}>רענן אפליקציה</button></div></section></main>;
 }
}
