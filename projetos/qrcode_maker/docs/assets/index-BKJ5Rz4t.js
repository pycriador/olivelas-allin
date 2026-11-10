var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,o)=>(o=n==null?{}:e(i(n)),s(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var l=[{id:`midnight-indigo`,name:`Índigo Profundo`,category:`popular`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#4f46e5`,dotsGradient:{type:`linear`,rotation:45,color1:`#4f46e5`,color2:`#7c3aed`},cornersColor:`#4338ca`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #4f46e5, #7c3aed)`},{id:`emerald-pro`,name:`Esmeralda Tech`,category:`popular`,dotsType:`classy-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#059669`,dotsGradient:{type:`linear`,rotation:45,color1:`#059669`,color2:`#10b981`},cornersColor:`#047857`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #059669, #10b981)`},{id:`ocean-breeze`,name:`Brisa Oceânica`,category:`popular`,dotsType:`dots`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#0284c7`,dotsGradient:{type:`linear`,rotation:135,color1:`#0284c7`,color2:`#06b6d4`},cornersColor:`#0369a1`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #0284c7, #06b6d4)`},{id:`sunset-vibes`,name:`Pôr do Sol`,category:`popular`,dotsType:`classy`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#f43f5e`,dotsGradient:{type:`linear`,rotation:45,color1:`#f43f5e`,color2:`#f97316`},cornersColor:`#e11d48`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #f43f5e, #f97316)`},{id:`classic-minimal`,name:`Minimalista Clássico`,category:`popular`,dotsType:`square`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#0f172a`,dotsGradient:null,cornersColor:`#0f172a`,bgColor:`#ffffff`,previewGradient:`#0f172a`},{id:`royal-purple`,name:`Roxo Imperial`,category:`popular`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#6366f1`,dotsGradient:{type:`linear`,rotation:90,color1:`#6366f1`,color2:`#a855f7`},cornersColor:`#4f46e5`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #6366f1, #a855f7)`},{id:`crimson-ruby`,name:`Rubi Intenso`,category:`popular`,dotsType:`extra-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#e11d48`,dotsGradient:{type:`linear`,rotation:45,color1:`#e11d48`,color2:`#be123c`},cornersColor:`#9f1239`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #e11d48, #be123c)`},{id:`golden-sun`,name:`Ouro Radiante`,category:`popular`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#d97706`,dotsGradient:{type:`linear`,rotation:45,color1:`#d97706`,color2:`#f59e0b`},cornersColor:`#b45309`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #d97706, #f59e0b)`},{id:`forest-pine`,name:`Pinheiro Nórdico`,category:`popular`,dotsType:`classy-rounded`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#064e3b`,dotsGradient:{type:`linear`,rotation:180,color1:`#064e3b`,color2:`#047857`},cornersColor:`#064e3b`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #064e3b, #047857)`},{id:`electric-blue`,name:`Azul Elétrico`,category:`popular`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#2563eb`,dotsGradient:{type:`linear`,rotation:45,color1:`#2563eb`,color2:`#38bdf8`},cornersColor:`#1d4ed8`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #2563eb, #38bdf8)`},{id:`corporate-navy`,name:`Azul Executivo`,category:`business`,dotsType:`rounded`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#1e3a8a`,dotsGradient:null,cornersColor:`#172554`,bgColor:`#ffffff`,previewGradient:`#1e3a8a`},{id:`titanium-slate`,name:`Titânio Fosco`,category:`business`,dotsType:`square`,cornersSquareType:`extra-rounded`,cornersDotType:`square`,dotsColor:`#334155`,dotsGradient:{type:`linear`,rotation:90,color1:`#334155`,color2:`#1e293b`},cornersColor:`#0f172a`,bgColor:`#f8fafc`,previewGradient:`linear-gradient(135deg, #334155, #1e293b)`},{id:`luxury-gold`,name:`Dourado Alta Classe`,category:`business`,dotsType:`classy`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#92400e`,dotsGradient:{type:`linear`,rotation:45,color1:`#92400e`,color2:`#b45309`},cornersColor:`#78350f`,bgColor:`#fffbeb`,previewGradient:`linear-gradient(135deg, #92400e, #b45309)`},{id:`bordeaux-wine`,name:`Vinho Nobre`,category:`business`,dotsType:`classy-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#881337`,dotsGradient:null,cornersColor:`#4c0519`,bgColor:`#ffffff`,previewGradient:`#881337`},{id:`monochrome-pro`,name:`Monocromático Pro`,category:`business`,dotsType:`rounded`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#18181b`,dotsGradient:null,cornersColor:`#18181b`,bgColor:`#fafafa`,previewGradient:`#18181b`},{id:`banking-teal`,name:`Verde Financeiro`,category:`business`,dotsType:`square`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#0f766e`,dotsGradient:null,cornersColor:`#134e4a`,bgColor:`#ffffff`,previewGradient:`#0f766e`},{id:`champagne-class`,name:`Champanhe Premium`,category:`business`,dotsType:`classy`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#78350f`,dotsGradient:{type:`linear`,rotation:45,color1:`#78350f`,color2:`#d97706`},cornersColor:`#78350f`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #78350f, #d97706)`},{id:`law-firm-charcoal`,name:`Carvão Jurídico`,category:`business`,dotsType:`square`,cornersSquareType:`extra-rounded`,cornersDotType:`square`,dotsColor:`#27272a`,dotsGradient:null,cornersColor:`#18181b`,bgColor:`#ffffff`,previewGradient:`#27272a`},{id:`sapphire-trust`,name:`Safira Corporativa`,category:`business`,dotsType:`extra-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#1d4ed8`,dotsGradient:{type:`linear`,rotation:45,color1:`#1d4ed8`,color2:`#2563eb`},cornersColor:`#1e40af`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #1d4ed8, #2563eb)`},{id:`cosmic-aurora`,name:`Aurora Cósmica`,category:`creative`,dotsType:`dots`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#3b82f6`,dotsGradient:{type:`linear`,rotation:135,color1:`#3b82f6`,color2:`#ec4899`},cornersColor:`#2563eb`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #3b82f6, #ec4899)`},{id:`fire-ember`,name:`Brasa Ardente`,category:`creative`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#dc2626`,dotsGradient:{type:`linear`,rotation:45,color1:`#dc2626`,color2:`#ea580c`},cornersColor:`#b91c1c`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #dc2626, #ea580c)`},{id:`tropical-lime`,name:`Lima Tropical`,category:`creative`,dotsType:`classy-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#15803d`,dotsGradient:{type:`linear`,rotation:45,color1:`#15803d`,color2:`#84cc16`},cornersColor:`#166534`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #15803d, #84cc16)`},{id:`electric-violet`,name:`Violeta Elétrico`,category:`creative`,dotsType:`dots`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#7c3aed`,dotsGradient:{type:`linear`,rotation:45,color1:`#7c3aed`,color2:`#c026d3`},cornersColor:`#6d28d9`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #7c3aed, #c026d3)`},{id:`neon-punch`,name:`Neon Punch`,category:`creative`,dotsType:`classy`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#ff007a`,dotsGradient:{type:`linear`,rotation:45,color1:`#ff007a`,color2:`#7928ca`},cornersColor:`#e0006c`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #ff007a, #7928ca)`},{id:`peachy-morning`,name:`Pêssego Radiante`,category:`creative`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#e11d48`,dotsGradient:{type:`linear`,rotation:45,color1:`#e11d48`,color2:`#fb923c`},cornersColor:`#be123c`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #e11d48, #fb923c)`},{id:`arctic-ice`,name:`Gelo Ártico`,category:`creative`,dotsType:`dots`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#0284c7`,dotsGradient:{type:`linear`,rotation:45,color1:`#0284c7`,color2:`#38bdf8`},cornersColor:`#0369a1`,bgColor:`#f0f9ff`,previewGradient:`linear-gradient(135deg, #0284c7, #38bdf8)`},{id:`mango-tango`,name:`Manga Doce`,category:`creative`,dotsType:`extra-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#ea580c`,dotsGradient:{type:`linear`,rotation:45,color1:`#ea580c`,color2:`#eab308`},cornersColor:`#c2410c`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #ea580c, #eab308)`},{id:`deep-indigo-coral`,name:`Índigo Coral`,category:`creative`,dotsType:`classy-rounded`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#312e81`,dotsGradient:{type:`linear`,rotation:135,color1:`#312e81`,color2:`#f43f5e`},cornersColor:`#312e81`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #312e81, #f43f5e)`},{id:`candy-pop`,name:`Doce Pop`,category:`creative`,dotsType:`dots`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#db2777`,dotsGradient:{type:`linear`,rotation:45,color1:`#db2777`,color2:`#60a5fa`},cornersColor:`#be185d`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #db2777, #60a5fa)`},{id:`brand-whatsapp`,name:`WhatsApp Verde`,category:`social`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#16a34a`,dotsGradient:{type:`linear`,rotation:45,color1:`#16a34a`,color2:`#22c55e`},cornersColor:`#15803d`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #16a34a, #22c55e)`,presetLogo:`whatsapp`},{id:`brand-instagram`,name:`Instagram Sunset`,category:`social`,dotsType:`classy-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#c026d3`,dotsGradient:{type:`linear`,rotation:45,color1:`#833ab4`,color2:`#fd1d1d`},cornersColor:`#c026d3`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)`,presetLogo:`instagram`},{id:`brand-pix`,name:`Pix Oficial`,category:`social`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#0d9488`,dotsGradient:{type:`linear`,rotation:45,color1:`#0d9488`,color2:`#14b8a6`},cornersColor:`#0f766e`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #0d9488, #14b8a6)`,presetLogo:`pix`},{id:`brand-linkedin`,name:`LinkedIn Azul`,category:`social`,dotsType:`square`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#0284c7`,dotsGradient:{type:`linear`,rotation:90,color1:`#0077b5`,color2:`#0284c7`},cornersColor:`#0077b5`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #0077b5, #0284c7)`,presetLogo:`linkedin`},{id:`brand-youtube`,name:`YouTube Play`,category:`social`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#dc2626`,dotsGradient:{type:`linear`,rotation:45,color1:`#dc2626`,color2:`#ef4444`},cornersColor:`#b91c1c`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #dc2626, #ef4444)`,presetLogo:`youtube`},{id:`brand-spotify`,name:`Spotify Sound`,category:`social`,dotsType:`dots`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#1ed760`,dotsGradient:null,cornersColor:`#1ed760`,bgColor:`#121212`,previewGradient:`#1ed760`,presetLogo:`spotify`},{id:`brand-github`,name:`GitHub Octocat`,category:`social`,dotsType:`classy`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#24292f`,dotsGradient:null,cornersColor:`#090d16`,bgColor:`#f6f8fa`,previewGradient:`#24292f`,presetLogo:`github`},{id:`brand-twitter-x`,name:`Rede X (Twitter)`,category:`social`,dotsType:`square`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#000000`,dotsGradient:null,cornersColor:`#000000`,bgColor:`#ffffff`,previewGradient:`#000000`,presetLogo:`x`},{id:`brand-tiktok`,name:`TikTok Beat`,category:`social`,dotsType:`extra-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#0f172a`,dotsGradient:{type:`linear`,rotation:90,color1:`#00f2fe`,color2:`#fe0979`},cornersColor:`#0f172a`,bgColor:`#ffffff`,previewGradient:`linear-gradient(135deg, #00f2fe, #fe0979)`,presetLogo:`tiktok`},{id:`amoled-pure`,name:`AMOLED Puro`,category:`dark`,dotsType:`square`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#ffffff`,dotsGradient:null,cornersColor:`#ffffff`,bgColor:`#000000`,previewGradient:`#000000`,isDarkBg:!0},{id:`cyber-matrix`,name:`Terminal Matrix`,category:`dark`,dotsType:`dots`,cornersSquareType:`square`,cornersDotType:`square`,dotsColor:`#22c55e`,dotsGradient:null,cornersColor:`#4ade80`,bgColor:`#022c22`,previewGradient:`#022c22`,isDarkBg:!0},{id:`synthwave-retro`,name:`Retrô Synthwave`,category:`dark`,dotsType:`classy-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#ec4899`,dotsGradient:{type:`linear`,rotation:90,color1:`#ec4899`,color2:`#f59e0b`},cornersColor:`#ec4899`,bgColor:`#1e1b4b`,previewGradient:`#1e1b4b`,isDarkBg:!0},{id:`obsidian-gold`,name:`Obsidiana & Ouro`,category:`dark`,dotsType:`classy`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#f59e0b`,dotsGradient:{type:`linear`,rotation:45,color1:`#f59e0b`,color2:`#fbbf24`},cornersColor:`#f59e0b`,bgColor:`#18181b`,previewGradient:`#18181b`,isDarkBg:!0},{id:`deep-space`,name:`Espaço Profundo`,category:`dark`,dotsType:`dots`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#38bdf8`,dotsGradient:{type:`linear`,rotation:135,color1:`#38bdf8`,color2:`#818cf8`},cornersColor:`#38bdf8`,bgColor:`#030712`,previewGradient:`#030712`,isDarkBg:!0},{id:`crimson-night`,name:`Noite Carmesim`,category:`dark`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#f43f5e`,dotsGradient:{type:`linear`,rotation:45,color1:`#f43f5e`,color2:`#fb7185`},cornersColor:`#f43f5e`,bgColor:`#1c1917`,previewGradient:`#1c1917`,isDarkBg:!0},{id:`hacker-cyan`,name:`Ciano Neon`,category:`dark`,dotsType:`extra-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#06b6d4`,dotsGradient:null,cornersColor:`#22d3ee`,bgColor:`#082f49`,previewGradient:`#082f49`,isDarkBg:!0},{id:`purple-nebula`,name:`Nebulosa Púrpura`,category:`dark`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#c084fc`,dotsGradient:{type:`linear`,rotation:90,color1:`#c084fc`,color2:`#f472b6`},cornersColor:`#c084fc`,bgColor:`#1e112a`,previewGradient:`#1e112a`,isDarkBg:!0},{id:`soft-lavender`,name:`Lavanda Suave`,category:`pastel`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#7c3aed`,dotsGradient:null,cornersColor:`#6d28d9`,bgColor:`#f5f3ff`,previewGradient:`linear-gradient(135deg, #7c3aed, #a78bfa)`},{id:`blush-pink`,name:`Rosa Delicado`,category:`pastel`,dotsType:`dots`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#db2777`,dotsGradient:null,cornersColor:`#be185d`,bgColor:`#fdf2f8`,previewGradient:`linear-gradient(135deg, #db2777, #f472b6)`},{id:`matcha-green`,name:`Verde Matcha`,category:`pastel`,dotsType:`classy-rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#4d7c0f`,dotsGradient:null,cornersColor:`#3f6212`,bgColor:`#f7fee7`,previewGradient:`linear-gradient(135deg, #4d7c0f, #84cc16)`},{id:`sky-cloud`,name:`Céu Sereno`,category:`pastel`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#0284c7`,dotsGradient:null,cornersColor:`#0369a1`,bgColor:`#f0f9ff`,previewGradient:`linear-gradient(135deg, #0284c7, #38bdf8)`},{id:`caramel-latte`,name:`Café Caramelo`,category:`pastel`,dotsType:`classy`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#854d0e`,dotsGradient:null,cornersColor:`#713f12`,bgColor:`#fffbeb`,previewGradient:`linear-gradient(135deg, #854d0e, #ca8a04)`},{id:`mint-macaron`,name:`Menta Macaron`,category:`pastel`,dotsType:`extra-rounded`,cornersSquareType:`dot`,cornersDotType:`dot`,dotsColor:`#0f766e`,dotsGradient:null,cornersColor:`#115e59`,bgColor:`#f0fdfa`,previewGradient:`linear-gradient(135deg, #0f766e, #2dd4bf)`},{id:`coral-blossom`,name:`Flor de Coral`,category:`pastel`,dotsType:`rounded`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#e11d48`,dotsGradient:null,cornersColor:`#be123c`,bgColor:`#fff1f2`,previewGradient:`linear-gradient(135deg, #e11d48, #fb7185)`},{id:`nordic-mist`,name:`Névoa Nórdica`,category:`pastel`,dotsType:`dots`,cornersSquareType:`extra-rounded`,cornersDotType:`dot`,dotsColor:`#475569`,dotsGradient:null,cornersColor:`#334155`,bgColor:`#f8fafc`,previewGradient:`linear-gradient(135deg, #475569, #94a3b8)`}],u=c(o(((e,t,n)=>{(function(n,r){typeof e==`object`&&typeof t==`object`?t.exports=r():typeof define==`function`&&define.amd?define([],r):typeof e==`object`?e.QRCodeStyling=r():n.QRCodeStyling=r()})(n,(()=>(()=>{var e={873:(e,t)=>{var n,r,i=function(){var e=function(e,t){var n=e,r=o[t],i=null,a=0,c=null,g=[],_={},y=function(e,t){i=function(e){for(var t=Array(e),n=0;n<e;n+=1){t[n]=Array(e);for(var r=0;r<e;r+=1)t[n][r]=null}return t}(a=4*n+17),b(0,0),b(a-7,0),b(0,a-7),S(),x(),w(e,t),n>=7&&C(e),c??=E(n,r,g),T(c,t)},b=function(e,t){for(var n=-1;n<=7;n+=1)if(!(e+n<=-1||a<=e+n))for(var r=-1;r<=7;r+=1)t+r<=-1||a<=t+r||(i[e+n][t+r]=0<=n&&n<=6&&(r==0||r==6)||0<=r&&r<=6&&(n==0||n==6)||2<=n&&n<=4&&2<=r&&r<=4)},x=function(){for(var e=8;e<a-8;e+=1)i[e][6]??(i[e][6]=e%2==0);for(var t=8;t<a-8;t+=1)i[6][t]??(i[6][t]=t%2==0)},S=function(){for(var e=s.getPatternPosition(n),t=0;t<e.length;t+=1)for(var r=0;r<e.length;r+=1){var a=e[t],o=e[r];if(i[a][o]==null)for(var c=-2;c<=2;c+=1)for(var l=-2;l<=2;l+=1)i[a+c][o+l]=c==-2||c==2||l==-2||l==2||c==0&&l==0}},C=function(e){for(var t=s.getBCHTypeNumber(n),r=0;r<18;r+=1){var o=!e&&(t>>r&1)==1;i[Math.floor(r/3)][r%3+a-8-3]=o}for(r=0;r<18;r+=1)o=!e&&(t>>r&1)==1,i[r%3+a-8-3][Math.floor(r/3)]=o},w=function(e,t){for(var n=r<<3|t,o=s.getBCHTypeInfo(n),c=0;c<15;c+=1){var l=!e&&(o>>c&1)==1;c<6?i[c][8]=l:c<8?i[c+1][8]=l:i[a-15+c][8]=l}for(c=0;c<15;c+=1)l=!e&&(o>>c&1)==1,c<8?i[8][a-c-1]=l:c<9?i[8][15-c-1+1]=l:i[8][15-c-1]=l;i[a-8][8]=!e},T=function(e,t){for(var n=-1,r=a-1,o=7,c=0,l=s.getMaskFunction(t),u=a-1;u>0;u-=2)for(u==6&&--u;;){for(var d=0;d<2;d+=1)if(i[r][u-d]==null){var f=!1;c<e.length&&(f=(e[c]>>>o&1)==1),l(r,u-d)&&(f=!f),i[r][u-d]=f,--o==-1&&(c+=1,o=7)}if((r+=n)<0||a<=r){r-=n,n=-n;break}}},E=function(e,t,n){for(var r=u.getRSBlocks(e,t),i=d(),a=0;a<n.length;a+=1){var o=n[a];i.put(o.getMode(),4),i.put(o.getLength(),s.getLengthInBits(o.getMode(),e)),o.write(i)}var c=0;for(a=0;a<r.length;a+=1)c+=r[a].dataCount;if(i.getLengthInBits()>8*c)throw`code length overflow. (`+i.getLengthInBits()+`>`+8*c+`)`;for(i.getLengthInBits()+4<=8*c&&i.put(0,4);i.getLengthInBits()%8!=0;)i.putBit(!1);for(;!(i.getLengthInBits()>=8*c||(i.put(236,8),i.getLengthInBits()>=8*c));)i.put(17,8);return function(e,t){for(var n=0,r=0,i=0,a=Array(t.length),o=Array(t.length),c=0;c<t.length;c+=1){var u=t[c].dataCount,d=t[c].totalCount-u;r=Math.max(r,u),i=Math.max(i,d),a[c]=Array(u);for(var f=0;f<a[c].length;f+=1)a[c][f]=255&e.getBuffer()[f+n];n+=u;var p=s.getErrorCorrectPolynomial(d),m=l(a[c],p.getLength()-1).mod(p);for(o[c]=Array(p.getLength()-1),f=0;f<o[c].length;f+=1){var h=f+m.getLength()-o[c].length;o[c][f]=h>=0?m.getAt(h):0}}var g=0;for(f=0;f<t.length;f+=1)g+=t[f].totalCount;var _=Array(g),v=0;for(f=0;f<r;f+=1)for(c=0;c<t.length;c+=1)f<a[c].length&&(_[v]=a[c][f],v+=1);for(f=0;f<i;f+=1)for(c=0;c<t.length;c+=1)f<o[c].length&&(_[v]=o[c][f],v+=1);return _}(i,r)};_.addData=function(e,t){var n=null;switch(t||=`Byte`){case`Numeric`:n=f(e);break;case`Alphanumeric`:n=p(e);break;case`Byte`:n=m(e);break;case`Kanji`:n=h(e);break;default:throw`mode:`+t}g.push(n),c=null},_.isDark=function(e,t){if(e<0||a<=e||t<0||a<=t)throw e+`,`+t;return i[e][t]},_.getModuleCount=function(){return a},_.make=function(){if(n<1){for(var e=1;e<40;e++){for(var t=u.getRSBlocks(e,r),i=d(),a=0;a<g.length;a++){var o=g[a];i.put(o.getMode(),4),i.put(o.getLength(),s.getLengthInBits(o.getMode(),e)),o.write(i)}var c=0;for(a=0;a<t.length;a++)c+=t[a].dataCount;if(i.getLengthInBits()<=8*c)break}n=e}y(!1,function(){for(var e=0,t=0,n=0;n<8;n+=1){y(!0,n);var r=s.getLostPoint(_);(n==0||e>r)&&(e=r,t=n)}return t}())},_.createTableTag=function(e,t){e||=2;var n=``;n+=`<table style="`,n+=` border-width: 0px; border-style: none;`,n+=` border-collapse: collapse;`,n+=` padding: 0px; margin: `+(t=t===void 0?4*e:t)+`px;`,n+=`">`,n+=`<tbody>`;for(var r=0;r<_.getModuleCount();r+=1){n+=`<tr>`;for(var i=0;i<_.getModuleCount();i+=1)n+=`<td style="`,n+=` border-width: 0px; border-style: none;`,n+=` border-collapse: collapse;`,n+=` padding: 0px; margin: 0px;`,n+=` width: `+e+`px;`,n+=` height: `+e+`px;`,n+=` background-color: `,n+=_.isDark(r,i)?`#000000`:`#ffffff`,n+=`;`,n+=`"/>`;n+=`</tr>`}return(n+=`</tbody>`)+`</table>`},_.createSvgTag=function(e,t,n,r){var i={};typeof arguments[0]==`object`&&(e=(i=arguments[0]).cellSize,t=i.margin,n=i.alt,r=i.title),e||=2,t=t===void 0?4*e:t,(n=typeof n==`string`?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||`qrcode-description`:null,(r=typeof r==`string`?{text:r}:r||{}).text=r.text||null,r.id=r.text?r.id||`qrcode-title`:null;var a,o,s,c,l=_.getModuleCount()*e+2*t,u=``;for(c=`l`+e+`,0 0,`+e+` -`+e+`,0 0,-`+e+`z `,u+=`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"`,u+=i.scalable?``:` width="`+l+`px" height="`+l+`px"`,u+=` viewBox="0 0 `+l+` `+l+`" `,u+=` preserveAspectRatio="xMinYMin meet"`,u+=r.text||n.text?` role="img" aria-labelledby="`+D([r.id,n.id].join(` `).trim())+`"`:``,u+=`>`,u+=r.text?`<title id="`+D(r.id)+`">`+D(r.text)+`</title>`:``,u+=n.text?`<description id="`+D(n.id)+`">`+D(n.text)+`</description>`:``,u+=`<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>`,u+=`<path d="`,o=0;o<_.getModuleCount();o+=1)for(s=o*e+t,a=0;a<_.getModuleCount();a+=1)_.isDark(o,a)&&(u+=`M`+(a*e+t)+`,`+s+c);return(u+=`" stroke="transparent" fill="black"/>`)+`</svg>`},_.createDataURL=function(e,t){e||=2,t=t===void 0?4*e:t;var n=_.getModuleCount()*e+2*t,r=t,i=n-t;return v(n,n,(function(t,n){if(r<=t&&t<i&&r<=n&&n<i){var a=Math.floor((t-r)/e),o=Math.floor((n-r)/e);return+!_.isDark(o,a)}return 1}))},_.createImgTag=function(e,t,n){e||=2,t=t===void 0?4*e:t;var r=_.getModuleCount()*e+2*t,i=``;return i+=`<img`,i+=` src="`,i+=_.createDataURL(e,t),i+=`"`,i+=` width="`,i+=r,i+=`"`,i+=` height="`,i+=r,i+=`"`,n&&(i+=` alt="`,i+=D(n),i+=`"`),i+`/>`};var D=function(e){for(var t=``,n=0;n<e.length;n+=1){var r=e.charAt(n);switch(r){case`<`:t+=`&lt;`;break;case`>`:t+=`&gt;`;break;case`&`:t+=`&amp;`;break;case`"`:t+=`&quot;`;break;default:t+=r}}return t};return _.createASCII=function(e,t){if((e||=1)<2)return function(e){e=e===void 0?2:e;var t,n,r,i,a,o=1*_.getModuleCount()+2*e,s=e,c=o-e,l={"██":`█`,"█ ":`▀`," █":`▄`,"  ":` `},u={"██":`▀`,"█ ":`▀`," █":` `,"  ":` `},d=``;for(t=0;t<o;t+=2){for(r=Math.floor((t-s)/1),i=Math.floor((t+1-s)/1),n=0;n<o;n+=1)a=`█`,s<=n&&n<c&&s<=t&&t<c&&_.isDark(r,Math.floor((n-s)/1))&&(a=` `),s<=n&&n<c&&s<=t+1&&t+1<c&&_.isDark(i,Math.floor((n-s)/1))?a+=` `:a+=`█`,d+=e<1&&t+1>=c?u[a]:l[a];d+=`
`}return o%2&&e>0?d.substring(0,d.length-o-1)+Array(o+1).join(`▀`):d.substring(0,d.length-1)}(t);--e,t=t===void 0?2*e:t;var n,r,i,a,o=_.getModuleCount()*e+2*t,s=t,c=o-t,l=Array(e+1).join(`██`),u=Array(e+1).join(`  `),d=``,f=``;for(n=0;n<o;n+=1){for(i=Math.floor((n-s)/e),f=``,r=0;r<o;r+=1)a=1,s<=r&&r<c&&s<=n&&n<c&&_.isDark(i,Math.floor((r-s)/e))&&(a=0),f+=a?l:u;for(i=0;i<e;i+=1)d+=f+`
`}return d.substring(0,d.length-1)},_.renderTo2dContext=function(e,t){t||=2;for(var n=_.getModuleCount(),r=0;r<n;r++)for(var i=0;i<n;i++)e.fillStyle=_.isDark(r,i)?`black`:`white`,e.fillRect(r*t,i*t,t,t)},_};e.stringToBytes=(e.stringToBytesFuncs={default:function(e){for(var t=[],n=0;n<e.length;n+=1){var r=e.charCodeAt(n);t.push(255&r)}return t}}).default,e.createStringToBytes=function(e,t){var n=function(){for(var n=_(e),r=function(){var e=n.read();if(e==-1)throw`eof`;return e},i=0,a={};;){var o=n.read();if(o==-1)break;var s=r(),c=r()<<8|r();a[String.fromCharCode(o<<8|s)]=c,i+=1}if(i!=t)throw i+` != `+t;return a}(),r=63;return function(e){for(var t=[],i=0;i<e.length;i+=1){var a=e.charCodeAt(i);if(a<128)t.push(a);else{var o=n[e.charAt(i)];typeof o==`number`?(255&o)==o?t.push(o):(t.push(o>>>8),t.push(255&o)):t.push(r)}}return t}};var t,n,r,i,a,o={L:1,M:0,Q:3,H:2},s=(t=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],n=1335,r=7973,a=function(e){for(var t=0;e!=0;)t+=1,e>>>=1;return t},(i={}).getBCHTypeInfo=function(e){for(var t=e<<10;a(t)-a(n)>=0;)t^=n<<a(t)-a(n);return 21522^(e<<10|t)},i.getBCHTypeNumber=function(e){for(var t=e<<12;a(t)-a(r)>=0;)t^=r<<a(t)-a(r);return e<<12|t},i.getPatternPosition=function(e){return t[e-1]},i.getMaskFunction=function(e){switch(e){case 0:return function(e,t){return(e+t)%2==0};case 1:return function(e,t){return e%2==0};case 2:return function(e,t){return t%3==0};case 3:return function(e,t){return(e+t)%3==0};case 4:return function(e,t){return(Math.floor(e/2)+Math.floor(t/3))%2==0};case 5:return function(e,t){return e*t%2+e*t%3==0};case 6:return function(e,t){return(e*t%2+e*t%3)%2==0};case 7:return function(e,t){return(e*t%3+(e+t)%2)%2==0};default:throw`bad maskPattern:`+e}},i.getErrorCorrectPolynomial=function(e){for(var t=l([1],0),n=0;n<e;n+=1)t=t.multiply(l([1,c.gexp(n)],0));return t},i.getLengthInBits=function(e,t){if(1<=t&&t<10)switch(e){case 1:return 10;case 2:return 9;case 4:case 8:return 8;default:throw`mode:`+e}else if(t<27)switch(e){case 1:return 12;case 2:return 11;case 4:return 16;case 8:return 10;default:throw`mode:`+e}else{if(!(t<41))throw`type:`+t;switch(e){case 1:return 14;case 2:return 13;case 4:return 16;case 8:return 12;default:throw`mode:`+e}}},i.getLostPoint=function(e){for(var t=e.getModuleCount(),n=0,r=0;r<t;r+=1)for(var i=0;i<t;i+=1){for(var a=0,o=e.isDark(r,i),s=-1;s<=1;s+=1)if(!(r+s<0||t<=r+s))for(var c=-1;c<=1;c+=1)i+c<0||t<=i+c||s==0&&c==0||o==e.isDark(r+s,i+c)&&(a+=1);a>5&&(n+=3+a-5)}for(r=0;r<t-1;r+=1)for(i=0;i<t-1;i+=1){var l=0;e.isDark(r,i)&&(l+=1),e.isDark(r+1,i)&&(l+=1),e.isDark(r,i+1)&&(l+=1),e.isDark(r+1,i+1)&&(l+=1),l!=0&&l!=4||(n+=3)}for(r=0;r<t;r+=1)for(i=0;i<t-6;i+=1)e.isDark(r,i)&&!e.isDark(r,i+1)&&e.isDark(r,i+2)&&e.isDark(r,i+3)&&e.isDark(r,i+4)&&!e.isDark(r,i+5)&&e.isDark(r,i+6)&&(n+=40);for(i=0;i<t;i+=1)for(r=0;r<t-6;r+=1)e.isDark(r,i)&&!e.isDark(r+1,i)&&e.isDark(r+2,i)&&e.isDark(r+3,i)&&e.isDark(r+4,i)&&!e.isDark(r+5,i)&&e.isDark(r+6,i)&&(n+=40);var u=0;for(i=0;i<t;i+=1)for(r=0;r<t;r+=1)e.isDark(r,i)&&(u+=1);return n+Math.abs(100*u/t/t-50)/5*10},i),c=function(){for(var e=Array(256),t=Array(256),n=0;n<8;n+=1)e[n]=1<<n;for(n=8;n<256;n+=1)e[n]=e[n-4]^e[n-5]^e[n-6]^e[n-8];for(n=0;n<255;n+=1)t[e[n]]=n;return{glog:function(e){if(e<1)throw`glog(`+e+`)`;return t[e]},gexp:function(t){for(;t<0;)t+=255;for(;t>=256;)t-=255;return e[t]}}}();function l(e,t){if(e.length===void 0)throw e.length+`/`+t;var n=function(){for(var n=0;n<e.length&&e[n]==0;)n+=1;for(var r=Array(e.length-n+t),i=0;i<e.length-n;i+=1)r[i]=e[i+n];return r}(),r={getAt:function(e){return n[e]},getLength:function(){return n.length},multiply:function(e){for(var t=Array(r.getLength()+e.getLength()-1),n=0;n<r.getLength();n+=1)for(var i=0;i<e.getLength();i+=1)t[n+i]^=c.gexp(c.glog(r.getAt(n))+c.glog(e.getAt(i)));return l(t,0)},mod:function(e){if(r.getLength()-e.getLength()<0)return r;for(var t=c.glog(r.getAt(0))-c.glog(e.getAt(0)),n=Array(r.getLength()),i=0;i<r.getLength();i+=1)n[i]=r.getAt(i);for(i=0;i<e.getLength();i+=1)n[i]^=c.gexp(c.glog(e.getAt(i))+t);return l(n,0).mod(e)}};return r}var u=function(){var e=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],t=function(e,t){var n={};return n.totalCount=e,n.dataCount=t,n};return{getRSBlocks:function(n,r){var i=function(t,n){switch(n){case o.L:return e[4*(t-1)+0];case o.M:return e[4*(t-1)+1];case o.Q:return e[4*(t-1)+2];case o.H:return e[4*(t-1)+3];default:return}}(n,r);if(i===void 0)throw`bad rs block @ typeNumber:`+n+`/errorCorrectionLevel:`+r;for(var a=i.length/3,s=[],c=0;c<a;c+=1)for(var l=i[3*c+0],u=i[3*c+1],d=i[3*c+2],f=0;f<l;f+=1)s.push(t(u,d));return s}}}(),d=function(){var e=[],t=0,n={getBuffer:function(){return e},getAt:function(t){return(e[Math.floor(t/8)]>>>7-t%8&1)==1},put:function(e,t){for(var r=0;r<t;r+=1)n.putBit((e>>>t-r-1&1)==1)},getLengthInBits:function(){return t},putBit:function(n){var r=Math.floor(t/8);e.length<=r&&e.push(0),n&&(e[r]|=128>>>t%8),t+=1}};return n},f=function(e){var t=e,n={getMode:function(){return 1},getLength:function(e){return t.length},write:function(e){for(var n=t,i=0;i+2<n.length;)e.put(r(n.substring(i,i+3)),10),i+=3;i<n.length&&(n.length-i==1?e.put(r(n.substring(i,i+1)),4):n.length-i==2&&e.put(r(n.substring(i,i+2)),7))}},r=function(e){for(var t=0,n=0;n<e.length;n+=1)t=10*t+i(e.charAt(n));return t},i=function(e){if(`0`<=e&&e<=`9`)return e.charCodeAt(0)-48;throw`illegal char :`+e};return n},p=function(e){var t=e,n={getMode:function(){return 2},getLength:function(e){return t.length},write:function(e){for(var n=t,i=0;i+1<n.length;)e.put(45*r(n.charAt(i))+r(n.charAt(i+1)),11),i+=2;i<n.length&&e.put(r(n.charAt(i)),6)}},r=function(e){if(`0`<=e&&e<=`9`)return e.charCodeAt(0)-48;if(`A`<=e&&e<=`Z`)return e.charCodeAt(0)-65+10;switch(e){case` `:return 36;case`$`:return 37;case`%`:return 38;case`*`:return 39;case`+`:return 40;case`-`:return 41;case`.`:return 42;case`/`:return 43;case`:`:return 44;default:throw`illegal char :`+e}};return n},m=function(t){var n=e.stringToBytes(t);return{getMode:function(){return 4},getLength:function(e){return n.length},write:function(e){for(var t=0;t<n.length;t+=1)e.put(n[t],8)}}},h=function(t){var n=e.stringToBytesFuncs.SJIS;if(!n)throw`sjis not supported.`;(function(){var e=n(`友`);if(e.length!=2||(e[0]<<8|e[1])!=38726)throw`sjis not supported.`})();var r=n(t);return{getMode:function(){return 8},getLength:function(e){return~~(r.length/2)},write:function(e){for(var t=r,n=0;n+1<t.length;){var i=(255&t[n])<<8|255&t[n+1];if(33088<=i&&i<=40956)i-=33088;else{if(!(57408<=i&&i<=60351))throw`illegal char at `+(n+1)+`/`+i;i-=49472}i=192*(i>>>8&255)+(255&i),e.put(i,13),n+=2}if(n<t.length)throw`illegal char at `+(n+1)}}},g=function(){var e=[],t={writeByte:function(t){e.push(255&t)},writeShort:function(e){t.writeByte(e),t.writeByte(e>>>8)},writeBytes:function(e,n,r){n||=0,r||=e.length;for(var i=0;i<r;i+=1)t.writeByte(e[i+n])},writeString:function(e){for(var n=0;n<e.length;n+=1)t.writeByte(e.charCodeAt(n))},toByteArray:function(){return e},toString:function(){var t=``;t+=`[`;for(var n=0;n<e.length;n+=1)n>0&&(t+=`,`),t+=e[n];return t+`]`}};return t},_=function(e){var t=e,n=0,r=0,i=0,a={read:function(){for(;i<8;){if(n>=t.length){if(i==0)return-1;throw`unexpected end of file./`+i}var e=t.charAt(n);if(n+=1,e==`=`)return i=0,-1;e.match(/^\s$/)||(r=r<<6|o(e.charCodeAt(0)),i+=6)}var a=r>>>i-8&255;return i-=8,a}},o=function(e){if(65<=e&&e<=90)return e-65;if(97<=e&&e<=122)return e-97+26;if(48<=e&&e<=57)return e-48+52;if(e==43)return 62;if(e==47)return 63;throw`c:`+e};return a},v=function(e,t,n){for(var r=function(e,t){var n=e,r=t,i=Array(e*t),a={setPixel:function(e,t,r){i[t*n+e]=r},write:function(e){e.writeString(`GIF87a`),e.writeShort(n),e.writeShort(r),e.writeByte(128),e.writeByte(0),e.writeByte(0),e.writeByte(0),e.writeByte(0),e.writeByte(0),e.writeByte(255),e.writeByte(255),e.writeByte(255),e.writeString(`,`),e.writeShort(0),e.writeShort(0),e.writeShort(n),e.writeShort(r),e.writeByte(0);var t=o(2);e.writeByte(2);for(var i=0;t.length-i>255;)e.writeByte(255),e.writeBytes(t,i,255),i+=255;e.writeByte(t.length-i),e.writeBytes(t,i,t.length-i),e.writeByte(0),e.writeString(`;`)}},o=function(e){for(var t=1<<e,n=1+(1<<e),r=e+1,a=s(),o=0;o<t;o+=1)a.add(String.fromCharCode(o));a.add(String.fromCharCode(t)),a.add(String.fromCharCode(n));var c,l,u,d=g(),f=(c=d,l=0,u=0,{write:function(e,t){if(e>>>t)throw`length over`;for(;l+t>=8;)c.writeByte(255&(e<<l|u)),t-=8-l,e>>>=8-l,u=0,l=0;u|=e<<l,l+=t},flush:function(){l>0&&c.writeByte(u)}});f.write(t,r);var p=0,m=String.fromCharCode(i[p]);for(p+=1;p<i.length;){var h=String.fromCharCode(i[p]);p+=1,a.contains(m+h)?m+=h:(f.write(a.indexOf(m),r),a.size()<4095&&(a.size()==1<<r&&(r+=1),a.add(m+h)),m=h)}return f.write(a.indexOf(m),r),f.write(n,r),f.flush(),d.toByteArray()},s=function(){var e={},t=0,n={add:function(r){if(n.contains(r))throw`dup key:`+r;e[r]=t,t+=1},size:function(){return t},indexOf:function(t){return e[t]},contains:function(t){return e[t]!==void 0}};return n};return a}(e,t),i=0;i<t;i+=1)for(var a=0;a<e;a+=1)r.setPixel(a,i,n(a,i));var o=g();r.write(o);for(var s=function(){var e=0,t=0,n=0,r=``,i={},a=function(e){r+=String.fromCharCode(o(63&e))},o=function(e){if(!(e<0)){if(e<26)return 65+e;if(e<52)return e-26+97;if(e<62)return e-52+48;if(e==62)return 43;if(e==63)return 47}throw`n:`+e};return i.writeByte=function(r){for(e=e<<8|255&r,t+=8,n+=1;t>=6;)a(e>>>t-6),t-=6},i.flush=function(){if(t>0&&(a(e<<6-t),e=0,t=0),n%3!=0)for(var i=3-n%3,o=0;o<i;o+=1)r+=`=`},i.toString=function(){return r},i}(),c=o.toByteArray(),l=0;l<c.length;l+=1)s.writeByte(c[l]);return s.flush(),`data:image/gif;base64,`+s};return e}();i.stringToBytesFuncs[`UTF-8`]=function(e){return function(e){for(var t=[],n=0;n<e.length;n++){var r=e.charCodeAt(n);r<128?t.push(r):r<2048?t.push(192|r>>6,128|63&r):r<55296||r>=57344?t.push(224|r>>12,128|r>>6&63,128|63&r):(n++,r=65536+((1023&r)<<10|1023&e.charCodeAt(n)),t.push(240|r>>18,128|r>>12&63,128|r>>6&63,128|63&r))}return t}(e)},(r=typeof(n=function(){return i})==`function`?n.apply(t,[]):n)===void 0||(e.exports=r)}},t={};function n(r){var i=t[r];if(i!==void 0)return i.exports;var a=t[r]={exports:{}};return e[r](a,a.exports,n),a.exports}n.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);var r={};return(()=>{n.d(r,{default:()=>D});let e=e=>!!e&&typeof e==`object`&&!Array.isArray(e);function t(n,...r){if(!r.length)return n;let i=r.shift();return i!==void 0&&e(n)&&e(i)?(n=Object.assign({},n),Object.keys(i).forEach((r=>{let a=n[r],o=i[r];Array.isArray(a)&&Array.isArray(o)?n[r]=o:e(a)&&e(o)?n[r]=t(Object.assign({},a),o):n[r]=o})),t(n,...r)):n}function i(e,t){let n=document.createElement(`a`);n.download=t,n.href=e,document.body.appendChild(n),n.click(),document.body.removeChild(n)}let a={L:.07,M:.15,Q:.25,H:.3};class o{constructor({svg:e,type:t,window:n}){this._svg=e,this._type=t,this._window=n}draw(e,t,n,r){let i;switch(this._type){case`dots`:i=this._drawDot;break;case`classy`:i=this._drawClassy;break;case`classy-rounded`:i=this._drawClassyRounded;break;case`rounded`:i=this._drawRounded;break;case`extra-rounded`:i=this._drawExtraRounded;break;default:i=this._drawSquare}i.call(this,{x:e,y:t,size:n,getNeighbor:r})}_rotateFigure({x:e,y:t,size:n,rotation:r=0,draw:i}){var a;let o=e+n/2,s=t+n/2;i(),(a=this._element)==null||a.setAttribute(`transform`,`rotate(${180*r/Math.PI},${o},${s})`)}_basicDot(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`circle`),this._element.setAttribute(`cx`,String(n+t/2)),this._element.setAttribute(`cy`,String(r+t/2)),this._element.setAttribute(`r`,String(t/2))}}))}_basicSquare(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`rect`),this._element.setAttribute(`x`,String(n)),this._element.setAttribute(`y`,String(r)),this._element.setAttribute(`width`,String(t)),this._element.setAttribute(`height`,String(t))}}))}_basicSideRounded(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`d`,`M ${n} ${r}v ${t}h `+t/2+`a ${t/2} ${t/2}, 0, 0, 0, 0 ${-t}`)}}))}_basicCornerRounded(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`d`,`M ${n} ${r}v ${t}h ${t}v `+-t/2+`a ${t/2} ${t/2}, 0, 0, 0, ${-t/2} ${-t/2}`)}}))}_basicCornerExtraRounded(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`d`,`M ${n} ${r}v ${t}h ${t}a ${t} ${t}, 0, 0, 0, ${-t} ${-t}`)}}))}_basicCornersRounded(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`d`,`M ${n} ${r}v `+t/2+`a ${t/2} ${t/2}, 0, 0, 0, ${t/2} ${t/2}h `+t/2+`v `+-t/2+`a ${t/2} ${t/2}, 0, 0, 0, ${-t/2} ${-t/2}`)}}))}_drawDot({x:e,y:t,size:n}){this._basicDot({x:e,y:t,size:n,rotation:0})}_drawSquare({x:e,y:t,size:n}){this._basicSquare({x:e,y:t,size:n,rotation:0})}_drawRounded({x:e,y:t,size:n,getNeighbor:r}){let i=r?+r(-1,0):0,a=r?+r(1,0):0,o=r?+r(0,-1):0,s=r?+r(0,1):0,c=i+a+o+s;if(c!==0){if(c>2||i&&a||o&&s)this._basicSquare({x:e,y:t,size:n,rotation:0});else{if(c===2){let r=0;i&&o?r=Math.PI/2:o&&a?r=Math.PI:a&&s&&(r=-Math.PI/2),this._basicCornerRounded({x:e,y:t,size:n,rotation:r});return}if(c===1){let r=0;o?r=Math.PI/2:a?r=Math.PI:s&&(r=-Math.PI/2),this._basicSideRounded({x:e,y:t,size:n,rotation:r});return}}}else this._basicDot({x:e,y:t,size:n,rotation:0})}_drawExtraRounded({x:e,y:t,size:n,getNeighbor:r}){let i=r?+r(-1,0):0,a=r?+r(1,0):0,o=r?+r(0,-1):0,s=r?+r(0,1):0,c=i+a+o+s;if(c!==0){if(c>2||i&&a||o&&s)this._basicSquare({x:e,y:t,size:n,rotation:0});else{if(c===2){let r=0;i&&o?r=Math.PI/2:o&&a?r=Math.PI:a&&s&&(r=-Math.PI/2),this._basicCornerExtraRounded({x:e,y:t,size:n,rotation:r});return}if(c===1){let r=0;o?r=Math.PI/2:a?r=Math.PI:s&&(r=-Math.PI/2),this._basicSideRounded({x:e,y:t,size:n,rotation:r});return}}}else this._basicDot({x:e,y:t,size:n,rotation:0})}_drawClassy({x:e,y:t,size:n,getNeighbor:r}){let i=r?+r(-1,0):0,a=r?+r(1,0):0,o=r?+r(0,-1):0,s=r?+r(0,1):0;i+a+o+s===0?this._basicCornersRounded({x:e,y:t,size:n,rotation:Math.PI/2}):i||o?a||s?this._basicSquare({x:e,y:t,size:n,rotation:0}):this._basicCornerRounded({x:e,y:t,size:n,rotation:Math.PI/2}):this._basicCornerRounded({x:e,y:t,size:n,rotation:-Math.PI/2})}_drawClassyRounded({x:e,y:t,size:n,getNeighbor:r}){let i=r?+r(-1,0):0,a=r?+r(1,0):0,o=r?+r(0,-1):0,s=r?+r(0,1):0;i+a+o+s===0?this._basicCornersRounded({x:e,y:t,size:n,rotation:Math.PI/2}):i||o?a||s?this._basicSquare({x:e,y:t,size:n,rotation:0}):this._basicCornerExtraRounded({x:e,y:t,size:n,rotation:Math.PI/2}):this._basicCornerExtraRounded({x:e,y:t,size:n,rotation:-Math.PI/2})}}let s={dot:`dot`,square:`square`,extraRounded:`extra-rounded`},c=Object.values(s);class l{constructor({svg:e,type:t,window:n}){this._svg=e,this._type=t,this._window=n}draw(e,t,n,r){let i;switch(this._type){case s.square:i=this._drawSquare;break;case s.extraRounded:i=this._drawExtraRounded;break;default:i=this._drawDot}i.call(this,{x:e,y:t,size:n,rotation:r})}_rotateFigure({x:e,y:t,size:n,rotation:r=0,draw:i}){var a;let o=e+n/2,s=t+n/2;i(),(a=this._element)==null||a.setAttribute(`transform`,`rotate(${180*r/Math.PI},${o},${s})`)}_basicDot(e){let{size:t,x:n,y:r}=e,i=t/7;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`clip-rule`,`evenodd`),this._element.setAttribute(`d`,`M ${n+t/2} ${r}a ${t/2} ${t/2} 0 1 0 0.1 0zm 0 ${i}a ${t/2-i} ${t/2-i} 0 1 1 -0.1 0Z`)}}))}_basicSquare(e){let{size:t,x:n,y:r}=e,i=t/7;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`clip-rule`,`evenodd`),this._element.setAttribute(`d`,`M ${n} ${r}v ${t}h ${t}v `+-t+`zM ${n+i} ${r+i}h `+(t-2*i)+`v `+(t-2*i)+`h `+(2*i-t)+`z`)}}))}_basicExtraRounded(e){let{size:t,x:n,y:r}=e,i=t/7;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`path`),this._element.setAttribute(`clip-rule`,`evenodd`),this._element.setAttribute(`d`,`M ${n} ${r+2.5*i}v `+2*i+`a ${2.5*i} ${2.5*i}, 0, 0, 0, ${2.5*i} ${2.5*i}h `+2*i+`a ${2.5*i} ${2.5*i}, 0, 0, 0, ${2.5*i} ${2.5*-i}v `+-2*i+`a ${2.5*i} ${2.5*i}, 0, 0, 0, ${2.5*-i} ${2.5*-i}h `+-2*i+`a ${2.5*i} ${2.5*i}, 0, 0, 0, ${2.5*-i} ${2.5*i}M ${n+2.5*i} ${r+i}h `+2*i+`a ${1.5*i} ${1.5*i}, 0, 0, 1, ${1.5*i} ${1.5*i}v `+2*i+`a ${1.5*i} ${1.5*i}, 0, 0, 1, ${1.5*-i} ${1.5*i}h `+-2*i+`a ${1.5*i} ${1.5*i}, 0, 0, 1, ${1.5*-i} ${1.5*-i}v `+-2*i+`a ${1.5*i} ${1.5*i}, 0, 0, 1, ${1.5*i} ${1.5*-i}`)}}))}_drawDot({x:e,y:t,size:n,rotation:r}){this._basicDot({x:e,y:t,size:n,rotation:r})}_drawSquare({x:e,y:t,size:n,rotation:r}){this._basicSquare({x:e,y:t,size:n,rotation:r})}_drawExtraRounded({x:e,y:t,size:n,rotation:r}){this._basicExtraRounded({x:e,y:t,size:n,rotation:r})}}let u={dot:`dot`,square:`square`},d=Object.values(u);class f{constructor({svg:e,type:t,window:n}){this._svg=e,this._type=t,this._window=n}draw(e,t,n,r){let i;i=this._type===u.square?this._drawSquare:this._drawDot,i.call(this,{x:e,y:t,size:n,rotation:r})}_rotateFigure({x:e,y:t,size:n,rotation:r=0,draw:i}){var a;let o=e+n/2,s=t+n/2;i(),(a=this._element)==null||a.setAttribute(`transform`,`rotate(${180*r/Math.PI},${o},${s})`)}_basicDot(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`circle`),this._element.setAttribute(`cx`,String(n+t/2)),this._element.setAttribute(`cy`,String(r+t/2)),this._element.setAttribute(`r`,String(t/2))}}))}_basicSquare(e){let{size:t,x:n,y:r}=e;this._rotateFigure(Object.assign(Object.assign({},e),{draw:()=>{this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`rect`),this._element.setAttribute(`x`,String(n)),this._element.setAttribute(`y`,String(r)),this._element.setAttribute(`width`,String(t)),this._element.setAttribute(`height`,String(t))}}))}_drawDot({x:e,y:t,size:n,rotation:r}){this._basicDot({x:e,y:t,size:n,rotation:r})}_drawSquare({x:e,y:t,size:n,rotation:r}){this._basicSquare({x:e,y:t,size:n,rotation:r})}}let p=`circle`,m=[[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]],h=[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];class g{constructor(e,t){this._roundSize=e=>this._options.dotsOptions.roundSize?Math.floor(e):e,this._window=t,this._element=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`svg`),this._element.setAttribute(`width`,String(e.width)),this._element.setAttribute(`height`,String(e.height)),this._element.setAttribute(`xmlns:xlink`,`http://www.w3.org/1999/xlink`),e.dotsOptions.roundSize||this._element.setAttribute(`shape-rendering`,`crispEdges`),this._element.setAttribute(`viewBox`,`0 0 ${e.width} ${e.height}`),this._defs=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`defs`),this._element.appendChild(this._defs),this._imageUri=e.image,this._instanceId=g.instanceCount++,this._options=e}get width(){return this._options.width}get height(){return this._options.height}getElement(){return this._element}async drawQR(e){let t=e.getModuleCount(),n=Math.min(this._options.width,this._options.height)-2*this._options.margin,r=this._options.shape===p?n/Math.sqrt(2):n,i=this._roundSize(r/t),o={hideXDots:0,hideYDots:0,width:0,height:0};if(this._qr=e,this._options.image){if(await this.loadImage(),!this._image)return;let{imageOptions:e,qrOptions:n}=this._options,r=e.imageSize*a[n.errorCorrectionLevel],s=Math.floor(r*t*t);o=function({originalHeight:e,originalWidth:t,maxHiddenDots:n,maxHiddenAxisDots:r,dotSize:i}){let a={x:0,y:0},o={x:0,y:0};if(e<=0||t<=0||n<=0||i<=0)return{height:0,width:0,hideYDots:0,hideXDots:0};let s=e/t;return a.x=Math.floor(Math.sqrt(n/s)),a.x<=0&&(a.x=1),r&&r<a.x&&(a.x=r),a.x%2==0&&a.x--,o.x=a.x*i,a.y=1+2*Math.ceil((a.x*s-1)/2),o.y=Math.round(o.x*s),(a.y*a.x>n||r&&r<a.y)&&(r&&r<a.y?(a.y=r,a.y%2==0&&a.x--):a.y-=2,o.y=a.y*i,a.x=1+2*Math.ceil((a.y/s-1)/2),o.x=Math.round(o.y/s)),{height:o.y,width:o.x,hideYDots:a.y,hideXDots:a.x}}({originalWidth:this._image.width,originalHeight:this._image.height,maxHiddenDots:s,maxHiddenAxisDots:t-14,dotSize:i})}this.drawBackground(),this.drawDots(((e,n)=>!(this._options.imageOptions.hideBackgroundDots&&e>=(t-o.hideYDots)/2&&e<(t+o.hideYDots)/2&&n>=(t-o.hideXDots)/2&&n<(t+o.hideXDots)/2||m[e]?.[n]||m[e-t+7]?.[n]||m[e]?.[n-t+7]||h[e]?.[n]||h[e-t+7]?.[n]||h[e]?.[n-t+7]))),this.drawCorners(),this._options.image&&await this.drawImage({width:o.width,height:o.height,count:t,dotSize:i})}drawBackground(){var e;let t=this._element,n=this._options;if(t){let t=n.backgroundOptions?.gradient,r=n.backgroundOptions?.color,i=n.height,a=n.width;if(t||r){let o=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`rect`);this._backgroundClipPath=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`clipPath`),this._backgroundClipPath.setAttribute(`id`,`clip-path-background-color-${this._instanceId}`),this._defs.appendChild(this._backgroundClipPath),(e=n.backgroundOptions)!=null&&e.round&&(i=a=Math.min(n.width,n.height),o.setAttribute(`rx`,String(i/2*n.backgroundOptions.round))),o.setAttribute(`x`,String(this._roundSize((n.width-a)/2))),o.setAttribute(`y`,String(this._roundSize((n.height-i)/2))),o.setAttribute(`width`,String(a)),o.setAttribute(`height`,String(i)),this._backgroundClipPath.appendChild(o),this._createColor({options:t,color:r,additionalRotation:0,x:0,y:0,height:n.height,width:n.width,name:`background-color-${this._instanceId}`})}}}drawDots(e){var t;if(!this._qr)throw`QR code is not defined`;let n=this._options,r=this._qr.getModuleCount();if(r>n.width||r>n.height)throw`The canvas is too small.`;let i=Math.min(n.width,n.height)-2*n.margin,a=n.shape===p?i/Math.sqrt(2):i,s=this._roundSize(a/r),c=this._roundSize((n.width-r*s)/2),l=this._roundSize((n.height-r*s)/2),u=new o({svg:this._element,type:n.dotsOptions.type,window:this._window});this._dotsClipPath=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`clipPath`),this._dotsClipPath.setAttribute(`id`,`clip-path-dot-color-${this._instanceId}`),this._defs.appendChild(this._dotsClipPath),this._createColor({options:n.dotsOptions?.gradient,color:n.dotsOptions.color,additionalRotation:0,x:0,y:0,height:n.height,width:n.width,name:`dot-color-${this._instanceId}`});for(let n=0;n<r;n++)for(let i=0;i<r;i++)e&&!e(n,i)||(t=this._qr)!=null&&t.isDark(n,i)&&(u.draw(c+i*s,l+n*s,s,((t,a)=>!(i+t<0||n+a<0||i+t>=r||n+a>=r)&&!(e&&!e(n+a,i+t))&&!!this._qr&&this._qr.isDark(n+a,i+t))),u._element&&this._dotsClipPath&&this._dotsClipPath.appendChild(u._element));if(n.shape===p){let e=this._roundSize((i/s-r)/2),t=r+2*e,n=c-e*s,a=l-e*s,o=[],d=this._roundSize(t/2);for(let n=0;n<t;n++){o[n]=[];for(let i=0;i<t;i++)n>=e-1&&n<=t-e&&i>=e-1&&i<=t-e||Math.sqrt((n-d)*(n-d)+(i-d)*(i-d))>d?o[n][i]=0:o[n][i]=+!!this._qr.isDark(i-2*e<0?i:i>=r?i-2*e:i-e,n-2*e<0?n:n>=r?n-2*e:n-e)}for(let e=0;e<t;e++)for(let r=0;r<t;r++)o[e][r]&&(u.draw(n+r*s,a+e*s,s,((t,n)=>!!o[e+n]?.[r+t])),u._element&&this._dotsClipPath&&this._dotsClipPath.appendChild(u._element))}}drawCorners(){if(!this._qr)throw`QR code is not defined`;let e=this._element,t=this._options;if(!e)throw`Element code is not defined`;let n=this._qr.getModuleCount(),r=Math.min(t.width,t.height)-2*t.margin,i=t.shape===p?r/Math.sqrt(2):r,a=this._roundSize(i/n),s=7*a,u=3*a,g=this._roundSize((t.width-n*a)/2),_=this._roundSize((t.height-n*a)/2);[[0,0,0],[1,0,Math.PI/2],[0,1,-Math.PI/2]].forEach((([e,r,i])=>{var p,v,y,b,x,S;let C=g+e*a*(n-7),w=_+r*a*(n-7),T=this._dotsClipPath,E=this._dotsClipPath;if(((p=t.cornersSquareOptions)!=null&&p.gradient||(v=t.cornersSquareOptions)!=null&&v.color)&&(T=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`clipPath`),T.setAttribute(`id`,`clip-path-corners-square-color-${e}-${r}-${this._instanceId}`),this._defs.appendChild(T),this._cornersSquareClipPath=this._cornersDotClipPath=E=T,this._createColor({options:t.cornersSquareOptions?.gradient,color:t.cornersSquareOptions?.color,additionalRotation:i,x:C,y:w,height:s,width:s,name:`corners-square-color-${e}-${r}-${this._instanceId}`})),t.cornersSquareOptions?.type&&c.includes(t.cornersSquareOptions.type)){let e=new l({svg:this._element,type:t.cornersSquareOptions.type,window:this._window});e.draw(C,w,s,i),e._element&&T&&T.appendChild(e._element)}else{let e=new o({svg:this._element,type:t.cornersSquareOptions?.type||t.dotsOptions.type,window:this._window});for(let t=0;t<m.length;t++)for(let n=0;n<m[t].length;n++)(y=m[t])!=null&&y[n]&&(e.draw(C+n*a,w+t*a,a,((e,r)=>!!m[t+r]?.[n+e])),e._element&&T&&T.appendChild(e._element))}if(((b=t.cornersDotOptions)!=null&&b.gradient||(x=t.cornersDotOptions)!=null&&x.color)&&(E=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`clipPath`),E.setAttribute(`id`,`clip-path-corners-dot-color-${e}-${r}-${this._instanceId}`),this._defs.appendChild(E),this._cornersDotClipPath=E,this._createColor({options:t.cornersDotOptions?.gradient,color:t.cornersDotOptions?.color,additionalRotation:i,x:C+2*a,y:w+2*a,height:u,width:u,name:`corners-dot-color-${e}-${r}-${this._instanceId}`})),t.cornersDotOptions?.type&&d.includes(t.cornersDotOptions.type)){let e=new f({svg:this._element,type:t.cornersDotOptions.type,window:this._window});e.draw(C+2*a,w+2*a,u,i),e._element&&E&&E.appendChild(e._element)}else{let e=new o({svg:this._element,type:t.cornersDotOptions?.type||t.dotsOptions.type,window:this._window});for(let t=0;t<h.length;t++)for(let n=0;n<h[t].length;n++)(S=h[t])!=null&&S[n]&&(e.draw(C+n*a,w+t*a,a,((e,r)=>!!h[t+r]?.[n+e])),e._element&&E&&E.appendChild(e._element))}}))}loadImage(){return new Promise(((e,t)=>{let n=this._options;if(!n.image)return t(`Image is not defined`);if(n.nodeCanvas?.loadImage)n.nodeCanvas.loadImage(n.image).then((t=>{var r;if(this._image=t,this._options.imageOptions.saveAsBlob){let e=n.nodeCanvas?.createCanvas(this._image.width,this._image.height);(r=e?.getContext(`2d`))==null||r.drawImage(t,0,0),this._imageUri=e?.toDataURL()}e()})).catch(t);else{let t=new this._window.Image;typeof n.imageOptions.crossOrigin==`string`&&(t.crossOrigin=n.imageOptions.crossOrigin),this._image=t,t.onload=async()=>{this._options.imageOptions.saveAsBlob&&(this._imageUri=await async function(e,t){return new Promise((n=>{let r=new t.XMLHttpRequest;r.onload=function(){let e=new t.FileReader;e.onloadend=function(){n(e.result)},e.readAsDataURL(r.response)},r.open(`GET`,e),r.responseType=`blob`,r.send()}))}(n.image||``,this._window)),e()},t.src=n.image}}))}async drawImage({width:e,height:t,count:n,dotSize:r}){let i=this._options,a=this._roundSize((i.width-n*r)/2),o=this._roundSize((i.height-n*r)/2),s=a+this._roundSize(i.imageOptions.margin+(n*r-e)/2),c=o+this._roundSize(i.imageOptions.margin+(n*r-t)/2),l=e-2*i.imageOptions.margin,u=t-2*i.imageOptions.margin,d=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`image`);d.setAttribute(`href`,this._imageUri||``),d.setAttribute(`xlink:href`,this._imageUri||``),d.setAttribute(`x`,String(s)),d.setAttribute(`y`,String(c)),d.setAttribute(`width`,`${l}px`),d.setAttribute(`height`,`${u}px`),this._element.appendChild(d)}_createColor({options:e,color:t,additionalRotation:n,x:r,y:i,height:a,width:o,name:s}){let c=o>a?o:a,l=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`rect`);if(l.setAttribute(`x`,String(r)),l.setAttribute(`y`,String(i)),l.setAttribute(`height`,String(a)),l.setAttribute(`width`,String(o)),l.setAttribute(`clip-path`,`url('#clip-path-${s}')`),e){let t;if(e.type===`radial`)t=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`radialGradient`),t.setAttribute(`id`,s),t.setAttribute(`gradientUnits`,`userSpaceOnUse`),t.setAttribute(`fx`,String(r+o/2)),t.setAttribute(`fy`,String(i+a/2)),t.setAttribute(`cx`,String(r+o/2)),t.setAttribute(`cy`,String(i+a/2)),t.setAttribute(`r`,String(c/2));else{let c=((e.rotation||0)+n)%(2*Math.PI),l=(c+2*Math.PI)%(2*Math.PI),u=r+o/2,d=i+a/2,f=r+o/2,p=i+a/2;l>=0&&l<=.25*Math.PI||l>1.75*Math.PI&&l<=2*Math.PI?(u-=o/2,d-=a/2*Math.tan(c),f+=o/2,p+=a/2*Math.tan(c)):l>.25*Math.PI&&l<=.75*Math.PI?(d-=a/2,u-=o/2/Math.tan(c),p+=a/2,f+=o/2/Math.tan(c)):l>.75*Math.PI&&l<=1.25*Math.PI?(u+=o/2,d+=a/2*Math.tan(c),f-=o/2,p-=a/2*Math.tan(c)):l>1.25*Math.PI&&l<=1.75*Math.PI&&(d+=a/2,u+=o/2/Math.tan(c),p-=a/2,f-=o/2/Math.tan(c)),t=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`linearGradient`),t.setAttribute(`id`,s),t.setAttribute(`gradientUnits`,`userSpaceOnUse`),t.setAttribute(`x1`,String(Math.round(u))),t.setAttribute(`y1`,String(Math.round(d))),t.setAttribute(`x2`,String(Math.round(f))),t.setAttribute(`y2`,String(Math.round(p)))}e.colorStops.forEach((({offset:e,color:n})=>{let r=this._window.document.createElementNS(`http://www.w3.org/2000/svg`,`stop`);r.setAttribute(`offset`,100*e+`%`),r.setAttribute(`stop-color`,n),t.appendChild(r)})),l.setAttribute(`fill`,`url('#${s}')`),this._defs.appendChild(t)}else t&&l.setAttribute(`fill`,t);this._element.appendChild(l)}}g.instanceCount=0;let _=g,v=`canvas`,y={};for(let e=0;e<=40;e++)y[e]=e;let b={type:v,shape:`square`,width:300,height:300,data:``,margin:0,qrOptions:{typeNumber:y[0],mode:void 0,errorCorrectionLevel:`Q`},imageOptions:{saveAsBlob:!0,hideBackgroundDots:!0,imageSize:.4,crossOrigin:void 0,margin:0},dotsOptions:{type:`square`,color:`#000`,roundSize:!0},backgroundOptions:{round:0,color:`#fff`}};function x(e){let t=Object.assign({},e);if(!t.colorStops||!t.colorStops.length)throw`Field 'colorStops' is required in gradient`;return t.rotation=t.rotation?Number(t.rotation):0,t.colorStops=t.colorStops.map((e=>Object.assign(Object.assign({},e),{offset:Number(e.offset)}))),t}function S(e){let t=Object.assign({},e);return t.width=Number(t.width),t.height=Number(t.height),t.margin=Number(t.margin),t.imageOptions=Object.assign(Object.assign({},t.imageOptions),{hideBackgroundDots:!!t.imageOptions.hideBackgroundDots,imageSize:Number(t.imageOptions.imageSize),margin:Number(t.imageOptions.margin)}),t.margin>Math.min(t.width,t.height)&&(t.margin=Math.min(t.width,t.height)),t.dotsOptions=Object.assign({},t.dotsOptions),t.dotsOptions.gradient&&(t.dotsOptions.gradient=x(t.dotsOptions.gradient)),t.cornersSquareOptions&&(t.cornersSquareOptions=Object.assign({},t.cornersSquareOptions),t.cornersSquareOptions.gradient&&(t.cornersSquareOptions.gradient=x(t.cornersSquareOptions.gradient))),t.cornersDotOptions&&(t.cornersDotOptions=Object.assign({},t.cornersDotOptions),t.cornersDotOptions.gradient&&(t.cornersDotOptions.gradient=x(t.cornersDotOptions.gradient))),t.backgroundOptions&&(t.backgroundOptions=Object.assign({},t.backgroundOptions),t.backgroundOptions.gradient&&(t.backgroundOptions.gradient=x(t.backgroundOptions.gradient))),t}var C=n(873),w=n.n(C);function T(e){if(!e)throw Error(`Extension must be defined`);e[0]===`.`&&(e=e.substring(1));let t={bmp:`image/bmp`,gif:`image/gif`,ico:`image/vnd.microsoft.icon`,jpeg:`image/jpeg`,jpg:`image/jpeg`,png:`image/png`,svg:`image/svg+xml`,tif:`image/tiff`,tiff:`image/tiff`,webp:`image/webp`,pdf:`application/pdf`}[e.toLowerCase()];if(!t)throw Error(`Extension "${e}" is not supported`);return t}class E{constructor(e){this._window=e?.jsdom?new e.jsdom(``,{resources:`usable`}).window:window,this._options=e?S(t(b,e)):b,this.update()}static _clearContainer(e){e&&(e.innerHTML=``)}_setupSvg(){if(!this._qr)return;let e=new _(this._options,this._window);this._svg=e.getElement(),this._svgDrawingPromise=e.drawQR(this._qr).then((()=>{var t;this._svg&&((t=this._extension)==null||t.call(this,e.getElement(),this._options))}))}_setupCanvas(){this._qr&&(this._options.nodeCanvas?.createCanvas?(this._nodeCanvas=this._options.nodeCanvas.createCanvas(this._options.width,this._options.height),this._nodeCanvas.width=this._options.width,this._nodeCanvas.height=this._options.height):(this._domCanvas=document.createElement(`canvas`),this._domCanvas.width=this._options.width,this._domCanvas.height=this._options.height),this._setupSvg(),this._canvasDrawingPromise=this._svgDrawingPromise?.then((()=>{if(!this._svg)return;let e=this._svg,t=new this._window.XMLSerializer().serializeToString(e),n=btoa(t),r=`data:${T(`svg`)};base64,${n}`;if(this._options.nodeCanvas?.loadImage)return this._options.nodeCanvas.loadImage(r).then((e=>{var t;e.width=this._options.width,e.height=this._options.height,(t=this._nodeCanvas?.getContext(`2d`))==null||t.drawImage(e,0,0)}));{let e=new this._window.Image;return new Promise((t=>{e.onload=()=>{var n;(n=this._domCanvas?.getContext(`2d`))==null||n.drawImage(e,0,0),t()},e.src=r}))}})))}async _getElement(e=`png`){if(!this._qr)throw`QR code is empty`;return e.toLowerCase()===`svg`?(this._svg&&this._svgDrawingPromise||this._setupSvg(),await this._svgDrawingPromise,this._svg):((this._domCanvas||this._nodeCanvas)&&this._canvasDrawingPromise||this._setupCanvas(),await this._canvasDrawingPromise,this._domCanvas||this._nodeCanvas)}update(e){E._clearContainer(this._container),this._options=e?S(t(this._options,e)):this._options,this._options.data&&(this._qr=w()(this._options.qrOptions.typeNumber,this._options.qrOptions.errorCorrectionLevel),this._qr.addData(this._options.data,this._options.qrOptions.mode||function(e){switch(!0){case/^[0-9]*$/.test(e):return`Numeric`;case/^[0-9A-Z $%*+\-./:]*$/.test(e):return`Alphanumeric`;default:return`Byte`}}(this._options.data)),this._qr.make(),this._options.type===v?this._setupCanvas():this._setupSvg(),this.append(this._container))}append(e){if(e){if(typeof e.appendChild!=`function`)throw`Container should be a single DOM node`;this._options.type===v?this._domCanvas&&e.appendChild(this._domCanvas):this._svg&&e.appendChild(this._svg),this._container=e}}applyExtension(e){if(!e)throw`Extension function should be defined.`;this._extension=e,this.update()}deleteExtension(){this._extension=void 0,this.update()}async getRawData(e=`png`){if(!this._qr)throw`QR code is empty`;let t=await this._getElement(e),n=T(e);if(!t)return null;if(e.toLowerCase()===`svg`){let e=`<?xml version="1.0" standalone="no"?>\r\n${new this._window.XMLSerializer().serializeToString(t)}`;return typeof Blob>`u`||this._options.jsdom?Buffer.from(e):new Blob([e],{type:n})}return new Promise((e=>{let r=t;if(`toBuffer`in r){if(n===`image/png`)e(r.toBuffer(n));else if(n===`image/jpeg`)e(r.toBuffer(n));else{if(n!==`application/pdf`)throw Error(`Unsupported extension`);e(r.toBuffer(n))}}else`toBlob`in r&&r.toBlob(e,n,1)}))}async download(e){if(!this._qr)throw`QR code is empty`;if(typeof Blob>`u`)throw`Cannot download in Node.js, call getRawData instead.`;let t=`png`,n=`qr`;typeof e==`string`?(t=e,console.warn(`Extension is deprecated as argument for 'download' method, please pass object { name: '...', extension: '...' } as argument`)):typeof e==`object`&&e&&(e.name&&(n=e.name),e.extension&&(t=e.extension));let r=await this._getElement(t);if(r){if(t.toLowerCase()===`svg`){let e=new XMLSerializer().serializeToString(r);e=`<?xml version="1.0" standalone="no"?>\r
`+e,i(`data:${T(t)};charset=utf-8,${encodeURIComponent(e)}`,`${n}.svg`)}else i(r.toDataURL(T(t)),`${n}.${t}`)}}}let D=E})(),r.default})()))}))(),1),d=[{id:`whatsapp`,name:`WhatsApp`,brandColor:`#25D366`,wikipediaFile:`File:WhatsApp.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:WhatsApp.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#25D366"/>
      <path fill="#ffffff" d="M250 120c-71.8 0-130 58.2-130 130 0 22.9 5.9 45.3 17.2 65L120 380l66.5-17.4c19 10.4 40.5 15.9 63.5 15.9 71.8 0 130-58.2 130-130S321.8 120 250 120zm76.5 186.2c-3.1 8.8-15.6 16.1-25.5 18.2-6.8 1.5-15.7 2.6-45.7-9.8-38.3-15.9-63-54.8-64.9-57.3-1.9-2.6-15.5-20.6-15.5-39.2 0-18.6 9.7-27.8 13.2-31.6 3.5-3.8 7.6-4.7 10.1-4.7 2.5 0 5.1 0 7.3.1 2.3.1 5.5-.9 8.6 6.6 3.2 7.6 10.8 26.3 11.7 28.2.9 1.9 1.6 4.1.3 6.6-1.3 2.6-1.9 4.2-3.8 6.4-1.9 2.2-4 4.9-5.7 6.6-1.9 1.9-3.9 3.9-1.7 7.7 2.2 3.8 9.8 16.2 21 26.2 14.4 12.8 26.6 16.8 30.4 18.7 3.8 1.9 6 1.6 8.2-1 2.2-2.6 9.5-11.1 12-14.9 2.5-3.8 5.1-3.2 8.6-1.9 3.5 1.3 22.2 10.5 26 12.4 3.8 1.9 6.3 2.8 7.3 4.4.9 1.6.9 9.2-2.2 18z"/>
    </svg>`,badgeDataUrl:``},{id:`instagram`,name:`Instagram`,brandColor:`#E4405F`,wikipediaFile:`File:Instagram_logo_2016.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Instagram_logo_2016.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <defs>
        <radialGradient id="igWikiGrad" cx="20%" cy="105%" r="125%">
          <stop offset="0%" stop-color="#ffd521"/>
          <stop offset="15%" stop-color="#ffd521"/>
          <stop offset="50%" stop-color="#f50000"/>
          <stop offset="70%" stop-color="#b900b4"/>
          <stop offset="100%" stop-color="#4600f1"/>
        </radialGradient>
      </defs>
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="90" fill="url(#igWikiGrad)"/>
      <rect x="135" y="135" width="230" height="230" rx="60" fill="none" stroke="#ffffff" stroke-width="26"/>
      <circle cx="250" cy="250" r="58" fill="none" stroke="#ffffff" stroke-width="26"/>
      <circle cx="320" cy="180" r="16" fill="#ffffff"/>
    </svg>`,badgeDataUrl:``},{id:`pix`,name:`Pix`,brandColor:`#32BCAD`,wikipediaFile:`File:Pix_logo.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Pix_logo.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#32BCAD"/>
      <path fill="#ffffff" d="M185 170c-6.5 0-12.7 2.6-17.3 7.2l-38.3 38.3c-9.5 9.5-9.5 25.1 0 34.6l38.3 38.3c4.6 4.6 10.8 7.2 17.3 7.2s12.7-2.6 17.3-7.2l38.3-38.3c9.5-9.5 9.5-25.1 0-34.6L202.3 177.2c-4.6-4.6-10.8-7.2-17.3-7.2zm130 0c-6.5 0-12.7 2.6-17.3 7.2l-38.3 38.3c-9.5 9.5-9.5 25.1 0 34.6l38.3 38.3c4.6 4.6 10.8 7.2 17.3 7.2s12.7-2.6 17.3-7.2l38.3-38.3c9.5-9.5 9.5-25.1 0-34.6l-38.3-38.3c-4.6-4.6-10.8-7.2-17.3-7.2zM250 223l-27 27 27 27 27-27-27-27z"/>
    </svg>`,badgeDataUrl:``},{id:`youtube`,name:`YouTube`,brandColor:`#FF0000`,wikipediaFile:`File:YouTube_full-color_icon_(2017).svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:YouTube_full-color_icon_(2017).svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#FF0000"/>
      <path fill="#ffffff" d="M350 205c-2.4-9-9.5-16.1-18.5-18.5-16.3-4.4-81.5-4.4-81.5-4.4s-65.2 0-81.5 4.4c-9 2.4-16.1 9.5-18.5 18.5-4.4 16.3-4.4 50.5-4.4 50.5s0 34.2 4.4 50.5c2.4 9 9.5 16.1 18.5 18.5 16.3 4.4 81.5 4.4 81.5 4.4s65.2 0 81.5-4.4c9-2.4 16.1-9.5 18.5-18.5 4.4-16.3 4.4-50.5 4.4-50.5s0-34.2-4.4-50.5zM230 285v-70l62 35-62 35z"/>
    </svg>`,badgeDataUrl:``},{id:`linkedin`,name:`LinkedIn`,brandColor:`#0A66C2`,wikipediaFile:`File:LinkedIn_icon.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:LinkedIn_icon.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="80" fill="#0A66C2"/>
      <path fill="#ffffff" d="M175 220h-45v140h45V220zm-22.5-70c-14.5 0-24 9.5-24 22s9.2 22 23.5 22h.5c15 0 24-10 24-22s-9.5-22-24-22zm197.5 110c0-40-21.5-59-50-59-23 0-33.5 13-39 22v-19h-45v140h45v-78c0-4 0-8 1.5-11 3.5-8 11.5-17 25.5-17 18 0 25.5 14 25.5 34v72h45v-84h1.5z"/>
    </svg>`,badgeDataUrl:``},{id:`spotify`,name:`Spotify`,brandColor:`#1ED760`,wikipediaFile:`File:Spotify_logo_without_text.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Spotify_logo_without_text.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#1ED760"/>
      <path fill="#ffffff" d="M336 322c-3.6 5.8-11.2 7.6-17 4-46.7-28.6-105.4-35-174.6-19.2-6.7 1.6-13.2-2.7-14.7-9.4s2.7-13.2 9.4-14.7c76-17.4 141-10 193 21.7 5.8 3.6 7.6 11.2 3.9 17.6zm24-53c-4.5 7.2-14.1 9.6-21.3 5-53.4-32.8-134.9-42.4-198.1-23.2-8.3 2.5-17-2.2-19.5-10.5-2.5-8.3 2.2-17 10.5-19.5 72-21.9 161.7-11.2 223.4 26.8 7.2 4.4 9.5 14.1 5 21.4zm2.5-55.4C302.2 176 197 172.4 136.2 190.8c-9.8 3-20.1-2.7-23.2-12.5s2.7-20.1 12.5-23.2C195.4 134 311.6 138 386.2 182.2c8.9 5.4 11.6 17 6.2 25.9-5.3 8.9-17 11.6-25.9 6.2z"/>
    </svg>`,badgeDataUrl:``},{id:`github`,name:`GitHub`,brandColor:`#24292F`,wikipediaFile:`File:Octicons-mark-github.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Octicons-mark-github.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#24292F"/>
      <path fill="#ffffff" d="M250 110c-77.3 0-140 62.7-140 140 0 61.9 40.1 114.4 95.8 133 7 1.3 9.6-3 9.6-6.7v-23.4c-38.9 8.5-47.1-18.8-47.1-18.8-6.4-16.2-15.6-20.5-15.6-20.5-12.7-8.7.9-8.5.9-8.5 14 1 21.4 14.4 21.4 14.4 12.5 21.4 32.7 15.2 40.7 11.6 1.3-9 4.9-15.2 8.9-18.7-31.1-3.5-63.7-15.5-63.7-69.1 0-15.3 5.5-27.8 14.4-37.6-1.4-3.5-6.2-17.8 1.4-37.1 0 0 11.8-3.8 38.5 14.4 11.2-3.1 23.2-4.7 35.1-4.7s23.9 1.6 35.1 4.7c26.7-18.2 38.5-14.4 38.5-14.4 7.6 19.3 2.8 33.6 1.4 37.1 8.9 9.8 14.4 22.3 14.4 37.6 0 53.7-32.7 65.5-63.9 69 5.1 4.4 9.6 13 9.6 26.2v38.9c0 3.7 2.6 8.1 9.7 6.7 55.6-18.6 95.7-71.1 95.7-133 0-77.3-62.7-140-140-140z"/>
    </svg>`,badgeDataUrl:``},{id:`x`,name:`X (Twitter)`,brandColor:`#000000`,wikipediaFile:`File:X_logo_2023_original.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:X_logo_2023_original.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="80" fill="#000000"/>
      <path fill="#ffffff" d="M298.5 218.4 394.8 110h-22.8l-83.6 95.1L221.7 110H145l101 143.8L145 362.5h22.8l88.2-100.4 70.5 100.4h76.7M176 126.8h35l161.2 225.8h-35"/>
    </svg>`,badgeDataUrl:``},{id:`tiktok`,name:`TikTok`,brandColor:`#000000`,wikipediaFile:`File:TikTok_logo.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:TikTok_logo.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="80" fill="#000000"/>
      <path fill="#25F4EE" d="M305 210a70 70 0 0 1-40-28V310a70 70 0 1 1-70-70c5 0 10 .5 15 1.5v35.5a35 35 0 1 0 20 33V140h35a70 70 0 0 0 40 70z" opacity="0.85"/>
      <path fill="#FE2C55" d="M300 205a70 70 0 0 1-40-28V305a70 70 0 1 1-70-70c5 0 10 .5 15 1.5V272a35 35 0 1 0 20 33V135h35a70 70 0 0 0 40 70z" opacity="0.85"/>
      <path fill="#ffffff" d="M302 207a70 70 0 0 1-40-28V307a70 70 0 1 1-70-70c5 0 10 .5 15 1.5v35.5a35 35 0 1 0 20 33V137h35a70 70 0 0 0 40 70z"/>
    </svg>`,badgeDataUrl:``},{id:`telegram`,name:`Telegram`,brandColor:`#24A1DE`,wikipediaFile:`File:Telegram_logo.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Telegram_logo.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#24A1DE"/>
      <path fill="#ffffff" d="M352 165l-210 81c-14.3 5.7-14.1 13.8-2.5 17.3l53.6 16.8 124.4-78.5c5.9-3.6 11.3-1.6 6.8 2.2l-100.7 90.9-3.9 56.6c5.5 0 7.9-2.5 11.1-5.5l26.6-25.8 55.4 40.9c10.2 5.6 17.5 2.7 20-9.5l36.3-171.1c3.6-14.9-5.7-21.6-15.5-16.5z"/>
    </svg>`,badgeDataUrl:``},{id:`facebook`,name:`Facebook`,brandColor:`#1877F2`,wikipediaFile:`File:Facebook_Logo_(2019).png.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Facebook_Logo_(2019).png.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#1877F2"/>
      <path fill="#ffffff" d="M280 255h40l6-45h-46v-30c0-13 3.6-22 22.4-22h24V118s-21.8-3-41.6-3c-41.2 0-69.4 25.2-69.4 71.4V210h-39v45h39v120h50V255z"/>
    </svg>`,badgeDataUrl:``},{id:`google`,name:`Google`,brandColor:`#4285F4`,wikipediaFile:`File:Google_%22G%22_logo.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Google_%22G%22_logo.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#f8fafc"/>
      <g transform="translate(130, 130) scale(10)">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.25 21.3 7.31 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.59H1.27a11.96 11.96 0 0 0 0 10.82l4.01-3.09z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.59l4.01 3.09C6.23 6.85 8.88 4.75 12 4.75z"/>
      </g>
    </svg>`,badgeDataUrl:``},{id:`wifi`,name:`Wi-Fi`,brandColor:`#0284C7`,wikipediaFile:`File:Wifi_symbol.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:Wifi_symbol.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#0284C7"/>
      <path fill="#ffffff" d="M250 340a24 24 0 1 0 0 48 24 24 0 0 0 0-48zm-73.6-56a104 104 0 0 1 147.2 0l-22.4 22.4a72 72 0 0 0-102.4 0l-22.4-22.4zm-45.2-45.2a168 168 0 0 1 237.6 0l-22.4 22.4a136 136 0 0 0-192.8 0l-22.4-22.4zm-45.2-45.2a232 232 0 0 1 328 0l-22.4 22.4a200 200 0 0 0-283.2 0l-22.4-22.4z"/>
    </svg>`,badgeDataUrl:``},{id:`mercadopago`,name:`Mercado Pago`,brandColor:`#009EE3`,wikipediaFile:`File:MercadoPago_logo.svg`,wikipediaUrl:`https://commons.wikimedia.org/wiki/File:MercadoPago_logo.svg`,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#009EE3"/>
      <path fill="#ffffff" d="M170 230a80 80 0 0 1 160 0v40a40 40 0 0 1-80 0v-20a20 20 0 0 0-40 0v20a40 40 0 0 1-80 0v-40zm40 0a40 40 0 0 1 80 0v20h-80v-20z"/>
    </svg>`,badgeDataUrl:``}];d.forEach(e=>{e.badgeDataUrl=`data:image/svg+xml;base64,`+btoa(unescape(encodeURIComponent(e.svg)))});function f(e){return d.find(t=>t.id===e)}var p=class{instance=null;container=null;init(e,t){this.container=e,this.container.innerHTML=``,this.instance=new u.default(this.buildOptions(t,240,240)),this.instance.append(this.container)}update(e){this.instance&&this.instance.update(this.buildOptions(e,240,240))}buildOptions(e,t,n){let r=``;if(e.logoType===`wikipedia`&&e.selectedWikipediaLogoId){let t=f(e.selectedWikipediaLogoId);t&&(r=t.badgeDataUrl)}else e.logoType===`custom`&&e.customLogoDataUrl&&(r=e.customLogoDataUrl);let i=r&&e.errorCorrectionLevel===`L`?`Q`:e.errorCorrectionLevel,a={type:e.dotsType};e.dotsGradientEnabled&&e.dotsColor2?a.gradient={type:e.dotsGradientType||`linear`,rotation:(e.dotsGradientRotation||0)*(Math.PI/180),colorStops:[{offset:0,color:e.dotsColor},{offset:1,color:e.dotsColor2}]}:a.color=e.dotsColor;let o=e.cornersSync?e.dotsColor:e.cornersSquareColor,s=e.cornersSync?e.dotsColor:e.cornersDotColor;return{width:t,height:n,type:`canvas`,data:e.data||`https://github.com/pycriador/olivelas-qrcode`,margin:e.margin,qrOptions:{typeNumber:0,mode:`Byte`,errorCorrectionLevel:i},image:r||void 0,imageOptions:{hideBackgroundDots:!0,imageSize:e.logoSize,margin:r?4:0,crossOrigin:`anonymous`},dotsOptions:a,cornersSquareOptions:{type:e.cornersSquareType,color:o},cornersDotOptions:{type:e.cornersDotType,color:s},backgroundOptions:{color:e.bgTransparent?`transparent`:e.bgColor}}}async download(e,t=`png`){if(!this.instance)return;if(t===`svg`){await new u.default({...this.buildOptions(e,e.exportSize,e.exportSize),type:`svg`}).download({name:`olivelas-qrcode`,extension:`svg`});return}if(e.frameStyle===`none`){await new u.default(this.buildOptions(e,e.exportSize,e.exportSize)).download({name:`olivelas-qrcode`,extension:t});return}let n=await this.createFramedCanvas(e,e.exportSize);if(!n)return;let r=document.createElement(`a`);r.download=`olivelas-qrcode-moldura.${t}`,r.href=n.toDataURL(t===`webp`?`image/webp`:`image/png`,.95),r.click()}async copyToClipboard(e){try{let t=await this.createFramedCanvas(e,1024);return t?new Promise(e=>{t.toBlob(async t=>{if(!t)e(!1);else try{await navigator.clipboard.write([new ClipboardItem({"image/png":t})]),e(!0)}catch{e(!1)}},`image/png`)}):!1}catch{return!1}}async print(e){let t=await this.createFramedCanvas(e,800);if(!t)return;let n=t.toDataURL(`image/png`),r=window.open(``,`_blank`);r&&(r.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR Code - Olivelas Studio</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
            img { max-width: 480px; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 12px; }
            h2 { margin-top: 1.5rem; color: #0f172a; font-size: 1.4rem; }
            p { color: #64748b; font-size: 0.95rem; max-width: 500px; word-break: break-all; }
          </style>
        </head>
        <body>
          <img src="${n}" alt="QR Code" />
          <h2>${e.frameText||`Escaneie para Acessar`}</h2>
          <p>${e.data}</p>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `),r.document.close())}async createFramedCanvas(e,t=1e3){let n=document.createElement(`div`);n.style.position=`absolute`,n.style.left=`-9999px`,document.body.appendChild(n),new u.default(this.buildOptions(e,t,t)).append(n),await new Promise(e=>setTimeout(e,80));let r=n.querySelector(`canvas`);if(!r)return document.body.removeChild(n),null;let i=Math.round(t*.08),a=e.frameStyle===`none`?0:Math.round(t*.16),o=t+i*2,s=t+i*2+a,c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`);if(!l)return document.body.removeChild(n),null;e.frameStyle===`bottom`?(l.fillStyle=e.frameBgColor||`#4f46e5`,l.fillRect(0,0,o,s)):(l.fillStyle=`#ffffff`,l.fillRect(0,0,o,s)),e.frameStyle===`card`&&(l.lineWidth=Math.round(t*.015),l.strokeStyle=e.dotsColor,l.strokeRect(i/2,i/2,o-i,s-i));let d=e.frameStyle===`top`?a+i:i;return l.drawImage(r,i,d,t,t),e.frameStyle!==`none`&&(l.textAlign=`center`,l.textBaseline=`middle`,l.font=`bold ${Math.round(t*.05)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,e.frameStyle===`bottom`?(l.fillStyle=e.frameTextColor||`#ffffff`,l.fillText(e.frameText||`ESCANEIE-ME`,o/2,s-a/2)):e.frameStyle===`top`?(l.fillStyle=e.frameBgColor||`#4f46e5`,l.fillText(e.frameText||`SCAN HERE`,o/2,a/2)):e.frameStyle===`card`&&(l.fillStyle=e.dotsColor,l.fillText(e.frameText||`APONTE A CÂMERA`,o/2,s-a/2))),document.body.removeChild(n),c}};function m(e,t,n,r){let i=document.createElement(`header`);return i.className=`app-header`,i.innerHTML=`
    <div class="header-container">
      <a href="#/" class="brand-wrapper" title="Ir para o Criador de QR Code">
        <div class="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="8" height="8" x="2" y="2" rx="2"></rect>
            <rect width="8" height="8" x="14" y="2" rx="2"></rect>
            <rect width="8" height="8" x="2" y="14" rx="2"></rect>
            <rect width="4" height="4" x="15" y="15" rx="1"></rect>
          </svg>
        </div>
        <div>
          <span class="brand-title">Olivelas QR Code</span>
          <span class="brand-tag">PRO TS</span>
        </div>
      </a>

      <!-- Links de Navegação Principal com URL Própria -->
      <nav class="header-nav" aria-label="Navegação Principal">
        <a href="#/" id="nav-btn-creator" class="nav-link-btn ${e.activeView===`app`?`active`:``}" title="Acessar o Criador de QR Code (URL: #/)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/><rect width="8" height="8" x="2" y="14" rx="2"/><rect width="4" height="4" x="15" y="15" rx="1"/></svg>
          <span>Criador</span>
        </a>
        <a href="#/docs" id="nav-btn-docs" class="nav-link-btn ${e.activeView===`docs`?`active`:``}" title="Acessar Documentação cURL & Python (URL: #/docs)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          <span>cURL & Python API</span>
        </a>
        ${e.activeView===`app`?`
        <button id="btn-toggle-preview-nav" class="nav-link-btn btn-highlight" title="${e.isSidebarCollapsed?`Fixar e exibir o painel do QR Code`:`Ocultar o painel do QR Code`}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${e.isSidebarCollapsed?`<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`:`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`}
          </svg>
          <span>${e.isSidebarCollapsed?`Mostrar QR Code`:`Ocultar QR Code`}</span>
        </button>`:``}
      </nav>

      <div class="header-actions">
        <span class="badge-counter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          54+ Estilos Prontos
        </span>

        <button id="btn-theme-toggle" class="btn-icon" title="Alternar tema claro/escuro" aria-label="Alternar tema">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <a href="https://github.com/pycriador/olivelas-qrcode" target="_blank" rel="noopener noreferrer" class="btn-icon" title="Ver código no GitHub" aria-label="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </a>
      </div>
    </div>
  `,i.querySelector(`.brand-wrapper`)?.addEventListener(`click`,e=>{e.preventDefault(),n(`app`)}),i.querySelector(`#nav-btn-creator`)?.addEventListener(`click`,e=>{e.preventDefault(),n(`app`)}),i.querySelector(`#nav-btn-docs`)?.addEventListener(`click`,e=>{e.preventDefault(),n(`docs`)}),i.querySelector(`#btn-toggle-preview-nav`)?.addEventListener(`click`,r),i.querySelector(`#btn-theme-toggle`)?.addEventListener(`click`,t),i}function h(e,t=6e3){return new Promise((n,r)=>{if(typeof window>`u`||!window.document){r(Error(`JSONP indisponível fora do navegador`));return}let i=`__olivelas_jsonp_`+Math.random().toString(36).substring(2,9),a=document.createElement(`script`),o=setTimeout(()=>{s(),r(Error(`Tempo limite da requisição JSONP esgotado`))},t),s=()=>{clearTimeout(o),a.parentNode&&a.parentNode.removeChild(a),delete window[i]};window[i]=e=>{s(),n(e)},a.onerror=()=>{s(),r(Error(`Falha no carregamento do script JSONP`))},a.src=`${e}${e.includes(`?`)?`&`:`?`}callback=${i}`,document.head.appendChild(a)})}async function g(e,t={},n=4500){let r=new AbortController,i=setTimeout(()=>r.abort(),n);try{let n=await fetch(e,{...t,signal:r.signal});return clearTimeout(i),n}catch(e){throw clearTimeout(i),e}}var _=[{id:`isgd`,name:`is.gd`,domain:`is.gd`,shorten:async e=>{let t=`https://is.gd/create.php?format=json&url=${encodeURIComponent(e)}`;try{let e=await g(t);if(e.ok){let t=await e.json();if(t&&t.shorturl)return t.shorturl}}catch{}let n=await h(t);if(n&&n.shorturl)return n.shorturl;throw Error(`Falha no is.gd`)}},{id:`vgd`,name:`v.gd`,domain:`v.gd`,shorten:async e=>{let t=`https://v.gd/create.php?format=json&url=${encodeURIComponent(e)}`;try{let e=await g(t);if(e.ok){let t=await e.json();if(t&&t.shorturl)return t.shorturl}}catch{}let n=await h(t);if(n&&n.shorturl)return n.shorturl;throw Error(`Falha no v.gd`)}},{id:`dagd`,name:`da.gd`,domain:`da.gd`,shorten:async e=>{let t=await g(`https://da.gd/s?url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=(await t.text()).trim();if(n.startsWith(`http`))return n;throw Error(`Resposta inválida do da.gd`)}},{id:`clckru`,name:`Clck.ru`,domain:`clck.ru`,shorten:async e=>{let t=await g(`https://clck.ru/--?url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=(await t.text()).trim();if(n.startsWith(`http`))return n;throw Error(`Resposta inválida do Clck.ru`)}},{id:`tinyurl`,name:`TinyURL`,domain:`tinyurl.com`,shorten:async e=>{let t=await g(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=(await t.text()).trim();if(n.startsWith(`http`))return n;throw Error(`Resposta inválida do TinyURL`)}},{id:`ulvis`,name:`Ulvis.net`,domain:`ulvis.net`,shorten:async e=>{let t=await g(`https://ulvis.net/api.php?url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=(await t.text()).trim();if(n.startsWith(`http`))return n;throw Error(`Resposta inválida do Ulvis`)}},{id:`spoo`,name:`Spoo.me`,domain:`spoo.me`,shorten:async e=>{let t=await g(`https://spoo.me/`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`,Accept:`application/json`},body:`url=${encodeURIComponent(e)}`});if(!t.ok)throw Error(`Status ${t.status}`);let n=await t.json();if(n&&n.short_url)return n.short_url;throw Error(`Resposta inválida do Spoo.me`)}},{id:`chilpit`,name:`Chilp.it`,domain:`chilp.it`,shorten:async e=>{let t=await g(`https://chilp.it/api.php?url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=(await t.text()).trim();if(n.startsWith(`http`))return n;throw Error(`Resposta inválida do Chilp.it`)}},{id:`cleanuri`,name:`CleanURI`,domain:`cleanuri.com`,shorten:async e=>{let t=await g(`https://cleanuri.com/api/v1/shorten`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:`url=${encodeURIComponent(e)}`});if(!t.ok)throw Error(`Status ${t.status}`);let n=await t.json();if(n&&n.result_url)return n.result_url;throw Error(`Falha no CleanURI`)}},{id:`onept`,name:`1pt.co`,domain:`1pt.co`,shorten:async e=>{let t=await g(`https://1pt.co/api/create?url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=await t.json();if(n&&n.short)return`https://1pt.co/${n.short}`;throw Error(`Falha no 1pt.co`)}},{id:`tnyim`,name:`tny.im`,domain:`tny.im`,shorten:async e=>{let t=await g(`https://tny.im/yourls-api.php?action=shorturl&format=json&url=${encodeURIComponent(e)}`);if(!t.ok)throw Error(`Status ${t.status}`);let n=await t.json();if(n&&n.shorturl)return n.shorturl;throw Error(`Falha no tny.im`)}}];async function v(e,t=`isgd`){let n=_.find(e=>e.id===t)||_[0];try{let t=await n.shorten(e);if(t&&t.startsWith(`http`))return{shortUrl:t,providerName:n.name,usedFallback:!1}}catch(e){console.warn(`[Olivelas Shortener] Provedor ${n.name} falhou ou bloqueado por CORS. Ativando cascata de alta disponibilidade...`,e)}let r=[`isgd`,`vgd`,`dagd`,`clckru`].filter(e=>e!==t);for(let t of r){let n=_.find(e=>e.id===t);if(n)try{let t=await n.shorten(e);if(t&&t.startsWith(`http`))return{shortUrl:t,providerName:n.name,usedFallback:!0}}catch{console.warn(`[Olivelas Shortener] Cascata tentou ${n.name} sem sucesso. Passando para o próximo...`)}}throw Error(`Todos os serviços de encurtamento temporariamente indisponíveis.`)}function y(e){let t=65535;for(let n=0;n<e.length;n++){t^=e.charCodeAt(n)<<8;for(let e=0;e<8;e++)t=t&32768?(t<<1^4129)&65535:t<<1&65535}return t.toString(16).toUpperCase().padStart(4,`0`)}function b(e,t){return`${e}${String(t.length).padStart(2,`0`)}${t}`}function x(e,t){return e?e.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).replace(/[^A-Za-z0-9 ]/g,``).trim().toUpperCase().substring(0,t):``}function S(e,t=`auto`){let n=(e||``).trim();if(!n)return``;if(t===`email`||t===`auto`&&n.includes(`@`))return n.toLowerCase().trim();if(t===`cpf`)return n.replace(/\D/g,``).substring(0,11);if(t===`cnpj`)return n.replace(/\D/g,``).substring(0,14);if(t===`phone`){let e=n.replace(/\D/g,``);return e.startsWith(`55`)||e.length!==10&&e.length!==11||(e=`55`+e),`+`+e}if(t===`evp`)return n.toLowerCase().trim();if(n.startsWith(`+`))return`+`+n.replace(/\D/g,``);let r=n.replace(/\D/g,``);if(r.length===14)return r;if(n.includes(`(`)||n.includes(`-`)&&r.length>=10&&r.length<=11&&!n.includes(`.`)){let e=r;return e.startsWith(`55`)||(e=`55`+e),`+`+e}return n.includes(`.`)&&r.length===11||r.length===11&&n===r?r:n}function C(e){let t=S(e.key,e.keyType);if(!t)return``;let n=x(e.name||`RECEBEDOR`,25)||`RECEBEDOR`,r=x(e.city||`BRASILIA`,15)||`BRASILIA`,i=(e.txid||`***`).replace(/[^A-Za-z0-9]/g,``).substring(0,25)||`***`,a=b(`00`,`br.gov.bcb.pix`)+b(`01`,t);if(e.description){let t=x(e.description,25);t&&(a+=b(`02`,t))}let o=b(`00`,`01`)+b(`26`,a)+b(`52`,`0000`)+b(`53`,`986`);if(e.amount!==void 0&&e.amount!==null&&e.amount!==``){let t=typeof e.amount==`number`?e.amount:parseFloat(String(e.amount).replace(`,`,`.`));!isNaN(t)&&t>0&&(o+=b(`54`,t.toFixed(2)))}o+=b(`58`,`BR`)+b(`59`,n)+b(`60`,r)+b(`62`,b(`05`,i))+`6304`;let s=y(o);return o+s}function w(e){return e?String(e).replace(/\\/g,`\\\\`).replace(/;/g,`\\;`).replace(/,/g,`\\,`).replace(/:/g,`\\:`).replace(/"/g,`\\"`):``}function T(e){let t=(e.ssid||``).trim();if(!t)return``;let n=e.encryption||`WPA2`,r=`WIFI:T:${n===`WPA3`?`SAE`:n};S:${w(t)};`;if(n!==`nopass`){let t=e.password===void 0?``:e.password;r+=`P:${w(t)};`}return e.hidden&&(r+=`H:true;`),r+=`;`,r}function E(e,t,n){let r=document.createElement(`div`);r.className=`panel-card`,r.innerHTML=`
    <div class="panel-title-bar">
      <h2 class="panel-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        1. Conteúdo do QR Code
      </h2>
    </div>

    <!-- Segmented Control Elegante de Tipos de Conteúdo (Sem rolagem horizontal) -->
    <div class="content-type-tabs" role="tablist">
      <button class="content-type-btn ${e.contentType===`url`?`active`:``}" data-type="url" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>Link / URL</span>
      </button>
      <button class="content-type-btn ${e.contentType===`whatsapp`?`active`:``}" data-type="whatsapp" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>WhatsApp</span>
      </button>
      <button class="content-type-btn ${e.contentType===`pix`?`active`:``}" data-type="pix" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 12l10 10 10-10L12 2z"/><path d="M7 12h10"/><path d="M12 7v10"/></svg>
        <span>Pix</span>
      </button>
      <button class="content-type-btn ${e.contentType===`wifi`?`active`:``}" data-type="wifi" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        <span>Wi-Fi</span>
      </button>
      <button class="content-type-btn ${e.contentType===`vcard`?`active`:``}" data-type="vcard" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Contato</span>
      </button>
      <button class="content-type-btn ${e.contentType===`text`?`active`:``}" data-type="text" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        <span>Texto</span>
      </button>
    </div>

    <!-- Painel URL com Encurtadores -->
    <div id="content-panel-url" class="content-form-section ${e.contentType===`url`?``:`hidden`}">
      <div class="input-group">
        <span class="input-icon-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </span>
        <input type="url" id="input-main-url" class="input-text" placeholder="Cole sua URL aqui (ex: https://meusite.com.br)" value="${e.rawUrl}" spellcheck="false" autocomplete="off">
        <button type="button" id="btn-paste-clipboard" class="input-addon-btn" title="Colar link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          Colar
        </button>
      </div>

      <!-- Barra de Encurtamento de URL (10+ Provedores) -->
      <div class="shortener-bar-card">
        <div class="shortener-bar-header">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2m4.8 0L3 21"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/></svg>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Encurtador de URL</span>
            <span class="badge-tag-count" style="font-size: 0.7rem;">11 Serviços Disponíveis</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Links curtos geram QR Codes mais fáceis de escanear!</span>
        </div>

        <div class="shortener-controls-row">
          <select id="select-shortener-provider" class="shortener-select" aria-label="Selecione o encurtador">
            ${_.map(e=>{let t=e.id===`isgd`?` (Nativo) ★ Recomendado`:[`vgd`,`dagd`,`clckru`].includes(e.id)?` (Nativo)`:``;return`<option value="${e.id}" ${e.id===`isgd`?`selected`:``}>${e.name}${t}</option>`}).join(``)}
          </select>
          <button type="button" id="btn-execute-shorten" class="btn-shorten-action">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span id="btn-shorten-label">Encurtar URL</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Painel WhatsApp -->
    <div id="content-panel-whatsapp" class="content-form-section ${e.contentType===`whatsapp`?``:`hidden`}">
      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Número com DDI e DDD (ex: 5511999998888)</label>
          <input type="tel" id="input-wa-phone" class="input-text no-icon" placeholder="Ex: 5511999998888">
        </div>
        <div class="form-field-group">
          <label class="form-label">Mensagem Automática</label>
          <input type="text" id="input-wa-msg" class="input-text no-icon" placeholder="Ex: Olá, gostaria de mais informações!">
        </div>
      </div>
    </div>

    <!-- Painel Pix (Padrão Oficial BACEN / BR Code / EMV QRCPS-MPM) -->
    <div id="content-panel-pix" class="content-form-section ${e.contentType===`pix`?``:`hidden`}">
      <div class="pix-notice-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Gera código compatível com <strong>todos os aplicativos bancários</strong> (Nubank, Itaú, Bradesco, Santander, Inter, Caixa, BB, etc.)</span>
      </div>

      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Tipo de Chave</label>
          <select id="select-pix-keytype" class="input-text no-icon">
            <option value="auto">Detectar Automaticamente</option>
            <option value="phone">Celular (com DDD)</option>
            <option value="cpf">CPF (11 dígitos)</option>
            <option value="cnpj">CNPJ (14 dígitos)</option>
            <option value="email">E-mail</option>
            <option value="evp">Chave Aleatória (EVP)</option>
          </select>
        </div>

        <div class="form-field-group">
          <label class="form-label">Chave Pix *</label>
          <input type="text" id="input-pix-key" class="input-text no-icon" placeholder="Ex: 11999998888, maria@email.com, 123.456.789-00">
        </div>

        <div class="form-field-group">
          <label class="form-label">Nome do Beneficiário *</label>
          <input type="text" id="input-pix-name" class="input-text no-icon" placeholder="Ex: Maria Silva (máx 25 letras)">
        </div>

        <div class="form-field-group">
          <label class="form-label">Cidade *</label>
          <input type="text" id="input-pix-city" class="input-text no-icon" placeholder="Ex: SAO PAULO (máx 15 letras)">
        </div>

        <div class="form-field-group">
          <label class="form-label">Valor R$ (Opcional - deixe vazio p/ valor livre)</label>
          <input type="number" step="0.01" min="0" id="input-pix-amount" class="input-text no-icon" placeholder="Ex: 50.00">
        </div>

        <div class="form-field-group">
          <label class="form-label">Identificador / TxID (Opcional)</label>
          <input type="text" id="input-pix-txid" class="input-text no-icon" placeholder="Padrão: *** ou seu código de pedido">
        </div>

        <div class="form-field-group" style="grid-column: span 2;">
          <label class="form-label">Descrição / Mensagem (Opcional)</label>
          <input type="text" id="input-pix-desc" class="input-text no-icon" placeholder="Ex: Pagamento Pedido 104">
        </div>
      </div>

      <!-- Caixa de Visualização e Cópia do Pix Copia e Cola -->
      <div class="pix-copia-cola-box">
        <div class="pix-copia-cola-header">
          <div class="pix-badge-emv">
            <span class="pulse-mini"></span>
            <span>BR Code Oficial (EMV)</span>
          </div>
          <button type="button" id="btn-copy-pix-code" class="btn-copy-pix">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copiar Pix Copia e Cola</span>
          </button>
        </div>
        <div class="pix-code-preview-wrap">
          <code id="pix-emv-display" class="pix-code-preview">Preencha sua chave acima para gerar o código...</code>
        </div>
      </div>
    </div>

    <!-- Painel Wi-Fi (Padrão Universal ZXing / iOS / Android) -->
    <div id="content-panel-wifi" class="content-form-section ${e.contentType===`wifi`?``:`hidden`}">
      <div class="pix-notice-banner" style="background: rgba(14, 165, 233, 0.08); border-color: rgba(14, 165, 233, 0.25);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        <span>Aponte a câmera do celular (iPhone ou Android) para <strong>conectar automaticamente ao Wi-Fi</strong> sem precisar digitar a senha.</span>
      </div>

      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Nome da Rede (SSID) *</label>
          <input type="text" id="input-wifi-ssid" class="input-text no-icon" placeholder="Ex: MinhaCasa_5G">
        </div>

        <div class="form-field-group">
          <label class="form-label">Tipo de Segurança *</label>
          <select id="select-wifi-enc" class="input-text no-icon">
            <option value="WPA2" selected>WPA2 / WPA2-PSK (AES) — Recomendado / Mais Comum</option>
            <option value="WPA">WPA / WPA-PSK (Universal / Roteadores Antigos)</option>
            <option value="WPA3">WPA3-Personal (SAE)</option>
            <option value="WEP">WEP (Legado)</option>
            <option value="nopass">Rede Aberta (Sem senha)</option>
          </select>
        </div>

        <div class="form-field-group" id="group-wifi-pass">
          <label class="form-label">Senha do Wi-Fi</label>
          <div style="position: relative; display: flex; align-items: center; width: 100%;">
            <input type="password" id="input-wifi-pass" class="input-text no-icon" placeholder="Senha da rede (mín. 8 caracteres)" style="padding-right: 2.5rem; width: 100%;">
            <button type="button" id="btn-toggle-wifi-pass" style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: grid; place-items: center; padding: 0.2rem;" title="Mostrar/ocultar senha">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <span id="wifi-pass-hint" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">Mínimo 8 caracteres para WPA2/WPA/WPA3</span>
        </div>

        <div class="form-field-group" style="justify-content: flex-end; padding-bottom: 0.2rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; user-select: none; color: var(--text-secondary);">
            <input type="checkbox" id="input-wifi-hidden" style="width: 16px; height: 16px; accent-color: var(--brand-primary); cursor: pointer;">
            <span>Rede Oculta (Não transmite SSID)</span>
          </label>
        </div>

        <div style="grid-column: span 2; display: flex; justify-content: flex-end;">
          <button type="button" id="btn-apply-wifi-logo" class="btn-secondary-action" style="font-size: 0.78rem; padding: 0.35rem 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
            <span>Inserir Logo Oficial Wi-Fi no centro do QR Code</span>
          </button>
        </div>
      </div>

      <!-- Caixa de Visualização do Código de Conexão -->
      <div class="pix-copia-cola-box" style="margin-top: 1rem;">
        <div class="pix-copia-cola-header">
          <div class="pix-badge-emv" style="color: #0284c7;">
            <span class="pulse-mini" style="background: #0284c7; box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.7);"></span>
            <span>Padrão Universal ZXing (WIFI:)</span>
          </div>
          <button type="button" id="btn-copy-wifi-code" class="btn-copy-pix" style="background: #0284c7;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copiar Código Wi-Fi</span>
          </button>
        </div>
        <div class="pix-code-preview-wrap">
          <code id="wifi-code-display" class="pix-code-preview">Preencha o nome da rede (SSID) acima para gerar o código...</code>
        </div>
      </div>
    </div>

    <!-- Painel VCard / Contato -->
    <div id="content-panel-vcard" class="content-form-section ${e.contentType===`vcard`?``:`hidden`}">
      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Nome Completo</label>
          <input type="text" id="input-vcard-name" class="input-text no-icon" placeholder="Ex: Carlos Eduardo">
        </div>
        <div class="form-field-group">
          <label class="form-label">Telefone / WhatsApp</label>
          <input type="tel" id="input-vcard-tel" class="input-text no-icon" placeholder="+55 11 98888-7777">
        </div>
        <div class="form-field-group">
          <label class="form-label">E-mail</label>
          <input type="email" id="input-vcard-email" class="input-text no-icon" placeholder="carlos@empresa.com">
        </div>
        <div class="form-field-group">
          <label class="form-label">Empresa / Cargo</label>
          <input type="text" id="input-vcard-org" class="input-text no-icon" placeholder="Ex: Diretor de Tecnologia">
        </div>
      </div>
    </div>

    <!-- Painel Texto Livre -->
    <div id="content-panel-text" class="content-form-section ${e.contentType===`text`?``:`hidden`}">
      <div class="form-field-group">
        <label class="form-label">Texto</label>
        <textarea id="input-text-free" class="input-text no-icon" rows="3" placeholder="Digite ou cole qualquer texto aqui..."></textarea>
      </div>
    </div>
  `,r.querySelectorAll(`.content-type-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=e.getAttribute(`data-type`);r.querySelectorAll(`.content-type-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),r.querySelectorAll(`.content-form-section`).forEach(e=>e.classList.add(`hidden`)),r.querySelector(`#content-panel-${n}`)?.classList.remove(`hidden`),t({contentType:n}),u()})});let i=r.querySelector(`#input-main-url`);i?.addEventListener(`input`,()=>{let e=i.value.trim();e&&!e.startsWith(`http://`)&&!e.startsWith(`https://`)&&(e=`https://`+e),t({rawUrl:i.value,data:e||`https://github.com/pycriador/olivelas-qrcode`})}),r.querySelector(`#btn-paste-clipboard`)?.addEventListener(`click`,async()=>{try{let e=await navigator.clipboard.readText();if(e){i.value=e;let r=e.trim();r&&!r.startsWith(`http://`)&&!r.startsWith(`https://`)&&(r=`https://`+r),t({rawUrl:e,data:r}),n(`Link colado com sucesso!`)}}catch{i.focus(),n(`Pressione Ctrl+V para colar`)}});let a=r.querySelector(`#btn-execute-shorten`),o=r.querySelector(`#select-shortener-provider`),s=r.querySelector(`#btn-shorten-label`);a?.addEventListener(`click`,async()=>{let e=i.value.trim();if(!e){n(`Por favor, digite ou cole uma URL primeiro`),i.focus();return}let r=e;!r.startsWith(`http://`)&&!r.startsWith(`https://`)&&(r=`https://`+r);let c=o.value;a.disabled=!0,s.textContent=`Encurtando...`;try{let e=await v(r,c);if(e&&e.shortUrl){i.value=e.shortUrl,t({rawUrl:e.shortUrl,data:e.shortUrl});try{await navigator.clipboard.writeText(e.shortUrl)}catch{}e.usedFallback?n(`Encurtado com ${e.providerName} (alta disponibilidade)! Copiado!`):n(`Encurtado via ${e.providerName}! Link copiado com sucesso!`)}else throw Error(`Retorno vazio`)}catch(e){n(`Erro ao encurtar: ${e.message||`Tente novamente.`}`)}finally{a.disabled=!1,s.textContent=`Encurtar URL`}}),r.querySelector(`#btn-copy-pix-code`)?.addEventListener(`click`,async()=>{let e=r.querySelector(`#input-pix-key`)?.value.trim();if(!e){n(`Digite uma chave Pix primeiro para gerar o código`),r.querySelector(`#input-pix-key`)?.focus();return}let t=C({key:e,keyType:r.querySelector(`#select-pix-keytype`)?.value||`auto`,name:r.querySelector(`#input-pix-name`)?.value.trim(),city:r.querySelector(`#input-pix-city`)?.value.trim(),amount:r.querySelector(`#input-pix-amount`)?.value.trim(),txid:r.querySelector(`#input-pix-txid`)?.value.trim(),description:r.querySelector(`#input-pix-desc`)?.value.trim()});if(t)try{await navigator.clipboard.writeText(t),n(`Código Pix Copia e Cola copiado com sucesso! Válido em qualquer banco.`)}catch{n(`Código Pix gerado!`)}}),r.querySelector(`#btn-copy-wifi-code`)?.addEventListener(`click`,async()=>{let e=r.querySelector(`#input-wifi-ssid`)?.value.trim();if(!e){n(`Digite o nome da rede Wi-Fi primeiro`),r.querySelector(`#input-wifi-ssid`)?.focus();return}let t=T({ssid:e,password:r.querySelector(`#input-wifi-pass`)?.value||``,encryption:r.querySelector(`#select-wifi-enc`)?.value||`WPA`,hidden:r.querySelector(`#input-wifi-hidden`)?.checked||!1});if(t)try{await navigator.clipboard.writeText(t),n(`Código de conexão Wi-Fi copiado com sucesso!`)}catch{n(`Código Wi-Fi gerado!`)}});let c=r.querySelector(`#btn-toggle-wifi-pass`),l=r.querySelector(`#input-wifi-pass`);c?.addEventListener(`click`,()=>{l&&(l.type=l.type===`password`?`text`:`password`)}),r.querySelector(`#btn-apply-wifi-logo`)?.addEventListener(`click`,()=>{t({logoType:`wikipedia`,selectedWikipediaLogoId:`wifi`}),n(`Logotipo oficial do Wi-Fi aplicado ao centro do QR Code!`)});let u=()=>{let n=r.querySelector(`#input-wa-phone`)?.value.replace(/\D/g,``)||``,i=encodeURIComponent(r.querySelector(`#input-wa-msg`)?.value||``),a=r.querySelector(`#input-pix-key`)?.value.trim()||``,o=r.querySelector(`#select-pix-keytype`)?.value||`auto`,s=r.querySelector(`#input-pix-name`)?.value.trim()||``,c=r.querySelector(`#input-pix-city`)?.value.trim()||``,l=r.querySelector(`#input-pix-amount`)?.value.trim()||``,u=r.querySelector(`#input-pix-txid`)?.value.trim()||``,d=r.querySelector(`#input-pix-desc`)?.value.trim()||``,f=r.querySelector(`#pix-emv-display`),p=r.querySelector(`#input-wifi-ssid`)?.value.trim()||``,m=r.querySelector(`#input-wifi-pass`)?.value||``,h=r.querySelector(`#select-wifi-enc`)?.value||`WPA2`,g=r.querySelector(`#input-wifi-hidden`)?.checked||!1,_=r.querySelector(`#wifi-code-display`),v=r.querySelector(`#group-wifi-pass`),y=r.querySelector(`#wifi-pass-hint`);v&&(v.style.display=h===`nopass`?`none`:`flex`),y&&(h===`nopass`?(y.textContent=`Rede aberta não necessita de senha.`,y.style.color=`var(--text-muted)`):m.length>0&&m.length<8&&(h===`WPA2`||h===`WPA`||h===`WPA3`)?(y.textContent=`⚠️ Atenção: Senhas WPA/WPA2 devem ter no mínimo 8 caracteres para os celulares conectarem.`,y.style.color=`#ef4444`):(y.textContent=`Mínimo de 8 caracteres para redes WPA2/WPA/WPA3.`,y.style.color=`var(--text-muted)`));let b=r.querySelector(`#input-vcard-name`)?.value||``,x=r.querySelector(`#input-vcard-tel`)?.value||``,S=r.querySelector(`#input-vcard-email`)?.value||``,w=r.querySelector(`#input-vcard-org`)?.value||``,E=r.querySelector(`#input-text-free`)?.value||``,D=e.data;if(e.contentType===`whatsapp`)D=`https://wa.me/${n}${i?`?text=`+i:``}`;else if(e.contentType===`pix`){if(a){let e=C({key:a,keyType:o,name:s,city:c,amount:l,txid:u,description:d});D=e,f&&(f.textContent=e)}else D=`00020126330014br.gov.bcb.pix0111000000000005204000053039865802BR5910RECEBEDOR6008BRASILIA62070503***63045E1B`,f&&(f.textContent=`Preencha sua chave acima para gerar o código...`)}else if(e.contentType===`wifi`){if(p){let e=T({ssid:p,password:m,encryption:h,hidden:g});D=e,_&&(_.textContent=e)}else D=`WIFI:T:WPA2;S:MinhaRede_5G;P:senha123;;`,_&&(_.textContent=`Preencha o nome da rede (SSID) acima para gerar o código...`)}else e.contentType===`vcard`?D=`BEGIN:VCARD\nVERSION:3.0\nN:${b}\nFN:${b}\nORG:${w}\nTEL:${x}\nEMAIL:${S}\nEND:VCARD`:e.contentType===`text`&&(D=E||`Olá, mundo!`);t({data:D})};return[`input-wa-phone`,`input-wa-msg`,`select-pix-keytype`,`input-pix-key`,`input-pix-name`,`input-pix-city`,`input-pix-amount`,`input-pix-txid`,`input-pix-desc`,`input-wifi-ssid`,`input-wifi-pass`,`select-wifi-enc`,`input-wifi-hidden`,`input-vcard-name`,`input-vcard-tel`,`input-vcard-email`,`input-vcard-org`,`input-text-free`].forEach(e=>{let t=r.querySelector(`#${e}`);t&&(t.addEventListener(`input`,u),t.addEventListener(`change`,u))}),r}function D(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=e=>{let n=new Image;n.onload=()=>{let r=document.createElement(`canvas`);r.width=600,r.height=600;let i=r.getContext(`2d`);if(!i){t(e.target?.result);return}i.fillStyle=`#ffffff`,i.beginPath(),i.roundRect(0,0,600,600,140),i.fill(),i.lineWidth=8,i.strokeStyle=`#e2e8f0`,i.stroke();let a=460,o=460,s=n.width/n.height;s>1?(a=460,o=460/s):(o=460,a=460*s);let c=(600-a)/2,l=(600-o)/2;i.drawImage(n,c,l,a,o),t(r.toDataURL(`image/png`,.95))},n.onerror=()=>t(e.target?.result),n.src=e.target?.result},r.onerror=n,r.readAsDataURL(e)})}function O(e,t,n){let r=document.createElement(`div`);r.className=`custom-section`,r.innerHTML=`
    <div class="section-label">
      <span>Logotipo Central Oficial (Wikipedia / Wikimedia Commons)</span>
      <span class="badge-tag-count">Vetores Padronizados</span>
    </div>
    <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.85rem; line-height: 1.5;">
      Ícones oficiais com escudo protetor branco integrado para evitar colisão com os pontos e garantir 100% de legibilidade na leitura.
    </p>

    <!-- Upload de Logo Próprio -->
    <div id="box-upload-logo" class="upload-logo-box">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <div>
        <span style="font-weight: 600; display: block;">Enviar Imagem Personalizada</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Ajustada automaticamente sem distorções</span>
      </div>
      <input type="file" id="input-file-custom-logo" accept="image/*" class="hidden">
    </div>

    <!-- Feedback do arquivo carregado -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; min-height: 24px;">
      <span id="label-custom-logo-name" style="font-size: 0.8rem; font-weight: 600; color: var(--brand-primary);">${e.customLogoFileName||``}</span>
      <button type="button" id="btn-clear-logo" style="background: none; border: none; font-size: 0.75rem; color: var(--brand-danger); cursor: pointer; text-decoration: underline; ${e.logoType===`none`?`display: none;`:``}">Remover Logo</button>
    </div>

    <!-- Grade de Ícones Oficiais do Wikimedia -->
    <div style="margin-top: 1rem;">
      <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.6rem;">
        Ou escolha uma marca oficial:
      </span>
      <div class="wiki-logos-grid">
        ${d.map(t=>`
          <div class="wiki-logo-card ${e.logoType===`wikipedia`&&e.selectedWikipediaLogoId===t.id?`active`:``}" data-wiki-id="${t.id}" title="${t.name}">
            <div class="wiki-logo-icon-wrap">
              <img src="${t.badgeDataUrl}" alt="${t.name}" width="38" height="38" style="display: block; border-radius: 8px; pointer-events: none;" />
            </div>
            <span class="wiki-logo-name">${t.name}</span>
            <a href="${t.wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wiki-source-link" title="Ver arquivo original no Wikimedia Commons">
              Wikimedia
            </a>
          </div>
        `).join(``)}
      </div>
    </div>

    <!-- Sliders de Ajuste -->
    <div class="slider-group" style="margin-top: 1.25rem;">
      <div class="slider-header">
        <span>Tamanho do Logotipo no QR Code</span>
        <span id="val-logo-size-indicator">${Math.round(e.logoSize*100)}%</span>
      </div>
      <input type="range" id="slider-logo-size-control" class="slider-input" min="0.15" max="0.40" step="0.05" value="${e.logoSize}">
    </div>
  `;let i=r.querySelector(`#input-file-custom-logo`);return r.querySelector(`#box-upload-logo`)?.addEventListener(`click`,()=>i.click()),i.addEventListener(`change`,async e=>{let i=e.target.files?.[0];if(i)try{let e=await D(i);r.querySelectorAll(`.wiki-logo-card`).forEach(e=>e.classList.remove(`active`)),r.querySelector(`#label-custom-logo-name`).textContent=`Arquivo: ${i.name}`,r.querySelector(`#btn-clear-logo`).style.display=`inline`,t({logoType:`custom`,customLogoDataUrl:e,customLogoFileName:i.name,selectedWikipediaLogoId:null}),n(`Logotipo ajustado com proporção perfeita!`)}catch{n(`Erro ao carregar a imagem selecionada.`)}}),r.querySelector(`#btn-clear-logo`)?.addEventListener(`click`,()=>{r.querySelectorAll(`.wiki-logo-card`).forEach(e=>e.classList.remove(`active`)),r.querySelector(`#label-custom-logo-name`).textContent=``,r.querySelector(`#btn-clear-logo`).style.display=`none`,t({logoType:`none`,selectedWikipediaLogoId:null,customLogoDataUrl:null,customLogoFileName:null}),n(`Logotipo removido`)}),r.querySelectorAll(`.wiki-logo-card`).forEach(i=>{i.addEventListener(`click`,a=>{if(a.target.tagName.toLowerCase()===`a`)return;let o=i.getAttribute(`data-wiki-id`),s=r.querySelector(`#btn-clear-logo`);e.logoType===`wikipedia`&&e.selectedWikipediaLogoId===o?(i.classList.remove(`active`),s.style.display=`none`,t({logoType:`none`,selectedWikipediaLogoId:null})):(r.querySelectorAll(`.wiki-logo-card`).forEach(e=>e.classList.remove(`active`)),i.classList.add(`active`),r.querySelector(`#label-custom-logo-name`).textContent=``,s.style.display=`inline`,t({logoType:`wikipedia`,selectedWikipediaLogoId:o,customLogoDataUrl:null,customLogoFileName:null}),n(`Logotipo oficial do Wikimedia aplicado!`))})}),r.querySelector(`#slider-logo-size-control`)?.addEventListener(`input`,e=>{let n=parseFloat(e.target.value);r.querySelector(`#val-logo-size-indicator`).textContent=`${Math.round(n*100)}%`,t({logoSize:n})}),r}function k(e,t){let n=document.createElement(`div`);n.className=`preset-gallery-wrapper`;let r=`all`,i=``,a=()=>{let a=n.querySelector(`#presets-dynamic-grid`);if(!a)return;a.innerHTML=``;let o=l.filter(e=>{let t=r===`all`||e.category===r,n=!i||e.name.toLowerCase().includes(i.toLowerCase());return t&&n});o.length===0?a.innerHTML=`<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted);">Nenhum estilo encontrado para sua busca.</div>`:o.forEach(r=>{let i=document.createElement(`div`);i.className=`preset-card ${e.activePresetId===r.id?`active`:``}`,i.setAttribute(`data-id`,r.id),i.innerHTML=`
        <div class="preset-preview-box" style="background: ${r.previewGradient}">
          <div class="preset-preview-inner"></div>
        </div>
        <span class="preset-title">${r.name}</span>
      `,i.addEventListener(`click`,()=>{n.querySelectorAll(`.preset-card`).forEach(e=>e.classList.remove(`active`)),i.classList.add(`active`),t(r)}),a.appendChild(i)})};return n.innerHTML=`
    <!-- Barra de Busca Moderna -->
    <div class="preset-search-container">
      <div class="preset-search-input-wrap">
        <svg class="preset-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="preset-search-input" class="preset-search-input" placeholder="Buscar entre os 54 modelos (ex: Indigo, Instagram, Luxo, Neon...)" autocomplete="off">
      </div>
    </div>

    <!-- Filtros de Categoria em Chips Fluidos e Elegantes -->
    <div class="preset-filter-bar" role="tablist">
      <button class="filter-chip active" data-cat="all" type="button">
        <span>Todos</span>
        <span class="chip-count">54</span>
      </button>
      <button class="filter-chip" data-cat="popular" type="button"><span>🌟 Populares</span></button>
      <button class="filter-chip" data-cat="business" type="button"><span>💼 Corporativo & Luxo</span></button>
      <button class="filter-chip" data-cat="creative" type="button"><span>🎨 Gradientes Vibrantes</span></button>
      <button class="filter-chip" data-cat="social" type="button"><span>📱 Redes Sociais</span></button>
      <button class="filter-chip" data-cat="dark" type="button"><span>🌑 AMOLED & Cyber</span></button>
      <button class="filter-chip" data-cat="pastel" type="button"><span>🌸 Tons Pastel</span></button>
    </div>

    <!-- Grade Dinâmica -->
    <div id="presets-dynamic-grid" class="presets-grid"></div>
  `,n.querySelector(`#preset-search-input`)?.addEventListener(`input`,e=>{i=e.target.value,a()}),n.querySelectorAll(`.filter-chip`).forEach(e=>{e.addEventListener(`click`,()=>{n.querySelectorAll(`.filter-chip`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),r=e.getAttribute(`data-cat`)||`all`,a()})}),setTimeout(a,0),n}function A(e,t,n){let r=document.createElement(`div`);r.className=`panel-card`;let i=`presets`;return r.innerHTML=`
    <!-- Navegação de Sub-Abas -->
    <div class="nav-tab-pills" role="tablist">
      <button class="nav-pill-btn active" data-subtab="presets">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        54+ Estilos Prontos
      </button>
      <button class="nav-pill-btn" data-subtab="custom">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Personalização Granular
      </button>
    </div>

    <!-- Container da Galeria de Presets -->
    <div id="subtab-content-presets"></div>

    <!-- Container da Customização Granular com Layout em Grid Ampla -->
    <div id="subtab-content-custom" class="hidden">
      <div class="custom-grid-layout">
        
        <!-- Coluna 1: Formas, Cantos e Logotipos -->
        <div class="custom-col">
          <!-- 1. Formato dos Pontos -->
          <div class="custom-section">
            <div class="section-label">
              <span>Formato dos Pontos (Dots)</span>
              <span class="badge-tag-count">6 opções</span>
            </div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${e.dotsType===`rounded`?`active`:``}" data-dots="rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg>
                Arredondado
              </button>
              <button class="shape-opt-btn ${e.dotsType===`dots`?`active`:``}" data-dots="dots">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/></svg>
                Pontos
              </button>
              <button class="shape-opt-btn ${e.dotsType===`classy`?`active`:``}" data-dots="classy">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="16" height="16" x="4" y="4" rx="3"/></svg>
                Elegante
              </button>
              <button class="shape-opt-btn ${e.dotsType===`classy-rounded`?`active`:``}" data-dots="classy-rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12a8 8 0 0 1 8-8h8v8a8 8 0 0 1-8 8H4z"/></svg>
                Curvo Suave
              </button>
              <button class="shape-opt-btn ${e.dotsType===`square`?`active`:``}" data-dots="square">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3"/></svg>
                Quadrado
              </button>
              <button class="shape-opt-btn ${e.dotsType===`extra-rounded`?`active`:``}" data-dots="extra-rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3" rx="8"/></svg>
                Ultra Curvo
              </button>
            </div>
          </div>

          <!-- 2. Formato dos Cantos -->
          <div class="custom-section">
            <div class="section-label"><span>Marcador Externo dos Cantos</span></div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${e.cornersSquareType===`extra-rounded`?`active`:``}" data-cs="extra-rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="4" rx="5"/></svg>
                Arredondado
              </button>
              <button class="shape-opt-btn ${e.cornersSquareType===`square`?`active`:``}" data-cs="square">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="4"/></svg>
                Quadrado
              </button>
              <button class="shape-opt-btn ${e.cornersSquareType===`dot`?`active`:``}" data-cs="dot">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="8"/></svg>
                Circular
              </button>
            </div>

            <div class="section-label" style="margin-top: 1rem;"><span>Ponto Central do Canto</span></div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${e.cornersDotType===`dot`?`active`:``}" data-cd="dot">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                Círculo
              </button>
              <button class="shape-opt-btn ${e.cornersDotType===`square`?`active`:``}" data-cd="square">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="12" height="12" x="6" y="6"/></svg>
                Quadrado
              </button>
            </div>
          </div>

          <!-- 4. Seção de Logotipos Oficiais da Wikipedia -->
          <div id="subtab-icon-selector-slot"></div>
        </div>

        <!-- Coluna 2: Cores, Molduras e Exportação -->
        <div class="custom-col">
          <!-- 3. Cores e Gradientes -->
          <div class="custom-section">
            <div class="section-label"><span>Cores & Gradientes</span></div>
            
            <div class="color-picker-row">
              <div class="color-input-wrapper">
                <input type="color" id="ctrl-dots-color" class="color-picker-native" value="${e.dotsColor}" aria-label="Cor principal">
                <span id="hex-label-dots1" class="color-hex-text">${e.dotsColor}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" id="chk-gradient" ${e.dotsGradientEnabled?`checked`:``}>
                <label for="chk-gradient" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Habilitar Gradiente</label>
              </div>
            </div>

            <div id="wrapper-grad-controls" class="${e.dotsGradientEnabled?``:`hidden`}">
              <div class="color-picker-row">
                <label style="font-size: 0.8rem; font-weight: 600; min-width: 90px;">Segunda Cor:</label>
                <div class="color-input-wrapper">
                  <input type="color" id="ctrl-dots-color2" class="color-picker-native" value="${e.dotsColor2}" aria-label="Segunda cor">
                  <span id="hex-label-dots2" class="color-hex-text">${e.dotsColor2}</span>
                </div>
              </div>

              <div class="slider-group">
                <div class="slider-header">
                  <span>Ângulo de Rotação</span>
                  <span id="val-grad-rot">${e.dotsGradientRotation}°</span>
                </div>
                <input type="range" id="slider-grad-rot" class="slider-input" min="0" max="360" value="${e.dotsGradientRotation}">
              </div>
            </div>

            <!-- Fundo -->
            <div style="margin-top: 1rem;">
              <div class="section-label"><span>Cor de Fundo</span></div>
              <div class="color-picker-row">
                <div class="color-input-wrapper">
                  <input type="color" id="ctrl-bg-color" class="color-picker-native" value="${e.bgColor}" aria-label="Cor de fundo">
                  <span id="hex-label-bg" class="color-hex-text">${e.bgColor}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="checkbox" id="chk-bg-trans" ${e.bgTransparent?`checked`:``}>
                  <label for="chk-bg-trans" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Fundo Transparente</label>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Molduras / Call to Action -->
          <div class="custom-section">
            <div class="section-label"><span>Moldura e Chamada para Ação</span></div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${e.frameStyle===`none`?`active`:``}" data-frame="none">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Sem Moldura
              </button>
              <button class="shape-opt-btn ${e.frameStyle===`bottom`?`active`:``}" data-frame="bottom">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
                Texto Inferior
              </button>
              <button class="shape-opt-btn ${e.frameStyle===`top`?`active`:``}" data-frame="top">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" y1="7" x2="21" y2="7"/></svg>
                Badge Superior
              </button>
              <button class="shape-opt-btn ${e.frameStyle===`card`?`active`:``}" data-frame="card">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="4"/></svg>
                Card Elegante
              </button>
            </div>

            <div style="margin-top: 0.75rem;">
              <label class="form-label">Texto da Moldura</label>
              <input type="text" id="input-frame-label" class="input-text no-icon" value="${e.frameText}" placeholder="Ex: ESCANEIE-ME">
            </div>

            <div class="color-picker-row" style="margin-top: 0.75rem;">
              <label style="font-size: 0.8rem; font-weight: 600; min-width: 110px;">Cor da Moldura:</label>
              <div class="color-input-wrapper">
                <input type="color" id="ctrl-frame-bg" class="color-picker-native" value="${e.frameBgColor}">
              </div>
            </div>
          </div>

          <!-- 6. Configurações Técnicas de Exportação -->
          <div class="custom-section">
            <div class="section-label"><span>Qualidade & Resolução</span></div>
            <div class="form-grid-2">
              <div>
                <label class="form-label">Resolução de Download</label>
                <select id="select-export-res" class="input-text no-icon">
                  <option value="512" ${e.exportSize===512?`selected`:``}>512 x 512 px (Padrão Web)</option>
                  <option value="1024" ${e.exportSize===1024?`selected`:``}>1024 x 1024 px (Alta Definição)</option>
                  <option value="2048" ${e.exportSize===2048?`selected`:``}>2048 x 2048 px (Impressão Ultra HD)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Correção de Erros</label>
                <select id="select-error-corr" class="input-text no-icon">
                  <option value="L" ${e.errorCorrectionLevel===`L`?`selected`:``}>L (Baixa - 7%)</option>
                  <option value="M" ${e.errorCorrectionLevel===`M`?`selected`:``}>M (Média - 15%)</option>
                  <option value="Q" ${e.errorCorrectionLevel===`Q`?`selected`:``}>Q (Alta - 25% Recomendado)</option>
                  <option value="H" ${e.errorCorrectionLevel===`H`?`selected`:``}>H (Máxima - 30% Ideal p/ Logos)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,r.querySelector(`#subtab-content-presets`).appendChild(k(e,r=>{t({activePresetId:r.id,dotsType:r.dotsType,cornersSquareType:r.cornersSquareType,cornersDotType:r.cornersDotType,bgColor:r.bgColor,bgTransparent:!1,dotsColor:r.dotsColor,dotsColor2:r.dotsGradient?.color2||`#7c3aed`,dotsGradientEnabled:!!r.dotsGradient,dotsGradientRotation:r.dotsGradient?.rotation||45,cornersSquareColor:r.cornersColor,cornersDotColor:r.cornersColor,cornersSync:!0,logoType:r.presetLogo?`wikipedia`:e.logoType,selectedWikipediaLogoId:r.presetLogo||null}),n(`Estilo "${r.name}" aplicado!`)})),r.querySelector(`#subtab-icon-selector-slot`).appendChild(O(e,t,n)),r.querySelectorAll(`.nav-pill-btn`).forEach(e=>{e.addEventListener(`click`,()=>{i=e.getAttribute(`data-subtab`)||`presets`,r.querySelectorAll(`.nav-pill-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),r.querySelector(`#subtab-content-presets`)?.classList.toggle(`hidden`,i!==`presets`),r.querySelector(`#subtab-content-custom`)?.classList.toggle(`hidden`,i!==`custom`)})}),r.querySelectorAll(`[data-dots]`).forEach(e=>{e.addEventListener(`click`,()=>{r.querySelectorAll(`[data-dots]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),t({dotsType:e.getAttribute(`data-dots`),activePresetId:null})})}),r.querySelectorAll(`[data-cs]`).forEach(e=>{e.addEventListener(`click`,()=>{r.querySelectorAll(`[data-cs]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),t({cornersSquareType:e.getAttribute(`data-cs`),activePresetId:null})})}),r.querySelectorAll(`[data-cd]`).forEach(e=>{e.addEventListener(`click`,()=>{r.querySelectorAll(`[data-cd]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),t({cornersDotType:e.getAttribute(`data-cd`),activePresetId:null})})}),r.querySelector(`#ctrl-dots-color`)?.addEventListener(`input`,e=>{let n=e.target.value;r.querySelector(`#hex-label-dots1`).textContent=n,t({dotsColor:n,activePresetId:null})}),r.querySelector(`#ctrl-dots-color2`)?.addEventListener(`input`,e=>{let n=e.target.value;r.querySelector(`#hex-label-dots2`).textContent=n,t({dotsColor2:n,activePresetId:null})}),r.querySelector(`#chk-gradient`)?.addEventListener(`change`,e=>{let n=e.target.checked;r.querySelector(`#wrapper-grad-controls`)?.classList.toggle(`hidden`,!n),t({dotsGradientEnabled:n,activePresetId:null})}),r.querySelector(`#slider-grad-rot`)?.addEventListener(`input`,e=>{let n=parseInt(e.target.value,10);r.querySelector(`#val-grad-rot`).textContent=`${n}°`,t({dotsGradientRotation:n})}),r.querySelector(`#ctrl-bg-color`)?.addEventListener(`input`,e=>{let n=e.target.value;r.querySelector(`#hex-label-bg`).textContent=n,t({bgColor:n,bgTransparent:!1})}),r.querySelector(`#chk-bg-trans`)?.addEventListener(`change`,e=>{t({bgTransparent:e.target.checked})}),r.querySelectorAll(`[data-frame]`).forEach(e=>{e.addEventListener(`click`,()=>{r.querySelectorAll(`[data-frame]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),t({frameStyle:e.getAttribute(`data-frame`)})})}),r.querySelector(`#input-frame-label`)?.addEventListener(`input`,e=>{t({frameText:e.target.value})}),r.querySelector(`#ctrl-frame-bg`)?.addEventListener(`input`,e=>{t({frameBgColor:e.target.value})}),r.querySelector(`#select-export-res`)?.addEventListener(`change`,e=>{t({exportSize:parseInt(e.target.value,10)})}),r.querySelector(`#select-error-corr`)?.addEventListener(`change`,e=>{t({errorCorrectionLevel:e.target.value})}),r}function j(e,t,n,r){let i=document.createElement(`aside`);i.className=`preview-column ${e.isSidebarCollapsed?`collapsed`:``}`,i.innerHTML=`
    <!-- Dock Flutuante na Lateral quando minimizado/oculto -->
    <div class="docked-preview-pill ${e.isSidebarCollapsed?``:`hidden`}" id="btn-expand-dock" title="Clique para reabrir a pré-visualização fixa">
      <div class="docked-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/><rect width="8" height="8" x="2" y="14" rx="2"/><rect width="4" height="4" x="15" y="15" rx="1"/></svg>
      </div>
      <span class="docked-text">Abrir QR Code</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </div>

    <!-- Painel Principal de Preview FIXO na Lateral -->
    <div class="preview-sticky-card ${e.isSidebarCollapsed?`hidden`:``}">
      
      <!-- Cabeçalho Elegante do Preview -->
      <div class="preview-card-header">
        <div class="preview-title-wrap">
          <span class="live-status-pulse" title="Atualização em tempo real"></span>
          <span class="preview-header-title">QR Code em Tempo Real</span>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span id="badge-contrast-check" class="contrast-badge ok">✓ Ótimo</span>
          <button type="button" id="btn-collapse-sidebar" class="btn-hide-preview-sidebar" title="Ocultar painel lateral">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            <span>Ocultar</span>
          </button>
        </div>
      </div>

      <!-- Moldura Composta em Tempo Real -->
      <div id="preview-frame-wrap" class="preview-frame-wrapper" style="background: ${e.frameStyle===`bottom`?e.frameBgColor:`#ffffff`}; border: ${e.frameStyle===`card`?`3px solid ${e.dotsColor}`:`none`};">
        <div id="preview-badge-top" class="preview-frame-badge-top ${e.frameStyle===`top`?``:`hidden`}" style="background: ${e.frameBgColor}; color: ${e.frameTextColor};">
          ${e.frameText||`SCAN HERE`}
        </div>

        <div id="qr-canvas-holder" class="preview-canvas-container">
          <!-- Canvas é montado pelo qrEngine -->
        </div>

        <div id="preview-text-bottom" class="preview-frame-text-bottom ${e.frameStyle===`bottom`||e.frameStyle===`card`?``:`hidden`}" style="color: ${e.frameStyle===`bottom`?e.frameTextColor:e.dotsColor};">
          ${e.frameText||`ESCANEIE-ME`}
        </div>
      </div>

      <!-- Metadados Compactos de Destino e Resolução -->
      <div class="qr-meta-status">
        <div class="meta-row">
          <span class="meta-target-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span id="preview-data-url-label" class="meta-pill" title="${e.data}">${e.data}</span>
          </span>
          <span class="meta-res-badge">${e.exportSize} px</span>
        </div>
      </div>

      <!-- Botões de Ação e Download (Grid Compacta e Equilibrada) -->
      <div class="download-actions-grid">
        <button type="button" id="btn-dl-png" class="btn-primary-download" title="Download da imagem em alta resolução (PNG)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Baixar PNG</span>
        </button>

        <button type="button" id="btn-dl-svg" class="btn-secondary-action btn-highlight-subtle" title="Download em vetor SVG escalável">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <span>Vetor (SVG)</span>
        </button>

        <button type="button" id="btn-copy-clip" class="btn-secondary-action" title="Copiar imagem direto para colar no WhatsApp, Figma, etc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copiar Imagem</span>
        </button>

        <button type="button" id="btn-share-url" class="btn-secondary-action" title="Copiar link direto para compartilhar este QR Code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span>Copiar Link</span>
        </button>

        <button type="button" id="btn-dl-webp" class="btn-secondary-action" title="Download no formato WebP">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <span>WebP</span>
        </button>

        <button type="button" id="btn-test-link" class="btn-secondary-action" title="Testar abertura do link no navegador">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Testar Link</span>
        </button>
      </div>

      <!-- Histórico Recente Colapsável (Zero interferência de altura) -->
      <details class="history-accordion">
        <summary class="history-summary">
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            <span>Histórico da Sessão</span>
          </div>
          <span class="history-expand-indicator">▾</span>
        </summary>
        <div id="history-items-list" class="history-dropdown-body"></div>
      </details>

    </div>
  `,i.querySelector(`#btn-collapse-sidebar`)?.addEventListener(`click`,n),i.querySelector(`#btn-expand-dock`)?.addEventListener(`click`,n),i.querySelector(`#btn-dl-png`)?.addEventListener(`click`,()=>{t.download(e,`png`),r(`Baixando imagem PNG em alta resolução...`)}),i.querySelector(`#btn-dl-svg`)?.addEventListener(`click`,()=>{t.download(e,`svg`),r(`Baixando vetor SVG escalável...`)}),i.querySelector(`#btn-dl-webp`)?.addEventListener(`click`,()=>{t.download(e,`webp`),r(`Baixando formato WebP...`)}),i.querySelector(`#btn-copy-clip`)?.addEventListener(`click`,async()=>{await t.copyToClipboard(e)?r(`QR Code copiado para a área de transferência! (Pode colar no WhatsApp, Figma, etc)`):r(`Não foi possível copiar automaticamente no navegador`)}),i.querySelector(`#btn-print`)?.addEventListener(`click`,()=>{t.print(e)}),i.querySelector(`#btn-share-url`)?.addEventListener(`click`,async()=>{try{let t=window.location.origin,n=window.location.pathname,i=new URLSearchParams;e.data&&i.set(`data`,e.data),e.activePresetId&&i.set(`preset`,e.activePresetId),e.dotsType&&i.set(`dots`,e.dotsType);let a=`${t}${n}#/?${i.toString()}`;await navigator.clipboard.writeText(a),r(`URL própria do seu QR copiada! Pronto para compartilhar.`)}catch{r(`Não foi possível copiar o link automaticamente`)}}),i.querySelector(`#btn-test-link`)?.addEventListener(`click`,()=>{e.data.startsWith(`http`)?window.open(e.data,`_blank`,`noopener,noreferrer`):r(`O conteúdo atual não é um link direto`)});let a=i.querySelector(`#history-items-list`);return setTimeout(()=>{try{let e=JSON.parse(localStorage.getItem(`olivelas_qr_history`)||`[]`);if(e.length===0){a.innerHTML=`<span style="font-size: 0.75rem; color: var(--text-muted);">Nenhum código gerado ainda.</span>`;return}a.innerHTML=e.map(e=>`
        <div class="history-chip" data-hist="${encodeURIComponent(e.data)}">
          <span class="history-chip-url">${e.data}</span>
          <span class="history-chip-time">${e.date}</span>
        </div>
      `).join(``),a.querySelectorAll(`.history-chip`).forEach(e=>{e.addEventListener(`click`,()=>{let t=decodeURIComponent(e.getAttribute(`data-hist`)||``),n=document.querySelector(`#input-main-url`);n&&(n.value=t,n.dispatchEvent(new Event(`input`)),r(`Código recente carregado!`))})})}catch{a.innerHTML=``}},0),i}function M(e,t){let n=document.createElement(`div`);return n.className=`docs-container`,n.innerHTML=`
    <!-- Layout em Grade Ampla para Documentação -->
    <div class="docs-grid-layout">
      
      <!-- Barra Lateral Sticky (Navegação & Downloads) -->
      <aside class="docs-sidebar-sticky">
        <div class="panel-card docs-nav-card">
          <a href="#/" id="btn-docs-back" class="btn-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar ao Criador Interativo
          </a>

          <!-- Indicador de URL Própria -->
          <div class="docs-url-badge-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">URL Própria da Página:</span>
              <span class="url-protocol-pill">#/docs</span>
            </div>
            <button type="button" id="btn-copy-docs-url" class="btn-copy-url-pill" title="Copiar URL direta para compartilhar esta página de documentação">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Copiar Link Direto
            </button>
          </div>

          <!-- Índice de Seções -->
          <nav class="docs-toc-nav" aria-label="Índice da Documentação">
            <span class="docs-toc-title">Sumário Rápido</span>
            <a href="#sec-curl" class="docs-toc-link">
              <span class="toc-badge">1</span>
              <span>Comandos cURL Rápidos</span>
            </a>
            <a href="#sec-python" class="docs-toc-link">
              <span class="toc-badge">2</span>
              <span>Script Python Automatizado</span>
            </a>
            <a href="#sec-params" class="docs-toc-link">
              <span class="toc-badge">3</span>
              <span>Parâmetros da API cURL</span>
            </a>
            <a href="#sec-shorteners" class="docs-toc-link">
              <span class="toc-badge">4</span>
              <span>11 Encurtadores via Terminal</span>
            </a>
          </nav>

          <!-- Scripts para Download Direto -->
          <div class="docs-downloads-box">
            <span class="docs-toc-title">Arquivos Prontos</span>
            <a href="scripts/generate_qr.py" download="generate_qr.py" class="btn-doc-download full-width">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar Script Python (.py)
            </a>
            <a href="scripts/curl_examples.sh" download="curl_examples.sh" class="btn-doc-download outline full-width">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Baixar Exemplos cURL (.sh)
            </a>
          </div>
        </div>
      </aside>

      <!-- Coluna Principal de Conteúdo -->
      <main class="docs-content-col">
        
        <!-- Header da Página -->
        <div class="docs-header-card">
          <h1 class="docs-main-title">📚 Documentação cURL & Scripts Python</h1>
          <p class="docs-subtitle">
            Gere, customize e baixe códigos QR Code em alta definição diretamente do terminal ou em pipelines automatizados de DevOps e scripts.
          </p>
        </div>

        <!-- SEÇÃO 1: COMANDOS cURL -->
        <section id="sec-curl" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">1</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Gerando QR Codes via cURL (100% Funcional)</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Comandos testados para rodar diretamente no terminal Linux, macOS ou Windows PowerShell.</p>
            </div>
          </div>

          <!-- Exemplo 1.1 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 1: Download de QR Code PNG em Alta Definição (1024x1024 px)</span>
              <button class="btn-copy-code" data-target="code-curl-1">Copiar Comando</button>
            </div>
            <pre><code id="code-curl-1">curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_1024.png</code></pre>
          </div>

          <!-- Exemplo 1.2 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 2: Download em Vetor SVG Escalável com Cores Personalizadas</span>
              <button class="btn-copy-code" data-target="code-curl-2">Copiar Comando</button>
            </div>
            <pre><code id="code-curl-2">curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=svg&dark=4f46e5&light=ffffff" -o qrcode_vector.svg</code></pre>
          </div>

          <!-- Exemplo 1.3 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 3: Pipeline: Encurtar URL e Baixar QR Code Automático (Linux/macOS)</span>
              <button class="btn-copy-code" data-target="code-curl-3">Copiar Bash</button>
            </div>
            <pre><code id="code-curl-3"># Encurta a URL via is.gd/TinyURL e gera o QR Code 1024px diretamente do link encurtado
SHORT_URL=$(curl -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode")
echo "URL Encurtada: $SHORT_URL"
curl -s "https://quickchart.io/qr?text=$SHORT_URL&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png</code></pre>
          </div>

          <!-- Exemplo 1.4 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 4: Pipeline no Windows (PowerShell)</span>
              <button class="btn-copy-code" data-target="code-curl-4">Copiar PowerShell</button>
            </div>
            <pre><code id="code-curl-4"># Encurta e baixa o QR Code no PowerShell (Windows)
$short = (curl.exe -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode")
Write-Host "URL Encurtada: $short"
curl.exe -s "https://quickchart.io/qr?text=$short&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png</code></pre>
          </div>

          <!-- Exemplo 1.5: Pix Oficial BACEN -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 5: Download de QR Code Pix Oficial (Padrão BACEN / BR Code)</span>
              <button class="btn-copy-code" data-target="code-curl-5">Copiar Comando Pix</button>
            </div>
            <pre><code id="code-curl-5"># Baixar QR Code Pix estático (EMV oficial reconhecido por qualquer app de banco)
curl -s -G "https://quickchart.io/qr"   --data-urlencode "text=00020126330014br.gov.bcb.pix011112345678900520400005303986540510.005802BR5913WILLIAN JESUS6008BRASILIA62070503***63043133"   --data-urlencode "size=1024"   --data-urlencode "format=png"   --data-urlencode "dark=059669"   --data-urlencode "light=ffffff"   -o qrcode_pix.png</code></pre>
          </div>

          <!-- Exemplo 1.6: Wi-Fi Conexão Automática -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 6: Download de QR Code Wi-Fi Universal (ZXing / iOS / Android)</span>
              <button class="btn-copy-code" data-target="code-curl-6">Copiar Comando Wi-Fi</button>
            </div>
            <pre><code id="code-curl-6"># Baixar QR Code de Wi-Fi para conexão automática (apontou a câmera, conectou)
curl -s -G "https://quickchart.io/qr"   --data-urlencode "text=WIFI:T:WPA;S:MinhaCasa_5G;P:minhasenha123;;"   --data-urlencode "size=1024"   --data-urlencode "format=png"   --data-urlencode "dark=0284c7"   --data-urlencode "light=ffffff"   -o qrcode_wifi.png</code></pre>
          </div>
        </section>

        <!-- SEÇÃO 2: SCRIPT PYTHON OFICIAL -->
        <section id="sec-python" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">2</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Script Python Automatizado (CLI)</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Script completo com suporte a cores personalizadas, encurtador de URL automático e alta resolução.</p>
            </div>
          </div>

          <div style="background: var(--bg-surface-secondary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
            <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem;">Instalação de Dependências:</h3>
            <pre><code style="font-family: monospace; font-size: 0.85rem;">pip install qrcode[pil] requests</code></pre>
          </div>

          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Como executar o script incluído no repositório (scripts/generate_qr.py):</span>
              <button class="btn-copy-code" data-target="code-py-cli">Copiar Exemplo</button>
            </div>
            <pre><code id="code-py-cli"># 1. Gerar QR Code padrão
python scripts/generate_qr.py --url "https://github.com/pycriador/olivelas-qrcode"

# 2. Gerar QR Code Pix Oficial (Padrão BACEN / BR Code)
python scripts/generate_qr.py --pix-key "12345678900" --pix-name "Willian Jesus" --pix-amount 25.00 -o pix_25.png

# 3. Gerar QR Code Wi-Fi para conexão automática (iOS e Android)
python scripts/generate_qr.py --wifi-ssid "MinhaCasa_5G" --wifi-pass "minhasenha123" -o wifi_casa.png

# 4. Gerar com cor customizada (#4f46e5) e resolução 1024px
python scripts/generate_qr.py --url "https://meusite.com" --color "#4f46e5" --size 1024 --output meu_qrcode.png

# 5. Encurtar automaticamente a URL antes de gerar o código
python scripts/generate_qr.py --url "https://meusite.com/artigo-longo" --shorten isgd --output qr_curto.png</code></pre>
          </div>

          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Código Python Independente (Pronto para Copiar):</span>
              <button class="btn-copy-code" data-target="code-py-full">Copiar Código Python</button>
            </div>
            <pre><code id="code-py-full">import qrcode
import requests
from PIL import Image

def generate_qr(url: str, output_path: str = "qrcode.png", fill_color: str = "#4f46e5", back_color: str = "#ffffff"):
    """Gera um QR Code em alta definição e salva no disco."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20, # Alta definição
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color)
    img.save(output_path)
    print(f"[OK] QR Code salvo com sucesso em: {output_path}")

if __name__ == "__main__":
    generate_qr("https://github.com/pycriador/olivelas-qrcode", "olivelas_qr.png")</code></pre>
          </div>
        </section>

        <!-- SEÇÃO 3: PARÂMETROS E TABELA DE REFERÊNCIA -->
        <section id="sec-params" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">3</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Tabela de Parâmetros da API cURL</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Valores suportados para customizações rápidas via chamadas HTTP.</p>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Parâmetro</th>
                  <th>Tipo</th>
                  <th>Padrão</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>data</code> / <code>text</code></td>
                  <td>String (URL-encoded)</td>
                  <td>Obrigatório</td>
                  <td>O conteúdo, link ou mensagem que o QR Code irá codificar.</td>
                </tr>
                <tr>
                  <td><code>size</code></td>
                  <td>Inteiro (px)</td>
                  <td><code>1024</code></td>
                  <td>Dimensões quadradas da imagem final (ex: 512, 1024, 2048).</td>
                </tr>
                <tr>
                  <td><code>format</code></td>
                  <td><code>png</code> | <code>svg</code> | <code>webp</code></td>
                  <td><code>png</code></td>
                  <td>Formato do arquivo resultante. Use <code>svg</code> para impressão gráfica e corte.</td>
                </tr>
                <tr>
                  <td><code>dark</code> / <code>color</code></td>
                  <td>Hexadecimal</td>
                  <td><code>#0f172a</code></td>
                  <td>Cor dos pontos e marcadores do código (ex: <code>4f46e5</code>).</td>
                </tr>
                <tr>
                  <td><code>light</code> / <code>bg</code></td>
                  <td>Hexadecimal</td>
                  <td><code>#ffffff</code></td>
                  <td>Cor do plano de fundo. Adicione <code>00</code> no final para transparência em SVG.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SEÇÃO 4: ENCURTADORES DE URL VIA TERMINAL -->
        <section id="sec-shorteners" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">4</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Encurtadores de URL via Terminal (100% Testados)</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Comandos cURL diretos para encurtar links sem necessidade de chaves de API pagas.</p>
            </div>
          </div>

          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Endpoints cURL Prontos para Execução:</span>
              <button class="btn-copy-code" data-target="code-shorteners-curl">Copiar Comandos</button>
            </div>
            <pre><code id="code-shorteners-curl"># 1. TinyURL (Mais estável e popular)
curl -s "https://tinyurl.com/api-create.php?url=https://github.com/pycriador/olivelas-qrcode"

# 2. is.gd (Retorna apenas o link encurtado)
curl -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode"

# 3. v.gd (Com prévia de segurança)
curl -s "https://v.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode"

# 4. da.gd (Super rápido e minimalista)
curl -s "https://da.gd/s?url=https://github.com/pycriador/olivelas-qrcode"

# 5. Ulvis.net (Alta disponibilidade)
curl -s "https://ulvis.net/api.php?url=https://github.com/pycriador/olivelas-qrcode"

# 6. Clck.ru (Yandex ecosystem)
curl -s "https://clck.ru/--?url=https://github.com/pycriador/olivelas-qrcode"

# 7. Spoo.me (Suporte a estatísticas JSON)
curl -s -X POST -d "url=https://github.com/pycriador/olivelas-qrcode" -H "Accept: application/json" https://spoo.me</code></pre>
          </div>
        </section>

      </main>
    </div>
  `,n.querySelector(`#btn-docs-back`)?.addEventListener(`click`,t=>{t.preventDefault(),e()}),n.querySelector(`#btn-copy-docs-url`)?.addEventListener(`click`,async()=>{try{let e=`${window.location.origin}${window.location.pathname}#/docs`;await navigator.clipboard.writeText(e),t(`URL própria da Documentação copiada! Pronto para compartilhar.`)}catch{t(`Não foi possível copiar o link`)}}),n.querySelectorAll(`.btn-copy-code`).forEach(e=>{e.addEventListener(`click`,async()=>{let r=e.getAttribute(`data-target`),i=n.querySelector(`#${r}`);i&&(await navigator.clipboard.writeText(i.textContent||``),e.textContent=`Copiado!`,t(`Código copiado para a área de transferência!`),setTimeout(()=>{e.textContent=`Copiar`},2e3))})}),n}new class{state={contentType:`url`,data:`https://github.com/pycriador/olivelas-qrcode`,rawUrl:`https://github.com/pycriador/olivelas-qrcode`,dotsType:`rounded`,dotsColor:`#4f46e5`,dotsGradientEnabled:!0,dotsGradientType:`linear`,dotsGradientRotation:45,dotsColor2:`#7c3aed`,cornersSquareType:`extra-rounded`,cornersSquareColor:`#4338ca`,cornersDotType:`dot`,cornersDotColor:`#4338ca`,cornersSync:!0,bgColor:`#ffffff`,bgTransparent:!1,logoType:`none`,selectedWikipediaLogoId:null,customLogoDataUrl:null,customLogoFileName:null,logoSize:.35,logoMargin:6,frameStyle:`none`,frameText:`ESCANEIE-ME`,frameBgColor:`#4f46e5`,frameTextColor:`#ffffff`,exportSize:1024,errorCorrectionLevel:`Q`,margin:10,activePresetId:`midnight-indigo`,isSidebarCollapsed:!1,activeView:`app`};qrEngine=new p;updateTimer=null;appRoot;constructor(){let e=document.getElementById(`app`);if(!e)throw Error(`Elemento #app não encontrado no DOM`);this.appRoot=e,this.initTheme(),this.initRouter()}initTheme(){let e=localStorage.getItem(`olivelas_theme`)||(window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`);document.documentElement.setAttribute(`data-theme`,e)}toggleTheme=()=>{let e=document.documentElement.getAttribute(`data-theme`)===`dark`?`light`:`dark`;document.documentElement.setAttribute(`data-theme`,e),localStorage.setItem(`olivelas_theme`,e)};initRouter(){this.handleRoute(),window.addEventListener(`hashchange`,()=>this.handleRoute()),window.addEventListener(`popstate`,()=>this.handleRoute())}handleRoute(){let[e,t]=(window.location.hash||`#/`).split(`?`),n=e.replace(/^#\/?/,``).toLowerCase().startsWith(`docs`)?`docs`:`app`;this.state.activeView=n;let r=t||window.location.search.replace(/^\?/,``);if(r){let e=new URLSearchParams(r),t=e.get(`data`)||e.get(`url`),n=e.get(`preset`),i=e.get(`dots`);if(t&&t!==this.state.data&&(this.state.data=t,this.state.rawUrl=t),n){let e=l.find(e=>e.id===n);e&&Object.assign(this.state,{activePresetId:e.id,dotsType:e.dotsType,cornersSquareType:e.cornersSquareType,cornersDotType:e.cornersDotType,bgColor:e.bgColor,bgTransparent:!1,dotsColor:e.dotsColor,dotsColor2:e.dotsGradient?.color2||`#7c3aed`,dotsGradientEnabled:!!e.dotsGradient,dotsGradientRotation:e.dotsGradient?.rotation||45,cornersSquareColor:e.cornersColor,cornersDotColor:e.cornersColor,cornersSync:!0,logoType:e.presetLogo?`wikipedia`:this.state.logoType,selectedWikipediaLogoId:e.presetLogo||null})}i&&(this.state.dotsType=i)}document.title=n===`docs`?`Documentação cURL & Python API - Olivelas QR Code Studio`:`Olivelas QR Code Studio - Criador Profissional de QR Code`,this.render(),n===`app`&&setTimeout(()=>this.initQRCanvas(),0)}switchView=e=>{let t=e===`docs`?`#/docs`:`#/`;window.location.hash===t?this.handleRoute():window.location.hash=t,window.scrollTo({top:0,behavior:`smooth`})};updateState=e=>{Object.assign(this.state,e),this.scheduleQRUpdate(),this.updatePreviewVisuals()};scheduleQRUpdate(){clearTimeout(this.updateTimer),this.updateTimer=setTimeout(()=>{this.qrEngine.update(this.state),this.saveHistory()},120)}updatePreviewVisuals(){let e=document.getElementById(`preview-frame-wrap`),t=document.getElementById(`preview-badge-top`),n=document.getElementById(`preview-text-bottom`),r=document.getElementById(`preview-data-url-label`),i=document.getElementById(`badge-contrast-check`);if(r&&(r.textContent=this.state.data.length>32?this.state.data.substring(0,30)+`...`:this.state.data),e&&t&&n&&(t.classList.add(`hidden`),n.classList.add(`hidden`),e.style.background=`#ffffff`,e.style.border=`none`,this.state.frameStyle===`bottom`?(n.classList.remove(`hidden`),n.textContent=this.state.frameText||`ESCANEIE-ME`,n.style.color=this.state.frameTextColor,e.style.background=this.state.frameBgColor):this.state.frameStyle===`top`?(t.classList.remove(`hidden`),t.textContent=this.state.frameText||`SCAN HERE`,t.style.background=this.state.frameBgColor,t.style.color=this.state.frameTextColor):this.state.frameStyle===`card`&&(n.classList.remove(`hidden`),n.textContent=this.state.frameText||`APONTE A CÂMERA`,n.style.color=this.state.dotsColor,e.style.border=`3px solid ${this.state.dotsColor}`)),i){let e=this.isTooLight(this.state.dotsColor);this.state.bgColor.toLowerCase()===`#ffffff`&&e?(i.textContent=`⚠️ Contraste Baixo`,i.className=`contrast-badge warn`):(i.textContent=`✓ Legibilidade Ótima`,i.className=`contrast-badge ok`)}}isTooLight(e){if(!e||e.length<6)return!1;let t=e.replace(`#`,``),n=parseInt(t.substring(0,2),16),r=parseInt(t.substring(2,4),16),i=parseInt(t.substring(4,6),16);return(.299*n+.587*r+.114*i)/255>.85}toggleCollapseSidebar=()=>{this.state.isSidebarCollapsed=!this.state.isSidebarCollapsed,document.querySelector(`.app-grid`)?.classList.toggle(`preview-collapsed`,this.state.isSidebarCollapsed),document.querySelector(`.preview-column`)?.classList.toggle(`collapsed`,this.state.isSidebarCollapsed);let e=document.getElementById(`btn-expand-dock`),t=document.querySelector(`.preview-sticky-card`);e?.classList.toggle(`hidden`,!this.state.isSidebarCollapsed),t?.classList.toggle(`hidden`,this.state.isSidebarCollapsed);let n=document.getElementById(`btn-toggle-preview-nav`);if(n){n.title=this.state.isSidebarCollapsed?`Fixar e exibir o painel do QR Code`:`Ocultar o painel do QR Code`;let e=n.querySelector(`span`);e&&(e.textContent=this.state.isSidebarCollapsed?`Mostrar QR Code`:`Ocultar QR Code`);let t=n.querySelector(`svg`);t&&(t.innerHTML=this.state.isSidebarCollapsed?`<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`:`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`)}this.showToast(this.state.isSidebarCollapsed?`Painel de QR Code ocultado`:`Painel de QR Code fixado na lateral`)};showToast=e=>{let t=document.getElementById(`toast-msg`);t||(t=document.createElement(`div`),t.id=`toast-msg`,t.className=`toast-msg`,document.body.appendChild(t)),t.textContent=e,t.classList.add(`show`),clearTimeout(t._timer),t._timer=setTimeout(()=>{t?.classList.remove(`show`)},2800)};saveHistory(){try{let e={data:this.state.data,type:this.state.contentType,date:new Date().toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})},t=JSON.parse(localStorage.getItem(`olivelas_qr_history`)||`[]`);t=[e,...t.filter(t=>t.data!==e.data)].slice(0,5),localStorage.setItem(`olivelas_qr_history`,JSON.stringify(t))}catch{}}render(){this.appRoot.innerHTML=``;let e=m(this.state,this.toggleTheme,this.switchView,this.toggleCollapseSidebar);this.appRoot.appendChild(e);let t=document.createElement(`main`);if(t.className=`main-container`,this.state.activeView===`docs`){let e=M(()=>this.switchView(`app`),this.showToast);t.appendChild(e)}else{let e=document.createElement(`div`);e.className=`app-grid ${this.state.isSidebarCollapsed?`preview-collapsed`:``}`;let n=document.createElement(`section`);n.className=`controls-column`,n.appendChild(E(this.state,this.updateState,this.showToast)),n.appendChild(A(this.state,this.updateState,this.showToast));let r=j(this.state,this.qrEngine,this.toggleCollapseSidebar,this.showToast);e.appendChild(n),e.appendChild(r),t.appendChild(e)}this.appRoot.appendChild(t);let n=document.createElement(`footer`);n.className=`app-footer`,n.innerHTML=`
      <div class="footer-links">
        <a href="https://github.com/pycriador/olivelas-qrcode" target="_blank" rel="noopener noreferrer">GitHub do Projeto</a>
        <a href="#" id="footer-btn-docs">Documentação cURL & Python</a>
        <a href="https://pages.github.com/" target="_blank" rel="noopener noreferrer">GitHub Pages</a>
      </div>
      <p>Olivelas QR Code Studio &bull; 100% Client-side em TypeScript &bull; Sem limites de uso.</p>
    `,n.querySelector(`#footer-btn-docs`)?.addEventListener(`click`,e=>{e.preventDefault(),this.switchView(`docs`)}),this.appRoot.appendChild(n),this.state.activeView===`app`&&setTimeout(()=>this.initQRCanvas(),0)}initQRCanvas(){let e=document.getElementById(`qr-canvas-holder`);e&&(this.qrEngine.init(e,this.state),this.updatePreviewVisuals())}};