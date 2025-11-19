// Workaround for Next.js 15 App Router build issue
// This prevents Next.js from trying to generate a default _error page
// that imports Html from next/document

function Error() {
  return null;
}

Error.getInitialProps = () => ({});

export default Error;

