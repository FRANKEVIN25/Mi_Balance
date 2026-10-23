import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
const assets={};for(const [file,type] of [['index.html','text/html; charset=utf-8'],['style.css','text/css; charset=utf-8'],['app.mjs','text/javascript; charset=utf-8'],['favicon.svg','image/svg+xml']])assets['/'+file]={body:readFileSync('web/'+file,'utf8'),type};
assets['/finance.mjs']={body:readFileSync('src/finance.mjs','utf8'),type:'text/javascript; charset=utf-8'};
const finance=readFileSync('src/finance.mjs','utf8').replace(/^export /gm,'');
const worker=readFileSync('src/worker.mjs','utf8').replace(/^import .*;\r?\n/gm,'');
writeFileSync('dist/server/index.js',finance+'\nconst assets='+JSON.stringify(assets)+';\n'+worker);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
console.log('Worker y recursos compilados sin dependencias externas.');
