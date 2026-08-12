import { AdminSubmitButtons } from "@/components/admin-submit-buttons";
import { AdminMediaUploadFields } from "@/components/admin-media-upload-fields";
import { preferredDevelopers } from "@/lib/developers";

type PropertyFormValues = Record<string, string | number | boolean | null | undefined>;

const sections = [
  ["dados-principais", "Dados principais"],
  ["localizacao", "Localização"],
  ["tipologias", "Tipologias"],
  ["valores", "Valores"],
  ["fotos", "Fotos"],
  ["plantas", "Plantas"],
  ["diferenciais", "Diferenciais"],
  ["categorias", "Categorias"],
  ["seo", "SEO"],
  ["publicacao", "Publicação"],
] as const;

const phases = ["Lançamento", "Em construção", "Pronto"];
const statuses = [
  ["draft", "Rascunho"],
  ["available", "Disponível"],
  ["reserved", "Reservado"],
  ["sold", "Vendido"],
  ["inactive", "Inativo"],
] as const;

export function AdminPropertyForm({
  action,
  values = {},
  existingMedia = { photos: [], floorplans: [] },
  mode,
}: {
  action: (formData: FormData) => Promise<void>;
  values?: PropertyFormValues;
  existingMedia?: { photos: string[]; floorplans: string[] };
  mode: "create" | "edit";
}) {
  const value = (name: string) => {
    const current = values[name];
    return current === null || current === undefined ? "" : String(current);
  };
  const checked = (name: string, fallback = false) => {
    const current = values[name];
    return current === null || current === undefined ? fallback : Boolean(current);
  };

  return <>
    <nav className="mt-7 flex gap-2 overflow-x-auto pb-2" aria-label="Seções do cadastro">
      {sections.map(([id, label], index) => (
        <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-petroleo/15 bg-white px-4 py-2 text-xs font-bold text-petroleo transition hover:border-rose hover:text-rose">
          {index + 1}. {label}
        </a>
      ))}
    </nav>

    <form action={action} className="mt-4 grid gap-6">
      {values.id ? <input type="hidden" name="property_id" value={value("id")} /> : null}

      <section id="dados-principais" className="card scroll-mt-6 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2"><p className="eyebrow">Etapa 1</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Dados principais</h2></div>
        <label className="label">Nome do empreendimento<input className="field" name="name" defaultValue={value("name")} required /></label>
        <label className="label">Nome completo<input className="field" name="full_name" defaultValue={value("full_name")} /></label>
        <label className="label">Slug da página<input className="field" name="slug" defaultValue={value("slug")} placeholder="Gerado automaticamente quando vazio" /></label>
        <label className="label">Tipo<select className="field" name="property_type" defaultValue={value("property_type") || "apartment"}><option value="apartment">Apartamento</option><option value="studio">Studio</option><option value="house">Casa</option><option value="commercial">Comercial</option></select></label>
        <label className="label">Fase<select className="field" name="phase" defaultValue={value("phase")}><option value="">Não informado</option>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
        <label className="label">Finalidade<select className="field" name="purpose" defaultValue={value("purpose") || "sale"}><option value="sale">Venda</option><option value="rent">Locação</option></select></label>
        <label className="label">Construtora<input className="field" name="builder" list="preferred-developers" defaultValue={value("builder")} placeholder="Selecione ou digite a construtora" /></label>
        <label className="label">Incorporadora<input className="field" name="developer" list="preferred-developers" defaultValue={value("developer")} placeholder="Selecione ou digite a incorporadora" /></label>
        <datalist id="preferred-developers">{preferredDevelopers.map((developer) => <option key={developer} value={developer} />)}</datalist>
        <p className="sm:col-span-2 text-xs leading-5 text-grafite/60">Sugestões priorizadas: {preferredDevelopers.join(", ")}.</p>
        <label className="label sm:col-span-2">Descrição curta<textarea className="field min-h-24" name="short_description" defaultValue={value("short_description")} /></label>
        <label className="label sm:col-span-2">Descrição completa<textarea className="field min-h-40" name="description" defaultValue={value("description")} /></label>
        <label className="label sm:col-span-2">URL da fonte<input className="field" name="source_url" type="url" defaultValue={value("source_url")} placeholder="https://www.orulo.com.br/buildings/..." /></label>
      </section>

      <section id="localizacao" className="card scroll-mt-6 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2"><p className="eyebrow">Etapa 2</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Localização</h2></div>
        <label className="label sm:col-span-2">Endereço<input className="field" name="address" defaultValue={value("address")} /></label>
        <label className="label">Número<input className="field" name="number" defaultValue={value("number")} /></label>
        <label className="label">Bairro<input className="field" name="neighborhood" defaultValue={value("neighborhood")} /></label>
        <label className="label">Cidade<input className="field" name="city" defaultValue={value("city") || "São Paulo"} /></label>
        <label className="label">Estado<input className="field" name="state" maxLength={2} defaultValue={value("state") || "SP"} /></label>
        <label className="label">CEP<input className="field" name="zipcode" defaultValue={value("zipcode")} /></label>
        <label className="label">Latitude<input className="field" name="latitude" type="number" step="any" defaultValue={value("latitude")} /></label>
        <label className="label">Longitude<input className="field" name="longitude" type="number" step="any" defaultValue={value("longitude")} /></label>
      </section>

      <section id="tipologias" className="card scroll-mt-6 grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
        <div className="sm:col-span-2 lg:col-span-4"><p className="eyebrow">Etapa 3</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Tipologias</h2></div>
        {[ ["area_min", "Área mínima", "0.01"], ["area_max", "Área máxima", "0.01"], ["bedrooms_min", "Quartos mín.", "1"], ["bedrooms_max", "Quartos máx.", "1"], ["suites_min", "Suítes mín.", "1"], ["suites_max", "Suítes máx.", "1"], ["bathrooms_min", "Banheiros mín.", "1"], ["bathrooms_max", "Banheiros máx.", "1"], ["parking_min", "Vagas mín.", "1"], ["parking_max", "Vagas máx.", "1"] ].map(([name, label, step]) => <label key={name} className="label">{label}<input className="field" name={name} type="number" min="0" step={step} defaultValue={value(name)} /></label>)}
      </section>

      <section id="valores" className="card scroll-mt-6 grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3 sm:p-8">
        <div className="sm:col-span-2 lg:col-span-3"><p className="eyebrow">Etapa 4</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Valores</h2></div>
        <label className="label">Valor numérico<input className="field" name="price" type="number" min="0" step="0.01" defaultValue={value("price")} /></label>
        <label className="label">Valor promocional<input className="field" name="promotional_price" type="number" min="0" step="0.01" defaultValue={value("promotional_price")} /></label>
        <label className="label">Texto do valor<input className="field" name="price_label" defaultValue={value("price_label")} placeholder="Ex.: A partir de R$ 320.000" /></label>
        <label className="label">Condomínio<input className="field" name="condominium" type="number" min="0" step="0.01" defaultValue={value("condominium")} /></label>
        <label className="label">IPTU<input className="field" name="iptu" type="number" min="0" step="0.01" defaultValue={value("iptu")} /></label>
      </section>

      <AdminMediaUploadFields propertyId={value("id") || undefined} existingPhotos={existingMedia.photos} existingFloorplans={existingMedia.floorplans} />

      <section id="diferenciais" className="card scroll-mt-6 grid gap-5 p-6 sm:p-8">
        <div><p className="eyebrow">Etapa 7</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Diferenciais</h2></div>
        <label className="label">Um diferencial por linha<textarea className="field min-h-32" name="features" defaultValue={value("features")} placeholder={'Piscina\nAcademia\nPróximo ao metrô'} /></label>
      </section>

      <section id="categorias" className="card scroll-mt-6 p-6 sm:p-8">
        <p className="eyebrow">Etapa 8</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Categorias</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {[ ["is_mcmv", "Minha Casa Minha Vida"], ["is_r2v", "R2V"], ["is_his2", "HIS 2"], ["is_hmp", "HMP"], ["is_nr", "NR"], ["fgts_possible", "Aceita FGTS"] ].map(([name, label]) => <label key={name} className="flex items-center gap-2 rounded-2xl border border-petroleo/10 bg-white px-4 py-3 text-sm font-bold text-petroleo"><input type="checkbox" name={name} defaultChecked={checked(name)} className="size-4 accent-petroleo" /> {label}</label>)}
        </div>
      </section>

      <section id="seo" className="card scroll-mt-6 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2"><p className="eyebrow">Etapa 9</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">SEO</h2></div>
        <label className="label">Título para buscadores<input className="field" name="meta_title" defaultValue={value("meta_title")} /></label>
        <label className="label">Palavras-chave<input className="field" name="keywords" defaultValue={value("keywords")} placeholder="apartamento, zona sul, mcmv" /></label>
        <label className="label sm:col-span-2">Descrição para buscadores<textarea className="field min-h-24" name="meta_description" defaultValue={value("meta_description")} /></label>
      </section>

      <section id="publicacao" className="card scroll-mt-6 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2"><p className="eyebrow">Etapa 10</p><h2 className="mt-1 text-2xl font-extrabold text-petroleo">Publicação</h2></div>
        {mode === "edit" ? <label className="label">Status<select className="field" name="status" defaultValue={value("status") || "draft"}>{statuses.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label> : null}
        <label className="flex items-center gap-2 rounded-2xl border border-petroleo/10 bg-creme/60 px-4 py-3 text-sm font-bold text-petroleo"><input type="checkbox" name="featured" defaultChecked={checked("featured")} className="size-4 accent-petroleo" /> Destacar no site</label>
        <label className="flex items-center gap-2 rounded-2xl border border-petroleo/10 bg-creme/60 px-4 py-3 text-sm font-bold text-petroleo"><input type="checkbox" name="indexable" defaultChecked={checked("indexable", true)} className="size-4 accent-petroleo" /> Permitir indexação</label>
        <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
          <AdminSubmitButtons mode={mode} />
        </div>
      </section>
    </form>
  </>;
}
