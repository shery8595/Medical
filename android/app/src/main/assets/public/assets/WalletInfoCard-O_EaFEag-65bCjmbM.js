import{d5 as d,d2 as e,dn as r}from"./index-DBq6O0Jt.js";import{$ as p}from"./ModalHeader-BZvDE1Dr-vTOlsrcx.js";import{e as f}from"./ErrorMessage-D8VaAP5m-CgGF82Q3.js";import{r as x}from"./LabelXs-oqZNqbm_-CJzmOwk3.js";import{d as h}from"./Address-DX6EQMsj-CHfVE7bw.js";import{d as g}from"./shared-FM0rljBt-C9R6-BNl.js";import{C as j}from"./check-DdGkFao8.js";import{C as u}from"./copy-BiN8zf-0.js";let v=r(g)`
  && {
    padding: 0.75rem;
    height: 56px;
  }
`,y=r.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`,C=r.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`,z=r.div`
  font-size: 12px;
  line-height: 1rem;
  color: var(--privy-color-foreground-3);
`,b=r(x)`
  text-align: left;
  margin-bottom: 0.5rem;
`,w=r(f)`
  margin-top: 0.25rem;
`,E=r(p)`
  && {
    gap: 0.375rem;
    font-size: 14px;
  }
`;const P=({errMsg:t,balance:i,address:a,className:c,title:n,showCopyButton:m=!1})=>{let[o,l]=d.useState(!1);return d.useEffect((()=>{if(o){let s=setTimeout((()=>l(!1)),3e3);return()=>clearTimeout(s)}}),[o]),e.jsxs("div",{children:[n&&e.jsx(b,{children:n}),e.jsx(v,{className:c,$state:t?"error":void 0,children:e.jsxs(y,{children:[e.jsxs(C,{children:[e.jsx(h,{address:a,showCopyIcon:!1}),i!==void 0&&e.jsx(z,{children:i})]}),m&&e.jsx(E,{onClick:function(s){s.stopPropagation(),navigator.clipboard.writeText(a).then((()=>l(!0))).catch(console.error)},size:"sm",children:e.jsxs(e.Fragment,o?{children:["Copied",e.jsx(j,{size:14})]}:{children:["Copy",e.jsx(u,{size:14})]})})]})}),t&&e.jsx(w,{children:t})]})};export{P as j};
