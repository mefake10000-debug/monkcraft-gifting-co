import {NextRequest, NextResponse} from 'next/server';
import {getContextualFacets} from '@/data/catalogue/query';
import {parseCatalogueQuery} from '@/data/catalogue/queryParams';
export async function GET(request: NextRequest) {
  const params: Record<string, string[]> = {};
  request.nextUrl.searchParams.forEach((value, key) => { (params[key] ??= []).push(value); });
  return NextResponse.json(getContextualFacets(parseCatalogueQuery(params)));
}
