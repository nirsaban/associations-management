/**
 * Emergency loop-breaker that runs as an inline <script> in <head> BEFORE
 * the React bundle hydrates. Because the HTML shell is served fresh on every
 * navigation, this script runs even when the user's cached JavaScript bundle
 * is the buggy old version — that's the whole point.
 *
 * Detection: if the SAME page is hit more than N times within T seconds
 * (tracked in sessionStorage), assume the React app is stuck redirecting
 * /login ↔ / and force-wipe everything: localStorage, cookies, service worker
 * registrations, cache storage. Then hard-reload with a marker so the new
 * (fixed) bundle gets a clean slate.
 *
 * NOTE: This is defensive — once every PWA has refreshed to the fixed
 * client code, the loop should never occur and this script is a no-op.
 */
const SCRIPT = `(function(){try{
var KEY='__loopBreak';
var raw=sessionStorage.getItem(KEY);
var now=Date.now();
var state=raw?JSON.parse(raw):{path:null,count:0,start:now};
var path=location.pathname;
if(state.path===path && now-state.start<10000){
  state.count++;
}else{
  state={path:path,count:1,start:now};
}
sessionStorage.setItem(KEY,JSON.stringify(state));

if(state.count>=4 && (path==='/login'||path==='/'||path==='')){
  sessionStorage.removeItem(KEY);
  // Stop the loop dead. Wipe everything the buggy client might rely on:
  try{localStorage.removeItem('auth-store');}catch(e){}
  try{
    var cs=document.cookie.split(';');
    for(var i=0;i<cs.length;i++){
      var c=cs[i].trim();
      var eq=c.indexOf('=');
      var name=eq>-1?c.substring(0,eq):c;
      document.cookie=name+'=; path=/; max-age=0; SameSite=Lax';
      document.cookie=name+'=; path=/; max-age=0; SameSite=Strict';
    }
  }catch(e){}
  // Unregister all service workers and drop all caches so the fixed
  // bundle is fetched on the next page load.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(function(rs){
      return Promise.all(rs.map(function(r){return r.unregister();}));
    }).catch(function(){});
  }
  if('caches' in window){
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){return caches.delete(k);}));
    }).catch(function(){});
  }
  // Use replace so the user can't navigate-back into the broken state.
  setTimeout(function(){location.replace('/login?healed=1');},200);
}

// SAFETY NET: if 8 seconds pass and the loader is still visible (React never
// hydrated successfully OR is stuck in a client-router loop that keeps the
// component mounted across mock-transitions), wipe everything and reload.
// Runs once per page load, no recursion possible because we use location.replace
// with a query marker.
if(!location.search.match(/[?&]healed=/)){
  setTimeout(function(){
    try{
      if(location.pathname!=='/login' && location.pathname!=='/')return;
      var stillLoading=document.querySelector('.animate-spin');
      var hasForm=document.querySelector('form,input[type="tel"]');
      if(!stillLoading || hasForm)return;
      try{localStorage.removeItem('auth-store');}catch(e){}
      try{
        var cs=document.cookie.split(';');
        for(var i=0;i<cs.length;i++){
          var c=cs[i].trim();
          var eq=c.indexOf('=');
          var nm=eq>-1?c.substring(0,eq):c;
          document.cookie=nm+'=; path=/; max-age=0; SameSite=Lax';
          document.cookie=nm+'=; path=/; max-age=0; SameSite=Strict';
        }
      }catch(e){}
      if('serviceWorker' in navigator){
        navigator.serviceWorker.getRegistrations().then(function(rs){
          return Promise.all(rs.map(function(r){return r.unregister();}));
        }).catch(function(){});
      }
      if('caches' in window){
        caches.keys().then(function(ks){
          return Promise.all(ks.map(function(k){return caches.delete(k);}));
        }).catch(function(){});
      }
      setTimeout(function(){location.replace('/login?healed=stuck');},250);
    }catch(e){}
  },8000);
}
}catch(e){}})();`;

export const loopBootstrapScript = SCRIPT;
