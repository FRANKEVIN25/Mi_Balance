export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const emptyState=()=>({settings:{name:'Mi espacio personal',currency:'PEN',expected:0,shares:[50,30,20]},accounts:[{id:'cash',name:'Efectivo',opening:0},{id:'bank',name:'Cuenta bancaria',opening:0}],debts:[],goals:[],bills:[],transactions:[]});
export const debtBalance=(s,id,asOf='9999-12-31')=>(s.debts.find(d=>d.id===id)?.principal??0)-s.transactions.filter(t=>t.type==='debt'&&t.debtId===id&&t.date<=asOf).reduce((a,t)=>a+t.amount-t.interest,0);
export const goalBalance=(s,id,asOf='9999-12-31')=>s.transactions.filter(t=>t.goalId===id&&t.date<=asOf).reduce((a,t)=>a+(t.type==='save'?t.amount:t.type==='withdraw'?-t.amount:0),0);
export function validateState(s){
  const fail=(msg)=>{throw new Error(msg);};
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const str=(v,max=100,required=true)=>typeof v==='string'&&v.length<=max&&(!required||v.trim().length>0);
  const money=(v,positive=false)=>Number.isSafeInteger(v)&&v>=(positive?1:0)&&v<=100000000000;
  const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  if(!obj(s)||!obj(s.settings))fail('La copia no tiene un formato válido.');
  const c=s.settings;
  if(!str(c.name)||!['PEN','USD','EUR','MXN','COP','CLP'].includes(c.currency)||!money(c.expected)||!Array.isArray(c.shares)||c.shares.length!==3||c.shares.some(n=>!Number.isInteger(n)||n<0||n>100)||c.shares.reduce((a,n)=>a+n,0)!==100)fail('Revisa la configuración. Los porcentajes deben sumar 100 %.');
  for(const key of ['accounts','debts','goals','bills','transactions']){
    if(!Array.isArray(s[key])||s[key].length>(key==='transactions'?10000:500)||s[key].some(x=>!obj(x)||!str(x.id)||!/^[a-zA-Z0-9_-]+$/.test(x.id))||new Set(s[key].map(x=>x.id)).size!==s[key].length)fail('Registros inválidos o duplicados.');
  }
  if(!s.accounts.length||s.accounts.some(a=>!str(a.name)||!money(a.opening)))fail('Revisa las cuentas y sus saldos iniciales.');
  if(s.debts.some(d=>!str(d.creditor)||!str(d.name)||!money(d.principal,true)||!money(d.installment)||(d.due!==''&&!date(d.due))||!str(d.rate,100,false)||!str(d.notes,500,false)))fail('Revisa los datos de la deuda.');
  if(s.goals.some(g=>!str(g.name)||!money(g.target,true)))fail('La meta debe tener un nombre y un importe mayor a cero.');
  if(s.bills.some(b=>!str(b.name)||!money(b.amount,true)||!date(b.due)||!['needs','wants'].includes(b.group)))fail('Revisa los pagos pendientes.');
  for(const t of s.transactions){
    if(!['income','expense','save','withdraw','transfer','debt','loan'].includes(t.type)||!money(t.amount,true)||!money(t.interest)||!date(t.date)||!str(t.description)||!str(t.category)||!str(t.note,500,false)||!['needs','wants','future'].includes(t.group)||!s.accounts.some(a=>a.id===t.account)||['toAccount','debtId','goalId','billId'].some(k=>!str(t[k],100,false)))fail('Revisa el monto, la fecha y la cuenta del movimiento.');
    if(t.date>today())fail('Solo registra movimientos realizados. Para fechas futuras, usa Pendientes.');
    if(t.type==='transfer'&&(!s.accounts.some(a=>a.id===t.toAccount)||t.account===t.toAccount))fail('Selecciona dos cuentas distintas.');
    if(t.type==='debt'&&(!s.debts.some(d=>d.id===t.debtId)||t.interest>=t.amount))fail('Revisa la deuda y los intereses: el pago debe reducir capital.');
    if(['save','withdraw'].includes(t.type)&&!s.goals.some(g=>g.id===t.goalId))fail('Selecciona una meta de ahorro.');
    if(t.billId&&(!s.bills.some(b=>b.id===t.billId)||t.type!=='expense'))fail('El pendiente vinculado no existe.');
  }
  for(const d of s.debts)if(debtBalance(s,d.id)<0)fail('El abono supera el saldo pendiente de la deuda.');
  for(const g of s.goals){let saved=0;for(const t of s.transactions.filter(t=>t.goalId===g.id).sort((a,b)=>a.date.localeCompare(b.date))){saved+=t.type==='save'?t.amount:t.type==='withdraw'?-t.amount:0;if(saved<0)fail('El retiro supera el ahorro disponible en esa fecha.');}}
  for(const b of s.bills)if(s.transactions.filter(t=>t.billId===b.id).length>1)fail('Este pendiente ya tiene un pago registrado.');
  return s;
}
export function totals(s,month){
  const tx=s.transactions.filter(t=>t.date.startsWith(month)),end=month+'-31',history=s.transactions.filter(t=>t.date<=end);
  const income=tx.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const expenses=tx.filter(t=>['expense','debt'].includes(t.type)).reduce((a,t)=>a+t.amount,0);
  const savings=tx.reduce((a,t)=>a+(t.type==='save'?t.amount:t.type==='withdraw'?-t.amount:0),0);
  const reserved=history.reduce((a,t)=>a+(t.type==='save'?t.amount:t.type==='withdraw'?-t.amount:0),0);
  const accounts=s.accounts.map(a=>({...a,balance:a.opening+history.reduce((n,t)=>n+(t.account===a.id?(['income','loan'].includes(t.type)?t.amount:['expense','debt','transfer'].includes(t.type)?-t.amount:0):0)+(t.type==='transfer'&&t.toAccount===a.id?t.amount:0),0)}));
  const balance=accounts.reduce((a,c)=>a+c.balance,0);
  const bills=s.bills.filter(b=>b.due<=end&&!history.some(t=>t.billId===b.id));
  const debtDues=s.debts.filter(d=>d.due&&d.due<=end&&debtBalance(s,d.id,end)>0).map(d=>({...d,remaining:Math.min(debtBalance(s,d.id,end),Math.max(0,d.installment-tx.filter(t=>t.type==='debt'&&t.debtId===d.id&&t.group==='needs').reduce((a,t)=>a+t.amount,0)))})).filter(d=>d.remaining>0);
  const pending=bills.reduce((a,b)=>a+b.amount,0)+debtDues.reduce((a,d)=>a+d.remaining,0);
  const used=['needs','wants','future'].map(g=>tx.reduce((a,t)=>a+(['expense','debt'].includes(t.type)&&t.group===g?t.amount:g==='future'&&t.type==='save'?t.amount:g==='future'&&t.type==='withdraw'?-t.amount:0),0));
  return {tx,income,expenses,savings,reserved,accounts,balance,bills,debtDues,pending,available:balance-reserved-pending,used};
}
export function demoState(){
  const s=emptyState(),month=today().slice(0,7),day=today();s.settings.expected=420000;s.accounts[0].opening=15000;s.accounts[1].opening=80000;
  s.debts=[{id:'d1',creditor:'Banco de ejemplo',name:'Préstamo personal',principal:280000,installment:25000,due:month+'-28',rate:'Sin interés en este ejemplo',notes:''},{id:'d2',creditor:'Andrea (ejemplo)',name:'Préstamo familiar',principal:60000,installment:10000,due:month+'-28',rate:'Sin interés',notes:''}];
  s.goals=[{id:'g1',name:'Fondo de emergencia',target:500000},{id:'g2',name:'Mis próximas vacaciones',target:200000}];
  const add=(type,amount,description,group,category,extras={})=>s.transactions.push({id:crypto.randomUUID(),type,amount,date:day,description,group,category,account:'bank',toAccount:'',debtId:'',goalId:'',billId:'',interest:0,note:'',...extras});
  add('income',420000,'Sueldo del mes','needs','Sueldo');add('expense',95000,'Alquiler del mes','needs','Vivienda');add('expense',28500,'Compras del mercado','needs','Alimentación');add('expense',12900,'Internet y servicios','needs','Servicios');add('expense',18500,'Salida de fin de semana','wants','Salidas');add('expense',4900,'Suscripción de música','wants','Suscripciones');add('save',60000,'Un paso hacia mi tranquilidad','future','Ahorro',{goalId:'g1'});add('save',24000,'Ahorro para vacaciones','future','Ahorro',{goalId:'g2'});add('debt',25000,'Cuota del préstamo','needs','Deudas',{debtId:'d1'});return s;
}
