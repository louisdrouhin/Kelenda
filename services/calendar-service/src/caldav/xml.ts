// Génère des réponses WebDAV/CalDAV "multistatus" (RFC 4918 §13, RFC 4791) à la
// main plutôt que via un builder XML générique — le format est rigide
// (toujours les mêmes espaces de noms DAV:/urn:ietf:params:xml:ns:caldav) et
// les clients réels (Apple Calendar, iOS) sont connus pour être stricts sur
// la structure exacte.

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildMultistatus(responses: string[]): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
${responses.join('\n')}
</D:multistatus>`;
}

export function buildResponse(href: string, propertiesXml: string, status = 'HTTP/1.1 200 OK'): string {
  return `  <D:response>
    <D:href>${xmlEscape(href)}</D:href>
    <D:propstat>
      <D:prop>
${propertiesXml}
      </D:prop>
      <D:status>${status}</D:status>
    </D:propstat>
  </D:response>`;
}
