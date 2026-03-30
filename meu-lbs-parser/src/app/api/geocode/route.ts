import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('Passanto pelo POST')
    const { cellId, lac, mcc, mnc } = await req.json();
    const apiKey = process.env.GOOGLE_GEOLOCATION_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
    }

    const url = new URL("https://www.googleapis.com/geolocation/v1/geolocate");
    url.searchParams.append("key", apiKey); // Isso garante que o ?key= fique perfeito

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cellTowers: [{
          cellId: cellId,
          locationAreaCode: lac,
          mobileCountryCode: mcc,
          mobileNetworkCode: mnc
        }]
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha na geolocalização" }, { status: 500 });
  }
}
