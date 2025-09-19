
export async function GET() {
  return new Response(JSON.stringify({
    providers: {
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials'
      }
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
