import type {
  ApiResponse,
  EmergingTechPageResponse,
  EmergingTechItem,
  ListParams,
  SearchParams,
} from "@/types/emerging-tech";

const BASE = "/api/v1/emerging-tech";

function toQuery(params: object): string {
  const entries = Object.entries(params as Record<string, unknown>);
  const sp = new URLSearchParams();
  for (const [k, v] of entries) {
    if (v !== undefined && v !== null && v !== "") {
      sp.set(k, String(v));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

export async function fetchList(
  params: ListParams = {}
): Promise<EmergingTechPageResponse> {
  const res = await fetch(`${BASE}${toQuery(params)}`);
  if (!res.ok) throw new Error(`목록 조회 실패: ${res.status}`);
  const json: ApiResponse<EmergingTechPageResponse> = await res.json();
  return json.data;
}

export async function fetchDetail(id: string): Promise<EmergingTechItem> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Item not found");
    throw new Error(`상세 조회 실패: ${res.status}`);
  }
  const json: ApiResponse<EmergingTechItem> = await res.json();
  return json.data;
}

export async function fetchSearch(
  params: SearchParams
): Promise<EmergingTechPageResponse> {
  const res = await fetch(`${BASE}/search${toQuery(params)}`);
  if (!res.ok) throw new Error(`검색 실패: ${res.status}`);
  const json: ApiResponse<EmergingTechPageResponse> = await res.json();
  return json.data;
}
