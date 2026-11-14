/* Return meaningful SEO metadata to crawlers without requiring JavaScript rendering. */
const SITE = 'https://globalnews-a0q.pages.dev';
const routes = {
  '/': ['Top Stories — GlobalNews','Source-attributed international and regional news.'],
  '/world': ['World News — GlobalNews','World news and international headlines from original publishers.'],
  '/local': ['Regional News — GlobalNews','Regional headlines from attributed news sources.'],
  '/business': ['Business News — GlobalNews','Business and global economy news from original publishers.'],
  '/technology': ['Technology News — GlobalNews','Technology and innovation reporting from original publishers.'],
  '/sports': ['Sports News — GlobalNews','International sports headlines and results from credited publishers.'],
  '/science': ['Science News — GlobalNews','Research and science reporting from original publishers.'],
  '/videos': ['News Videos — GlobalNews','Video reporting from official broadcaster channels.'],
  '/about': ['About GlobalNews','Discover how GlobalNews collects and attributes world news.'],
  '/standards': ['Editorial Standards — GlobalNews','GlobalNews editorial, accuracy and attribution standards.'],
  '/sources': ['News Sources — GlobalNews','Our news sources and links to original reporting.'],
  '/privacy': ['Privacy — GlobalNews','Reader privacy and browsing preferences on GlobalNews.']
};
export async function onRequest({request,next}){
  const response=await next();
  if(!/^text\/html\b/i.test(response.headers.get('content-type')||''))return response;
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  const page=routes[path];
  const noindex=!page;
  const title=page?.[0]||'GlobalNews';
  const description=page?.[1]||'News discovery service';
  const canonical=SITE+(page ? (path==='/'?'/':path) : '/');
  const transformed=new HTMLRewriter()
    .on('title',{element(e){e.setInnerContent(title)}})
    .on('meta[name="description"]',{element(e){e.setAttribute('content',description)}})
    .on('meta[name="robots"]',{element(e){e.setAttribute('content',noindex?'noindex,follow':'index,follow')}})
    .on('link[rel="canonical"]',{element(e){e.setAttribute('href',canonical)}})
    .on('meta[property="og:title"]',{element(e){e.setAttribute('content',title)}})
    .on('meta[property="og:url"]',{element(e){e.setAttribute('content',canonical)}})
    .transform(response);
  const headers=new Headers(transformed.headers);
  headers.set('X-Robots-Tag',noindex?'noindex, follow':'index, follow');
  return new Response(transformed.body,{status:transformed.status,statusText:transformed.statusText,headers});
}
