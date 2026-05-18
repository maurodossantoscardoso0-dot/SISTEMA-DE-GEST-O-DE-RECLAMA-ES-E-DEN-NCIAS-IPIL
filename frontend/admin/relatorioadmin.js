// relatoriosadmin.js - Script da página de Relatórios e Estatísticas
// Versão com PDF em A4 e Excel em Português de Portugal

let denunciasData = [];
let reclamacoesData = [];
let usuariosData = [];
let lineChart = null;
let pieChart = null;

// ============================================
// VERIFICAR ADMIN
// ============================================
function verificarAdmin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '../login.html';
        return null;
    }
    const usuario = JSON.parse(usuarioLogado);
    if (usuario.tipo !== 'admin') {
        showModal('error', 'Acesso Negado', '⛔ Apenas administradores podem acessar esta página.');
        setTimeout(() => {
            window.location.href = '../usuario/dashboard.html';
        }, 2000);
        return null;
    }
    return usuario;
}

// ============================================
// MODAL PERSONALIZADO
// ============================================
function showModal(type, title, message, onConfirm = null) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const config = {
        success: { icon: 'fa-check-circle', iconColor: 'text-green-500', bgGradient: 'from-green-500 to-green-600', buttonColor: 'bg-green-500 hover:bg-green-600' },
        error: { icon: 'fa-exclamation-circle', iconColor: 'text-red-500', bgGradient: 'from-red-500 to-red-600', buttonColor: 'bg-red-500 hover:bg-red-600' },
        info: { icon: 'fa-info-circle', iconColor: 'text-blue-500', bgGradient: 'from-blue-500 to-blue-600', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
        warning: { icon: 'fa-exclamation-triangle', iconColor: 'text-yellow-500', bgGradient: 'from-yellow-500 to-yellow-600', buttonColor: 'bg-yellow-500 hover:bg-yellow-600' },
        confirm: { icon: 'fa-question-circle', iconColor: 'text-orange-500', bgGradient: 'from-orange-500 to-orange-600', buttonColor: 'bg-orange-500 hover:bg-orange-600' }
    };
    
    const current = config[type] || config.info;
    
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    if (!document.getElementById('modalStyles')) {
        const style = document.createElement('style');
        style.id = 'modalStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            .modal-content { animation: slideIn 0.3s ease; }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div class="bg-gradient-to-r ${current.bgGradient} px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas ${current.icon} ${current.iconColor} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                </div>
            </div>
            <div class="px-6 py-6">
                <p class="text-gray-600 text-base whitespace-pre-line">${message}</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end">
                <button id="modalCloseBtn" class="px-6 py-2 ${current.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                    <i class="fas fa-check mr-2"></i>OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onConfirm) onConfirm();
    };
    
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// TOAST DE NOTIFICAÇÃO
// ============================================
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    toast.style.animation = 'slideInRight 0.3s ease';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ============================================
// FORMATAR DATA EM PORTUGUÊS DE PORTUGAL
// ============================================
function formatarDataPortugal(data) {
    if (!data) return 'Data não informada';
    try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const ano = date.getFullYear();
        const horas = date.getHours().toString().padStart(2, '0');
        const minutos = date.getMinutes().toString().padStart(2, '0');
        const segundos = date.getSeconds().toString().padStart(2, '0');
        
        return `${dia}/${mes}/${ano} às ${horas}:${minutos}:${segundos}`;
    } catch (error) {
        return 'Data inválida';
    }
}

// ============================================
// BUSCAR DADOS DA API
// ============================================
async function buscarDenuncias() {
    try {
        const response = await fetch('http://localhost:3000/api/denuncias');
        const data = await response.json();
        denunciasData = Array.isArray(data) ? data : [];
        console.log('✅ Denúncias carregadas:', denunciasData.length);
        return denunciasData;
    } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        return [];
    }
}

