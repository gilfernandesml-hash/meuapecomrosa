export const site = {
  name: "Meu Apê com Rosa",
  slogan: "Seu primeiro imóvel começa aqui.",
  professionalName: "Rosa Oliveira",
  creci: "CRECI 117.140-SP",
  whatsapp: "5511971841288",
  phoneDisplay: "(11) 97184-1288",
  email: "rosacorretora16@gmail.com",
  instagram: "rosa.oliveira777",
  location: "São Paulo - SP",
  serviceArea: "Zona Sul de São Paulo",
  serviceHours: "Segunda a domingo, em horário comercial",
  url: "https://meuapecomrosa.com.br",
} as const;

export function whatsappUrl(message = "Olá, Rosa! Visitei o site Meu Apê com Rosa e gostaria de entender minhas possibilidades para comprar um imóvel.") {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
