import { bedroomLabels, safePath } from "./domain";
import { site } from "../site";
import type { Property } from "../properties";
import type { BuyerProfile } from "./simulator";
import { parseMoney } from "./simulator";

export type PropertyContact = Pick<Property,"slug"|"code"|"name"|"price"|"bedrooms_min"|"bedrooms_max"|"property_type"> & {id?:string};
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function propertyContact(property:Property):PropertyContact {
  return {id:property.id,slug:property.slug,code:property.code,name:property.name,price:property.price,
    bedrooms_min:property.bedrooms_min,bedrooms_max:property.bedrooms_max,property_type:property.property_type};
}
export function propertyMessage(property:PropertyContact, origin?:string) {
  const lines=[`Olá Rosa! Vi o ${property.name} no site Meu Apê com Rosa.`,"",`Código: ${property.code}`];
  if(property.price!==null)lines.push(`Preço anunciado: a partir de ${money(property.price)}`);
  if(property.property_type==="studio")lines.push("Tipologia: Studio");
  else if(property.bedrooms_min!==null)lines.push(`Tipologia: ${property.bedrooms_min}${property.bedrooms_max!==null && property.bedrooms_max!==property.bedrooms_min?` a ${property.bedrooms_max}`:""} dormitório(s)`);
  lines.push(`Imóvel: ${site.url}/imoveis/${property.slug}`);
  if(origin && safePath(origin)!==`/imoveis/${property.slug}`)lines.push(`Página de origem: ${site.url}${safePath(origin)}`);
  lines.push("","Gostaria de saber mais informações e condições.");return lines.join("\n");
}
export function simulatorMessage(profile:BuyerProfile, property?:PropertyContact, origin?:string) {
  const lines=["Olá Rosa! Fiz meu perfil pelo site Meu Apê com Rosa.","",`Nome: ${profile.name.trim()}`];
  const income=parseMoney(profile.income),fgts=parseMoney(profile.fgts_amount),entry=parseMoney(profile.down_payment);
  if(income!==undefined)lines.push(`Renda familiar aproximada: ${money(income)}`);
  if(profile.has_fgts!==undefined)lines.push(`FGTS: ${profile.has_fgts?"Sim":"Não"}`);
  if(profile.has_fgts && fgts!==undefined)lines.push(`FGTS aproximado: ${money(fgts)}`);
  if(entry!==undefined)lines.push(`Entrada disponível: ${money(entry)}`);
  if(profile.purchase_mode)lines.push(`Compra: ${profile.purchase_mode==="joint"?"composição de renda":"sozinho"}`);
  if(profile.bedrooms)lines.push(`Procuro: ${bedroomLabels[profile.bedrooms]}`);
  if(profile.region)lines.push(`Região: ${profile.region}`);
  if(property)lines.push("",`Imóvel de interesse: ${property.name}`,`Código: ${property.code}`,`${site.url}/imoveis/${property.slug}`);
  if(origin)lines.push(`Página de origem: ${site.url}${safePath(origin)}`);
  lines.push("","Gostaria de receber opções que possam fazer sentido para o meu perfil.");return lines.join("\n");
}
