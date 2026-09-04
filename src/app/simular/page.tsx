import { PublicShell } from "@/components/public-shell";
import { BuyerProfileSimulator } from "@/components/buyer-profile-simulator";
import { getPublicProperties } from "@/lib/property-catalog";
import { propertyContact } from "@/lib/leads/whatsapp";
import { pageMetadata } from "@/lib/seo";

export const metadata=pageMetadata({title:"Descubra o que você pode comprar",description:"Organize seu perfil de compra e receba orientação da Rosa.",path:"/simular",index:false});
export default async function SimulatorPage({searchParams}:{searchParams:Promise<{imovel?:string}>}) {
  const params=await searchParams;const properties=await getPublicProperties();
  const property=properties.find(item=>item.slug===params.imovel);
  const regions=[...new Set(properties.map(item=>item.neighborhood).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  return <PublicShell><section className="section"><div className="container-site"><h1 className="sr-only">Descubra o que você pode comprar</h1><BuyerProfileSimulator regions={regions} property={property?propertyContact(property):undefined} origin={property?`/imoveis/${property.slug}`:undefined}/></div></section></PublicShell>;
}
