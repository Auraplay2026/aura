export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = "https://aura-bluesignal5-dev.apps.rm2.thpm.p1.openshiftapps.com" + url.pathname + url.search;
  return Response.redirect(target, 301);
}
