export type Property = {
  slug: string; code: string; name: string; neighborhood: string; city: string;
  phase: string; area: string; bedrooms: number; parking: number; price: number;
  priceLabel: string; mcmv: boolean; fgts: boolean; featured?: boolean;
  description: string; features: string[];
};

export const properties: Property[] = [
  {
    slug: "residencial-jardim-sul", code: "RMA-000001", name: "Residencial Jardim Sul",
    neighborhood: "Campo Limpo", city: "São Paulo", phase: "Lançamento", area: "37 a 42 m²",
    bedrooms: 2, parking: 0, price: 289000, priceLabel: "A partir de R$ 289 mil", mcmv: true, fgts: true, featured: true,
    description: "Apartamentos bem planejados para quem quer dar o primeiro passo rumo ao imóvel próprio, com mobilidade e serviços por perto.",
    features: ["Salão de festas", "Playground", "Bicicletário", "Espaço fitness", "Portaria"],
  },
  {
    slug: "parque-vila-andrade", code: "RMA-000002", name: "Parque Vila Andrade",
    neighborhood: "Vila Andrade", city: "São Paulo", phase: "Em construção", area: "39 a 46 m²",
    bedrooms: 2, parking: 1, price: 348000, priceLabel: "A partir de R$ 348 mil", mcmv: true, fgts: true, featured: true,
    description: "Condomínio com lazer essencial e plantas inteligentes na Zona Sul, pensado para diferentes momentos da família.",
    features: ["Piscina", "Churrasqueira", "Brinquedoteca", "Coworking", "Pet place"],
  },
  {
    slug: "estacao-santo-amaro", code: "RMA-000003", name: "Estação Santo Amaro",
    neighborhood: "Santo Amaro", city: "São Paulo", phase: "Pronto", area: "34 a 40 m²",
    bedrooms: 2, parking: 0, price: 399000, priceLabel: "A partir de R$ 399 mil", mcmv: false, fgts: true,
    description: "Uma oportunidade pronta para morar com acesso fácil ao transporte e à infraestrutura de Santo Amaro.",
    features: ["Lavanderia", "Academia", "Salão de festas", "Delivery room", "Segurança 24h"],
  },
];

export const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
