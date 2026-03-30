"use client";
import { useState, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import {
  Database,
  Trash2,
  Layers,
  Copy,
  Check,
  X,
  Loader2,
  Navigation,
  Play,
} from "lucide-react";
import { extrairTorresDoHex } from "../../lib/lbsParser";

interface Torre {
  cellId: number;
  lac: number;
  mcc: number;
  mnc: number;
  signal: number;
  origemIdx: number;
  dadoBruto: string;
  lat?: number;
  lng?: number;
  loading?: boolean;
}

const containerStyle = { width: "100%", height: "450px", borderRadius: "12px" };

export default function LbsParser() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Torre[]>([]);
  const [selectedRaw, setSelectedRaw] = useState<{
    idx: number;
    hex: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isResolvingAll, setIsResolvingAll] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const trajetoria = useMemo(() => {
    return results
      .filter((t) => t.lat && t.lng)
      .map((t) => ({ lat: t.lat!, lng: t.lng! }));
  }, [results]);

  const center = useMemo(() => {
    if (trajetoria.length > 0) return trajetoria[trajetoria.length - 1];
    return { lat: -15.7942, lng: -47.8822 };
  }, [trajetoria]);

  const resolverNoGoogle = async (index: number) => {
    if (results[index].lat) return;

    setResults((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], loading: true };
      return copy;
    });

    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results[index]),
      });
      const data = await res.json();

      setResults((prev) => {
        const copy = [...prev];
        if (data.location) {
          copy[index] = {
            ...copy[index],
            lat: data.location.lat,
            lng: data.location.lng,
            loading: false,
          };
        } else {
          copy[index] = { ...copy[index], loading: false };
        }
        return copy;
      });
    } catch {
      console.error("Erro ao geo-localizar index:", index);
      setResults((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], loading: false };
        return copy;
      });
    }
  };

  const resolverTudo = async () => {
    setIsResolvingAll(true);
    for (let i = 0; i < results.length; i++) {
      if (!results[i].lat) {
        await resolverNoGoogle(i);
      }
    }
    setIsResolvingAll(false);
  };

  const processarLBS = () => {
    try {
      const todasAsTorres = extrairTorresDoHex(input); // Chama a função da Lib
      setResults(todasAsTorres);
      setSelectedRaw(null);
    } catch {
      alert("Erro ao processar Hexadecimal.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Painel de Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Database size={24} />
              <h1 className="text-xl font-bold text-gray-800">
                Analista de LBS Pro
              </h1>
            </div>
          </div>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows={5}
            placeholder="Insira os Hexas separados por ;"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={processarLBS}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"
            >
              <Layers size={18} /> Processar Antenas
            </button>
            {results.length > 0 && (
              <button
                onClick={resolverTudo}
                disabled={isResolvingAll}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isResolvingAll ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Play size={18} />
                )}
                Resolver Tudo
              </button>
            )}
            <button
              onClick={() => {
                setInput("");
                setResults([]);
              }}
              className="text-gray-400 hover:text-red-600 px-4 py-2 flex items-center gap-1 text-sm"
            >
              <Trash2 size={16} /> Limpar
            </button>
          </div>
        </div>

        {/* Grid de Resultados */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Ref
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Cell ID
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    LAC
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    MCC
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    MNC
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Sinal
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Latitude
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                    Longitude
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((t, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4">
                      <button
                        onClick={() =>
                          setSelectedRaw({ idx: i, hex: t.dadoBruto })
                        }
                        className={`px-2 py-1 rounded text-xs font-mono font-bold ${selectedRaw?.idx === i ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}
                      >
                        #{t.origemIdx}
                      </button>
                    </td>
                    <td className="p-4 font-mono text-sm">{t.cellId}</td>
                    <td className="p-4 font-mono text-sm">{t.lac}</td>
                    <td className="p-4 text-sm text-gray-500">{t.mcc}</td>
                    <td className="p-4 text-sm text-gray-500">{t.mnc}</td>
                    <td className="p-4 text-center text-xs font-bold text-green-600">
                      {t.signal}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {t.lat?.toFixed(6) || "-"}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {t.lng?.toFixed(6) || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => resolverNoGoogle(i)}
                        disabled={t.loading || !!t.lat}
                        className={`text-xs p-2 rounded flex items-center gap-1 mx-auto ${t.lat ? "text-green-600 bg-green-50" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                      >
                        {t.loading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : t.lat ? (
                          <Check size={14} />
                        ) : (
                          "Resolver"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mapa e Trajetória */}
        {results.some((t) => t.lat) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
              <Navigation size={20} className="text-blue-600" />
              Trajetória Georeferenciada
            </div>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
              >
                <Polyline
                  path={trajetoria}
                  options={{
                    strokeColor: "#2563eb",
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    icons: [
                      {
                        icon: {
                          path: "M 0,-1 0,1",
                          strokeOpacity: 1,
                          scale: 3,
                        },
                        offset: "0",
                        repeat: "20px",
                      },
                    ],
                  }}
                />
                {results.map(
                  (t, i) =>
                    t.lat &&
                    t.lng && (
                      <Marker
                        key={i}
                        position={{ lat: t.lat!, lng: t.lng! }}
                        label={{
                          text: t.origemIdx.toString(),
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        title={`Antena #${t.origemIdx}\nCellID: ${t.cellId}`}
                      />
                    ),
                )}
              </GoogleMap>
            ) : (
              <div className="h-[400px] bg-gray-100 flex items-center justify-center rounded-xl">
                Carregando recursos do mapa...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pop-over Dado Bruto */}
      {selectedRaw && (
        <div className="fixed bottom-8 right-8 w-80 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 animate-in fade-in slide-in-from-right-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase">
              Hexadecimal Bruto
            </span>
            <button
              onClick={() => setSelectedRaw(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
          <div className="bg-gray-50 p-2 rounded text-[10px] font-mono break-all text-gray-600 mb-3 max-h-24 overflow-auto border">
            {selectedRaw.hex}
          </div>
          <button
            onClick={() => copyToClipboard(selectedRaw.hex)}
            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${copied ? "bg-green-100 text-green-700" : "bg-gray-900 text-white hover:bg-black"}`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar Hex"}
          </button>
        </div>
      )}
    </main>
  );
}