async function buscarReclamacoes() {
    try {
        const response = await fetch('http://localhost:3000/api/reclamacoes');
        const data = await response.json();
        reclamacoesData = Array.isArray(data) ? data : [];
        console.log('✅ Reclamações carregadas:', reclamacoesData.length);
        return reclamacoesData;
    } catch (error) {
        console.error('Erro ao buscar reclamações:', error);
        return [];
    }
}

async function buscarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        const data = await response.json();
        usuariosData = Array.isArray(data) ? data : [];
        console.log('✅ Usuários carregados:', usuariosData.length);
        return usuariosData;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

// ============================================
// DISTRIBUIÇÃO POR CATEGORIA (Denúncias + Reclamações)
// ============================================
function calcularDistribuicaoCategorias() {
    const categorias = {
        infraestrutura: { nome: 'Infraestrutura', cor: 'bg-purple-500', corGrafico: 'rgba(147, 51, 234, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        saude: { nome: 'Saúde', cor: 'bg-yellow-500', corGrafico: 'rgba(234, 179, 8, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        educacao: { nome: 'Educação', cor: 'bg-indigo-500', corGrafico: 'rgba(99, 102, 241, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        'meio-ambiente': { nome: 'Meio Ambiente', cor: 'bg-green-500', corGrafico: 'rgba(34, 197, 94, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        seguranca: { nome: 'Segurança', cor: 'bg-red-500', corGrafico: 'rgba(239, 68, 68, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        saneamento: { nome: 'Saneamento', cor: 'bg-blue-500', corGrafico: 'rgba(59, 130, 246, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        outro: { nome: 'Outro', cor: 'bg-gray-500', corGrafico: 'rgba(107, 114, 128, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 }
    };
    
    denunciasData.forEach(denuncia => {
        const tipo = denuncia.tipo || 'outro';
        if (categorias[tipo]) {
            categorias[tipo].denuncias++;
            categorias[tipo].total++;
        }
    });
    
    reclamacoesData.forEach(reclamacao => {
        const categoria = reclamacao.categoria || 'outro';
        if (categorias[categoria]) {
            categorias[categoria].reclamacoes++;
            categorias[categoria].total++;
        }
    });
    
    const totalGeral = denunciasData.length + reclamacoesData.length;
    Object.keys(categorias).forEach(key => {
        categorias[key].percentual = totalGeral > 0 ? ((categorias[key].total / totalGeral) * 100).toFixed(1) : 0;
    });
    
    return { categorias, totalGeral };
}

// ============================================
// FUNÇÃO PARA GERAR PDF EM FORMATO A4
// ============================================
async function gerarPDF() {
    try {
        showToast('info', 'A gerar PDF...');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { categorias, totalGeral } = calcularDistribuicaoCategorias();
        const dataAtual = formatarDataPortugal(new Date());
        
        // Criar HTML para PDF em formato A4
        const pdfHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Distribuição por Categoria - IPIL</title>
                <style>
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #333;
                        line-height: 1.5;
                    }
                    
                    .container {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #f97316;
                    }
                    
                    .logo {
                        background: linear-gradient(135deg, #f97316, #ea580c);
                        color: white;
                        font-size: 28px;
                        font-weight: bold;
                        padding: 10px 25px;
                        display: inline-block;
                        border-radius: 12px;
                        margin-bottom: 15px;
                    }
                    
                    .title {
                        font-size: 24px;
                        color: #f97316;
                        margin: 10px 0;
                    }
                    
                    .subtitle {
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    
                    .date-info {
                        background: #f3f4f6;
                        padding: 12px;
                        border-radius: 8px;
                        margin: 20px 0;
                        text-align: center;
                        font-size: 12px;
                        color: #555;
                    }
                    
                    .summary {
                        background: linear-gradient(135deg, #fff7ed, #ffedd5);
                        padding: 15px;
                        border-radius: 10px;
                        margin: 20px 0;
                        border-left: 4px solid #f97316;
                    }
                    
                    .summary h3 {
                        color: #f97316;
                        margin: 0 0 10px 0;
                        font-size: 16px;
                    }
                    
                    .summary-stats {
                        display: flex;
                        justify-content: space-around;
                        flex-wrap: wrap;
                        gap: 15px;
                    }
                    
                    .stat-item {
                        text-align: center;
                        padding: 10px;
                        background: white;
                        border-radius: 8px;
                        min-width: 120px;
                    }
                    
                    .stat-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #f97316;
                    }
                    
                    .stat-label {
                        font-size: 12px;
                        color: #666;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 13px;
                    }
                    
                    th {
                        background: linear-gradient(135deg, #f97316, #ea580c);
                        color: white;
                        padding: 12px;
                        text-align: center;
                        font-weight: 600;
                    }
                    
                    td {
                        padding: 10px;
                        text-align: center;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    
                    td:first-child {
                        text-align: left;
                        font-weight: 500;
                    }
                    
                    tr:hover {
                        background-color: #fef3c7;
                    }
                    
                    .total-row {
                        background: #f3f4f6;
                        font-weight: bold;
                        border-top: 2px solid #f97316;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 10px;
                        color: #999;
                    }
                    
                    .category-badge {
                        display: inline-block;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }
                    
                    .progress-bar {
                        width: 100px;
                        background: #e5e7eb;
                        border-radius: 10px;
                        overflow: hidden;
                        display: inline-block;
                    }
                    
                    .progress-fill {
                        height: 8px;
                        border-radius: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">IPIL</div>
                        <h1 class="title">Instituto Politécnico Industrial de Luanda</h1>
                        <p class="subtitle">Sistema de Gestão de Denúncias e Reclamações</p>
                        <div class="date-info">
                            📅 Relatório gerado em: ${dataAtual}
                        </div>
                    </div>
                    
                    <div class="summary">
                        <h3>📊 Resumo Geral</h3>
                        <div class="summary-stats">
                            <div class="stat-item">
                                <div class="stat-number">${denunciasData.length}</div>
                                <div class="stat-label">Total de Denúncias</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${reclamacoesData.length}</div>
                                <div class="stat-label">Total de Reclamações</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${totalGeral}</div>
                                <div class="stat-label">Total Geral</div>
                            </div>
                        </div>
                    </div>
                    
                    <h3 style="color: #f97316; margin: 20px 0 10px 0;">📋 Distribuição por Categoria</h3>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th>Denúncias</th>
                                <th>Reclamações</th>
                                <th>Total</th>
                                <th>Percentual</th>
                                <th>Progresso</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Adicionar linhas da tabela
        Object.values(categorias).forEach(cat => {
            if (cat.total > 0) {
                pdfHtml += `
                    <tr>
                        <td>
                            <span class="category-badge" style="background-color: ${cat.corGrafico}"></span>
                            ${cat.nome}
                        </td>
                        <td>${cat.denuncias}</td>
                        <td>${cat.reclamacoes}</td>
                        <td><strong>${cat.total}</strong></td>
                        <td>${cat.percentual}%</td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${cat.percentual}%; background-color: ${cat.corGrafico}"></div>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
        
        pdfHtml += `
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td><strong>TOTAL</strong></td>
                                <td><strong>${denunciasData.length}</strong></td>
                                <td><strong>${reclamacoesData.length}</strong></td>
                                <td><strong>${totalGeral}</strong></td>
                                <td><strong>100%</strong></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="footer">
                        <p>© 2026 Instituto Politécnico Industrial de Luanda - IPIL</p>
                        <p>Sistema de Gestão de Denúncias e Reclamações</p>
                        <p>Este é um documento oficial gerado automaticamente pelo sistema.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Abrir janela para impressão/PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfHtml);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.print();
            showToast('success', 'PDF gerado com sucesso!');
        };
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('error', 'Erro ao gerar PDF');
    }
}

// ============================================
// FUNÇÃO PARA GERAR EXCEL (XLSX) EM PORTUGUÊS
// ============================================
function gerarExcel() {
    try {
        showToast('info', 'A gerar Excel...');
        
        const { categorias, totalGeral } = calcularDistribuicaoCategorias();
        const dataAtual = formatarDataPortugal(new Date());
        
        // Preparar dados para Excel
        const dadosExcel = [
            ['IPIL - Instituto Politécnico Industrial de Luanda'],
            ['Sistema de Gestão de Denúncias e Reclamações'],
            [''],
            ['RELATÓRIO DE DISTRIBUIÇÃO POR CATEGORIA'],
            [''],
            [`Gerado em: ${dataAtual}`],
            [''],
            ['RESUMO GERAL'],
            ['Total de Denúncias', denunciasData.length],
            ['Total de Reclamações', reclamacoesData.length],
            ['Total Geral', totalGeral],
            [''],
            ['DISTRIBUIÇÃO POR CATEGORIA'],
            ['Categoria', 'Denúncias', 'Reclamações', 'Total', 'Percentual (%)']
        ];
        
        // Adicionar categorias
        Object.values(categorias).forEach(cat => {
            if (cat.total > 0) {
                dadosExcel.push([cat.nome, cat.denuncias, cat.reclamacoes, cat.total, cat.percentual]);
            }
        });
        
        // Adicionar total
        dadosExcel.push(['TOTAL', denunciasData.length, reclamacoesData.length, totalGeral, '100']);
        dadosExcel.push(['']);
        dadosExcel.push(['Notas:']);
        dadosExcel.push(['- Este relatório inclui todas as denúncias e reclamações registadas no sistema.']);
        dadosExcel.push(['- Os percentuais são calculados com base no total geral.']);
        dadosExcel.push(['']);
        dadosExcel.push(['Documento gerado automaticamente pelo sistema IPIL.']);
        dadosExcel.push([`Data de geração: ${dataAtual}`]);
        
        // Criar conteúdo CSV com separador ponto e vírgula (melhor para Excel PT)
        const conteudoCSV = dadosExcel.map(row => 
            row.map(cell => {
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes(';') || cell.includes('\n'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(';')
        ).join('\n');
        
        // Adicionar BOM para UTF-8 com caracteres portugueses
        const blob = new Blob(['\uFEFF' + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const dataHoje = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_categorias_${dataHoje}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('success', 'Excel gerado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        showToast('error', 'Erro ao gerar Excel');
    }
}

// ============================================
// FUNÇÃO PARA GERAR EXCEL XLSX (alternativa mais completa)
// ============================================
function gerarExcelXLSX() {
    try {
        showToast('info', 'A gerar Excel (XLSX)...');
        
        const { categorias, totalGeral } = calcularDistribuicaoCategorias();
        const dataAtual = formatarDataPortugal(new Date());
        
        // Criar HTML para Excel (funciona como XLSX)
        const excelHtml = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório_IPIL</title>
                <style>
                    th { background-color: #f97316; color: white; }
                    td, th { border: 1px solid #ddd; padding: 8px; }
                    .total { background-color: #f3f4f6; font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>IPIL - Instituto Politécnico Industrial de Luanda</h2>
                <h3>Sistema de Gestão de Denúncias e Reclamações</h3>
                <h4>Relatório de Distribuição por Categoria</h4>
                <p><strong>Gerado em:</strong> ${dataAtual}</p>
                
                <h3>Resumo Geral</h3>
                <table>
                    <tr><th>Indicador</th><th>Quantidade</th></tr>
                    <tr><td>Total de Denúncias</td><td>${denunciasData.length}</td></tr>
                    <tr><td>Total de Reclamações</td><td>${reclamacoesData.length}</td></tr>
                    <tr class="total"><td>Total Geral</td><td>${totalGeral}</td></tr>
                </table>
                
                <h3>Distribuição por Categoria</h3>
                <table>
                    <thead>
                        <tr><th>Categoria</th><th>Denúncias</th><th>Reclamações</th><th>Total</th><th>Percentual</th></tr>
                    </thead>
                    <tbody>
        `;
        
        Object.values(categorias).forEach(cat => {
            if (cat.total > 0) {
                excelHtml += `
                    <tr>
                        <td>${cat.nome}</td>
                        <td>${cat.denuncias}</td>
                        <td>${cat.reclamacoes}</td>
                        <td><strong>${cat.total}</strong></td>
                        <td>${cat.percentual}%</td>
                    </tr>
                `;
            }
        });
        
        excelHtml += `
                    </tbody>
                    <tfoot>
                        <tr class="total">
                            <td><strong>TOTAL</strong></td>
                            <td><strong>${denunciasData.length}</strong></td>
                            <td><strong>${reclamacoesData.length}</strong></td>
                            <td><strong>${totalGeral}</strong></td>
                            <td><strong>100%</strong></td>
                        </tr>
                    </tfoot>
                </table>
                
                <p><em>Documento gerado automaticamente pelo sistema IPIL em ${dataAtual}</em></p>
                <p>© 2026 Instituto Politécnico Industrial de Luanda</p>
            </body>
            </html>
        `;
        
        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const dataHoje = new Date().toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_categorias_${dataHoje}.xls`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('success', 'Excel gerado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        showToast('error', 'Erro ao gerar Excel');
    }
}

// ============================================
// ATUALIZAR CARDS DE ESTATÍSTICAS
// ============================================
function atualizarCardsEstatisticas() {
    const statsDenuncias = {
        total: denunciasData.length,
        pendente: denunciasData.filter(d => d.status === 'pendente').length,
        em_andamento: denunciasData.filter(d => d.status === 'em_andamento').length,
        concluida: denunciasData.filter(d => d.status === 'concluida').length,
        arquivada: denunciasData.filter(d => d.status === 'arquivada').length
    };
    
    const statsReclamacoes = {
        total: reclamacoesData.length,
        aberta: reclamacoesData.filter(r => r.status === 'aberta').length,
        em_andamento: reclamacoesData.filter(r => r.status === 'em_andamento').length,
        resolvida: reclamacoesData.filter(r => r.status === 'resolvida').length,
        fechada: reclamacoesData.filter(r => r.status === 'fechada').length
    };
    
    const totalGeral = statsDenuncias.total + statsReclamacoes.total;
    const totalResolvidas = statsDenuncias.concluida + statsReclamacoes.resolvida;
    const taxaResolucao = totalGeral > 0 ? ((totalResolvidas / totalGeral) * 100).toFixed(1) : 0;
    
    let tempoMedioDias = 0;
    const denunciasConcluidas = denunciasData.filter(d => d.status === 'concluida' && d.createdAt && d.updatedAt);
    if (denunciasConcluidas.length > 0) {
        const totalDias = denunciasConcluidas.reduce((acc, d) => {
            const criacao = new Date(d.createdAt);
            const atualizacao = new Date(d.updatedAt);
            const diffDias = Math.ceil((atualizacao - criacao) / (1000 * 60 * 60 * 24));
            return acc + diffDias;
        }, 0);
        tempoMedioDias = Math.ceil(totalDias / denunciasConcluidas.length);
    }
    
    const cardsHtml = `
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Total de Registos</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${totalGeral}</h3>
                    <p class="text-xs text-green-600 mt-2">
                        <i class="fas fa-chart-line mr-1"></i>
                        Denúncias: ${statsDenuncias.total} | Reclamações: ${statsReclamacoes.total}
                    </p>
                </div>
                <div class="bg-orange-100 p-3 rounded-lg">
                    <i class="fas fa-clipboard-list text-orange-600 text-2xl"></i>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Taxa de Resolução</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${taxaResolucao}%</h3>
                    <p class="text-xs text-green-600 mt-2">
                        <i class="fas fa-check-circle mr-1"></i>
                        ${totalResolvidas} de ${totalGeral} resolvidas
                    </p>
                </div>
                <div class="bg-green-100 p-3 rounded-lg">
                    <i class="fas fa-percent text-green-600 text-2xl"></i>
                </div>
            </div>
            <div class="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                <div class="bg-green-500 h-1.5 rounded-full" style="width: ${taxaResolucao}%"></div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Tempo Médio</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${tempoMedioDias || 0} dias</h3>
                    <p class="text-xs text-blue-600 mt-2">
                        <i class="fas fa-clock mr-1"></i>
                        Tempo médio de resolução
                    </p>
                </div>
                <div class="bg-blue-100 p-3 rounded-lg">
                    <i class="fas fa-hourglass-half text-blue-600 text-2xl"></i>
                </div>
            </div>
            <div class="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${Math.min((tempoMedioDias / 30) * 100, 100)}%"></div>
            </div>
        </div>
    `;
    
    const cardsContainer = document.getElementById('cardsEstatisticas');
    if (cardsContainer) cardsContainer.innerHTML = cardsHtml;
}

// ============================================
// ATUALIZAR TABELA DE DISTRIBUIÇÃO
// ============================================
function atualizarTabelaDistribuicao() {
    const { categorias, totalGeral } = calcularDistribuicaoCategorias();
    const tbody = document.getElementById('tabelaCategoriasBody');
    
    if (tbody) {
        let html = '';
        const categoriasAtivas = Object.values(categorias).filter(cat => cat.total > 0);
        
        categoriasAtivas.forEach(cat => {
            html += `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="w-3 h-3 ${cat.cor} rounded-full mr-2"></span>
                            <span class="text-sm font-medium text-gray-900">${cat.nome}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">${cat.denuncias}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">${cat.reclamacoes}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">${cat.total}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">${cat.percentual}%</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div class="${cat.cor} h-2 rounded-full" style="width: ${cat.percentual}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
            <tr class="bg-gray-100 font-semibold">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL<\/td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${denunciasData.length}<\/td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${reclamacoesData.length}<\/td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${totalGeral}<\/td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">100%<\/td>
                <td class="px-6 py-4 whitespace-nowrap"><\/td>
            </tr>
        `;
        
        tbody.innerHTML = html;
    }
}

// ============================================
// ATUALIZAR GRÁFICO DE PIZZA
// ============================================
function atualizarGraficoPizza() {
    const { categorias } = calcularDistribuicaoCategorias();
    
    const labels = [];
    const dados = [];
    const cores = [];
    
    Object.values(categorias).forEach(cat => {
        if (cat.total > 0) {
            labels.push(cat.nome);
            dados.push(cat.total);
            cores.push(cat.corGrafico);
        }
    });
    
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChart) pieChart.destroy();
    
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores,
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1F2937',
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Atualizar legenda
    atualizarLegendaPizza();
}

// ============================================
// ATUALIZAR LEGENDA DO GRÁFICO PIZZA
// ============================================
function atualizarLegendaPizza() {
    const { categorias } = calcularDistribuicaoCategorias();
    const legendaContainer = document.getElementById('pieLegend');
    
    if (legendaContainer) {
        let html = '';
        const categoriasAtivas = Object.values(categorias).filter(cat => cat.total > 0);
        
        categoriasAtivas.forEach(cat => {
            html += `
                <div class="flex items-center">
                    <span class="w-3 h-3 ${cat.cor} rounded-full mr-2"></span>
                    <span class="text-xs text-gray-600">${cat.nome}: <span class="font-medium">${cat.total} (${cat.percentual}%)</span></span>
                </div>
            `;
        });
        
        legendaContainer.innerHTML = html;
    }
}

// ============================================
// ATUALIZAR GRÁFICO DE LINHA
// ============================================
function atualizarGraficoLinha() {
    const statsDenuncias = {
        pendente: denunciasData.filter(d => d.status === 'pendente').length,
        em_andamento: denunciasData.filter(d => d.status === 'em_andamento').length,
        concluida: denunciasData.filter(d => d.status === 'concluida').length,
        arquivada: denunciasData.filter(d => d.status === 'arquivada').length
    };
    
    const statsReclamacoes = {
        aberta: reclamacoesData.filter(r => r.status === 'aberta').length,
        em_andamento: reclamacoesData.filter(r => r.status === 'em_andamento').length,
        resolvida: reclamacoesData.filter(r => r.status === 'resolvida').length,
        fechada: reclamacoesData.filter(r => r.status === 'fechada').length
    };
    
    const ctx = document.getElementById('lineChart').getContext('2d');
    
    if (lineChart) lineChart.destroy();
    
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Pendente/Aberta', 'Em Andamento', 'Concluída/Resolvida', 'Arquivada/Fechada'],
            datasets: [
                {
                    label: 'Denúncias',
                    data: [statsDenuncias.pendente, statsDenuncias.em_andamento, statsDenuncias.concluida, statsDenuncias.arquivada],
                    borderColor: 'rgba(249, 115, 22, 1)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(249, 115, 22, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                    fill: true
                },
                {
                    label: 'Reclamações',
                    data: [statsReclamacoes.aberta, statsReclamacoes.em_andamento, statsReclamacoes.resolvida, statsReclamacoes.fechada],
                    borderColor: 'rgba(234, 179, 8, 1)',
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(234, 179, 8, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    backgroundColor: '#1F2937',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, precision: 0 },
                    title: { display: true, text: 'Quantidade', color: '#6B7280' }
                },
                x: {
                    title: { display: true, text: 'Status', color: '#6B7280' }
                }
            }
        }
    });
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
async function carregarRelatorios() {
    try {
        console.log('🔄 A carregar dados...');
        
        await Promise.all([
            buscarDenuncias(),
            buscarReclamacoes(),
            buscarUsuarios()
        ]);
        
        atualizarCardsEstatisticas();
        atualizarTabelaDistribuicao();
        atualizarGraficoPizza();
        atualizarGraficoLinha();
        
        console.log('✅ Relatórios atualizados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error);
        showToast('error', 'Erro ao carregar relatórios');
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    const existingModal = document.getElementById('logoutConfirmModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    if (!document.getElementById('logoutStyles')) {
        const style = document.createElement('style');
        style.id = 'logoutStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            .modal-slide-in { animation: slideIn 0.3s ease; }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden modal-slide-in">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-sign-out-alt text-orange-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Sair do Sistema</h3>
                </div>
            </div>
            <div class="px-6 py-6 text-center">
                <i class="fas fa-question-circle text-orange-500 text-5xl mb-4"></i>
                <p class="text-gray-700 text-base mb-2">Tem certeza que deseja sair?</p>
                
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button id="logoutCancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button id="logoutConfirmBtn" class="px-5 py-2 bg-orange-500 text-white rounded-lg transition transform hover:scale-105 font-medium shadow-md">
                    <i class="fas fa-check mr-2"></i>Sair
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };
    
    document.getElementById('logoutConfirmBtn')?.addEventListener('click', () => {
        closeModal();
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('token');
        window.location.href = '../login.html';
    });
    
    document.getElementById('logoutCancelBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
async function init() {
    const admin = verificarAdmin();
    if (!admin) return;
    
    const pdfBtn = document.getElementById('gerarPDFBtn');
    const excelBtn = document.getElementById('gerarExcelBtn');
    
    if (pdfBtn) pdfBtn.addEventListener('click', (e) => { e.preventDefault(); gerarPDF(); });
    if (excelBtn) excelBtn.addEventListener('click', (e) => { e.preventDefault(); gerarExcel(); });
    
    await carregarRelatorios();
}

document.addEventListener('DOMContentLoaded', init);

// Exportar funções globais
window.gerarPDF = gerarPDF;
window.gerarExcel = gerarExcel;
window.logout = logout;