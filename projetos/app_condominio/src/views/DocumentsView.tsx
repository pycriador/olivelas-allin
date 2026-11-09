import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Search,
  Download,
  Eye,
  FolderSync,
  Upload,
  Sparkles,
  Inbox,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';
import { useUrlPagination } from '../hooks/useUrlPagination';
import { CondoDocument } from '../types';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    addDocument,
    activeCondominium,
    currentUser,
    activeRole,
    setIsAiSearchOpen,
    showToast,
  } = useApp();

  const [previewDoc, setPreviewDoc] = useState<CondoDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form states for new document upload
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CondoDocument['category']>('convention');
  const [newDescription, setNewDescription] = useState('');

  const isTrusteeOrAdmin = activeRole === 'trustee' || activeRole === 'admin' || activeRole === 'global_admin';

  const condoDocs = documents.filter((d) => d.condominiumId === activeCondominium.id);

  const categories = [
    { key: 'all', label: 'Todos os Documentos' },
    { key: 'convention', label: 'Convenção & Regimento' },
    { key: 'minutes', label: 'Atas de Assembleia' },
    { key: 'financial_statements', label: 'Prestação de Contas' },
    { key: 'contracts', label: 'Contratos & Vistorias' },
    { key: 'official_notices', label: 'Editais & Notificações' },
  ];

  // URL-synchronized search, filter, and pagination
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedDocs,
    searchQuery: search,
    activeFilter: selectedCategory,
    setPage,
    setSearch,
    setFilter: setSelectedCategory,
    setItemsPerPage,
  } = useUrlPagination<CondoDocument>({
    items: condoDocs,
    filterFn: (doc, searchQuery, category) => {
      const matchesSearch =
        !searchQuery ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.excerptSnippet ? doc.excerptSnippet.toLowerCase().includes(searchQuery.toLowerCase()) : false);
      const matchesCategory = category === 'all' || doc.category === category;
      return matchesSearch && matchesCategory;
    },
    defaultItemsPerPage: 6,
    pageParamKey: 'page',
    searchParamKey: 'q',
    filterParamKey: 'categoria',
    defaultFilter: 'all',
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addDocument({
      condominiumId: activeCondominium.id,
      title: newTitle,
      category: newCategory as any,
      categoryLabel: newCategory === 'convention' ? 'Convenção' : 'Documento Oficial',
      fileName: `${newTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: '2.4 MB',
      fileType: 'pdf',
      uploadedBy: currentUser.name,
      isGoogleDriveSynced: true,
      downloadUrl: '#',
      excerptSnippet: newDescription,
    });

    setNewTitle('');
    setNewDescription('');
    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Title & Info Help Button (?) */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Repositório Digital</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Documentos Oficiais & Google Drive
          </h1>
          <InfoHelpButton
            title="Repositório de Documentos Oficiais"
            description="Consulte convenções, regimentos internos, atas de assembleias registradas e balancetes contábeis com sincronização automática do Google Drive."
            tips={[
              'Use a busca por palavras-chave para encontrar trechos específicos dentro das atas ou do regimento.',
              'Utilize o Assistente IA para perguntas em linguagem natural sobre regras e convenções.',
              'Todos os arquivos PDF possuem hash de integridade e download autenticado.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-700 to-slate-800 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Repositório Oficial de Documentos e Atas
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Consulte convenções, regimento interno, balancetes ou faça o upload de novos arquivos.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            className="bg-white/15 text-white hover:bg-white/25 border border-white/20 font-bold shadow-sm justify-center whitespace-nowrap"
            leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
            onClick={() => setIsAiSearchOpen(true)}
          >
            Consultar via IA
          </Button>

          {isTrusteeOrAdmin && (
            <Button
              variant="secondary"
              size="md"
              className="bg-white text-blue-700 hover:bg-blue-50 border-0 font-bold shadow-sm whitespace-nowrap justify-center"
              leftIcon={<Upload className="w-4 h-4 text-blue-700" />}
              rightIcon={<ArrowRight className="w-4 h-4 text-blue-700 hidden sm:inline" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Novo Documento
            </Button>
          )}
        </div>
      </div>

      {/* Google Drive Integration Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-blue-600 shrink-0">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Sincronização Google Drive Ativa
              </h3>
              <Badge variant="success" size="sm" dot>
                Conectado
              </Badge>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Pasta vinculada: <span className="font-mono font-medium">/{activeCondominium.name}/Documentos_Oficiais/</span>
            </p>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          Última sincronização: hoje às 08:30
        </span>
      </div>

      {/* Search & Category Dropdown Filter Side by Side */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por título de ata, convenção, balancete ou palavra-chave..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[220px] sm:w-64 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            {categories.map((cat) => {
              const count = cat.key === 'all'
                ? condoDocs.length
                : condoDocs.filter((d) => d.category === cat.key).length;
              return (
                <option key={cat.key} value={cat.key}>
                  {cat.label} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Documents Grid */}
      {paginatedDocs.length > 0 ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDocs.map((doc) => (
              <Card key={doc.id} className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral" size="sm">
                      {doc.fileSize}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                    {doc.title}
                  </h4>
                  {doc.excerptSnippet && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {doc.excerptSnippet}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {doc.uploadedAt}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        showToast(
                          'success',
                          'Download Iniciado',
                          `Arquivo "${doc.title}.pdf" baixado com sucesso.`
                        )
                      }
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[6, 9, 15]}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhum documento encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos documentos com os filtros aplicados. Tente buscar por outros termos ou limpar a categoria.
          </p>
          {(search || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {/* PDF Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="truncate">{previewDoc.title}</span>
            </div>
          }
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-500">
              <span>Tamanho: {previewDoc.fileSize} • Tipo: PDF</span>
              <span>Enviado por: {previewDoc.uploadedBy}</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-8 bg-slate-100/50 dark:bg-slate-800/30 text-center space-y-4">
              <FileText className="w-16 h-16 text-blue-500 mx-auto opacity-70" />
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visualizador PDF Integrado
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Exibindo o documento oficial assinado digitalmente vinculado à pasta do Google Drive.
                </p>
              </div>

              {previewDoc.excerptSnippet && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-300 font-mono">
                  {previewDoc.excerptSnippet}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setPreviewDoc(null)}>
                Fechar
              </Button>
              <Button
                variant="primary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => {
                  showToast(
                    'success',
                    'Download Concluído',
                    `Arquivo "${previewDoc.title}.pdf" salvo no seu dispositivo.`
                  );
                  setPreviewDoc(null);
                }}
              >
                Baixar Arquivo PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Enviar Novo Documento Oficial"
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Documento *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Ata da AGO Ordinária de Outubro 2026"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Categoria *
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="convention">Convenção & Regimento</option>
              <option value="minutes">Ata de Assembleia</option>
              <option value="financial_statements">Prestação de Contas</option>
              <option value="contracts">Contrato / Vistoria</option>
              <option value="official_notices">Edital / Notificação</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resumo / Trecho Chave (Indexação IA)
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descreva os tópicos principais ou artigos para facilitar a busca..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center space-y-1">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Arraste o arquivo PDF ou clique para selecionar
            </p>
            <p className="text-[10px] text-slate-400">PDF de até 25MB com OCR habilitado</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Publicar e Sincronizar Google Drive
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

