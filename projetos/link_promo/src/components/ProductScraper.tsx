import { useState } from "react";
import { Link2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { scrapeProduct, shortenUrl, applyTemplate } from "@/lib/api";
import { useTemplates, useCreateProduct, Template } from "@/hooks/useData";
import { ScrapedDataEditor } from "@/components/ScrapedDataEditor";

interface ScrapedData {
  productName: string;
  oldPrice: string;
  newPrice: string;
  installments: string;
  shortUrl: string;
}

export function ProductScraper() {
  const [url, setUrl] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);

  const { toast } = useToast();
  const { data: templates } = useTemplates();
  const createProduct = useCreateProduct();

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({ title: "URL obrigatória", description: "Cole a URL do produto.", variant: "destructive" });
      return;
    }
    if (!selectedTemplateId) {
      toast({ title: "Template obrigatório", description: "Selecione um template de mensagem.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setScrapedData(null);
    setGeneratedMessage(null);

    try {
      const data = await scrapeProduct(url);

      let shortUrl = url;
      try {
        shortUrl = await shortenUrl(url);
      } catch (e) {
        console.error("URL shortening failed, using original:", e);
      }

      setScrapedData({
        productName: data.productName || "",
        oldPrice: data.oldPrice || "",
        newPrice: data.newPrice || "",
        installments: data.installments || "",
        shortUrl,
      });
      setRawData(data);

      toast({ title: "Dados coletados!", description: "Revise os campos e clique em Gerar Mensagem." });
    } catch (error) {
      console.error("Scrape error:", error);
      toast({
        title: "Erro ao coletar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!scrapedData) return;

    const template = templates?.find((t: Template) => t.id === selectedTemplateId);
    if (!template) {
      toast({ title: "Template não encontrado", variant: "destructive" });
      return;
    }

    const message = applyTemplate(template.content, {
      productName: scrapedData.productName,
      oldPrice: scrapedData.oldPrice,
      newPrice: scrapedData.newPrice,
      installments: scrapedData.installments,
      link: scrapedData.shortUrl,
    });

    setGeneratedMessage(message);

    // Save to database
    try {
      await createProduct.mutateAsync({
        original_url: url,
        short_url: scrapedData.shortUrl,
        product_name: scrapedData.productName,
        old_price: scrapedData.oldPrice,
        new_price: scrapedData.newPrice,
        installments: scrapedData.installments,
        marketplace: rawData?.marketplace || null,
        template_id: selectedTemplateId,
        generated_message: message,
        raw_data: rawData,
      });
      toast({ title: "Salvo!", description: "Produto salvo no histórico." });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleCopy = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
    }
  };

  const isProductId = (input: string) => {
    const trimmed = input.trim();
    return !trimmed.startsWith("http") && /^[A-Za-z0-9\-]{4,20}$/.test(trimmed);
  };

  const detectMarketplace = (input: string) => {
    if (isProductId(input)) return "ML (ID)";
    if (input.includes("mercadolivre.com") || input.includes("mercadolibre.com")) return "ML";
    if (input.includes("shopee.com")) return "Shopee";
    return null;
  };

  const marketplace = detectMarketplace(url);

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="gradient-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Coletar Produto
        </h2>

        <div className="space-y-3">
          <div className="relative">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole a URL ou ID do produto (ex: TL765Q-X5MB)..."
              className="pr-16 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
            />
            {marketplace && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold px-2 py-1 rounded bg-primary/20 text-primary">
                {marketplace}
              </span>
            )}
          </div>

          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="h-12 bg-secondary/50 border-border">
              <SelectValue placeholder="Selecione um template de mensagem" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((template: Template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} {template.is_default && "⭐"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleScrape}
            disabled={isLoading || !url.trim()}
            className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base glow-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Coletando dados...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-5 w-5" />
                Coletar Dados
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editable scraped data + message generation */}
      {scrapedData && (
        <ScrapedDataEditor
          data={scrapedData}
          onChange={setScrapedData}
          message={generatedMessage}
          onGenerate={handleGenerate}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}
