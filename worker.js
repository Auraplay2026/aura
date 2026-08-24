export default {
  async fetch(request) {
    const target = "https://aura-bluesignal5-dev.apps.rm2.thpm.p1.openshiftapps.com";
    const url = new URL(request.url);
    const destination = target + url.pathname + url.search;
    return Response.redirect(destination, 301);
  }
};
